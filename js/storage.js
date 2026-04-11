const MQStorage = {
  keys: {
    user: 'mq_user',
    scores: 'mq_scores',
    attempts: 'mq_attempts',
    logs: 'mq_logs',
    settings: 'mq_settings',
    streak: 'mq_streak'
  },

  _get(k, fallback) {
    try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; }
  },
  _set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },

  getUser() { return this._get(this.keys.user, null); },
  setUser(v) { this._set(this.keys.user, v); },

  getScores() {
    const v = this._get(this.keys.scores, null);
    if (v) return v;
    const init = Object.fromEntries(MQData.competencies.map(c => [c.id, 45]));
    this._set(this.keys.scores, init);
    return init;
  },
  setScores(v) { this._set(this.keys.scores, v); },

  getAttempts() { return this._get(this.keys.attempts, []); },
  addAttempt(v) { const a = this.getAttempts(); a.unshift(v); this._set(this.keys.attempts, a); },

  getLogs() { return this._get(this.keys.logs, []); },
  addLog(v) { const logs = this.getLogs(); logs.unshift(v); this._set(this.keys.logs, logs); },

  getSettings() { return this._get(this.keys.settings, { metaphorMode:'rpg', notifyTime:'08:30' }); },
  setSettings(v) { this._set(this.keys.settings, v); },

  updateStreak() {
    const t = new Date().toISOString().slice(0,10);
    const s = this._get(this.keys.streak, { count:0, last:'' });
    if (s.last === t) return s.count;
    const y = new Date(Date.now()-86400000).toISOString().slice(0,10);
    s.count = s.last === y ? s.count + 1 : 1;
    s.last = t;
    this._set(this.keys.streak, s);
    return s.count;
  }
};
