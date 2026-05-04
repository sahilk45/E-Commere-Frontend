import os

# Base directory for the models - relative to this config file
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

# Exact absolute paths to the trained artifacts
XGBOOST_MODEL_PATH = os.path.join(MODEL_DIR, "hybrid_xgb.json")
GRU_MODEL_PATH     = os.path.join(MODEL_DIR, "gru_embedding_extractor.keras")
SCALER_PATH        = os.path.join(MODEL_DIR, "gru_price_scaler.joblib")

# File to store the real-time tracking logs - in the parent Intent Prediction directory
LOG_FILE_PATH      = os.path.join(os.path.dirname(MODEL_DIR), "live_tracking.csv")
