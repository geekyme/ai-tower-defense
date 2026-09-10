import { THREATS } from './threats.js';

/** The five eras of the campaign. WAVES[n].e indexes into this. */
export const ERAS=[
  {n:'Era one · experimentation',s:'Nothing is in production yet. Everything is a demo.'},
  {n:'Era two · scaling',s:'It works. Now everyone wants one, and nobody is counting.'},
  {n:'Era three · governance',s:'Legal, security and the regulator have all found you.'},
  {n:'Era four · production',s:'You own the pager. Systems age and people leave.'},
  {n:'Era five · institutionalised',s:'AI is load bearing. Every cost and failure is now yours.'}
];

/**
 * The campaign. One entry per wave.
 *   e  era index
 *   t  wave title
 *   g  spawn groups: [threatKey, count, gapSeconds, startDelaySeconds?]
 */
export const WAVES=[
 {e:0,t:'The model makes things up',g:[['hallu',6,1.2]]},
 {e:0,t:'Nobody can focus for ten minutes',g:[['hallu',5,1.3],['ctx',12,.32,3]]},
 {e:0,t:'The first bill arrives',g:[['token',6,1.1],['ctx',12,.3,2]]},
 {e:0,t:'Five pilots, zero production',g:[['pilot',6,1.4],['hallu',6,1.1,2]]},
 {e:0,t:'Show me value in ninety days',g:[['review',1,1],['roi',8,1.5,4],['ctx',10,.4,2]]},
 {e:1,t:'Half the company is on a personal account',g:[['shadow',6,1.2],['ctx',12,.3,3]]},
 {e:1,t:'Everyone built their own agent',g:[['sprawl',3,3.2],['roi',8,1.0,2]]},
 {e:1,t:'Compute is rationed, expectations are not',g:[['gpu',4,2.0],['token',6,1.1,1],['hallu',6,1.0,4]]},
 {e:1,t:'The contract renews in March',g:[['vendor',3,3.0],['gpu',4,2.0,2],['evalgap',5,1.6,1]]},
 {e:1,t:'The board wants the number',g:[['board',1,1],['roi',10,1.4,4],['token',6,1.4,2]]},
 {e:2,t:'Something in the document was not text',g:[['inject',7,1.3],['shadow',6,1.1,3]]},
 {e:2,t:'The data was never ready',g:[['swamp',4,2.4],['deprec',5,1.5,2]]},
 {e:2,t:'Middle management has notes',g:[['frozen',3,3.2],['aiwash',5,1.6,1],['ctx',12,.3,6]]},
 {e:2,t:'Legal found out',g:[['pii',9,.9],['residency',4,2.2,2],['drift',8,1.0,4]]},
 {e:2,t:'Audit week',g:[['audit',1,1],['docreq',10,1.3,3],['frozen',2,4,7]]},
 {e:3,t:'Accuracy fell off a cliff quietly',g:[['drift',10,.9],['silent',6,1.4,2],['evalgap',5,1.8,4]]},
 {e:3,t:'The pager is yours now',g:[['oncall',8,1.1],['redteam',8,.9,2],['gpu',4,2.2,1]]},
 {e:3,t:'Nobody will retire version one',g:[['legacyai',4,2.6],['months',6,1.2,2],['swamp',4,2.4,4]]},
 {e:3,t:'Your best two people resigned',g:[['attrition',6,1.5],['vendor',3,3.0,2],['sprawl',4,2.4,1]]},
 {e:3,t:'AI is now everybody\u2019s job',g:[['reorg',1,1],['attrition',5,2.2,5],['ctx',14,.3,3]]},
 {e:4,t:'The bill compounds',g:[['inferbill',6,1.5],['energy',4,2.4,2],['token',8,1.0,1]]},
 {e:4,t:'It demoed beautifully in January',g:[['demo',6,1.6],['months',8,1.1,3],['aiwash',6,1.4,1]]},
 {e:4,t:'Trust is the product now',g:[['trust',6,1.6],['pii',10,.8,2],['redteam',8,.9,4]]},
 {e:4,t:'Everything at once',g:[['frozen',4,2.8],['residency',4,2.2,1],['silent',6,1.4,3],['inject',6,1.5,5]]},
 {e:4,t:'It started acting on its own',g:[['rogue',1,1],['subagent',12,1.1,5],['inject',5,2.2,8],['mandate',6,1.8,12]]}
];

export const CAMPAIGN_WAVES = WAVES.length;

/** Threat pool used to improvise waves once the campaign is over. */
const ENDLESS_POOL = ['hallu', 'shadow', 'drift', 'vendor', 'gpu', 'frozen', 'inject', 'pii',
  'swamp', 'sprawl', 'evalgap', 'silent', 'residency', 'oncall', 'redteam', 'attrition',
  'energy', 'inferbill', 'trust', 'mandate', 'legacyai'];
const ENDLESS_BOSSES = ['review', 'board', 'audit', 'reorg', 'rogue'];

/** Spawn groups for wave `n`, generating an endless wave past the campaign. */
export function waveGroups(n) {
  if (n <= WAVES.length) return WAVES[n - 1].g;
  const en = n - WAVES.length;
  const groups = [];
  const kinds = Math.min(6, 3 + Math.floor(en / 2));
  const seen = [];
  for (let i = 0; i < kinds; i++) {
    let k = ENDLESS_POOL[Math.floor(Math.random() * ENDLESS_POOL.length)], guard = 0;
    while (seen.includes(k) && guard++ < 12) k = ENDLESS_POOL[Math.floor(Math.random() * ENDLESS_POOL.length)];
    seen.push(k);
    // Capped: a wave that never stops arriving is a chore, not a challenge.
    groups.push([k, Math.min(20, 4 + Math.floor(en * 0.7)), 1.4, i * 1.5]);
  }
  if (en % 3 === 0) groups.push([ENDLESS_BOSSES[Math.floor(en / 3) % ENDLESS_BOSSES.length], 1, 1, 3]);
  return groups;
}

export function waveTitle(n) {
  return n <= WAVES.length ? WAVES[n - 1].t : 'Endless ' + (n - WAVES.length) + ' · it does not stop';
}

export function waveEra(n) {
  return n <= WAVES.length
    ? ERAS[WAVES[n - 1].e]
    : { n: 'Beyond the campaign', s: 'Every era at once, permanently scaling.' };
}

/** Distinct threat keys in a wave, plus the ones it splits or spawns into. */
export function waveRoster(n) {
  const direct = [];
  for (const [k] of waveGroups(n)) if (!direct.includes(k)) direct.push(k);
  const later = [];
  for (const k of direct) {
    const D = THREATS[k];
    for (const child of [D.split && D.split[0], D.spawn && D.spawn[0]]) {
      if (child && !direct.includes(child) && !later.includes(child)) later.push(child);
    }
  }
  return { direct, later };
}
