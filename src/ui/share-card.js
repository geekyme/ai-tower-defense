import { TOWERS } from '../data/towers.js';
import { CAMPAIGN_WAVES, waveTitle, waveEra } from '../data/waves.js';
import { S } from '../core/state.js';
import { unlockedCount } from '../core/storage.js';
import { toast } from './toast.js';

/**
 * The end-of-run report card: a 1080x1350 PNG, and a message to send with it.
 *
 * Everything up to the moment `navigator.share` is called happens inside the
 * click, with no `await` in between, because Safari drops the user gesture
 * across one and refuses to open the share sheet. That is why the PNG is made
 * with the synchronous `toDataURL` rather than `toBlob`.
 */

const TITLE = 'Head of AI: defence';

/** Where the card sends people. The canonical link is the published URL. */
function siteUrl() {
  const link = document.querySelector('link[rel="canonical"]');
  return (link && link.href) || location.origin + location.pathname;
}

/** The URL without its scheme, which is what reads well printed on the card. */
function siteLabel() {
  return siteUrl().replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/** How far the run got, and what to call it. */
function reachedWave() {
  return S.best || S.wave;
}

/** The message that goes with the card. Written to be sent, not to be read here. */
export function shareMessage() {
  const n = reachedWave();
  const lessons = unlockedCount();
  const past = n - CAMPAIGN_WAVES;

  const opener = past > 0
    ? 'I held the line to wave ' + n + ' of Head of AI: defence, ' + past +
      (past === 1 ? ' wave' : ' waves') + ' past the end of the campaign.'
    : n >= CAMPAIGN_WAVES
      ? 'I cleared all ' + CAMPAIGN_WAVES + ' waves of Head of AI: defence with ' +
        S.sanity + ' sanity left.'
      : 'I got to wave ' + n + ' of ' + CAMPAIGN_WAVES + ' of Head of AI: defence.';

  const tally = S.killed + ' AI failures handled, ' + S.leaked + ' got through, ' +
    lessons + ' of ' + CAMPAIGN_WAVES + ' lessons unlocked.';

  return opener + ' ' + tally + ' Every threat in it is a real one. See how far you get:';
}

/* ------------------------------------------------------------------- card */

function drawCard() {
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
  g.fillText('head of ai · defence',88,140);
  const reached=reachedWave();
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
  g.fillText('sanity left  '+S.sanity+' of '+S.max+(S.retries?'   ·   waves retried  '+S.retries:''),88,920);
  g.fillStyle='rgba(43,61,94,.9)';g.fillRect(88,952,w-176,2);
  const picks=[...new Set(S.towers.map(t=>t.key))].slice(0,6);
  g.fillStyle='#7d92b5';g.font='500 28px Sora, sans-serif';
  g.fillText(picks.length?'defences standing at the end':'no defences left standing',88,1010);
  picks.forEach((k,i)=>{
    const d=TOWERS[k],x=88+(i%3)*310,y=1050+Math.floor(i/3)*70;
    g.fillStyle=d.col;g.beginPath();g.arc(x+14,y-10,13,0,6.3);g.fill();
    g.fillStyle='#c9d6ea';g.font='500 26px Sora, sans-serif';g.fillText(d.name,x+40,y);
  });

  g.fillStyle = '#7d92b5';
  g.font = '500 28px Sora, sans-serif';
  g.fillText(unlockedCount() + ' of ' + CAMPAIGN_WAVES + ' lessons unlocked', 88, h - 160);
  g.fillStyle = '#4d5f7d';
  g.font = '500 24px Sora, sans-serif';
  g.fillText('how long could you hold the line?', 88, h - 108);
  g.fillStyle = '#35e6d5';
  g.font = '600 28px Sora, sans-serif';
  g.fillText(siteLabel(), 88, h - 56);
  return c;
}

function fileName() {
  return 'head-of-ai-wave-' + reachedWave() + '.png';
}

/** The card as a File, built synchronously so a share can follow immediately. */
function cardFile() {
  const url = drawCard().toDataURL('image/png');
  const bytes = atob(url.slice(url.indexOf(',') + 1));
  const buf = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
  return new File([buf], fileName(), { type: 'image/png' });
}

function download(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 600);
}

function copyMessage(text) {
  if (!navigator.clipboard) return Promise.reject();
  return navigator.clipboard.writeText(text);
}

/* ---------------------------------------------------------------- actions */

/** Saves the card as a PNG and nothing else. */
export function saveCard() {
  download(cardFile());
  toast('Card saved', 'Look in your downloads for ' + fileName());
}

/**
 * Opens the share sheet with the card and a message that already says how the
 * run went and where to play. Falls back to saving the card and putting the
 * message on the clipboard where there is no share sheet.
 */
export function shareRun() {
  const file = cardFile();
  const message = shareMessage();
  const url = siteUrl();
  const nav = navigator;

  const rescue = err => {
    // Cancelling the sheet is not a failure, and must not start a download.
    if (err && err.name === 'AbortError') return;
    saveAndCopy(message + '\n' + url, file);
  };

  if (nav.canShare && nav.canShare({ files: [file] })) {
    // The link rides inside the text: a share target that takes files often
    // ignores the separate url field, and a card nobody can follow is a poster.
    nav.share({ files: [file], title: TITLE, text: message + '\n' + url }).catch(rescue);
    return;
  }
  if (nav.share) {
    nav.share({ title: TITLE, text: message, url }).catch(rescue);
    return;
  }
  saveAndCopy(message + '\n' + url, file);
}

function saveAndCopy(text, file) {
  download(file);
  copyMessage(text).then(
    () => toast('Card saved, message copied', 'Paste it wherever you are sharing it.'),
    () => toast('Card saved', 'Look in your downloads for ' + file.name),
  );
}
