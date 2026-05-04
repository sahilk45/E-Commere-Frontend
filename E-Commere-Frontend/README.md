# NEXORA — AI-Powered E-Commerce Intent Detection Demo

> A premium e-commerce storefront that silently predicts purchase intent in real time using a Hybrid GRU-XGBoost model, triggering personalized discount offers at statistically optimal moments.

---

## How It Works (For Recruiters & Engineers)

This store tracks browsing behavior **invisibly** and fires intent predictions at 5 fixed time intervals: **84s, 165s, 296s, 611s, and 1084s** into a session.

At each interval, 11 behavioral features are computed entirely client-side:

| Feature | Description |
|---|---|
| `total_views_so_far` | Count of product view events |
| `unique_cat1_seen` | Unique top-level categories browsed |
| `avg_price_seen` | Mean price of viewed products |
| `brand_switches` | Number of distinct brands explored |
| `duration_so_far_seconds` | Session duration at snapshot |
| `live_focus_ratio` | Views ÷ unique products (focus signal) |
| `budget_exploration_so_far` | Price range explored (max − min, capped 1000) |
| `rolling_views_per_minute` | Browsing velocity |
| `idle_time_seconds` | Seconds since last interaction |
| `category_scatter_ratio` | Category diversity ratio |
| `snapshot_time` | Which of the 5 checkpoints fired |

These features are sent to a **FastAPI backend** running a **Hybrid GRU-XGBoost model** (ROC-AUC: 0.839).

When the predicted purchase intent probability crosses **53.6%**, a personalized discount notification slides up automatically — showing a category-specific code and the last 3 products the user considered.

### Behavioral Signals Also Captured
- **Scroll impressions**: IntersectionObserver fires a view event when a product card enters the viewport (50% threshold)
- **Time-on-product**: If a product modal is open for > 8 seconds, an additional view event is recorded on close (deep re-engagement signal)
- **Quick Add**: Direct cart events from the grid (no modal open) signal high-confidence intent

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite 5 + Tailwind CSS v3 |
| **HTTP Client** | Axios |
| **Design System** | Stitch (Google) — Nexora Editorial System |
| **Backend** | FastAPI (Python) |
| **ML Model** | Hybrid GRU-XGBoost |
| **DL Framework** | TensorFlow / Keras (GRU embedding extractor) |
| **Boosting** | XGBoost |

---

## Project Structure

```
nexora-store/
├── src/
│   ├── lib/
│   │   ├── tracker.js        # SessionTracker class — pure JS, no React
│   │   └── api.js            # predictIntent() + mock fallback
│   ├── hooks/
│   │   ├── useTracker.jsx    # TrackerProvider + useTrackerContext
│   │   ├── useSnapshots.js   # Interval engine — fires at 5 snapshot times
│   │   └── useCart.js        # Cart state + discount application
│   ├── components/
│   │   ├── layout/           # Header (scroll + cart animation), Footer, CartSidebar
│   │   ├── product/          # ProductGrid, ProductCard, ProductModal
│   │   └── ui/               # DiscountNotification, SkeletonCard
│   ├── data/products.js      # 8 real products with Unsplash images
│   └── App.jsx               # Root — wires all hooks and components
├── .env                      # VITE_API_URL=http://localhost:8000
└── README.md
```

---

## Running Locally

### Frontend
```bash
cd nexora-store
npm install
npm run dev
# → http://localhost:5173
```

### Backend (FastAPI)
```bash
# Set API URL in .env
VITE_API_URL=http://localhost:8000

# If backend is unreachable, mock mode activates automatically.
# Check browser console for:
#   [NEXORA] Backend unreachable — mock mode active
#   [NEXORA] API contract: { ...payload }
```

### Mock Mode
The frontend works **fully offline** with a realistic mock predictor. The mock formula weights:
- Views (×0.055 per view)
- Focus ratio bonus (+0.14 if ratio > 1.5)
- Category scatter bonus (+0.12 if scatter < 0.4)
- Brand loyalty bonus (+0.13 if ≤ 2 brands)
- Recency bonus (±0.04 based on idle time)
- Random noise (±0.035 for realism)

---

## API Contract

```
POST http://localhost:8000/predict

Content-Type: application/json

Response:
{
  "probability": 0.72,   // 0.0 – 1.0
  "prediction": 1        // 0 = no intent, 1 = purchase intent
}
```

See `src/lib/api.js` for the full documented request schema.

---

## Model Performance

| Metric | Value |
|---|---|
| ROC-AUC | 0.839 |
| Decision Threshold | 0.536 |
| Precision | 0.71 |
| Recall | 0.68 |

---

*Built as a full-stack AI/ML product demonstration. Frontend design from Stitch (Google). Model trained on e-commerce session data.*
