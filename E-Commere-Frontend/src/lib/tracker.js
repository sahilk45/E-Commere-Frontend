export class SessionTracker {
  constructor() {
    this.sessionId = this._generateSessionId();
    this.sessionStartTime = null;
    this.events = [];
    this.viewEvents = []; // only view events for GRU sequence
  }

  _generateSessionId() {
    return 'nxr-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
  }

  _getElapsed() {
    if (!this.sessionStartTime) return 0;
    return (Date.now() - this.sessionStartTime) / 1000;
  }

  recordView(product) {
    if (!this.sessionStartTime) this.sessionStartTime = Date.now();
    const elapsed = this._getElapsed();
    const event = {
      eventType: 'view',
      productId: product.id,
      price: product.price,
      brand: product.brand.toLowerCase(),
      categoryCode: product.category,
      cat1: product.cat1,
      cat2: product.cat2,
      timestampSeconds: elapsed,
    };
    this.events.push(event);
    this.viewEvents.push(event);
  }

  recordCart(product) {
    if (!this.sessionStartTime) this.sessionStartTime = Date.now();
    const elapsed = this._getElapsed();
    this.events.push({
      eventType: 'cart',
      productId: product.id,
      price: product.price,
      brand: product.brand.toLowerCase(),
      categoryCode: product.category,
      cat1: product.cat1,
      timestampSeconds: elapsed
    });
  }

  computeTabularFeatures(snapshotTime) {
    const allEvents = this.events.filter(e => e.timestampSeconds <= snapshotTime);
    if (allEvents.length === 0) return null;

    // total_views_so_far uses ONLY the count of view events
    const totalViews = allEvents.filter(e => e.eventType === 'view').length;

    // Training notebook aggregates the rest over ALL events (views + carts)
    const prices = allEvents.map(e => e.price);
    const uniqueProducts = new Set(allEvents.map(e => e.productId));
    const uniqueBrands = new Set(allEvents.map(e => e.brand));
    const uniqueCat1 = new Set(allEvents.map(e => e.cat1));
    const lastEvent = allEvents[allEvents.length - 1]; // last action is the very last event

    const uniqueProductCount = Math.max(uniqueProducts.size, 1);
    const elapsed = snapshotTime;
    const elapsedMinutes = elapsed / 60;

    return {
      total_views_so_far: totalViews,
      unique_cat1_seen: uniqueCat1.size,
      avg_price_seen: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      brand_switches: uniqueBrands.size,
      duration_so_far_seconds: elapsed,
      live_focus_ratio: totalViews / uniqueProductCount,
      budget_exploration_so_far: prices.length > 0 ? Math.min(
        Math.max(...prices) - Math.min(...prices), 1000
      ) : 0,
      rolling_views_per_minute: elapsedMinutes > 0 ? totalViews / elapsedMinutes : 0,
      idle_time_seconds: elapsed - lastEvent.timestampSeconds,
      category_scatter_ratio: uniqueCat1.size / uniqueProductCount,
      unknown_cat_ratio: 0,
      snapshot_time: snapshotTime,
      // metadata for notification logic
      _dominantCat1: uniqueCat1.size > 0 ? [...uniqueCat1].reduce((a, b) =>
        allEvents.filter(e => e.cat1 === a).length >= allEvents.filter(e => e.cat1 === b).length ? a : b
      ) : '',
      _recentProducts: allEvents.slice(-3).map(e => e.productId)
    };
  }

  computeGRUSequence(snapshotTime) {
    // Training (GRUs_Actual.ipynb):
    //   - Only VIEW events kept (cart/purchase stripped before diff)
    //   - gap = diff() between consecutive VIEWS, fillna(0) for first
    //   - scaled_price = log1p(price) * MinMaxScaler.scale_[0] = 0.12732962
    //   - padding='post', truncating='pre' (keep most recent 15)
    const views = this.viewEvents.filter(e => e.timestampSeconds <= snapshotTime);
    const last15 = views.slice(-15);  // truncating='pre'

    const sequence = last15.map((event, idx) => {
      const logPrice = Math.log1p(event.price);
      const scaledPrice = logPrice * 0.12732962;  // MinMaxScaler.scale_[0] from gru_price_scaler.joblib

      // Matches pandas .diff().fillna(0):
      //   first view → 0, subsequent → view[i].t - view[i-1].t
      const gap = idx === 0 ? 0 : (event.timestampSeconds - last15[idx - 1].timestampSeconds);
      const logGap = Math.log1p(gap);

      return [Math.max(0, Math.min(1, scaledPrice)), logGap];
    });

    // padding='post'
    while (sequence.length < 15) sequence.push([0, 0]);
    return sequence;
  }

  reset() {
    this.sessionId = this._generateSessionId();
    this.sessionStartTime = null;
    this.events = [];
    this.viewEvents = [];
  }

  get hasStarted() { return this.sessionStartTime !== null; }
  get elapsedSeconds() { return this._getElapsed(); }
}
