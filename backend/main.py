from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from data_service import DataService
from ml_service import MLService
from chat_service import ChatService

class ChatPayload(BaseModel):
    message: str

app = FastAPI(title="Olympics Data Analysis API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize data, ML, and chat services
data_service = DataService()
ml_service = MLService()
chat_service = ChatService(data_service, ml_service)

@app.get("/api/filters")
def get_filters():
    return data_service.get_filters()

@app.get("/api/medal-tally")
def get_medal_tally(year: str = "overall", country: str = "overall"):
    return data_service.fetch_medal_tally(year, country)

@app.get("/api/overall-stats")
def get_overall_stats():
    return data_service.get_overall_stats()

@app.get("/api/overall-charts")
def get_overall_charts():
    return data_service.get_overall_charts()

@app.get("/api/sport-heatmap")
def get_events_heatmap():
    return data_service.get_events_heatmap()

@app.get("/api/most-successful")
def get_most_successful(sport: str = "overall"):
    return data_service.most_successful(sport)

@app.get("/api/country-analysis")
def get_country_analysis(country: str):
    return data_service.get_country_analysis(country)

@app.get("/api/athlete-analysis")
def get_athlete_analysis(sport: str = "overall"):
    return data_service.get_athlete_analysis(sport)

@app.get("/api/predict")
def get_prediction(country: str, year: int = 2028, delegation: int = None):
    return ml_service.predict(country, year, delegation)

@app.get("/api/comparison")
def get_comparison(country1: str, country2: str):
    return data_service.get_comparison_data(country1, country2)

@app.post("/api/chat")
def get_chat_response(payload: ChatPayload):
    return {"response": chat_service.reply(payload.message)}

@app.get("/api/host-details")
def get_host_details(city: str):
    return data_service.get_host_details(city)
