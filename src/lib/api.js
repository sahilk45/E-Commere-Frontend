import axios from "axios";

/*
 * NEXORA INTENT PREDICTION API CONTRACT
 * ======================================
 * POST /predict
 *
 * Request (11 tabular features — computed client-side by SessionTracker):
 * {
 *   total_views_so_far:          number,  // count of view events in session
 *   unique_cat1_seen:            number,  // unique top-level categories viewed
 *   avg_price_seen:              number,  // mean price of viewed products
 *   brand_switches:              number,  // unique brands seen
 *   duration_so_far_seconds:     number,  // snapshot time (84/165/296/611/1084)
 *   live_focus_ratio:            number,  // views / unique products
 *   budget_exploration_so_far:   number,  // max_price - min_price (clipped 0–1000)
 *   rolling_views_per_minute:    number,  // views per minute at snapshot
 *   idle_time_seconds:           number,  // seconds since last view event
 *   category_scatter_ratio:      number,  // unique_cats / unique_products
 *   unknown_cat_ratio:           number,  // always 0 (all products are categorized)
 *   snapshot_time:               number   // which snapshot fired (84/165/296/611/1084)
 * }
 *
 * Backend model stack:
 *   - Primary:  hybrid_xgb.json           (XGBoost, tabular features)
 *   - Auxiliary: gru_embedding_extractor.keras (GRU, 15-step price+gap sequence)
 *   - Fusion:   GRU embedding concatenated into XGBoost feature vector
 *   - Backend may compute GRU sequence from its own session state,
 *     OR accept tabular-only mode for fast inference without GRU.
 *
 * Response:
 * {
 *   probability: number,   // 0.0 – 1.0 (purchase intent score)
 *   prediction:  0 | 1    // 0 = no intent, 1 = purchase intent detected
 * }
 *
 * Decision threshold: 0.536 (optimized for F1 on validation set)
 * Model performance:  ROC-AUC 0.839, Precision 0.71, Recall 0.68
 *
 * CORS (FastAPI setup):
 *   from fastapi.middleware.cors import CORSMiddleware
 *   app.add_middleware(CORSMiddleware,
 *     allow_origins=["http://localhost:5173", "https://your-domain.com"],
 *     allow_methods=["POST"], allow_headers=["*"])
 *
 * Client fires at: 84s, 165s, 296s, 611s, 1084s into session
 * If backend unreachable: mock mode activates (see console for payload log)
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const predictIntent = async (payload) => {
  try {
    const { data } = await axios.post(
      `${BASE_URL}/predict`, payload,
      { timeout: 5000, headers: { "Content-Type": "application/json" } }
    );
    return { success: true, data };
  } catch (err) {
    console.warn("[NEXORA] Backend unreachable — mock mode active");
    console.log("[NEXORA] API contract:", JSON.stringify(payload, null, 2));
    const views   = payload.total_views_so_far  || 1;
    const focus   = payload.live_focus_ratio     || 1;
    const scatter = payload.category_scatter_ratio || 1;
    const brands  = payload.brand_switches       || 4;
    const idle    = payload.idle_time_seconds    || 0;
    const mockProb = Math.min(0.94,
      0.10
      + (views   * 0.055)
      + (focus  > 1.5  ? 0.14 : 0)
      + (scatter < 0.4  ? 0.12 : 0)
      + (brands <= 2    ? 0.13 : 0)
      + (idle   < 30    ? 0.06 : -0.04)
      + (Math.random()  * 0.07)
    );
    return {
      success: false,
      mock: true,
      data: { probability: mockProb, prediction: mockProb >= 0.536 ? 1 : 0 }
    };
  }
};
