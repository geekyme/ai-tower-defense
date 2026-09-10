import { ctx, rr } from './canvas2d.js';
import { cell, W, H } from '../core/view.js';
import { S } from '../core/state.js';

/**
 * Transient visual effects queued by the engine through `engine/effects.js`.
 * Each draw function also ages its records and drops the expired ones.
 */

export function drawFx(dt){
  for(const f of S.fx){
    f.l-=dt;const a=Math.max(0,f.l/f.m);
    ctx.globalAlpha=a;
    if(f.k==='beam'){
      ctx.strokeStyle=f.c;ctx.lineWidth=cell*.15*a+1;ctx.lineCap='round';
      ctx.shadowColor=f.c;ctx.shadowBlur=16;
      ctx.beginPath();ctx.moveTo(f.x1,f.y1);ctx.lineTo(f.x2,f.y2);ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1.6;
      ctx.beginPath();ctx.moveTo(f.x1,f.y1);ctx.lineTo(f.x2,f.y2);ctx.stroke();ctx.shadowBlur=0;
    }else if(f.k==='bolt'){
      ctx.strokeStyle=f.c;ctx.lineWidth=2.2;ctx.shadowColor=f.c;ctx.shadowBlur=11;
      ctx.beginPath();ctx.moveTo(f.x1,f.y1);
      const n=4,dx=(f.x2-f.x1)/n,dy=(f.y2-f.y1)/n;
      for(let i=1;i<n;i++){const j=Math.sin(f.s+i*2.7)*cell*.2;
        ctx.lineTo(f.x1+dx*i-dy/cell*j,f.y1+dy*i+dx/cell*j)}
      ctx.lineTo(f.x2,f.y2);ctx.stroke();ctx.shadowBlur=0;
    }else if(f.k==='shock'){
      ctx.strokeStyle=f.c;ctx.lineWidth=2.8*a+.6;
      ctx.beginPath();ctx.arc(f.x,f.y,f.r*(1.3-a*.75),0,6.3);ctx.stroke();
    }else if(f.k==='implode'){
      ctx.strokeStyle='#fff';ctx.lineWidth=1.6;
      ctx.beginPath();ctx.arc(f.x,f.y,f.r*a,0,6.3);ctx.stroke();
    }else if(f.k==='pulse'){
      ctx.strokeStyle=f.c;ctx.lineWidth=1.8;
      ctx.beginPath();ctx.arc(f.x,f.y,f.r*(1-a),0,6.3);ctx.stroke();
      ctx.globalAlpha=a*.12;ctx.fillStyle=f.c;
      ctx.beginPath();ctx.arc(f.x,f.y,f.r*(1-a),0,6.3);ctx.fill();
    }else if(f.k==='muzzle'){
      ctx.fillStyle=f.c;ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.ang);
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(cell*.32,-cell*.12);
      ctx.lineTo(cell*.46,0);ctx.lineTo(cell*.32,cell*.12);ctx.closePath();ctx.fill();ctx.restore();
    }else if(f.k==='wreck'){
      ctx.strokeStyle=f.c;ctx.lineWidth=1.6;ctx.setLineDash([4,4]);
      ctx.beginPath();ctx.arc(f.x,f.y,cell*.42,0,6.3);ctx.stroke();ctx.setLineDash([]);
      ctx.beginPath();ctx.moveTo(f.x-cell*.24,f.y-cell*.24);ctx.lineTo(f.x+cell*.24,f.y+cell*.24);
      ctx.moveTo(f.x+cell*.24,f.y-cell*.24);ctx.lineTo(f.x-cell*.24,f.y+cell*.24);ctx.stroke();
    }
    ctx.globalAlpha=1;
  }
  S.fx=S.fx.filter(f=>f.l>0);
}
/**
 * Ages and draws one particle list. Sparks by default; a record with `sq` is
 * a ribbon instead, which falls under `g`, keeps its speed (`d`) and spins.
 */
function ageParticles(list,dt){
  for(const p of list){
    p.l-=dt;
    if(p.g)p.vy+=p.g*dt;
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    const drag=p.d===undefined?.93:p.d;
    p.vx*=drag;p.vy*=drag;
    const a=Math.max(0,p.l/p.m);
    ctx.globalAlpha=a;ctx.fillStyle=p.c;
    if(p.sq){
      p.a+=p.spin*dt;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);
      ctx.fillRect(-p.sq/2,-p.sq*.7,p.sq,p.sq*1.4);ctx.restore();
    }else{
      ctx.beginPath();ctx.arc(p.x,p.y,p.r*a,0,6.3);ctx.fill();
    }
  }
  ctx.globalAlpha=1;
  return list.filter(p=>p.l>0);
}

export function drawParts(dt){
  S.parts=ageParticles(S.parts,dt);
}

/** Celebration ribbons, drawn last so they fall in front of the clear card. */
export function drawConfetti(dt){
  if(S.conf.length)S.conf=ageParticles(S.conf,dt);
}

export function drawFloats(dt){
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(const f of S.floats){
    f.l-=dt;f.y-=cell*.6*dt;
    ctx.globalAlpha=Math.min(1,f.l*1.5);
    ctx.font='600 '+f.sz+'px Sora, sans-serif';
    ctx.lineWidth=3.4;ctx.strokeStyle='rgba(2,5,11,.92)';
    ctx.strokeText(f.txt,f.x,f.y);ctx.fillStyle=f.c;ctx.fillText(f.txt,f.x,f.y);
  }
  ctx.globalAlpha=1;S.floats=S.floats.filter(f=>f.l>0);
}

/** Boss health bar, pinned to the top of the board. */
export function drawBossBar(){
  const b=S.boss;if(!b||b.dead)return;
  const w=W-28,x=14,y=10,h=9;
  ctx.fillStyle='rgba(2,6,12,.82)';rr(ctx,x-2,y-2,w+4,h+4,7);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.07)';rr(ctx,x,y,w,h,5);ctx.fill();
  const p=Math.max(0,b.hp/b.max);
  const g=ctx.createLinearGradient(x,0,x+w,0);
  g.addColorStop(0,b.def.c);g.addColorStop(1,'#ffffff');
  ctx.fillStyle=g;rr(ctx,x,y,w*p,h,5);ctx.fill();
  if(b.shield>0){ctx.fillStyle='rgba(140,200,255,.8)';rr(ctx,x,y+h+3,w*(b.shield/b.shMax),3,2);ctx.fill()}
  ctx.fillStyle='#dce8fb';ctx.font='600 '+(cell*.3)+'px Sora, sans-serif';
  ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(b.def.n,x,y+h+8);
  ctx.textAlign='right';ctx.fillStyle=b.def.c;ctx.fillText(Math.ceil(b.pT)+'s',x+w,y+h+8);
}

/** Wave title card, shown for a couple of seconds when a wave starts. */
export function drawBanner(dt){
  const b=S.banner;if(!b)return;
  b.l-=dt;if(b.l<=0){S.banner=null;return}
  const a=Math.min(1,b.l)*Math.min(1,(2.8-b.l)*3);
  ctx.save();ctx.globalAlpha=a;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='rgba(2,6,12,.76)';rr(ctx,W*.05,H*.36,W*.9,cell*2.2,12);ctx.fill();
  ctx.strokeStyle='rgba(163,121,255,.5)';ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle='#a379ff';ctx.font='600 '+(cell*.32)+'px Sora, sans-serif';
  ctx.fillText(b.sub,W/2,H*.36+cell*.62);
  ctx.fillStyle='#eaf1ff';ctx.font='600 '+(cell*.4)+'px Sora, sans-serif';
  const words=b.txt.split(' ');let line='',lines=[];
  for(const w2 of words){
    if(ctx.measureText(line+' '+w2).width>W*.8){lines.push(line);line=w2}
    else line=line?line+' '+w2:w2}
  lines.push(line);
  lines.forEach((L,i)=>ctx.fillText(L,W/2,H*.36+cell*1.32+i*cell*.48));
  ctx.restore();
}

/** Sets the font, shrunk just enough that `text` fits inside `max` pixels. */
function fitFont(text,max,size,weight){
  const font=px=>weight+' '+px+'px Sora, sans-serif';
  ctx.font=font(size);
  const w=ctx.measureText(text).width;
  if(w>max)ctx.font=font(size*max/w);
}

/**
 * The wave-clear card. Bigger and louder than the wave banner on purpose:
 * clearing a wave is the thing the whole game is asking you to do.
 */
export function drawCheer(dt){
  const c=S.cheer;if(!c)return;
  c.l-=dt;if(c.l<=0){S.cheer=null;return}

  const age=c.m-c.l;
  // Small, overshoot, settle — the card should land like a stamp.
  const k=Math.min(1,age/.4);
  const pop=1+.22*Math.sin(k*Math.PI)-.3*(1-k)*(1-k);
  const a=Math.min(1,age*5)*Math.min(1,c.l*2.2);
  const w=Math.min(W*.86,cell*7.6),h=cell*(c.lines.length?2.9:2.1),x=W/2,y=H*.4;

  ctx.save();
  ctx.globalAlpha=a*.55;ctx.fillStyle='rgba(2,6,12,.9)';ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=a;
  ctx.translate(x,y);ctx.scale(pop,pop);ctx.textAlign='center';ctx.textBaseline='middle';

  const g=ctx.createLinearGradient(-w/2,0,w/2,0);
  g.addColorStop(0,'rgba(53,230,213,.22)');g.addColorStop(1,'rgba(110,231,160,.22)');
  ctx.fillStyle=g;rr(ctx,-w/2,-h/2,w,h,14);ctx.fill();
  ctx.strokeStyle='rgba(110,231,160,.75)';ctx.lineWidth=1.4;ctx.stroke();

  const room=w-cell*.9;
  fitFont(c.sub,room,cell*.3,'600');
  ctx.fillStyle='#6ee7a0';ctx.fillText(c.sub,0,-h/2+cell*.5);

  ctx.shadowColor='rgba(110,231,160,.65)';ctx.shadowBlur=18;
  fitFont(c.txt,room,cell*.62,'700');
  ctx.fillStyle='#eafff4';ctx.fillText(c.txt,0,-h/2+cell*1.16);
  ctx.shadowBlur=0;

  c.lines.forEach((L,i)=>{
    fitFont(L.t,room,cell*.28,'600');
    ctx.fillStyle=L.c;ctx.fillText(L.t,0,-h/2+cell*1.68+i*cell*.4);
  });
  ctx.restore();
}
