"""
Stock Market Prediction Model
Author: Niraj Bharadva
Course/Department: Department of Computer Science (Data Science)

"""

import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.model_selection import TimeSeriesSplit, GridSearchCV
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score
import joblib
import warnings
warnings.filterwarnings('ignore')

def build_stock_model():
    print("Fetching market data...")
    
    # 1. Data Fetching
    tickers = ['^NSEI', '^GSPC', 'CL=F', '^INDIAVIX']
    dataset = yf.download(tickers, period='5y')['Close']
    dataset.rename(columns={'^NSEI': 'Nifty', '^GSPC': 'US_Market', 'CL=F': 'Crude_Oil', '^INDIAVIX': 'VIX'}, inplace=True)
    dataset = dataset.ffill().dropna()

    # 2. Feature Engineering (Percentage Returns)
    returns = pd.DataFrame(index=dataset.index)
    returns['Nifty_Ret'] = dataset['Nifty'].pct_change()
    returns['US_Ret'] = dataset['US_Market'].pct_change()
    returns['Crude_Ret'] = dataset['Crude_Oil'].pct_change()
    returns['VIX_Change'] = dataset['VIX'].pct_change()
    
    # Target Variable (1 if Next Day Return > 0, else 0)
    returns['Target'] = (returns['Nifty_Ret'].shift(-1) > 0).astype(int)
    returns = returns.dropna()

    X = returns[['Nifty_Ret', 'US_Ret', 'Crude_Ret', 'VIX_Change']]
    y = returns['Target']

    # 3. Data Scaling (Standardization)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # 4. Time Series Cross-Validation Split
    tscv = TimeSeriesSplit(n_splits=5)

    # 5. Hyperparameter Tuning using GridSearchCV
    param_grid = {
        'n_estimators': [100, 200],
        'learning_rate': [0.01, 0.05, 0.1],
        'max_depth': [3, 4, 5]
    }
    
    base_model = GradientBoostingClassifier(random_state=42)
    grid_search = GridSearchCV(estimator=base_model, param_grid=param_grid, cv=tscv, scoring='accuracy', n_jobs=-1)
    
    print("Optimizing model hyperparameters (Grid Search in progress)...")
    grid_search.fit(X_scaled, y)

    best_model = grid_search.best_estimator_
    
    # 6. Final Model Evaluation on unseen data
    split_point = int(len(X_scaled) * 0.8)
    X_final_test = X_scaled[split_point:]
    y_final_test = y.iloc[split_point:]
    
    predictions = best_model.predict(X_final_test)
    accuracy = accuracy_score(y_final_test, predictions)
    
    print("\n--- Model Training Summary ---")
    print(f"Best Hyperparameters: {grid_search.best_params_}")
    print(f"Model Accuracy: {accuracy * 100:.2f}%")
    print("------------------------------")

    print("\nModel aur Scaler save ho rahe hain...")
    joblib.dump(best_model, 'stock_model.pkl')
    joblib.dump(scaler, 'scaler.pkl')
    print("Files successfully save ho gayi hain! (stock_model.pkl aur scaler.pkl)")
if __name__ == "__main__":
    build_stock_model()