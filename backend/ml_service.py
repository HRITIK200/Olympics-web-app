import numpy as np
import pandas as pd
from sqlalchemy import text
from sklearn.ensemble import RandomForestRegressor
from database import SessionLocal

HOST_MAP = {
    1896: "greece",
    1900: "france",
    1904: "usa",
    1906: "greece",
    1908: "uk",
    1912: "sweden",
    1920: "belgium",
    1924: "france",
    1928: "netherlands",
    1932: "usa",
    1936: "germany",
    1948: "uk",
    1952: "finland",
    1956: "australia",
    1960: "italy",
    1964: "japan",
    1968: "mexico",
    1972: "germany",
    1976: "canada",
    1980: "russia",
    1984: "usa",
    1988: "south korea",
    1992: "spain",
    1996: "usa",
    2000: "australia",
    2004: "greece",
    2008: "china",
    2012: "uk",
    2016: "brazil",
    2020: "japan",
    2024: "france",
    2028: "usa",
    2032: "australia"
}

class MLService:
    def __init__(self):
        self.models = {}
        self.r2_scores = {}
        self.last_results = {}
        self.train_predictor()

    def train_predictor(self):
        db = SessionLocal()
        try:
            # 1. Fetch historical medal tallies grouped by region and year
            # We deduplicate rows by event matching fetch_medal_tally logic
            distinct_sql = """
                SELECT DISTINCT team, noc, games, year, city, sport, event, medal, gold, silver, bronze
                FROM athlete_events
            """
            
            medals_sql = f"""
                WITH de AS ({distinct_sql})
                SELECT nr.region as country, de.year as year, 
                       SUM(de.gold) as gold, SUM(de.silver) as silver, SUM(de.bronze) as bronze
                FROM de
                JOIN noc_regions nr ON de.noc = nr.noc
                GROUP BY nr.region, de.year
            """
            medals_df = pd.read_sql_query(medals_sql, con=db.bind)
            medals_df.dropna(subset=['country'], inplace=True)
            medals_df['total'] = medals_df['gold'] + medals_df['silver'] + medals_df['bronze']
            
            # 2. Fetch athlete count per region and year
            athletes_sql = """
                SELECT nr.region as country, ae.year as year, COUNT(DISTINCT ae.name) as athletes
                FROM athlete_events ae
                JOIN noc_regions nr ON ae.noc = nr.noc
                GROUP BY nr.region, ae.year
            """
            athletes_df = pd.read_sql_query(athletes_sql, con=db.bind)
            athletes_df.dropna(subset=['country'], inplace=True)
            
            # Merge datasets
            data_df = pd.merge(medals_df, athletes_df, on=['country', 'year'], how='outer').fillna(0)
            
            # Cache the latest year (2024) performance to construct future inputs
            latest_year = int(data_df['year'].max())
            self.last_results = data_df[data_df['year'] == latest_year].set_index('country').to_dict(orient='index')
            
            # 3. Construct Training Features
            # For year Y, we use medal stats from previous edition Y-4, and current athlete count & host status at Y
            records = []
            countries = data_df['country'].unique()
            years = sorted(data_df['year'].unique())
            
            for country in countries:
                for idx, year in enumerate(years):
                    if idx == 0:
                        continue
                    prev_year = years[idx - 1]
                    
                    # Fetch current performance
                    curr_row = data_df[(data_df['country'] == country) & (data_df['year'] == year)]
                    if curr_row.empty:
                        continue
                        
                    # Fetch previous performance
                    prev_row = data_df[(data_df['country'] == country) & (data_df['year'] == prev_year)]
                    
                    prev_gold = float(prev_row['gold'].iloc[0]) if not prev_row.empty else 0.0
                    prev_silver = float(prev_row['silver'].iloc[0]) if not prev_row.empty else 0.0
                    prev_bronze = float(prev_row['bronze'].iloc[0]) if not prev_row.empty else 0.0
                    prev_total = float(prev_row['total'].iloc[0]) if not prev_row.empty else 0.0
                    
                    is_host = 1.0 if HOST_MAP.get(int(year), "").lower() == country.lower() else 0.0
                    athletes_sent = float(curr_row['athletes'].iloc[0])
                    
                    records.append({
                        "country": country,
                        "year": year,
                        "prev_gold": prev_gold,
                        "prev_silver": prev_silver,
                        "prev_bronze": prev_bronze,
                        "prev_total": prev_total,
                        "athletes": athletes_sent,
                        "is_host": is_host,
                        "gold": float(curr_row['gold'].iloc[0]),
                        "silver": float(curr_row['silver'].iloc[0]),
                        "bronze": float(curr_row['bronze'].iloc[0]),
                        "total": float(curr_row['total'].iloc[0])
                    })
                    
            train_df = pd.DataFrame(records)
            if train_df.empty:
                print("Warning: Training dataframe is empty!")
                return
                
            # Features and targets
            X = train_df[["prev_gold", "prev_silver", "prev_bronze", "prev_total", "athletes", "is_host"]]
            targets = ["gold", "silver", "bronze", "total"]
            
            # Fit models
            for target in targets:
                y = train_df[target]
                model = RandomForestRegressor(n_estimators=100, random_state=42)
                model.fit(X, y)
                self.models[target] = model
                
                # Estimate confidence score (R^2)
                score = model.score(X, y)
                self.r2_scores[target] = float(score)
                
            print(f"ML Predictor trained successfully. Models cached: R^2 Total = {self.r2_scores.get('total', 0):.2f}")
            
        except Exception as e:
            print(f"Error training ML model: {e}")
        finally:
            db.close()

    def predict(self, country: str, year: int = 2028, delegation: int = None):
        country_std = country.strip()
        country_lower = country_std.lower()
        
        # Check if country exists in our cache
        country_cache = None
        for key in self.last_results:
            if key.lower() == country_lower:
                country_cache = self.last_results[key]
                country_std = key
                break
                
        if not country_cache:
            return {
                "country": country,
                "year": year,
                "Gold": 0,
                "Silver": 0,
                "Bronze": 0,
                "total": 0,
                "confidence": 0,
                "error": "No historical data available for this country."
            }
            
        # Build features for prediction
        prev_gold = float(country_cache.get('gold', 0))
        prev_silver = float(country_cache.get('silver', 0))
        prev_bronze = float(country_cache.get('bronze', 0))
        prev_total = float(country_cache.get('total', 0))
        
        # Assume athletes count matches their 2024 delegation size or override
        athletes = float(delegation) if delegation is not None else float(country_cache.get('athletes', 10))
        
        # Determine host status based on HOST_MAP
        is_host = 1.0 if HOST_MAP.get(year, "").lower() == country_lower else 0.0
        
        features = np.array([[prev_gold, prev_silver, prev_bronze, prev_total, athletes, is_host]])
        
        # Make predictions
        pred_gold = max(0, int(round(self.models["gold"].predict(features)[0])))
        pred_silver = max(0, int(round(self.models["silver"].predict(features)[0])))
        pred_bronze = max(0, int(round(self.models["bronze"].predict(features)[0])))
        pred_total = max(0, int(round(self.models["total"].predict(features)[0])))
        
        # Re-align total if it doesn't match sum
        medal_sum = pred_gold + pred_silver + pred_bronze
        if abs(pred_total - medal_sum) > 2:
            pred_total = medal_sum
            
        # Confidence score (R-squared proxy of total medals model)
        confidence = self.r2_scores.get("total", 0.85)
        
        return {
            "country": country_std,
            "year": year,
            "Gold": pred_gold,
            "Silver": pred_silver,
            "Bronze": pred_bronze,
            "total": pred_total,
            "confidence": round(confidence * 100, 1),
            "features_used": {
                "prev_medals": int(prev_total),
                "athletes_estimate": int(athletes),
                "is_host": bool(is_host)
            }
        }
