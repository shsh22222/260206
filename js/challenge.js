/* ===== Self Love App - Challenge Module ===== */

const Challenge = {
  todayChallenge: null,
  timerInterval: null,

  init() {
    this.setTodayChallenge();
    this.renderWeeklyChallenge();
    this.renderBadges();
    this.setupCompleteButton();
  },

  setTodayChallenge() {
    const todaySeed = new Date().toISOString().split('T')[0];
    const index = Math.abs(App._hashCode(todaySeed + 'challenge')) % AppData.challenges.length;
    this.todayChallenge = AppData.challenges[index];

    document.getElementById('challengeIcon').textContent = this.todayChallenge.icon;
    document.getElementById('challengeTitle').textContent = this.todayChallenge.title;
    document.getElementById('challengeDesc').textContent = this.todayChallenge.desc;

    // Timer display
    if (this.todayChallenge.duration) {
      document.getElementById('challengeTimer').textContent =
        this._formatDuration(this.todayChallenge.duration);
    } else {
      document.getElementById('challengeTimer').textContent = '';
    }

    // Check if already completed today
    const todayProgress = Storage.getTodayProgress();
    if (todayProgress.challenge) {
      document.getElementById('completeChallenge').textContent = '完了済み ✓';
      document.getElementById('completeChallenge').disabled = true;
      document.getElementById('completeChallenge').style.opacity = '0.6';
    }
  },

  setupCompleteButton() {
    document.getElementById('completeChallenge').addEventListener('click', () => {
      const todayProgress = Storage.getTodayProgress();
      if (todayProgress.challenge) return;

      // Start timer if needed
      if (this.todayChallenge.duration && !this.timerInterval) {
        this.startTimer(this.todayChallenge.duration);
        return;
      }

      this.completeChallenge();
    });
  },

  startTimer(seconds) {
    let remaining = seconds;
    const btn = document.getElementById('completeChallenge');
    btn.textContent = 'チャレンジ中...';
    btn.disabled = true;
    btn.style.opacity = '0.7';

    const timerEl = document.getElementById('challengeTimer');
    timerEl.textContent = this._formatDuration(remaining);

    this.timerInterval = setInterval(() => {
      remaining--;
      timerEl.textContent = this._formatDuration(remaining);

      if (remaining <= 0) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.completeChallenge();
      }
    }, 1000);
  },

  completeChallenge() {
    Storage.setDailyTask('challenge', true);
    Storage.incrementChallengeCount();
    App.updateDailyProgress();

    const xp = this.todayChallenge.xp || 20;
    const { stats, leveledUp } = Storage.addXP(xp);

    const btn = document.getElementById('completeChallenge');
    btn.textContent = '完了済み ✓';
    btn.disabled = true;
    btn.style.opacity = '0.6';

    App.showCelebration(
      this.todayChallenge.icon,
      'チャレンジ完了!',
      this.todayChallenge.title + 'をクリアしました!',
      xp
    );

    if (leveledUp) {
      setTimeout(() => {
        App.showCelebration('🎉', 'レベルアップ!',
          `レベル ${stats.level} — ${AppData.levelNames[Math.min(stats.level - 1, AppData.levelNames.length - 1)]}`, null);
      }, 3000);
    }

    App.checkBadges();
  },

  renderWeeklyChallenge() {
    const container = document.getElementById('weeklyChallenge');
    const progress = Storage.getWeeklyProgress();
    const dayOfWeek = new Date().getDay();
    const currentDay = dayOfWeek === 0 ? 7 : dayOfWeek;

    container.innerHTML = AppData.weeklyChallenge.map(item => {
      const isCompleted = progress.completed.includes(item.day);
      const isToday = item.day === currentDay;

      return `
        <div class="weekly-day ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''}">
          <div class="weekly-day-num">${isCompleted ? '✓' : item.day}</div>
          <div class="weekly-day-content">
            <div class="weekly-day-title">${item.title}</div>
            <div class="weekly-day-desc">${item.desc}</div>
          </div>
          ${isToday && !isCompleted ? `<button class="btn btn-primary" style="font-size:0.75rem;padding:6px 12px;" onclick="Challenge.completeWeekly(${item.day})">完了</button>` : ''}
        </div>
      `;
    }).join('');
  },

  completeWeekly(day) {
    Storage.completeWeeklyDay(day);
    this.renderWeeklyChallenge();

    const { stats, leveledUp } = Storage.addXP(15);
    App.showToast('7日間チャレンジ進行中! +15 XP', 'success');

    if (leveledUp) {
      App.showCelebration('🎉', 'レベルアップ!',
        `レベル ${stats.level} — ${AppData.levelNames[Math.min(stats.level - 1, AppData.levelNames.length - 1)]}`, null);
    }
  },

  renderBadges() {
    const container = document.getElementById('badgesGrid');
    const earned = Storage.getEarnedBadges();

    container.innerHTML = AppData.badges.map(badge => {
      const isEarned = earned.includes(badge.id);
      return `
        <div class="badge-item ${isEarned ? 'earned' : ''}">
          <div class="badge-icon">${badge.icon}</div>
          <div class="badge-name">${badge.name}</div>
        </div>
      `;
    }).join('');
  },

  _formatDuration(seconds) {
    if (seconds >= 3600) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return `${h}時間${m > 0 ? m + '分' : ''}`;
    } else if (seconds >= 60) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${String(s).padStart(2, '0')}`;
    } else {
      return `0:${String(seconds).padStart(2, '0')}`;
    }
  }
};
