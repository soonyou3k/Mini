// 난세무쌍 — 게임 규칙 (물리, 전투, 몬스터·보스 AI, 퀘스트, 저장)

const GRAVITY = 2100, JUMP = 780, WALK = 230, CLIMB = 170, MAX_FALL = 950;
const SAVE_KEY = 'nanse-musang-save-v1';
const VIEW_H = 540;

const rnd = (a, b) => a + Math.random() * (b - a);
const irnd = (a, b) => Math.floor(rnd(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const G = {
  running: false, paused: false, time: 0,
  map: null, mapId: null, scenery: null,
  player: null, monsters: [], npcs: [], projectiles: [], effects: [], numbers: [], drops: [],
  respawns: [], later: [], cam: { x: 0, y: 0 }, vw: 960, vh: VIEW_H,
  log: [], boss: null, saveTimer: 0,
};

// ── 입력 ───────────────────────────────────────────────
const KEYMAP = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  Space: 'jump', AltLeft: 'jump', AltRight: 'jump', KeyC: 'jump', KeyX: 'jump',
  KeyZ: 'attack', ControlLeft: 'attack', ControlRight: 'attack',
  KeyA: 'A', KeyS: 'S', KeyD: 'D',
  Digit1: 'herb', Digit2: 'pill', Digit3: 'wine',
};
const input = { down: {}, hit: {} };
function press(k) { if (!input.down[k]) input.hit[k] = true; input.down[k] = true; }
function release(k) { input.down[k] = false; }
window.addEventListener('keydown', e => {
  const k = KEYMAP[e.code];
  if (!k) return;
  if (G.running) e.preventDefault();
  if (!e.repeat) press(k);
});
window.addEventListener('keyup', e => {
  const k = KEYMAP[e.code];
  if (!k) return;
  if (G.running) e.preventDefault();
  release(k);
});
window.addEventListener('blur', () => { input.down = {}; });

// ── 능력치 ─────────────────────────────────────────────
const xpToNext = lv => Math.round(12 * Math.pow(lv, 1.75) + 10);
function stats(P) {
  const c = CLASSES[P.cls], l = P.lv - 1;
  return {
    maxHp: Math.round(c.hp[0] + c.hp[1] * l),
    maxMp: Math.round(c.mp[0] + c.mp[1] * l),
    atk: Math.round(c.atk[0] + c.atk[1] * l + P.wpn * 6),
    def: Math.round(P.lv * (P.cls === 'guanyu' ? 1.5 : 1)),
  };
}

function newPlayer(cls) {
  const P = {
    cls, lv: 1, xp: 0, gold: 50, wpn: 0,
    items: { herb: 5, pill: 0, wine: 3 },
    quest: { idx: 0, status: 'none', count: {} },
    flags: {}, mapId: 'town', x: MAPS.town.start,
  };
  const s = stats(P);
  P.hp = s.maxHp;
  P.mp = s.maxMp;
  return P;
}

function resetBody(P) {
  Object.assign(P, {
    vx: 0, vy: 0, facing: 1, onGround: false, climbing: false, rope: null,
    attackTimer: 0, attackDur: 1, invuln: 0, buffTimer: 0, dropTimer: 0, knock: 0, dead: false, shield: 0,
  });
}

// ── 저장 ───────────────────────────────────────────────
const SAVE_FIELDS = ['cls', 'lv', 'xp', 'gold', 'wpn', 'items', 'quest', 'flags', 'mapId', 'x', 'hp', 'mp'];
function saveGame() {
  const P = G.player;
  if (!P) return;
  const data = {};
  for (const k of SAVE_FIELDS) data[k] = P[k];
  data.mapId = G.mapId || P.mapId;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, p: data })); } catch (e) { /* 저장소 없음 */ }
}
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    return s && s.v === 1 && CLASSES[s.p.cls] ? s.p : null;
  } catch (e) { return null; }
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 무시 */ } }

function startGame(data) {
  const P = data.cls && data.lv ? { ...newPlayer(data.cls), ...data } : newPlayer(data.cls);
  resetBody(P);
  G.player = P;
  const map = MAPS[P.mapId] ? P.mapId : 'town';
  loadMap(map, null, P.x);
  G.running = true;
  G.paused = false;
  addLog(`${MAPS[map].name}에 도착했다.`);
}

// ── 맵 ─────────────────────────────────────────────────
function portalOpen(p) { return !p.req || (G.player && G.player.flags[p.req]); }

function platformBounds(map, p) {
  if (p === -1) return { x1: 40, x2: map.w - 40, y: map.ground };
  const pl = map.platforms[p];
  return { x1: pl.x, x2: pl.x + pl.w, y: pl.y };
}

function spawnMonster(type, bounds, opts = {}) {
  const d = MONSTERS[type];
  const x = opts.x ?? rnd(bounds.x1 + d.w / 2 + 10, bounds.x2 - d.w / 2 - 10);
  const m = {
    type, x, y: bounds.y, vx: 0, facing: Math.random() < .5 ? -1 : 1, bounds,
    hp: d.hp, maxHp: d.hp, aggro: !!d.boss, hurtTimer: 0, flash: 0, castCd: rnd(1, 2), atkAnim: 0,
    wander: rnd(1, 3), dying: 0, spec: opts.spec || null, summon: !!opts.summon,
    pt: 2, state: 'idle', air: false,
  };
  G.monsters.push(m);
  if (d.boss) G.boss = m;
  return m;
}

function loadMap(id, destPortal, atX) {
  const map = MAPS[id];
  G.map = map;
  G.mapId = id;
  G.scenery = buildScenery(id, map);
  G.monsters = [];
  G.projectiles = [];
  G.effects = [];
  G.numbers = [];
  G.drops = [];
  G.respawns = [];
  G.later = [];
  G.boss = null;
  G.npcs = map.npcs.map(n => ({ ...n, y: map.ground, facing: 1 }));
  for (const s of map.spawns) {
    for (let i = 0; i < s.n; i++) spawnMonster(s.m, platformBounds(map, s.p), { spec: s.boss ? null : s, x: s.x });
  }
  const P = G.player;
  const portal = destPortal && map.portals.find(p => p.id === destPortal);
  P.x = portal ? portal.x + (portal.x < map.w / 2 ? 40 : -40) : clamp(atX ?? map.start ?? 200, 30, map.w - 30);
  P.y = portal ? (portal.y ?? map.ground) : map.ground;
  P.vx = P.vy = 0;
  P.climbing = false;
  P.onGround = true;
  P.mapId = id;
  snapCamera();
  if (G.boss) addLog(`${MONSTERS[G.boss.type].title} ${MONSTERS[G.boss.type].name}이(가) 나타났다!`, 'warn');
}

function nearestTown() {
  return ['allies', 'wall', 'hulao'].includes(G.mapId) ? 'allies' : 'town';
}

// ── 기록 ───────────────────────────────────────────────
function addLog(text, cls = '') {
  G.log.push({ text, cls, t: 6 });
  if (G.log.length > 6) G.log.shift();
}

function addNumber(x, y, v, kind, crit, stack = 0) {
  G.numbers.push({ x: x + rnd(-6, 6), y: y - stack * 30, v, kind, crit, life: 1.1, max: 1.1 });
}

function addEffect(e) {
  e.max = e.life;
  e.seed = e.seed ?? Math.random() * 1000;
  G.effects.push(e);
  return e;
}

function after(t, fn) { G.later.push({ t, fn }); }

// ── 플레이어 ───────────────────────────────────────────
function supportAt(x, y) {
  const map = G.map;
  if (Math.abs(y - map.ground) < 1) return true;
  return map.platforms.some(p => x >= p.x && x <= p.x + p.w && Math.abs(y - p.y) < 1);
}

function nearbyRope(P) {
  return G.map.ropes.find(r => Math.abs(P.x - r.x) < 16 && P.y > r.top - 2 && P.y <= r.bottom + 2);
}
function nearbyPortal(P) {
  return G.map.portals.find(p => Math.abs(P.x - p.x) < 34 && Math.abs(P.y - (p.y ?? G.map.ground)) < 30);
}
function nearbyNpc(P) {
  return G.npcs.find(n => Math.abs(P.x - n.x) < 50 && Math.abs(P.y - n.y) < 40);
}

function updatePlayer(dt) {
  const P = G.player;
  if (P.dead) return;
  const s = stats(P);
  P.attackTimer = Math.max(0, P.attackTimer - dt);
  P.invuln = Math.max(0, P.invuln - dt);
  P.buffTimer = Math.max(0, P.buffTimer - dt);
  P.dropTimer = Math.max(0, P.dropTimer - dt);
  P.knock = Math.max(0, P.knock - dt);
  const I = input.down, H = input.hit;

  // 도구 단축키
  for (const id of ['herb', 'pill', 'wine']) if (H[id]) useItem(id);

  // ↑: 포탈 > NPC > 밧줄
  if (H.up && P.onGround && !P.climbing && P.knock <= 0) {
    const portal = nearbyPortal(P);
    if (portal) {
      if (portalOpen(portal)) { usePortal(portal); return; }
      addLog('굳게 닫혀 있다. 장각을 쓰러뜨려야 열릴 것 같다.', 'warn');
    } else {
      const npc = nearbyNpc(P);
      if (npc) { UI.openNpc(npc.id); return; }
    }
  }

  // 밧줄 잡기
  if (!P.climbing && P.knock <= 0 && P.attackTimer <= 0) {
    const r = nearbyRope(P);
    if (r && ((I.up && P.y > r.top + 2) || (I.down && P.onGround && Math.abs(P.y - r.top) < 2))) {
      P.climbing = true; P.rope = r; P.x = r.x; P.vx = 0; P.vy = 0; P.onGround = false;
      if (I.down) P.y += 4;
    }
  }

  if (P.climbing) {
    const r = P.rope;
    P.vy = I.up ? -CLIMB : I.down ? CLIMB : 0;
    P.y += P.vy * dt;
    if (H.jump && (I.left || I.right)) {
      P.climbing = false;
      P.vx = (I.right ? 1 : -1) * WALK;
      P.facing = Math.sign(P.vx);
      P.vy = -JUMP * .55;
      return;
    }
    if (P.y <= r.top) {
      P.y = r.top;
      P.climbing = false;
      P.onGround = supportAt(P.x, P.y);
      P.vy = 0;
    } else if (P.y >= r.bottom) {
      P.y = r.bottom;
      P.climbing = false;
      P.onGround = supportAt(P.x, P.y);
    }
    return;
  }

  // 좌우 이동
  const dir = (I.right ? 1 : 0) - (I.left ? 1 : 0);
  if (P.knock > 0) {
    // 넉백 중에는 조작 불가
  } else if (P.attackTimer > 0 && P.onGround) {
    P.vx = 0;
  } else {
    P.vx = dir * WALK;
    if (dir) P.facing = dir;
  }

  // 점프 / 아래 점프
  if (H.jump && P.onGround && P.knock <= 0) {
    if (I.down && Math.abs(P.y - G.map.ground) > 1) {
      P.dropTimer = .25;
      P.onGround = false;
      P.y += 3;
    } else if (P.attackTimer <= 0 || !P.onGround) {
      P.vy = -JUMP;
      P.onGround = false;
    }
  }

  // 공격
  if (P.attackTimer <= 0 && P.knock <= 0) {
    if (I.attack) doAttack(CLASSES[P.cls].basic);
    else for (const k of ['A', 'S', 'D']) if (I[k]) { doAttack(CLASSES[P.cls].skills[k], k); break; }
  }

  // 물리
  if (!P.onGround) P.vy = Math.min(MAX_FALL, P.vy + GRAVITY * dt);
  const prevY = P.y;
  P.x = clamp(P.x + P.vx * dt, 20, G.map.w - 20);
  P.y += P.vy * dt;
  if (P.vy >= 0) {
    if (P.y >= G.map.ground) { P.y = G.map.ground; land(P); }
    else if (P.dropTimer <= 0) {
      for (const p of G.map.platforms) {
        if (P.x >= p.x && P.x <= p.x + p.w && prevY <= p.y + .5 && P.y >= p.y) { P.y = p.y; land(P); break; }
      }
    }
  }
  if (P.onGround && !supportAt(P.x, P.y)) P.onGround = false;
  if (P.y > G.map.h + 200) { P.y = G.map.ground; P.vy = 0; }
  void s;
}

function land(P) {
  P.vy = 0;
  P.onGround = true;
  if (P.knock > 0) P.vx = 0;
}

function usePortal(portal) {
  saveGame();
  loadMap(portal.to, portal.dest);
  addLog(`${G.map.name}(으)로 이동했다.`);
  saveGame();
}

function useItem(id) {
  const P = G.player, it = ITEMS[id], s = stats(P);
  if (P.dead || !P.items[id]) { if (!P.items[id]) addLog(`${it.name}이(가) 없다.`); return; }
  if (it.hp && P.hp >= s.maxHp) return;
  if (it.mp && !it.hp && P.mp >= s.maxMp) return;
  P.items[id]--;
  if (it.hp) {
    const v = Math.min(it.hp, s.maxHp - P.hp);
    P.hp += v;
    addNumber(P.x, P.y - 70, v, 'heal');
  }
  if (it.mp) P.mp = Math.min(s.maxMp, P.mp + it.mp);
}

// ── 공격 ───────────────────────────────────────────────
function liveMonsters() { return G.monsters.filter(m => m.hp > 0 && m.dying <= 0); }

function inBox(m, x1, x2, y1, y2) {
  const d = MONSTERS[m.type];
  return m.x + d.w / 2 >= x1 && m.x - d.w / 2 <= x2 && m.y >= y1 && m.y - d.h <= y2;
}

function doAttack(sk, key) {
  const P = G.player;
  if (!sk) return;
  if (sk.lv && P.lv < sk.lv) { if (input.hit[key]) addLog(`${sk.name}은(는) Lv.${sk.lv}부터 쓸 수 있다.`); return; }
  if (sk.mp && P.mp < sk.mp) { if (input.hit[key]) addLog('기력이 부족하다.', 'warn'); return; }
  if (sk.mp) P.mp -= sk.mp;
  P.attackTimer = P.attackDur = sk.delay;
  const f = P.facing, cy = P.y - 34;
  const byDist = arr => arr.sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x));

  switch (sk.type) {
    case 'melee': {
      const x1 = f > 0 ? P.x - 10 : P.x - sk.range, x2 = f > 0 ? P.x + sk.range : P.x + 10;
      const targets = byDist(liveMonsters().filter(m => inBox(m, x1, x2, P.y - sk.h, P.y + 20))).slice(0, sk.targets);
      addEffect({ type: 'slash', x: P.x + f * sk.range * .35, y: cy, f, r: sk.range * .55, life: .25, color: sk.mult > 1 ? '#9affc0' : '#e8fff0' });
      after(.06, () => targets.forEach(m => hitMonster(m, sk)));
      break;
    }
    case 'around': {
      const targets = byDist(liveMonsters().filter(m => inBox(m, P.x - sk.range, P.x + sk.range, P.y - sk.h, P.y + 40))).slice(0, sk.targets);
      addEffect({ type: 'spin', x: P.x, y: cy, r: sk.range, life: .45 });
      after(.08, () => targets.forEach(m => hitMonster(m, sk)));
      break;
    }
    case 'proj': {
      for (let i = 0; i < sk.hits; i++) {
        after(i * .12, () => {
          G.projectiles.push({
            owner: 'p', kind: sk.proj, x: P.x + f * 20, y: P.y - 36 + (i ? -4 : 0), vx: f * sk.speed, vy: 0,
            dist: 0, range: sk.range, pierce: sk.targets, hitSet: new Set(), sk: { ...sk, hits: 1 },
          });
        });
      }
      break;
    }
    case 'pillar': {
      const cx = P.x + f * sk.range;
      const targets = byDist(liveMonsters().filter(m => inBox(m, cx - sk.w / 2, cx + sk.w / 2, P.y - sk.h, P.y + 40))).slice(0, sk.targets);
      addEffect({ type: 'pillar', x: cx, y: P.y + 4, w: sk.w, h: sk.h + 40, life: .6 });
      after(.15, () => targets.forEach(m => hitMonster(m, sk)));
      break;
    }
    case 'chain': {
      const targets = byDist(liveMonsters().filter(m =>
        (m.x - P.x) * f > -30 && Math.abs(m.x - P.x) < sk.range && Math.abs(m.y - P.y) < 220)).slice(0, sk.targets);
      targets.forEach((m, i) => after(i * .06, () => {
        addEffect({ type: 'bolt', x: m.x, y: m.y - MONSTERS[m.type].h / 2, life: .3 });
        hitMonster(m, sk);
      }));
      if (!targets.length) addEffect({ type: 'bolt', x: P.x + f * 160, y: P.y, life: .3 });
      break;
    }
    case 'rain': {
      const x1 = f > 0 ? P.x : P.x - sk.range, x2 = f > 0 ? P.x + sk.range : P.x;
      addEffect({ type: 'rain', x: (x1 + x2) / 2, y: P.y, w: sk.range, life: .9 });
      for (let h = 0; h < sk.hits; h++) {
        after(.2 + h * .2, () => {
          const targets = byDist(liveMonsters().filter(m => inBox(m, x1, x2, P.y - sk.h, P.y + 60))).slice(0, sk.targets);
          targets.forEach(m => hitMonster(m, { ...sk, hits: 1 }, h));
        });
      }
      break;
    }
    case 'buff': {
      P.buffTimer = sk.dur;
      addEffect({ type: 'text', x: P.x, y: P.y - 90, text: `${sk.name}! 공격력 +40%`, color: '#ffd07a', life: 1.4 });
      break;
    }
    case 'blink': {
      addEffect({ type: 'blink', x: P.x, y: P.y, life: .35 });
      P.x = clamp(P.x + f * sk.dist, 20, G.map.w - 20);
      P.invuln = Math.max(P.invuln, .3);
      if (!P.climbing && !supportAt(P.x, P.y)) P.onGround = false;
      addEffect({ type: 'blink', x: P.x, y: P.y, life: .35 });
      break;
    }
  }
}

function hitMonster(m, sk, stackBase = 0) {
  if (m.hp <= 0 || m.dying > 0) return;
  const P = G.player, s = stats(P), d = MONSTERS[m.type];
  for (let i = 0; i < sk.hits; i++) {
    if (m.hp <= 0) break;
    const crit = Math.random() < .12;
    let raw = s.atk * (P.buffTimer > 0 ? 1.4 : 1) * sk.mult * rnd(.85, 1.15) * (crit ? 1.6 : 1);
    const dmg = Math.max(1, Math.round(raw - d.def * 1.5));
    m.hp -= dmg;
    addNumber(m.x, m.y - d.h - 14, dmg, 'dealt', crit, stackBase + i);
    addEffect({ type: 'hit', x: m.x + rnd(-8, 8), y: m.y - d.h / 2 + rnd(-10, 10), life: .3 });
  }
  m.hurtTimer = d.boss ? 0 : .3;
  m.flash = .1;
  m.aggro = true;
  m.aggroTimer = 10;
  if (!d.boss) m.x = clamp(m.x + P.facing * 8, m.bounds.x1 + d.w / 2, m.bounds.x2 - d.w / 2);
  if (m.hp <= 0) killMonster(m);
}

function killMonster(m) {
  const P = G.player, d = MONSTERS[m.type];
  m.hp = 0;
  m.dying = .5;
  const xp = m.summon ? Math.ceil(d.xp / 3) : d.xp;
  gainXp(xp);
  const coins = m.summon ? 0 : irnd(d.gold[0], d.gold[1]);
  if (coins) dropLoot(m.x, m.y - 20, { gold: coins });
  for (const [id, chance] of Object.entries(d.drops || {})) {
    if (!m.summon && Math.random() < chance) dropLoot(m.x + rnd(-20, 20), m.y - 20, { item: id, n: d.boss ? 3 : 1 });
  }
  if (d.boss) {
    P.flags[m.type] = true;
    G.boss = null;
    for (const x of G.monsters) if (x.summon && x.hp > 0) { x.hp = 0; x.dying = .5; }
    G.projectiles = G.projectiles.filter(p => p.owner === 'p');
    addLog(`${d.name}을(를) 쓰러뜨렸다!`, 'good');
    addEffect({ type: 'text', x: m.x, y: m.y - d.h - 40, text: `${d.name} 격파!`, color: '#ffd07a', life: 2.2 });
    for (let i = 0; i < 6; i++) dropLoot(m.x + rnd(-80, 80), m.y - 40, { gold: Math.round(irnd(d.gold[0], d.gold[1]) / 6) });
    saveGame();
  }
  questKill(m.type);
  if (m.spec) G.respawns.push({ t: 7, spec: m.spec });
}

function gainXp(v) {
  const P = G.player;
  P.xp += v;
  let leveled = false;
  while (P.xp >= xpToNext(P.lv)) {
    P.xp -= xpToNext(P.lv);
    P.lv++;
    leveled = true;
    const c = CLASSES[P.cls];
    for (const [k, sk] of Object.entries(c.skills)) {
      if (sk.lv === P.lv) addLog(`새 기술을 익혔다: ${sk.name} (${k}키)`, 'good');
    }
  }
  if (leveled) {
    const s = stats(P);
    P.hp = s.maxHp;
    P.mp = s.maxMp;
    addEffect({ type: 'levelup', x: P.x, y: P.y, life: 1.8 });
    addLog(`레벨 업! Lv.${P.lv}이 되었다.`, 'good');
    saveGame();
  }
}

function dropLoot(x, y, what) {
  G.drops.push({ x, y, vx: rnd(-60, 60), vy: -rnd(300, 420), onGround: false, life: 60, ...what });
}

// ── 퀘스트 ─────────────────────────────────────────────
function currentQuest() { return QUESTS[G.player.quest.idx] || null; }

function questKill(type) {
  const P = G.player, q = currentQuest();
  if (!q || P.quest.status !== 'active' || !q.kill[type]) return;
  const c = P.quest.count;
  c[type] = Math.min(q.kill[type], (c[type] || 0) + 1);
  if (Object.entries(q.kill).every(([k, n]) => (c[k] || 0) >= n)) {
    P.quest.status = 'ready';
    addLog(`퀘스트 완료 조건 달성: ${q.title} — ${NPCS[q.npc].name}에게 돌아가자.`, 'good');
    saveGame();
  }
}

function acceptQuest() {
  const P = G.player;
  P.quest.status = 'active';
  P.quest.count = {};
  const q = currentQuest();
  // 이미 잡은 보스 퀘스트는 다시 잡아야 한다
  addLog(`퀘스트 수락: ${q.title}`, 'good');
  saveGame();
}

function completeQuest() {
  const P = G.player, q = currentQuest();
  if (!q || P.quest.status !== 'ready') return;
  const r = q.reward;
  P.gold += r.gold || 0;
  for (const [id, n] of Object.entries(r.items || {})) P.items[id] = (P.items[id] || 0) + n;
  addLog(`보상: 경험치 ${r.xp}, ${r.gold}전${r.items ? ', ' + Object.entries(r.items).map(([id, n]) => `${ITEMS[id].name} ${n}개`).join(', ') : ''}`, 'good');
  P.quest = { idx: P.quest.idx + 1, status: 'none', count: {} };
  gainXp(r.xp);
  saveGame();
}

function questMarkFor(npcId) {
  const q = currentQuest(), P = G.player;
  if (!q || q.npc !== npcId) return null;
  if (P.quest.status === 'none') return '!';
  if (P.quest.status === 'ready') return '?';
  return null;
}

// ── 상점 / 대장간 ──────────────────────────────────────
function buyItem(id, n) {
  const P = G.player, cost = ITEMS[id].price * n;
  if (P.gold < cost) return false;
  P.gold -= cost;
  P.items[id] = (P.items[id] || 0) + n;
  saveGame();
  return true;
}
function forgeWeapon() {
  const P = G.player;
  if (P.wpn >= WEAPON_MAX) return false;
  const cost = weaponCost(P.wpn);
  if (P.gold < cost) return false;
  P.gold -= cost;
  P.wpn++;
  saveGame();
  return true;
}

// ── 피격 / 쓰러짐 ──────────────────────────────────────
function hurtPlayer(dmg, fromX, opts = {}) {
  const P = G.player;
  if (P.invuln > 0 || P.dead) return;
  const s = stats(P);
  const v = Math.max(1, Math.round(dmg * rnd(.9, 1.1) - s.def * .5));
  P.hp -= v;
  addNumber(P.x, P.y - 74, v, 'taken');
  P.invuln = 1.2;
  if (!opts.noKnock) {
    P.climbing = false;
    P.knock = .3;
    P.vx = (P.x < fromX ? -1 : 1) * 260;
    P.vy = -300;
    P.onGround = false;
  }
  if (P.hp <= 0) {
    P.hp = 0;
    P.dead = true;
    addLog('쓰러졌다…', 'warn');
    UI.showDeath();
  }
}

function revive() {
  const P = G.player, s = stats(P);
  P.xp = Math.max(0, P.xp - Math.floor(xpToNext(P.lv) * .1));
  P.dead = false;
  P.hp = s.maxHp;
  P.mp = s.maxMp;
  P.invuln = 2;
  P.knock = 0;
  loadMap(nearestTown());
  saveGame();
}

// ── 몬스터 AI ──────────────────────────────────────────
function updateMonsters(dt) {
  const P = G.player;
  for (const m of G.monsters) {
    const d = MONSTERS[m.type];
    if (m.dying > 0) { m.dying -= dt; continue; }
    if (m.hp <= 0) continue;
    m.hurtTimer = Math.max(0, m.hurtTimer - dt);
    m.flash = Math.max(0, m.flash - dt);
    m.atkAnim = Math.max(0, m.atkAnim - dt);
    m.castCd -= dt;
    if (m.aggroTimer !== undefined && !d.boss) {
      m.aggroTimer -= dt;
      if (m.aggroTimer <= 0) m.aggro = false;
    }

    if (d.boss) { updateBoss(m, d, dt); }
    else {
      const dx = P.x - m.x, sameLevel = Math.abs(P.y - m.y) < 110;
      // 동탁군은 가까이 오면 먼저 덤빈다
      if (!m.aggro && d.lv >= 13 && sameLevel && Math.abs(dx) < 260 && !P.dead) { m.aggro = true; m.aggroTimer = 8; }
      if (m.hurtTimer > 0) m.vx = 0;
      else if (m.aggro && sameLevel && !P.dead) {
        const dir = Math.sign(dx) || 1;
        m.facing = dir;
        if (d.caster && Math.abs(dx) < d.caster.range * .55) m.vx = 0;
        else m.vx = dir * d.speed * 1.35;
      } else {
        m.wander -= dt;
        if (m.wander <= 0) {
          m.wander = rnd(1.2, 3.5);
          const r = Math.random();
          m.vx = r < .35 ? 0 : (r < .68 ? -1 : 1) * d.speed;
          if (m.vx) m.facing = Math.sign(m.vx);
        }
      }
      m.x += m.vx * dt;
      const lo = m.bounds.x1 + d.w / 2, hi = m.bounds.x2 - d.w / 2;
      if (m.x < lo) { m.x = lo; if (!m.aggro) { m.vx = Math.abs(m.vx); m.facing = 1; } }
      if (m.x > hi) { m.x = hi; if (!m.aggro) { m.vx = -Math.abs(m.vx); m.facing = -1; } }

      if (d.caster && m.aggro && m.castCd <= 0 && Math.abs(dx) < d.caster.range && Math.abs(P.y - m.y) < 160 && !P.dead) {
        m.castCd = d.caster.cd * rnd(.85, 1.2);
        m.atkAnim = .4;
        m.facing = Math.sign(dx) || 1;
        const sy = m.y - d.h * .6, ty = P.y - 34;
        const speed = d.caster.proj === 'earrow' ? 520 : 340;
        const t = Math.abs(dx) / speed;
        G.projectiles.push({ owner: 'e', kind: d.caster.proj, x: m.x + m.facing * 16, y: sy, vx: m.facing * speed, vy: clamp((ty - sy) / Math.max(t, .2), -200, 200), dist: 0, range: d.caster.range + 80, dmg: d.caster.dmg });
      }
    }

    // 몸통 박치기
    if (!P.dead && P.invuln <= 0 && m.hp > 0) {
      const w = d.w * .8, h = m.dashing ? Math.min(d.h, 90) : d.h;
      if (Math.abs(P.x - m.x) < w / 2 + 12 && P.y > m.y - h && P.y - 60 < m.y) {
        hurtPlayer(m.dashing ? d.atk * 1.4 : d.atk, m.x);
      }
    }
  }
  G.monsters = G.monsters.filter(m => m.dying > 0 || m.hp > 0);

  for (const r of G.respawns) r.t -= dt;
  for (const r of G.respawns.filter(r => r.t <= 0)) spawnMonster(r.spec.m, platformBounds(G.map, r.spec.p), { spec: r.spec });
  G.respawns = G.respawns.filter(r => r.t > 0);
}

// ── 보스 ───────────────────────────────────────────────
function updateBoss(m, d, dt) {
  const P = G.player;
  const dx = P.x - m.x;
  const rage = m.hp < m.maxHp * .45;
  const lo = m.bounds.x1 + d.w / 2, hi = m.bounds.x2 - d.w / 2;

  if (m.state === 'dash') {
    m.x += m.vx * dt;
    if (m.x <= lo || m.x >= hi) {
      m.x = clamp(m.x, lo, hi);
      m.dashing = false;
      m.vx = 0;
      addEffect({ type: 'dust', x: m.x, y: m.y, life: .5 });
      m.state = m.dashAgain ? 'dashwind' : 'idle';
      if (m.dashAgain) { m.dashAgain = false; m.windup = .45; m.facing = -m.facing; addEffect({ type: 'warn', x: G.map.w / 2, y: m.y, w: G.map.w, h: 90, life: .45 }); }
    }
    return;
  }
  if (m.state === 'dashwind') {
    m.windup -= dt;
    if (m.windup <= 0) { m.state = 'dash'; m.dashing = true; m.vx = m.facing * 980; }
    return;
  }
  if (m.state === 'leap') {
    m.leapT += dt;
    const p = Math.min(1, m.leapT / m.leapDur);
    m.x = m.leapFrom + (m.leapTo - m.leapFrom) * p;
    m.y = m.bounds.y - Math.sin(p * Math.PI) * 260;
    m.air = true;
    if (p >= 1) {
      m.y = m.bounds.y;
      m.air = false;
      m.state = 'idle';
      addEffect({ type: 'dust', x: m.x, y: m.y, life: .6 });
      if (Math.abs(P.x - m.x) < 110 && Math.abs(P.y - m.y) < 60) hurtPlayer(d.atk * 1.2, m.x);
      for (const dir of [-1, 1]) {
        G.projectiles.push({ owner: 'e', kind: 'wave', x: m.x + dir * 40, y: m.bounds.y - 4, vx: dir * 430, vy: 0, dist: 0, range: 900, dmg: d.atk, ground: true });
      }
    }
    return;
  }
  if (m.state === 'sweepwind') {
    m.windup -= dt;
    if (m.windup <= 0) {
      m.state = 'idle';
      m.atkAnim = .4; m.atkDur = .4;
      const x1 = m.facing > 0 ? m.x : m.x - 270, x2 = m.facing > 0 ? m.x + 270 : m.x;
      addEffect({ type: 'slash', x: m.x + m.facing * 120, y: m.y - 60, f: m.facing, r: 150, life: .3, color: '#ffb0a0' });
      if (P.x > x1 && P.x < x2 && P.y > m.y - 170) hurtPlayer(d.atk * 1.6, m.x);
    }
    return;
  }

  // 평소: 천천히 다가간다
  m.facing = Math.sign(dx) || m.facing;
  const want = Math.abs(dx) > 160 ? m.facing * d.speed : 0;
  m.vx = want;
  m.x = clamp(m.x + m.vx * dt, lo, hi);

  m.pt -= dt;
  if (m.pt > 0 || P.dead) return;

  if (m.type === 'jangjiao') {
    m.pt = rage ? rnd(1.5, 2.2) : rnd(2.2, 3.2);
    const minions = G.monsters.filter(x => x.summon && x.hp > 0).length;
    const choices = ['thunder', 'thunder', 'orbs', ...(minions < 4 ? ['summon'] : [])];
    const pick = choices[Math.floor(Math.random() * choices.length)];
    m.atkAnim = .5; m.atkDur = .5;
    if (pick === 'thunder') {
      const n = rage ? 5 : 3;
      const cols = Array.from({ length: n }, (_, i) => P.x + (i - (n - 1) / 2) * 150);
      addLog('장각: "창천은 이미 죽었다!"', 'warn');
      cols.forEach(x => addEffect({ type: 'warn', x, y: G.map.ground, w: 90, h: 460, life: .9 }));
      after(.9, () => cols.forEach(x => {
        addEffect({ type: 'bolt', x, y: G.map.ground, life: .35 });
        if (Math.abs(P.x - x) < 48) hurtPlayer(d.atk * 1.4, x, { noKnock: false });
      }));
    } else if (pick === 'orbs') {
      const n = rage ? 7 : 5;
      for (let i = 0; i < n; i++) {
        const a = (i - (n - 1) / 2) * .22;
        G.projectiles.push({ owner: 'e', kind: 'orb', x: m.x + m.facing * 40, y: m.y - 80, vx: Math.cos(a) * 300 * m.facing, vy: Math.sin(a) * 300, dist: 0, range: 900, dmg: d.atk });
      }
    } else {
      addLog('장각이 황건 졸개를 불러냈다!', 'warn');
      for (let i = 0; i < 3; i++) {
        const s = spawnMonster('jolgae', m.bounds, { summon: true, x: clamp(m.x + rnd(-200, 200), lo, hi) });
        s.aggro = true; s.aggroTimer = 30;
      }
    }
  } else if (m.type === 'lubu') {
    m.pt = rage ? rnd(1.1, 1.7) : rnd(1.6, 2.4);
    const near = Math.abs(dx) < 280;
    const choices = near ? ['sweep', 'sweep', 'leap', 'dash'] : ['dash', 'leap', 'leap'];
    const pick = choices[Math.floor(Math.random() * choices.length)];
    if (pick === 'dash') {
      m.state = 'dashwind';
      m.windup = rage ? .45 : .65;
      m.dashAgain = rage;
      addLog('여포: "적토마여, 달려라!"', 'warn');
      addEffect({ type: 'warn', x: G.map.w / 2, y: m.y, w: G.map.w, h: 90, life: m.windup });
    } else if (pick === 'sweep') {
      m.state = 'sweepwind';
      m.windup = rage ? .4 : .55;
      const x = m.x + m.facing * 135;
      addEffect({ type: 'warn', x, y: m.y, w: 270, h: 170, life: m.windup });
    } else {
      m.state = 'leap';
      m.leapT = 0;
      m.leapDur = .8;
      m.leapFrom = m.x;
      m.leapTo = clamp(P.x, lo, hi);
      addEffect({ type: 'warn', x: m.leapTo, y: m.bounds.y, w: 220, h: 60, life: .8 });
    }
  }
}

// ── 투사체 / 전리품 ────────────────────────────────────
function updateProjectiles(dt) {
  const P = G.player;
  for (const p of G.projectiles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.dist += Math.hypot(p.vx, p.vy) * dt;
    if (p.dist > p.range) { p.dead = true; continue; }
    if (p.owner === 'p') {
      for (const m of liveMonsters()) {
        if (p.hitSet.has(m)) continue;
        const d = MONSTERS[m.type];
        if (Math.abs(p.x - m.x) < d.w / 2 + 8 && p.y > m.y - d.h - 6 && p.y < m.y + 6) {
          p.hitSet.add(m);
          hitMonster(m, p.sk);
          if (p.hitSet.size >= p.pierce) { p.dead = true; break; }
        }
      }
    } else if (!P.dead && P.invuln <= 0) {
      const top = P.y - 62, bottom = P.y;
      const hitY = p.ground ? p.y - 30 < bottom && p.y > top : p.y > top && p.y < bottom;
      if (Math.abs(p.x - P.x) < 18 && hitY) {
        hurtPlayer(p.dmg, p.x - p.vx);
        if (!p.ground) p.dead = true;
      }
    }
  }
  G.projectiles = G.projectiles.filter(p => !p.dead);
}

function updateDrops(dt) {
  const P = G.player;
  for (const d of G.drops) {
    d.life -= dt;
    if (!d.onGround) {
      const prevY = d.y;
      d.vy = Math.min(MAX_FALL, d.vy + GRAVITY * dt);
      d.x = clamp(d.x + d.vx * dt, 20, G.map.w - 20);
      d.y += d.vy * dt;
      if (d.vy > 0) {
        if (d.y >= G.map.ground) { d.y = G.map.ground; d.onGround = true; }
        else for (const p of G.map.platforms) {
          if (d.x >= p.x && d.x <= p.x + p.w && prevY <= p.y && d.y >= p.y) { d.y = p.y; d.onGround = true; break; }
        }
      }
    }
    if (!P.dead && Math.abs(d.x - P.x) < 34 && Math.abs(d.y - P.y) < 60 && (d.onGround || d.vy > 0)) {
      d.taken = true;
      if (d.gold) { P.gold += d.gold; addLog(`${d.gold}전을 주웠다.`); }
      else { P.items[d.item] = (P.items[d.item] || 0) + d.n; addLog(`${ITEMS[d.item].name} ${d.n}개를 주웠다.`, 'good'); }
    }
  }
  G.drops = G.drops.filter(d => !d.taken && d.life > 0);
}

function drawDrop(ctx, d, t) {
  const bob = d.onGround ? Math.sin(t * 4 + d.x) * 2 - 4 : 0;
  ctx.save();
  ctx.translate(d.x, d.y - 10 + bob);
  if (d.gold) {
    // 오수전: 가운데 네모 구멍이 뚫린 동전
    ctx.fillStyle = d.gold > 50 ? '#f2c94a' : '#d8a84a';
    ctx.beginPath(); ctx.arc(0, 0, d.gold > 50 ? 11 : 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a5a1a'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#5a3a10'; ctx.fillRect(-2.5, -2.5, 5, 5);
  } else {
    const c = { herb: '#5aa05a', pill: '#c2352a', wine: '#e8e0c8' }[d.item];
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-7, -8, 14, 16);
    ctx.fillStyle = c; ctx.fillRect(-5, -6, 10, 12);
  }
  ctx.restore();
}

// ── 메인 루프 ──────────────────────────────────────────
function update(dt) {
  G.time += dt;
  for (const l of G.log) l.t -= dt;
  if (!G.running || G.paused) { input.hit = {}; return; }
  const P = G.player, s = stats(P);

  updatePlayer(dt);
  if (G.map !== null) {
    updateMonsters(dt);
    updateProjectiles(dt);
    updateDrops(dt);
  }
  for (const l of G.later) l.t -= dt;
  const due = G.later.filter(l => l.t <= 0);
  G.later = G.later.filter(l => l.t > 0);
  due.forEach(l => l.fn());
  for (const e of G.effects) e.life -= dt;
  G.effects = G.effects.filter(e => e.life > 0);
  for (const n of G.numbers) n.life -= dt;
  G.numbers = G.numbers.filter(n => n.life > 0);

  // 기력은 조금씩 찬다. 마을에서는 체력도 찬다.
  if (!P.dead) {
    P.mpRegen = (P.mpRegen || 0) + dt;
    if (P.mpRegen >= 2) {
      P.mpRegen = 0;
      P.mp = Math.min(s.maxMp, P.mp + Math.max(2, Math.round(s.maxMp * .03)));
      if (G.map.safe) P.hp = Math.min(s.maxHp, P.hp + Math.round(s.maxHp * .05));
    }
  }

  G.saveTimer += dt;
  if (G.saveTimer > 15) { G.saveTimer = 0; saveGame(); }
  updateCamera(dt);
  input.hit = {};
}

function snapCamera() { updateCamera(1, true); }
function updateCamera(dt, snap) {
  const P = G.player, map = G.map;
  const tx = clamp(P.x - G.vw / 2, 0, Math.max(0, map.w - G.vw));
  const ty = clamp(P.y - G.vh * .62, 0, Math.max(0, map.h - G.vh));
  const k = snap ? 1 : Math.min(1, dt * 8);
  G.cam.x += (tx - G.cam.x) * k;
  G.cam.y += (ty - G.cam.y) * k;
}

function render(ctx) {
  if (!G.map) return;
  const t = G.time, P = G.player;
  drawBackground(ctx, G, G.vw, G.vh);
  ctx.save();
  ctx.translate(-Math.round(G.cam.x), -Math.round(G.cam.y));
  drawTerrain(ctx, G);
  for (const p of G.map.portals) drawPortal(ctx, p, G.map, t, portalOpen(p));
  for (const n of G.npcs) drawNpc(ctx, n, t, questMarkFor(n.id));
  for (const d of G.drops) drawDrop(ctx, d, t);
  for (const m of G.monsters) drawMonster(ctx, m, t);
  for (const e of G.effects) if (e.type === 'warn') drawEffect(ctx, e);
  drawPlayer(ctx, P, t);
  for (const p of G.projectiles) drawProjectile(ctx, p, t);
  for (const e of G.effects) if (e.type !== 'warn') drawEffect(ctx, e);
  for (const n of G.numbers) drawNumber(ctx, n);

  // 도움말 말풍선
  if (!P.dead && P.onGround) {
    const portal = nearbyPortal(P), npc = !portal && nearbyNpc(P);
    if (portal) nameTag(ctx, portal.x, (portal.y ?? G.map.ground) - 100, portalOpen(portal) ? `↑ ${MAPS[portal.to].name}` : '닫혀 있음', '#bfe4ff');
    else if (npc) nameTag(ctx, npc.x, npc.y - 104, '↑ 대화하기', '#ffe9a8');
  }
  ctx.restore();
  drawMinimap(ctx, G);
}
