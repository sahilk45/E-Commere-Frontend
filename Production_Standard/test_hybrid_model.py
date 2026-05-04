import os, zipfile, tempfile, time, warnings
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")
os.environ["TF_CPP_MIN_LOG_LEVEL"]  = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

PROD_DIR       = os.path.dirname(os.path.abspath(__file__))
SNAPSHOT_TIMES = [84, 165, 296, 611, 1084]
MAX_STEPS      = 15

print("=" * 70)
print("  LOADING PRODUCTION ARTIFACTS")
print("=" * 70)

# Price scaler (MinMaxScaler over log1p(price))
from sklearn.preprocessing import MinMaxScaler
price_scaler = MinMaxScaler()
price_scaler.data_min_      = np.array([0.0])
price_scaler.data_max_      = np.array([7.824])
price_scaler.data_range_    = np.array([7.824])
price_scaler.scale_         = np.array([1.0 / 7.824])
price_scaler.min_           = np.array([0.0])
price_scaler.n_features_in_ = 1
price_scaler.n_samples_seen_= 1
print("  [OK] Price scaler reconstructed (log1p, 0-7.824)")

# ─── GRU: rebuild + load weights by h5 path ──────────────────────────────────
t0 = time.time()
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, GRU, Masking, BatchNormalization
from tensorflow.keras.regularizers import l2
import h5py

gru_path = os.path.join(PROD_DIR, "gru_embedding_extractor.keras")

# Extract the weights file from the .keras archive
tmpdir = tempfile.mkdtemp()
with zipfile.ZipFile(gru_path, "r") as z:
    z.extractall(tmpdir)
w_path = os.path.join(tmpdir, "model.weights.h5")

# Rebuild architecture exactly as saved
inp    = Input(shape=(MAX_STEPS, 2), name="sequence_input")
masked = Masking(mask_value=0.0, name="masking")(inp)
gru1   = GRU(64, return_sequences=True, recurrent_dropout=0.2,
              reset_after=True, kernel_regularizer=l2(1e-4), name="gru")(masked)
bn     = BatchNormalization(momentum=0.99, epsilon=0.001,
                             name="batch_normalization")(gru1)
gru2   = GRU(32, return_sequences=False, recurrent_dropout=0.2,
              reset_after=True, kernel_regularizer=l2(1e-4), name="gru_1")(bn)
gru_model = Model(inputs=inp, outputs=gru2, name="GRU_Embedding_Extractor")

# Load weights by direct h5 path assignment (bypasses Keras version checks)
with h5py.File(w_path, "r") as wf:
    # GRU layer 1: kernel(2,192), recurrent_kernel(64,192), bias(2,192)
    g = wf["layers"]["gru"]["cell"]["vars"]
    gru_model.get_layer("gru").cell.kernel           = tf.Variable(g["0"][:])
    gru_model.get_layer("gru").cell.recurrent_kernel = tf.Variable(g["1"][:])
    gru_model.get_layer("gru").cell.bias             = tf.Variable(g["2"][:])

    # GRU layer 2: kernel(64,96), recurrent_kernel(32,96), bias(2,96)
    g2 = wf["layers"]["gru_1"]["cell"]["vars"]
    gru_model.get_layer("gru_1").cell.kernel           = tf.Variable(g2["0"][:])
    gru_model.get_layer("gru_1").cell.recurrent_kernel = tf.Variable(g2["1"][:])
    gru_model.get_layer("gru_1").cell.bias             = tf.Variable(g2["2"][:])

    # BatchNorm: gamma(64), beta(64), moving_mean(64), moving_var(64)
    bn_vars = wf["layers"]["batch_normalization"]["vars"]
    bn_layer = gru_model.get_layer("batch_normalization")
    bn_layer.gamma        = tf.Variable(bn_vars["0"][:])
    bn_layer.beta         = tf.Variable(bn_vars["1"][:])
    bn_layer.moving_mean  = tf.Variable(bn_vars["2"][:])
    bn_layer.moving_variance = tf.Variable(bn_vars["3"][:])

gru_model.trainable = False
gru_load_ms = (time.time() - t0) * 1000
print(f"  [OK] GRU rebuilt + weights loaded in {gru_load_ms:.0f} ms")
print(f"       Input: (None, {MAX_STEPS}, 2)  Output: (None, 32)")

# ─── XGBoost ─────────────────────────────────────────────────────────────────
import xgboost as xgb
t0 = time.time()
xgb_booster = xgb.Booster()
xgb_booster.load_model(os.path.join(PROD_DIR, "hybrid_xgb.json"))
xgb_load_ms = (time.time() - t0) * 1000
FEAT_NAMES  = xgb_booster.feature_names
print(f"  [OK] XGBoost loaded in {xgb_load_ms:.0f} ms  |  Features: {len(FEAT_NAMES)}")
print(f"       Tabular (11): {FEAT_NAMES[:11]}")

TOTAL_LOAD_MS = gru_load_ms + xgb_load_ms
print(f"\n  Total startup cost: {TOTAL_LOAD_MS:.0f} ms\n")


# ─────────────────────────────────────────────────────────────────────────────
class Session:
    def __init__(self, sid):
        self.sid             = sid
        self.last_t          = 0.0
        self.total_views     = 0
        self.total_events    = 0
        self.unknown_cat_cnt = 0
        self.products = set(); self.cats = set(); self.brands = set()
        self.max_p = 0.0;  self.min_p = float("inf")
        self.p_sum = 0.0;  self.p_cnt = 0
        self.gru_seq = []

    def add(self, t, etype, pid, price, brand, cat_code):
        brand    = brand    or "UNKNOWN_BRAND"
        cat_code = cat_code or "UNKNOWN"
        cat1     = cat_code.split(".")[0]
        self.total_events += 1
        if etype == "view":
            self.total_views += 1
            self.products.add(pid); self.brands.add(brand); self.cats.add(cat1)
            if cat1 == "UNKNOWN": self.unknown_cat_cnt += 1
            self.max_p = max(self.max_p, price)
            self.min_p = min(self.min_p, price)
            self.p_sum += price; self.p_cnt += 1
            lp  = float(np.log1p(price))
            sp  = float(price_scaler.transform([[lp]])[0][0])
            gap = float(np.log1p(t - self.last_t))
            self.gru_seq.append([sp, gap])
        self.last_t = t

    def features(self, snap_t):
        up   = max(len(self.products), 1)
        uc   = len(self.cats)
        avgp = self.p_sum / self.p_cnt if self.p_cnt else 0.0
        em   = max(snap_t / 60.0, 1e-6)
        return {
            "total_views_so_far"       : float(self.total_views),
            "unique_cat1_seen"         : float(uc),
            "avg_price_seen"           : avgp,
            "brand_switches"           : float(len(self.brands)),
            "duration_so_far_seconds"  : float(snap_t),
            "live_focus_ratio"         : self.total_views / up,
            "budget_exploration_so_far": float(np.clip(self.max_p - self.min_p, 0, 1000)),
            "rolling_views_per_minute" : self.total_views / em,
            "idle_time_seconds"        : max(snap_t - self.last_t, 0.0),
            "category_scatter_ratio"   : uc / up,
            "unknown_cat_ratio"        : self.unknown_cat_cnt / max(self.total_events, 1),
        }


def infer(sess, snap_t):
    t0  = time.perf_counter()
    tab = sess.features(snap_t)
    seq = sess.gru_seq[-MAX_STEPS:]
    arr = np.array(seq, dtype=np.float32)
    pad = MAX_STEPS - len(arr)
    if pad > 0:
        arr = np.vstack([arr, np.zeros((pad, 2), dtype=np.float32)])
    arr  = np.nan_to_num(arr.reshape(1, MAX_STEPS, 2), nan=0.0)
    emb  = gru_model.predict(arr, verbose=0)[0]
    ed   = {f"gru_emb_{i}": float(emb[i]) for i in range(32)}
    vec  = [{**tab, **ed}[n] for n in FEAT_NAMES]
    dmat = xgb.DMatrix([vec], feature_names=FEAT_NAMES)
    prob = float(xgb_booster.predict(dmat)[0])
    lat  = (time.perf_counter() - t0) * 1000
    return prob, lat, tab


def action(p):
    if p >= 0.80: return "SHOW_DISCOUNT      [FIRE]"
    if p >= 0.55: return "SHOW_SOCIAL_PROOF  [CHAT]"
    if p >= 0.35: return "SHOW_RELATED_ITEMS [EYES]"
    return "DO_NOTHING         [X]"


# ─────────────────────────────────────────────────────────────────────────────
SCENARIOS = {
    "S1": {"label": "S1  Window Shopper   (No Purchase)", "truth": 0,
        "events": [
            (10,"view","p01",  59.99,"xiaomi",  "electronics.smartphone"),
            (25,"view","p02", 499.00,"apple",   "electronics.laptop"),
            (45,"view","p03",  29.99,"hm",      "clothing.women.tops"),
            (70,"view","p04",1299.0, "samsung", "electronics.tv"),
            (90,"view","p05",  89.99,"adidas",  "footwear.sneakers"),
            (120,"view","p06", 15.00,"zara",    "clothing.men.shirts"),
            (150,"view","p07",799.00,"sony",    "electronics.camera"),
            (200,"view","p08",249.00,"lg",      "electronics.tablet"),
            (270,"view","p09", 55.00,"reebok",  "footwear.running"),
            (310,"view","p10",999.00,"dyson",   "home.appliances"),
            (420,"view","p11", 35.00,"levis",   "clothing.men.jeans"),
            (500,"view","p12",199.00,"bose",    "electronics.audio"),
            (620,"view","p13", 45.00,"nike",    "footwear.casual"),
            (800,"view","p14",650.00,"canon",   "electronics.camera"),
            (900,"view","p15", 75.00,"puma",    "footwear.sports")]},
    "S2": {"label": "S2  Focused Buyer     (Purchase)", "truth": 1,
        "events": [
            (  8,"view",    "p21",899.0,"samsung","electronics.smartphone"),
            ( 22,"view",    "p22",849.0,"samsung","electronics.smartphone"),
            ( 40,"view",    "p21",899.0,"samsung","electronics.smartphone"),
            ( 55,"view",    "p23",929.0,"samsung","electronics.smartphone"),
            ( 70,"view",    "p21",899.0,"samsung","electronics.smartphone"),
            (100,"view",    "p22",849.0,"samsung","electronics.smartphone"),
            (140,"view",    "p21",899.0,"samsung","electronics.smartphone"),
            (175,"view",    "p21",899.0,"samsung","electronics.smartphone"),
            (210,"cart",    "p21",899.0,"samsung","electronics.smartphone"),
            (250,"view",    "p21",899.0,"samsung","electronics.smartphone"),
            (290,"view",    "p21",899.0,"samsung","electronics.smartphone"),
            (340,"view",    "p21",899.0,"samsung","electronics.smartphone"),
            (400,"view",    "p21",899.0,"samsung","electronics.smartphone"),
            (500,"view",    "p21",899.0,"samsung","electronics.smartphone"),
            (600,"purchase","p21",899.0,"samsung","electronics.smartphone")]},
    "S3": {"label": "S3  Cart Abandoner   (No Purchase)", "truth": 0,
        "events": [
            (  5,"view","p31",120.0,"nike","footwear.shoes.running"),
            ( 18,"view","p32",115.0,"nike","footwear.shoes.running"),
            ( 30,"view","p31",120.0,"nike","footwear.shoes.running"),
            ( 45,"view","p33",130.0,"nike","footwear.shoes.running"),
            ( 60,"view","p31",120.0,"nike","footwear.shoes.running"),
            ( 75,"cart","p31",120.0,"nike","footwear.shoes.running"),
            (700,"view","p99", 10.0,"zara","clothing.men.shirts")]},
    "S4": {"label": "S4  Impulse Buyer     (Purchase)", "truth": 1,
        "events": [
            ( 3,"view",    "p41", 9.99,"unbranded","UNKNOWN"),
            ( 8,"view",    "p42",14.99,"unbranded","UNKNOWN"),
            (12,"view",    "p43",12.99,"unbranded","UNKNOWN"),
            (18,"view",    "p44",19.99,"unbranded","UNKNOWN"),
            (22,"view",    "p45",24.99,"unbranded","UNKNOWN"),
            (28,"purchase","p43",12.99,"unbranded","UNKNOWN"),
            (200,"view",   "p46", 8.99,"unbranded","UNKNOWN"),
            (210,"view",   "p47",11.99,"unbranded","UNKNOWN"),
            (220,"purchase","p46",8.99,"unbranded","UNKNOWN")]},
    "S5": {"label": "S5  Research Buyer    (Purchase)", "truth": 1,
        "events": [
            (  15,"view",    "p51",1199.0,"dell",  "electronics.laptop"),
            (  80,"view",    "p52",1099.0,"lenovo","electronics.laptop"),
            ( 165,"view",    "p51",1199.0,"dell",  "electronics.laptop"),
            ( 250,"view",    "p53",1249.0,"dell",  "electronics.laptop"),
            ( 295,"view",    "p51",1199.0,"dell",  "electronics.laptop"),
            ( 380,"view",    "p52",1099.0,"lenovo","electronics.laptop"),
            ( 470,"view",    "p51",1199.0,"dell",  "electronics.laptop"),
            ( 560,"view",    "p51",1199.0,"dell",  "electronics.laptop"),
            ( 620,"view",    "p51",1199.0,"dell",  "electronics.laptop"),
            ( 700,"view",    "p51",1199.0,"dell",  "electronics.laptop"),
            ( 800,"view",    "p51",1199.0,"dell",  "electronics.laptop"),
            ( 900,"view",    "p51",1199.0,"dell",  "electronics.laptop"),
            ( 970,"cart",    "p51",1199.0,"dell",  "electronics.laptop"),
            (1050,"purchase","p51",1199.0,"dell",  "electronics.laptop")]},
}

# ─────────────────────────────────────────────────────────────────────────────
print("=" * 70)
print("  SCENARIO RESULTS")
print("=" * 70)

all_results   = {}
all_latencies = []

for key, sc in SCENARIOS.items():
    print(f"\n  {sc['label']}")
    print(f"  Truth: {'PURCHASE' if sc['truth'] else 'NO PURCHASE'}")
    print(f"  {'Snapshot':>10} | {'P(buy)':>7} | {'Action':<30} | Latency")
    print("  " + "-" * 68)
    rows = []
    for snap_t in SNAPSHOT_TIMES:
        sess = Session(key)
        for ev in sc["events"]:
            t, etype, pid, price, brand, cat = ev
            if t <= snap_t:
                sess.add(t, etype, pid, price, brand, cat)
        if sess.total_views == 0:
            print(f"  {snap_t:>9}s | {'N/A':>7} | {'No views yet':<30} | -")
            rows.append({"snap": snap_t, "prob": None, "lat": 0, "tab": {}})
            continue
        prob, lat, tab = infer(sess, snap_t)
        all_latencies.append(lat)
        rows.append({"snap": snap_t, "prob": prob, "lat": lat, "tab": tab})
        print(f"  {snap_t:>9}s | {prob:>7.4f} | {action(prob):<30} | {lat:>7.1f} ms")
    all_results[key] = rows

# ─────────────────────────────────────────────────────────────────────────────
print()
print("=" * 70)
print("  KEY FEATURES AT EACH SNAPSHOT")
print("=" * 70)

for key, sc in SCENARIOS.items():
    print(f"\n  {sc['label']}")
    print(f"  {'Snap':>6} | {'Prob':>6} | {'Views':>5} | {'Cats':>4} | {'Brands':>6} | {'AvgP$':>7} | {'Scatter':>7} | {'Budget':>7} | {'Idle_s':>6} | {'Unk%':>5}")
    print("  " + "-" * 82)
    for r in all_results[key]:
        snap = r["snap"]
        if r["prob"] is None:
            print(f"  {snap:>5}s |    N/A |     - |    - |      - |       - |       - |       - |      - |     -")
            continue
        t = r["tab"]
        print(f"  {snap:>5}s | {r['prob']:>6.4f}"
              f" | {t['total_views_so_far']:>5.0f}"
              f" | {t['unique_cat1_seen']:>4.0f}"
              f" | {t['brand_switches']:>6.0f}"
              f" | {t['avg_price_seen']:>7.2f}"
              f" | {t['category_scatter_ratio']:>7.3f}"
              f" | {t['budget_exploration_so_far']:>7.2f}"
              f" | {t['idle_time_seconds']:>6.1f}"
              f" | {t['unknown_cat_ratio']:>5.2f}")

# ─────────────────────────────────────────────────────────────────────────────
print()
print("=" * 70)
print("  THRESHOLD ANALYSIS  (at last snapshot per scenario)")
print("=" * 70)

last_probs  = {}
last_truths = {}
for key, sc in SCENARIOS.items():
    r = next((x for x in reversed(all_results[key]) if x["prob"] is not None), None)
    if r:
        last_probs[key]  = r["prob"]
        last_truths[key] = sc["truth"]

print(f"\n  Final probabilities:")
for key, prob in last_probs.items():
    tt = last_truths[key]
    print(f"    {SCENARIOS[key]['label']:48s}  P = {prob:.4f}  Truth: {'PURCHASE' if tt else 'NO PURCHASE'}")

print(f"\n  Threshold sweep  (n = {len(last_probs)} scenarios):")
print(f"  {'Threshold':>10} | {'Accuracy':>9} | {'TP':>3} | {'TN':>3} | {'FP':>3} | {'FN':>3} | Note")
print("  " + "-" * 65)
for thr in [0.20, 0.30, 0.35, 0.40, 0.50, 0.55, 0.60, 0.70, 0.80]:
    tp = tn = fp = fn = 0
    for key, prob in last_probs.items():
        pred  = 1 if prob >= thr else 0
        truth = last_truths[key]
        if   pred == 1 and truth == 1: tp += 1
        elif pred == 0 and truth == 0: tn += 1
        elif pred == 1 and truth == 0: fp += 1
        else: fn += 1
    acc  = (tp + tn) / len(last_probs) * 100
    note = "<-- High recall" if thr == 0.35 else ("<-- Balanced (recommended)" if thr == 0.50 else "<-- High precision" if thr == 0.70 else "")
    print(f"  {thr:>10.2f} | {acc:>8.0f}% | {tp:>3} | {tn:>3} | {fp:>3} | {fn:>3} | {note}")

# ─────────────────────────────────────────────────────────────────────────────
print()
print("=" * 70)
print("  INFERENCE LATENCY  (single-sample, CPU)")
print("=" * 70)
if all_latencies:
    lat = np.array(all_latencies)
    print(f"  Predictions timed    : {len(lat)}")
    print(f"  Min                  : {lat.min():.2f} ms")
    print(f"  Max                  : {lat.max():.2f} ms")
    print(f"  Mean                 : {lat.mean():.2f} ms")
    print(f"  Median               : {np.median(lat):.2f} ms")
    print(f"  P95                  : {np.percentile(lat, 95):.2f} ms")
    print(f"  P99                  : {np.percentile(lat, 99):.2f} ms")
    print(f"\n  One-time startup     : {TOTAL_LOAD_MS:.0f} ms")
    print(f"  GRU extractor only   : {gru_load_ms:.0f} ms")
    print(f"  XGBoost only         : {xgb_load_ms:.0f} ms")

# ─────────────────────────────────────────────────────────────────────────────
print()
print("=" * 70)
print("  FINAL SCORING  (threshold = 0.50)")
print("=" * 70)
rows_df = []
for key, prob in last_probs.items():
    pred  = 1 if prob >= 0.50 else 0
    truth = last_truths[key]
    rows_df.append({
        "Scenario" : SCENARIOS[key]["label"],
        "P(buy)"   : f"{prob:.4f}",
        "Predicted": "PURCHASE"    if pred  else "NO PURCHASE",
        "Truth"    : "PURCHASE"    if truth else "NO PURCHASE",
        "Result"   : "PASS" if pred == truth else "FAIL",
    })
df = pd.DataFrame(rows_df)
print()
print(df.to_string(index=False))
ok = sum(1 for r in rows_df if r["Result"] == "PASS")
print(f"\n  Accuracy : {ok}/{len(rows_df)} = {ok/len(rows_df)*100:.0f}%")
print()
print("=" * 70)
print("  TEST COMPLETE")
print("=" * 70)
