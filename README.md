# 🏅 Olympics Vault - ML Analytics & NLP Database Agent

Olympics Vault is a production-grade full-stack data analytics application mapping 120+ years of Summer Olympic history. It combines robust relational data indexing, real-time machine learning predictions, and a localized Natural Language Processing (NLP) chatbot to query statistical entries directly.

---

## 🌟 Core Features

1. **📈 LA 2028 Machine Learning Predictor:**
   - Uses a trained `RandomForestRegressor` model predicting future medal distributions (Gold, Silver, Bronze, and totals) for LA 2028 or Brisbane 2032.
   - Allows real-time user overrides of athlete delegation sizes via interactive sliders.
2. **💬 Natural Language "Oracle" Chatbot:**
   - An offline **Text-to-SQL compiler** that parses English queries (e.g. *"USA in 2008"* or *"average height of swimmers in 2016"*) into parameterized SQLite queries securely without external LLM API costs.
3. **📊 Dynamic Host CityStandings:**
   - A grid selection of historic summer hosts that queries SQLite to render participation metrics and custom 3-bar standings podiums (Gold, Silver, Bronze).
4. **👥 Side-by-Side Country Benchmarks:**
   - Interactive benchmarking of physical stats (age, height, weight distributions) and historical medals output for competing nations.
5. **🏆 Legendary Records Timeline:**
   - A modern sliding carousel cataloging the most iconic, record-shattering athletic achievements in Olympic history.

---

## 🛠️ Technology Stack

- **Backend:** Python, FastAPI, SQLAlchemy ORM, SQLite, Scikit-Learn, Pandas, NumPy
- **Frontend:** React.js (Vite), Recharts (data visualization), Lucide Icons, CSS3
- **DevOps & Deploy:** Docker, Docker Compose, Nginx (reverse proxy routing)

---

## 📁 Repository Structure

```
├── backend/
│   ├── Dockerfile
│   ├── main.py              # FastAPI router and CORS definitions
│   ├── database.py          # SQLAlchemy engine and session makers
│   ├── data_service.py      # SQLite operations and chunked CSV seeder
│   ├── ml_service.py        # RandomForest regression predictor
│   ├── chat_service.py      # Regex-based Text-to-SQL compiler engine
│   ├── requirements.txt     # Python backend dependencies
│   └── test_api.py          # Automated integration test suite
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf           # Production Nginx reverse proxy configuration
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx          # Core React layouts and charts
│   │   └── index.css        # Responsive dark-mode styling variables
├── docker-compose.yml       # Production container orchestration
└── DEPLOYMENT.md            # Detailed VPS & Serverless cloud deployment guide
```

---

## 💻 Local Quickstart

### 1. Run the Python Backend
Navigate to the `backend/` directory:
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/Scripts/activate # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI uvicorn daemon
uvicorn main:app --host 127.0.0.1 --port 8001
```

### 2. Run the React Frontend
Open a new terminal tab and navigate to the `frontend/` directory:
```bash
cd frontend

# Install package dependencies
npm install

# Run the local Vite dev server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Running Automated Tests

To run the integration test suite validating all API endpoints:
```bash
cd backend
python test_api.py
```

---

## 🚀 Cloud Deployment

The application is configured to deploy with **Docker Compose** on virtual servers or as standalone services on platforms like **Render** and **Railway**. See the detailed [DEPLOYMENT.md](DEPLOYMENT.md) file in the root folder for step-by-step instructions.
