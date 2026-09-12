/**
 * Threats, keyed by id. Everything is data — the engine reads these flags and
 * never special-cases a threat by name.
 *
 * Movement      hp, spd (cells/sec), sz, weave, accel
 * Economy       b (focus bounty), dmg (sanity lost if it lands), drain
 * Survivability armor, antiPierce, onlyEval, aura, regen/heal, grow, shield,
 *               slowProof, noAoE, cloak, mimic
 * Offence       split, spawn, hijack, sunset, page, attrition, towerSlow,
 *               sludge, power (+ pcd cooldown), phases
 */
export const THREATS={
/* era 1 */
hallu:{n:'Hallucination',hp:78,spd:1.5,b:15,dmg:2,c:'#ff63c7',shape:'ghost',fam:'hallu',split:['citation',2],
  d:'Splits into two confident citations when killed. Eval suites hit it twice as hard.'},
citation:{n:'Confident citation',hp:26,spd:2.3,b:3,dmg:1,c:'#ff9ee6',shape:'wisp',fam:'hallu',sz:.26,
  d:'Fast, wrong, and completely sure of itself.'},
ctx:{n:'Context switch',hp:22,spd:2.7,b:4,dmg:1,c:'#7fd4ff',shape:'ctx',sz:.3,weave:.55,
  d:'Weaves down the lane at speed. Cheap alone, ruinous in a crowd.'},
token:{n:'Token burn',hp:66,spd:1.7,b:12,dmg:1,c:'#ffa03c',shape:'flame',drain:4,
  d:'Drains 4 focus every second it stays alive. Kill it early or pay for it.'},
pilot:{n:'Pilot purgatory',hp:150,spd:1.1,b:24,dmg:2,c:'#9fb4d6',shape:'halo',regen:18,
  d:'Heals 18 a second. Chip damage will never finish it, you need burst.'},
demo:{n:'Hype demo',hp:100,spd:1.4,b:16,dmg:1,c:'#ffe27a',shape:'demo',sz:.55,split:['months',3],
  d:'Dies easily and leaves three Six months later behind it.'},
months:{n:'Six months later',hp:200,spd:.9,b:24,dmg:2,c:'#b08a4a',shape:'months',armor:3,
  d:'The bill for the demo that went well. Slow, armoured, patient.'},
/* era 2 */
shadow:{n:'Shadow AI',hp:105,spd:1.8,b:20,dmg:2,c:'#6b5cff',shape:'shadow',cloak:true,
  d:'Untargetable until an observability grid has it in range. Nothing else can even see it.'},
sprawl:{n:'Agent sprawl',hp:175,spd:1.2,b:32,dmg:2,c:'#4be0a8',shape:'sprawl',spawn:['subagent',2.6],
  d:'Spawns a sub-agent every 2.6 seconds, forever, until you kill the parent.'},
subagent:{n:'Sub-agent',hp:34,spd:2.1,b:3,dmg:1,c:'#8ff0cc',shape:'sprawl',sz:.24,
  d:'Nobody registered it and nobody owns it.'},
gpu:{n:'GPU quota denied',hp:300,spd:1.0,b:44,dmg:2,c:'#ff4d5e',shape:'chip',armor:7,slowProof:true,
  d:'Armoured and immune to slows. Guardrails do nothing here.'},
vendor:{n:'Vendor lock-in',hp:230,spd:1.1,b:38,dmg:2,c:'#c98bff',shape:'lock',aura:.45,
  d:'Everything within two cells of it takes 45% less damage. Kill it first or kill nothing.'},
evalgap:{n:'Eval gap',hp:190,spd:1.3,b:34,dmg:2,c:'#8fd0ff',shape:'evalgap',onlyEval:true,
  d:'Takes 65% less damage from every defence except the eval suite. You cannot fix what you do not measure.'},
roi:{n:'ROI demand',hp:70,spd:2.0,b:12,dmg:3,c:'#ffd84b',shape:'roi',
  d:'Fast, and costs three sanity if it reaches you.'},
/* era 3 */
inject:{n:'Prompt injection',hp:130,spd:1.6,b:22,dmg:2,c:'#ff4d7a',shape:'inject',hijack:true,
  d:'Hijacks the first four defences it walks past for four seconds each. Do not line your towers along one stretch.'},
swamp:{n:'Data swamp',hp:360,spd:.85,b:46,dmg:3,c:'#7a8f52',shape:'swamp',armor:5,slowProof:true,sludge:true,
  d:'Leaves sludge that makes every tower standing in it fire 70% slower.'},
deprec:{n:'Deprecation notice',hp:150,spd:1.5,b:24,dmg:2,c:'#ff7a3c',shape:'sunset',sunset:true,
  d:'Sunsets the first four towers it passes for five seconds each. The model you built on is going away.'},
frozen:{n:'The frozen middle',hp:480,spd:.6,b:58,dmg:3,c:'#a8c4e0',shape:'frozen',armor:18,
  d:'Eighteen flat armour. Small hits bounce off entirely. Only the governance council ignores it.'},
aiwash:{n:'AI washing',hp:140,spd:1.4,b:26,dmg:2,c:'#d8c4ff',shape:'mask',mimic:true,
  d:'Disguised as something else until you hit it. Then it drops the act and speeds up.'},
pii:{n:'PII leak',hp:95,spd:2.2,b:16,dmg:4,c:'#ff5ca8',shape:'leak',
  d:'Four sanity if it lands. Fast and thin, so it slips past slow defences.'},
residency:{n:'Data residency',hp:320,spd:1.0,b:42,dmg:2,c:'#63c9ff',shape:'globe',armor:10,antiPierce:true,
  d:'Ten armour that the governance council cannot pierce. Raw damage only.'},
drift:{n:'Model drift',hp:165,spd:.95,b:26,dmg:2,c:'#5fe0ff',shape:'drift',accel:.16,
  d:'Starts slow and keeps accelerating. The longer it lives the harder it is to stop.'},
/* era 4 */
silent:{n:'Silent regression',hp:170,spd:1.5,b:30,dmg:2,c:'#b6c6dd',shape:'flatline',noAoE:true,
  d:'Immune to splash and chain damage. Only single target fire touches it.'},
oncall:{n:'3am page',hp:90,spd:2.4,b:16,dmg:2,c:'#ff9f43',shape:'pager',page:true,
  d:'Stuns the first five defences it passes for two and a half seconds each. Very fast.'},
redteam:{n:'Red team finding',hp:70,spd:2.6,b:14,dmg:3,c:'#ff3b4e',shape:'flag',slowProof:true,
  d:'Immune to slows and quicker than anything else on the board.'},
legacyai:{n:'The model nobody retires',hp:420,spd:.8,b:52,dmg:3,c:'#8c9bb5',shape:'v1',armor:8,split:['months',2],
  d:'Still serving traffic, still unmonitored. Leaves two Six months later when it finally dies.'},
attrition:{n:'Attrition',hp:160,spd:1.7,b:28,dmg:2,c:'#ffd0a0',shape:'exit',attrition:true,
  d:'Takes a level off the first two towers it walks past, and they do not come back. Your best people are leaving.'},
/* era 5 */
energy:{n:'Power budget',hp:210,spd:1.15,b:34,dmg:2,c:'#ffe14b',shape:'plug',towerSlow:true,
  d:'Every tower within three cells fires 80% slower while it is alive.'},
inferbill:{n:'Inference bill',hp:180,spd:1.25,b:30,dmg:3,c:'#ff8f5e',shape:'receipt',grow:16,drain:3,
  d:'Gains health every second and drains focus at the same time. It compounds.'},
trust:{n:'Trust incident',hp:150,spd:1.5,b:26,dmg:3,c:'#ff6b9d',shape:'crack',split:['pii',3],
  d:'Breaks into three PII leaks when killed. Contain it early in the lane.'},
mandate:{n:'CEO mandate',hp:110,spd:2.5,b:20,dmg:5,c:'#fff1a8',shape:'horn',slowProof:true,
  d:'Five sanity, immune to slows, and faster than your reaction time.'},
docreq:{n:'Documentation request',hp:50,spd:1.9,b:5,dmg:1,c:'#cfd8e8',shape:'doc',sz:.28,
  d:'Individually harmless. Arrives in volume.'},
/* bosses */
review:{n:'The first pilot review',hp:2600,spd:.66,b:340,dmg:4,c:'#ffd84b',shape:'review',boss:true,armor:6,sz:.78,
  spawn:['roi',4.0],power:'freeze',pcd:8,
  d:'BOSS. Freezes every defence near it for four seconds and keeps sending ROI demands.'},
board:{n:'Quarterly board review',hp:5200,spd:.62,b:520,dmg:5,c:'#ffb03c',shape:'board',boss:true,armor:10,sz:.8,
  spawn:['token',3.4],power:'freeze',pcd:7.5,drain:8,
  d:'BOSS. Budget freeze on your defences, drains 8 focus a second, and burns tokens the whole way down.'},
audit:{n:'EU AI Act audit',hp:9000,spd:.7,b:800,dmg:6,c:'#5c8dff',shape:'audit',boss:true,armor:14,sz:.82,
  slowProof:true,shield:2200,spawn:['docreq',2.6],power:'destroy',pcd:11,
  d:'BOSS. Regenerating shield, immune to slows, and permanently deletes one of your defences every eleven seconds.'},
reorg:{n:'The reorg',hp:14000,spd:.66,b:1000,dmg:6,c:'#a379ff',shape:'reorg',boss:true,armor:12,sz:.85,
  spawn:['attrition',12.0],power:'downgrade',pcd:18,
  d:'BOSS. Strips a level off the three nearest defences every eighteen seconds and sends attrition alongside it.'},
rogue:{n:'Rogue agent',hp:22000,spd:.85,b:1600,dmg:8,c:'#ff3b6b',shape:'rogue',boss:true,armor:12,sz:.88,
  drain:16,heal:30,power:'hijack',pcd:8.5,phases:[.7,.45,.2],
  d:'BOSS. Heals itself, drains focus, hijacks your three closest defences, and replicates three times on the way down.'}
};


/** Disguises "AI washing" can wear until it takes its first hit. */
export const MIMIC_POOL = ['frozen', 'gpu', 'months', 'swamp', 'residency'];
