/* ===== Self Love App - Affirmation Module ===== */

const Affirmation = {
  allAffirmations: [],
  currentIndex: 0,

  init() {
    this.allAffirmations = [...AppData.affirmations, ...Storage.getCustomAffirmations()];
    this.currentIndex = 0;

    this.renderDeck();
    this.setupControls();
    this.renderFavorites();
    this.setupCustom();
    this.setupSwipe();
  },

  renderDeck() {
    const container = document.getElementById('deckCards');
    container.innerHTML = '';

    if (this.allAffirmations.length === 0) return;

    const card = document.createElement('div');
    card.className = 'deck-card';
    card.textContent = this.allAffirmations[this.currentIndex];
    container.appendChild(card);

    this.updateCounter();
  },

  updateCounter() {
    document.getElementById('deckCurrent').textContent = this.currentIndex + 1;
    document.getElementById('deckTotal').textContent = this.allAffirmations.length;
  },

  setupControls() {
    document.getElementById('deckPrev').addEventListener('click', () => this.prev());
    document.getElementById('deckNext').addEventListener('click', () => this.next());
    document.getElementById('deckSayIt').addEventListener('click', () => {
      const text = this.allAffirmations[this.currentIndex];
      App.speak(text);
      Storage.setDailyTask('affirmation', true);
      App.updateDailyProgress();

      const { stats, leveledUp } = Storage.addXP(10);
      if (leveledUp) {
        App.showCelebration('🎉', 'レベルアップ!',
          `レベル ${stats.level} — ${AppData.levelNames[Math.min(stats.level - 1, AppData.levelNames.length - 1)]}`, null);
      }
      App.showToast('素晴らしい! +10 XP', 'success');
      App.checkBadges();
    });
  },

  next() {
    if (this.allAffirmations.length === 0) return;

    const container = document.getElementById('deckCards');
    const current = container.querySelector('.deck-card');

    if (current) {
      current.classList.add('prev');
      setTimeout(() => {
        this.currentIndex = (this.currentIndex + 1) % this.allAffirmations.length;
        this.renderDeck();
      }, 300);
    }
  },

  prev() {
    if (this.allAffirmations.length === 0) return;

    const container = document.getElementById('deckCards');
    const current = container.querySelector('.deck-card');

    if (current) {
      current.classList.add('next');
      setTimeout(() => {
        this.currentIndex = (this.currentIndex - 1 + this.allAffirmations.length) % this.allAffirmations.length;
        this.renderDeck();
      }, 300);
    }
  },

  setupSwipe() {
    const container = document.getElementById('deckCards');
    let startX = 0;
    let diff = 0;

    container.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      diff = e.touches[0].clientX - startX;
      const card = container.querySelector('.deck-card');
      if (card) {
        card.style.transform = `translateX(${diff * 0.5}px) rotate(${diff * 0.05}deg)`;
        card.style.transition = 'none';
      }
    }, { passive: true });

    container.addEventListener('touchend', () => {
      const card = container.querySelector('.deck-card');
      if (card) {
        card.style.transition = '';
        card.style.transform = '';
      }

      if (Math.abs(diff) > 60) {
        if (diff < 0) this.next();
        else this.prev();
      }
      diff = 0;
    });
  },

  renderFavorites() {
    const container = document.getElementById('favAffirmations');
    const favs = Storage.getFavAffirmations();

    if (favs.length === 0) {
      container.innerHTML = '<p class="empty-state">お気に入りはまだありません</p>';
      return;
    }

    container.innerHTML = favs.map(text => `
      <div class="fav-item">
        <span>${text}</span>
        <button onclick="Affirmation.removeFav('${text.replace(/'/g, "\\'")}')">&#10005;</button>
      </div>
    `).join('');
  },

  removeFav(text) {
    Storage.toggleFavAffirmation(text);
    this.renderFavorites();
    App.showToast('お気に入りから外しました', 'info');
  },

  setupCustom() {
    document.getElementById('addCustomAffirmation').addEventListener('click', () => {
      const textarea = document.getElementById('customAffirmation');
      const text = textarea.value.trim();

      if (!text) {
        App.showToast('アファメーションを入力してください', 'info');
        return;
      }

      Storage.addCustomAffirmation(text);
      this.allAffirmations = [...AppData.affirmations, ...Storage.getCustomAffirmations()];
      textarea.value = '';

      App.showToast('アファメーションを追加しました!', 'success');
      this.updateCounter();
    });
  }
};
