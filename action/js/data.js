// 난세무쌍 — 게임 데이터 (직업, 몬스터, 맵, NPC, 퀘스트, 도구)

// ── 직업 ───────────────────────────────────────────────
// type: melee(앞쪽 범위) | around(주변 전체) | proj(투사체) | pillar(앞쪽 지점 폭발)
//       | chain(가까운 적 여럿) | rain(앞쪽 넓은 범위 연타) | buff | blink(순간이동)
const CLASSES = {
  guanyu: {
    name: '관우', job: '검호', hanja: '關', color: '#3f7a4f',
    blurb: '청룡언월도를 휘두르는 근접 전사. 체력이 높고 여러 적을 한꺼번에 벤다.',
    hp: [140, 28], mp: [24, 6], atk: [12, 3.2],
    basic: { name: '베기', type: 'melee', range: 100, h: 80, targets: 2, hits: 1, mult: 1, delay: .42 },
    skills: {
      A: { name: '청룡참', mp: 6, lv: 1, type: 'melee', range: 180, h: 100, targets: 4, hits: 1, mult: 1.8, delay: .55 },
      S: { name: '언월회선', mp: 14, lv: 5, type: 'around', range: 200, h: 140, targets: 8, hits: 2, mult: 1.3, delay: .7 },
      D: { name: '무신강림', mp: 25, lv: 10, type: 'buff', value: .4, dur: 40, delay: .5 },
    },
  },
  huangzhong: {
    name: '황충', job: '신궁', hanja: '忠', color: '#8a5a2b',
    blurb: '백발백중의 노장 궁수. 멀리서 화살로 적을 꿰뚫는다.',
    hp: [110, 21], mp: [32, 8], atk: [11, 3],
    basic: { name: '사격', type: 'proj', proj: 'arrow', speed: 950, range: 560, targets: 1, hits: 1, mult: 1, delay: .45 },
    skills: {
      A: { name: '연사', mp: 5, lv: 1, type: 'proj', proj: 'arrow', speed: 1000, range: 600, targets: 1, hits: 2, mult: 1, delay: .5 },
      S: { name: '관통시', mp: 12, lv: 5, type: 'proj', proj: 'bigarrow', speed: 1100, range: 700, targets: 6, hits: 1, mult: 1.7, delay: .6 },
      D: { name: '화살비', mp: 22, lv: 10, type: 'rain', range: 420, h: 260, targets: 8, hits: 3, mult: 1, delay: .75 },
    },
  },
  zhugeliang: {
    name: '제갈량', job: '책사', hanja: '亮', color: '#4b6aa0',
    blurb: '천문과 병법에 통달한 책사. 체력은 낮지만 불과 번개로 적을 쓸어버린다.',
    hp: [90, 16], mp: [55, 14], atk: [13, 3.4],
    basic: { name: '풍탄', type: 'proj', proj: 'wind', speed: 700, range: 480, targets: 1, hits: 1, mult: 1.1, delay: .5 },
    skills: {
      A: { name: '화계', mp: 8, lv: 1, type: 'pillar', range: 150, w: 170, h: 150, targets: 4, hits: 1, mult: 2.0, delay: .6 },
      S: { name: '뇌격', mp: 12, lv: 5, type: 'chain', range: 460, targets: 5, hits: 1, mult: 1.7, delay: .6 },
      D: { name: '축지법', mp: 6, lv: 8, type: 'blink', dist: 190, delay: .25 },
    },
  },
};

// ── 몬스터 ─────────────────────────────────────────────
const MONSTERS = {
  jolgae:  { name: '황건 졸개', lv: 1,  hp: 32,   atk: 9,  def: 0,  xp: 6,   gold: [3, 7],     speed: 55,  w: 34, h: 40, look: 'jolgae', drops: { herb: .06 } },
  boar:    { name: '들멧돼지',  lv: 3,  hp: 70,   atk: 13, def: 1,  xp: 12,  gold: [5, 10],    speed: 85,  w: 54, h: 38, look: 'boar',   drops: { herb: .08 } },
  dosa:    { name: '황건 도사', lv: 6,  hp: 130,  atk: 17, def: 2,  xp: 22,  gold: [8, 15],    speed: 45,  w: 36, h: 58, look: 'dosa',   drops: { wine: .08, herb: .06 },
             caster: { dmg: 20, cd: 2.6, range: 380, proj: 'orb' } },
  yeoksa:  { name: '황건 역사', lv: 8,  hp: 260,  atk: 26, def: 4,  xp: 36,  gold: [12, 22],   speed: 42,  w: 58, h: 70, look: 'yeoksa', drops: { herb: .12 } },
  dzfoot:  { name: '동탁군 보병', lv: 13, hp: 460, atk: 36, def: 8, xp: 58,  gold: [18, 30],   speed: 58,  w: 42, h: 64, look: 'dzfoot', drops: { pill: .05, herb: .1 } },
  dzarcher:{ name: '동탁군 궁병', lv: 14, hp: 380, atk: 30, def: 6, xp: 62,  gold: [20, 32],   speed: 50,  w: 40, h: 62, look: 'dzarcher', drops: { wine: .1 },
             caster: { dmg: 38, cd: 2.3, range: 460, proj: 'earrow' } },
  xlcav:   { name: '서량 기병', lv: 15, hp: 560, atk: 44, def: 9,  xp: 76,  gold: [24, 38],   speed: 115, w: 84, h: 74, look: 'xlcav',  drops: { pill: .07 } },

  jangjiao:{ name: '장각', title: '천공장군', lv: 12, hp: 3400, atk: 32, def: 5, xp: 1200, gold: [300, 420], speed: 40, w: 90, h: 124, look: 'jangjiao', boss: true, drops: { pill: 1 } },
  lubu:    { name: '여포', title: '천하무쌍', lv: 22, hp: 15000, atk: 70, def: 12, xp: 6000, gold: [1500, 2000], speed: 70, w: 70, h: 120, look: 'lubu', boss: true, drops: { pill: 1 } },
};

// ── 도구 ───────────────────────────────────────────────
const ITEMS = {
  herb: { name: '약초', price: 25,  hp: 120, key: '1', desc: '체력 120 회복' },
  pill: { name: '환약', price: 90,  hp: 450, key: '2', desc: '체력 450 회복' },
  wine: { name: '탁주', price: 40,  mp: 90,  key: '3', desc: '기력 90 회복' },
};
const WEAPON_MAX = 10;
const weaponCost = lv => Math.round(80 * Math.pow(lv + 1, 1.9));

// ── NPC ────────────────────────────────────────────────
const NPCS = {
  chief:    { name: '촌장',      look: 'elder',    line: '탁현도 요즘 흉흉하다네. 누런 두건을 쓴 놈들이 날뛰고 있어.' },
  merchant: { name: '상인 장세평', look: 'merchant', line: '좋은 약초 있습니다! 전장에 나가시려면 넉넉히 챙기시지요.', shop: true },
  smith:    { name: '대장장이',   look: 'smith',    line: '무기를 맡겨 보시오. 쇠는 두드릴수록 강해지는 법이지.', forge: true },
  herald:   { name: '연합군 전령', look: 'herald',  line: '열여덟 제후의 연합군이 모였소. 역적 동탁을 치러 갑시다!' },
  sutler:   { name: '군수관',     look: 'merchant', line: '군량과 약은 여기서 보급하시오.', shop: true },
  smith2:   { name: '종군 대장장이', look: 'smith',  line: '전장의 무기는 전장에서 벼리는 법.', forge: true },
};

// ── 퀘스트 (순서대로 진행) ─────────────────────────────
const QUESTS = [
  { npc: 'chief', title: '황건 졸개 퇴치', kill: { jolgae: 10 },
    offer: '마을 동쪽 들판에 황건 졸개들이 설치고 있다네. 열 놈만 혼쭐을 내 주겠나?',
    done: '고맙네! 자네는 보통 사람이 아니로군.', reward: { xp: 120, gold: 150, items: { herb: 5 } } },
  { npc: 'chief', title: '들멧돼지 소동', kill: { boar: 8 },
    offer: '들판의 멧돼지들이 난리통에 사나워져서 밭을 다 망치고 있네. 여덟 마리만 잡아 주게.',
    done: '이제 농사를 지을 수 있겠군. 이건 약소하지만 받아 두게.', reward: { xp: 260, gold: 250, items: { wine: 3 } } },
  { npc: 'chief', title: '산채의 요술사', kill: { dosa: 10 },
    offer: '들판 너머 황건 산채에서 도사들이 요술을 부린다는군. 도사 열 명을 쓰러뜨려 주게. 밧줄을 타고 위로 올라가야 할 걸세.',
    done: '대단하군! 이제 남은 건 저들의 우두머리뿐일세.', reward: { xp: 700, gold: 450, items: { pill: 3 } } },
  { npc: 'chief', title: '천공장군 장각', kill: { jangjiao: 1 },
    offer: '산채 꼭대기의 문을 지나면 광종 제단일세. 태평도 교주 장각이 거기 있다네. 번개를 조심하게!',
    done: '장각이 쓰러졌다니! 참, 동쪽에서 제후들이 연합군을 모은다더군. 제단 동쪽 문으로 가 보게.', reward: { xp: 1600, gold: 1000, items: { pill: 5 } } },
  { npc: 'herald', title: '사수관 공략', kill: { dzfoot: 12, dzarcher: 8 },
    offer: '사수관 성벽을 동탁군이 지키고 있소. 보병 열둘과 궁병 여덟을 쓰러뜨려 길을 열어 주시오.',
    done: '성벽의 수비가 무너졌소! 이제 서량 기병이 문제요.', reward: { xp: 3200, gold: 1500, items: { pill: 5 } } },
  { npc: 'herald', title: '서량의 철기', kill: { xlcav: 10 },
    offer: '동탁이 자랑하는 서량 기병이 성벽 위를 휩쓸고 있소. 열 기를 쓰러뜨려 주시오.',
    done: '훌륭하오! 이제 호뢰관만 남았소. 그곳엔… 여포가 있소.', reward: { xp: 4500, gold: 2000, items: { pill: 5, wine: 5 } } },
  { npc: 'herald', title: '천하무쌍 여포', kill: { lubu: 1 },
    offer: '사람 중에 여포, 말 중에 적토라 했소. 호뢰관의 여포를 꺾을 수 있는 자는 그대뿐이오. 돌진과 도약을 조심하시오!',
    done: '여포가 물러났소! 그대의 이름이 천하에 울려 퍼질 것이오. (제1부 완결 — 다음 이야기를 기다려 주세요!)', reward: { xp: 10000, gold: 5000 } },
];

// ── 맵 ─────────────────────────────────────────────────
// 발판은 위에서만 밟히는 한 방향 발판. 밧줄은 ↑/↓로 오르내린다.
// spawns: p = 발판 번호(-1은 땅)
const MAPS = {
  town: {
    name: '탁현 마을', theme: 'town', w: 1800, h: 640, ground: 580, safe: true,
    platforms: [{ x: 640, y: 450, w: 240 }],
    ropes: [],
    npcs: [{ id: 'chief', x: 430 }, { id: 'merchant', x: 1000 }, { id: 'smith', x: 1300 }],
    portals: [{ id: 'e', x: 1740, to: 'field', dest: 'w' }],
    spawns: [],
    start: 200,
  },
  field: {
    name: '탁현 들판', theme: 'field', w: 2600, h: 860, ground: 800,
    platforms: [
      { x: 260, y: 660, w: 380 }, { x: 760, y: 600, w: 320 }, { x: 1200, y: 660, w: 420 },
      { x: 520, y: 480, w: 300 }, { x: 1650, y: 520, w: 360 }, { x: 2120, y: 650, w: 300 },
      { x: 1000, y: 400, w: 260 },
    ],
    ropes: [
      { x: 420, top: 660, bottom: 800 }, { x: 600, top: 480, bottom: 660 }, { x: 1400, top: 660, bottom: 800 },
      { x: 1800, top: 520, bottom: 800 }, { x: 1040, top: 400, bottom: 600 }, { x: 2250, top: 650, bottom: 800 },
    ],
    npcs: [],
    portals: [{ id: 'w', x: 60, to: 'town', dest: 'e' }, { id: 'e', x: 2540, to: 'camp', dest: 'w' }],
    spawns: [
      { m: 'jolgae', p: -1, n: 4 }, { m: 'jolgae', p: 0, n: 2 }, { m: 'jolgae', p: 2, n: 2 },
      { m: 'boar', p: -1, n: 2 }, { m: 'boar', p: 4, n: 2 }, { m: 'jolgae', p: 3, n: 1 },
      { m: 'boar', p: 5, n: 1 }, { m: 'jolgae', p: 6, n: 1 },
    ],
  },
  camp: {
    name: '황건 산채', theme: 'camp', w: 2600, h: 1200, ground: 1140,
    platforms: [
      { x: 200, y: 1000, w: 500 }, { x: 900, y: 1000, w: 600 }, { x: 1750, y: 1000, w: 600 },
      { x: 400, y: 850, w: 500 }, { x: 1200, y: 850, w: 700 },
      { x: 150, y: 700, w: 450 }, { x: 800, y: 700, w: 600 }, { x: 1700, y: 700, w: 500 },
      { x: 500, y: 550, w: 500 }, { x: 1400, y: 550, w: 500 },
      { x: 2000, y: 420, w: 450 },
    ],
    ropes: [
      { x: 450, top: 1000, bottom: 1140 }, { x: 2000, top: 1000, bottom: 1140 },
      { x: 600, top: 850, bottom: 1000 }, { x: 1300, top: 850, bottom: 1000 },
      { x: 500, top: 700, bottom: 850 }, { x: 1250, top: 700, bottom: 850 }, { x: 1750, top: 700, bottom: 850 },
      { x: 900, top: 550, bottom: 700 }, { x: 1850, top: 550, bottom: 700 }, { x: 2100, top: 420, bottom: 700 },
    ],
    npcs: [],
    portals: [{ id: 'w', x: 60, to: 'field', dest: 'e' }, { id: 'boss', x: 2380, y: 420, to: 'altar', dest: 'w' }],
    spawns: [
      { m: 'jolgae', p: 0, n: 2 }, { m: 'dosa', p: 1, n: 2 }, { m: 'dosa', p: 2, n: 2 },
      { m: 'yeoksa', p: -1, n: 3 }, { m: 'jolgae', p: 3, n: 1 }, { m: 'dosa', p: 4, n: 2 },
      { m: 'dosa', p: 6, n: 2 }, { m: 'dosa', p: 7, n: 1 }, { m: 'yeoksa', p: 8, n: 1 }, { m: 'yeoksa', p: 9, n: 1 },
    ],
  },
  altar: {
    name: '광종 제단', theme: 'altar', w: 1500, h: 640, ground: 580,
    platforms: [{ x: 230, y: 445, w: 240 }, { x: 1030, y: 445, w: 240 }, { x: 630, y: 320, w: 240 }],
    ropes: [],
    npcs: [],
    portals: [{ id: 'w', x: 60, to: 'camp', dest: 'boss' }, { id: 'e', x: 1440, to: 'allies', dest: 'w', req: 'jangjiao' }],
    spawns: [{ m: 'jangjiao', p: -1, n: 1, x: 1050, boss: true }],
  },
  allies: {
    name: '연합군 진영', theme: 'allies', w: 1800, h: 640, ground: 580, safe: true,
    platforms: [{ x: 700, y: 450, w: 260 }],
    ropes: [],
    npcs: [{ id: 'herald', x: 480 }, { id: 'sutler', x: 1050 }, { id: 'smith2', x: 1350 }],
    portals: [{ id: 'w', x: 60, to: 'altar', dest: 'e' }, { id: 'e', x: 1740, to: 'wall', dest: 'w' }],
    spawns: [],
  },
  wall: {
    name: '사수관 성벽', theme: 'wall', w: 2800, h: 900, ground: 840,
    platforms: [
      { x: 200, y: 700, w: 500 }, { x: 900, y: 700, w: 500 }, { x: 1600, y: 700, w: 500 }, { x: 2250, y: 700, w: 450 },
      { x: 500, y: 550, w: 600 }, { x: 1400, y: 550, w: 700 }, { x: 900, y: 400, w: 700 },
    ],
    ropes: [
      { x: 400, top: 700, bottom: 840 }, { x: 1800, top: 700, bottom: 840 }, { x: 2400, top: 700, bottom: 840 },
      { x: 1000, top: 550, bottom: 700 }, { x: 1700, top: 550, bottom: 700 }, { x: 1050, top: 400, bottom: 550 },
    ],
    npcs: [],
    portals: [{ id: 'w', x: 60, to: 'allies', dest: 'e' }, { id: 'e', x: 2740, to: 'hulao', dest: 'w' }],
    spawns: [
      { m: 'dzfoot', p: -1, n: 3 }, { m: 'xlcav', p: -1, n: 2 }, { m: 'dzarcher', p: 0, n: 2 },
      { m: 'dzfoot', p: 1, n: 2 }, { m: 'dzarcher', p: 2, n: 1 }, { m: 'dzfoot', p: 3, n: 2 },
      { m: 'dzfoot', p: 4, n: 2 }, { m: 'xlcav', p: 5, n: 2 }, { m: 'dzarcher', p: 6, n: 2 }, { m: 'xlcav', p: 6, n: 1 },
    ],
  },
  hulao: {
    name: '호뢰관', theme: 'hulao', w: 1600, h: 640, ground: 580,
    platforms: [{ x: 200, y: 445, w: 260 }, { x: 1140, y: 445, w: 260 }],
    ropes: [],
    npcs: [],
    portals: [{ id: 'w', x: 60, to: 'wall', dest: 'e' }],
    spawns: [{ m: 'lubu', p: -1, n: 1, x: 1150, boss: true }],
  },
};
