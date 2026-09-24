// 난세영웅전 — 전투·성장 규칙 (DOM을 쓰지 않음)

const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// 받침에 맞춰 조사를 붙인다: josa('관우', '이/가') → '관우가'
function josa(word, pair) {
  const [withJong, without] = pair.split('/');
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return word + without;
  const jong = (c - 0xac00) % 28;
  if (pair === '으로/로') return word + (jong === 0 || jong === 8 ? without : withJong);
  return word + (jong ? withJong : without);
}

// ── 성장 ───────────────────────────────────────────────
const MAX_GEAR = 6;
const xpToNext = lv => Math.round(10 * Math.pow(lv, 1.7) + 10);
const gearCost = lvl => 50 * (lvl + 1) * (lvl + 1);
const innCost = state => 15 + state.chapter * 15;

function heroStats(m) {
  const g = GENERALS[m.id];
  const s = {};
  for (const k of STAT_KEYS) s[k] = Math.floor(g.base[k] + g.grow[k] * (m.lv - 1));
  s.atk += m.wpn * 4;
  s.int += m.wpn * 3;
  s.def += m.arm * 3;
  s.hp += m.arm * 25;
  return s;
}

function newMember(id, lv = 1, wpn = 0, arm = 0) {
  const m = { id, lv, xp: 0, wpn, arm };
  const s = heroStats(m);
  m.hp = s.hp;
  m.mp = s.mp;
  return m;
}

function newGame(faction) {
  return {
    v: 1, faction, chapter: 0, stage: 0, gold: 120,
    items: { herb: 3, wine: 1, pill: 0, lingzhi: 0 },
    party: FACTIONS[faction].start.map(id => newMember(id)),
    introSeen: -1, joined: false, cleared: false, battles: 0,
  };
}

// 스탯이 바뀌어도 현재 체력 비율이 아니라 증가분만큼 채운다
function applyStatChange(m, fn) {
  const before = heroStats(m);
  fn();
  const after = heroStats(m);
  if (m.hp > 0) m.hp += after.hp - before.hp;
  m.mp += after.mp - before.mp;
}

function gainXp(m, xp) {
  let ups = 0;
  m.xp += xp;
  while (m.xp >= xpToNext(m.lv)) {
    m.xp -= xpToNext(m.lv);
    applyStatChange(m, () => { m.lv++; });
    ups++;
  }
  return ups;
}

function addJoiner(state) {
  const id = FACTIONS[state.faction].join;
  const lv = Math.max(1, Math.max(...state.party.map(m => m.lv)) - 1);
  const wpn = Math.min(...state.party.map(m => m.wpn));
  const arm = Math.min(...state.party.map(m => m.arm));
  state.party.push(newMember(id, lv, wpn, arm));
  state.joined = true;
}

function healAll(state) {
  for (const m of state.party) {
    const s = heroStats(m);
    m.hp = s.hp;
    m.mp = s.mp;
  }
}

// 진영에서 도구 사용. 성공하면 설명 문자열, 실패하면 null
function useItemCamp(state, itemId, idx) {
  const it = ITEMS[itemId], m = state.party[idx];
  if (!it || !m || !state.items[itemId]) return null;
  const s = heroStats(m);
  if (it.revive) {
    if (m.hp > 0) return null;
    m.hp = Math.round(s.hp * it.revive);
  } else if (it.heal) {
    if (m.hp <= 0 || m.hp >= s.hp) return null;
    m.hp = Math.min(s.hp, m.hp + it.heal);
  } else if (it.mp) {
    if (m.mp >= s.mp) return null;
    m.mp = Math.min(s.mp, m.mp + it.mp);
  }
  state.items[itemId]--;
  return `${josa(GENERALS[m.id].name, '이/가')} ${josa(it.name, '을/를')} 사용했다.`;
}

// ── 전투 ───────────────────────────────────────────────
const SUFFIX = ['갑', '을', '병', '정'];

function createBattle(state, enemyIds, opts = {}) {
  const units = state.party.map((m, i) => {
    const s = heroStats(m), g = GENERALS[m.id];
    return {
      uid: 'p' + i, side: 'p', mref: i, id: m.id, name: g.name, ch: g.ch, lv: m.lv,
      maxHp: s.hp, hp: m.hp, maxMp: s.mp, mp: m.mp,
      atk: s.atk, int: s.int, def: s.def, spd: s.spd,
      skills: g.skills, buffs: {}, status: {}, guard: false,
    };
  });
  const counts = {};
  enemyIds.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
  const seen = {};
  enemyIds.forEach((id, i) => {
    const e = ENEMIES[id];
    seen[id] = (seen[id] || 0) + 1;
    const name = counts[id] > 1 ? `${e.name} ${SUFFIX[seen[id] - 1]}` : e.name;
    units.push({
      uid: 'e' + i, side: 'e', id, name, title: e.title, ch: e.ch,
      maxHp: e.hp, hp: e.hp, maxMp: 0, mp: 0,
      atk: e.atk, int: e.int || 5, def: e.def, spd: e.spd,
      skills: e.skills || [], boss: !!e.boss, elite: !!e.elite, actions: e.actions || 1,
      xp: e.xp, gold: e.gold, buffs: {}, status: {}, guard: false,
    });
  });
  return {
    units, round: 0, queue: [], log: [], fx: [], over: null,
    kind: opts.kind || 'stage', boss: !!opts.boss, title: opts.title || '',
  };
}

const alive = u => u.hp > 0;
const sideUnits = (b, side) => b.units.filter(u => u.side === side && alive(u));
const unitById = (b, uid) => b.units.find(u => u.uid === uid);

function log(b, text, cls) {
  b.log.push({ text, cls });
  if (b.log.length > 40) b.log.shift();
}

function checkOver(b) {
  if (b.over) return true;
  if (!sideUnits(b, 'e').length) b.over = 'win';
  else if (!sideUnits(b, 'p').length) b.over = 'lose';
  return !!b.over;
}

function buildQueue(b) {
  const q = [];
  for (const u of b.units.filter(alive)) {
    q.push({ u, s: u.spd * rand(.85, 1.15) });
    for (let i = 1; i < u.actions; i++) q.push({ u, s: u.spd * rand(.3, .7) });
  }
  return q.sort((a, c) => c.s - a.s).map(x => x.u);
}

// 턴 시작 처리. 행동할 수 없으면 true
function beginTurn(b, u) {
  u.guard = false;
  if (u.status.burn) {
    const d = Math.max(1, u.status.burnDmg || 5);
    u.hp = Math.max(0, u.hp - d);
    b.fx.push({ uid: u.uid, v: d, type: 'burn' });
    log(b, `${josa(u.name, '이/가')} 화상으로 ${d}의 피해를 입었다.`, 'burn');
    u.status.burn--;
    if (!alive(u)) { log(b, `${josa(u.name, '이/가')} 쓰러졌다!`, 'down'); return true; }
  }
  for (const k of Object.keys(u.buffs)) if (--u.buffs[k] <= 0) delete u.buffs[k];
  if (u.status.stun) {
    u.status.stun = 0;
    log(b, `${josa(u.name, '은/는')} 기절하여 움직이지 못한다.`, 'stun');
    return true;
  }
  return false;
}

// 다음에 행동할 유닛. 전투가 끝났으면 null
function nextActor(b) {
  for (let guard = 0; guard < 200; guard++) {
    if (checkOver(b)) return null;
    if (!b.queue.length) {
      b.round++;
      b.queue = buildQueue(b);
      log(b, `— 제${b.round}합 —`, 'round');
    }
    const u = b.queue.shift();
    if (!alive(u)) continue;
    const skip = beginTurn(b, u);
    if (checkOver(b)) return null;
    if (!skip) return u;
  }
  return null;
}

function calcDamage(a, t, kind, power) {
  const stat = kind === 'magic' ? a.int : a.atk;
  let resist = kind === 'magic' ? (t.int + t.def) / 2 : t.def;
  if (t.buffs.def) resist *= 1.5;
  let dmg = stat * (a.buffs.atk ? 1.3 : 1) * power * 60 / (60 + resist) * rand(.9, 1.1);
  const crit = kind === 'phys' && Math.random() < .08;
  if (crit) dmg *= 1.5;
  if (t.guard) dmg *= .5;
  return { dmg: Math.max(1, Math.round(dmg)), crit };
}

function strike(b, a, t, kind, power, sk = {}) {
  if (!alive(t)) return;
  const miss = Math.min(.15, Math.max(.02, .04 + (t.spd - a.spd) * .01));
  if (kind === 'phys' && Math.random() < miss) {
    b.fx.push({ uid: t.uid, type: 'miss' });
    log(b, `${josa(t.name, '이/가')} 공격을 흘려냈다.`, 'miss');
    return;
  }
  const { dmg, crit } = calcDamage(a, t, kind, power);
  t.hp = Math.max(0, t.hp - dmg);
  b.fx.push({ uid: t.uid, v: dmg, type: crit ? 'crit' : 'dmg' });
  log(b, `${crit ? '회심의 일격! ' : ''}${t.name}에게 ${dmg}의 피해.`, crit ? 'crit' : '');
  if (sk.drain) {
    const v = Math.round(dmg * sk.drain);
    a.hp = Math.min(a.maxHp, a.hp + v);
    b.fx.push({ uid: a.uid, v, type: 'heal' });
  }
  if (!alive(t)) {
    log(b, `${josa(t.name, '이/가')} 쓰러졌다!`, 'down');
    return;
  }
  if (sk.stun && !t.boss && Math.random() < sk.stun) {
    t.status.stun = 1;
    log(b, `${josa(t.name, '이/가')} 기절했다!`, 'stun');
  }
  if (sk.burn && Math.random() < sk.burn) {
    t.status.burn = 3;
    t.status.burnDmg = Math.round(a.int * .6);
    log(b, `${josa(t.name, '이/가')} 화상을 입었다!`, 'burn');
  }
}

function attack(b, a, targetUid) {
  let t = unitById(b, targetUid);
  if (!t || !alive(t) || t.side === a.side) t = pick(sideUnits(b, a.side === 'p' ? 'e' : 'p'));
  log(b, `${a.name}의 공격!`, 'act');
  strike(b, a, t, 'phys', 1);
}

function defend(b, a) {
  a.guard = true;
  log(b, `${josa(a.name, '이/가')} 방어 태세를 갖췄다.`, 'act');
}

function canCast(a, skId) {
  return a.side !== 'p' || a.mp >= SKILLS[skId].mp;
}

function useSkill(b, a, skId, targetUid) {
  const sk = SKILLS[skId];
  if (!canCast(a, skId)) return false;
  if (a.side === 'p') a.mp -= sk.mp;
  log(b, `${a.name}의 「${sk.name}」!`, 'skill');
  const foes = sideUnits(b, a.side === 'p' ? 'e' : 'p');
  const friends = sideUnits(b, a.side);
  let targets;
  switch (sk.target) {
    case 'one': {
      const t = unitById(b, targetUid);
      targets = [t && alive(t) && t.side !== a.side ? t : pick(foes)];
      break;
    }
    case 'all': targets = foes; break;
    case 'ally': targets = [unitById(b, targetUid) || a]; break;
    case 'allies': targets = friends; break;
    default: targets = [a];
  }
  if (sk.kind === 'phys' || sk.kind === 'magic') {
    targets.forEach(t => strike(b, a, t, sk.kind, sk.power, sk));
    if (sk.recoil) {
      const d = Math.max(1, Math.round(a.maxHp * sk.recoil));
      a.hp = Math.max(1, a.hp - d);
      b.fx.push({ uid: a.uid, v: d, type: 'dmg' });
      log(b, `${josa(a.name, '이/가')} 반동으로 ${d}의 피해를 입었다.`);
    }
  } else if (sk.kind === 'heal') {
    for (const t of targets) {
      const v = Math.round(a.int * sk.power * 1.6 + 15 * sk.power);
      t.hp = Math.min(t.maxHp, t.hp + v);
      b.fx.push({ uid: t.uid, v, type: 'heal' });
    }
    log(b, `${targets.length > 1 ? '아군 전체' : targets[0].name}의 체력이 회복되었다.`, 'heal');
  } else if (sk.kind === 'buff') {
    for (const t of targets) {
      t.buffs[sk.buff] = sk.turns;
      b.fx.push({ uid: t.uid, type: 'buff', label: sk.buff === 'atk' ? '공격↑' : '방어↑' });
    }
    const who = targets.length > 1 ? '아군 전체' : targets[0].name;
    log(b, `${who}의 ${sk.buff === 'atk' ? '공격력' : '방어력'}이 올랐다!`, 'heal');
  }
  return true;
}

function useItem(state, b, a, itemId, targetUid) {
  const it = ITEMS[itemId];
  const t = unitById(b, targetUid);
  if (!it || !t || !state.items[itemId]) return false;
  if (it.revive ? alive(t) : !alive(t)) return false;
  state.items[itemId]--;
  log(b, `${josa(a.name, '이/가')} ${josa(it.name, '을/를')} 사용했다.`, 'act');
  if (it.revive) {
    t.hp = Math.round(t.maxHp * it.revive);
    b.fx.push({ uid: t.uid, v: t.hp, type: 'heal' });
    log(b, `${josa(t.name, '이/가')} 다시 일어섰다!`, 'heal');
  } else if (it.heal) {
    const v = Math.min(it.heal, t.maxHp - t.hp);
    t.hp += v;
    b.fx.push({ uid: t.uid, v, type: 'heal' });
    log(b, `${t.name}의 체력이 ${v} 회복되었다.`, 'heal');
  } else if (it.mp) {
    const v = Math.min(it.mp, t.maxMp - t.mp);
    t.mp += v;
    b.fx.push({ uid: t.uid, v, type: 'mp' });
    log(b, `${t.name}의 기력이 ${v} 회복되었다.`, 'heal');
  }
  return true;
}

function tryFlee(b, a) {
  if (b.boss) { log(b, '결전에서는 물러날 수 없다!'); return false; }
  const ok = Math.random() < .6;
  log(b, ok ? '무사히 퇴각했다.' : '퇴각에 실패했다!', 'act');
  if (ok) b.over = 'flee';
  return ok;
}

// 적의 판단
function enemyAct(b, u) {
  const foes = sideUnits(b, 'p');
  const friends = sideUnits(b, 'e');
  const usable = u.skills.filter(id => {
    const sk = SKILLS[id];
    if (sk.kind === 'heal') return friends.some(f => f.hp < f.maxHp * .7);
    if (sk.kind === 'buff') return !u.buffs[sk.buff];
    return true;
  });
  const target = Math.random() < .4
    ? foes.reduce((lo, f) => (f.hp < lo.hp ? f : lo), foes[0])
    : pick(foes);
  if (usable.length && Math.random() < (u.boss ? .45 : .3)) {
    useSkill(b, u, pick(usable), target.uid);
  } else {
    attack(b, u, target.uid);
  }
  checkOver(b);
}

// 전투 결과를 진영 상태에 반영
function finishBattle(state, b) {
  const res = { outcome: b.over, xp: 0, gold: 0, ups: [], drop: null, lost: 0 };
  for (const u of b.units.filter(x => x.side === 'p')) {
    const m = state.party[u.mref];
    m.hp = u.hp;
    m.mp = u.mp;
  }
  if (b.over === 'win') {
    const foes = b.units.filter(x => x.side === 'e');
    res.xp = foes.reduce((s, e) => s + e.xp, 0);
    res.gold = foes.reduce((s, e) => s + e.gold, 0);
    state.gold += res.gold;
    state.party.forEach(m => {
      const share = m.hp > 0 ? res.xp : Math.floor(res.xp / 2);
      if (m.hp <= 0) m.hp = 1;
      const n = gainXp(m, share);
      if (n) res.ups.push({ name: GENERALS[m.id].name, lv: m.lv });
    });
    if (Math.random() < .3) {
      res.drop = b.boss ? 'pill' : 'herb';
      state.items[res.drop]++;
    }
    state.battles++;
  } else if (b.over === 'lose') {
    res.lost = Math.floor(state.gold / 2);
    state.gold -= res.lost;
    for (const m of state.party) m.hp = Math.max(1, Math.round(heroStats(m).hp * .3));
  } else {
    for (const m of state.party) if (m.hp <= 0) m.hp = 1;
  }
  return res;
}

function currentStage(state) {
  const chap = CHAPTERS[state.chapter];
  return chap && chap.stages[state.stage];
}

function stageEnemies(state) {
  return forFaction(currentStage(state).enemies, state.faction);
}

function trainingEnemies(state) {
  const pool = forFaction(CHAPTERS[state.chapter].train, state.faction);
  const n = 2 + (Math.random() < .5 ? 1 : 0);
  return Array.from({ length: n }, () => pick(pool));
}
