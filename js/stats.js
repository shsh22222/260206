/* ===== Self Love App - Stats Module ===== */

const Stats = {
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),

  init() {
    this.refresh();
  },

  refresh() {
    this.renderCalendar();
    this.renderStats();
    this.renderMoodChart();
    this.renderLevel();
  },

  // ===== Calendar =====
  renderCalendar() {
    const container = document.getElementById('calendar');
    const activity = Storage.getActivityDates();
    const year = this.currentYear;
    const month = this.currentMonth;

    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'];
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    let html = `
      <div class="calendar-header">
        <button onclick="Stats.prevMonth()">&#9664;</button>
        <span>${year}年 ${monthNames[month]}</span>
        <button onclick="Stats.nextMonth()">&#9654;</button>
      </div>
      <div class="calendar-weekdays">
        ${weekdays.map(d => `<div class="calendar-weekday">${d}</div>`).join('')}
      </div>
      <div class="calendar-days">
    `;

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="calendar-day"></div>';
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
      const activityLevel = activity[dateStr];

      let classes = 'calendar-day';
      if (isToday) classes += ' today';
      if (activityLevel === 'full') classes += ' active';
      else if (activityLevel === 'partial') classes += ' partial';

      html += `<div class="${classes}">${d}</div>`;
    }

    html += '</div>';
    container.innerHTML = html;
  },

  prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.renderCalendar();
  },

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.renderCalendar();
  },

  // ===== Stats =====
  renderStats() {
    const streak = Storage.getStreak();
    const activity = Storage.getActivityDates();
    const journals = Storage.getJournals();

    document.getElementById('statTotalDays').textContent = Object.keys(activity).length;
    document.getElementById('statCurrentStreak').textContent = streak.current;
    document.getElementById('statLongestStreak').textContent = streak.longest;
    document.getElementById('statJournals').textContent = journals.length;
  },

  // ===== Mood Chart =====
  renderMoodChart() {
    const container = document.getElementById('moodChart');
    const journals = Storage.getJournals();

    // Get last 7 days of moods
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      const dateStr = date.toISOString().split('T')[0];
      const dayJournal = journals.find(j => j.date.startsWith(dateStr));
      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

      days.push({
        label: dayNames[date.getDay()],
        mood: dayJournal ? dayJournal.mood : null,
        value: dayJournal && dayJournal.mood ? AppData.moodValues[dayJournal.mood] : 0,
        emoji: dayJournal && dayJournal.mood ? AppData.moodEmojis[dayJournal.mood] : ''
      });
    }

    const maxValue = 5;

    container.innerHTML = days.map(day => {
      const height = day.value > 0 ? (day.value / maxValue) * 80 : 4;
      return `
        <div class="mood-bar">
          <div class="mood-bar-emoji">${day.emoji}</div>
          <div class="mood-bar-fill" style="height:${height}px;${day.value === 0 ? 'opacity:0.2' : ''}"></div>
          <div class="mood-bar-label">${day.label}</div>
        </div>
      `;
    }).join('');
  },

  // ===== Level =====
  renderLevel() {
    const stats = Storage.getStats();
    const level = stats.level;
    const xp = stats.xp;
    const xpForNext = level * 100;
    const percent = Math.round((xp / xpForNext) * 100);

    document.getElementById('levelNumber').textContent = level;
    document.getElementById('levelTitle').textContent =
      AppData.levelNames[Math.min(level - 1, AppData.levelNames.length - 1)];
    document.getElementById('levelBar').style.width = percent + '%';
    document.getElementById('levelExp').textContent = xp;
    document.getElementById('levelExpMax').textContent = xpForNext;
  }
};
