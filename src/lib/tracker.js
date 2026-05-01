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
      timestampSeconds: elapsed
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
    const views = this.viewEvents.filter(e => e.timestampSeconds <= snapshotTime);
    const allEvents = this.events.filter(e => e.timestampSeconds <= snapshotTime);
    if (views.length === 0) return null;

    const prices = views.map(e => e.price);
    const uniqueProducts = new Set(views.map(e => e.productId));
    const uniqueBrands = new Set(views.map(e => e.brand));
    const uniqueCat1 = new Set(views.map(e => e.cat1));
    const lastView = views[views.length - 1];

    const totalViews = views.length;
    const uniqueProductCount = Math.max(uniqueProducts.size, 1);
    const elapsed = snapshotTime;
    const elapsedMinutes = elapsed / 60;

    return {
      total_views_so_far: totalViews,
      unique_cat1_seen: uniqueCat1.size,
      avg_price_seen: prices.reduce((a, b) => a + b, 0) / prices.length,
      brand_switches: uniqueBrands.size,
      duration_so_far_seconds: elapsed,
      live_focus_ratio: totalViews / uniqueProductCount,
      budget_exploration_so_far: Math.min(
        Math.max(...prices) - Math.min(...prices), 1000
      ),
      rolling_views_per_minute: elapsedMinutes > 0 ? totalViews / elapsedMinutes : 0,
      idle_time_seconds: elapsed - lastView.timestampSeconds,
      category_scatter_ratio: uniqueCat1.size / uniqueProductCount,
      unknown_cat_ratio: 0,
      snapshot_time: snapshotTime,
      // metadata for notification logic
      _dominantCat1: [...uniqueCat1].reduce((a, b) =>
        views.filter(e => e.cat1 === a).length >= views.filter(e => e.cat1 === b).length ? a : b
      ),
      _recentProducts: views.slice(-3).map(e => e.productId)
    };
  }

  computeGRUSequence(snapshotTime) {
    const views = this.viewEvents.filter(e => e.timestampSeconds <= snapshotTime);
    const last15 = views.slice(-15);
    const sequence = last15.map((event, idx) => {
      const logPrice = Math.log1p(event.price);
      const scaledPrice = (logPrice - 4.5) / 2.5; // approx normalization
      const prevTime = idx === 0 ? 0 : last15[idx - 1].timestampSeconds;
      const gap = event.timestampSeconds - prevTime;
      const logGap = Math.log1p(gap);
      return [Math.max(0, Math.min(1, scaledPrice)), logGap];
    });
    // Pre-pad to 15 with [0,0]
    while (sequence.length < 15) sequence.unshift([0, 0]);
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
