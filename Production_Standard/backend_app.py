import os
import csv
import numpy as np
from datetime import datetime
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

import xgboost as xgb
import tensorflow as tf

from backend_config import XGBOOST_MODEL_PATH, GRU_MODEL_PATH, LOG_FILE_PATH

# ─── Initialize Application ──────────────────────────────────────────
app = FastAPI(title="Nexora Real-Time Inference Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow frontend to connect
    allow_methods=["POST"],
    allow_headers=["*"],
)

# ─── Load Models ───────────────────────────────────────────────────
import zipfile
import tempfile
import h5py
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, GRU, Masking, BatchNormalization
from tensorflow.keras.regularizers import l2

print("Loading Keras GRU Model robustly (h5py)...")

# 1. Extract weights
tmpdir = tempfile.mkdtemp()
with zipfile.ZipFile(GRU_MODEL_PATH, "r") as z:
    z.extractall(tmpdir)
w_path = os.path.join(tmpdir, "model.weights.h5")

# 2. Rebuild Architecture
inp    = Input(shape=(15, 2), name="sequence_input")
masked = Masking(mask_value=0.0, name="masking")(inp)
gru1   = GRU(64, return_sequences=True, recurrent_dropout=0.2,
              reset_after=True, kernel_regularizer=l2(1e-4), name="gru")(masked)
bn     = BatchNormalization(momentum=0.99, epsilon=0.001,
                             name="batch_normalization")(gru1)
gru2   = GRU(32, return_sequences=False, recurrent_dropout=0.2,
              reset_after=True, kernel_regularizer=l2(1e-4), name="gru_1")(bn)
gru_model = Model(inputs=inp, outputs=gru2, name="GRU_Embedding_Extractor")

# 3. Load Weights
with h5py.File(w_path, "r") as wf:
    g = wf["layers"]["gru"]["cell"]["vars"]
    gru_model.get_layer("gru").cell.kernel           = tf.Variable(g["0"][:])
    gru_model.get_layer("gru").cell.recurrent_kernel = tf.Variable(g["1"][:])
    gru_model.get_layer("gru").cell.bias             = tf.Variable(g["2"][:])

    g2 = wf["layers"]["gru_1"]["cell"]["vars"]
    gru_model.get_layer("gru_1").cell.kernel           = tf.Variable(g2["0"][:])
    gru_model.get_layer("gru_1").cell.recurrent_kernel = tf.Variable(g2["1"][:])
    gru_model.get_layer("gru_1").cell.bias             = tf.Variable(g2["2"][:])

    bn_vars = wf["layers"]["batch_normalization"]["vars"]
    bn_layer = gru_model.get_layer("batch_normalization")
    bn_layer.gamma        = tf.Variable(bn_vars["0"][:])
    bn_layer.beta         = tf.Variable(bn_vars["1"][:])
    bn_layer.moving_mean  = tf.Variable(bn_vars["2"][:])
    bn_layer.moving_variance = tf.Variable(bn_vars["3"][:])

gru_model.trainable = False

print("Loading XGBoost Model...")
xgb_model = xgb.Booster()
xgb_model.load_model(XGBOOST_MODEL_PATH)

print("✅ All models loaded successfully.")

# ─── Data Models ───────────────────────────────────────────────────
class PredictPayload(BaseModel):
    tabular_features: Dict[str, Any]
    gru_sequence: List[List[float]]

# ─── Feature Ordering (MUST Match Training) ────────────────────────
FEATURE_COLS = [
    'total_views_so_far', 'unique_cat1_seen', 'avg_price_seen',
    'brand_switches', 'duration_so_far_seconds', 'live_focus_ratio',
    'budget_exploration_so_far', 'rolling_views_per_minute',
    'idle_time_seconds', 'category_scatter_ratio', 'unknown_cat_ratio'
]

# ─── Background Logger ─────────────────────────────────────────────
def log_prediction(session_id: str, snapshot_time: float, probability: float):
    file_exists = os.path.exists(LOG_FILE_PATH)
    with open(LOG_FILE_PATH, "a", newline="") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["Time", "Session", "Snapshot", "Probability"])
        
        # Round time slightly so it looks clean on charts
        writer.writerow([
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            session_id,
            snapshot_time,
            round(probability, 4)
        ])

# ─── API Endpoint ──────────────────────────────────────────────────
@app.post("/predict")
async def predict_intent(payload: PredictPayload, background_tasks: BackgroundTasks):
    # 1. Process GRU Sequence
    # Expected shape: (1, 15, 2)
    seq_array = np.array([payload.gru_sequence], dtype=np.float32)
    gru_embeddings = gru_model.predict(seq_array, verbose=0)[0]  # shape (32,)

    # 2. Extract Tabular Features in Exact Order
    tab_data = payload.tabular_features
    tab_array = np.array([tab_data.get(col, 0.0) for col in FEATURE_COLS])
    
    # 3. Concatenate (Tabular first, then GRU embeddings)
    # Total features: 11 + 32 = 43
    final_vector = np.concatenate([tab_array, gru_embeddings]).reshape(1, -1)
    
    # 4. Predict with XGBoost
    # Construct the exact feature names the model expects
    all_feature_names = FEATURE_COLS + [f'gru_emb_{i}' for i in range(32)]
    
    # Pass the feature names to DMatrix so XGBoost doesn't complain
    dmatrix = xgb.DMatrix(final_vector, feature_names=all_feature_names)
    prob = float(xgb_model.predict(dmatrix)[0])
    
    # --- CALIBRATION SCALAR ---
    # Multiply raw compressed probabilities to map them back to real-world percentages
    CALIBRATION_SCALAR = 3.5
    prob = min(prob * CALIBRATION_SCALAR, 0.999)
    # 5. Extract Session Data for Logging
    session_id    = tab_data.get("session_id", f"user-{datetime.now().strftime('%M%S')}")
    snapshot_time = tab_data.get("snapshot_time", 0)
    
    # 6. Log async so it doesn't block the API response
    background_tasks.add_task(log_prediction, session_id, snapshot_time, prob)
    
    # ─── DIAGNOSTIC: print the full received payload ─────────────────
    print(f"\n{'='*60}")
    print(f"[PREDICTION] Snapshot: {snapshot_time}s | Prob: {prob:.4f} | Session: {str(session_id)[-8:]}")
    print(f"  Tabular Features Received:")
    for col in FEATURE_COLS:
        print(f"    {col:<35} = {tab_data.get(col, 'MISSING')}")
    print(f"  GRU Sequence (first 5 non-zero steps):")
    seq = payload.gru_sequence
    shown = 0
    for i, step in enumerate(seq):
        if step[0] != 0.0 or step[1] != 0.0:
            print(f"    step[{i:02d}]: price={step[0]:.6f}  gap={step[1]:.6f}")
            shown += 1
        if shown >= 5:
            break
    real_steps = sum(1 for s in seq if s[0] != 0.0 or s[1] != 0.0)
    print(f"  Real GRU steps (non-zero): {real_steps} / 15")
    print(f"{'='*60}\n")

    return {
        "success": True,
        "probability": prob,
        "prediction": 1 if prob >= 0.35 else 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend_app:app", host="0.0.0.0", port=8000, reload=True)
