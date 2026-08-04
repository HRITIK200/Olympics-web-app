from sqlalchemy import Column, Integer, String, Float, Index
from database import Base

class AthleteEvent(Base):
    __tablename__ = "athlete_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    athlete_id = Column(Integer)
    name = Column(String)
    sex = Column(String)
    age = Column(Float, nullable=True)
    height = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)
    team = Column(String)
    noc = Column(String)
    games = Column(String)
    year = Column(Integer)
    season = Column(String)
    city = Column(String)
    sport = Column(String)
    event = Column(String)
    medal = Column(String, nullable=True)
    
    # Pre-calculated dummy flags for fast database aggregations
    gold = Column(Integer, default=0)
    silver = Column(Integer, default=0)
    bronze = Column(Integer, default=0)

class NOCRegion(Base):
    __tablename__ = "noc_regions"

    noc = Column(String, primary_key=True, index=True)
    region = Column(String)
    notes = Column(String, nullable=True)

# Performance indexes
Index("idx_athlete_noc", AthleteEvent.noc)
Index("idx_athlete_year", AthleteEvent.year)
Index("idx_athlete_sport", AthleteEvent.sport)
Index("idx_noc_year", AthleteEvent.noc, AthleteEvent.year)
Index("idx_sport_year", AthleteEvent.sport, AthleteEvent.year)
