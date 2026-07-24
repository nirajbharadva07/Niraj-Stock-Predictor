# 📈 NIRAJ AI ENGINE - Stock Market Predictor

> 🌐 **Live Application Link:**
> - **Frontend (Netlify):** [https://niraj-stock-predictor.netlify.app/](https://niraj-stock-predictor.netlify.app/)
> *(Note: The backend API must be running or hosted for real-time predictions to function)*

---

## 📋 Project Overview
The **NIRAJ AI ENGINE** is a full-stack financial application designed to analyze and predict stock market trends. By fetching real-time market records (such as NSE option chain data) and processing them through a custom algorithm, the application provides users with data-driven insights to make informed trading decisions. 

**Key Features:**
- **Real-Time Data Processing:** Fetches and processes live market data efficiently.
- **Custom Prediction Algorithm:** Utilizes advanced mathematical models and financial logic to predict market movements.
- **Interactive Dashboard:** A fast and responsive UI built with Vite and React for seamless data visualization.
- **Robust Backend Engine:** Powered by Python, utilizing FastAPI for quick API responses and Pandas for complex data manipulation.

---

## 💻 Tech Stack
- **Frontend:** React, Vite, Tailwind CSS (or your preferred styling library)
- **Backend:** Python, FastAPI
- **Data Processing:** Pandas, Custom Algorithmic Engine

---

## 🛠️ Setup Instructions

To run this project locally on your machine, follow these steps:

### 1. Backend Setup (Python/FastAPI)
1. Open a terminal and navigate to the backend directory.
2. Create and activate a virtual environment:
   `python -m venv venv`
   `source venv/bin/activate` *(On Windows use: `venv\Scripts\activate`)*
3. Install the required Python dependencies:
   `pip install -r requirements.txt`
4. Start the AI Engine backend server:
   `uvicorn main:app --reload`
   *The backend API will run at `http://localhost:8000`*

### 2. Frontend Setup (React/Vite)
1. Open a new terminal and navigate to the frontend directory.
2. Install the node modules:
   `npm install`
3. Start the development server:
   `npm run dev`
   *The frontend will run at `http://localhost:5173`*

---

## 🚀 How It Works
1. **Data Fetching:** The Python backend securely fetches live market data.
2. **Analysis:** The `NIRAJ AI ENGINE` processes the raw data using Pandas, calculating key indicators and recognizing patterns.
3. **Prediction:** The custom algorithm generates a forecast (e.g., Intraday or Swing trading signals).
4. **Visualization:** The Vite-powered frontend fetches this processed data via REST API and displays it on the user dashboard.

---
*Developed & Engineered by Niraj Bharadva*
