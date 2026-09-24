// 난세영웅전 — 화면과 입력

const SAVE_KEY = 'nanse-hero-save-v1';
const app = document.getElementById('app');

let S = null;          // 진영 상태 (저장 대상)
let B = null;          // 진행 중인 전투
let view = 'title';
const ui = { mode: 'wait', pending: null, sheet: null, story: null, result: null, after: null, confirmReset: false };
let timer = null;

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pct = (v, max) => Math.max(0, Math.min(100, Math.round(v / max * 100)));

// ── 저장 ───────────────────────────────────────────────
function save() {
  if (!S) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* 저장소를 쓸 수 없는 환경 */ }
}
function loadSave() {
  try {
    const t = localStorage.getItem(SAVE_KEY);
    const s = t && JSON.parse(t);
    return s && s.v === 1 && FACTIONS[s.faction] ? s : null;
  } catch (e) { return null; }
}
function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 무시 */ }
}

function toast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1900);
}

// ── 공통 조각 ──────────────────────────────────────────
function factionOfGeneral(id) {
  return Object.keys(FACTIONS).find(f => FACTIONS[f].start.includes(id) || FACTIONS[f].join === id);
}

function speakerToken(name) {
  const gid = Object.keys(GENERALS).find(id => GENERALS[id].name === name);
  if (gid && factionOfGeneral(gid) === S.faction) {
    return `<span class="token ${S.faction}">${GENERALS[gid].ch}</span>`;
  }
  const foe = Object.values(ENEMIES).find(e => e.name === name);
  const ch = foe ? foe.ch : gid ? GENERALS[gid].ch : name[0];
  return `<span class="token foe">${ch}</span>`;
}

function storyLines(block) {
  if (!block) return [];
  return [...(block.common || []), ...(block[S.faction] || [])];
}

function hpBar(v, max) {
  const p = pct(v, max);
  const cls = p <= 25 ? 'crit' : p <= 50 ? 'low' : '';
  return `<div class="bar hp ${cls}"><i style="width:${p}%"></i></div>`;
}

// ── 타이틀 ─────────────────────────────────────────────
function renderTitle() {
  const saved = loadSave();
  const cont = saved
    ? `${FACTIONS[saved.faction].army} · 제${Math.min(saved.chapter + 1, CHAPTERS.length)}장`
    : '저장된 기록 없음';
  return `
  <section class="title-screen">
    <div class="title-mark"><span class="seal">亂</span><span class="years">一八四 — 二〇八</span></div>
    <h1>난세영웅전</h1>
    <p class="lede"><strong>창천은 이미 죽었으니 황천이 마땅히 서리라.</strong><br>
      누런 두건의 봉기로 시작된 난세. 황건적의 난부터 적벽대전까지, 다섯 장에 걸친 전장을 무장들과 함께 헤쳐 나가십시오.</p>
    <div class="title-actions">
      <button class="btn primary" data-act="new">새로운 여정<small>세력을 골라 시작</small></button>
      <button class="btn" data-act="continue" ${saved ? '' : 'disabled'}>이어하기<small>${esc(cont)}</small></button>
    </div>
    <p class="title-foot">진행 상황은 이 브라우저에 자동으로 저장됩니다.</p>
  </section>`;
}

function renderFactions() {
  const cards = Object.entries(FACTIONS).map(([key, f]) => {
    const names = f.start.map(id => GENERALS[id].name).join(' · ');
    return `
    <button class="faction ${key}" data-act="pick" data-arg="${key}">
      <span class="seal">${f.seal}</span>
      <h3>${f.army}</h3>
      <p>${f.blurb}</p>
      <p class="members">${names} <span>· 이후 ${GENERALS[f.join].name} 합류</span></p>
    </button>`;
  }).join('');
  return `
  <section>
    <div class="screen-head"><span class="label">세력 선택</span><h2>누구의 깃발 아래 서겠습니까</h2></div>
    <div class="factions">${cards}</div>
    <p style="margin-top:16px"><button class="btn" data-act="title">돌아가기</button></p>
  </section>`;
}

// ── 이야기 ─────────────────────────────────────────────
function playStory(lines, chapterIdx, then) {
  if (!lines.length) { then(); return; }
  ui.story = { lines, i: 0, chapterIdx, then };
  view = 'story';
  render();
}

function renderStory() {
  const st = ui.story;
  const [speaker, text] = st.lines[st.i];
  const chap = st.chapterIdx != null ? CHAPTERS[st.chapterIdx] : null;
  const head = chap ? `
    <div class="chapter-card">
      <span class="label">제${st.chapterIdx + 1}장 · ${esc(chap.year)}</span>
      <span class="hanja">${chap.hanja}</span>
      <span class="meta">${esc(chap.title)} — ${esc(chap.place)}</span>
    </div>` : '';
  const box = speaker
    ? `<div class="dialogue" data-act="story-next" tabindex="0" role="button">
        ${speakerToken(speaker)}<span class="speaker">${esc(speaker)}</span><p>${esc(text)}</p>
        <span class="more">${st.i + 1} / ${st.lines.length} · 눌러서 계속 ▸</span></div>`
    : `<div class="dialogue narration" data-act="story-next" tabindex="0" role="button">
        <p>${esc(text)}</p><span class="more">${st.i + 1} / ${st.lines.length} · 눌러서 계속 ▸</span></div>`;
  return `
  <section class="story">
    ${head}
    ${box}
    <div class="story-foot"><span>화면을 누르거나 Enter 키로 넘깁니다.</span><button class="btn" data-act="story-skip">건너뛰기</button></div>
  </section>`;
}

function storyNext() {
  const st = ui.story;
  st.i++;
  if (st.i >= st.lines.length) { ui.story = null; st.then(); } else render();
}

// ── 진영 ───────────────────────────────────────────────
function goCamp() {
  if (S.cleared) { view = 'ending'; render(); return; }
  if (S.introSeen < S.chapter) {
    const chap = CHAPTERS[S.chapter];
    playStory(storyLines(chap.intro), S.chapter, () => { S.introSeen = S.chapter; save(); goCamp(); });
    return;
  }
  view = 'camp';
  save();
  render();
}

function renderCamp() {
  const f = FACTIONS[S.faction];
  const chap = CHAPTERS[S.chapter];
  const stage = currentStage(S);
  const route = chap.stages.map((st, i) => {
    const cls = i < S.stage ? 'done' : i === S.stage ? 'here' : '';
    const mark = i < S.stage ? '✓' : st.boss ? '將' : i + 1;
    return `<div class="stop ${cls} ${st.boss ? 'boss' : ''}"><span class="pin"><span>${mark}</span></span>
      <span class="nm">${esc(forFaction(st.name, S.faction))}</span></div>`;
  }).join('');
  const lvAvg = Math.round(S.party.reduce((s, m) => s + m.lv, 0) / S.party.length);
  const stageName = forFaction(stage.name, S.faction);
  return `
  <section>
    <header class="topbar">
      <span class="seal">${f.seal}</span>
      <div class="who"><b>${f.army}</b><span>제${S.chapter + 1}장 · ${esc(chap.title)}</span></div>
      <div class="gold"><b class="num">${S.gold.toLocaleString()}</b><span>금</span></div>
    </header>

    <div class="campaign">
      <span class="hanja">${chap.hanja}</span>
      <h2>${esc(chap.title)}</h2>
      <span class="meta">${esc(chap.year)} · ${esc(chap.place)} · 권장 ${chap.rec} (현재 평균 Lv ${lvAvg})</span>
    </div>
    <div class="route">${route}</div>
    ${chap.tip && stage.boss ? `<p class="tip">${esc(chap.tip)}</p>` : ''}

    <div class="commands">
      <button class="btn primary" data-act="sortie">출진 — ${esc(stageName)}<small>${stage.boss ? '결전 · 퇴각 불가' : `${S.stage + 1}번째 전장`}</small></button>
      <button class="btn" data-act="train">수련<small>경험치와 금</small></button>
      <button class="btn" data-act="sheet" data-arg="inn">주막<small>휴식 ${innCost(S)}금</small></button>
      <button class="btn" data-act="sheet" data-arg="items">도구<small>군량 창고</small></button>
      <button class="btn" data-act="sheet" data-arg="shop">상점<small>약초·환약·탁주</small></button>
      <button class="btn" data-act="sheet" data-arg="smith">대장간<small>무기·갑옷 단련</small></button>
      <button class="btn" data-act="sheet" data-arg="menu">군령<small>저장·처음으로</small></button>
    </div>

    <div class="section-title"><h3>휘하 무장</h3><span>${S.party.length}명 · 전투 ${S.battles}회</span></div>
    <div class="roster">${S.party.map(officerCard).join('')}</div>
  </section>`;
}

function officerCard(m) {
  const g = GENERALS[m.id], s = heroStats(m);
  const need = xpToNext(m.lv);
  return `
  <article class="officer ${m.hp <= 0 ? 'down' : ''}">
    <div class="head">
      <span class="token ${S.faction}">${g.ch}</span>
      <div class="nm"><b>${g.name} <small style="color:var(--paper-faint);font-size:12px">${g.hanja}</small></b><span>자 ${g.style} · ${g.role}</span></div>
      <span class="lv num">Lv ${m.lv}</span>
    </div>
    <div class="bars num">
      <span>체력</span>${hpBar(m.hp, s.hp)}<span class="v">${m.hp} / ${s.hp}</span>
      <span>기력</span><div class="bar mp"><i style="width:${pct(m.mp, s.mp)}%"></i></div><span class="v">${m.mp} / ${s.mp}</span>
      <span>경험</span><div class="bar xp"><i style="width:${pct(m.xp, need)}%"></i></div><span class="v">${m.xp} / ${need}</span>
    </div>
    <div class="stats num">
      ${['atk', 'int', 'def', 'spd'].map(k => `<div><span>${STAT_LABEL[k]}</span><b>${s[k]}</b></div>`).join('')}
    </div>
    <div class="gear"><span>무기 <em>+${m.wpn}</em></span><span>갑옷 <em>+${m.arm}</em></span>
      <span>책략: ${g.skills.map(id => SKILLS[id].name).join(', ')}</span></div>
  </article>`;
}

// ── 시트 ───────────────────────────────────────────────
function renderSheet() {
  const name = ui.sheet;
  let title = '', body = '';
  if (name === 'inn') {
    const cost = innCost(S);
    const full = S.party.every(m => { const s = heroStats(m); return m.hp >= s.hp && m.mp >= s.mp; });
    title = '주막';
    body = `<p class="hint">따뜻한 국밥과 하룻밤 잠자리. 모든 무장의 체력과 기력이 가득 찹니다.</p>
      <div class="rows"><div class="row"><div class="t"><b>하룻밤 묵기</b><span>${full ? '모두 기운이 넘칩니다.' : '쓰러진 무장도 다시 일어섭니다.'}</span></div>
      <div class="acts"><button class="btn primary" data-act="rest" ${S.gold < cost || full ? 'disabled' : ''}>${cost}금 내고 쉬기</button></div></div></div>`;
  } else if (name === 'shop') {
    title = '상점';
    body = `<p class="hint">소지금 <b class="num">${S.gold}</b>금</p><div class="rows">` +
      Object.entries(ITEMS).map(([id, it]) => `
        <div class="row"><div class="t"><b>${it.name} <span class="num">· 보유 ${S.items[id] || 0}</span></b><span>${it.desc}</span></div>
        <div class="acts">
          <button class="btn" data-act="buy" data-arg="${id}:1" ${S.gold < it.price ? 'disabled' : ''}>${it.price}금</button>
          <button class="btn" data-act="buy" data-arg="${id}:5" ${S.gold < it.price * 5 ? 'disabled' : ''}>5개 ${it.price * 5}금</button>
        </div></div>`).join('') + '</div>';
  } else if (name === 'smith') {
    title = '대장간';
    body = `<p class="hint">무기 단련 1회당 무력 +4 · 지력 +3, 갑옷 단련 1회당 통솔 +3 · 체력 +25. 최대 +${MAX_GEAR}. 소지금 <b class="num">${S.gold}</b>금</p><div class="rows">` +
      S.party.map((m, i) => {
        const g = GENERALS[m.id];
        const btn = (slot, lvl, label) => lvl >= MAX_GEAR
          ? `<button class="btn" disabled>${label} 최대</button>`
          : `<button class="btn" data-act="forge" data-arg="${i}:${slot}" ${S.gold < gearCost(lvl) ? 'disabled' : ''}>${label} +${lvl + 1} · ${gearCost(lvl)}금</button>`;
        return `<div class="row"><div class="t"><b>${g.name}</b><span>무기 +${m.wpn} · 갑옷 +${m.arm}</span></div>
          <div class="acts">${btn('wpn', m.wpn, '무기')}${btn('arm', m.arm, '갑옷')}</div></div>`;
      }).join('') + '</div>';
  } else if (name === 'items') {
    title = '도구';
    const held = Object.entries(ITEMS).filter(([id]) => S.items[id] > 0);
    body = held.length
      ? `<p class="hint">쓸 도구를 고른 뒤 대상 무장을 누르세요.</p><div class="rows">` + held.map(([id, it]) => `
        <div class="row"><div class="t"><b>${it.name} <span class="num">× ${S.items[id]}</span></b><span>${it.desc}</span></div>
        <div class="picker">${S.party.map((m, i) => {
          const s = heroStats(m);
          return `<button class="btn" data-act="camp-item" data-arg="${id}:${i}">${GENERALS[m.id].name} <span class="num" style="color:var(--paper-faint)">${m.hp}/${s.hp}</span></button>`;
        }).join('')}</div></div>`).join('') + '</div>'
      : `<p class="hint">창고가 비었습니다. 상점에서 도구를 사 두세요.</p>`;
  } else if (name === 'menu') {
    title = '군령';
    body = `<div class="rows">
      <div class="row"><div class="t"><b>기록 저장</b><span>진영에 돌아올 때마다 자동으로 저장됩니다.</span></div>
        <div class="acts"><button class="btn" data-act="save">지금 저장</button></div></div>
      <div class="row"><div class="t"><b>타이틀로</b><span>진행 상황은 그대로 남습니다.</span></div>
        <div class="acts"><button class="btn" data-act="title">타이틀로</button></div></div>
      <div class="row"><div class="t"><b>처음부터 다시</b><span>저장된 기록을 지우고 세력 선택으로 돌아갑니다.</span></div>
        <div class="acts"><button class="btn ${ui.confirmReset ? 'primary' : ''}" data-act="reset">${ui.confirmReset ? '한 번 더 누르면 삭제' : '기록 지우기'}</button></div></div>
    </div>`;
  }
  return `<div class="sheet-back" data-act="sheet-close-back"><div class="sheet" role="dialog" aria-label="${title}">
    <header><h3>${title}</h3><button class="btn" data-act="sheet-close">닫기</button></header>${body}</div></div>`;
}

// ── 전투 ───────────────────────────────────────────────
function startBattle(kind) {
  const chap = CHAPTERS[S.chapter];
  let ids, title, boss = false;
  if (kind === 'stage') {
    const st = currentStage(S);
    ids = stageEnemies(S);
    title = forFaction(st.name, S.faction);
    boss = !!st.boss;
  } else {
    ids = trainingEnemies(S);
    title = `${chap.place.split(' — ')[0]} 인근 수련`;
  }
  B = createBattle(S, ids, { kind, boss, title });
  B.active = null;
  B.acting = null;
  ui.mode = 'wait';
  ui.pending = null;
  view = 'battle';
  render();
  timer = setTimeout(advance, 450);
}

function speed() { return 620; }

function advance() {
  if (view !== 'battle') return;
  const a = nextActor(B);
  B.acting = null;
  if (!a) { B.active = null; render(); timer = setTimeout(endBattle, 700); return; }
  B.active = a.uid;
  if (a.side === 'p') {
    ui.mode = 'command';
    render();
  } else {
    ui.mode = 'wait';
    render();
    timer = setTimeout(() => {
      enemyAct(B, a);
      B.acting = a.uid;
      render();
      timer = setTimeout(advance, speed());
    }, speed() * .6);
  }
}

function actor() { return B && B.units.find(u => u.uid === B.active); }

function afterPlayer() {
  ui.mode = 'wait';
  ui.pending = null;
  B.acting = B.active;
  render();
  timer = setTimeout(advance, speed());
}

function chooseTarget(uid) {
  const a = actor(), p = ui.pending;
  if (!a || !p) return;
  if (p.type === 'attack') attack(B, a, uid);
  else if (p.type === 'skill') useSkill(B, a, p.id, uid);
  else if (p.type === 'item' && !useItem(S, B, a, p.id, uid)) return;
  afterPlayer();
}

function isTargetable(u) {
  if (ui.mode !== 'target' || !ui.pending) return false;
  const want = ui.pending.targets;
  if (want === 'enemy') return u.side === 'e' && u.hp > 0;
  if (want === 'ally') return u.side === 'p' && u.hp > 0;
  if (want === 'fallen') return u.side === 'p' && u.hp <= 0;
  return false;
}

function unitCard(u) {
  const tgt = isTargetable(u);
  const cls = ['unit', u.boss ? 'boss' : '', u.hp <= 0 ? 'dead' : '',
    B.active === u.uid && ui.mode !== 'wait' ? 'active' : '',
    B.acting === u.uid ? 'acting' : '', tgt ? 'targetable' : '', tgt && u.side === 'p' ? 'friendly' : ''].join(' ');
  const marks = [];
  if (u.buffs.atk) marks.push(`<i class="atk">공↑${u.buffs.atk}</i>`);
  if (u.buffs.def) marks.push(`<i class="def">방↑${u.buffs.def}</i>`);
  if (u.status.burn) marks.push(`<i class="burn">화상</i>`);
  if (u.status.stun) marks.push(`<i class="stun">기절</i>`);
  if (u.guard) marks.push(`<i class="guard">방어</i>`);
  if (u.actions > 1) marks.push(`<i>2회 행동</i>`);
  const tokenCls = u.side === 'p' ? S.faction : u.boss ? 'boss' : 'foe';
  const sub = u.side === 'p' ? `Lv ${u.lv}` : (u.title || (u.elite ? '명장' : '병사'));
  const inner = `
    <div class="top"><span class="token ${tokenCls}">${u.ch}</span>
      <div class="nm"><b>${esc(u.name)}</b><span>${esc(sub)}</span></div></div>
    ${hpBar(u.hp, u.maxHp)}
    ${u.side === 'p' ? `<div class="bar mp"><i style="width:${pct(u.mp, u.maxMp)}%"></i></div>` : ''}
    <div class="hpnum num"><span>${u.hp}/${u.maxHp}</span>${u.side === 'p' ? `<span>${u.mp}</span>` : ''}</div>
    <div class="marks">${marks.join('')}</div>`;
  return tgt
    ? `<button class="${cls}" data-uid="${u.uid}" data-act="target" data-arg="${u.uid}">${inner}</button>`
    : `<div class="${cls}" data-uid="${u.uid}">${inner}</div>`;
}

function renderCommand() {
  const a = actor();
  if (ui.mode === 'wait' || !a || a.side !== 'p') {
    const who = a && a.side === 'e' ? `${a.name}의 차례…` : B.over ? '전투 종료' : '…';
    return `<div class="cmd"><p class="waiting">${esc(who)}</p></div>`;
  }
  const who = `<div class="who"><span class="token ${S.faction}">${a.ch}</span><span><b>${a.name}</b>의 차례</span>
    <span class="mpline num">기력 ${a.mp} / ${a.maxMp}</span></div>`;
  if (ui.mode === 'command') {
    return `<div class="cmd">${who}<div class="cmd-grid">
      <button class="btn primary" data-act="cmd-attack">공격</button>
      <button class="btn" data-act="cmd-skill">책략</button>
      <button class="btn" data-act="cmd-item">도구</button>
      <button class="btn" data-act="cmd-guard">방어</button>
      <button class="btn" data-act="cmd-flee" ${B.boss ? 'disabled' : ''}>퇴각</button>
    </div></div>`;
  }
  if (ui.mode === 'skills') {
    const list = a.skills.map(id => {
      const sk = SKILLS[id];
      return `<button class="btn" data-act="skill" data-arg="${id}" ${a.mp < sk.mp ? 'disabled' : ''}>
        <b>${sk.name}</b><span class="cost num">기력 ${sk.mp}</span><small>${sk.desc}</small></button>`;
    }).join('');
    return `<div class="cmd">${who}<div class="cmd-list">${list}</div><button class="btn back" data-act="cmd-back">← 돌아가기</button></div>`;
  }
  if (ui.mode === 'items') {
    const held = Object.entries(ITEMS).filter(([id]) => S.items[id] > 0);
    const list = held.length ? held.map(([id, it]) => `
      <button class="btn" data-act="item" data-arg="${id}"><b>${it.name}</b><span class="num">× ${S.items[id]}</span><small>${it.desc}</small></button>`).join('')
      : '<p class="waiting">가진 도구가 없습니다.</p>';
    return `<div class="cmd">${who}<div class="cmd-list">${list}</div><button class="btn back" data-act="cmd-back">← 돌아가기</button></div>`;
  }
  if (ui.mode === 'target') {
    const msg = { enemy: '공격할 적을 누르세요.', ally: '도울 아군을 누르세요.', fallen: '일으킬 무장을 누르세요.' }[ui.pending.targets];
    return `<div class="cmd">${who}<p class="waiting">${msg}</p><button class="btn back" data-act="cmd-back">← 돌아가기</button></div>`;
  }
  return '';
}

function renderBattle() {
  const foes = B.units.filter(u => u.side === 'e');
  const party = B.units.filter(u => u.side === 'p');
  return `
  <section class="battle">
    <div class="battle-head"><b>${esc(B.title)}</b><span class="num">${B.boss ? '결전 · ' : B.kind === 'train' ? '수련 · ' : ''}제${Math.max(1, B.round)}합</span></div>
    <div class="field">
      <div class="side" style="grid-template-columns:repeat(${foes.length},minmax(0,1fr))">${foes.map(unitCard).join('')}</div>
      <div class="divider">對 陣</div>
      <div class="side" style="grid-template-columns:repeat(${party.length},minmax(0,1fr))">${party.map(unitCard).join('')}</div>
    </div>
    <div class="log" id="log">${B.log.slice(-24).map(l => `<p class="${l.cls || ''}">${esc(l.text)}</p>`).join('')}</div>
    ${renderCommand()}
  </section>`;
}

function playFx() {
  if (!B || !B.fx.length) return;
  for (const f of B.fx) {
    const el = app.querySelector(`[data-uid="${f.uid}"]`);
    if (!el) continue;
    const s = document.createElement('span');
    s.className = `fx ${f.type}`;
    s.textContent = f.type === 'miss' ? '회피' : f.type === 'buff' ? f.label
      : f.type === 'heal' || f.type === 'mp' ? `+${f.v}` : `-${f.v}`;
    el.appendChild(s);
    if (f.type === 'dmg' || f.type === 'crit' || f.type === 'burn') {
      el.classList.remove('hit');
      void el.offsetWidth;
      el.classList.add('hit');
    }
  }
  B.fx = [];
}

function endBattle() {
  const res = finishBattle(S, B);
  ui.after = null;
  if (res.outcome === 'win' && B.kind === 'stage') {
    S.stage++;
    const chap = CHAPTERS[S.chapter];
    if (S.stage >= chap.stages.length) {
      const lines = storyLines(chap.outro);
      const chapterIdx = S.chapter;
      if (S.chapter === JOIN_AFTER_CHAPTER && !S.joined) {
        lines.push(...storyLines(chap.join));
        addJoiner(S);
      }
      S.chapter++;
      S.stage = 0;
      if (S.chapter >= CHAPTERS.length) { S.cleared = true; S.chapter = CHAPTERS.length - 1; }
      ui.after = { lines, chapterIdx };
      res.chapterClear = chap.title;
    }
  }
  save();
  ui.result = res;
  view = 'result';
  render();
}

function renderResult() {
  const r = ui.result;
  const verdict = { win: '승리', lose: '패주', flee: '퇴각' }[r.outcome];
  let rows = '';
  if (r.outcome === 'win') {
    rows = `<dl class="num">
      <dt>경험치</dt><dd>각 무장 +${r.xp}</dd>
      <dt>군자금</dt><dd>+${r.gold}금 (소지 ${S.gold}금)</dd>
      ${r.drop ? `<dt>전리품</dt><dd>${ITEMS[r.drop].name} 1개</dd>` : ''}
    </dl>
    ${r.ups.length ? `<div class="ups">${r.ups.map(u => `<span>${u.name} Lv ${u.lv} 달성</span>`).join('')}</div>` : ''}
    ${r.chapterClear ? `<p class="tip">「${esc(r.chapterClear)}」을 평정했습니다.</p>` : ''}`;
  } else if (r.outcome === 'lose') {
    rows = `<p style="margin:0;color:var(--paper-dim)">군이 무너져 진영으로 물러났습니다. 군자금 ${r.lost}금을 잃었고, 무장들은 간신히 몸을 추슬렀습니다. 주막에서 쉬고 수련으로 힘을 기른 뒤 다시 도전하세요.</p>`;
  } else {
    rows = `<p style="margin:0;color:var(--paper-dim)">전열을 가다듬기 위해 진영으로 돌아왔습니다.</p>`;
  }
  return `
  <section class="result">
    <span class="label">${esc(B.title)}</span>
    <span class="verdict ${r.outcome === 'win' ? 'win' : 'lose'}">${verdict}</span>
    ${rows}
    <div><button class="btn primary" data-act="result-next">진영으로</button></div>
  </section>`;
}

function resultNext() {
  B = null;
  const after = ui.after;
  ui.after = null;
  if (after && after.lines.length) playStory(after.lines, after.chapterIdx, goCamp);
  else goCamp();
}

// ── 엔딩 ───────────────────────────────────────────────
function renderEnding() {
  const f = FACTIONS[S.faction];
  const lv = S.party.map(m => `${GENERALS[m.id].name} Lv ${m.lv}`).join(' · ');
  return `
  <section class="ending">
    <span class="seal" style="width:72px;height:72px;font-size:38px">${f.seal}</span>
    <span class="label">전 5장 평정</span>
    <h2>천하는 ${f.army}의 것</h2>
    <p>황건적의 난에서 적벽까지, ${S.battles}번의 전투를 치렀습니다.</p>
    <p class="num">${lv}</p>
    <div class="title-actions">
      <button class="btn primary" data-act="restart">다른 세력으로 다시</button>
      <button class="btn" data-act="title">타이틀로</button>
    </div>
  </section>`;
}

// ── 그리기 ─────────────────────────────────────────────
function render() {
  let html = '';
  switch (view) {
    case 'title': html = renderTitle(); break;
    case 'factions': html = renderFactions(); break;
    case 'story': html = renderStory(); break;
    case 'camp': html = renderCamp() + (ui.sheet ? renderSheet() : ''); break;
    case 'battle': html = renderBattle(); break;
    case 'result': html = renderResult(); break;
    case 'ending': html = renderEnding(); break;
  }
  app.innerHTML = html;
  const logEl = document.getElementById('log');
  if (logEl) logEl.scrollTop = logEl.scrollHeight;
  if (view === 'battle') playFx();
  if (view === 'story') { const d = app.querySelector('.dialogue'); if (d) d.focus({ preventScroll: true }); }
}

// ── 입력 ───────────────────────────────────────────────
const ACTIONS = {
  new: () => { view = 'factions'; render(); },
  continue: () => { const s = loadSave(); if (s) { S = s; goCamp(); } },
  title: () => { clearTimeout(timer); ui.sheet = null; ui.confirmReset = false; view = 'title'; render(); },
  pick: f => { S = newGame(f); save(); goCamp(); },
  'story-next': storyNext,
  'story-skip': () => { const st = ui.story; ui.story = null; st.then(); },

  sortie: () => startBattle('stage'),
  train: () => startBattle('train'),
  sheet: name => { ui.sheet = name; ui.confirmReset = false; render(); },
  'sheet-close': () => { ui.sheet = null; render(); },
  rest: () => {
    const cost = innCost(S);
    if (S.gold < cost) return;
    S.gold -= cost;
    healAll(S);
    save();
    ui.sheet = null;
    render();
    toast('푹 쉬었습니다. 모든 무장이 기운을 되찾았습니다.');
  },
  buy: arg => {
    const [id, n] = arg.split(':');
    const cost = ITEMS[id].price * +n;
    if (S.gold < cost) return;
    S.gold -= cost;
    S.items[id] = (S.items[id] || 0) + +n;
    save();
    render();
    toast(`${ITEMS[id].name} ${n}개를 샀습니다.`);
  },
  forge: arg => {
    const [i, slot] = arg.split(':');
    const m = S.party[+i];
    const cost = gearCost(m[slot]);
    if (S.gold < cost || m[slot] >= MAX_GEAR) return;
    S.gold -= cost;
    applyStatChange(m, () => { m[slot]++; });
    save();
    render();
    toast(`${GENERALS[m.id].name}의 ${slot === 'wpn' ? '무기' : '갑옷'}을 +${m[slot]}로 단련했습니다.`);
  },
  'camp-item': arg => {
    const [id, i] = arg.split(':');
    const msg = useItemCamp(S, id, +i);
    if (!msg) { toast('지금은 쓸 수 없습니다.'); return; }
    save();
    render();
    toast(msg);
  },
  save: () => { save(); toast('기록을 저장했습니다.'); },
  reset: () => {
    if (!ui.confirmReset) { ui.confirmReset = true; render(); return; }
    clearSave();
    S = null;
    ui.sheet = null;
    ui.confirmReset = false;
    view = 'factions';
    render();
  },
  restart: () => { clearSave(); S = null; view = 'factions'; render(); },

  'cmd-attack': () => { ui.mode = 'target'; ui.pending = { type: 'attack', targets: 'enemy' }; render(); },
  'cmd-skill': () => { ui.mode = 'skills'; render(); },
  'cmd-item': () => { ui.mode = 'items'; render(); },
  'cmd-back': () => { ui.mode = 'command'; ui.pending = null; render(); },
  'cmd-guard': () => { defend(B, actor()); afterPlayer(); },
  'cmd-flee': () => { tryFlee(B, actor()); afterPlayer(); },
  skill: id => {
    const sk = SKILLS[id], a = actor();
    if (!canCast(a, id)) return;
    if (sk.target === 'one') { ui.mode = 'target'; ui.pending = { type: 'skill', id, targets: 'enemy' }; render(); return; }
    if (sk.target === 'ally') { ui.mode = 'target'; ui.pending = { type: 'skill', id, targets: 'ally' }; render(); return; }
    useSkill(B, a, id);
    afterPlayer();
  },
  item: id => {
    ui.mode = 'target';
    ui.pending = { type: 'item', id, targets: ITEMS[id].revive ? 'fallen' : 'ally' };
    if (!B.units.some(isTargetable)) { ui.mode = 'items'; ui.pending = null; toast('쓸 대상이 없습니다.'); return; }
    render();
  },
  target: uid => chooseTarget(uid),
  'result-next': resultNext,
};

app.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  if (el.dataset.act === 'sheet-close-back') {
    if (e.target === el) { ui.sheet = null; render(); }
    return;
  }
  const fn = ACTIONS[el.dataset.act];
  if (fn) fn(el.dataset.arg, el);
});

document.addEventListener('keydown', e => {
  if (view === 'story' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); storyNext(); }
  if (e.key === 'Escape' && ui.sheet) { ui.sheet = null; render(); }
  if (e.key === 'Escape' && view === 'battle' && ['skills', 'items', 'target'].includes(ui.mode)) { ui.mode = 'command'; ui.pending = null; render(); }
});

// ── 시작 ───────────────────────────────────────────────
function start(data) {
  if (data && data.S) { S = data.S; goCamp(); return; }
  view = 'title';
  render();
}
try { window.claude?.hot?.snapshot?.(() => ({ S })); } catch (e) { /* 선택 기능 */ }
if (window.claude?.hot?.ready) window.claude.hot.ready(start);
else start(window.claude?.hot?.data ?? {});
