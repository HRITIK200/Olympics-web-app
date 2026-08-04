import os
import pandas as pd
import numpy as np
from sqlalchemy import text, func
from database import engine, Base, SessionLocal
from models import AthleteEvent, NOCRegion

class DataService:
    def __init__(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(current_dir, "olympics.db")
        csv_path = os.path.join(current_dir, "athlete_events_till_2024.csv")
        noc_path = os.path.join(current_dir, "noc_regions.csv")
        
        # Initialize tables
        Base.metadata.create_all(bind=engine)
        
        db = SessionLocal()
        try:
            # Seed database if empty
            count = db.query(AthleteEvent).count()
            if count == 0:
                print("SQL Database is empty. Loading records from CSV...")
                import gc
                
                # Load regions
                region_df = pd.read_csv(noc_path)
                region_df.columns = [c.lower() for c in region_df.columns]
                region_df.to_sql('noc_regions', con=engine, if_exists='append', index=False)
                del region_df
                gc.collect()
                
                # Load athletes & events in chunks to minimize memory footprint (< 120MB RAM)
                chunk_size = 25000
                for chunk in pd.read_csv(csv_path, chunksize=chunk_size):
                    chunk = chunk[chunk['Season'] == 'Summer']
                    if chunk.empty:
                        continue
                    chunk.drop_duplicates(inplace=True)
                    
                    # Align column names to models
                    chunk.columns = [
                        'athlete_id' if c == 'ID' else c.lower() 
                        for c in chunk.columns
                    ]
                    
                    # Pre-calculate medal values
                    chunk['gold'] = (chunk['medal'] == 'Gold').astype(int)
                    chunk['silver'] = (chunk['medal'] == 'Silver').astype(int)
                    chunk['bronze'] = (chunk['medal'] == 'Bronze').astype(int)
                    
                    chunk.to_sql('athlete_events', con=engine, if_exists='append', index=False)
                    del chunk
                    gc.collect()
                print("Database populated successfully.")
            else:
                print(f"Database verified. Loaded: {count} event entries.")
        finally:
            db.close()

    def get_filters(self):
        db = SessionLocal()
        try:
            years = [r[0] for r in db.query(AthleteEvent.year).distinct().order_by(AthleteEvent.year).all() if r[0] is not None]
            years_str = ['overall'] + [str(y) for y in years]
            
            countries = [r[0] for r in db.query(NOCRegion.region).distinct().order_by(NOCRegion.region).all() if r[0] is not None]
            countries_str = ['overall'] + countries
            
            sports = [r[0] for r in db.query(AthleteEvent.sport).distinct().order_by(AthleteEvent.sport).all() if r[0] is not None]
            sports_str = ['overall'] + sports
            
            return {
                "years": years_str,
                "countries": countries_str,
                "sports": sports_str
            }
        finally:
            db.close()

    def fetch_medal_tally(self, year, country):
        db = SessionLocal()
        try:
            year_lower = str(year).strip().lower()
            country_lower = str(country).strip().lower()
            
            # Dedup records on primary attributes matching Streamlit behavior
            distinct_sql = """
                SELECT DISTINCT team, noc, games, year, city, sport, event, medal, gold, silver, bronze
                FROM athlete_events
            """
            
            if year_lower == 'overall' and country_lower == 'overall':
                sql = f"""
                    WITH de AS ({distinct_sql})
                    SELECT nr.region as region, SUM(de.gold) as Gold, SUM(de.silver) as Silver, SUM(de.bronze) as Bronze
                    FROM de
                    JOIN noc_regions nr ON de.noc = nr.noc
                    GROUP BY nr.region
                    ORDER BY Gold DESC, Silver DESC, Bronze DESC
                """
            elif year_lower == 'overall' and country_lower != 'overall':
                sql = f"""
                    WITH de AS ({distinct_sql})
                    SELECT de.year as region, SUM(de.gold) as Gold, SUM(de.silver) as Silver, SUM(de.bronze) as Bronze
                    FROM de
                    JOIN noc_regions nr ON de.noc = nr.noc
                    WHERE LOWER(nr.region) = :country
                    GROUP BY de.year
                    ORDER BY de.year ASC
                """
            elif year_lower != 'overall' and country_lower == 'overall':
                sql = f"""
                    WITH de AS ({distinct_sql})
                    SELECT nr.region as region, SUM(de.gold) as Gold, SUM(de.silver) as Silver, SUM(de.bronze) as Bronze
                    FROM de
                    JOIN noc_regions nr ON de.noc = nr.noc
                    WHERE de.year = :year
                    GROUP BY nr.region
                    ORDER BY Gold DESC, Silver DESC, Bronze DESC
                """
            else:
                sql = f"""
                    WITH de AS ({distinct_sql})
                    SELECT nr.region as region, SUM(de.gold) as Gold, SUM(de.silver) as Silver, SUM(de.bronze) as Bronze
                    FROM de
                    JOIN noc_regions nr ON de.noc = nr.noc
                    WHERE de.year = :year AND LOWER(nr.region) = :country
                    GROUP BY nr.region
                """
                
            result = db.execute(text(sql), {"year": int(year) if year_lower != 'overall' else 0, "country": country_lower})
            records = []
            for r in result:
                gold_val = int(r.Gold or 0)
                silver_val = int(r.Silver or 0)
                bronze_val = int(r.Bronze or 0)
                records.append({
                    "region": str(r.region),
                    "Gold": gold_val,
                    "Silver": silver_val,
                    "Bronze": bronze_val,
                    "total": gold_val + silver_val + bronze_val
                })
            return records
        finally:
            db.close()

    def get_overall_stats(self):
        db = SessionLocal()
        try:
            editions = db.query(AthleteEvent.year).distinct().count()
            cities = db.query(AthleteEvent.city).distinct().count()
            sports = db.query(AthleteEvent.sport).distinct().count()
            events = db.query(AthleteEvent.event).distinct().count()
            athletes = db.query(AthleteEvent.name).distinct().count()
            
            nations_sql = """
                SELECT COUNT(DISTINCT nr.region) 
                FROM athlete_events ae
                JOIN noc_regions nr ON ae.noc = nr.noc
            """
            nations = db.execute(text(nations_sql)).scalar()
            
            return {
                "editions": int(editions),
                "hosts": int(cities),
                "sports": int(sports),
                "events": int(events),
                "athletes": int(athletes),
                "nations": int(nations or 0)
            }
        finally:
            db.close()

    def get_overall_charts(self):
        db = SessionLocal()
        try:
            sql = """
                SELECT ae.year as Edition,
                       COUNT(DISTINCT nr.region) as Nations,
                       COUNT(DISTINCT ae.event) as Events,
                       COUNT(DISTINCT ae.name) as Athletes
                FROM athlete_events ae
                LEFT JOIN noc_regions nr ON ae.noc = nr.noc
                GROUP BY ae.year
                ORDER BY ae.year ASC
            """
            result = db.execute(text(sql))
            return [
                {
                    "Edition": int(r.Edition),
                    "Nations": int(r.Nations),
                    "Events": int(r.Events),
                    "Athletes": int(r.Athletes)
                } for r in result
            ]
        finally:
            db.close()

    def get_events_heatmap(self):
        db = SessionLocal()
        try:
            sql = """
                SELECT sport, year, COUNT(DISTINCT event) as event_count
                FROM athlete_events
                GROUP BY sport, year
            """
            result = db.execute(text(sql))
            
            sports_years = {}
            all_years = set()
            for r in result:
                sport = str(r.sport)
                year = str(r.year)
                count = int(r.event_count)
                all_years.add(year)
                
                if sport not in sports_years:
                    sports_years[sport] = {}
                sports_years[sport][year] = count
                
            sorted_years = sorted(list(all_years))
            
            records = []
            for sport, year_counts in sports_years.items():
                row = {"sport": sport}
                for y in sorted_years:
                    row[y] = year_counts.get(y, 0)
                records.append(row)
                
            records = sorted(records, key=lambda x: x["sport"])
            
            return {
                "years": sorted_years,
                "sports": sorted(list(sports_years.keys())),
                "data": records
            }
        finally:
            db.close()

    def most_successful(self, sport):
        db = SessionLocal()
        try:
            sport_filter = ""
            params = {}
            if sport.lower() != 'overall':
                sport_filter = "AND LOWER(sport) = :sport"
                params["sport"] = sport.lower()
                
            top_names_sql = f"""
                SELECT name, COUNT(medal) as Medals
                FROM athlete_events
                WHERE medal IS NOT NULL {sport_filter}
                GROUP BY name
                ORDER BY Medals DESC
                LIMIT 15
            """
            top_names = db.execute(text(top_names_sql), params).fetchall()
            
            records = []
            for item in top_names:
                name = item.name
                medals_count = int(item.Medals)
                
                details_sql = """
                    SELECT ae.sex, ae.team, ae.year, ae.event, ae.sport, nr.region
                    FROM athlete_events ae
                    LEFT JOIN noc_regions nr ON ae.noc = nr.noc
                    WHERE ae.name = :name
                    LIMIT 1
                """
                details = db.execute(text(details_sql), {"name": name}).fetchone()
                if details:
                    records.append({
                        "Name": name,
                        "Sex": str(details.sex),
                        "Team": str(details.team),
                        "Year": int(details.year),
                        "Event": str(details.event),
                        "Medals": medals_count,
                        "Sport": str(details.sport),
                        "region": str(details.region) if details.region else 'N/A'
                    })
            return records
        finally:
            db.close()

    def get_country_analysis(self, country):
        db = SessionLocal()
        try:
            country_lower = country.strip().lower()
            
            distinct_sql = """
                SELECT DISTINCT team, noc, games, year, city, sport, event, medal, gold, silver, bronze
                FROM athlete_events
                WHERE medal IS NOT NULL
            """
            
            # Medal tally
            tally_sql = f"""
                WITH de AS ({distinct_sql})
                SELECT de.year as Year, COUNT(de.medal) as Medals
                FROM de
                JOIN noc_regions nr ON de.noc = nr.noc
                WHERE LOWER(nr.region) = :country
                GROUP BY de.year
                ORDER BY de.year ASC
            """
            tally_result = db.execute(text(tally_sql), {"country": country_lower})
            medal_tally = [{"Year": int(r.Year), "Medals": int(r.Medals)} for r in tally_result]
            
            # Sports heatmap
            heatmap_sql = f"""
                WITH de AS ({distinct_sql})
                SELECT de.sport as Sport, de.year as Year, COUNT(de.medal) as Medals
                FROM de
                JOIN noc_regions nr ON de.noc = nr.noc
                WHERE LOWER(nr.region) = :country
                GROUP BY de.sport, de.year
            """
            heatmap_result = db.execute(text(heatmap_sql), {"country": country_lower})
            
            sports_years = {}
            all_years = set()
            for r in heatmap_result:
                sport = str(r.Sport)
                year = str(r.Year)
                count = int(r.Medals)
                all_years.add(year)
                
                if sport not in sports_years:
                    sports_years[sport] = {}
                sports_years[sport][year] = count
                
            sorted_years = sorted(list(all_years))
            heatmap_data = []
            for sport, year_counts in sports_years.items():
                row = {"sport": sport}
                for y in sorted_years:
                    row[y] = year_counts.get(y, 0)
                heatmap_data.append(row)
                
            # Top 10 athletes
            athletes_sql = f"""
                SELECT ae.name as Name, COUNT(ae.medal) as Medals
                FROM athlete_events ae
                JOIN noc_regions nr ON ae.noc = nr.noc
                WHERE LOWER(nr.region) = :country AND ae.medal IS NOT NULL
                GROUP BY ae.name
                ORDER BY Medals DESC
                LIMIT 10
            """
            athletes_result = db.execute(text(athletes_sql), {"country": country_lower}).fetchall()
            
            top_athletes = []
            for item in athletes_result:
                name = item.Name
                medals_count = int(item.Medals)
                
                details_sql = """
                    SELECT ae.sex, ae.team, ae.noc, ae.year, ae.sport, nr.region
                    FROM athlete_events ae
                    LEFT JOIN noc_regions nr ON ae.noc = nr.noc
                    WHERE ae.name = :name
                    LIMIT 1
                """
                details = db.execute(text(details_sql), {"name": name}).fetchone()
                if details:
                    top_athletes.append({
                        "Name": name,
                        "Sex": str(details.sex),
                        "Team": str(details.team),
                        "NOC": str(details.noc),
                        "Year": int(details.year),
                        "Medals": medals_count,
                        "Sport": str(details.sport),
                        "region": str(details.region) if details.region else 'N/A'
                    })
                    
            return {
                "medal_tally": medal_tally,
                "heatmap": {
                    "years": sorted_years,
                    "sports": sorted(list(sports_years.keys())),
                    "data": heatmap_data
                },
                "top_athletes": top_athletes
            }
        finally:
            db.close()

    def get_athlete_analysis(self, sport):
        db = SessionLocal()
        try:
            unique_athletes_sql = """
                SELECT DISTINCT name, sex, age, height, weight, sport, medal, year, noc
                FROM athlete_events
            """
            
            sport_filter = ""
            params = {}
            if sport.lower() != 'overall':
                sport_filter = "WHERE LOWER(sport) = :sport"
                params["sport"] = sport.lower()
                
            age_sql = f"""
                WITH ua AS ({unique_athletes_sql})
                SELECT age, medal
                FROM ua
                {sport_filter}
            """
            age_data = db.execute(text(age_sql), params).fetchall()
            
            overall_age = []
            gold_age = []
            silver_age = []
            bronze_age = []
            for r in age_data:
                if r.age is not None:
                    age_val = float(r.age)
                    overall_age.append(age_val)
                    if r.medal == 'Gold':
                        gold_age.append(age_val)
                    elif r.medal == 'Silver':
                        silver_age.append(age_val)
                    elif r.medal == 'Bronze':
                        bronze_age.append(age_val)
                        
            bins = np.arange(10, 61, 2)
            bin_labels = [f"{bins[i]}-{bins[i+1]-1}" for i in range(len(bins)-1)]
            
            def bin_data(series_list):
                counts, _ = np.histogram(series_list, bins=bins)
                return counts.tolist()
                
            overall_counts = bin_data(overall_age)
            gold_counts = bin_data(gold_age)
            silver_counts = bin_data(silver_age)
            bronze_counts = bin_data(bronze_age)
            
            age_bins = []
            for i in range(len(bin_labels)):
                age_bins.append({
                    "bin": bin_labels[i],
                    "Overall": overall_counts[i],
                    "Gold": gold_counts[i],
                    "Silver": silver_counts[i],
                    "Bronze": bronze_counts[i]
                })
                
            hw_sql = f"""
                WITH ua AS ({unique_athletes_sql})
                SELECT name, height, weight, medal, sex, sport
                FROM ua
                WHERE height IS NOT NULL AND weight IS NOT NULL {sport_filter.replace('WHERE', 'AND') if sport_filter else ''}
            """
            hw_data = db.execute(text(hw_sql), params).fetchall()
            
            hw_records = []
            for r in hw_data:
                hw_records.append({
                    "Name": r.name,
                    "Height": float(r.height),
                    "Weight": float(r.weight),
                    "Medal": r.medal if r.medal else 'No Medal',
                    "Sex": r.sex,
                    "Sport": r.sport
                })
                
            if len(hw_records) > 1000:
                import random
                random.seed(42)
                hw_records = random.sample(hw_records, 1000)
                
            gender_sql = f"""
                WITH ua AS ({unique_athletes_sql})
                SELECT year,
                       SUM(CASE WHEN sex = 'M' THEN 1 ELSE 0 END) as Male,
                       SUM(CASE WHEN sex = 'F' THEN 1 ELSE 0 END) as Female
                FROM ua
                GROUP BY year
                ORDER BY year ASC
            """
            gender_result = db.execute(text(gender_sql))
            men_vs_women_data = [
                {
                    "Year": int(r.year),
                    "Male": int(r.Male),
                    "Female": int(r.Female)
                } for r in gender_result
            ]
            
            return {
                "age_distribution": age_bins,
                "height_vs_weight": hw_records,
                "men_vs_women": men_vs_women_data
            }
        finally:
            db.close()

    def get_comparison_data(self, country1, country2):
        db = SessionLocal()
        try:
            c1_lower = country1.strip().lower()
            c2_lower = country2.strip().lower()
            
            distinct_sql = """
                SELECT DISTINCT team, noc, games, year, city, sport, event, medal, gold, silver, bronze, age, height, weight
                FROM athlete_events
            """
            
            tally_sql = f"""
                WITH de AS ({distinct_sql})
                SELECT nr.region as country, de.year as Year, COUNT(de.medal) as Medals
                FROM de
                JOIN noc_regions nr ON de.noc = nr.noc
                WHERE LOWER(nr.region) = :c1 OR LOWER(nr.region) = :c2
                GROUP BY nr.region, de.year
                ORDER BY de.year ASC
            """
            result = db.execute(text(tally_sql), {"c1": c1_lower, "c2": c2_lower})
            
            timeline1 = {}
            timeline2 = {}
            all_years = set()
            for r in result:
                country_name = str(r.country)
                year_val = int(r.Year)
                medals_val = int(r.Medals)
                all_years.add(year_val)
                
                if country_name.lower() == c1_lower:
                    timeline1[year_val] = medals_val
                elif country_name.lower() == c2_lower:
                    timeline2[year_val] = medals_val
                    
            timeline_data = []
            for y in sorted(list(all_years)):
                timeline_data.append({
                    "Year": y,
                    "Country1": timeline1.get(y, 0),
                    "Country2": timeline2.get(y, 0)
                })
                
            sports_sql = f"""
                SELECT nr.region as country, ae.sport as Sport, COUNT(ae.medal) as Medals
                FROM athlete_events ae
                JOIN noc_regions nr ON ae.noc = nr.noc
                WHERE (LOWER(nr.region) = :c1 OR LOWER(nr.region) = :c2) AND ae.medal IS NOT NULL
                GROUP BY nr.region, ae.sport
                ORDER BY Medals DESC
            """
            sports_result = db.execute(text(sports_sql), {"c1": c1_lower, "c2": c2_lower})
            
            sports1 = []
            sports2 = []
            for r in sports_result:
                c_name = str(r.country).lower()
                row = {"sport": str(r.Sport), "medals": int(r.Medals)}
                if c_name == c1_lower and len(sports1) < 5:
                    sports1.append(row)
                elif c_name == c2_lower and len(sports2) < 5:
                    sports2.append(row)
                    
            metrics_sql = f"""
                SELECT nr.region as country,
                       AVG(ae.age) as AvgAge,
                       AVG(ae.height) as AvgHeight,
                       AVG(ae.weight) as AvgWeight,
                       COUNT(DISTINCT ae.name) as TotalAthletes,
                       SUM(ae.gold) as Gold,
                       SUM(ae.silver) as Silver,
                       SUM(ae.bronze) as Bronze
                FROM athlete_events ae
                JOIN noc_regions nr ON ae.noc = nr.noc
                WHERE LOWER(nr.region) = :c1 OR LOWER(nr.region) = :c2
                GROUP BY nr.region
            """
            metrics_result = db.execute(text(metrics_sql), {"c1": c1_lower, "c2": c2_lower})
            
            metrics1 = {}
            metrics2 = {}
            for r in metrics_result:
                c_name = str(r.country).lower()
                gold = int(r.Gold or 0)
                silver = int(r.Silver or 0)
                bronze = int(r.Bronze or 0)
                
                data = {
                    "country": str(r.country),
                    "avg_age": round(float(r.AvgAge or 0), 1),
                    "avg_height": round(float(r.AvgHeight or 0), 1),
                    "avg_weight": round(float(r.AvgWeight or 0), 1),
                    "athletes": int(r.TotalAthletes or 0),
                    "gold": gold,
                    "silver": silver,
                    "bronze": bronze,
                    "total": gold + silver + bronze
                }
                if c_name == c1_lower:
                    metrics1 = data
                elif c_name == c2_lower:
                    metrics2 = data
                    
            return {
                "timeline": timeline_data,
                "sports1": sports1,
                "sports2": sports2,
                "metrics1": metrics1,
                "metrics2": metrics2
            }
        finally:
            db.close()

    def get_host_details(self, city):
        db = SessionLocal()
        try:
            city_lower = city.strip().lower()
            
            # Find years this city hosted
            years_result = db.query(AthleteEvent.year).filter(func.lower(AthleteEvent.city) == city_lower).distinct().all()
            years = sorted([y[0] for y in years_result if y[0] is not None])
            
            if not years:
                return {"city": city, "editions": []}
                
            editions = []
            for y in years:
                # 1. Fetch general statistics for this edition
                athletes = db.query(AthleteEvent.name).filter(AthleteEvent.year == y).distinct().count()
                sports = db.query(AthleteEvent.sport).filter(AthleteEvent.year == y).distinct().count()
                events = db.query(AthleteEvent.event).filter(AthleteEvent.year == y).distinct().count()
                
                nations_sql = """
                    SELECT COUNT(DISTINCT nr.region)
                    FROM athlete_events ae
                    JOIN noc_regions nr ON ae.noc = nr.noc
                    WHERE ae.year = :year
                """
                nations = db.execute(text(nations_sql), {"year": y}).scalar()
                
                # 2. Fetch top 3 countries (Podium)
                distinct_sql = """
                    SELECT DISTINCT team, noc, games, year, city, sport, event, medal, gold, silver, bronze
                    FROM athlete_events
                """
                podium_sql = f"""
                    WITH de AS ({distinct_sql})
                    SELECT nr.region as country, SUM(de.gold) as Gold, SUM(de.silver) as Silver, SUM(de.bronze) as Bronze
                    FROM de
                    JOIN noc_regions nr ON de.noc = nr.noc
                    WHERE de.year = :year
                    GROUP BY nr.region
                    ORDER BY Gold DESC, Silver DESC, Bronze DESC
                    LIMIT 3
                """
                podium_result = db.execute(text(podium_sql), {"year": y})
                podium = []
                for idx, r in enumerate(podium_result):
                    podium.append({
                        "rank": idx + 1,
                        "country": str(r.country),
                        "Gold": int(r.Gold or 0),
                        "Silver": int(r.Silver or 0),
                        "Bronze": int(r.Bronze or 0)
                    })
                    
                editions.append({
                    "year": int(y),
                    "athletes": int(athletes),
                    "sports": int(sports),
                    "events": int(events),
                    "nations": int(nations or 0),
                    "podium": podium
                })
                
            return {
                "city": city,
                "editions": editions
            }
        finally:
            db.close()
