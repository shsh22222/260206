const MQData = (() => {
  const competencies = [
    ['quest_grasp', 'クエスト把握力', '目的明確化'],
    ['goal_setting', 'ゴール設定力', 'スコープ設定'],
    ['expect_align', '期待値調整力', 'ステークホルダー調整'],
    ['ai_delegate', 'AI委任判断力', 'AI/HI役割判断'],
    ['human_judge', '人間判断力', '最終責任判断'],
    ['teamplay', '仲間連携力', 'コラボレーション'],
    ['feedback_loop', 'フィードバック循環力', 'フィードバック活用'],
    ['boss_battle', 'ボス戦対応力', '難局対応'],
    ['risk_sense', 'リスク察知力', '予兆把握'],
    ['reframing', '問い直し力', 'リフレクション']
  ].map(([id, userLabel, adminLabel]) => ({ id, userLabel, adminLabel }));

  const baseQuests = [
    { title:'朝会の霧を晴らせ', theme:'上司部下', difficulty:'初級', situation:'朝会が報告会で終わり、優先順位が曖昧。', questions:['本当のゴールは？','誰の期待値を揃える？'], options:[['進捗報告のみ継続',{goal_setting:1}],['最重要1点を全員宣言',{goal_setting:3,teamplay:2}],['課題者のみ別会議',{teamplay:1,risk_sense:1}]] },
    { title:'AI下書きの境界線', theme:'AI判断', difficulty:'中級', situation:'AI生成ドラフトの品質と責任範囲が曖昧。', questions:['AIに任せる範囲は？','人が最終判断すべき点は？'], options:[['全文AI任せ',{ai_delegate:1,risk_sense:-1}],['構成はAI/意思決定は人',{ai_delegate:3,human_judge:3}],['全部人で作る',{human_judge:1,ai_delegate:-1}]] },
    { title:'炎上前夜のボス戦', theme:'難局対応', difficulty:'上級', situation:'部門横断PJで認識ズレ、遅延兆候。', questions:['最優先調整先は？','見落としリスクは？'], options:[['全体会議を即開催',{boss_battle:2,expect_align:2}],['担当者に丸投げ',{teamplay:-1,boss_battle:-1}],['まずゴール再定義と責任線を整理',{boss_battle:3,quest_grasp:2,human_judge:1}]] }
  ];

  const themes = ['AI判断', '上司部下', '報連相', '1on1', '期待値調整', '難局対応'];
  const difficulties = ['初級', '中級', '上級'];
  const quests = [];
  let id = 1;
  for (const b of baseQuests) quests.push({ id: id++, ...b, durationMin: 5 });

  for (const theme of themes) {
    for (const diff of difficulties) {
      for (let i = 0; i < 2; i++) {
        const c = competencies[(id + i) % competencies.length].id;
        quests.push({
          id: id++,
          title: `${theme}クエスト ${id}`,
          theme,
          difficulty: diff,
          durationMin: diff === '上級' ? 7 : 4,
          situation: `${theme}に関する判断で認識ズレが発生。現場負荷を増やさずに前進させる。`,
          questions: ['このクエストの本当のゴールは何か', '明日、現場で1つだけ変えるなら何か'],
          options: [
            ['とりあえず現状維持', { [c]: 0 }],
            ['関係者の期待値を明文化', { expect_align: 2, [c]: 2 }],
            ['AIと人の役割を再設計', { ai_delegate: 2, human_judge: 1, [c]: 1 }]
          ]
        });
      }
    }
  }

  return { competencies, quests };
})();
