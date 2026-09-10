import { TOWERS } from '../data/towers.js';
import { CAMPAIGN_WAVES, waveTitle, waveEra } from '../data/waves.js';
import { S } from '../core/state.js';
import { unlockedCount } from '../core/storage.js';

/**
 * Renders the end-of-run summary as a 1080x1350 PNG and hands it to the
 * native share sheet, falling back to a download.
 */

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 600);
}

export function shareCard() {
  const w = 1080, h = 1350;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  const bgg=g.createLinearGradient(0,0,w*.6,h);
  bgg.addColorStop(0,'#0c1424');bgg.addColorStop(.5,'#070d1a');bgg.addColorStop(1,'#04070e');
  g.fillStyle=bgg;g.fillRect(0,0,w,h);
  const a1=g.createRadialGradient(w*.15,0,0,w*.15,0,h*.7);
  a1.addColorStop(0,'rgba(163,121,255,.32)');a1.addColorStop(1,'rgba(163,121,255,0)');
  g.fillStyle=a1;g.fillRect(0,0,w,h);
  const a2=g.createRadialGradient(w,h,0,w,h,h*.6);
  a2.addColorStop(0,'rgba(53,230,213,.22)');a2.addColorStop(1,'rgba(53,230,213,0)');
  g.fillStyle=a2;g.fillRect(0,0,w,h);
  for(let i=0;i<90;i++){g.globalAlpha=.05+Math.random()*.16;g.fillStyle='#cfe6ff';
    g.beginPath();g.arc(Math.random()*w,Math.random()*h,1+Math.random()*2,0,6.3);g.fill()}
  g.globalAlpha=1;
  g.textAlign='left';
  g.fillStyle='#7d92b5';g.font='600 30px Sora, sans-serif';
  g.fillText('head of ai \u00b7 defence',88,140);
  const reached=S.best||S.wave;
  const era=waveEra(Math.min(reached,CAMPAIGN_WAVES));
  g.fillStyle='#e9effb';g.font='700 190px Sora, sans-serif';
  g.fillText('wave '+reached,80,320);
  g.fillStyle='#a379ff';g.font='600 40px Sora, sans-serif';
  g.fillText(era.n,88,392);
  g.fillStyle='#9db0cd';g.font='400 36px Sora, sans-serif';
  const title=reached<=CAMPAIGN_WAVES?waveTitle(reached):'Endless '+(reached-CAMPAIGN_WAVES);
  let line='',ly=460;
  for(const wd of title.split(' ')){
    if(g.measureText(line+' '+wd).width>w-180){g.fillText(line,88,ly);ly+=48;line=wd}
    else line=line?line+' '+wd:wd}
  g.fillText(line,88,ly);
  const cards=[['handled',S.killed,'#35e6d5'],['got through',S.leaked,'#ff6b6b'],['defences lost',S.lost,'#a379ff']];
  cards.forEach(([lbl,val,col],i)=>{
    const x=88+i*310,y=620;
    g.fillStyle='rgba(255,255,255,.04)';g.strokeStyle='rgba(43,61,94,.9)';g.lineWidth=2;
    const r=24;g.beginPath();g.moveTo(x+r,y);g.arcTo(x+280,y,x+280,y+200,r);g.arcTo(x+280,y+200,x,y+200,r);
    g.arcTo(x,y+200,x,y,r);g.arcTo(x,y,x+280,y,r);g.closePath();g.fill();g.stroke();
    g.fillStyle=col;g.font='700 76px Sora, sans-serif';g.fillText(String(val),x+28,y+108);
    g.fillStyle='#7d92b5';g.font='500 26px Sora, sans-serif';g.fillText(lbl,x+28,y+158);
  });
  g.fillStyle='#e9effb';g.font='600 34px Sora, sans-serif';
  g.fillText('sanity left  '+S.sanity+' of '+S.max,88,920);
  g.fillStyle='rgba(43,61,94,.9)';g.fillRect(88,952,w-176,2);
  const picks=[...new Set(S.towers.map(t=>t.key))].slice(0,6);
  g.fillStyle='#7d92b5';g.font='500 28px Sora, sans-serif';
  g.fillText(picks.length?'defences standing at the end':'no defences left standing',88,1010);
  picks.forEach((k,i)=>{
    const d=TOWERS[k],x=88+(i%3)*310,y=1050+Math.floor(i/3)*70;
    g.fillStyle=d.col;g.beginPath();g.arc(x+14,y-10,13,0,6.3);g.fill();
    g.fillStyle='#c9d6ea';g.font='500 26px Sora, sans-serif';g.fillText(d.name,x+40,y);
  });
  g.fillStyle='#4d5f7d';g.font='500 24px Sora, sans-serif';

  g.fillStyle = '#7d92b5';
  g.font = '500 28px Sora, sans-serif';
  g.fillText(unlockedCount() + ' of ' + CAMPAIGN_WAVES + ' lessons unlocked', 88, h - 130);
  g.fillStyle = '#4d5f7d';
  g.font = '500 24px Sora, sans-serif';
  g.fillText('how long could you hold the line?', 88, h - 70);

  c.toBlob(blob => {
    if (!blob) return;
    const file = new File([blob], 'head-of-ai-wave-' + reached + '.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'Head of AI: defence' }).catch(() => download(blob, file.name));
    } else {
      download(blob, file.name);
    }
  }, 'image/png');
}
