// 난세영웅전 — 게임 데이터 (무장, 책략, 적, 도구, 장(章) 구성)

const STAT_KEYS = ['hp', 'mp', 'atk', 'int', 'def', 'spd'];
const STAT_LABEL = { atk: '무력', int: '지력', def: '통솔', spd: '민첩' };

// ── 무장 ───────────────────────────────────────────────
// base: 1레벨 능력치, grow: 레벨당 성장치
const GENERALS = {
  // 촉
  liubei:     { name: '유비',   hanja: '劉備',   ch: '備', style: '현덕', role: '인덕의 군주',
    base: { hp: 120, mp: 30, atk: 14, int: 16, def: 12, spd: 11 }, grow: { hp: 12, mp: 3,   atk: 1.6, int: 1.8, def: 1.3, spd: .8 }, skills: ['ssanggo', 'indeok'] },
  guanyu:     { name: '관우',   hanja: '關羽',   ch: '羽', style: '운장', role: '미염공',
    base: { hp: 135, mp: 20, atk: 19, int: 12, def: 13, spd: 10 }, grow: { hp: 13, mp: 2,   atk: 2.3, int: 1,   def: 1.4, spd: .7 }, skills: ['cheongryong', 'wipung'] },
  zhangfei:   { name: '장비',   hanja: '張飛',   ch: '飛', style: '익덕', role: '만인지적',
    base: { hp: 150, mp: 16, atk: 18, int: 6,  def: 12, spd: 9 },  grow: { hp: 15, mp: 1.6, atk: 2.2, int: .5,  def: 1.3, spd: .6 }, skills: ['jangpal', 'hotong'] },
  zhugeliang: { name: '제갈량', hanja: '諸葛亮', ch: '亮', style: '공명', role: '와룡',
    base: { hp: 95,  mp: 50, atk: 8,  int: 24, def: 9,  spd: 12 }, grow: { hp: 9,  mp: 5,   atk: .8,  int: 2.6, def: 1,   spd: .9 }, skills: ['hwagye', 'paljin'] },
  // 위
  caocao:     { name: '조조',   hanja: '曹操',   ch: '操', style: '맹덕', role: '난세의 간웅',
    base: { hp: 125, mp: 32, atk: 15, int: 18, def: 12, spd: 11 }, grow: { hp: 12, mp: 3,   atk: 1.7, int: 2,   def: 1.3, spd: .8 }, skills: ['ganung', 'mangmae'] },
  xiahoudun:  { name: '하후돈', hanja: '夏侯惇', ch: '惇', style: '원양', role: '독안룡',
    base: { hp: 140, mp: 18, atk: 18, int: 8,  def: 13, spd: 10 }, grow: { hp: 14, mp: 1.8, atk: 2.2, int: .7,  def: 1.4, spd: .7 }, skills: ['maengjin', 'balsi'] },
  xuchu:      { name: '허저',   hanja: '許褚',   ch: '褚', style: '중강', role: '호치',
    base: { hp: 160, mp: 14, atk: 19, int: 5,  def: 11, spd: 8 },  grow: { hp: 16, mp: 1.4, atk: 2.3, int: .4,  def: 1.2, spd: .5 }, skills: ['hochi', 'naui'] },
  guojia:     { name: '곽가',   hanja: '郭嘉',   ch: '嘉', style: '봉효', role: '귀재',
    base: { hp: 90,  mp: 48, atk: 7,  int: 25, def: 8,  spd: 12 }, grow: { hp: 8,  mp: 5,   atk: .7,  int: 2.7, def: .9,  spd: .9 }, skills: ['gwijae', 'sipseung'] },
  // 오
  sunjian:    { name: '손견',   hanja: '孫堅',   ch: '堅', style: '문대', role: '강동의 호랑이',
    base: { hp: 130, mp: 24, atk: 17, int: 13, def: 12, spd: 11 }, grow: { hp: 13, mp: 2.4, atk: 2,   int: 1.3, def: 1.3, spd: .8 }, skills: ['gojeong', 'gangdong'] },
  huanggai:   { name: '황개',   hanja: '黃蓋',   ch: '蓋', style: '공복', role: '노익장',
    base: { hp: 150, mp: 20, atk: 16, int: 10, def: 14, spd: 8 },  grow: { hp: 15, mp: 2,   atk: 1.9, int: 1,   def: 1.5, spd: .6 }, skills: ['cheolpyeon', 'goyuk'] },
  sunce:      { name: '손책',   hanja: '孫策',   ch: '策', style: '백부', role: '소패왕',
    base: { hp: 130, mp: 18, atk: 19, int: 9,  def: 11, spd: 13 }, grow: { hp: 13, mp: 1.8, atk: 2.3, int: .9,  def: 1.2, spd: 1 },  skills: ['sopaewang', 'dolgyeok'] },
  zhouyu:     { name: '주유',   hanja: '周瑜',   ch: '瑜', style: '공근', role: '미주랑',
    base: { hp: 100, mp: 46, atk: 10, int: 23, def: 10, spd: 12 }, grow: { hp: 10, mp: 4.6, atk: 1,   int: 2.5, def: 1,   spd: .9 }, skills: ['jeokbyeok', 'geumseul'] },
};

// ── 책략 ───────────────────────────────────────────────
// kind: phys(무력) | magic(지력) | heal | buff
// target: one(적 하나) | all(적 전체) | ally(아군 하나) | allies(아군 전체) | self
const SKILLS = {
  ssanggo:     { name: '쌍고검',       mp: 6,  kind: 'phys',  target: 'one',    power: 1.5, desc: '두 자루 검으로 연달아 벤다.' },
  indeok:      { name: '인덕',         mp: 10, kind: 'heal',  target: 'allies', power: 1.2, desc: '덕으로 군을 다독여 아군 전체를 회복한다.' },
  cheongryong: { name: '청룡언월',     mp: 8,  kind: 'phys',  target: 'one',    power: 2.2, desc: '82근 청룡언월도의 일격.' },
  wipung:      { name: '위풍당당',     mp: 6,  kind: 'buff',  target: 'self',   buff: 'atk', turns: 3, desc: '3턴 동안 자신의 공격력이 오른다.' },
  jangpal:     { name: '장팔사모',     mp: 6,  kind: 'phys',  target: 'one',    power: 1.8, desc: '한 길 여덟 자 창으로 꿰뚫는다.' },
  hotong:      { name: '장판교 호통',  mp: 10, kind: 'phys',  target: 'all',    power: .8, stun: .4, desc: '적 전체를 공격하고 기절시킬 수 있다.' },
  hwagye:      { name: '화계',         mp: 14, kind: 'magic', target: 'all',    power: 1.1, burn: .7, desc: '적 전체를 불태우고 화상을 입힌다.' },
  paljin:      { name: '팔진도',       mp: 12, kind: 'buff',  target: 'allies', buff: 'def', turns: 3, desc: '3턴 동안 아군 전체의 방어가 오른다.' },

  ganung:      { name: '간웅의 계략',  mp: 8,  kind: 'magic', target: 'one',    power: 1.8, desc: '허를 찌르는 계책으로 적 하나를 친다.' },
  mangmae:     { name: '망매해갈',     mp: 10, kind: 'heal',  target: 'allies', power: 1.0, desc: '"앞에 매실 숲이 있다!" 아군 전체 회복.' },
  maengjin:    { name: '맹진',         mp: 5,  kind: 'phys',  target: 'one',    power: 1.5, desc: '물러섬 없이 돌진한다.' },
  balsi:       { name: '발시담목',     mp: 8,  kind: 'phys',  target: 'one',    power: 1.9, drain: .3, desc: '부모께 받은 눈을 버릴 수 없다! 피해의 일부를 흡수.' },
  hochi:       { name: '호치의 괴력',  mp: 9,  kind: 'phys',  target: 'one',    power: 2.3, desc: '호랑이 같은 괴력으로 내리친다.' },
  naui:        { name: '나의',         mp: 5,  kind: 'buff',  target: 'self',   buff: 'atk', turns: 3, desc: '갑옷을 벗어 던지고 싸운다. 3턴간 공격 상승.' },
  gwijae:      { name: '귀재',         mp: 10, kind: 'magic', target: 'one',    power: 2.1, desc: '귀신같은 계산으로 급소를 찌른다.' },
  sipseung:    { name: '십승십패',     mp: 14, kind: 'magic', target: 'all',    power: .9, stun: .3, desc: '적 전체의 허점을 꿰뚫는다. 기절 확률.' },

  gojeong:     { name: '고정도',       mp: 6,  kind: 'phys',  target: 'one',    power: 1.7, desc: '손씨 가문의 보도 고정도로 벤다.' },
  gangdong:    { name: '강동의 호랑이', mp: 10, kind: 'buff', target: 'allies', buff: 'atk', turns: 3, desc: '포효하여 3턴간 아군 전체 공격 상승.' },
  cheolpyeon:  { name: '철편',         mp: 5,  kind: 'phys',  target: 'one',    power: 1.5, desc: '쇠채찍으로 후려친다.' },
  goyuk:       { name: '고육지계',     mp: 8,  kind: 'phys',  target: 'one',    power: 2.6, recoil: .1, desc: '제 몸을 상하게 하여 큰 피해를 준다.' },
  sopaewang:   { name: '소패왕',       mp: 8,  kind: 'phys',  target: 'one',    power: 2.0, desc: '패왕 항우를 닮은 용맹의 일격.' },
  dolgyeok:    { name: '패왕의 돌격',  mp: 10, kind: 'phys',  target: 'all',    power: .9, desc: '적진을 가로지르며 적 전체를 친다.' },
  jeokbyeok:   { name: '적벽화공',     mp: 16, kind: 'magic', target: 'all',    power: 1.3, burn: .8, desc: '장강을 불바다로. 적 전체 화상.' },
  geumseul:    { name: '곡유오 주랑고', mp: 10, kind: 'heal', target: 'allies', power: 1.0, desc: '거문고 가락으로 아군 전체를 회복한다.' },

  // 적 전용
  e_curse:     { name: '요술',          kind: 'magic', target: 'one',    power: 1.3 },
  e_thunder:   { name: '태평요술 낙뢰', kind: 'magic', target: 'all',    power: .9, stun: .15 },
  e_charge:    { name: '돌격',          kind: 'phys',  target: 'one',    power: 1.5 },
  e_volley:    { name: '일제 사격',     kind: 'phys',  target: 'all',    power: .6 },
  e_cleave:    { name: '일도양단',      kind: 'phys',  target: 'one',    power: 1.8 },
  e_halberd:   { name: '방천화극 난무', kind: 'phys',  target: 'all',    power: 1.0 },
  e_fireatk:   { name: '화공',          kind: 'magic', target: 'all',    power: .8, burn: .4 },
  e_command:   { name: '호령',          kind: 'buff',  target: 'allies', buff: 'atk', turns: 3 },
  e_scheme:    { name: '계략',          kind: 'magic', target: 'one',    power: 1.6, stun: .3 },
  e_plumheal:  { name: '망매해갈',      kind: 'heal',  target: 'allies', power: .8 },
  e_fireship:  { name: '화선 돌격',     kind: 'magic', target: 'all',    power: 1.0, burn: .5 },
  e_redcliff:  { name: '적벽화공',      kind: 'magic', target: 'all',    power: 1.1, burn: .6 },
};

// ── 적 ─────────────────────────────────────────────────
const ENEMIES = {
  ytsoldier:  { name: '황건적',      ch: '賊', hp: 50,   atk: 11, int: 3,  def: 5,  spd: 8,  xp: 9,   gold: 7 },
  ytmonk:     { name: '황건 도사',   ch: '道', hp: 40,   atk: 6,  int: 12, def: 4,  spd: 10, xp: 11,  gold: 9,  skills: ['e_curse'] },
  ytbrute:    { name: '황건 역사',   ch: '力', hp: 85,   atk: 14, int: 2,  def: 8,  spd: 6,  xp: 14,  gold: 10 },
  zhangjiao:  { name: '장각', title: '천공장군', ch: '角', hp: 420, atk: 14, int: 19, def: 9, spd: 11, xp: 110, gold: 120, boss: true, skills: ['e_thunder', 'e_curse'] },

  dzfoot:     { name: '동탁군 보병', ch: '步', hp: 130,  atk: 17, int: 4,  def: 13, spd: 9,  xp: 22,  gold: 15 },
  dzarcher:   { name: '동탁군 궁병', ch: '弓', hp: 85,   atk: 20, int: 5,  def: 8,  spd: 11, xp: 20,  gold: 14, skills: ['e_volley'] },
  dzcav:      { name: '서량 기병',   ch: '騎', hp: 110,  atk: 19, int: 4,  def: 11, spd: 13, xp: 22,  gold: 15, skills: ['e_charge'] },
  huaxiong:   { name: '화웅', title: '동탁군 도독', ch: '雄', hp: 900, atk: 26, int: 8, def: 15, spd: 12, xp: 280, gold: 260, boss: true, skills: ['e_charge', 'e_cleave'] },

  feixiong:   { name: '비웅군',      ch: '熊', hp: 170,  atk: 27, int: 6,  def: 18, spd: 12, xp: 36,  gold: 24 },
  xlcav:      { name: '서량 철기',   ch: '鐵', hp: 150,  atk: 29, int: 5,  def: 15, spd: 15, xp: 38,  gold: 25, skills: ['e_charge'] },
  dzstrat:    { name: '동탁군 책사', ch: '謀', hp: 120,  atk: 12, int: 28, def: 12, spd: 12, xp: 40,  gold: 28, skills: ['e_curse', 'e_fireatk'] },
  lubu:       { name: '여포', title: '천하무쌍', ch: '布', hp: 1400, atk: 38, int: 10, def: 22, spd: 18, xp: 600, gold: 450, boss: true, actions: 2, skills: ['e_halberd', 'e_cleave'] },

  ysspear:    { name: '원소군 창병', ch: '槍', hp: 230,  atk: 34, int: 6,  def: 22, spd: 11, xp: 50,  gold: 30 },
  ysxbow:     { name: '원소군 노병', ch: '弩', hp: 180,  atk: 36, int: 6,  def: 17, spd: 13, xp: 50,  gold: 30, skills: ['e_volley'] },
  yanliang:   { name: '안량', title: '하북의 명장', ch: '良', hp: 800, atk: 42, int: 8, def: 24, spd: 14, xp: 220, gold: 160, elite: true, skills: ['e_cleave'] },
  wenchou:    { name: '문추', title: '하북의 명장', ch: '醜', hp: 850, atk: 41, int: 8, def: 25, spd: 13, xp: 230, gold: 160, elite: true, skills: ['e_charge', 'e_volley'] },
  yuanshao:   { name: '원소', title: '하북의 맹주', ch: '紹', hp: 1700, atk: 34, int: 30, def: 26, spd: 12, xp: 750, gold: 550, boss: true, skills: ['e_command', 'e_volley', 'e_scheme'] },

  weimarine:  { name: '위 수군',     ch: '水', hp: 260,  atk: 42, int: 8,  def: 26, spd: 12, xp: 65,  gold: 40 },
  tigercav:   { name: '호표기',      ch: '虎', hp: 280,  atk: 46, int: 8,  def: 28, spd: 15, xp: 70,  gold: 42, skills: ['e_charge'] },
  zhangliao:  { name: '장료', title: '위의 맹장', ch: '遼', hp: 1100, atk: 50, int: 14, def: 30, spd: 16, xp: 300, gold: 220, elite: true, skills: ['e_cleave', 'e_charge'] },
  xuchu_e:    { name: '허저', title: '호치', ch: '褚', hp: 1200, atk: 52, int: 5, def: 32, spd: 9, xp: 400, gold: 250, elite: true, skills: ['e_cleave'] },
  caocao_e:   { name: '조조', title: '승상', ch: '操', hp: 2400, atk: 40, int: 40, def: 30, spd: 14, xp: 1000, gold: 800, boss: true, actions: 2, skills: ['e_command', 'e_scheme', 'e_plumheal'] },

  almarine:   { name: '연합 수군',   ch: '水', hp: 260,  atk: 42, int: 8,  def: 26, spd: 12, xp: 65,  gold: 40 },
  wuarcher:   { name: '강동 궁수',   ch: '江', hp: 200,  atk: 44, int: 8,  def: 22, spd: 14, xp: 65,  gold: 40, skills: ['e_volley'] },
  huanggai_e: { name: '황개', title: '고육지계', ch: '蓋', hp: 1100, atk: 48, int: 20, def: 30, spd: 10, xp: 300, gold: 220, elite: true, skills: ['e_fireship', 'e_cleave'] },
  zhouyu_e:   { name: '주유', title: '대도독', ch: '瑜', hp: 2300, atk: 30, int: 48, def: 26, spd: 15, xp: 1000, gold: 800, boss: true, actions: 2, skills: ['e_redcliff', 'e_scheme'] },
};

// ── 도구 ───────────────────────────────────────────────
const ITEMS = {
  herb:     { name: '약초', price: 20,  heal: 80,  desc: '병사 하나의 체력 80 회복' },
  pill:     { name: '환약', price: 70,  heal: 300, desc: '병사 하나의 체력 300 회복' },
  wine:     { name: '탁주', price: 45,  mp: 35,    desc: '기력(MP) 35 회복' },
  lingzhi:  { name: '영지', price: 150, revive: .5, desc: '쓰러진 무장을 체력 절반으로 일으킨다' },
};

// ── 세력 ───────────────────────────────────────────────
const FACTIONS = {
  shu: { name: '촉', army: '유비군', seal: '蜀', start: ['liubei', 'guanyu', 'zhangfei'], join: 'zhugeliang',
    blurb: '도원에서 의형제를 맺은 세 영웅. 유비의 회복과 관우·장비의 무력이 균형을 이룬다.' },
  wei: { name: '위', army: '조조군', seal: '魏', start: ['caocao', 'xiahoudun', 'xuchu'], join: 'guojia',
    blurb: '난세의 간웅 조조와 맹장들. 강력한 단일 공격과 흡수로 적을 밀어붙인다.' },
  wu:  { name: '오', army: '손견군', seal: '吳', start: ['sunjian', 'huanggai', 'sunce'], join: 'zhouyu',
    blurb: '강동의 호랑이 손씨 일가. 전체 공격력 강화와 광역 공격이 특기다.' },
};
const JOIN_AFTER_CHAPTER = 2; // 3장(호뢰관) 이후 네 번째 무장 합류

// ── 장(章) ─────────────────────────────────────────────
// 대사: [화자, 내용] — 화자가 null이면 서술
const CHAPTERS = [
  {
    title: '황건적의 난', hanja: '黃巾之亂', year: '184년 · 중평 원년', place: '탁군 — 광종', rec: 'Lv 1–4',
    stages: [
      { name: '탁현 외곽',   enemies: ['ytsoldier', 'ytsoldier'] },
      { name: '청주 구원전', enemies: ['ytsoldier', 'ytmonk', 'ytbrute'] },
      { name: '광종 결전',   enemies: ['ytmonk', 'zhangjiao', 'ytbrute'], boss: true },
    ],
    train: ['ytsoldier', 'ytmonk', 'ytbrute'],
    intro: {
      common: [
        [null, '중평 원년(184년). 태평도의 교주 장각이 누런 두건을 두른 수십만 신도와 함께 봉기했다.'],
        ['장각', '창천은 이미 죽었으니 황천이 마땅히 서리라! 갑자년에 천하가 크게 길하리라!'],
        [null, '한 조정은 각지에 의병을 모집하는 방을 붙였다.'],
      ],
      shu: [
        ['유비', '나는 중산정왕의 후예, 유비 현덕이오. 백성이 도탄에 빠졌는데 어찌 돗자리만 짜고 있겠소.'],
        ['관우', '도원에서 맺은 맹세를 잊지 않았습니다. 형님이 가시는 길은 이 청룡언월도가 열겠습니다.'],
        ['장비', '하하! 도적놈들 목이나 실컷 베어 봅시다, 큰형님!'],
      ],
      wei: [
        ['조조', '난세로다. 허나 난세야말로 영웅이 날개를 펼 때가 아니겠는가.'],
        ['하후돈', '맹덕, 명만 내리시오. 황건 놈들의 목을 쌓아 올리겠소.'],
        ['허저', '배불리 먹여만 주시면 누구든 때려눕히겠습니다요.'],
      ],
      wu: [
        ['손견', '강동의 호랑이가 가만히 있을 수는 없지. 오군의 병사들이여, 출진이다!'],
        ['황개', '주공, 이 늙은 몸도 아직 철편을 휘두를 힘은 남아 있습니다.'],
        ['손책', '아버님, 선봉은 제가 서겠습니다!'],
      ],
    },
    outro: {
      common: [
        ['장각', '황천이… 어찌하여…'],
        [null, '장각이 쓰러지자 황건의 무리는 뿔뿔이 흩어졌다. 그러나 난세는 이제 막 시작되었을 뿐이었다.'],
      ],
    },
  },
  {
    title: '사수관 전투', hanja: '汜水關', year: '190년 · 초평 원년', place: '사수관', rec: 'Lv 4–7',
    stages: [
      { name: '사수관 전초',  enemies: ['dzfoot', 'dzarcher', 'dzfoot'] },
      { name: '사수관 성벽',  enemies: ['dzcav', 'dzarcher', 'dzcav'] },
      { name: '화웅의 진',    enemies: ['dzfoot', 'huaxiong', 'dzarcher'], boss: true },
    ],
    train: ['dzfoot', 'dzarcher', 'dzcav'],
    intro: {
      common: [
        [null, '초평 원년(190년). 역적 동탁이 어린 황제를 끼고 낙양을 장악했다.'],
        [null, '조조가 격문을 띄우자 열여덟 제후가 원소를 맹주로 삼아 연합군을 결성한다.'],
        ['화웅', '연합군이라 해 봤자 오합지졸! 사수관은 이 화웅이 지킨다!'],
      ],
      shu: [['관우', '데운 술은 잠시 두시오. 식기 전에 돌아오겠소.'], ['유비', '운장, 조심하게.']],
      wei: [['조조', '격문을 띄운 것은 나다. 연합군의 선봉 또한 우리가 맡는다.']],
      wu:  [['손견', '선봉은 이 손문대가 맡겠소! 화웅의 목은 내 것이다!']],
    },
    outro: {
      common: [[null, '화웅이 쓰러지자 사수관의 문이 열렸다.']],
      shu: [['관우', '…술이 아직 따뜻하군요.']],
      wei: [['하후돈', '다음은 호뢰관이오, 맹덕.']],
      wu:  [['손책', '아버님, 해내셨습니다!']],
    },
  },
  {
    title: '호뢰관 전투', hanja: '虎牢關', year: '190년 · 초평 원년', place: '호뢰관', rec: 'Lv 7–10',
    stages: [
      { name: '호뢰관 진입',  enemies: ['feixiong', 'xlcav', 'feixiong'] },
      { name: '동탁군 본대',  enemies: ['dzstrat', 'feixiong', 'xlcav'] },
      { name: '방천화극',     enemies: ['lubu'], boss: true },
    ],
    train: ['feixiong', 'xlcav', 'dzstrat'],
    tip: '여포는 한 합에 두 번 움직입니다. 체력을 넉넉히 유지하세요.',
    intro: {
      common: [
        [null, '사수관을 잃은 동탁은 호뢰관에 최강의 장수를 내보냈다.'],
        ['여포', '내 이름은 여포 봉선. 적토마 위의 나를 막을 자, 천하에 있더냐!'],
        [null, '사람 중에는 여포, 말 중에는 적토. 방천화극이 번뜩일 때마다 제후들의 장수가 쓰러졌다.'],
      ],
      shu: [['장비', '세 성씨의 종놈아! 연인 장익덕이 여기 있다!'], ['유비', '세 형제가 힘을 합치면 못 이길 적이 없다!']],
      wei: [['하후돈', '여포라… 상대로 부족함이 없군.']],
      wu:  [['손책', '천하무쌍이라… 그 이름, 오늘 내가 꺾어 주지!']],
    },
    outro: {
      common: [
        ['여포', '이번엔 물러나 주마. 허나 이 여포는 반드시 돌아온다!'],
        [null, '여포가 퇴각하자 동탁은 낙양을 불태우고 장안으로 달아났다. 연합군은 흩어지고 군웅할거의 시대가 열린다.'],
      ],
    },
    join: {
      shu: [
        [null, '몇 해 뒤, 유비는 융중의 초가를 세 번 찾아갔다.'],
        ['제갈량', '장군의 뜻이 그토록 간절하니 미력이나마 보태겠습니다. 천하를 셋으로 나누는 계책이 있습니다.'],
        [null, '와룡 제갈량이 합류했다!'],
      ],
      wei: [
        ['곽가', '원소는 열 가지 이유로 패하고, 공은 열 가지 이유로 이깁니다.'],
        ['조조', '나의 대업을 이룰 자는 바로 이 사람이로다!'],
        [null, '귀재 곽가가 합류했다!'],
      ],
      wu: [
        ['주유', '백부, 이 공근도 함께하겠네. 강동의 수군은 내게 맡기게.'],
        ['손책', '공근! 자네가 있으면 천하도 두렵지 않네.'],
        [null, '미주랑 주유가 합류했다!'],
      ],
    },
  },
  {
    title: '관도대전', hanja: '官渡之戰', year: '200년 · 건안 5년', place: '백마 — 관도', rec: 'Lv 10–13',
    stages: [
      { name: '백마 구원',   enemies: ['ysspear', 'yanliang', 'ysxbow'] },
      { name: '연진 도하',   enemies: ['ysxbow', 'wenchou', 'ysxbow'] },
      { name: '관도 본진',   enemies: ['ysspear', 'yuanshao', 'ysxbow'], boss: true },
    ],
    train: ['ysspear', 'ysxbow'],
    intro: {
      common: [
        [null, '건안 5년(200년). 하북을 제패한 원소가 칠십만 대군을 이끌고 남하한다.'],
        ['원소', '사세삼공의 명문, 원본초의 대군이다! 한 번에 짓밟아 버려라!'],
      ],
      shu: [['유비', '원소의 대군이 백성을 짓밟게 둘 수는 없다.'], ['제갈량', '적은 많으나 한 몸처럼 움직이지 못합니다. 장수부터 꺾으십시오.']],
      wei: [['조조', '병력은 저쪽이 열 배. 허나 원소는 결단이 없고 의심이 많지. 이길 수 있다.'], ['곽가', '안량과 문추만 꺾으면 하북군은 머리 없는 뱀입니다.']],
      wu:  [['주유', '북쪽의 거인이 강동까지 넘보는군요. 여기서 막아야 합니다.']],
    },
    outro: {
      common: [
        ['원소', '어찌… 어찌 내가…'],
        [null, '관도에서 원소의 대군이 무너졌다. 하북의 패권은 흔들리고, 천하의 눈은 남쪽 장강으로 향한다.'],
      ],
    },
  },
  {
    title: '적벽대전', hanja: '赤壁之戰', year: '208년 · 건안 13년', place: '장강 — 적벽', rec: 'Lv 13–16',
    stages: [
      { name: '장강 수전',    enemies: { default: ['weimarine', 'weimarine', 'tigercav'], wei: ['almarine', 'wuarcher', 'almarine'] } },
      { name: { default: '오림의 매복', wei: '황개의 화선' },
        enemies: { default: ['tigercav', 'zhangliao', 'weimarine'], wei: ['wuarcher', 'huanggai_e', 'almarine'] } },
      { name: '적벽 결전',    enemies: { default: ['xuchu_e', 'caocao_e'], wei: ['almarine', 'zhouyu_e', 'wuarcher'] }, boss: true },
    ],
    train: { default: ['weimarine', 'tigercav'], wei: ['almarine', 'wuarcher'] },
    tip: '최종 결전입니다. 적 총대장은 한 합에 두 번 움직입니다.',
    intro: {
      common: [[null, '건안 13년(208년). 장강의 물결 위로 수천 척의 전함이 늘어섰다.']],
      shu: [
        ['조조', '팔십만 대군이 장강을 덮었다. 강동과 유비를 쓸어버리면 천하는 하나가 된다!'],
        ['제갈량', '동남풍은 제가 부르겠습니다. 적이 전선을 사슬로 묶은 지금이 기회입니다.'],
        ['유비', '이 일전에 천하의 운명이 걸렸다.'],
      ],
      wu: [
        ['조조', '팔십만 대군이 장강을 덮었다. 강동의 쥐새끼들을 쓸어버려라!'],
        ['주유', '황개 장군의 화선이 준비되었습니다. 바람만 불면 됩니다.'],
        ['손견', '강동의 호랑이가 어떻게 싸우는지 보여 주마!'],
      ],
      wei: [
        ['주유', '조조의 배는 사슬로 묶여 있다. 바람이 바뀌면 적벽은 불바다가 될 것이다!'],
        ['곽가', '주공, 사슬을 풀고 불에 대비하십시오. 이번 적벽은 역사와 다르게 끝날 겁니다.'],
        ['조조', '좋다. 이 조맹덕이 오늘 천하를 하나로 만든다!'],
      ],
    },
    outro: {
      shu: [
        [null, '동남풍이 불어오고, 적벽의 불길 속에서 조조의 대군은 무너졌다.'],
        ['유비', '백성이 편히 잠드는 세상… 이제 그 첫걸음을 내디뎠소.'],
        ['제갈량', '형주를 기반으로 익주를 취하면 한실 부흥도 꿈이 아닙니다.'],
        [null, '도원의 맹세는 난세를 넘어 새로운 시대를 열었다.'],
      ],
      wu: [
        [null, '황개의 화선이 사슬에 묶인 조조의 함대를 불태웠다.'],
        ['손견', '강동의 호랑이는 결코 쓰러지지 않는다!'],
        ['주유', '장강은 우리의 것입니다. 이제 천하를 향해 나아갈 때입니다.'],
        [null, '현산에서 쓰러지지 않은 호랑이는 마침내 장강을 제패했다.'],
      ],
      wei: [
        [null, '불길을 피한 위의 수군이 강동의 함대를 제압했다. 역사와는 다른 결말이었다.'],
        ['조조', '천하는 하나가 되었다. 이제 백성에게 평안을 돌려줄 차례다.'],
        ['곽가', '그러니 제가 말씀드렸지요. 주공은 열 가지 이유로 이긴다고.'],
        [null, '간웅이라 불린 사내는 끝내 난세를 끝낸 영웅이 되었다.'],
      ],
    },
  },
];

// 세력별로 갈리는 값({default, wei})을 풀어 준다
function forFaction(v, faction) {
  if (v && !Array.isArray(v) && typeof v === 'object') return v[faction] || v.default;
  return v;
}
