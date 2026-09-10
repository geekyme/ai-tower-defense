import { ctx, rr, poly, withCtx } from './canvas2d.js';
import { THREATS } from '../data/threats.js';

/**
 * Hand-drawn canvas artwork for every threat, keyed by `shape` in
 * data/threats.js.
 *
 * Each function is called with the origin already translated to the threat's
 * position and receives (size, threat, colour). They draw through the shared
 * `ctx` from canvas2d.js, which is what lets `threatThumbnail` reuse the exact
 * same code to render briefing icons onto an offscreen canvas.
 */

/** Two eyes that track the direction of travel. Used by several shapes. */
function face(x,y,r,ang,col){
  const ox=Math.cos(ang)*r*.13,oy=Math.sin(ang)*r*.13;
  ctx.fillStyle='#050912';
  ctx.beginPath();ctx.arc(x-r*.28,y,r*.2,0,6.3);ctx.fill();
  ctx.beginPath();ctx.arc(x+r*.28,y,r*.2,0,6.3);ctx.fill();
  ctx.fillStyle=col||'#fff';
  ctx.beginPath();ctx.arc(x-r*.28+ox,y+oy,r*.085,0,6.3);ctx.fill();
  ctx.beginPath();ctx.arc(x+r*.28+ox,y+oy,r*.085,0,6.3);ctx.fill();
}

export const SHAPE={
ghost(s,f,c){ctx.beginPath();ctx.arc(0,-s*.18,s*.85,Math.PI,0);ctx.lineTo(s*.85,s*.5);
  for(let i=0;i<3;i++){const a=s*.85-i*s*.567;ctx.quadraticCurveTo(a-s*.28,s*.5+(i%2?-s*.3:s*.32),a-s*.567,s*.5)}
  ctx.lineTo(-s*.85,-s*.18);ctx.closePath();ctx.fillStyle=c;ctx.fill();ctx.shadowBlur=0;
  face(0,-s*.22,s,f.ang+Math.sin(f.w)*1.6,'#ffd6f4')},
wisp(s,f,c){ctx.fillStyle=c;ctx.globalAlpha=.92;
  ctx.beginPath();ctx.ellipse(0,0,s*.9,s*.7,Math.sin(f.w)*.3,0,6.3);ctx.fill();ctx.globalAlpha=1;ctx.shadowBlur=0;
  ctx.fillStyle='#3a0d2c';ctx.font='700 '+(s*.95)+'px Sora, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('"',0,s*.18)},
ctx(s,f,c){ctx.strokeStyle=c;ctx.lineWidth=s*.3;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-s*.8,-s*.55);ctx.lineTo(s*.8,s*.55);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-s*.8,s*.55);ctx.lineTo(s*.8,-s*.55);ctx.stroke();ctx.shadowBlur=0;
  ctx.fillStyle=c;ctx.beginPath();ctx.arc(s*.8,s*.55,s*.24,0,6.3);ctx.fill();
  ctx.beginPath();ctx.arc(s*.8,-s*.55,s*.24,0,6.3);ctx.fill()},
flame(s,f,c){const w=Math.sin(f.w*1.6)*.16;ctx.fillStyle=c;
  ctx.beginPath();ctx.moveTo(0,-s*1.15);ctx.quadraticCurveTo(s*(.85+w),-s*.1,s*.5,s*.6);
  ctx.quadraticCurveTo(0,s*1.05,-s*.5,s*.6);ctx.quadraticCurveTo(-s*(.85-w),-s*.1,0,-s*1.15);ctx.closePath();ctx.fill();
  ctx.shadowBlur=0;ctx.fillStyle='#fff3d0';
  ctx.beginPath();ctx.moveTo(0,-s*.4);ctx.quadraticCurveTo(s*.3,s*.05,0,s*.5);ctx.quadraticCurveTo(-s*.3,s*.05,0,-s*.4);ctx.fill();
  ctx.fillStyle='#7a3d00';ctx.font='700 '+(s*.5)+'px Sora, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('$',0,s*.16)},
halo(s,f,c){ctx.strokeStyle=c;ctx.lineWidth=s*.16;
  ctx.beginPath();ctx.ellipse(0,-s*.58,s*.75,s*.24,0,0,6.3);ctx.stroke();
  ctx.globalAlpha=.6;ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,s*.12,s*.72,Math.PI,0);
  ctx.lineTo(s*.72,s*.75);ctx.lineTo(-s*.72,s*.75);ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.shadowBlur=0;
  face(0,-s*.06,s*.9,f.ang,'#dfe9ff')},
demo(s,f,c){ctx.fillStyle=c;rr(ctx,-s*.95,-s*.72,s*1.9,s*1.3,s*.14);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='rgba(30,22,0,.78)';rr(ctx,-s*.8,-s*.58,s*1.6,s*1.02,s*.08);ctx.fill();
  ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-s*.15,-s*.28);ctx.lineTo(s*.32,-s*.05);ctx.lineTo(-s*.15,s*.2);ctx.closePath();ctx.fill();
  ctx.fillRect(-s*.18,s*.58,s*.36,s*.22);ctx.fillRect(-s*.6,s*.78,s*1.2,s*.16);
  ctx.globalAlpha=.45;ctx.fillStyle='#fff';
  ctx.beginPath();ctx.moveTo(-s*.8,s*.44);ctx.lineTo(s*.8,-s*.58);ctx.lineTo(s*.8,-s*.2);ctx.lineTo(-s*.5,s*.44);ctx.closePath();ctx.fill();ctx.globalAlpha=1},
months(s,f,c){ctx.fillStyle=c;rr(ctx,-s*.85,-s*.9,s*1.7,s*1.7,s*.16);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='rgba(28,18,4,.72)';rr(ctx,-s*.68,-s*.4,s*1.36,s*1.1,s*.08);ctx.fill();
  ctx.fillStyle=c;ctx.fillRect(-s*.55,-s*1.12,s*.16,s*.4);ctx.fillRect(s*.4,-s*1.12,s*.16,s*.4);
  ctx.fillStyle='#f6e2b0';ctx.font='700 '+(s*.62)+'px Sora, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('6m',0,s*.2)},
shadow(s,f,c){const seen=f.revT>0;ctx.globalAlpha=seen?.95:.32;ctx.fillStyle=seen?c:'#0d1424';
  ctx.beginPath();ctx.moveTo(0,-s);ctx.quadraticCurveTo(s*.95,-s*.4,s*.62,s*.85);
  ctx.lineTo(-s*.62,s*.85);ctx.quadraticCurveTo(-s*.95,-s*.4,0,-s);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  ctx.setLineDash([s*.22,s*.18]);ctx.strokeStyle=seen?'#cfc4ff':'rgba(140,150,200,.55)';ctx.lineWidth=1.4;ctx.stroke();
  ctx.setLineDash([]);ctx.globalAlpha=1;
  if(seen)face(0,-s*.15,s,f.ang,'#e2dcff');
  else{ctx.fillStyle='rgba(180,190,230,.5)';ctx.beginPath();ctx.arc(-s*.26,-s*.15,s*.1,0,6.3);ctx.fill();
    ctx.beginPath();ctx.arc(s*.26,-s*.15,s*.1,0,6.3);ctx.fill()}},
sprawl(s,f,c){ctx.fillStyle=c;poly(ctx,6,s*.46,f.w*.2);ctx.fill();ctx.shadowBlur=0;
  for(let i=0;i<3;i++){const a=f.w*.5+i*2.094,x=Math.cos(a)*s*.85,y=Math.sin(a)*s*.85;
    ctx.strokeStyle=c;ctx.lineWidth=1.2;ctx.globalAlpha=.5;
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(x,y);ctx.stroke();ctx.globalAlpha=1;
    ctx.fillStyle=c;ctx.save();ctx.translate(x,y);poly(ctx,6,s*.24,a);ctx.fill();ctx.restore()}},
chip(s,f,c){ctx.fillStyle=c;
  for(let i=0;i<4;i++){const p=-s*.56+i*s*.37;
    ctx.fillRect(p,-s*1.24,s*.15,s*.34);ctx.fillRect(p,s*.9,s*.15,s*.34);
    ctx.fillRect(-s*1.24,p,s*.34,s*.15);ctx.fillRect(s*.9,p,s*.34,s*.15)}
  rr(ctx,-s*.9,-s*.9,s*1.8,s*1.8,s*.16);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='rgba(24,4,8,.82)';rr(ctx,-s*.56,-s*.56,s*1.12,s*1.12,s*.1);ctx.fill();
  ctx.fillStyle=c;ctx.font='700 '+(s*.78)+'px Sora, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('!',0,s*.03)},
lock(s,f,c){ctx.strokeStyle=c;ctx.lineWidth=s*.2;
  ctx.beginPath();ctx.arc(0,-s*.42,s*.44,Math.PI,0);ctx.stroke();
  ctx.fillStyle=c;rr(ctx,-s*.72,-s*.42,s*1.44,s*1.15,s*.2);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='#2b1247';ctx.beginPath();ctx.arc(0,s*.1,s*.17,0,6.3);ctx.fill();ctx.fillRect(-s*.07,s*.1,s*.14,s*.34);
  ctx.strokeStyle='rgba(201,139,255,.4)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,s*2.1,0,6.3);ctx.stroke()},
evalgap(s,f,c){ctx.strokeStyle=c;ctx.lineWidth=1.6;ctx.setLineDash([s*.24,s*.2]);
  ctx.strokeRect(-s*.9,-s*.85,s*1.8,s*1.7);ctx.setLineDash([]);ctx.shadowBlur=0;
  ctx.fillStyle=c;
  ctx.fillRect(-s*.62,s*.1,s*.28,s*.62);ctx.fillRect(-s*.16,-s*.24,s*.28,s*.96);
  ctx.globalAlpha=.28;ctx.fillRect(s*.3,-s*.6,s*.28,s*1.32);ctx.globalAlpha=1;
  ctx.strokeStyle='#fff';ctx.lineWidth=s*.11;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(s*.26,-s*.5);ctx.lineTo(s*.62,-s*.14);ctx.moveTo(s*.62,-s*.5);ctx.lineTo(s*.26,-s*.14);ctx.stroke()},
roi(s,f,c){ctx.fillStyle=c;poly(ctx,4,s*.98,.7854);ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle='#4a3600';ctx.lineWidth=s*.16;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(-s*.42,s*.3);ctx.lineTo(-s*.1,-s*.06);ctx.lineTo(s*.1,s*.1);ctx.lineTo(s*.45,-s*.35);ctx.stroke();
  ctx.beginPath();ctx.moveTo(s*.45,-s*.35);ctx.lineTo(s*.18,-s*.36);ctx.moveTo(s*.45,-s*.35);ctx.lineTo(s*.45,-s*.08);ctx.stroke()},
inject(s,f,c){ctx.fillStyle=c;rr(ctx,-s*.9,-s*.72,s*1.8,s*1.2,s*.28);ctx.fill();
  ctx.beginPath();ctx.moveTo(-s*.2,s*.44);ctx.lineTo(-s*.55,s*.98);ctx.lineTo(-s*.55,s*.4);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle='#2b0512';ctx.lineWidth=s*.13;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-s*.45,-s*.34);ctx.lineTo(s*.45,-s*.34);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-s*.45,-s*.02);ctx.lineTo(s*.15,-s*.02);ctx.stroke();
  ctx.strokeStyle='#fff';ctx.lineWidth=s*.1;
  ctx.beginPath();ctx.moveTo(-s*.45,s*.28);ctx.lineTo(s*.45,s*.28);ctx.stroke()},
swamp(s,f,c){ctx.fillStyle=c;ctx.beginPath();
  for(let i=0;i<=16;i++){const a=i/16*6.283,r=s*(.95+Math.sin(a*3+f.w*.6)*.14);
    i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r*.85):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r*.85)}
  ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='rgba(30,44,20,.6)';
  for(let i=0;i<4;i++){const a=f.w*.3+i*1.57;ctx.beginPath();ctx.arc(Math.cos(a)*s*.42,Math.sin(a)*s*.33,s*.17,0,6.3);ctx.fill()}
  face(0,-s*.06,s*.95,f.ang,'#dff0b0')},
sunset(s,f,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,s*.18,s*.72,Math.PI,0);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle=c;ctx.lineWidth=s*.14;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-s*1.05,s*.5);ctx.lineTo(s*1.05,s*.5);ctx.stroke();
  ctx.globalAlpha=.6;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-s*.8+i*s*.8,s*.85);ctx.lineTo(-s*.5+i*s*.8,s*.85);ctx.stroke()}
  ctx.globalAlpha=1;ctx.fillStyle='#3a1400';ctx.font='700 '+(s*.4)+'px Sora, sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('EOL',0,-s*.1)},
frozen(s,f,c){ctx.fillStyle=c;rr(ctx,-s,-s*.78,s*2,s*1.56,s*.14);ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle='rgba(20,34,52,.75)';ctx.lineWidth=Math.max(1,s*.1);
  ctx.beginPath();ctx.moveTo(-s,-s*.26);ctx.lineTo(s,-s*.26);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-s,s*.26);ctx.lineTo(s,s*.26);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-s*.33,-s*.78);ctx.lineTo(-s*.33,-s*.26);ctx.stroke();
  ctx.beginPath();ctx.moveTo(s*.33,-s*.26);ctx.lineTo(s*.33,s*.26);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-s*.33,s*.26);ctx.lineTo(-s*.33,s*.78);ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.5)';rr(ctx,-s*.9,-s*.68,s*1.8,s*.16,s*.08);ctx.fill();
  face(0,0,s*.9,f.ang,'#eaf4ff')},
mask(s,f,c){ctx.fillStyle=c;
  ctx.beginPath();ctx.moveTo(-s*.92,-s*.5);
  ctx.quadraticCurveTo(0,-s*.86,s*.92,-s*.5);
  ctx.quadraticCurveTo(s*.8,s*.7,0,s*.86);
  ctx.quadraticCurveTo(-s*.8,s*.7,-s*.92,-s*.5);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='#2c1f45';
  ctx.beginPath();ctx.ellipse(-s*.35,-s*.12,s*.24,s*.15,.25,0,6.3);ctx.fill();
  ctx.beginPath();ctx.ellipse(s*.35,-s*.12,s*.24,s*.15,-.25,0,6.3);ctx.fill();
  ctx.strokeStyle='#2c1f45';ctx.lineWidth=s*.1;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-s*.3,s*.42);ctx.quadraticCurveTo(0,s*.24,s*.3,s*.42);ctx.stroke()},
leak(s,f,c){ctx.fillStyle=c;
  ctx.beginPath();ctx.moveTo(0,-s*1.05);
  ctx.bezierCurveTo(s*.85,-s*.1,s*.72,s*.85,0,s*.85);
  ctx.bezierCurveTo(-s*.72,s*.85,-s*.85,-s*.1,0,-s*1.05);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='rgba(50,0,26,.66)';ctx.font='700 '+(s*.6)+'px Sora, sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('id',0,s*.24);
  ctx.fillStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.ellipse(-s*.28,-s*.2,s*.13,s*.2,-.4,0,6.3);ctx.fill()},
globe(s,f,c){ctx.strokeStyle=c;ctx.lineWidth=s*.14;
  ctx.beginPath();ctx.arc(0,0,s*.82,0,6.3);ctx.stroke();ctx.shadowBlur=0;
  ctx.beginPath();ctx.ellipse(0,0,s*.34,s*.82,0,0,6.3);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-s*.82,0);ctx.lineTo(s*.82,0);ctx.stroke();
  ctx.fillStyle=c;ctx.globalAlpha=.2;ctx.beginPath();ctx.arc(0,0,s*.82,0,6.3);ctx.fill();ctx.globalAlpha=1;
  ctx.strokeStyle='#fff';ctx.lineWidth=s*.16;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-s*.5,-s*.95);ctx.lineTo(s*.5,s*.95);ctx.stroke()},
drift(s,f,c){ctx.strokeStyle=c;ctx.lineWidth=s*.24;ctx.lineCap='round';ctx.beginPath();
  for(let i=0;i<=20;i++){const x=-s+i/20*s*2;ctx.lineTo(x,Math.sin(i/20*7+f.w)*s*.42)}
  ctx.stroke();ctx.shadowBlur=0;
  ctx.fillStyle=c;ctx.beginPath();ctx.arc(s,Math.sin(7+f.w)*s*.42,s*.26,0,6.3);ctx.fill();
  ctx.globalAlpha=.35;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-s,-s*.6);ctx.lineTo(s,-s*.6);ctx.stroke();ctx.globalAlpha=1},
flatline(s,f,c){ctx.strokeStyle=c;ctx.lineWidth=s*.2;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(-s*.95,0);ctx.lineTo(-s*.45,0);ctx.lineTo(-s*.3,-s*.55);
  ctx.lineTo(-s*.12,s*.5);ctx.lineTo(s*.05,0);ctx.lineTo(s*.95,0);ctx.stroke();ctx.shadowBlur=0;
  ctx.fillStyle=c;ctx.globalAlpha=.25;rr(ctx,-s*.95,-s*.8,s*1.9,s*1.6,s*.14);ctx.fill();ctx.globalAlpha=1;
  ctx.strokeStyle=c;ctx.lineWidth=1.2;rr(ctx,-s*.95,-s*.8,s*1.9,s*1.6,s*.14);ctx.stroke()},
pager(s,f,c){ctx.fillStyle=c;rr(ctx,-s*.75,-s*.55,s*1.5,s*1.2,s*.16);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='rgba(40,18,0,.75)';rr(ctx,-s*.55,-s*.35,s*1.1,s*.5,s*.06);ctx.fill();
  ctx.fillStyle='#fff';ctx.font='700 '+(s*.36)+'px Sora, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('3:00',0,-s*.1);
  ctx.strokeStyle=c;ctx.lineWidth=s*.13;ctx.lineCap='round';
  const w=Math.sin(f.w*3)*.3;
  ctx.beginPath();ctx.arc(0,-s*.55,s*.9,-2.3+w,-1.9+w);ctx.stroke();
  ctx.beginPath();ctx.arc(0,-s*.55,s*.9,-1.24+w,-.84+w);ctx.stroke();
  ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,s*.62,s*.16,0,6.3);ctx.fill()},
flag(s,f,c){ctx.strokeStyle=c;ctx.lineWidth=s*.16;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-s*.55,s*.9);ctx.lineTo(-s*.55,-s*.9);ctx.stroke();ctx.shadowBlur=0;
  ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-s*.5,-s*.85);
  ctx.lineTo(s*.9,-s*.5);ctx.lineTo(-s*.5,-s*.1);ctx.closePath();ctx.fill();
  ctx.fillStyle='#3a0006';ctx.font='700 '+(s*.34)+'px Sora, sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('P1',s*.05,-s*.48)},
v1(s,f,c){ctx.fillStyle=c;rr(ctx,-s*.95,-s*.8,s*1.9,s*1.6,s*.12);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='rgba(16,22,34,.8)';rr(ctx,-s*.78,-s*.62,s*1.56,s*1.24,s*.08);ctx.fill();
  ctx.fillStyle=c;ctx.font='700 '+(s*.78)+'px Sora, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('v1',0,-s*.06);
  ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(-s*.6,s*.42);ctx.lineTo(s*.6,s*.42);ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.4)';ctx.font='600 '+(s*.3)+'px Sora, sans-serif';ctx.fillText('still live',0,s*.62)},
exit(s,f,c){ctx.fillStyle=c;
  ctx.beginPath();ctx.arc(-s*.3,-s*.5,s*.26,0,6.3);ctx.fill();
  ctx.beginPath();ctx.moveTo(-s*.55,-s*.2);ctx.lineTo(-s*.05,-s*.2);ctx.lineTo(-s*.1,s*.35);
  ctx.lineTo(-s*.28,s*.35);ctx.lineTo(-s*.3,s*.05);ctx.lineTo(-s*.35,s*.35);ctx.lineTo(-s*.55,s*.35);ctx.closePath();ctx.fill();
  ctx.shadowBlur=0;
  ctx.strokeStyle=c;ctx.lineWidth=s*.14;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(s*.15,s*.05);ctx.lineTo(s*.8,s*.05);ctx.moveTo(s*.55,-s*.22);ctx.lineTo(s*.85,s*.05);ctx.lineTo(s*.55,s*.32);ctx.stroke();
  ctx.strokeRect(s*.05,-s*.75,.01,s*1.6)},
plug(s,f,c){ctx.strokeStyle=c;ctx.lineWidth=s*.18;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-s*.35,-s*.95);ctx.lineTo(-s*.35,-s*.4);ctx.stroke();
  ctx.beginPath();ctx.moveTo(s*.35,-s*.95);ctx.lineTo(s*.35,-s*.4);ctx.stroke();ctx.shadowBlur=0;
  ctx.fillStyle=c;rr(ctx,-s*.66,-s*.4,s*1.32,s*.8,s*.14);ctx.fill();
  ctx.beginPath();ctx.moveTo(-s*.3,s*.4);ctx.lineTo(s*.3,s*.4);ctx.lineTo(s*.16,s*.95);ctx.lineTo(-s*.16,s*.95);ctx.closePath();ctx.fill();
  ctx.fillStyle='#3d3400';ctx.beginPath();ctx.moveTo(s*.06,-s*.28);ctx.lineTo(-s*.2,s*.02);
  ctx.lineTo(-s*.02,s*.02);ctx.lineTo(-s*.1,s*.3);ctx.lineTo(s*.2,-s*.04);ctx.lineTo(s*.02,-s*.04);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(255,225,75,.3)';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,0,s*2.6,0,6.3);ctx.stroke()},
receipt(s,f,c){ctx.fillStyle=c;
  ctx.beginPath();ctx.moveTo(-s*.6,-s*.95);ctx.lineTo(s*.6,-s*.95);ctx.lineTo(s*.6,s*.8);
  for(let i=0;i<4;i++)ctx.lineTo(s*.6-(i+.5)*s*.3,s*(i%2?.8:1.0));
  ctx.lineTo(-s*.6,s*.8);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle='rgba(50,18,0,.7)';ctx.lineWidth=s*.1;ctx.lineCap='round';
  for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-s*.38,-s*.62+i*s*.34);ctx.lineTo(s*(i===3?.05:.38),-s*.62+i*s*.34);ctx.stroke()}
  ctx.fillStyle='#5a1e00';ctx.font='700 '+(s*.42)+'px Sora, sans-serif';ctx.textAlign='right';ctx.textBaseline='middle';
  ctx.fillText('$$$',s*.42,s*.5)},
crack(s,f,c){ctx.fillStyle=c;
  ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(s*.85,-s*.55);ctx.lineTo(s*.85,s*.25);
  ctx.lineTo(0,s*.95);ctx.lineTo(-s*.85,s*.25);ctx.lineTo(-s*.85,-s*.55);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle='#2b0714';ctx.lineWidth=s*.14;ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(-s*.1,-s*.9);ctx.lineTo(s*.16,-s*.2);ctx.lineTo(-s*.2,s*.12);ctx.lineTo(s*.1,s*.85);ctx.stroke()},
horn(s,f,c){ctx.fillStyle=c;
  ctx.beginPath();ctx.moveTo(-s*.85,-s*.35);ctx.lineTo(-s*.3,-s*.35);ctx.lineTo(s*.6,-s*.85);
  ctx.lineTo(s*.6,s*.85);ctx.lineTo(-s*.3,s*.35);ctx.lineTo(-s*.85,s*.35);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle=c;ctx.lineWidth=s*.11;ctx.lineCap='round';
  for(let i=0;i<3;i++){const r=s*(.78+i*.24);
    ctx.beginPath();ctx.arc(s*.6,0,r,-.65,.65);ctx.stroke()}
  ctx.fillStyle='#4a4200';ctx.beginPath();ctx.arc(-s*.5,0,s*.16,0,6.3);ctx.fill()},
doc(s,f,c){ctx.fillStyle=c;
  ctx.beginPath();ctx.moveTo(-s*.62,-s*.85);ctx.lineTo(s*.3,-s*.85);ctx.lineTo(s*.62,-s*.5);
  ctx.lineTo(s*.62,s*.85);ctx.lineTo(-s*.62,s*.85);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle='rgba(30,40,60,.7)';ctx.lineWidth=s*.12;ctx.lineCap='round';
  for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-s*.36,-s*.2+i*s*.34);ctx.lineTo(s*.36,-s*.2+i*s*.34);ctx.stroke()}},
review(s,f,c){ctx.fillStyle=c;rr(ctx,-s*.95,-s*.8,s*1.9,s*1.6,s*.16);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='rgba(40,30,0,.85)';rr(ctx,-s*.8,-s*.65,s*1.6,s*1.3,s*.1);ctx.fill();
  ctx.fillStyle=c;ctx.font='700 '+(s*.5)+'px Sora, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('90',0,-s*.16);
  ctx.font='600 '+(s*.26)+'px Sora, sans-serif';ctx.fillText('days',0,s*.28);
  ctx.strokeStyle=c;ctx.lineWidth=s*.1;
  ctx.beginPath();ctx.arc(0,0,s*1.16,-1.57,-1.57+6.283*(.35+Math.sin(f.w*.4)*.2));ctx.stroke()},
board(s,f,c){ctx.save();ctx.rotate(Math.sin(f.w*.3)*.05);
  ctx.fillStyle=c;rr(ctx,-s,-s*.8,s*2,s*1.6,s*.14);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='rgba(38,24,0,.85)';rr(ctx,-s*.85,-s*.65,s*1.7,s*1.3,s*.08);ctx.fill();
  const bars=[.75,.55,.4,.2];
  for(let i=0;i<4;i++){ctx.fillStyle=i===3?'#ff5c5c':c;const h=s*1.05*bars[i];
    ctx.fillRect(-s*.66+i*s*.36,s*.55-h,s*.24,h)}
  ctx.strokeStyle='#ff5c5c';ctx.lineWidth=s*.1;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-s*.6,-s*.35);ctx.lineTo(s*.6,s*.2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(s*.6,s*.2);ctx.lineTo(s*.3,s*.18);ctx.moveTo(s*.6,s*.2);ctx.lineTo(s*.58,-s*.1);ctx.stroke();
  ctx.restore();
  for(let i=0;i<5;i++){const a=f.w*.35+i*1.257;ctx.fillStyle=c;ctx.globalAlpha=.85;
    ctx.beginPath();ctx.arc(Math.cos(a)*s*1.3,Math.sin(a)*s*1.3,s*.14,0,6.3);ctx.fill();ctx.globalAlpha=1}},
audit(s,f,c){ctx.fillStyle=c;poly(ctx,8,s,.3927);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='rgba(6,14,40,.88)';poly(ctx,8,s*.78,.3927);ctx.fill();
  ctx.fillStyle='#ffd84b';
  for(let i=0;i<12;i++){const a=f.w*.15+i/12*6.283;
    ctx.beginPath();ctx.arc(Math.cos(a)*s*.56,Math.sin(a)*s*.56,s*.07,0,6.3);ctx.fill()}
  ctx.strokeStyle='#ffd84b';ctx.lineWidth=s*.1;ctx.beginPath();ctx.arc(0,0,s*.3,0,6.3);ctx.stroke();
  ctx.fillStyle='#ffd84b';ctx.font='700 '+(s*.32)+'px Sora, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('AI',0,s*.02);
  for(let i=0;i<3;i++){const a=-f.w*.4+i*2.094;ctx.strokeStyle='rgba(92,141,255,.6)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(0,0,s*(1.16+i*.12),a,a+1.1);ctx.stroke()}},
reorg(s,f,c){ctx.fillStyle=c;
  rr(ctx,-s*.34,-s*.98,s*.68,s*.5,s*.08);ctx.fill();
  for(let i=0;i<3;i++){const x=(-1+i)*s*.72;
    rr(ctx,x-s*.28,s*.2,s*.56,s*.44,s*.07);ctx.fill()}
  ctx.strokeStyle=c;ctx.lineWidth=s*.09;
  ctx.beginPath();ctx.moveTo(0,-s*.48);ctx.lineTo(0,-s*.06);ctx.moveTo(-s*.72,-s*.06);ctx.lineTo(s*.72,-s*.06);
  for(let i=0;i<3;i++){const x=(-1+i)*s*.72;ctx.moveTo(x,-s*.06);ctx.lineTo(x,s*.2)}
  ctx.stroke();ctx.shadowBlur=0;
  ctx.strokeStyle='#ff5c8a';ctx.lineWidth=s*.13;ctx.lineCap='round';
  const q=Math.sin(f.w*.5)*.4;
  ctx.beginPath();ctx.moveTo(-s*.95+q*s,s*.75);ctx.lineTo(s*.95+q*s,s*.75);ctx.stroke();
  ctx.beginPath();ctx.moveTo(s*.6+q*s,s*.55);ctx.lineTo(s*.98+q*s,s*.75);ctx.lineTo(s*.6+q*s,s*.95);ctx.stroke();
  for(let i=0;i<4;i++){const a=f.w*.3+i*1.571;ctx.fillStyle=c;ctx.globalAlpha=.7;
    ctx.beginPath();ctx.arc(Math.cos(a)*s*1.32,Math.sin(a)*s*1.32,s*.12,0,6.3);ctx.fill();ctx.globalAlpha=1}},
rogue(s,f,c){ctx.save();ctx.rotate(f.w*.22);ctx.fillStyle=c;ctx.beginPath();
  for(let i=0;i<14;i++){const a=i/14*6.283,r=s*(i%2?.62:1.05);
    i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r)}
  ctx.closePath();ctx.fill();ctx.restore();ctx.shadowBlur=0;
  ctx.fillStyle='rgba(24,0,10,.88)';ctx.beginPath();ctx.arc(0,0,s*.6,0,6.3);ctx.fill();
  ctx.strokeStyle='#ff8fae';ctx.lineWidth=s*.07;
  for(let i=0;i<3;i++){const a=-f.w*.5+i*2.094;ctx.beginPath();ctx.arc(0,0,s*(.72+i*.16),a,a+1.5);ctx.stroke()}
  face(0,-s*.04,s*.85,f.ang,'#ffd0da');
  ctx.fillStyle='#ff8fae';ctx.font='700 '+(s*.3)+'px Sora, sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('\u221e',0,s*.34)}
};

/** Which artwork to use — a disguised threat draws as whatever it mimics. */
export function shapeOf(f) {
  return f.shown ? f.def.shape : THREATS[f.mim].shape;
}

/**
 * Renders a threat as a standalone data URL, for briefing and lesson lists.
 * @param {string} key  threat key
 * @param {number} px   CSS pixel size (rendered at 2x)
 */
export function threatThumbnail(key, px) {
  const c = document.createElement('canvas');
  c.width = px * 2;
  c.height = px * 2;
  const g = c.getContext('2d');
  g.setTransform(2, 0, 0, 2, 0, 0);
  const D = THREATS[key];
  g.translate(px / 2, px / 2);
  g.shadowColor = D.c;
  g.shadowBlur = 7;
  const s = px * (D.boss ? 0.3 : 0.34);
  withCtx(g, () => {
    try {
      (SHAPE[D.shape] || SHAPE.ghost)(s, { w: 1.3, ang: 0.4, revT: 1, fl: 0, shown: true }, D.c);
    } catch (e) {
      /* a shape that needs more state than the stub provides just renders empty */
    }
  });
  return c.toDataURL();
}
