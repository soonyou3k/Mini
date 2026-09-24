// 난세무쌍 — 그리기 (캔버스에 도형으로 직접 그린다. 이미지 파일 없음)

const THEMES = {
  town:   { sky: ['#f6dfb8', '#eab98c'], far: '#c6a58a', mid: '#9c8068', ground: '#6b4a2f', top: '#86a95c', plat: '#7a5535', platTop: '#94bb66', sun: '#fff1c9' },
  field:  { sky: ['#a8cde6', '#eef1dc'], far: '#a8bfb4', mid: '#79a07f', ground: '#5a3d26', top: '#6fa048', plat: '#6a4a2c', platTop: '#7db454', sun: '#fffbe6' },
  camp:   { sky: ['#eea466', '#7a3c2a'], far: '#8a5540', mid: '#5c3a2b', ground: '#4a3322', top: '#9a7a44', plat: '#5a3e28', platTop: '#a8874c', sun: '#ffd28a' },
  altar:  { sky: ['#3d2750', '#140c1c'], far: '#3b2a4b', mid: '#271b31', ground: '#2c2430', top: '#5c4c64', plat: '#3a3040', platTop: '#6c5a74', sun: null },
  allies: { sky: ['#cfdbe4', '#f2e4c8'], far: '#aab4bb', mid: '#8a9a8a', ground: '#5e4630', top: '#8aa66a', plat: '#6e5034', platTop: '#9aba74', sun: '#fff8e2' },
  wall:   { sky: ['#e2a67c', '#6e5c6e'], far: '#7a6c78', mid: '#554c5a', ground: '#4c4744', top: '#827a70', plat: '#5e5852', platTop: '#8e867a', sun: '#ffcf9a', stone: true },
  hulao:  { sky: ['#b8412a', '#2a0f0c'], far: '#62241b', mid: '#3e1813', ground: '#3a2a26', top: '#6e4e3e', plat: '#4a3630', platTop: '#7a5a48', sun: '#ff9a6a', stone: true },
};

// 맵마다 고정된 무작위 값
function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function hashStr(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }

function buildScenery(mapId, map) {
  const r = seeded(hashStr(mapId));
  const ridge = (n, amp) => Array.from({ length: n }, () => r() * amp);
  const decor = [];
  const theme = map.theme;
  const step = theme === 'town' || theme === 'allies' ? 260 : 340;
  for (let x = 150; x < map.w - 100; x += step * (0.7 + r() * 0.6)) {
    let type;
    if (theme === 'town') type = r() < .5 ? 'house' : r() < .6 ? 'peach' : 'lantern';
    else if (theme === 'field') type = r() < .6 ? 'tree' : 'fence';
    else if (theme === 'camp') type = r() < .5 ? 'tent' : 'banner';
    else if (theme === 'altar') type = r() < .5 ? 'pillar' : 'brazier';
    else if (theme === 'allies') type = r() < .5 ? 'tent' : 'flag';
    else if (theme === 'wall') type = r() < .5 ? 'tower' : 'flag';
    else type = r() < .5 ? 'brazier' : 'pillar';
    decor.push({ type, x, v: r() });
  }
  return { far: ridge(60, 1), mid: ridge(80, 1), decor };
}

// ── 배경 ───────────────────────────────────────────────
function drawBackground(ctx, G, vw, vh) {
  const map = G.map, th = THEMES[map.theme], cam = G.cam;
  const g = ctx.createLinearGradient(0, 0, 0, vh);
  g.addColorStop(0, th.sky[0]);
  g.addColorStop(1, th.sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, vw, vh);

  if (th.sun) {
    ctx.fillStyle = th.sun;
    ctx.globalAlpha = .75;
    ctx.beginPath();
    ctx.arc(vw * .78 - cam.x * .03, 90 - cam.y * .03, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    // 밤하늘의 별
    const r = seeded(7);
    ctx.fillStyle = '#e8dcff';
    for (let i = 0; i < 70; i++) {
      const x = (r() * vw * 1.5 - cam.x * .05) % vw, y = r() * vh * .55;
      ctx.globalAlpha = .3 + .5 * Math.abs(Math.sin(G.time * (0.5 + r()) + i));
      ctx.fillRect((x + vw) % vw, y, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  const horizon = vh * .72 - (cam.y - (map.h - vh)) * .15;
  drawRidge(ctx, G.scenery.far, th.far, cam.x * .15, horizon - 40, 170, vw, vh, 110);
  drawRidge(ctx, G.scenery.mid, th.mid, cam.x * .35, horizon + 20, 110, vw, vh, 80);
}

function drawRidge(ctx, pts, color, offset, base, amp, vw, vh, spacing) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, vh);
  const n = pts.length;
  const start = -((offset % spacing) + spacing);
  const first = Math.floor(offset / spacing);
  for (let i = 0; i * spacing + start < vw + spacing * 2; i++) {
    const p = pts[((first + i) % n + n) % n];
    const x = start + i * spacing;
    ctx.lineTo(x, base - p * amp);
  }
  ctx.lineTo(vw + spacing, vh);
  ctx.closePath();
  ctx.fill();
}

// ── 지형 ───────────────────────────────────────────────
function drawTerrain(ctx, G) {
  const map = G.map, th = THEMES[map.theme];
  for (const d of G.scenery.decor) drawDecor(ctx, d, map, th, G.time);

  // 땅
  ctx.fillStyle = th.ground;
  ctx.fillRect(-50, map.ground, map.w + 100, map.h - map.ground + 200);
  ctx.fillStyle = th.top;
  ctx.fillRect(-50, map.ground, map.w + 100, 12);
  ctx.fillStyle = 'rgba(0,0,0,.15)';
  for (let x = 0; x < map.w; x += th.stone ? 48 : 36) {
    if (th.stone) {
      ctx.fillRect(x, map.ground + 12, 2, map.h);
      ctx.fillRect(x, map.ground + 40, 48, 2);
    } else {
      ctx.fillRect(x + (x % 72 ? 10 : 0), map.ground + 24 + (x % 5) * 6, 14, 4);
    }
  }

  for (const r of map.ropes) drawRope(ctx, r);
  for (const p of map.platforms) drawPlatform(ctx, p, th);
}

function drawPlatform(ctx, p, th) {
  const h = 22;
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.fillRect(p.x + 6, p.y + h, p.w - 12, 6);
  ctx.fillStyle = th.plat;
  roundRect(ctx, p.x, p.y, p.w, h, 5);
  ctx.fill();
  ctx.fillStyle = th.platTop;
  roundRect(ctx, p.x - 3, p.y - 2, p.w + 6, 9, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.15)';
  if (th.stone) {
    for (let x = p.x + 30; x < p.x + p.w - 10; x += 40) ctx.fillRect(x, p.y + 7, 2, h - 7);
  } else {
    for (let x = p.x + 14; x < p.x + p.w - 10; x += 26) ctx.fillRect(x, p.y + 12, 8, 3);
  }
}

function drawRope(ctx, r) {
  ctx.strokeStyle = '#a07a48';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(r.x, r.top);
  ctx.lineTo(r.x, r.bottom);
  ctx.stroke();
  ctx.fillStyle = '#7a5a32';
  for (let y = r.top + 10; y < r.bottom; y += 18) ctx.fillRect(r.x - 4, y, 8, 4);
}

function drawPortal(ctx, p, map, t, open) {
  const y = (p.y ?? map.ground) - 36;
  ctx.save();
  ctx.translate(p.x, y);
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
  glow.addColorStop(0, open ? 'rgba(170,220,255,.8)' : 'rgba(120,120,120,.5)');
  glow.addColorStop(1, 'rgba(120,180,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 46, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = open ? `rgba(${200 - i * 30},${235 - i * 10},255,.85)` : 'rgba(160,160,160,.6)';
    ctx.beginPath();
    const a = t * (2 + i) + i * 2;
    ctx.ellipse(0, 0, 14 + i * 7, 30 + i * 5, 0, a, a + Math.PI * 1.2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDecor(ctx, d, map, th, t) {
  const gy = map.ground;
  ctx.save();
  ctx.globalAlpha = .9;
  switch (d.type) {
    case 'house': {
      const w = 170, h = 90;
      ctx.fillStyle = '#e9dcc4'; ctx.fillRect(d.x - w / 2, gy - h, w, h);
      ctx.fillStyle = '#6b4a30'; ctx.fillRect(d.x - w / 2, gy - h, 8, h); ctx.fillRect(d.x + w / 2 - 8, gy - h, 8, h);
      ctx.fillStyle = '#5a3a26'; ctx.fillRect(d.x - 18, gy - 56, 36, 56);
      ctx.fillStyle = '#3b3a44';
      ctx.beginPath(); ctx.moveTo(d.x - w / 2 - 26, gy - h + 4); ctx.quadraticCurveTo(d.x, gy - h - 60, d.x + w / 2 + 26, gy - h + 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4c4b56';
      for (let x = d.x - w / 2 - 14; x < d.x + w / 2 + 14; x += 14) ctx.fillRect(x, gy - h - 6, 6, 10);
      break;
    }
    case 'peach': case 'tree': {
      ctx.fillStyle = '#5a3a24'; ctx.fillRect(d.x - 7, gy - 110, 14, 110);
      const c = d.type === 'peach' ? ['#f2a6b8', '#f7c4cf'] : ['#4f8a4a', '#6aa35a'];
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = c[i % 2];
        ctx.beginPath(); ctx.arc(d.x + Math.cos(i * 1.3) * 34, gy - 130 + Math.sin(i * 1.9) * 20, 34, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'lantern': {
      ctx.fillStyle = '#4a3322'; ctx.fillRect(d.x - 3, gy - 120, 6, 120);
      ctx.fillStyle = '#d2432a';
      ctx.beginPath(); ctx.ellipse(d.x, gy - 124, 16, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,200,120,.35)';
      ctx.beginPath(); ctx.arc(d.x, gy - 124, 30 + Math.sin(t * 3 + d.v * 9) * 3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'fence': {
      ctx.fillStyle = '#8a6a44';
      for (let i = 0; i < 6; i++) ctx.fillRect(d.x + i * 22, gy - 44, 6, 44);
      ctx.fillRect(d.x - 4, gy - 36, 130, 5); ctx.fillRect(d.x - 4, gy - 18, 130, 5);
      break;
    }
    case 'tent': {
      ctx.fillStyle = map.theme === 'camp' ? '#b89a5a' : '#dcd2bc';
      ctx.beginPath(); ctx.moveTo(d.x - 80, gy); ctx.lineTo(d.x, gy - 110); ctx.lineTo(d.x + 80, gy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath(); ctx.moveTo(d.x - 16, gy); ctx.lineTo(d.x, gy - 60); ctx.lineTo(d.x + 16, gy); ctx.closePath(); ctx.fill();
      break;
    }
    case 'banner': case 'flag': {
      const chars = map.theme === 'camp' ? ['黃', '天', '太', '平'] : map.theme === 'wall' ? ['董', '西', '涼'] : ['曹', '袁', '孫', '劉', '公'];
      const colors = map.theme === 'camp' ? ['#d9b23a'] : map.theme === 'wall' ? ['#7a2a24', '#3b3b4a'] : ['#3f5f9a', '#8a2a2a', '#b8412c', '#3f7a4f', '#6a5a8a'];
      const i = Math.floor(d.v * chars.length);
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(d.x - 3, gy - 170, 6, 170);
      const wave = Math.sin(t * 2 + d.v * 10) * 4;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath(); ctx.moveTo(d.x + 3, gy - 168); ctx.lineTo(d.x + 60, gy - 166 + wave); ctx.lineTo(d.x + 58, gy - 96 + wave); ctx.lineTo(d.x + 3, gy - 98); ctx.closePath(); ctx.fill();
      ctx.fillStyle = map.theme === 'camp' ? '#5a3a10' : '#f2e6cc';
      ctx.font = "30px 'Song Myung', serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(chars[i], d.x + 31, gy - 132 + wave / 2);
      break;
    }
    case 'pillar': {
      ctx.fillStyle = map.theme === 'hulao' ? '#5a2a20' : '#4a3a58';
      ctx.fillRect(d.x - 16, gy - 200, 32, 200);
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(d.x - 16, gy - 200, 8, 200);
      ctx.fillStyle = map.theme === 'hulao' ? '#7a3a2a' : '#5c4a6c'; ctx.fillRect(d.x - 24, gy - 210, 48, 14);
      break;
    }
    case 'brazier': {
      ctx.fillStyle = '#3a2e2a'; ctx.fillRect(d.x - 5, gy - 70, 10, 70);
      ctx.fillStyle = '#5a4a3a'; ctx.fillRect(d.x - 22, gy - 78, 44, 12);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = ['#ffcf5a', '#ff8a3a', '#d2432a'][i];
        const f = Math.sin(t * 9 + i * 2 + d.v * 6) * 4;
        ctx.beginPath(); ctx.moveTo(d.x - 16 + i * 4, gy - 78); ctx.quadraticCurveTo(d.x + f, gy - 118 + i * 10, d.x + 16 - i * 4, gy - 78); ctx.fill();
      }
      break;
    }
    case 'tower': {
      ctx.fillStyle = '#5a5250'; ctx.fillRect(d.x - 60, gy - 180, 120, 180);
      ctx.fillStyle = '#4a4442';
      for (let x = d.x - 60; x < d.x + 60; x += 24) ctx.fillRect(x, gy - 196, 14, 16);
      ctx.fillStyle = '#2a2624'; ctx.fillRect(d.x - 12, gy - 130, 24, 34);
      break;
    }
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ── 인물 ───────────────────────────────────────────────
// 머리가 큰 2등신 인물. o: { f, t, walk, air, climb, atk(0~1 또는 -1), robe, trim, skin, hat, beard, weapon, scale, pants }
function drawHuman(ctx, x, y, o) {
  const s = o.scale || 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * (o.f || 1), s);
  const t = o.t || 0;
  const swing = o.walk ? Math.sin(t * 13) : 0;

  if (o.climb) {
    drawClimber(ctx, o, t);
    ctx.restore();
    return;
  }

  // 다리
  ctx.fillStyle = o.pants || '#3a2e28';
  const legA = o.air ? -4 : swing * 5, legB = o.air ? 5 : -swing * 5;
  ctx.fillRect(-8 + legA, -14, 7, 14);
  ctx.fillRect(1 + legB, -14, 7, 14);
  ctx.fillStyle = '#231a16';
  ctx.fillRect(-9 + legA, -3, 9, 3);
  ctx.fillRect(0 + legB, -3, 9, 3);

  // 뒤쪽 팔
  ctx.fillStyle = shade(o.robe, -20);
  ctx.save();
  ctx.translate(-6, -30);
  ctx.rotate(-swing * .5);
  ctx.fillRect(-3, 0, 6, 14);
  ctx.restore();

  // 몸통(도포)
  ctx.fillStyle = o.robe;
  ctx.beginPath();
  ctx.moveTo(-10, -34); ctx.lineTo(10, -34); ctx.lineTo(14, -10); ctx.lineTo(-14, -10);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = o.trim || shade(o.robe, 30);
  ctx.fillRect(-2, -34, 4, 24);
  ctx.fillStyle = '#2a1c14';
  ctx.fillRect(-12, -20, 24, 3);
  if (o.armor) {
    ctx.fillStyle = o.armor;
    ctx.fillRect(-10, -33, 20, 11);
    ctx.fillStyle = 'rgba(0,0,0,.2)';
    for (let i = -8; i < 10; i += 5) ctx.fillRect(i, -32, 1, 10);
  }

  // 머리
  ctx.fillStyle = o.skin || '#f0cfa8';
  ctx.beginPath();
  ctx.arc(0, -48, 15, 0, Math.PI * 2);
  ctx.fill();
  drawHair(ctx, o);
  // 눈
  ctx.fillStyle = '#1a1210';
  ctx.fillRect(4, -50, 3, 5);
  ctx.fillRect(-3, -50, 3, 5);
  if (o.brow) { ctx.fillRect(2, -54, 7, 2); ctx.fillRect(-5, -54, 5, 2); }
  if (o.beard) {
    ctx.fillStyle = o.beard;
    ctx.beginPath();
    ctx.moveTo(-6, -40); ctx.quadraticCurveTo(2, o.longBeard ? -14 : -30, 10, -40);
    ctx.closePath(); ctx.fill();
  }

  // 앞쪽 팔과 무기
  let ang = swing * .5;
  if (o.atk >= 0) {
    const p = o.atk;
    if (o.weapon === 'bow') ang = -1.45;
    else if (o.weapon === 'fan' || o.weapon === 'staff') ang = -2.2 + p * 2.4;
    else ang = -2.6 + easeOut(p) * 3.6;
  } else if (o.weapon === 'bow') ang = -.3;
  ctx.save();
  ctx.translate(5, -31);
  ctx.rotate(ang);
  ctx.fillStyle = o.robe;
  ctx.fillRect(-3, 0, 6, 13);
  ctx.fillStyle = o.skin || '#f0cfa8';
  ctx.fillRect(-3, 12, 6, 4);
  ctx.translate(0, 15);
  drawWeapon(ctx, o);
  ctx.restore();

  ctx.restore();
}

function drawClimber(ctx, o, t) {
  const c = Math.sin(t * 10) * (o.climbMove ? 4 : 0);
  ctx.fillStyle = o.pants || '#3a2e28';
  ctx.fillRect(-8, -14 + c, 7, 14);
  ctx.fillRect(1, -14 - c, 7, 14);
  ctx.fillStyle = o.robe;
  ctx.fillRect(-11, -34, 22, 24);
  ctx.fillRect(-12, -52 - c, 6, 20);
  ctx.fillRect(6, -52 + c, 6, 20);
  ctx.fillStyle = o.skin || '#f0cfa8';
  ctx.beginPath(); ctx.arc(0, -48, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = o.hairColor || '#1e1612';
  ctx.beginPath(); ctx.arc(0, -49, 15, 0, Math.PI * 2); ctx.fill();
  drawHair(ctx, { ...o, back: true });
}

function drawHair(ctx, o) {
  const hc = o.hairColor || '#1e1612';
  ctx.fillStyle = hc;
  if (!o.back) {
    ctx.beginPath();
    ctx.arc(0, -50, 15, Math.PI * .95, Math.PI * 2.05);
    ctx.fill();
    ctx.fillRect(-15, -52, 8, 12);
  }
  switch (o.hat) {
    case 'topknot':
      ctx.beginPath(); ctx.arc(-2, -66, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = o.hatColor || '#2f5a3a'; ctx.fillRect(-7, -64, 10, 3);
      break;
    case 'green':
      ctx.fillStyle = o.hatColor || '#2f6a40';
      ctx.beginPath(); ctx.arc(0, -54, 15, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillRect(-16, -56, 32, 5);
      break;
    case 'band':
      ctx.fillStyle = '#e2b43a';
      ctx.fillRect(-15, -58, 30, 6);
      ctx.fillRect(-18, -58, 6, 14);
      break;
    case 'hood':
      ctx.fillStyle = o.hatColor || '#c9a23a';
      ctx.beginPath(); ctx.arc(0, -52, 17, Math.PI * .85, Math.PI * 2.15); ctx.fill();
      ctx.fillRect(-17, -54, 8, 20);
      break;
    case 'lun': // 윤건
      ctx.fillStyle = '#3a4a6a';
      ctx.fillRect(-11, -76, 22, 16);
      ctx.fillStyle = '#2a3650';
      ctx.fillRect(-13, -62, 26, 5);
      ctx.fillRect(-16, -62, 5, 16);
      break;
    case 'helmet':
      ctx.fillStyle = o.hatColor || '#4a4a52';
      ctx.beginPath(); ctx.arc(0, -52, 17, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillRect(-17, -54, 34, 6);
      ctx.fillStyle = '#c2352a'; ctx.fillRect(-2, -76, 4, 8);
      break;
    case 'feathers': // 여포의 꿩 깃털 관
      ctx.fillStyle = '#b8903a';
      ctx.beginPath(); ctx.arc(0, -54, 16, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillRect(-16, -56, 32, 6);
      ctx.strokeStyle = '#d8b25a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-4, -66); ctx.bezierCurveTo(-20, -110, -60, -120, -70, -96); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4, -66); ctx.bezierCurveTo(10, -120, -30, -140, -50, -128); ctx.stroke();
      ctx.strokeStyle = '#6a3a1a'; ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-20 - i * 10, -104 - i * 3); ctx.lineTo(-18 - i * 10, -98 - i * 3); ctx.stroke(); }
      break;
    case 'elder':
      ctx.fillStyle = '#e8e2d6';
      ctx.beginPath(); ctx.arc(0, -64, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(-15, -52, 7, 12);
      break;
    case 'daoist':
      ctx.fillStyle = '#e2b43a';
      ctx.beginPath(); ctx.moveTo(-14, -60); ctx.lineTo(0, -84); ctx.lineTo(14, -60); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8a2a1a'; ctx.fillRect(-15, -62, 30, 5);
      break;
    case 'cap':
      ctx.fillStyle = o.hatColor || '#3a2a20';
      ctx.fillRect(-14, -64, 28, 8);
      break;
  }
}

function drawWeapon(ctx, o) {
  switch (o.weapon) {
    case 'glaive': // 청룡언월도
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-2, -30, 4, 80);
      ctx.fillStyle = '#d8e4e0';
      ctx.beginPath(); ctx.moveTo(-2, 48); ctx.quadraticCurveTo(22, 58, 12, 86); ctx.quadraticCurveTo(6, 66, -2, 62); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3f8a5a'; ctx.fillRect(-4, 44, 8, 6);
      break;
    case 'halberd': // 방천화극
      ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-2, -30, 4, 86);
      ctx.fillStyle = '#e4e4ea';
      ctx.beginPath(); ctx.moveTo(0, 54); ctx.lineTo(4, 88); ctx.lineTo(-4, 88); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(2, 60); ctx.quadraticCurveTo(22, 62, 18, 80); ctx.quadraticCurveTo(12, 68, 2, 70); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-2, 60); ctx.quadraticCurveTo(-22, 62, -18, 80); ctx.quadraticCurveTo(-12, 68, -2, 70); ctx.fill();
      ctx.fillStyle = '#c2352a'; ctx.fillRect(-4, 50, 8, 5);
      break;
    case 'spear':
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-2, -26, 4, 70);
      ctx.fillStyle = '#d8dcdc';
      ctx.beginPath(); ctx.moveTo(-5, 44); ctx.lineTo(0, 62); ctx.lineTo(5, 44); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c2352a'; ctx.fillRect(-4, 40, 8, 4);
      break;
    case 'bow':
      ctx.rotate(Math.PI / 2);
      ctx.strokeStyle = '#6a3a1a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 20, -Math.PI * .45, Math.PI * .45); ctx.stroke();
      ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Math.cos(-Math.PI * .45) * 20, Math.sin(-Math.PI * .45) * 20);
      ctx.lineTo(o.atk >= 0 ? -8 : 0, 0);
      ctx.lineTo(Math.cos(Math.PI * .45) * 20, Math.sin(Math.PI * .45) * 20); ctx.stroke();
      break;
    case 'fan': // 우선(깃털 부채)
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-1.5, 0, 3, 10);
      ctx.fillStyle = '#f4f1ea';
      ctx.beginPath(); ctx.moveTo(0, 8); ctx.quadraticCurveTo(-16, 28, 0, 36); ctx.quadraticCurveTo(16, 28, 0, 8); ctx.fill();
      ctx.strokeStyle = '#c9c2b2'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, 34); ctx.stroke();
      break;
    case 'staff':
      ctx.fillStyle = '#7a5a2a'; ctx.fillRect(-2, -20, 4, 64);
      ctx.strokeStyle = '#e2b43a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 48, 7, 0, Math.PI * 2); ctx.stroke();
      break;
    case 'club':
      ctx.fillStyle = '#7a5230';
      ctx.beginPath(); ctx.moveTo(-3, -4); ctx.lineTo(3, -4); ctx.lineTo(7, 30); ctx.lineTo(-7, 30); ctx.closePath(); ctx.fill();
      break;
    case 'sword':
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-2, -2, 4, 8);
      ctx.fillStyle = '#dfe4e8'; ctx.fillRect(-2, 6, 4, 30);
      break;
    case 'hammer':
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-2, 0, 4, 24);
      ctx.fillStyle = '#555'; ctx.fillRect(-8, 20, 16, 9);
      break;
  }
}

const easeOut = p => 1 - Math.pow(1 - p, 3);
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = v => Math.max(0, Math.min(255, v + amt));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

// 직업·NPC·몬스터별 모습
const LOOKS = {
  guanyu:     { robe: '#3f7a4f', trim: '#c9a44a', skin: '#c9573a', hat: 'green', hatColor: '#2f5a3a', beard: '#1a1210', longBeard: true, weapon: 'glaive', brow: true },
  huangzhong: { robe: '#8a5a2b', trim: '#e0c07a', hat: 'topknot', hatColor: '#6a3a1a', hairColor: '#e8e2d6', beard: '#efeae0', longBeard: true, weapon: 'bow', armor: '#6a4a2a' },
  zhugeliang: { robe: '#eef0f2', trim: '#4b6aa0', hat: 'lun', weapon: 'fan', beard: '#1a1210', pants: '#4a5a7a' },
  elder:      { robe: '#8a7a5a', hat: 'elder', hairColor: '#e8e2d6', beard: '#efeae0', longBeard: true, weapon: 'staff' },
  merchant:   { robe: '#a4553a', trim: '#e0b060', hat: 'cap', weapon: null },
  smith:      { robe: '#5a4a3a', skin: '#d8a880', hat: 'band2', weapon: 'hammer', brow: true },
  herald:     { robe: '#3f5f9a', armor: '#6a6a78', hat: 'helmet', hatColor: '#5a5a66', weapon: 'spear' },
  jolgae:     { robe: '#8a6a3a', hat: 'band', weapon: 'club', scale: .8 },
  dosa:       { robe: '#d4aa3a', trim: '#8a2a1a', hat: 'hood', hatColor: '#c9a23a', weapon: 'staff', beard: '#3a2a1a' },
  yeoksa:     { robe: '#d8a880', skin: '#d8a880', pants: '#8a6a3a', hat: 'band', weapon: 'club', scale: 1.3, brow: true },
  dzfoot:     { robe: '#6a2a24', armor: '#3a3a44', hat: 'helmet', hatColor: '#3a3a44', weapon: 'spear' },
  dzarcher:   { robe: '#6a2a24', armor: '#5a4a3a', hat: 'helmet', hatColor: '#4a3a30', weapon: 'bow' },
  xlcav:      { robe: '#5a4a6a', armor: '#3a3a44', hat: 'helmet', hatColor: '#3a3a44', weapon: 'spear', horse: '#6a4a3a' },
  jangjiao:   { robe: '#d8b23a', trim: '#8a2a1a', hat: 'daoist', weapon: 'staff', beard: '#2a1a10', longBeard: true, scale: 1.9 },
  lubu:       { robe: '#8a1f1a', trim: '#d8b25a', armor: '#b8903a', hat: 'feathers', weapon: 'halberd', scale: 1.75, brow: true },
};

function drawHorse(ctx, x, y, f, t, color, moving) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(f, 1);
  const g = moving ? Math.sin(t * 14) * 6 : 0;
  ctx.fillStyle = shade(color, -20);
  ctx.fillRect(-30 + g, -26, 7, 26); ctx.fillRect(18 - g, -26, 7, 26);
  ctx.fillStyle = color;
  ctx.fillRect(-24 - g, -26, 7, 26); ctx.fillRect(24 + g, -26, 7, 26);
  roundRect(ctx, -36, -52, 72, 30, 12); ctx.fill();
  ctx.beginPath(); ctx.moveTo(24, -50); ctx.lineTo(44, -78); ctx.lineTo(56, -72); ctx.lineTo(38, -40); ctx.closePath(); ctx.fill();
  ctx.fillRect(40, -80, 22, 12);
  ctx.fillStyle = '#1a1210'; ctx.fillRect(50, -78, 3, 3);
  ctx.fillStyle = shade(color, -40);
  ctx.beginPath(); ctx.moveTo(-36, -48); ctx.quadraticCurveTo(-54, -36, -48, -14); ctx.lineTo(-40, -40); ctx.fill();
  ctx.fillRect(28, -76, 10, 30);
  ctx.restore();
}

function drawBoar(ctx, x, y, f, t, moving) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(f, 1);
  const g = moving ? Math.sin(t * 16) * 4 : 0;
  ctx.fillStyle = '#4a3020';
  ctx.fillRect(-20 + g, -12, 7, 12); ctx.fillRect(12 - g, -12, 7, 12);
  ctx.fillStyle = '#6a4a30';
  ctx.beginPath(); ctx.ellipse(0, -22, 28, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5a3a24';
  ctx.beginPath(); ctx.moveTo(-20, -36); for (let i = 0; i < 6; i++) ctx.lineTo(-16 + i * 6, -40 + (i % 2) * 5); ctx.lineTo(14, -34); ctx.fill();
  ctx.fillStyle = '#6a4a30';
  ctx.beginPath(); ctx.ellipse(26, -20, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c99a7a'; ctx.fillRect(34, -22, 6, 7);
  ctx.fillStyle = '#f4efe2';
  ctx.beginPath(); ctx.moveTo(30, -14); ctx.lineTo(38, -26); ctx.lineTo(33, -14); ctx.fill();
  ctx.fillStyle = '#1a1210'; ctx.fillRect(26, -26, 3, 3);
  ctx.restore();
}

// ── 개체 그리기 ────────────────────────────────────────
function drawPlayer(ctx, P, t) {
  const blink = P.invuln > 0 && Math.floor(t * 20) % 2 === 0;
  if (blink) ctx.globalAlpha = .45;
  const look = LOOKS[P.cls];
  const atk = P.attackTimer > 0 ? 1 - P.attackTimer / P.attackDur : -1;
  if (P.buffTimer > 0) {
    ctx.fillStyle = `rgba(255,190,90,${.18 + .08 * Math.sin(t * 8)})`;
    ctx.beginPath(); ctx.ellipse(P.x, P.y - 34, 30, 44, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (P.shield > 0) {
    ctx.strokeStyle = 'rgba(140,190,255,.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(P.x, P.y - 34, 32, 44, 0, 0, Math.PI * 2); ctx.stroke();
  }
  drawHuman(ctx, P.x, P.y, { ...look, f: P.facing, t, walk: P.onGround && Math.abs(P.vx) > 10 && P.attackTimer <= 0, air: !P.onGround && !P.climbing, climb: P.climbing, climbMove: P.climbing && Math.abs(P.vy) > 1, atk });
  ctx.globalAlpha = 1;
  nameTag(ctx, P.x, P.y + 6, CLASSES[P.cls].name, '#fff2c8');
}

function drawNpc(ctx, n, t, quest) {
  const look = LOOKS[NPCS[n.id].look];
  const o = { ...look, f: n.facing || 1, t, atk: -1 };
  if (look.hat === 'band2') { o.hat = 'cap'; o.hatColor = '#8a3a2a'; }
  drawHuman(ctx, n.x, n.y + Math.sin(t * 2 + n.x) * .5, o);
  nameTag(ctx, n.x, n.y + 6, NPCS[n.id].name, '#e8f0ff');
  if (quest) {
    const bob = Math.sin(t * 4) * 3;
    ctx.font = "30px 'Black Han Sans', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#3a2410';
    ctx.strokeText(quest, n.x, n.y - 78 + bob);
    ctx.fillStyle = quest === '?' ? '#7fe07a' : '#ffd23a';
    ctx.fillText(quest, n.x, n.y - 78 + bob);
  }
}

function drawMonster(ctx, m, t) {
  const def = MONSTERS[m.type];
  const look = LOOKS[def.look];
  const moving = Math.abs(m.vx) > 5;
  const shake = m.hurtTimer > 0 ? Math.sin(t * 80) * 3 : 0;
  const x = m.x + shake;
  if (m.dying > 0) ctx.globalAlpha = Math.max(0, m.dying / .5);
  if (m.flash > 0) ctx.globalAlpha *= .6;
  if (def.look === 'boar') {
    drawBoar(ctx, x, m.y, m.facing, t, moving);
  } else if (look.horse) {
    drawHorse(ctx, x, m.y, m.facing, t, look.horse, moving);
    drawHuman(ctx, x - m.facing * 4, m.y - 40, { ...look, f: m.facing, t, atk: m.atkAnim > 0 ? 1 - m.atkAnim / .4 : -1 });
  } else {
    const atk = m.atkAnim > 0 ? 1 - m.atkAnim / (m.atkDur || .4) : -1;
    drawHuman(ctx, x, m.y, { ...look, f: m.facing, t, walk: moving, atk, air: m.air });
  }
  ctx.globalAlpha = 1;
  if (!def.boss && m.hp < m.maxHp && m.dying <= 0) {
    const w = Math.max(40, def.w);
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    ctx.fillRect(m.x - w / 2, m.y - def.h - 16, w, 6);
    ctx.fillStyle = '#e04a3a';
    ctx.fillRect(m.x - w / 2 + 1, m.y - def.h - 15, (w - 2) * m.hp / m.maxHp, 4);
  }
  if (!def.boss && m.dying <= 0) nameTag(ctx, m.x, m.y + 6, `Lv.${def.lv} ${def.name}`, '#fff', .75);
}

function nameTag(ctx, x, y, text, color, scale = 1) {
  ctx.font = `${Math.round(13 * scale)}px 'Gowun Batang', serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const w = ctx.measureText(text).width + 12;
  ctx.fillStyle = 'rgba(10,8,6,.65)';
  roundRect(ctx, x - w / 2, y, w, 18 * scale, 4);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillText(text, x, y + 2 * scale);
}

// ── 투사체·효과 ────────────────────────────────────────
function drawProjectile(ctx, p, t) {
  ctx.save();
  ctx.translate(p.x, p.y);
  const dir = Math.sign(p.vx) || 1;
  switch (p.kind) {
    case 'arrow': case 'earrow': case 'bigarrow': {
      const big = p.kind === 'bigarrow';
      ctx.scale(dir, 1);
      if (big) { ctx.fillStyle = 'rgba(255,220,120,.35)'; ctx.fillRect(-60, -6, 70, 12); }
      ctx.fillStyle = p.kind === 'earrow' ? '#3a2a1a' : '#6a4a2a';
      ctx.fillRect(-22, -1.5, 30, 3);
      ctx.fillStyle = '#dfe4e8';
      ctx.beginPath(); ctx.moveTo(8, -5); ctx.lineTo(16, 0); ctx.lineTo(8, 5); ctx.fill();
      ctx.fillStyle = p.kind === 'earrow' ? '#8a2a1a' : '#e8e0d0';
      ctx.fillRect(-24, -4, 6, 3); ctx.fillRect(-24, 1, 6, 3);
      break;
    }
    case 'wind': {
      ctx.strokeStyle = 'rgba(200,240,255,.9)'; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.arc(-dir * i * 8, 0, 10 - i * 2, t * 20 + i, t * 20 + i + 4); ctx.stroke();
      }
      break;
    }
    case 'orb': {
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
      g.addColorStop(0, '#fff6c0'); g.addColorStop(.5, '#e2b43a'); g.addColorStop(1, 'rgba(200,120,30,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'bolt': {
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
      g.addColorStop(0, '#ffffff'); g.addColorStop(.5, '#b89aff'); g.addColorStop(1, 'rgba(120,80,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'wave': {
      ctx.fillStyle = 'rgba(255,160,90,.75)';
      ctx.beginPath(); ctx.moveTo(-16, 0); ctx.quadraticCurveTo(0, -46 - Math.sin(t * 30) * 4, 16, 0); ctx.fill();
      ctx.fillStyle = 'rgba(255,230,180,.8)';
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(0, -26, 8, 0); ctx.fill();
      break;
    }
  }
  ctx.restore();
}

function drawEffect(ctx, e) {
  const p = 1 - e.life / e.max;
  ctx.save();
  switch (e.type) {
    case 'slash': {
      ctx.translate(e.x, e.y);
      ctx.scale(e.f, 1);
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = e.color || '#d8ffe0';
      ctx.lineWidth = 10 * (1 - p) + 2;
      ctx.beginPath();
      ctx.arc(0, 0, e.r, -1.3 + p * .6, .9 + p * .6);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, e.r - 6, -1.2 + p * .6, .8 + p * .6); ctx.stroke();
      break;
    }
    case 'spin': {
      ctx.translate(e.x, e.y);
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = '#b8ffcc'; ctx.lineWidth = 8;
      const a = p * Math.PI * 4;
      ctx.beginPath(); ctx.ellipse(0, 0, e.r, e.r * .45, 0, a, a + 4); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, e.r * .8, e.r * .35, 0, a + 1, a + 4.5); ctx.stroke();
      break;
    }
    case 'pillar': {
      ctx.globalAlpha = p < .2 ? p * 5 : 1 - (p - .2) / .8;
      const g = ctx.createLinearGradient(0, e.y - e.h, 0, e.y);
      g.addColorStop(0, 'rgba(255,90,30,0)'); g.addColorStop(.4, 'rgba(255,120,40,.8)'); g.addColorStop(1, 'rgba(255,230,120,.95)');
      ctx.fillStyle = g;
      for (let i = 0; i < 5; i++) {
        const fx = e.x - e.w / 2 + (i + .5) * e.w / 5;
        ctx.beginPath();
        ctx.moveTo(fx - 22, e.y);
        ctx.quadraticCurveTo(fx + Math.sin(p * 20 + i) * 12, e.y - e.h * (0.6 + (i % 2) * .4), fx + 22, e.y);
        ctx.fill();
      }
      break;
    }
    case 'bolt': {
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = '#e8e0ff'; ctx.lineWidth = 4;
      ctx.shadowColor = '#9a7aff'; ctx.shadowBlur = 14;
      ctx.beginPath();
      let x = e.x, y = e.y - 420;
      ctx.moveTo(x, y);
      const r = seeded(e.seed);
      while (y < e.y) { y += 30; x = e.x + (r() - .5) * 36; ctx.lineTo(x, Math.min(y, e.y)); }
      ctx.stroke();
      break;
    }
    case 'rain': {
      ctx.globalAlpha = 1 - p * .6;
      ctx.strokeStyle = '#e8d8b0'; ctx.lineWidth = 2;
      const r = seeded(e.seed);
      for (let i = 0; i < 26; i++) {
        const ax = e.x - e.w / 2 + r() * e.w, off = r();
        const ay = e.y - 300 + ((p * 1.6 + off) % 1) * 300;
        ctx.beginPath(); ctx.moveTo(ax - 6, ay - 26); ctx.lineTo(ax, ay); ctx.stroke();
      }
      break;
    }
    case 'hit': {
      ctx.translate(e.x, e.y);
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = e.color || '#fff4c0';
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2 + e.seed;
        const d = 6 + p * 22;
        ctx.fillRect(Math.cos(a) * d - 2, Math.sin(a) * d - 2, 4, 4);
      }
      break;
    }
    case 'levelup': {
      ctx.globalAlpha = 1 - p;
      const g = ctx.createLinearGradient(0, e.y - 260, 0, e.y);
      g.addColorStop(0, 'rgba(255,230,120,0)'); g.addColorStop(1, 'rgba(255,220,120,.6)');
      ctx.fillStyle = g;
      ctx.fillRect(e.x - 34, e.y - 260, 68, 260);
      ctx.font = "34px 'Black Han Sans', sans-serif";
      ctx.textAlign = 'center';
      ctx.lineWidth = 6; ctx.strokeStyle = '#5a2a0a';
      ctx.strokeText('LEVEL UP!', e.x, e.y - 120 - p * 40);
      ctx.fillStyle = '#ffe07a';
      ctx.fillText('LEVEL UP!', e.x, e.y - 120 - p * 40);
      break;
    }
    case 'blink': {
      ctx.globalAlpha = (1 - p) * .6;
      ctx.fillStyle = '#b8d8ff';
      ctx.beginPath(); ctx.ellipse(e.x, e.y - 34, 18, 36, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'warn': {
      const a = .2 + .25 * Math.abs(Math.sin(e.life * 14));
      ctx.fillStyle = `rgba(255,60,40,${a})`;
      ctx.fillRect(e.x - e.w / 2, e.y - e.h, e.w, e.h);
      ctx.strokeStyle = 'rgba(255,90,60,.8)'; ctx.lineWidth = 2;
      ctx.strokeRect(e.x - e.w / 2, e.y - e.h, e.w, e.h);
      break;
    }
    case 'dust': {
      ctx.globalAlpha = (1 - p) * .7;
      ctx.fillStyle = '#d8c8a8';
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath(); ctx.arc(e.x + i * 20 * (1 + p), e.y - 6 - Math.abs(i) * 2, 10 * (1 - p) + 3, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'text': {
      ctx.globalAlpha = 1 - p;
      ctx.font = "20px 'Black Han Sans', sans-serif";
      ctx.textAlign = 'center';
      ctx.lineWidth = 4; ctx.strokeStyle = '#1a1210';
      ctx.strokeText(e.text, e.x, e.y - p * 30);
      ctx.fillStyle = e.color || '#fff';
      ctx.fillText(e.text, e.x, e.y - p * 30);
      break;
    }
  }
  ctx.restore();
}

// 메이플식 데미지 숫자
function drawNumber(ctx, n) {
  const p = 1 - n.life / n.max;
  const y = n.y - p * 40;
  ctx.save();
  ctx.globalAlpha = p > .7 ? 1 - (p - .7) / .3 : 1;
  const size = n.crit ? 34 : n.kind === 'taken' ? 26 : 28;
  ctx.font = `${size}px 'Black Han Sans', 'Arial Black', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const text = n.kind === 'heal' ? `+${n.v}` : n.kind === 'miss' ? 'MISS' : String(n.v);
  ctx.lineWidth = 5;
  ctx.strokeStyle = n.kind === 'taken' ? '#2a0a3a' : n.kind === 'heal' ? '#0a3a1a' : '#3a1a00';
  ctx.strokeText(text, n.x, y);
  const g = ctx.createLinearGradient(0, y - size, 0, y);
  if (n.kind === 'taken') { g.addColorStop(0, '#f0c8ff'); g.addColorStop(1, '#a04ad8'); }
  else if (n.kind === 'heal') { g.addColorStop(0, '#d8ffd8'); g.addColorStop(1, '#4ac86a'); }
  else if (n.crit) { g.addColorStop(0, '#ffe0e0'); g.addColorStop(1, '#ff3a5a'); }
  else if (n.kind === 'miss') { g.addColorStop(0, '#fff'); g.addColorStop(1, '#aaa'); }
  else { g.addColorStop(0, '#fff6c0'); g.addColorStop(1, '#ff9a1a'); }
  ctx.fillStyle = g;
  ctx.fillText(text, n.x, y);
  ctx.restore();
}

// ── 미니맵 ─────────────────────────────────────────────
function drawMinimap(ctx, G) {
  const map = G.map;
  const mw = 170, scale = mw / map.w, mh = Math.max(40, map.h * scale);
  const x0 = 12, y0 = 12;
  ctx.save();
  ctx.fillStyle = 'rgba(14,11,9,.72)';
  roundRect(ctx, x0 - 6, y0 - 6, mw + 12, mh + 32, 6);
  ctx.fill();
  ctx.fillStyle = '#e8dcc0';
  ctx.font = "13px 'Gowun Batang', serif";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(map.name, x0, y0 - 1);
  const oy = y0 + 22;
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.fillRect(x0, oy, mw, mh);
  ctx.fillStyle = '#8a7a60';
  ctx.fillRect(x0, oy + map.ground * scale, mw, 2);
  for (const p of map.platforms) ctx.fillRect(x0 + p.x * scale, oy + p.y * scale, p.w * scale, 2);
  for (const p of map.portals) {
    ctx.fillStyle = portalOpen(p) ? '#7ac8ff' : '#777';
    ctx.fillRect(x0 + p.x * scale - 2, oy + (p.y ?? map.ground) * scale - 5, 4, 5);
  }
  ctx.fillStyle = '#7ae07a';
  for (const n of G.npcs) ctx.fillRect(x0 + n.x * scale - 2, oy + n.y * scale - 5, 4, 5);
  ctx.fillStyle = '#ff6a5a';
  for (const m of G.monsters) if (m.hp > 0) ctx.fillRect(x0 + m.x * scale - 1.5, oy + m.y * scale - 4, 3, 3);
  ctx.fillStyle = '#ffe04a';
  ctx.beginPath(); ctx.arc(x0 + G.player.x * scale, oy + G.player.y * scale - 3, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
