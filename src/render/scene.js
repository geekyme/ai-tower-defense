import { ctx } from './canvas2d.js';
import { W, H, dpr } from '../core/view.js';
import { S } from '../core/state.js';
import { drawBackground, drawSky, drawFlow, drawPlots, drawSludge } from './board.js';
import { drawFoe, drawTower } from './entities.js';
import { drawFx, drawParts, drawFloats, drawBossBar, drawBanner, drawCheer, drawConfetti } from './fx.js';
import { clock } from './clock.js';

/** Sanity level below which the board starts bleeding red at the edges. */
const PANIC_AT = 0.5;

function drawShots() {
  for (const s of S.shots) {
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = s.c;
    for (let i = 0; i < s.tr.length; i++) {
      ctx.beginPath();
      ctx.arc(s.tr[i].x, s.tr[i].y, s.r * (i / s.tr.length) * 0.95, 0, 6.3);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowColor = s.c;
    ctx.shadowBlur = 10;
    ctx.fillStyle = s.c;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.42, 0, 6.3); ctx.fill();
    ctx.shadowBlur = 0;
  }
}

/** One frame, back to front. `ghost` is the hovered build cell, if any. */
export function render(dt, ghost) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (S.shake > 0) ctx.translate((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake);

  drawBackground();
  drawSky(dt);
  drawSludge();
  drawFlow(dt);
  drawPlots(ghost);

  for (const t of S.towers) drawTower(t);
  for (const f of S.foes) drawFoe(f);
  drawShots();

  drawFx(dt);
  drawParts(dt);
  drawFloats(dt);

  // Screen-space overlays, drawn without the shake offset.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawBossBar();
  drawBanner(dt);
  drawCheer(dt);
  drawConfetti(dt);

  if (S.flashT > 0 && S.flashCol) {
    ctx.globalAlpha = Math.min(0.3, S.flashT * 0.7);
    ctx.fillStyle = S.flashCol;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  const low = 1 - S.sanity / S.max;
  if (low > PANIC_AT) {
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.26, W / 2, H / 2, H * 0.62);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(255,40,60,' + ((low - PANIC_AT) * 0.55 + Math.sin(clock() * 3) * 0.03) + ')');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
}
