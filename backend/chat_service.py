import re
from sqlalchemy import text
from database import SessionLocal
from data_service import DataService
from ml_service import MLService

class ChatService:
    def __init__(self, data_service: DataService, ml_service: MLService):
        self.data_service = data_service
        self.ml_service = ml_service

    def reply(self, message: str) -> str:
        msg = message.strip().lower()
        
        # Pull active sports and countries to scan the question
        filters = self.data_service.get_filters()
        countries_raw = [c for c in filters["countries"] if c.lower() != 'overall']
        sports_raw = [s for s in filters["sports"] if s.lower() != 'overall']
        
        # Sort by string length descending to match longer multi-word names first
        countries = sorted(countries_raw, key=len, reverse=True)
        sports = sorted(sports_raw, key=len, reverse=True)
        
        # 1. Prediction Queries
        if any(kw in msg for kw in ["predict", "prediction", "forecast", "future", "will win"]):
            year = 2028
            if "2032" in msg:
                year = 2032
            
            matched_country = None
            for c in countries:
                if c.lower() in msg:
                    matched_country = c
                    break
                    
            if matched_country:
                pred = self.ml_service.predict(matched_country, year)
                if "error" in pred:
                    return f"I couldn't predict for that country: {pred['error']}"
                return (
                    f"🔮 **ML Prediction for {pred['country']} ({year} Olympics):**\n\n"
                    f"Our RandomForest model predicts a total of **{pred['total']} medals**:\n"
                    f"- 🥇 Gold: {pred['Gold']}\n"
                    f"- 🥈 Silver: {pred['Silver']}\n"
                    f"- 🥉 Bronze: {pred['Bronze']}\n\n"
                    f"*Confidence Score: {pred['confidence']}% based on historical team scaling.*"
                )
            else:
                return "Which country would you like to predict? Try asking: 'Predict medals for France in 2028'."

        # 2. Most Decorated Athlete Queries
        if any(kw in msg for kw in ["most decorated", "most successful", "best athlete", "top athlete", "most medals", "legend"]):
            matched_sport = 'overall'
            for s in sports:
                if s.lower() in msg:
                    matched_sport = s
                    break
                    
            results = self.data_service.most_successful(matched_sport)
            if results:
                top = results[0]
                sport_title = f"in {matched_sport.capitalize()}" if matched_sport != 'overall' else "overall"
                return (
                    f"🏆 **Most Decorated Athlete {sport_title}:**\n\n"
                    f"The top-ranking athlete is **{top['Name']}** ({top['Sex']}) representing **{top['region'] if top['region'] != 'N/A' else top['Team']}**.\n"
                    f"- **Total Medals:** {top['Medals']}\n"
                    f"- **Sport:** {top['Sport']}\n"
                    f"- **Historic Entry:** Competed in the {top['Year']} games ({top['Event']})."
                )
            else:
                return "I couldn't locate any matching decorator records."

        # 3. Text-to-SQL dynamic parsing engine
        # Parse entities
        matched_year = None
        year_match = re.search(r'\b(189\d|19\d\d|20\d\d)\b', msg)
        if year_match:
            matched_year = int(year_match.group(1))
            
        matched_country = None
        for c in countries:
            if c.lower() in msg:
                matched_country = c
                break
                
        matched_sport = None
        for s in sports:
            if s.lower() in msg:
                matched_sport = s
                break
                
        matched_medal = None
        if "gold" in msg:
            matched_medal = 'Gold'
        elif "silver" in msg:
            matched_medal = 'Silver'
        elif "bronze" in msg:
            matched_medal = 'Bronze'
        elif "medal" in msg:
            matched_medal = 'any'
            
        matched_gender = None
        if any(kw in msg for kw in ["female", "women", "woman", "girl", "she"]):
            matched_gender = 'F'
        elif any(kw in msg for kw in ["male", "men", "man", "boy", "he"]):
            matched_gender = 'M'

        # Classify intent metric
        metric = None
        if any(kw in msg for kw in ["average age", "avg age", "mean age"]):
            metric = 'avg_age'
        elif any(kw in msg for kw in ["average height", "avg height", "mean height", "height"]):
            metric = 'avg_height'
        elif any(kw in msg for kw in ["average weight", "avg weight", "mean weight", "weight"]):
            metric = 'avg_weight'
        elif any(kw in msg for kw in ["where was", "which city", "host city", "hosted in", "hosts"]):
            metric = 'city'
        elif any(kw in msg for kw in ["who won", "which athlete", "who was", "name of", "athletes lists", "competitors"]):
            metric = 'names'
        elif any(kw in msg for kw in ["how many medals", "number of medals", "medals won", "medal count"]):
            metric = 'medal_count'
        elif any(kw in msg for kw in ["how many athletes", "number of athletes", "competitors count"]):
            metric = 'athlete_count'
        elif any(kw in msg for kw in ["how many nations", "number of countries", "how many countries", "nations count"]):
            metric = 'nations_count'

        # If we successfully matched at least some intent metric, we build the SQL statement!
        if metric:
            db = SessionLocal()
            try:
                conditions = []
                params = {}
                
                # Apply constraints
                if matched_year:
                    conditions.append("ae.year = :year")
                    params["year"] = matched_year
                if matched_sport:
                    conditions.append("LOWER(ae.sport) = :sport")
                    params["sport"] = matched_sport.lower()
                if matched_country:
                    conditions.append("LOWER(nr.region) = :country")
                    params["country"] = matched_country.lower()
                if matched_gender:
                    conditions.append("ae.sex = :gender")
                    params["gender"] = matched_gender
                if matched_medal:
                    if matched_medal != 'any':
                        conditions.append("ae.medal = :medal")
                        params["medal"] = matched_medal
                    else:
                        conditions.append("ae.medal IS NOT NULL")
                
                # Base SELECT structure
                if metric == 'avg_age':
                    sql = "SELECT AVG(ae.age) FROM athlete_events ae LEFT JOIN noc_regions nr ON ae.noc = nr.noc"
                elif metric == 'avg_height':
                    sql = "SELECT AVG(ae.height) FROM athlete_events ae LEFT JOIN noc_regions nr ON ae.noc = nr.noc"
                elif metric == 'avg_weight':
                    sql = "SELECT AVG(ae.weight) FROM athlete_events ae LEFT JOIN noc_regions nr ON ae.noc = nr.noc"
                elif metric == 'city':
                    sql = "SELECT DISTINCT ae.city FROM athlete_events ae LEFT JOIN noc_regions nr ON ae.noc = nr.noc"
                elif metric == 'names':
                    sql = "SELECT DISTINCT ae.name, nr.region, ae.sport, ae.event, ae.medal FROM athlete_events ae LEFT JOIN noc_regions nr ON ae.noc = nr.noc"
                elif metric == 'medal_count':
                    sql = "SELECT COUNT(ae.medal) FROM athlete_events ae LEFT JOIN noc_regions nr ON ae.noc = nr.noc"
                elif metric == 'athlete_count':
                    sql = "SELECT COUNT(DISTINCT ae.name) FROM athlete_events ae LEFT JOIN noc_regions nr ON ae.noc = nr.noc"
                elif metric == 'nations_count':
                    sql = "SELECT COUNT(DISTINCT nr.region) FROM athlete_events ae LEFT JOIN noc_regions nr ON ae.noc = nr.noc"

                if conditions:
                    sql += " WHERE " + " AND ".join(conditions)
                    
                # For safety and memory efficiency, limit large record lists
                if metric == 'names':
                    sql += " ORDER BY ae.name ASC LIMIT 10"

                result = db.execute(text(sql), params)
                
                # Format output responses
                if metric in ['avg_age', 'avg_height', 'avg_weight']:
                    val = result.scalar()
                    if val is not None:
                        unit = "yrs" if metric == 'avg_age' else ("cm" if metric == 'avg_height' else "kg")
                        label = "age" if metric == 'avg_age' else ("height" if metric == 'avg_height' else "weight")
                        return f"📊 Based on your search criteria, the average **{label}** of the matching athletes is **{val:.1f} {unit}**."
                    else:
                        return "I couldn't find any body dimensions matching those filters."
                        
                elif metric == 'city':
                    cities = [r[0] for r in result if r[0] is not None]
                    if cities:
                        return f"🌍 The matching Olympic Games were hosted in: **{', '.join(cities)}**."
                    else:
                        return "No host city records match your query."
                        
                elif metric in ['medal_count', 'athlete_count', 'nations_count']:
                    val = result.scalar() or 0
                    label = "medals" if metric == 'medal_count' else ("unique athletes" if metric == 'athlete_count' else "nations")
                    return f"📈 There are **{val} {label}** recorded matching your specific search query."
                    
                elif metric == 'names':
                    rows = result.fetchall()
                    if rows:
                        list_str = "\n".join([
                            f"- **{r.name}** ({r.region if r.region else 'N/A'}) in *{r.sport}* ({r.event}) - Medal: **{r.medal if r.medal else 'None'}**" 
                            for r in rows
                        ])
                        return f"📋 **Matching Athlete Records (showing top 10 results):**\n\n{list_str}"
                    else:
                        return "No athlete records found matching those search criteria."

            except Exception as e:
                return f"Sorry, I encountered an issue querying the database: {e}"
            finally:
                db.close()

        # If we didn't match a specific metric, but we did match a country or a year, we fall back to a general entity search!
        if metric is None and (matched_country or matched_year):
            db = SessionLocal()
            try:
                distinct_sql = "SELECT DISTINCT team, noc, games, year, city, sport, event, medal, gold, silver, bronze FROM athlete_events"
                
                # Case A: Country + Year
                if matched_country and matched_year:
                    tally_query = f"""
                        WITH de AS ({distinct_sql})
                        SELECT SUM(de.gold) as Gold, SUM(de.silver) as Silver, SUM(de.bronze) as Bronze
                        FROM de
                        JOIN noc_regions nr ON de.noc = nr.noc
                        WHERE de.year = :year AND LOWER(nr.region) = :country
                    """
                    tally_res = db.execute(text(tally_query), {"year": matched_year, "country": matched_country.lower()}).fetchone()
                    gold = int(tally_res.Gold or 0) if tally_res else 0
                    silver = int(tally_res.Silver or 0) if tally_res else 0
                    bronze = int(tally_res.Bronze or 0) if tally_res else 0
                    total = gold + silver + bronze
                    
                    athlete_query = """
                        SELECT COUNT(DISTINCT ae.name) 
                        FROM athlete_events ae 
                        JOIN noc_regions nr ON ae.noc = nr.noc 
                        WHERE ae.year = :year AND LOWER(nr.region) = :country
                    """
                    athletes_cnt = db.execute(text(athlete_query), {"year": matched_year, "country": matched_country.lower()}).scalar() or 0
                    
                    medals_list_query = """
                        SELECT DISTINCT ae.name, ae.sport, ae.event, ae.medal 
                        FROM athlete_events ae 
                        JOIN noc_regions nr ON ae.noc = nr.noc 
                        WHERE ae.year = :year AND LOWER(nr.region) = :country AND ae.medal IS NOT NULL
                        ORDER BY ae.medal DESC LIMIT 5
                    """
                    medals_res = db.execute(text(medals_list_query), {"year": matched_year, "country": matched_country.lower()}).fetchall()
                    
                    medalists_text = ""
                    if medals_res:
                        medalists_text = "\n🏅 **Key Medalists:**\n" + "\n".join([f"- **{r.name}** ({r.medal} in {r.sport} - {r.event})" for r in medals_res])
                    else:
                        medalists_text = "\n*No medals recorded for this country in this edition.*"
                        
                    return (
                        f"🌍 **{matched_country} at the {matched_year} Summer Olympics:**\n\n"
                        f"- 🥇 Gold Medals: **{gold}**\n"
                        f"- 🥈 Silver Medals: **{silver}**\n"
                        f"- 🥉 Bronze Medals: **{bronze}**\n"
                        f"- 🏆 Total Medals: **{total}**\n"
                        f"- 🏃 Delegation Size: **{athletes_cnt}** athletes\n"
                        f"{medalists_text}"
                    )
                
                # Case B: Country only
                elif matched_country:
                    tally_query = f"""
                        WITH de AS ({distinct_sql})
                        SELECT SUM(de.gold) as Gold, SUM(de.silver) as Silver, SUM(de.bronze) as Bronze
                        FROM de
                        JOIN noc_regions nr ON de.noc = nr.noc
                        WHERE LOWER(nr.region) = :country
                    """
                    tally_res = db.execute(text(tally_query), {"country": matched_country.lower()}).fetchone()
                    gold = int(tally_res.Gold or 0) if tally_res else 0
                    silver = int(tally_res.Silver or 0) if tally_res else 0
                    bronze = int(tally_res.Bronze or 0) if tally_res else 0
                    total = gold + silver + bronze
                    
                    athlete_query = """
                        SELECT COUNT(DISTINCT ae.name) 
                        FROM athlete_events ae 
                        JOIN noc_regions nr ON ae.noc = nr.noc 
                        WHERE LOWER(nr.region) = :country
                    """
                    athletes_cnt = db.execute(text(athlete_query), {"country": matched_country.lower()}).scalar() or 0
                    
                    top_sport_query = """
                        SELECT ae.sport, COUNT(ae.medal) as cnt 
                        FROM athlete_events ae 
                        JOIN noc_regions nr ON ae.noc = nr.noc 
                        WHERE LOWER(nr.region) = :country AND ae.medal IS NOT NULL 
                        GROUP BY ae.sport 
                        ORDER BY cnt DESC LIMIT 1
                    """
                    top_sport_res = db.execute(text(top_sport_query), {"country": matched_country.lower()}).fetchone()
                    sport_text = f"Their most successful sport is **{top_sport_res.sport}** with {top_sport_res.cnt} medals." if top_sport_res else ""
                    
                    return (
                        f"🌍 **All-Time Olympic Standings for {matched_country}:**\n\n"
                        f"- 🥇 Gold Medals: **{gold}**\n"
                        f"- 🥈 Silver Medals: **{silver}**\n"
                        f"- 🥉 Bronze Medals: **{bronze}**\n"
                        f"- 🏆 Total Medals: **{total}**\n"
                        f"- 🏃 Total Unique Competitors: **{athletes_cnt}** athletes\n\n"
                        f"{sport_text}"
                    )
                
                # Case C: Year only
                elif matched_year:
                    city_query = "SELECT DISTINCT city FROM athlete_events WHERE year = :year"
                    city_res = db.execute(text(city_query), {"year": matched_year}).scalar() or "Unknown City"
                    
                    stats_query = """
                        SELECT COUNT(DISTINCT nr.region) as nations, COUNT(DISTINCT ae.name) as athletes
                        FROM athlete_events ae
                        JOIN noc_regions nr ON ae.noc = nr.noc
                        WHERE ae.year = :year
                    """
                    stats_res = db.execute(text(stats_query), {"year": matched_year}).fetchone()
                    nations = stats_res.nations if stats_res else 0
                    athletes = stats_res.athletes if stats_res else 0
                    
                    podium_query = f"""
                        WITH de AS ({distinct_sql})
                        SELECT nr.region as country, SUM(de.gold) as Gold
                        FROM de
                        JOIN noc_regions nr ON de.noc = nr.noc
                        WHERE de.year = :year
                        GROUP BY nr.region
                        ORDER BY Gold DESC
                        LIMIT 3
                    """
                    podium_res = db.execute(text(podium_query), {"year": matched_year}).fetchall()
                    podium_text = ""
                    if podium_res:
                        podium_text = "\n🏆 **Top Medal Countries:**\n" + "\n".join([f"{i+1}. **{r.country}** ({r.Gold} Gold)" for i, r in enumerate(podium_res)])
                        
                    return (
                        f"🏅 **Summary of the {matched_year} Summer Olympic Games:**\n\n"
                        f"- 🏢 Host City: **{city_res}**\n"
                        f"- 🌍 Nations Competed: **{nations}**\n"
                        f"- 🏃 Competitors Count: **{athletes:,}** athletes\n"
                        f"{podium_text}"
                    )
            except Exception as e:
                return f"Sorry, I encountered an issue querying the database: {e}"
            finally:
                db.close()

        # 4. Fallback default response
        return (
            f"👋 Hello! I am the **Olympics Vault Oracle**, a local Text-to-SQL compiler engine.\n\n"
            f"I dynamically parse your queries to retrieve records from the SQLite database. Ask me:\n"
            f"- *'How many gold medals did India win in 2024?'*\n"
            f"- *'What was the average height of USA swimming in 2016?'*\n"
            f"- *'Which city hosted the Olympics in 2000?'*\n"
            f"- *'Who won medals in gymnastics in 2020?'*\n"
            f"- *'Predict medals for France in 2028'* (runs the ML prediction service)"
        )
