/* ===== Self Love App - Mirror Work Module ===== */

const Mirror = {
  currentStep: 1,
  currentPhrase: 0,
  breathCount: 0,
  breathInterval: null,
  cameraStream: null,

  init() {
    this.setupBreathing();
    this.setupCamera();
    this.setupPhrases();
    this.setupCompletion();
  },

  // ===== Step 1: Breathing =====
  setupBreathing() {
    document.getElementById('startBreathing').addEventListener('click', () => {
      this.startBreathingExercise();
    });
  },

  startBreathingExercise() {
    const circle = document.getElementById('breathCircle');
    const text = document.getElementById('breathText');
    const btn = document.getElementById('startBreathing');
    btn.style.display = 'none';

    this.breathCount = 0;
    this.doBreath(circle, text);
  },

  doBreath(circle, text) {
    if (this.breathCount >= 3) {
      text.textContent = 'すばらしい!';
      setTimeout(() => this.goToStep(2), 1000);
      return;
    }

    // Inhale
    text.textContent = '吸って...';
    circle.classList.add('inhale');
    circle.classList.remove('exhale');

    setTimeout(() => {
      // Hold
      text.textContent = '止めて...';

      setTimeout(() => {
        // Exhale
        text.textContent = '吐いて...';
        circle.classList.remove('inhale');
        circle.classList.add('exhale');

        setTimeout(() => {
          this.breathCount++;
          text.textContent = `${this.breathCount}/3 回完了`;

          setTimeout(() => {
            this.doBreath(circle, text);
          }, 1000);
        }, 4000);
      }, 2000);
    }, 4000);
  },

  // ===== Step 2: Camera =====
  setupCamera() {
    document.getElementById('openCamera').addEventListener('click', async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }
        });
        this.cameraStream = stream;

        const frame = document.getElementById('mirrorFrame');
        frame.innerHTML = '';
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        frame.appendChild(video);

        document.getElementById('openCamera').style.display = 'none';
      } catch {
        App.showToast('カメラにアクセスできません。鏡を使ってね!', 'info');
      }
    });

    document.getElementById('mirrorReady').addEventListener('click', () => {
      this.goToStep(3);
    });
  },

  // ===== Step 3: Phrases =====
  setupPhrases() {
    this.currentPhrase = 0;
    this.updatePhrase();

    document.getElementById('prevPhrase').addEventListener('click', () => {
      if (this.currentPhrase > 0) {
        this.currentPhrase--;
        this.updatePhrase();
      }
    });

    document.getElementById('nextPhrase').addEventListener('click', () => {
      if (this.currentPhrase < AppData.mirrorPhrases.length - 1) {
        this.currentPhrase++;
        this.updatePhrase();
      } else {
        this.goToStep(4);
      }
    });
  },

  updatePhrase() {
    const phrases = AppData.mirrorPhrases;
    document.getElementById('phraseText').textContent = phrases[this.currentPhrase];
    document.getElementById('phraseCounter').textContent =
      `${this.currentPhrase + 1}/${phrases.length}`;

    // Animate
    const el = document.getElementById('phraseText');
    el.classList.add('animate-fade-in');
    setTimeout(() => el.classList.remove('animate-fade-in'), 300);
  },

  // ===== Step 4: Completion =====
  setupCompletion() {
    document.getElementById('mirrorDone').addEventListener('click', () => {
      this.completeMirrorWork();
    });
  },

  completeMirrorWork() {
    // Stop camera
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(t => t.stop());
      this.cameraStream = null;
    }

    Storage.setDailyTask('mirror', true);
    Storage.incrementMirrorCount();
    App.updateDailyProgress();

    const { stats, leveledUp } = Storage.addXP(30);

    App.showCelebration(
      '💖',
      'ミラーワーク完了!',
      '自分を愛する時間を過ごせたね。とても大切なこと。',
      30
    );

    if (leveledUp) {
      setTimeout(() => {
        App.showCelebration('🎉', 'レベルアップ!',
          `レベル ${stats.level} — ${AppData.levelNames[Math.min(stats.level - 1, AppData.levelNames.length - 1)]}`, null);
      }, 3000);
    }

    App.checkBadges();

    // Reset to step 1
    this.currentStep = 1;
    this.currentPhrase = 0;
    this.resetSteps();
  },

  // ===== Step Navigation =====
  goToStep(step) {
    this.currentStep = step;
    document.querySelectorAll('.mirror-step').forEach(s => s.classList.remove('active'));
    const target = document.querySelector(`.mirror-step[data-step="${step}"]`);
    if (target) {
      target.classList.add('active');
      target.classList.add('animate-fade-in-up');
    }

    // Hearts animation on step 4
    if (step === 4) {
      const heartsContainer = document.getElementById('mirrorHearts');
      heartsContainer.textContent = '💖💗💕✨💖💗💕✨';
    }
  },

  resetSteps() {
    document.querySelectorAll('.mirror-step').forEach(s => s.classList.remove('active'));
    document.querySelector('.mirror-step[data-step="1"]').classList.add('active');

    // Reset breathing
    document.getElementById('startBreathing').style.display = '';
    document.getElementById('breathText').textContent = 'タップで開始';
    const circle = document.getElementById('breathCircle');
    circle.classList.remove('inhale', 'exhale');

    // Reset camera
    document.getElementById('openCamera').style.display = '';
    const frame = document.getElementById('mirrorFrame');
    frame.innerHTML = `
      <div class="mirror-placeholder">
        <span>🪞</span>
        <p>ここに自分の顔を映して</p>
      </div>
    `;

    // Reset phrase
    this.currentPhrase = 0;
    this.updatePhrase();
  }
};
