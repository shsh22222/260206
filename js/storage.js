/* ===== Self Love App - Storage Manager ===== */

const Storage = {
  KEYS: {
    USER: 'selflove_user',
    JOURNALS: 'selflove_journals',
    STREAK: 'selflove_streak',
    DAILY: 'selflove_daily',
    FAV_AFFIRMATIONS: 'selflove_fav_affirmations',
    CUSTOM_AFFIRMATIONS: 'selflove_custom_affirmations',
    BADGES: 'selflove_badges',
    STATS: 'selflove_stats',
    SETTINGS: 'selflove_settings',
    WEEKLY_CHALLENGE: 'selflove_weekly',
    MIRROR_COUNT: 'selflove_mirror_count',
    CHALLENGE_COUNT: 'selflove_challenge_count'
  },

  _get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  _set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or unavailable
    }
  },

  // ===== User =====
  getUser() {
    return this._get(this.KEYS.USER) || { name: '', firstUse: new Date().toISOString() };
  },

  setUser(user) {
    this._set(this.KEYS.USER, user);
  },

  // ===== Settings =====
  getSettings() {
    return this._get(this.KEYS.SETTINGS) || {
      theme: 'zen',
      reminder: false,
      reminderTime: '08:00'
    };
  },

  setSettings(settings) {
    this._set(this.KEYS.SETTINGS, settings);
  },

  // ===== Today's Key =====
  _todayKey() {
    return new Date().toISOString().split('T')[0];
  },

  // ===== Daily Progress =====
  getDailyProgress() {
    const data = this._get(this.KEYS.DAILY) || {};
    const today = this._todayKey();
    if (!data[today]) {
      data[today] = {
        affirmation: false,
        journal: false,
        challenge: false,
        mirror: false
      };
    }
    return data;
  },

  setDailyTask(task, done) {
    const data = this.getDailyProgress();
    const today = this._todayKey();
    data[today][task] = done;
    this._set(this.KEYS.DAILY, data);
    return data[today];
  },

  getTodayProgress() {
    const data = this.getDailyProgress();
    return data[this._todayKey()] || { affirmation: false, journal: false, challenge: false, mirror: false };
  },

  // ===== Streak =====
  getStreak() {
    return this._get(this.KEYS.STREAK) || {
      current: 0,
      longest: 0,
      lastDate: null
    };
  },

  updateStreak() {
    const streak = this.getStreak();
    const today = this._todayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (streak.lastDate === today) {
      return streak; // Already counted today
    }

    if (streak.lastDate === yesterday) {
      streak.current += 1;
    } else if (streak.lastDate !== today) {
      streak.current = 1;
    }

    streak.lastDate = today;
    if (streak.current > streak.longest) {
      streak.longest = streak.current;
    }

    this._set(this.KEYS.STREAK, streak);
    return streak;
  },

  // ===== XP & Levels =====
  getStats() {
    return this._get(this.KEYS.STATS) || {
      xp: 0,
      level: 1,
      totalDays: 0,
      totalAffirmations: 0,
      totalChallenges: 0,
      totalMirrorSessions: 0
    };
  },

  addXP(amount) {
    const stats = this.getStats();
    stats.xp += amount;

    // Level calculation: each level requires (level * 100) XP
    let xpForNext = stats.level * 100;
    let leveledUp = false;

    while (stats.xp >= xpForNext) {
      stats.xp -= xpForNext;
      stats.level += 1;
      xpForNext = stats.level * 100;
      leveledUp = true;
    }

    this._set(this.KEYS.STATS, stats);
    return { stats, leveledUp };
  },

  incrementStat(key) {
    const stats = this.getStats();
    if (stats[key] !== undefined) {
      stats[key] += 1;
    }
    this._set(this.KEYS.STATS, stats);
    return stats;
  },

  // ===== Journals =====
  getJournals() {
    return this._get(this.KEYS.JOURNALS) || [];
  },

  addJournal(entry) {
    const journals = this.getJournals();
    entry.id = Date.now();
    entry.date = new Date().toISOString();
    journals.unshift(entry);
    this._set(this.KEYS.JOURNALS, journals);
    return journals;
  },

  // ===== Favorite Affirmations =====
  getFavAffirmations() {
    return this._get(this.KEYS.FAV_AFFIRMATIONS) || [];
  },

  toggleFavAffirmation(text) {
    let favs = this.getFavAffirmations();
    const index = favs.indexOf(text);
    if (index >= 0) {
      favs.splice(index, 1);
    } else {
      favs.push(text);
    }
    this._set(this.KEYS.FAV_AFFIRMATIONS, favs);
    return favs;
  },

  isFavAffirmation(text) {
    return this.getFavAffirmations().includes(text);
  },

  // ===== Custom Affirmations =====
  getCustomAffirmations() {
    return this._get(this.KEYS.CUSTOM_AFFIRMATIONS) || [];
  },

  addCustomAffirmation(text) {
    const customs = this.getCustomAffirmations();
    if (!customs.includes(text)) {
      customs.push(text);
      this._set(this.KEYS.CUSTOM_AFFIRMATIONS, customs);
    }
    return customs;
  },

  // ===== Badges =====
  getEarnedBadges() {
    return this._get(this.KEYS.BADGES) || [];
  },

  earnBadge(badgeId) {
    const earned = this.getEarnedBadges();
    if (!earned.includes(badgeId)) {
      earned.push(badgeId);
      this._set(this.KEYS.BADGES, earned);
      return true; // Newly earned
    }
    return false; // Already had
  },

  // ===== Weekly Challenge =====
  getWeeklyProgress() {
    const data = this._get(this.KEYS.WEEKLY_CHALLENGE);
    if (!data || this._isNewWeek(data.startDate)) {
      const newData = {
        startDate: this._getWeekStart(),
        completed: []
      };
      this._set(this.KEYS.WEEKLY_CHALLENGE, newData);
      return newData;
    }
    return data;
  },

  completeWeeklyDay(day) {
    const data = this.getWeeklyProgress();
    if (!data.completed.includes(day)) {
      data.completed.push(day);
      this._set(this.KEYS.WEEKLY_CHALLENGE, data);
    }
    return data;
  },

  _getWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  },

  _isNewWeek(startDate) {
    return this._getWeekStart() !== startDate;
  },

  // ===== Mirror Count =====
  getMirrorCount() {
    return this._get(this.KEYS.MIRROR_COUNT) || 0;
  },

  incrementMirrorCount() {
    const count = this.getMirrorCount() + 1;
    this._set(this.KEYS.MIRROR_COUNT, count);
    return count;
  },

  // ===== Challenge Count =====
  getChallengeCount() {
    return this._get(this.KEYS.CHALLENGE_COUNT) || 0;
  },

  incrementChallengeCount() {
    const count = this.getChallengeCount() + 1;
    this._set(this.KEYS.CHALLENGE_COUNT, count);
    return count;
  },

  // ===== Activity for Calendar =====
  getActivityDates() {
    const daily = this._get(this.KEYS.DAILY) || {};
    const result = {};
    for (const [date, tasks] of Object.entries(daily)) {
      const completed = Object.values(tasks).filter(Boolean).length;
      if (completed > 0) {
        result[date] = completed >= 3 ? 'full' : 'partial';
      }
    }
    return result;
  },

  // ===== Export =====
  exportData() {
    const data = {};
    for (const key of Object.values(this.KEYS)) {
      data[key] = this._get(key);
    }
    return JSON.stringify(data, null, 2);
  }
};
