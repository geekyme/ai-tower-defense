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
 *
 * Difficulty is mostly written here rather than in `config.js`: volume is the
 * main lever and health scaling is the secondary one. A wave runs several
 * groups at once on staggered delays, so the shape of a wave is which streams
 * overlap, not just how many threats are in it — a stream of chaff under a
 * slow armoured one is a different problem from either alone.
 *
 * The one thing to hold steady when editing: threats that cost 3 or more
 * sanity (pii, mandate, roi, frozen, swamp, trust, redteam) are what actually
 * ends runs, so their counts climb far more slowly than the chaff's. Push
 * volume with ctx, docreq, subagent and the rest; push difficulty with the
 * expensive ones, a few at a time. `node scripts/balance.mjs 25 200` prints
 * what a wave costs to hold, which is the only way to tell.
 */
export const WAVES=[
 {e:0,t:'The model makes things up',g:[['hallu',12,.8]]},
 {e:0,t:'Nobody can focus for ten minutes',g:[['hallu',10,.9],['ctx',24,.22,3]]},
 {e:0,t:'The first bill arrives',g:[['token',12,.7],['ctx',22,.2,2],['hallu',7,1.0,9]]},
 {e:0,t:'Five pilots, zero production',g:[['pilot',8,1.1],['hallu',12,.7,2],['ctx',16,.25,7]]},
 {e:0,t:'Show me value in ninety days',g:[['review',1,1],['roi',12,1.0,4],['ctx',22,.24,2],['hallu',6,1.1,14]]},
 {e:1,t:'Half the company is on a personal account',g:[['shadow',12,.85],['ctx',24,.22,3],['hallu',8,.9,8]]},
 {e:1,t:'Everyone built their own agent',g:[['sprawl',6,2.1],['roi',16,.6,2],['ctx',20,.24,8]]},
 {e:1,t:'Compute is rationed, expectations are not',g:[['gpu',8,1.4],['token',14,.6,1],['hallu',14,.6,4],['ctx',16,.25,10]]},
 {e:1,t:'The contract renews in March',g:[['vendor',6,2.0],['gpu',8,1.4,2],['evalgap',10,.95,1],['roi',14,.6,7]]},
 {e:1,t:'The board wants the number',g:[['board',1,1],['roi',20,.7,4],['token',14,.75,2],['ctx',24,.22,9]]},
 {e:2,t:'Something in the document was not text',g:[['inject',14,.8],['shadow',12,.75,3],['ctx',22,.22,7]]},
 {e:2,t:'The data was never ready',g:[['swamp',8,1.6],['deprec',11,.9,2],['drift',12,.7,6],['ctx',18,.25,11]]},
 {e:2,t:'Middle management has notes',g:[['frozen',6,2.1],['aiwash',11,.9,1],['ctx',26,.2,6],['roi',14,.65,10]]},
 {e:2,t:'Legal found out',g:[['pii',20,.5],['residency',8,1.4,2],['drift',16,.6,4],['inject',10,1.0,9]]},
 {e:2,t:'Audit week',g:[['audit',1,1],['docreq',26,.5,3],['frozen',5,2.4,7],['pii',16,.6,13]]},
 {e:3,t:'Accuracy fell off a cliff quietly',g:[['drift',20,.55],['silent',12,.85,2],['evalgap',10,1.0,4],['ctx',24,.2,11]]},
 {e:3,t:'The pager is yours now',g:[['oncall',16,.7],['redteam',16,.6,2],['gpu',8,1.5,1],['pii',10,.7,10]]},
 {e:3,t:'Nobody will retire version one',g:[['legacyai',8,1.7],['months',14,.7,2],['swamp',7,1.6,4],['silent',12,.85,11]]},
 {e:3,t:'Your best two people resigned',g:[['attrition',14,.9],['vendor',6,2.0,2],['sprawl',7,1.6,1],['redteam',14,.6,9]]},
 {e:3,t:'AI is now everybody\u2019s job',g:[['reorg',1,1],['attrition',8,1.8,5],['ctx',28,.2,3],['oncall',10,1.0,11],['months',12,.8,17]]},
 {e:4,t:'The bill compounds',g:[['inferbill',12,.95],['energy',8,1.6,2],['token',18,.55,1],['ctx',24,.2,9]]},
 {e:4,t:'It demoed beautifully in January',g:[['demo',12,1.05],['months',18,.65,3],['aiwash',12,.9,1],['drift',14,.7,11]]},
 {e:4,t:'Trust is the product now',g:[['trust',12,1.05],['pii',16,.55,2],['redteam',14,.65,4],['silent',14,.8,12]]},
 {e:4,t:'Everything at once',g:[['frozen',8,1.8],['residency',8,1.4,1],['silent',16,.75,3],['inject',14,.9,5],['mandate',8,1.5,13]]},
 {e:4,t:'It started acting on its own',g:[['rogue',1,1],['subagent',30,.5,5],['inject',12,1.2,8],['mandate',10,1.4,13],['pii',12,.8,19]]}
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
  // Endless one has to carry on from the finale rather than restart under it,
  // so it opens at roughly the volume wave 25 arrives in and climbs from there.
  const kinds = Math.min(7, 4 + Math.floor(en / 3));
  const seen = [];
  for (let i = 0; i < kinds; i++) {
    let k = ENDLESS_POOL[Math.floor(Math.random() * ENDLESS_POOL.length)], guard = 0;
    while (seen.includes(k) && guard++ < 12) k = ENDLESS_POOL[Math.floor(Math.random() * ENDLESS_POOL.length)];
    seen.push(k);
    // Capped: a wave that never stops arriving is a chore, not a challenge.
    groups.push([k, Math.min(28, 12 + en), 0.85, i * 1.6]);
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
