'use strict';
(() => {
  const root = document.querySelector('main.wrap');
  if (!root || !window.StudyApp || !Array.isArray(DATA)) return;
  document.body.classList.add('quiz-v3');
  const headerDescription = document.querySelector('.heading .desc');
  if (headerDescription) headerDescription.textContent = '統計を1表ずつ出題。4択で回答し、確定・採点からNEXTへ。間違いは自動記録して復習できます。';
  const headerBadge = document.querySelector('header .local');
  if (headerBadge) headerBadge.textContent = '4択クイズ';
  const style = document.createElement('style');
  style.textContent = `
  body.quiz-v3 .summary,body.quiz-v3 .toolbar,body.quiz-v3 .sectionbar,body.quiz-v3 #cards,body.quiz-v3 #reviewPanel,body.quiz-v3 .sticky{display:none!important}
  #quizApp{margin:24px 0 44px}#quizApp .q-panel{background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px;box-shadow:var(--shadow);margin-bottom:18px}
  #quizApp .q-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap}#quizApp h2{font-size:21px;line-height:1.4;margin:3px 0 4px}#quizApp h3{font-size:15px;margin:0 0 8px}
  #quizApp .q-muted{font-size:13px;color:var(--muted)}#quizApp .q-eyebrow{font-size:11px;letter-spacing:.12em;font-weight:900;color:var(--blue)}
  #quizApp .q-filters{display:grid;grid-template-columns:1fr 1fr 1fr 1.2fr;gap:12px;margin-top:18px}#quizApp .q-field{display:flex;flex-direction:column;gap:5px}#quizApp .q-field label{font-size:12px;font-weight:800}
  #quizApp select,#quizApp input[type=search]{width:100%;height:43px;border-radius:10px;border:1px solid #c7d7e2;padding:0 11px;color:var(--navy);background:white}
  #quizApp .q-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:16px}#quizApp .q-pill{border:1px solid #cee1ec;background:#f3f9fc;padding:5px 11px;border-radius:999px;font-size:12px;font-weight:800}
  #quizApp .q-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0 0}#quizApp .q-stat{border-radius:12px;background:#f1f6f9;padding:12px 15px}#quizApp .q-stat b{font-size:23px;display:block;line-height:1.4}#quizApp .q-stat small{font-size:11px;color:var(--muted);font-weight:700}
  #quizApp .q-progress{height:7px;border-radius:20px;background:#e6eef3;overflow:hidden;margin:14px 0 20px}#quizApp .q-progress>div{height:100%;background:#18749b;transition:width .2s}
  #quizApp .q-tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px;margin:16px 0}#quizApp .q-table{border-collapse:collapse;width:100%;font-size:14px}#quizApp .q-table th{background:#edf4f8;font-size:12px;text-align:left;color:#49677a;padding:11px 12px}#quizApp .q-table td{padding:12px;border-top:1px solid #e7eef2}#quizApp .q-table th:last-child,#quizApp .q-table td:last-child{text-align:right}#quizApp .q-table tr.q-blank{background:#f4faff}#quizApp .q-table tr.q-wrong{background:#fff0f3}#quizApp .q-table tr.q-correct{background:#edfaf4}#quizApp .q-table .q-rank{white-space:nowrap;font-weight:800;color:#55778b}#quizApp .q-table .q-hidden{font-weight:900;color:#186f98}
  #quizApp .q-items{display:grid;grid-template-columns:1fr;gap:14px;margin-top:16px}#quizApp .q-question{border:1px solid #d8e5ec;border-radius:14px;padding:17px;background:#fff}#quizApp .q-questionhead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:11px;flex-wrap:wrap}#quizApp .q-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}#quizApp .q-choice{text-align:left;border:1px solid #cddce6;border-radius:11px;background:#f8fbfd;color:var(--navy);padding:11px 13px;font-weight:700;min-height:52px;transition:background .13s,border-color .13s}#quizApp .q-choice:hover:not(:disabled){border-color:#70b2d5;background:#edf8fd}#quizApp .q-choice.q-selected{border:2px solid #176b95;background:#e9f6ff;padding:10px 12px}#quizApp .q-choice.q-true{border-color:#248562;background:#e7f7ee;color:#176342}#quizApp .q-choice.q-false{border-color:#d64c66;background:#fff0f3;color:#9d253f}#quizApp .q-choice:disabled{opacity:1;cursor:default}
  #quizApp .q-feedback{font-weight:850;margin-top:10px;font-size:13px}#quizApp .q-feedback.good{color:var(--good)}#quizApp .q-feedback.bad{color:var(--bad)}#quizApp .q-result{padding:15px 18px;background:#f1f8fc;border-radius:12px;font-weight:850}#quizApp .q-bottom{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding-top:17px;border-top:1px solid #e8eff3;margin-top:18px}
  #quizApp .q-star{border:1px solid #d6e2e9;border-radius:9px;background:#fff;color:#8b9aa7;padding:6px 10px;font-weight:800}#quizApp .q-star.active{background:#fff4df;border-color:#ebc57d;color:#a2650a}#quizApp .q-records{display:grid;gap:9px;margin-top:14px}#quizApp .q-record{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:12px;border:1px solid #e1eaf0;border-radius:11px}#quizApp .q-empty{text-align:center;padding:40px 15px;color:#617587}#quizApp .q-reviewhint{border-left:4px solid #b78720;padding:8px 13px;background:#fff9e9;border-radius:4px;font-size:12px}
  @media(max-width:750px){#quizApp .q-filters{grid-template-columns:repeat(2,minmax(0,1fr))}#quizApp .q-panel{padding:15px}#quizApp .q-stats{grid-template-columns:repeat(3,minmax(0,1fr))}#quizApp .q-stat{padding:10px}#quizApp .q-stat b{font-size:20px}#quizApp .q-choices{grid-template-columns:1fr 1fr}#quizApp .q-choice{font-size:13px;padding:9px;min-height:51px}#quizApp .q-choice.q-selected{padding:8px}#quizApp .q-table{font-size:12px}#quizApp .q-table th,#quizApp .q-table td{padding:9px 7px}}
  @media(max-width:420px){#quizApp .q-filters{grid-template-columns:1fr 1fr}#quizApp .q-table th:last-child,#quizApp .q-table td:last-child{white-space:nowrap}#quizApp .q-record{align-items:flex-start}}
  `;
  document.head.appendChild(style);
  const section = document.createElement('section');
  section.id = 'quizApp';
  const categories = [...new Set(DATA.map(t => t.category))];
  section.innerHTML = `<div class="q-panel"><div class="q-heading"><div><div class="q-eyebrow">GEOGRAPHY / 4 CHOICES</div><h2>統計を1表ずつ、4択で覚える。</h2><p class="q-muted">掲載順位はすべて表示し、約半数の行を4択で出題。採点後に「NEXT」で次の統計へ進みます。</p></div><span class="q-pill" id="qSaveLabel">自動記録</span></div><div class="q-filters"><div class="q-field"><label for="qCategory">分野</label><select id="qCategory"><option value="all">すべての分野</option>${categories.map(c => `<option value="${h(c)}">${h(c)}</option>`).join('')}</select></div><div class="q-field"><label for="qMode">出題モード</label><select id="qMode"><option value="normal">通常演習</option><option value="review">間違えた問題だけ</option></select></div><div class="q-field"><label for="qLimit">出題する統計表</label><select id="qLimit"><option value="10">10表</option><option value="20">20表</option><option value="all">全表</option></select></div><div class="q-field"><label for="qSearch">検索（任意）</label><input type="search" id="qSearch" placeholder="例：原油、ブラジル"></div></div><div class="q-actions"><button type="button" class="btn primary" id="qStart">この条件で出題</button><button type="button" class="btn try" id="qTry">TRY：空欄を変える</button><button type="button" class="btn" id="qReview">誤答だけ復習</button></div><div class="q-stats"><div class="q-stat"><b id="qTableCount">104</b><small>収録統計表</small></div><div class="q-stat"><b id="qAccuracy">—</b><small>累計正答率</small></div><div class="q-stat"><b id="qWeak">0</b><small>要復習の順位</small></div></div></div><div id="qStage" class="q-panel" aria-live="polite"></div><div class="q-panel"><div class="q-heading"><div><h3>誤答ノート</h3><p class="q-muted">間違えた「統計表・順位」を保存。復習して正解すると自動で克服済みになります。</p></div><button class="btn" id="qShowAll" type="button">全件表示</button></div><div id="qRecords" class="q-records"></div><div class="q-actions"><button class="btn" id="qBackup" type="button">記録をバックアップ</button><button class="btn" id="qRestore" type="button">バックアップを復元</button><button class="btn ghost" id="qReset" type="button">記録を初期化</button></div></div>`;
  root.insertBefore(section, root.querySelector('footer.footer'));
  root.querySelector('footer.footer').innerHTML = '<p>出典：提供された地理参考書の統計写真。年次・順位は掲載時点のものです。学習履歴は端末内に保存し、Firebaseにログイン中はクラウドにも同期します。</p>';
  const el = id => document.getElementById(id);
  const state = {queue: [], index: 0, masks: [], selected: {}, choices: {}, graded: false, result: null, allRecords: false, lastMasks: {}};
  const escape = s => h(s);
  const rowKey = (table, i) => `${table.id}:${i}`;
  const current = () => state.queue[state.index] || null;
  const currentMode = () => el('qMode').value;
  const isWeak = k => pending(k);
  const random = array => shuffle(array);
  const normText = s => norm(s);
  const allNames = DATA.flatMap(t => t.rows.map(r => r.name));
  function maskFor(table, previous) {
    const indices = table.rows.map((_, i) => i);
    if (currentMode() === 'review') return indices.filter(i => isWeak(rowKey(table, i)));
    const size = Math.ceil(indices.length / 2);
    const chosen = random(indices).slice(0, size);
    if (previous && chosen.length < indices.length && chosen.every(i => previous.includes(i)) && previous.length === chosen.length) {
      const other = indices.find(i => !previous.includes(i));
      if (other !== undefined) chosen[0] = other;
    }
    return chosen.sort((a, b) => a - b);
  }
  function optionsFor(table, index) {
    const answer = table.rows[index].name;
    const sameTable = random([...new Set(table.rows.map(r => r.name).filter(n => n !== answer))]);
    const sameCategory = random([...new Set(DATA.filter(t => t.category === table.category).flatMap(t => t.rows.map(r => r.name)).filter(n => n !== answer))]);
    const sameLabel = random([...new Set(DATA.filter(t => t.answerLabel === table.answerLabel).flatMap(t => t.rows.map(r => r.name)).filter(n => n !== answer))]);
    const candidates = [...new Set([...sameTable, ...sameCategory, ...sameLabel, ...random(allNames)])];
    return random([answer, ...candidates.filter(n => n !== answer).slice(0, 3)]);
  }
  function setupTable(previous) {
    const table = current();
    state.selected = {};
    state.choices = {};
    state.graded = false;
    state.result = null;
    state.masks = table ? maskFor(table, previous) : [];
    if (table) for (const i of state.masks) state.choices[rowKey(table, i)] = optionsFor(table, i);
  }
  function start() {
    const cat = el('qCategory').value;
    const query = normText(el('qSearch').value);
    const mode = currentMode();
    const matching = DATA.filter(t => (cat === 'all' || t.category === cat) && (!query || normText(`${t.name} ${t.rows.map(r => r.name).join(' ')}`).includes(query)) && (mode === 'normal' || t.rows.some((_, i) => isWeak(rowKey(t, i)))));
    const limit = el('qLimit').value;
    state.queue = random(matching).slice(0, limit === 'all' ? matching.length : Number(limit));
    state.index = 0;
    state.lastMasks = {};
    setupTable();
    render();
    el('qStage').scrollIntoView({behavior: 'smooth', block: 'start'});
  }
  function retry() {
    const table = current();
    if (!table) return start();
    const previous = [...state.masks];
    setupTable(previous);
    render();
    el('qStage').scrollIntoView({behavior: 'smooth', block: 'start'});
  }
  function goNext() {
    if (!state.graded) return;
    state.index += 1;
    setupTable();
    render();
    el('qStage').scrollIntoView({behavior: 'smooth', block: 'start'});
  }
  function gradeTable() {
    if (state.graded || !current() || state.masks.some(i => !state.selected[rowKey(current(), i)])) return;
    const table = current();
    const at = new Date().toISOString();
    let correct = 0;
    const rows = [];
    for (const i of state.masks) {
      const k = rowKey(table, i);
      const good = state.selected[k] === table.rows[i].name;
      const rec = persistent.records[k] || {attempts: 0, wrong: 0, mastered: false, lastWrong: ''};
      rec.attempts += 1;
      persistent.answered += 1;
      if (good) {
        correct += 1;
        persistent.correct += 1;
        if (rec.wrong > 0) {rec.mastered = true; rec.masteredAt = at;}
      } else {rec.wrong += 1; rec.mastered = false; rec.lastWrong = at;}
      persistent.records[k] = rec;
      rows.push({key: k, good});
    }
    persistent.history.unshift({date: at, correct, answered: rows.length, unanswered: 0, tables: [table.id]});
    persistent.history = persistent.history.slice(0, 200);
    state.graded = true;
    state.result = {correct, total: rows.length};
    save();
    notifyCloud({type: 'grade', at, rows, unanswered: 0, tables: [table.id]});
    render();
  }
  function toggleStar(k) {
    if (persistent.marks[k]) delete persistent.marks[k];
    else persistent.marks[k] = true;
    const checked = !!persistent.marks[k];
    save();
    notifyCloud({type: 'mark', key: k, checked, at: new Date().toISOString()});
    render();
  }
  function toggleMastered(k) {
    const rec = persistent.records[k];
    if (rec) {rec.mastered = !rec.mastered; if (rec.mastered) rec.masteredAt = new Date().toISOString();}
    if (persistent.marks[k]) delete persistent.marks[k];
    save();
    notifyCloud({type: 'master', key: k, mastered: !!rec?.mastered, at: new Date().toISOString()});
    render();
  }
  function updateStats() {
    el('qTableCount').textContent = DATA.length;
    el('qWeak').textContent = countPending();
    el('qAccuracy').textContent = persistent.answered ? `${Math.round(persistent.correct / persistent.answered * 100)}%` : '—';
  }
  function renderRows(table) {
    const masked = new Set(state.masks);
    return `<div class="q-tablewrap"><table class="q-table"><thead><tr><th>順位</th><th>${escape(table.answerLabel)}</th><th>${table.unit === '%' ? '構成比' : '値'} ${escape(table.unit)}</th><th>復習</th></tr></thead><tbody>${table.rows.map((row, i) => {
      const k = rowKey(table, i), hidden = masked.has(i), selected = state.selected[k], good = selected === row.name;
      const css = hidden && state.graded ? (good ? 'q-correct' : 'q-wrong') : (hidden ? 'q-blank' : '');
      const name = hidden ? (state.graded ? (good ? `✓ ${escape(row.name)}` : `✕ 正解：${escape(row.name)}`) : selected ? `選択：${escape(selected)}` : `？ 4択で回答`) : escape(row.name);
      return `<tr class="${css}"><td class="q-rank">${i + 1}位</td><td class="${hidden ? 'q-hidden' : ''}">${name}</td><td>${escape(row.value)}${table.unit === '%' ? '%' : ''}</td><td><button type="button" class="q-star ${isWeak(k) ? 'active' : ''}" data-star="${escape(k)}" aria-label="${i+1}位を復習に登録・解除">${isWeak(k) ? '★' : '☆'}</button></td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function renderQuestions(table) {
    return `<div class="q-items">${state.masks.map((i, n) => {
      const k = rowKey(table, i), correctAnswer = table.rows[i].name, selected = state.selected[k], good = selected === correctAnswer;
      return `<div class="q-question"><div class="q-questionhead"><strong>Q${n + 1}　${i + 1}位の${escape(table.answerLabel)}は？</strong><span class="q-muted">${escape(table.name)}／${escape(table.rows[i].value)}${table.unit === '%' ? '%' : ''}</span></div><div class="q-choices">${state.choices[k].map((choice, j) => {
        const classes = ['q-choice'];
        if (choice === selected) classes.push('q-selected');
        if (state.graded && choice === correctAnswer) classes.push('q-true');
        if (state.graded && choice === selected && !good) classes.push('q-false');
        return `<button type="button" class="${classes.join(' ')}" data-choice-key="${escape(k)}" data-choice-index="${j}" aria-pressed="${choice === selected}" ${state.graded ? 'disabled' : ''}>${String.fromCharCode(65 + j)}. ${escape(choice)}</button>`;
      }).join('')}</div>${state.graded ? `<div class="q-feedback ${good ? 'good' : 'bad'}">${good ? '✓ 正解！' : `✕ 不正解。正解は「${escape(correctAnswer)}」です。復習ノートに記録しました。`}</div>` : ''}</div>`;
    }).join('')}</div>`;
  }
  function renderStage() {
    const table = current();
    if (!state.queue.length) {
      el('qStage').innerHTML = `<div class="q-empty"><h2>出題できる統計がありません</h2><p>${currentMode() === 'review' ? 'この分野に未克服の誤答がありません。通常演習で学習を進めましょう。' : '検索条件・分野を変更してください。'}</p></div>`;
      return;
    }
    if (!table) {
      el('qStage').innerHTML = `<div class="q-empty"><h2>今回の学習は完了です！</h2><p>${state.queue.length}表を学習しました。誤答は自動記録されています。</p><div class="q-actions" style="justify-content:center"><button id="qFinishReview" class="btn primary">間違えた問題を復習する</button><button id="qFinishAgain" class="btn try">もう一度TRY</button></div></div>`;
      return;
    }
    const progress = Math.round(state.index / state.queue.length * 100);
    const answeredCount = state.masks.filter(i => state.selected[rowKey(table, i)]).length;
    const allAnswered = state.masks.length > 0 && answeredCount === state.masks.length;
    el('qStage').innerHTML = `<div class="q-heading"><div><div class="q-eyebrow">${currentMode() === 'review' ? 'REVIEW MODE / 誤答のみ' : 'NORMAL MODE / 通常演習'}</div><h2>${escape(table.name)}</h2><div class="q-muted">${escape(table.category)} ・ ${escape(table.year)}年 ・ ${escape(table.source)} ・ 全${table.rows.length}順位</div></div><div class="q-pill">${state.index + 1} / ${state.queue.length} 表</div></div><div class="q-progress" aria-label="進捗"><div style="width:${progress}%"></div></div><p class="q-muted">${currentMode() === 'review' ? '未克服の順位だけを4択で確認します。' : '掲載順位をすべて残し、約半数を4択にしています。'} 全部選択したら「確定・採点」を押してください。</p>${renderRows(table)}${renderQuestions(table)}${state.graded ? `<div class="q-result">${state.result.correct} / ${state.result.total} 正解。${state.result.total === state.result.correct ? '全問正解です！' : '間違えた順位を復習ノートに保存しました。'}</div>` : ''}<div class="q-bottom"><div><strong>${state.graded ? '採点完了' : `選択済み：${answeredCount}/${state.masks.length}`}</strong><div class="q-muted">${state.graded ? 'NEXTを押すと次の統計に進みます。' : '確定後は選択を変更できません。'}</div></div><div class="q-actions" style="margin:0"><button type="button" id="qConfirm" class="btn primary" ${state.graded || !allAnswered ? 'disabled' : ''}>確定・採点</button><button type="button" id="qNext" class="btn try" ${!state.graded ? 'disabled' : ''}>NEXT →</button></div></div>`;
  }
  function renderRecords() {
    const entries = Object.entries(persistent.records).filter(([, v]) => v?.wrong > 0).sort((a,b) => (b[1].lastWrong || '').localeCompare(a[1].lastWrong || ''));
    el('qShowAll').textContent = state.allRecords ? '少なく表示' : `全件表示（${entries.length}件）`;
    const shown = state.allRecords ? entries : entries.slice(0, 8);
    el('qRecords').innerHTML = shown.length ? shown.map(([k, r]) => {
      const [id, index] = k.split(':'), t = cardMap.get(id), i = Number(index), row = t?.rows[i];
      if (!row) return '';
      return `<div class="q-record"><div><b>${escape(t.name)}｜${i + 1}位：${escape(row.name)}</b><div class="q-muted">間違えた回数：${r.wrong}回 ・ ${isWeak(k) ? '要復習' : '克服済み'}</div></div><button type="button" class="btn" data-master="${escape(k)}">${isWeak(k) ? '克服済みにする' : 'もう一度復習'}</button></div>`;
    }).join('') : '<div class="q-muted">まだ誤答はありません。採点すると間違えた順位がここに記録されます。</div>';
  }
  function render() {updateStats(); renderStage(); renderRecords();}
  el('qStart').addEventListener('click', start);
  el('qTry').addEventListener('click', retry);
  el('qReview').addEventListener('click', () => {el('qMode').value = 'review';start();});
  el('qSearch').addEventListener('keydown', e => {if (e.key === 'Enter') start();});
  el('qStage').addEventListener('click', e => {
    const choice = e.target.closest('[data-choice-key]');
    if (choice && !state.graded) {
      const k = choice.dataset.choiceKey, i = Number(choice.dataset.choiceIndex);
      if (state.choices[k]?.[i] !== undefined) {state.selected[k] = state.choices[k][i]; renderStage();}
      return;
    }
    const star = e.target.closest('[data-star]');
    if (star) {toggleStar(star.dataset.star); return;}
    if (e.target.closest('#qConfirm')) gradeTable();
    else if (e.target.closest('#qNext')) goNext();
    else if (e.target.closest('#qFinishReview')) {el('qMode').value = 'review';start();}
    else if (e.target.closest('#qFinishAgain')) {el('qMode').value = 'normal';start();}
  });
  el('qRecords').addEventListener('click', e => {const btn = e.target.closest('[data-master]');if (btn) toggleMastered(btn.dataset.master);});
  el('qShowAll').addEventListener('click', () => {state.allRecords = !state.allRecords;renderRecords();});
  el('qBackup').addEventListener('click', backup);
  el('qRestore').addEventListener('click', () => el('restoreFile').click());
  el('qReset').addEventListener('click', () => {
    if (!confirm('学習履歴と誤答記録をすべて消去しますか？元に戻せません。')) return;
    persistent = emptyStore();save();notifyCloud({type: 'reset', at: new Date().toISOString()});start();
  });
  const originalSetState = window.StudyApp.setState;
  window.StudyApp.setState = data => {originalSetState(data);render();};
  el('restoreFile').addEventListener('change', () => {setTimeout(render, 300);});
  start();
})();
