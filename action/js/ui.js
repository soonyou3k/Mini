// 난세무쌍 — 화면 (HUD, 대화창, 상점, 터치 조작, 캔버스 크기)

const $ = s => document.querySelector(s);
const canvas = $('#cv');
const ctx = canvas.getContext('2d');
const overlay = $('#overlay');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── 캔버스 크기 ────────────────────────────────────────
let scale = 1;
function resize() {
  const box = $('#stage').getBoundingClientRect();
  const aspect = box.width / Math.max(1, box.height);
  G.vh = VIEW_H;
  G.vw = Math.round(clamp(VIEW_H * aspect, 480, 1280));
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  // 화면 비율이 범위를 벗어나면 가운데 맞춤으로 여백을 둔다
  const cssScale = Math.min(box.width / G.vw, box.height / G.vh);
  canvas.style.width = `${G.vw * cssScale}px`;
  canvas.style.height = `${G.vh * cssScale}px`;
  canvas.width = Math.round(G.vw * cssScale * dpr);
  canvas.height = Math.round(G.vh * cssScale * dpr);
  scale = cssScale * dpr;
}
new ResizeObserver(resize).observe($('#stage'));

// ── HUD ────────────────────────────────────────────────
const hudCache = new Map();
function setText(sel, v) {
  if (hudCache.get(sel) === v) return;
  hudCache.set(sel, v);
  const el = $(sel);
  if (el) el.textContent = v;
}
function setWidth(sel, p) {
  const v = `${Math.max(0, Math.min(100, p)).toFixed(1)}%`;
  if (hudCache.get(sel) === v) return;
  hudCache.set(sel, v);
  const el = $(sel);
  if (el) el.style.width = v;
}
function setHtml(sel, v) {
  if (hudCache.get(sel) === v) return;
  hudCache.set(sel, v);
  const el = $(sel);
  if (el) el.innerHTML = v;
}

function updateHud() {
  const P = G.player;
  if (!P) return;
  const s = stats(P), c = CLASSES[P.cls];
  setText('#h-lv', `Lv.${P.lv}`);
  setText('#h-name', `${c.name} · ${c.job}`);
  setText('#h-hp', `${Math.ceil(P.hp)} / ${s.maxHp}`);
  setText('#h-mp', `${Math.floor(P.mp)} / ${s.maxMp}`);
  setWidth('#h-hpbar', P.hp / s.maxHp * 100);
  setWidth('#h-mpbar', P.mp / s.maxMp * 100);
  const need = xpToNext(P.lv);
  setWidth('#h-xpbar', P.xp / need * 100);
  setText('#h-xp', `${P.xp} / ${need} (${(P.xp / need * 100).toFixed(1)}%)`);
  setText('#h-gold', P.gold.toLocaleString());

  const slots = [['Z', c.basic.name, true, '']];
  for (const k of ['A', 'S', 'D']) {
    const sk = c.skills[k];
    const locked = P.lv < sk.lv;
    slots.push([k, sk.name, !locked && P.mp >= (sk.mp || 0), locked ? `Lv.${sk.lv}` : `MP ${sk.mp}`]);
  }
  const html = slots.map(([k, name, ok, sub]) =>
    `<button class="slot ${ok ? '' : 'off'}" data-key="${k === 'Z' ? 'attack' : k}"><kbd>${k}</kbd><b>${esc(name)}</b><small>${sub}</small></button>`).join('') +
    Object.entries(ITEMS).map(([id, it]) =>
      `<button class="slot item ${P.items[id] ? '' : 'off'}" data-key="${id}"><kbd>${it.key}</kbd><b>${it.name}</b><small>× ${P.items[id] || 0}</small></button>`).join('');
  setHtml('#h-slots', html);

  // 퀘스트 알림
  const q = currentQuest();
  let qh = '';
  if (q) {
    const st = P.quest.status;
    const lines = st === 'none'
      ? `<li>${NPCS[q.npc].name}에게 말을 걸어 보자.</li>`
      : Object.entries(q.kill).map(([k, n]) => {
          const got = P.quest.count[k] || 0;
          return `<li class="${got >= n ? 'done' : ''}">${MONSTERS[k].name} <span>${got} / ${n}</span></li>`;
        }).join('') + (st === 'ready' ? `<li class="done">${NPCS[q.npc].name}에게 보고하기</li>` : '');
    qh = `<b>${st === 'ready' ? '완료 · ' : st === 'none' ? '새 퀘스트 · ' : ''}${esc(q.title)}</b><ul>${lines}</ul>`;
  } else {
    qh = '<b>제1부 완결</b><ul><li>모든 퀘스트를 마쳤습니다.</li></ul>';
  }
  setHtml('#h-quest', qh);

  // 보스 체력
  const b = G.boss;
  const bossEl = $('#h-boss');
  if (b && b.hp > 0) {
    bossEl.hidden = false;
    const d = MONSTERS[b.type];
    setText('#h-bossname', `${d.title} ${d.name} · Lv.${d.lv}`);
    setWidth('#h-bossbar', b.hp / b.maxHp * 100);
    setText('#h-bosshp', `${Math.max(0, Math.ceil(b.hp)).toLocaleString()} / ${b.maxHp.toLocaleString()}`);
  } else bossEl.hidden = true;

  const logHtml = G.log.filter(l => l.t > 0).map(l => `<p class="${l.cls}" style="opacity:${Math.min(1, l.t)}">${esc(l.text)}</p>`).join('');
  setHtml('#h-log', logHtml);
}

// ── 오버레이 ───────────────────────────────────────────
function openOverlay(html, opts = {}) {
  overlay.innerHTML = `<div class="panel ${opts.wide ? 'wide' : ''}" role="dialog">${html}</div>`;
  overlay.hidden = false;
  G.paused = true;
  input.down = {};
  const first = overlay.querySelector('[data-focus]') || overlay.querySelector('button');
  if (first) first.focus({ preventScroll: true });
}
function closeOverlay() {
  overlay.hidden = true;
  overlay.innerHTML = '';
  G.paused = false;
  input.down = {};
}

function portrait(look, name) {
  const cv = document.createElement('canvas');
  cv.width = 120; cv.height = 150;
  const c = cv.getContext('2d');
  c.scale(2, 2);
  drawHuman(c, 30, 70, { ...LOOKS[look], f: 1, t: 0, atk: -1, scale: 1 });
  return `<img class="portrait" alt="${esc(name)}" src="${cv.toDataURL()}">`;
}

const UI = {
  title() {
    G.running = false;
    const saved = loadSave();
    const cont = saved ? `${CLASSES[saved.cls].name} · Lv.${saved.lv} · ${MAPS[saved.mapId]?.name || ''}` : '저장된 기록 없음';
    overlay.innerHTML = `
      <div class="title-card">
        <div class="brand"><span class="seal">亂</span><div><h1>난세무쌍</h1><p>삼국지 횡스크롤 RPG · 제1부 황건적의 난 ~ 호뢰관</p></div></div>
        <div class="title-actions">
          <button class="btn primary" data-ui="newgame" data-focus>새로 시작<small>무장을 골라 시작</small></button>
          <button class="btn" data-ui="continue" ${saved ? '' : 'disabled'}>이어하기<small>${esc(cont)}</small></button>
        </div>
        ${UI.controlsHtml()}
      </div>`;
    overlay.hidden = false;
  },
  controlsHtml() {
    return `<dl class="keys">
      <div><dt>← →</dt><dd>이동</dd></div>
      <div><dt>Space · Alt</dt><dd>점프 (↓+점프: 발판 아래로)</dd></div>
      <div><dt>Z · Ctrl</dt><dd>공격 (누르고 있으면 연속)</dd></div>
      <div><dt>A S D</dt><dd>기술</dd></div>
      <div><dt>↑ ↓</dt><dd>밧줄 타기 · 포탈 · NPC 대화</dd></div>
      <div><dt>1 2 3</dt><dd>약초 · 환약 · 탁주</dd></div>
    </dl>`;
  },
  classSelect() {
    const cards = Object.entries(CLASSES).map(([id, c]) => {
      const sk = Object.entries(c.skills).map(([k, s]) => `${k} ${s.name}`).join(' · ');
      return `<button class="class-card" data-ui="pick" data-arg="${id}">
        ${portrait(id, c.name)}
        <div><h3>${c.name} <span>${c.job}</span></h3><p>${c.blurb}</p><p class="skills">${sk}</p></div>
      </button>`;
    }).join('');
    overlay.innerHTML = `<div class="title-card"><h2>무장 선택</h2><div class="classes">${cards}</div>
      <button class="btn" data-ui="title">돌아가기</button></div>`;
    overlay.hidden = false;
  },
  openNpc(id) {
    const npc = NPCS[id], q = currentQuest(), P = G.player;
    let text = npc.line, actions = '';
    if (q && q.npc === id) {
      if (P.quest.status === 'none') {
        text = q.offer;
        actions += `<button class="btn primary" data-ui="accept" data-focus>퀘스트 수락 · ${esc(q.title)}</button>`;
      } else if (P.quest.status === 'active') {
        const left = Object.entries(q.kill).map(([k, n]) => `${MONSTERS[k].name} ${(P.quest.count[k] || 0)}/${n}`).join(', ');
        text = `아직 일이 남았네. (${left})`;
      } else if (P.quest.status === 'ready') {
        text = q.done;
        actions += `<button class="btn primary" data-ui="complete" data-focus>보상 받기</button>`;
      }
    } else if (q && !npc.shop && !npc.forge) {
      text = `${npc.line} ${NPCS[q.npc].name}을(를) 찾아가 보게.`;
    }
    if (npc.shop) actions += `<button class="btn" data-ui="shop">물건 사기</button>`;
    if (npc.forge) actions += `<button class="btn" data-ui="forge">무기 단련</button>`;
    actions += `<button class="btn" data-ui="close">닫기</button>`;
    openOverlay(`<div class="talk">${portrait(npc.look, npc.name)}<div><h3>${esc(npc.name)}</h3><p>${esc(text)}</p></div></div>
      <div class="actions">${actions}</div>`);
  },
  shop() {
    const P = G.player;
    const rows = Object.entries(ITEMS).map(([id, it]) => `
      <div class="row"><div><b>${it.name}</b> <span class="dim">보유 ${P.items[id] || 0}</span><br><span class="dim">${it.desc} · ${it.price}전</span></div>
      <div class="acts">
        <button class="btn" data-ui="buy" data-arg="${id}:1" ${P.gold < it.price ? 'disabled' : ''}>1개</button>
        <button class="btn" data-ui="buy" data-arg="${id}:10" ${P.gold < it.price * 10 ? 'disabled' : ''}>10개 · ${it.price * 10}전</button>
      </div></div>`).join('');
    openOverlay(`<h3>상점 <span class="dim">소지금 ${P.gold.toLocaleString()}전</span></h3><div class="rows">${rows}</div>
      <div class="actions"><button class="btn" data-ui="close" data-focus>닫기</button></div>`);
  },
  forge() {
    const P = G.player, c = CLASSES[P.cls];
    const max = P.wpn >= WEAPON_MAX;
    const cost = weaponCost(P.wpn);
    openOverlay(`<h3>대장간 <span class="dim">소지금 ${P.gold.toLocaleString()}전</span></h3>
      <p>${c.name}의 무기 <b>+${P.wpn}</b> — 단련할 때마다 공격력이 6 오릅니다. (최대 +${WEAPON_MAX})</p>
      <div class="actions">
        <button class="btn primary" data-ui="doforge" ${max || P.gold < cost ? 'disabled' : ''} data-focus>${max ? '더 이상 단련할 수 없음' : `+${P.wpn + 1}로 단련 · ${cost.toLocaleString()}전`}</button>
        <button class="btn" data-ui="close">닫기</button>
      </div>`);
  },
  showDeath() {
    setTimeout(() => openOverlay(`<h3>쓰러졌습니다</h3>
      <p>가까운 마을에서 다시 일어납니다. 현재 레벨 경험치의 10%를 잃습니다.</p>
      <div class="actions"><button class="btn primary" data-ui="revive" data-focus>마을에서 부활</button></div>`), 900);
  },
  menu() {
    openOverlay(`<h3>메뉴</h3>${UI.controlsHtml()}
      <div class="actions">
        <button class="btn" data-ui="close" data-focus>계속하기</button>
        <button class="btn" data-ui="savequit">저장하고 타이틀로</button>
        <button class="btn" data-ui="reset">기록 지우기</button>
      </div>`, { wide: true });
  },
};

let confirmReset = false;
overlay.addEventListener('click', e => {
  const el = e.target.closest('[data-ui]');
  if (!el || el.disabled) return;
  const arg = el.dataset.arg;
  switch (el.dataset.ui) {
    case 'newgame': UI.classSelect(); break;
    case 'title': UI.title(); break;
    case 'continue': { const s = loadSave(); if (s) { closeOverlay(); startGame(s); } break; }
    case 'pick': clearSave(); closeOverlay(); startGame({ cls: arg }); addLog('↑ 키로 촌장에게 말을 걸어 보자.', 'good'); break;
    case 'close': closeOverlay(); break;
    case 'accept': acceptQuest(); closeOverlay(); break;
    case 'complete': completeQuest(); closeOverlay(); break;
    case 'shop': UI.shop(); break;
    case 'forge': UI.forge(); break;
    case 'buy': { const [id, n] = arg.split(':'); if (buyItem(id, +n)) addLog(`${ITEMS[id].name} ${n}개를 샀다.`); UI.shop(); break; }
    case 'doforge': if (forgeWeapon()) addLog(`무기를 +${G.player.wpn}로 단련했다!`, 'good'); UI.forge(); break;
    case 'revive': closeOverlay(); revive(); break;
    case 'savequit': saveGame(); closeOverlay(); UI.title(); break;
    case 'reset':
      if (!confirmReset) { confirmReset = true; el.textContent = '한 번 더 누르면 삭제'; el.classList.add('primary'); break; }
      confirmReset = false; clearSave(); closeOverlay(); UI.title(); break;
  }
});

window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && G.running) {
    if (!overlay.hidden) { if (!G.player.dead) closeOverlay(); }
    else UI.menu();
  }
});
$('#menu-btn').addEventListener('click', () => { if (G.running && overlay.hidden) UI.menu(); });

// ── 터치 / 버튼 조작 ───────────────────────────────────
const held = new Map(); // pointerId → key
function bindHold(root) {
  root.addEventListener('pointerdown', e => {
    const b = e.target.closest('[data-key]');
    if (!b) return;
    e.preventDefault();
    held.set(e.pointerId, b.dataset.key);
    press(b.dataset.key);
  });
}
// 버튼이 다시 그려져도 손을 떼면 확실히 풀리도록 창 전체에서 받는다
function releasePointer(e) {
  const k = held.get(e.pointerId);
  if (k) { release(k); held.delete(e.pointerId); }
}
window.addEventListener('pointerup', releasePointer);
window.addEventListener('pointercancel', releasePointer);
bindHold($('#touch'));
bindHold($('#h-slots'));
document.addEventListener('contextmenu', e => { if (e.target.closest('#touch')) e.preventDefault(); });

// ── 루프 ───────────────────────────────────────────────
let last = performance.now();
function frame(now) {
  const dt = Math.min(1 / 30, (now - last) / 1000);
  last = now;
  update(dt);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  if (G.map) render(ctx);
  else drawIdle();
  updateHud();
  $('#hud').hidden = !G.running;
  $('#bar').hidden = !G.running;
  $('#touch').hidden = !G.running;
  requestAnimationFrame(frame);
}

// 타이틀 뒤에 보이는 배경
function drawIdle() {
  const th = THEMES.town;
  const g = ctx.createLinearGradient(0, 0, 0, G.vh);
  g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, G.vw, G.vh);
  const sc = buildScenery('title', { w: 2000, theme: 'town' });
  drawRidge(ctx, sc.far, th.far, G.time * 10, G.vh * .7, 160, G.vw, G.vh, 110);
  drawRidge(ctx, sc.mid, th.mid, G.time * 25, G.vh * .82, 100, G.vw, G.vh, 80);
}

resize();
UI.title();
requestAnimationFrame(frame);
