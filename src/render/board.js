import { ctx, poly } from './canvas2d.js';
import { COLS, ROWS, isLane } from '../core/config.js';
import { cell, W, H, dpr, WP, SEG, exitPoint } from '../core/view.js';
import { S } from '../core/state.js';
import { TOWERS } from '../data/towers.js';
import { towerAt, canBuild } from '../engine/towers.js';
import { clock } from './clock.js';

/**
 * The board itself: a cached background bitmap plus the animated layers that
 * sit on top of it (drifting motes, lane flow, buildable plots, sludge).
 */

let bgCanvas = null;
let motes = [];
let stars = [];
let flow = 0;

/**
 * Repaints the static background to an offscreen canvas. Called on every
 * layout change — never per frame.
 */
export function paintBackground() {
  bgCanvas = document.createElement('canvas');
  bgCanvas.width = Math.round(W * dpr);
  bgCanvas.height = Math.round(H * dpr);
  const b = bgCanvas.getContext('2d');
  b.setTransform(dpr, 0, 0, dpr, 0, 0);
  const g=b.createLinearGradient(0,0,W*.5,H);
  g.addColorStop(0,'#0b1322');g.addColorStop(.45,'#070d1a');g.addColorStop(1,'#04070e');
  b.fillStyle=g;b.fillRect(0,0,W,H);
  const a1=b.createRadialGradient(W*.12,-H*.12,0,W*.12,-H*.12,H*.75);
  a1.addColorStop(0,'rgba(163,121,255,.22)');a1.addColorStop(1,'rgba(163,121,255,0)');
  b.fillStyle=a1;b.fillRect(0,0,W,H);
  const a2=b.createRadialGradient(W*1.08,H*1.06,0,W*1.08,H*1.06,H*.66);
  a2.addColorStop(0,'rgba(53,230,213,.16)');a2.addColorStop(1,'rgba(53,230,213,0)');
  b.fillStyle=a2;b.fillRect(0,0,W,H);

  for(let c=0;c<COLS;c++)for(let r=0;r<ROWS;r++){
    if(isLane(c, r))continue;
    const x=(c+.5)*cell,y=(r+.5)*cell,s=cell*.3;
    b.strokeStyle='rgba(125,165,220,.11)';b.lineWidth=1;
    b.beginPath();
    for(let i=0;i<6;i++){const a=i/6*6.283-1.5708;i?b.lineTo(x+Math.cos(a)*s,y+Math.sin(a)*s):b.moveTo(x+Math.cos(a)*s,y+Math.sin(a)*s)}
    b.closePath();b.stroke();
    b.fillStyle='rgba(125,165,220,.07)';b.beginPath();b.arc(x,y,1.2,0,6.3);b.fill();
  }
  const trace=()=>{b.beginPath();b.moveTo(WP[0].x,WP[0].y);for(let i=1;i<WP.length;i++)b.lineTo(WP[i].x,WP[i].y)};
  b.lineCap='round';b.lineJoin='round';
  trace();b.strokeStyle='#02050c';b.lineWidth=cell*1.0;b.stroke();
  trace();b.strokeStyle='#0e1830';b.lineWidth=cell*.84;b.stroke();
  const pg=b.createLinearGradient(0,0,W,H);
  pg.addColorStop(0,'rgba(163,121,255,.18)');pg.addColorStop(1,'rgba(53,230,213,.18)');
  trace();b.strokeStyle=pg;b.lineWidth=cell*.84;b.stroke();
  trace();b.strokeStyle='rgba(130,205,240,.24)';b.lineWidth=1.2;b.stroke();
  b.save();b.globalAlpha=.2;b.strokeStyle='#3a5d84';b.lineWidth=1;
  for(let i=0;i<WP.length-1;i++){
    const a=WP[i],c2=WP[i+1],L=SEG[i],ux=(c2.x-a.x)/L,uy=(c2.y-a.y)/L;
    for(let d=cell*.4;d<L;d+=cell*.44){
      const x=a.x+ux*d,y=a.y+uy*d,px=-uy*cell*.31,py=ux*cell*.31;
      b.beginPath();b.moveTo(x-px,y-py);b.lineTo(x+px,y+py);b.stroke();
    }
  }
  b.restore();
  const i0=WP[0],o0=WP[WP.length-1];
  b.font='600 '+(cell*.3)+'px Sora, sans-serif';b.textBaseline='middle';
  b.textAlign='left';b.fillStyle='rgba(255,107,107,.8)';b.fillText('inbound',3,i0.y-cell*.66);
  b.textAlign='right';b.fillStyle='rgba(53,230,213,.85)';b.fillText('you',W-3,o0.y-cell*.66);
  const v=b.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.82);
  v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.52)');
  b.fillStyle=v;b.fillRect(0,0,W,H);

  motes = [];
  for (let i = 0; i < 24; i++) {
    motes.push({
      x: Math.random() * W, y: Math.random() * H,
      v: 0.1 + Math.random() * 0.3, r: 0.6 + Math.random() * 1.5,
      a: 0.08 + Math.random() * 0.26,
    });
  }
  stars = [];
  for (let i = 0; i < 34; i++) {
    stars.push({
      x: Math.random() * W, y: Math.random() * H,
      r: 0.4 + Math.random() * 0.9, p: Math.random() * 6.28, s: 0.6 + Math.random() * 1.4,
    });
  }
}

export function drawBackground() {
  if (bgCanvas) ctx.drawImage(bgCanvas, 0, 0, W, H);
}

/** Parallax stars and drifting motes. */
export function drawSky(dt) {
  for (const s of stars) {
    ctx.globalAlpha = 0.12 + Math.sin(clock() * s.s + s.p) * 0.1;
    ctx.fillStyle = '#cfe6ff';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.3); ctx.fill();
  }
  for (const m of motes) {
    m.y -= m.v * cell * dt * 3;
    if (m.y < -4) { m.y = H + 4; m.x = Math.random() * W; }
    ctx.globalAlpha = m.a;
    ctx.fillStyle = '#9fd8ff';
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.3); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Direction-of-travel dashes along the lane, and the glow at the exit. */
export function drawFlow(dt) {
  flow = (flow + dt * cell * 1.9) % (cell * 0.95);
  ctx.save();
  ctx.setLineDash([cell * 0.15, cell * 0.8]);
  ctx.lineDashOffset = -flow;
  ctx.strokeStyle = 'rgba(130,220,240,.42)';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(WP[0].x, WP[0].y);
  for (let i = 1; i < WP.length; i++) ctx.lineTo(WP[i].x, WP[i].y);
  ctx.stroke();
  ctx.restore();

  const o = exitPoint();
  const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, cell * 2.2);
  const pulse = 0.1 + Math.sin(clock() * 2.4) * 0.05;
  g.addColorStop(0, 'rgba(255,60,80,' + pulse + ')');
  g.addColorStop(1, 'rgba(255,60,80,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(o.x, o.y, cell * 2.2, 0, 6.3); ctx.fill();
}

export function drawSludge() {
  for (const s of S.sludge) {
    ctx.globalAlpha = Math.min(1, s.l / 2) * 0.36;
    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
    g.addColorStop(0, 'rgba(122,143,82,.95)');
    g.addColorStop(1, 'rgba(122,143,82,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.3); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

/**
 * How long the plot flare runs after a defence is picked, in seconds, and how
 * far the sweep across the board lags behind itself.
 */
const FLARE_SECS = 1.15;
const FLARE_SWEEP = 0.34;

/**
 * Buildable cells and the placement ghost, shown while a defence is selected.
 *
 * Picking a defence sets off a flare: every plot you can build on brightens
 * and swells in a wave that crosses the board, then settles to a slow breath.
 * A resting glow is easy to miss on a busy board, and a player who cannot see
 * where a defence goes will not place one.
 */
export function drawPlots(ghost) {
  if (!S.build) return;
  const d = TOWERS[S.build];
  // Nothing can be placed without the focus for it, so the plots say so in
  // grey rather than inviting a tap that only earns a refusal.
  const afford = S.focus >= d.cost;
  const tint = afford ? d.col : '#8595b5';
  const now = clock();
  const age = now - S.pickAt;

  ctx.save();
  for (let c = 0; c < COLS; c++) {
    const lead = age - (c / COLS) * FLARE_SWEEP;
    // Eased so the flare snaps on and drains away rather than dimming flatly.
    const flare = lead > 0 && lead < FLARE_SECS
      ? Math.pow(1 - lead / FLARE_SECS, 1.6)
      : 0;
    for (let r = 0; r < ROWS; r++) {
      if (isLane(c, r) || towerAt(c, r)) continue;
      const breath = Math.sin(now * 3 + c + r) * 0.05;
      const size = cell * (0.32 + flare * 0.05);
      ctx.save();
      ctx.translate((c + 0.5) * cell, (r + 0.5) * cell);

      ctx.globalAlpha = (afford ? 0.06 : 0.03) + flare * 0.26;
      ctx.fillStyle = tint;
      poly(ctx, 6, size, -1.5708);
      ctx.fill();

      ctx.globalAlpha = Math.min(1, (afford ? 0.3 : 0.18) + breath + flare * 0.65);
      ctx.strokeStyle = tint;
      ctx.lineWidth = 1 + flare * 1.6;
      poly(ctx, 6, size, -1.5708);
      ctx.stroke();

      // A ring thrown off each plot as the flare passes, so the eye catches
      // the movement even where the board is already bright.
      if (flare > 0.02) {
        ctx.globalAlpha = flare * 0.45;
        ctx.lineWidth = 1;
        poly(ctx, 6, cell * (0.32 + (1 - flare) * 0.46), -1.5708);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  ctx.restore();

  if (!ghost) return;
  const ok = canBuild(ghost.c, ghost.r) && afford;
  const x = (ghost.c + 0.5) * cell;
  const y = (ghost.r + 0.5) * cell;
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = ok ? d.col : '#ff4d5e';
  ctx.beginPath(); ctx.arc(x, y, d.range * cell, 0, 6.3); ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = ok ? d.col : '#ff4d5e';
  ctx.lineWidth = 2;
  ctx.save();
  ctx.translate(x, y);
  poly(ctx, 8, cell * 0.44, 0.3927);
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
}
