/* ===== Self Love App - Main Application ===== */

const App = {
  currentPage: 'home',

  init() {
    // Load settings & theme
    const settings = Storage.getSettings();
    this.applyTheme(settings.theme);

    // Show splash, then main app
    setTimeout(() => {
      const splash = document.getElementById('splash');
      splash.classList.add('fade-out');
      setTimeout(() => {
        splash.style.display = 'none';
        document.getElementById('app').classList.remove('hidden');
        this.onAppReady();
      }, 600);
    }, 1500);

    this.setupNavigation();
    this.setupSettings();
    this.setupQuickActions();
  },

  onAppReady() {
    // Update greeting
    this.updateGreeting();

    // Update streak
    const streak = Storage.updateStreak();
    document.getElementById('streakCount').textContent = streak.current;

    // Daily affirmation on home
    this.showHomeAffirmation();

    // Daily quote
    this.showDailyQuote();

    // Update daily progress
    this.updateDailyProgress();

    // Initialize sub-modules
    if (typeof Affirmation !== 'undefined') Affirmation.init();
    if (typeof Journal !== 'undefined') Journal.init();
    if (typeof Challenge !== 'undefined') Challenge.init();
    if (typeof Mirror !== 'undefined') Mirror.init();
    if (typeof Stats !== 'undefined') Stats.init();

    // Check for first-time badge
    Storage.earnBadge('first_step');

    // Count total active days
    const activity = Storage.getActivityDates();
    const stats = Storage.getStats();
    stats.totalDays = Object.keys(activity).length;
    localStorage.setItem(Storage.KEYS.STATS, JSON.stringify(stats));
  },

  // ===== Navigation =====
  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        this.navigateTo(page);
      });
    });
  },

  navigateTo(page) {
    if (page === this.currentPage) return;

    // Update nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Update pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const activePage = document.getElementById('page' + page.charAt(0).toUpperCase() + page.slice(1));
    if (activePage) {
      activePage.classList.add('active');
    }

    // Update header title
    const titles = {
      home: 'Self Love',
      affirmation: '気づきの言葉',
      journal: '内観ジャーナル',
      challenge: 'マインドフルネス',
      mirror: 'ミラーワーク',
      stats: 'あなたの記録'
    };
    document.getElementById('headerTitle').textContent = titles[page] || 'Self Love';

    // Refresh stats when navigating to stats page
    if (page === 'stats' && typeof Stats !== 'undefined') {
      Stats.refresh();
    }

    this.currentPage = page;
  },

  // ===== Quick Actions =====
  setupQuickActions() {
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.navigateTo(btn.dataset.page);
      });
    });
  },

  // ===== Greeting =====
  updateGreeting() {
    const user = Storage.getUser();
    const greeting = AppData.getGreeting(user.name);
    document.getElementById('greetingTime').textContent = greeting.time;
    document.getElementById('greetingMessage').textContent = greeting.message;
  },

  // ===== Home Affirmation =====
  showHomeAffirmation() {
    const all = [...AppData.affirmations, ...Storage.getCustomAffirmations()];
    const todaySeed = new Date().toISOString().split('T')[0];
    const index = this._hashCode(todaySeed) % all.length;
    const text = all[Math.abs(index)];

    document.getElementById('affirmationText').textContent = text;

    // Fav button state
    const favBtn = document.getElementById('affirmationFav');
    if (Storage.isFavAffirmation(text)) {
      favBtn.innerHTML = '&#10084;';
      favBtn.classList.add('active');
    }

    // Speak button
    document.getElementById('affirmationSpeak').addEventListener('click', () => {
      this.speak(text);
    });

    // Refresh button
    document.getElementById('affirmationRefresh').addEventListener('click', () => {
      const randomIndex = Math.floor(Math.random() * all.length);
      const newText = all[randomIndex];
      document.getElementById('affirmationText').textContent = newText;
      document.getElementById('affirmationText').classList.add('animate-fade-in');
      setTimeout(() => {
        document.getElementById('affirmationText').classList.remove('animate-fade-in');
      }, 300);

      // Update fav state
      if (Storage.isFavAffirmation(newText)) {
        favBtn.innerHTML = '&#10084;';
        favBtn.classList.add('active');
      } else {
        favBtn.innerHTML = '&#9825;';
        favBtn.classList.remove('active');
      }
    });

    // Fav button
    favBtn.addEventListener('click', () => {
      const currentText = document.getElementById('affirmationText').textContent;
      Storage.toggleFavAffirmation(currentText);
      if (Storage.isFavAffirmation(currentText)) {
        favBtn.innerHTML = '&#10084;';
        favBtn.classList.add('active');
        App.showToast('お気に入りに追加しました', 'success');
      } else {
        favBtn.innerHTML = '&#9825;';
        favBtn.classList.remove('active');
        App.showToast('お気に入りから外しました', 'info');
      }
    });

    // Mark affirmation as read
    Storage.setDailyTask('affirmation', true);
    this.updateDailyProgress();
  },

  // ===== Daily Quote =====
  showDailyQuote() {
    const todaySeed = new Date().toISOString().split('T')[0];
    const index = Math.abs(this._hashCode(todaySeed + 'quote')) % AppData.quotes.length;
    const quote = AppData.quotes[index];
    document.getElementById('quoteText').textContent = quote.text;
    document.getElementById('quoteAuthor').textContent = '— ' + quote.author;
  },

  // ===== Daily Progress =====
  updateDailyProgress() {
    const today = Storage.getTodayProgress();
    const tasks = ['affirmation', 'journal', 'challenge', 'mirror'];
    let completed = 0;

    tasks.forEach(task => {
      const el = document.getElementById('check' + task.charAt(0).toUpperCase() + task.slice(1));
      if (today[task]) {
        el.classList.add('done');
        completed++;
      } else {
        el.classList.remove('done');
      }
    });

    const percent = Math.round((completed / tasks.length) * 100);
    document.getElementById('progressPercent').textContent = percent;

    // Update ring
    const ring = document.getElementById('progressRing');
    const circumference = 2 * Math.PI * 52; // r=52
    const offset = circumference - (percent / 100) * circumference;
    ring.style.strokeDashoffset = offset;
  },

  // ===== Settings =====
  setupSettings() {
    const settingsBtn = document.getElementById('settingsBtn');
    const modal = document.getElementById('settingsModal');
    const closeBtn = document.getElementById('closeSettings');

    settingsBtn.addEventListener('click', () => {
      this.openSettings();
    });

    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });

    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Save settings
    document.getElementById('saveSettings').addEventListener('click', () => {
      const name = document.getElementById('settingName').value.trim();
      const theme = document.querySelector('.theme-btn.active').dataset.theme;
      const reminder = document.getElementById('settingReminder').checked;
      const reminderTime = document.getElementById('settingReminderTime').value;

      Storage.setUser({ ...Storage.getUser(), name });
      Storage.setSettings({ theme, reminder, reminderTime });

      this.applyTheme(theme);
      this.updateGreeting();

      modal.classList.remove('open');
      this.showToast('設定を保存しました', 'success');
    });

    // Export
    document.getElementById('exportData').addEventListener('click', () => {
      const data = Storage.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'selflove-data.json';
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('データをエクスポートしました', 'success');
    });
  },

  openSettings() {
    const modal = document.getElementById('settingsModal');
    const user = Storage.getUser();
    const settings = Storage.getSettings();

    document.getElementById('settingName').value = user.name || '';
    document.getElementById('settingReminder').checked = settings.reminder;
    document.getElementById('settingReminderTime').value = settings.reminderTime || '08:00';

    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === settings.theme);
    });

    modal.classList.add('open');
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  },

  // ===== Toast =====
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  },

  // ===== Celebration =====
  showCelebration(emoji, title, message, xp) {
    const overlay = document.getElementById('celebrationOverlay');
    const content = document.getElementById('celebrationContent');

    content.innerHTML = `
      <div class="celebration-emoji animate-bounce-in">${emoji}</div>
      <div class="celebration-title">${title}</div>
      <div class="celebration-message">${message}</div>
      ${xp ? `<div class="celebration-xp">+${xp} XP</div>` : ''}
      <button class="btn btn-primary" onclick="App.closeCelebration()">やったね!</button>
    `;

    overlay.classList.add('active');
    this.spawnConfetti();
  },

  closeCelebration() {
    document.getElementById('celebrationOverlay').classList.remove('active');
  },

  // ===== Confetti =====
  spawnConfetti() {
    const colors = ['#ff6b9d', '#c084fc', '#fbbf24', '#34d399', '#38bdf8', '#fb923c'];
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
        confetti.style.width = (6 + Math.random() * 8) + 'px';
        confetti.style.height = (6 + Math.random() * 8) + 'px';
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
      }, i * 50);
    }
  },

  // ===== Floating Hearts =====
  spawnHeart(x, y) {
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.textContent = ['❤️', '💕', '💖', '💗', '✨'][Math.floor(Math.random() * 5)];
    heart.style.left = x + 'px';
    heart.style.top = y + 'px';
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 2000);
  },

  // ===== Speech =====
  speak(text) {
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'ja-JP';
      utter.rate = 0.9;
      speechSynthesis.speak(utter);
    }
  },

  // ===== Badge Check =====
  checkBadges() {
    const streak = Storage.getStreak();
    const stats = Storage.getStats();
    const journals = Storage.getJournals();
    const mirrorCount = Storage.getMirrorCount();
    const challengeCount = Storage.getChallengeCount();
    const newBadges = [];

    // Streak badges
    if (streak.current >= 3 && Storage.earnBadge('3day_streak')) {
      newBadges.push(AppData.badges.find(b => b.id === '3day_streak'));
    }
    if (streak.current >= 7 && Storage.earnBadge('7day_streak')) {
      newBadges.push(AppData.badges.find(b => b.id === '7day_streak'));
    }
    if (streak.current >= 14 && Storage.earnBadge('14day_streak')) {
      newBadges.push(AppData.badges.find(b => b.id === '14day_streak'));
    }
    if (streak.current >= 30 && Storage.earnBadge('30day_streak')) {
      newBadges.push(AppData.badges.find(b => b.id === '30day_streak'));
    }

    // Journal badges
    if (journals.length >= 1 && Storage.earnBadge('first_journal')) {
      newBadges.push(AppData.badges.find(b => b.id === 'first_journal'));
    }
    if (journals.length >= 10 && Storage.earnBadge('10_journals')) {
      newBadges.push(AppData.badges.find(b => b.id === '10_journals'));
    }

    // Mirror badge
    if (mirrorCount >= 5 && Storage.earnBadge('mirror_master')) {
      newBadges.push(AppData.badges.find(b => b.id === 'mirror_master'));
    }

    // Challenge badge
    if (challengeCount >= 5 && Storage.earnBadge('challenge_5')) {
      newBadges.push(AppData.badges.find(b => b.id === 'challenge_5'));
    }

    // Level badges
    if (stats.level >= 5 && Storage.earnBadge('level_5')) {
      newBadges.push(AppData.badges.find(b => b.id === 'level_5'));
    }
    if (stats.level >= 10 && Storage.earnBadge('level_10')) {
      newBadges.push(AppData.badges.find(b => b.id === 'level_10'));
    }
    if (stats.level >= 20 && Storage.earnBadge('self_love_100')) {
      newBadges.push(AppData.badges.find(b => b.id === 'self_love_100'));
    }

    // Show celebration for first new badge
    if (newBadges.length > 0) {
      const badge = newBadges[0];
      setTimeout(() => {
        this.showCelebration(badge.icon, 'バッジ獲得!', badge.name + ' — ' + badge.condition, 50);
      }, 500);
    }

    return newBadges;
  },

  // ===== Utility =====
  _hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash;
  }
};

// Start the app
document.addEventListener('DOMContentLoaded', () => App.init());
