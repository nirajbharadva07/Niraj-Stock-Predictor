import yfinance as yf
import pandas as pd
import joblib
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
scaler = None
model_load_error = None

def try_load_model_files():
    global model, scaler
    model = joblib.load('stock_model.pkl')
    scaler = joblib.load('scaler.pkl')

@app.on_event("startup")
def startup_event():
    global model_load_error
    try:
        try_load_model_files()
        print(">>> NIRAJ AI ENGINE: MODELS LOADED")
    except Exception as e:
        print(f">>> MODEL LOAD ERROR: {e}. Attempting to rebuild model from data...")
        try:
            from data_model import build_stock_model
            build_stock_model()
            try_load_model_files()
            print(">>> NIRAJ AI ENGINE: MODEL REBUILT AND LOADED")
        except Exception as build_exc:
            model_load_error = str(build_exc)
            print(f">>> MODEL BUILD FAILED: {build_exc}. Prediction endpoint will return an error.")

@app.get('/status')
def status():
    return {
        'status': 'success' if model is not None else 'error',
        'model_loaded': model is not None,
        'error': model_load_error,
    }

@app.get("/predict")
def predict():
    try:
        if model is None or scaler is None:
            raise RuntimeError('Model is not loaded. Deploy with stock_model.pkl or allow model build.')
        nifty_data = yf.download('^NSEI', period='60d', progress=False)['Close']
        vix_data = yf.download('^INDIAVIX', period='60d', progress=False)['Close']
        us_data = yf.download('^GSPC', period='60d', progress=False)['Close']
        crude_data = yf.download('CL=F', period='60d', progress=False)['Close']
        
        if isinstance(nifty_data, pd.DataFrame): nifty_data = nifty_data.squeeze()
        if isinstance(vix_data, pd.DataFrame): vix_data = vix_data.squeeze()
        if isinstance(us_data, pd.DataFrame): us_data = us_data.squeeze()
        if isinstance(crude_data, pd.DataFrame): crude_data = crude_data.squeeze()
        
        df = pd.DataFrame({'Nifty': nifty_data, 'VIX': vix_data, 'US': us_data, 'Crude': crude_data}).ffill().dropna()
        returns = df.pct_change().dropna()
        last_data = returns.iloc[-1]

        input_array = np.array([[float(last_data['Nifty']), float(last_data['US']), float(last_data['Crude']), float(last_data['VIX'])]])
        x_scaled = scaler.transform(input_array)
        pred = int(model.predict(x_scaled)[0])
        probs = model.predict_proba(x_scaled)[0]
        confidence_val = round(max(probs)*100, 2)
        prediction_text = "UP" if pred == 1 else "DOWN"

        confidence = f"{confidence_val}%"
        chart_data = [{"time": d.strftime('%d %b'), "price": round(float(p), 2)} for d, p in df.tail(30)['Nifty'].items()]

        return {
            "status": "success",
            "nifty_price": round(float(df['Nifty'].iloc[-1]), 2),
            "vix_real": round(float(df['VIX'].iloc[-1]), 2),
            "prediction": prediction_text,
            "confidence": confidence,
            "chart_data": chart_data,
            "global_factors": {"us_market": "Positive" if last_data['US'] > 0 else "Negative"}
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/option-chain")
def get_option_chain():
    try:
        nifty = yf.Ticker("^NSEI")
        spot = nifty.fast_info['lastPrice']
        if not spot: spot = 24000.0
            
        atm_strike = round(spot / 50) * 50
        timestamp = datetime.now().strftime("%d-%b-%Y %H:%M:%S")
        
        strikes = []
        for i in range(-8, 9):
            strike = atm_strike + (i * 50)
            dist = abs(strike - spot)
            ce_ltp = (spot - strike) + random.uniform(40, 60) if strike < spot else max(2.0, 100 - (dist * 0.4) + random.uniform(-5, 5))
            pe_ltp = (strike - spot) + random.uniform(40, 60) if strike > spot else max(2.0, 100 - (dist * 0.4) + random.uniform(-5, 5))

            strikes.append({
                "strike": strike,
                "isATM": strike == atm_strike,
                "call": {
                    "oi": round(random.uniform(30, 95), 2),
                    "chgOi": round(random.uniform(-10, 20), 2),
                    "vol": random.randint(200000, 1200000),
                    "ltp": round(ce_ltp, 2),
                    "chg": round(random.uniform(-15, 15), 2),
                    "isITM": strike < spot
                },
                "put": {
                    "oi": round(random.uniform(30, 95), 2),
                    "chgOi": round(random.uniform(-10, 20), 2),
                    "vol": random.randint(200000, 1200000),
                    "ltp": round(pe_ltp, 2),
                    "chg": round(random.uniform(-15, 15), 2),
                    "isITM": strike > spot
                }
            })

        return {
            "status": "success",
            "spot": round(spot, 2),
            "atm": atm_strike,
            "expiry": "18-Jun-2026", 
            "timestamp": timestamp,
            "chain": strikes
        }
    except Exception as e:
        return {"status": "error", "message": f"Simulation Error: {str(e)}"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)