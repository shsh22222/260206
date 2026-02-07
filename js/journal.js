/* ===== Self Love App - Journal Module ===== */

const Journal = {
  selectedMood: null,

  init() {
    this.showPrompt();
    this.setupMoodSelector();
    this.setupSave();
    this.renderHistory();

    document.getElementById('newPrompt').addEventListener('click', () => this.showPrompt());
  },

  showPrompt() {
    const prompts = AppData.journalPrompts;
    const index = Math.floor(Math.random() * prompts.length);
    document.getElementById('journalPrompt').textContent = prompts[index];
  },

  setupMoodSelector() {
    document.querySelectorAll('.mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedMood = btn.dataset.mood;
      });
    });
  },

  setupSave() {
    document.getElementById('saveJournal').addEventListener('click', () => {
      const text = document.getElementById('journalText').value.trim();
      const gratitude1 = document.getElementById('gratitude1').value.trim();
      const gratitude2 = document.getElementById('gratitude2').value.trim();
      const gratitude3 = document.getElementById('gratitude3').value.trim();

      if (!text && !gratitude1 && !gratitude2 && !gratitude3) {
        App.showToast('何か書いてみてね', 'info');
        return;
      }

      const entry = {
        mood: this.selectedMood,
        text: text,
        gratitude: [gratitude1, gratitude2, gratitude3].filter(Boolean),
        prompt: document.getElementById('journalPrompt').textContent
      };

      Storage.addJournal(entry);
      Storage.setDailyTask('journal', true);
      Storage.incrementStat('totalJournals');
      App.updateDailyProgress();

      // XP
      const { stats, leveledUp } = Storage.addXP(25);
      if (leveledUp) {
        App.showCelebration('🎉', 'レベルアップ!',
          `レベル ${stats.level} — ${AppData.levelNames[Math.min(stats.level - 1, AppData.levelNames.length - 1)]}`, null);
      }

      // Clear form
      document.getElementById('journalText').value = '';
      document.getElementById('gratitude1').value = '';
      document.getElementById('gratitude2').value = '';
      document.getElementById('gratitude3').value = '';
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
      this.selectedMood = null;

      this.renderHistory();
      this.showPrompt();

      App.showToast('ジャーナルを保存しました! +25 XP', 'success');
      App.checkBadges();
    });
  },

  renderHistory() {
    const container = document.getElementById('journalHistory');
    const journals = Storage.getJournals();

    if (journals.length === 0) {
      container.innerHTML = '<p class="empty-state">まだ記録がありません</p>';
      return;
    }

    // Show last 10
    const recent = journals.slice(0, 10);
    container.innerHTML = recent.map(entry => {
      const date = new Date(entry.date);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
      const moodEmoji = entry.mood ? AppData.moodEmojis[entry.mood] : '';
      const preview = entry.text ? entry.text.substring(0, 50) + (entry.text.length > 50 ? '...' : '') : '(感謝の記録)';

      return `
        <div class="journal-entry-item" onclick="Journal.showEntry(${entry.id})">
          <div class="journal-entry-date">${dateStr}</div>
          <div class="journal-entry-mood">${moodEmoji}</div>
          <div class="journal-entry-preview">${this._escapeHtml(preview)}</div>
        </div>
      `;
    }).join('');
  },

  showEntry(id) {
    const journals = Storage.getJournals();
    const entry = journals.find(j => j.id === id);
    if (!entry) return;

    const date = new Date(entry.date);
    const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    const moodEmoji = entry.mood ? AppData.moodEmojis[entry.mood] : '';

    let html = `
      <div class="celebration-emoji">${moodEmoji || '📖'}</div>
      <div class="celebration-title">${dateStr}の記録</div>
      <div class="celebration-message" style="text-align:left;">
    `;

    if (entry.prompt) {
      html += `<p style="color:var(--primary);font-size:0.8rem;margin-bottom:8px;">テーマ: ${this._escapeHtml(entry.prompt)}</p>`;
    }
    if (entry.text) {
      html += `<p style="margin-bottom:8px;">${this._escapeHtml(entry.text)}</p>`;
    }
    if (entry.gratitude && entry.gratitude.length > 0) {
      html += '<p style="font-weight:600;margin-bottom:4px;">自分への感謝:</p>';
      entry.gratitude.forEach(g => {
        html += `<p>• ${this._escapeHtml(g)}</p>`;
      });
    }

    html += `</div>
      <button class="btn btn-primary" onclick="App.closeCelebration()">閉じる</button>
    `;

    const overlay = document.getElementById('celebrationOverlay');
    const content = document.getElementById('celebrationContent');
    content.innerHTML = html;
    overlay.classList.add('active');
  },

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
