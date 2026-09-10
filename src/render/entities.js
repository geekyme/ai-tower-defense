import { ctx, rr, poly } from './canvas2d.js';
import { SHAPE, shapeOf } from './shapes.js';
import { THREATS } from '../data/threats.js';
import { cell } from '../core/view.js';
import { S } from '../core/state.js';
import { stat } from '../engine/towers.js';
import { clock } from './clock.js';

/** Draws one threat: trail, shadow, status rings, artwork, shield, health. */
export function drawFoe(f){
  const D=f.def, s=cell*(D.sz||.4)*(D.boss?1.45:1);
  if(f.tr.length){
    for(let i=0;i<f.tr.length;i++){
      ctx.globalAlpha=.06+i*.03;ctx.fillStyle=D.c;
      ctx.beginPath();ctx.arc(f.tr[i].x,f.tr[i].y,s*.6,0,6.3);ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  ctx.save();
  ctx.translate(f.x,f.y+Math.sin(f.w)*cell*.03);
  ctx.globalAlpha=.38;ctx.fillStyle='#000';
  ctx.beginPath();ctx.ellipse(0,s*.95,s*.72,s*.2,0,0,6.3);ctx.fill();ctx.globalAlpha=1;
  if(f.slowT>0){ctx.strokeStyle='rgba(110,231,160,.55)';ctx.lineWidth=1.6;
    ctx.beginPath();ctx.arc(0,0,s*1.2,0,6.3);ctx.stroke()}
  if(f.stunT>0){ctx.strokeStyle='rgba(255,107,107,.75)';ctx.setLineDash([3,3]);ctx.lineWidth=1.6;
    ctx.beginPath();ctx.arc(0,0,s*1.3,0,6.3);ctx.stroke();ctx.setLineDash([])}
  if(D.aura||D.towerSlow){
    const rad=cell*(D.aura?2.2:3);
    ctx.globalAlpha=.07+Math.sin(clock() * 2)*.02;ctx.fillStyle=D.c;
    ctx.beginPath();ctx.arc(0,0,rad,0,6.3);ctx.fill();ctx.globalAlpha=1;
  }
  ctx.shadowColor=D.c;ctx.shadowBlur=D.boss?24:9;
  const col=f.fl>0?'#ffffff':(f.shown?D.c:THREATS[f.mim].c);
  (SHAPE[shapeOf(f)]||SHAPE.ghost)(s,f,col);
  ctx.shadowBlur=0;
  if(f.shield>0){
    ctx.strokeStyle='rgba(120,190,255,'+(.35+.3*(f.shield/f.shMax))+')';ctx.lineWidth=2.4;
    ctx.beginPath();ctx.arc(0,0,s*1.32,0,6.3);ctx.stroke();
    ctx.strokeStyle='rgba(210,235,255,.55)';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.arc(0,0,s*1.32,-1.4,-1.4+4.6*(f.shield/f.shMax));ctx.stroke();
  }
  ctx.restore();
  if(f.hp<f.max&&!D.boss){
    const w=cell*(D.sz>.5?1.0:.62),h=Math.max(2.6,cell*.075),x=f.x-w/2,y=f.y-s-cell*.26;
    ctx.fillStyle='rgba(2,6,12,.85)';rr(ctx,x,y,w,h,h/2);ctx.fill();
    const p=Math.max(0,f.hp/f.max);
    ctx.fillStyle=p>.5?'#6ee7a0':p>.22?'#ffc24b':'#ff4d5e';
    rr(ctx,x,y,w*p,h,h/2);ctx.fill();
  }
}

/* ===================== tower artwork ===================== */

/** Draws one defence: range ring when selected, chassis, level marks, barrel. */
export function drawTower(t){
  const s=cell*.44, sel=S.sel===t, off=t.stunT>0;
  ctx.save();ctx.translate(t.x,t.y);
  if(sel){
    ctx.fillStyle='rgba(255,255,255,.035)';ctx.strokeStyle=t.def.col;
    ctx.globalAlpha=.5;ctx.lineWidth=1.2;ctx.setLineDash([4,4]);
    ctx.beginPath();ctx.arc(0,0,stat(t,'range'),0,6.3);ctx.fill();ctx.stroke();
    ctx.setLineDash([]);ctx.globalAlpha=1;
  }
  ctx.globalAlpha=.42;ctx.fillStyle='#000';
  ctx.beginPath();ctx.ellipse(0,s*.64,s*.9,s*.26,0,0,6.3);ctx.fill();ctx.globalAlpha=1;
  const g=ctx.createLinearGradient(-s,-s,s,s);
  g.addColorStop(0,'rgba(255,255,255,.18)');g.addColorStop(1,'rgba(255,255,255,.02)');
  poly(ctx,8,s,.3927);ctx.fillStyle='#0c1425';ctx.fill();
  poly(ctx,8,s,.3927);ctx.fillStyle=g;ctx.fill();
  poly(ctx,8,s,.3927);ctx.strokeStyle=t.def.col;ctx.globalAlpha=off?.22:.72;ctx.lineWidth=1.3;ctx.stroke();ctx.globalAlpha=1;
  // cooldown ring
  if(!off){
    const p=1-Math.max(0,Math.min(1,t.cd/stat(t,'rate')));
    ctx.strokeStyle=t.def.col;ctx.globalAlpha=.5;ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(0,0,s*.92,-1.5708,-1.5708+6.283*p);ctx.stroke();ctx.globalAlpha=1;
  }
  for(let i=0;i<t.lv;i++){
    ctx.strokeStyle=t.def.col;ctx.globalAlpha=off?.2:.9;ctx.lineWidth=1.8;
    ctx.beginPath();ctx.arc(0,0,s*(1.1+i*.13),2.3,3.98);ctx.stroke();
  }
  ctx.globalAlpha=1;
  if(off){ctx.rotate(Math.sin(clock() * 30)*.05);ctx.globalAlpha=.4}
  ctx.rotate(t.ang);
  const rec=t.rec>0?t.rec*cell*.11:0;
  ctx.shadowColor=t.def.col;ctx.shadowBlur=off?0:11;
  ctx.fillStyle=off?'#5a6a83':t.def.col;
  const k=t.key;
  if(k==='council'){
    rr(ctx,-s*.34-rec,-s*.13,s*1.62,s*.26,s*.09);ctx.fill();
    rr(ctx,s*.55-rec,-s*.22,s*.3,s*.44,s*.08);ctx.fill();
    ctx.beginPath();ctx.arc(0,0,s*.36,0,6.3);ctx.fill();
    ctx.fillStyle='#160c33';ctx.beginPath();ctx.arc(0,0,s*.15,0,6.3);ctx.fill();
  }else if(k==='observ'){
    ctx.beginPath();ctx.arc(0,0,s*.42,0,6.3);ctx.fill();
    ctx.strokeStyle=off?'#5a6a83':t.def.col;ctx.lineWidth=s*.12;
    ctx.beginPath();ctx.arc(0,0,s*.66,-.9,.9);ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,s*.92,-.7,.7);ctx.stroke();
    ctx.fillStyle='#04211f';ctx.beginPath();ctx.arc(0,0,s*.17,0,6.3);ctx.fill();
  }else if(k==='router'){
    ctx.strokeStyle=off?'#5a6a83':t.def.col;ctx.lineWidth=s*.16;ctx.lineCap='round';
    for(let i=0;i<4;i++){const a=t.spin+i*1.571;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*s*.22,Math.sin(a)*s*.22);
      ctx.lineTo(Math.cos(a)*s*.82,Math.sin(a)*s*.82);ctx.stroke()}
    ctx.beginPath();ctx.arc(0,0,s*.26,0,6.3);ctx.fill();
  }else if(k==='guardrail'){
    ctx.beginPath();ctx.moveTo(s*.1-rec,-s*.62);ctx.lineTo(s*.78-rec,-s*.3);
    ctx.lineTo(s*.78-rec,s*.3);ctx.lineTo(s*.1-rec,s*.62);ctx.closePath();ctx.fill();
    ctx.fillStyle='#07281a';
    ctx.beginPath();ctx.moveTo(s*.22-rec,-s*.36);ctx.lineTo(s*.6-rec,-s*.18);
    ctx.lineTo(s*.6-rec,s*.18);ctx.lineTo(s*.22-rec,s*.36);ctx.closePath();ctx.fill();
    ctx.fillStyle=off?'#5a6a83':t.def.col;rr(ctx,-s*.5,-s*.2,s*.5,s*.4,s*.1);ctx.fill();
  }else if(k==='killswitch'){
    ctx.beginPath();ctx.arc(0,0,s*.5,0,6.3);ctx.fill();
    ctx.fillStyle='#2b0808';ctx.beginPath();ctx.arc(0,0,s*.33,0,6.3);ctx.fill();
    ctx.fillStyle=off?'#5a6a83':'#ffd9d9';rr(ctx,-s*.07,-s*.3,s*.14,s*.34,s*.06);ctx.fill();
    ctx.strokeStyle=off?'#5a6a83':'#ffd9d9';ctx.lineWidth=s*.11;
    ctx.beginPath();ctx.arc(0,s*.02,s*.22,-1.0,4.15);ctx.stroke();
  }else{
    rr(ctx,-s*.3,-s*.3,s*.6,s*.6,s*.14);ctx.fill();
    rr(ctx,s*.12-rec,-s*.12,s*.82,s*.24,s*.09);ctx.fill();
    ctx.fillStyle='#3a2500';rr(ctx,-s*.16,-s*.16,s*.32,s*.32,s*.08);ctx.fill();
  }
  ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
  if(off){
    const lbl=t.kind==='hijack'?'hijacked':t.kind==='sunset'?'sunset':t.kind==='paged'?'paged':'frozen';
    const col=t.kind==='hijack'?'#ff4d7a':t.kind==='sunset'?'#ff7a3c':t.kind==='paged'?'#ff9f43':'#ffd84b';
    ctx.fillStyle=col;ctx.font='600 '+(cell*.24)+'px Sora, sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(lbl,t.x,t.y-cell*.66);
    ctx.strokeStyle=col;ctx.globalAlpha=.5;ctx.lineWidth=1.4;ctx.setLineDash([3,3]);
    ctx.beginPath();ctx.arc(t.x,t.y,cell*.54,0,6.3);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
  }
}

