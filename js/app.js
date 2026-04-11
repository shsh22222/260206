const App = {
  currentPage: 'home',
  selectedQuest: null,
  selectedOption: null,
  lastResult: null,

  init() {
    this.bindNav();
    this.bindActions();
    this.initFilters();
    this.renderAll();
    document.getElementById('streakDays').textContent = MQStorage.updateStreak();

    if (!MQStorage.getUser()) {
      document.getElementById('onboarding').classList.remove('hidden');
    } else {
      this.loadSettings();
    }
  },

  bindNav() {
    document.querySelectorAll('.nav button').forEach(btn => {
      btn.addEventListener('click', () => this.go(btn.dataset.page));
    });
  },

  bindActions() {
    document.getElementById('finishOnboarding').addEventListener('click', () => this.finishOnboarding());
    document.getElementById('startTodayQuest').addEventListener('click', () => {
      const q = this.getTodayQuest();
      this.openQuest(q.id);
    });
    document.getElementById('submitQuest').addEventListener('click', () => this.submitQuest());
    document.getElementById('saveLogBtn').addEventListener('click', () => this.saveLog());
    document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
    document.getElementById('settingsBtn').addEventListener('click', () => this.go('settings'));
    document.getElementById('filterDifficulty').addEventListener('change', () => this.renderQuestList());
    document.getElementById('filterTheme').addEventListener('change', () => this.renderQuestList());
  },

  initFilters() {
    const theme = document.getElementById('filterTheme');
    [...new Set(MQData.quests.map(q => q.theme))].forEach(t => {
      const op = document.createElement('option');
      op.value = t; op.textContent = t; theme.appendChild(op);
    });
  },

  finishOnboarding() {
    const user = {
      name: document.getElementById('userName').value || 'プレイヤー',
      role: document.getElementById('userRole').value || '管理職候補'
    };
    MQStorage.setUser(user);

    const avg = ['q1','q2','q3','q4','q5'].map(id => Number(document.getElementById(id).value)).reduce((a,b)=>a+b,0) / 5;
    const base = Math.round(30 + avg * 10);
    const scores = Object.fromEntries(MQData.competencies.map(c => [c.id, base + Math.floor(Math.random()*8)-4]));
    MQStorage.setScores(scores);
    document.getElementById('onboarding').classList.add('hidden');
    this.renderAll();
  },

  go(page) {
    this.currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page' + page[0].toUpperCase() + page.slice(1)).classList.add('active');
    document.querySelectorAll('.nav button').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    document.getElementById('headerTitle').textContent = ({home:'Manager\'s Quest',status:'ステータス',quests:'クエスト',logs:'攻略ログ',admin:'企業管理',settings:'設定',play:'クエスト実行',result:'攻略結果',guild:'ギルド'})[page] || 'Manager\'s Quest';
    if (page === 'logs') this.renderLogs();
    if (page === 'admin') this.renderAdmin();
    if (page === 'status') this.renderStatus();
  },

  getTodayQuest() {
    const scores = MQStorage.getScores();
    const lowest = Object.entries(scores).sort((a,b)=>a[1]-b[1])[0][0];
    return MQData.quests.find(q => q.options.some(o => Object.keys(o[1]).includes(lowest))) || MQData.quests[0];
  },

  renderHome() {
    const q = this.getTodayQuest();
    document.getElementById('todayQuestTitle').textContent = `${q.title}（${q.difficulty}）`;
    document.getElementById('todayQuestDesc').textContent = q.situation;
    const scores = MQStorage.getScores();
    const top3 = Object.entries(scores).sort((a,b)=>b[1]-a[1]).slice(0,3);
    const summary = document.getElementById('homeSummary');
    summary.innerHTML = top3.map(([id,val]) => {
      const c = MQData.competencies.find(x => x.id === id);
      return `<div class="row"><span>${c.userLabel}</span><strong>${val}</strong></div>`;
    }).join('');

    document.getElementById('guildQuest').textContent = q.title;
  },

  renderStatus() {
    const now = MQStorage.getScores();
    const attempts = MQStorage.getAttempts();
    const yesterday = attempts[1]?.after || now;
    const week = attempts.slice(0,7);
    const weeklyAvg = { ...now };
    Object.keys(weeklyAvg).forEach(k => {
      const arr = week.map(a => a.after[k]).filter(Boolean);
      weeklyAvg[k] = arr.length ? Math.round(arr.reduce((x,y)=>x+y,0)/arr.length) : now[k];
    });
    const el = document.getElementById('statusList');
    el.innerHTML = MQData.competencies.map(c => {
      const d1 = now[c.id] - (yesterday[c.id] ?? now[c.id]);
      const d7 = now[c.id] - weeklyAvg[c.id];
      return `<div class="status-row"><div><strong>${c.userLabel}</strong><div class="label">${c.adminLabel}</div></div><div>${now[c.id]} <span class="delta up">(${d1>=0?'+':''}${d1}/週${d7>=0?'+':''}${d7})</span></div></div>`;
    }).join('');
  },

  renderQuestList() {
    const d = document.getElementById('filterDifficulty').value;
    const t = document.getElementById('filterTheme').value;
    const list = MQData.quests.filter(q => (d==='all'||q.difficulty===d) && (t==='all'||q.theme===t));
    document.getElementById('questList').innerHTML = list.map(q =>
      `<div class="quest-item"><strong>${q.title}</strong><div class="label">${q.theme} / ${q.difficulty} / ${q.durationMin}分</div><p>${q.situation}</p><button data-id="${q.id}">このクエストを攻略</button></div>`
    ).join('');
    document.querySelectorAll('#questList button').forEach(btn => btn.addEventListener('click', () => this.openQuest(Number(btn.dataset.id))));
  },

  openQuest(id) {
    this.selectedQuest = MQData.quests.find(q => q.id === id);
    this.selectedOption = null;
    document.getElementById('playMeta').textContent = `${this.selectedQuest.theme} / ${this.selectedQuest.difficulty}`;
    document.getElementById('playTitle').textContent = this.selectedQuest.title;
    document.getElementById('playSituation').textContent = this.selectedQuest.situation;
    document.getElementById('playQuestions').innerHTML = this.selectedQuest.questions.map(q => `<li>${q}</li>`).join('');
    const options = document.getElementById('playOptions');
    options.innerHTML = '';
    this.selectedQuest.options.forEach((op, idx) => {
      const b = document.createElement('button');
      b.textContent = op[0];
      b.addEventListener('click', () => {
        this.selectedOption = idx;
        [...options.children].forEach(c => c.classList.remove('selected'));
        b.classList.add('selected');
      });
      options.appendChild(b);
    });
    this.go('play');
  },

  submitQuest() {
    if (this.selectedOption === null) return alert('選択肢を選んでください');
    const before = MQStorage.getScores();
    const after = { ...before };
    const impact = this.selectedQuest.options[this.selectedOption][1];
    Object.entries(impact).forEach(([k,v]) => after[k] = Math.max(0, Math.min(100, (after[k]||40) + v)));
    MQStorage.setScores(after);

    this.lastResult = { quest: this.selectedQuest, before, after, impact, reason: document.getElementById('playReason').value };
    MQStorage.addAttempt({ questId: this.selectedQuest.id, theme: this.selectedQuest.theme, before, after, at: new Date().toISOString() });
    this.renderResult();
    this.go('result');
  },

  renderResult() {
    const r = this.lastResult;
    document.getElementById('resultTitle').textContent = r.quest.title;
    const deltas = Object.keys(r.impact).map(k => {
      const c = MQData.competencies.find(x => x.id===k);
      const d = r.after[k]-r.before[k];
      return `<div class="status-row"><span>${c.userLabel}</span><span class="delta up">${d>=0?'+':''}${d}</span></div>`;
    }).join('');
    document.getElementById('resultDeltas').innerHTML = deltas;
    document.getElementById('resultExplain').textContent = '今回の判断は、期待値と責任分界を明確にした点が強みです。';

    const topGrow = Object.keys(r.impact)[0];
    const c = MQData.competencies.find(x=>x.id===topGrow);
    document.getElementById('aiReflection').textContent = `ナイス攻略です。次は「${c.userLabel}」を実務で1回だけ試しましょう。明日の会話冒頭でゴールを30秒で確認する、が有効です。`;
  },

  saveLog() {
    const action = document.getElementById('tomorrowAction').value.trim();
    if (!action) return alert('明日やることを1つ入力してください');
    MQStorage.addLog({
      at: new Date().toISOString(),
      questTitle: this.lastResult.quest.title,
      learning: Object.keys(this.lastResult.impact).join(', '),
      action
    });
    document.getElementById('tomorrowAction').value = '';
    this.renderLogs();
    this.renderHome();
    this.go('logs');
  },

  renderLogs() {
    const logs = MQStorage.getLogs();
    const el = document.getElementById('logsList');
    el.innerHTML = logs.length ? logs.map(l =>
      `<div class="quest-item"><strong>${l.questTitle}</strong><div class="label">${new Date(l.at).toLocaleString('ja-JP')}</div><p>明日やること: ${l.action}</p></div>`
    ).join('') : '<p class="label">まだログがありません。</p>';
  },

  renderAdmin() {
    const attempts = MQStorage.getAttempts();
    const scores = MQStorage.getScores();
    const kpi = document.getElementById('adminKpi');
    kpi.innerHTML = `
      <div class="kpi"><span>対象者</span><strong>1名（MVP）</strong></div>
      <div class="kpi"><span>総攻略数</span><strong>${attempts.length}</strong></div>
      <div class="kpi"><span>今週実施</span><strong>${attempts.slice(0,7).length}</strong></div>
      <div class="kpi"><span>主要テーマ</span><strong>${attempts[0]?.theme || '未実施'}</strong></div>`;

    const themes = attempts.reduce((acc,a)=>{acc[a.theme]=(acc[a.theme]||0)+1;return acc;},{});
    document.getElementById('adminThemes').innerHTML = Object.entries(themes).map(([k,v]) => `<div class="status-row"><span>${k}</span><span>${v}</span></div>`).join('') || '<p class="label">まだデータがありません。</p>';
    document.getElementById('adminSkills').innerHTML = MQData.competencies.map(c => `<div class="status-row"><span>${c.adminLabel}</span><span>${scores[c.id]}</span></div>`).join('');
  },

  loadSettings() {
    const s = MQStorage.getSettings();
    document.getElementById('metaphorMode').value = s.metaphorMode;
    document.getElementById('notifyTime').value = s.notifyTime;
  },

  saveSettings() {
    MQStorage.setSettings({
      metaphorMode: document.getElementById('metaphorMode').value,
      notifyTime: document.getElementById('notifyTime').value
    });
    alert('設定を保存しました');
  },

  renderAll() {
    this.renderHome();
    this.renderStatus();
    this.renderQuestList();
    this.renderLogs();
    this.renderAdmin();
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
