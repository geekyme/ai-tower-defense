/**
 * Defences the player can build.
 *
 * Every tower is the *only* answer to at least one threat, so balance changes
 * here should be checked against `data/threats.js` and `data/lessons.js`.
 *
 * Fields
 *   cost      focus to place
 *   dmg/rate  damage per shot, seconds between shots
 *   range     radius in grid cells
 *   kind      bullet | beam | chain | nova
 *   bonusFam  double damage against threats whose `fam` matches
 */
export const TOWERS={
  evalsuite:{name:'Eval suite',cost:65,col:'#ffc24b',dmg:8,rate:.24,range:2.2,kind:'bullet',vel:15,
    bonusFam:'hallu',bonus:2.0,
    blurb:'Cheap and relentless. Double damage to anything the model invented, and the only thing an eval gap respects.'},
  guardrail:{name:'Guardrails',cost:100,col:'#6ee7a0',dmg:7,rate:.55,range:2.7,kind:'bullet',vel:11,slow:.5,slowDur:2.2,
    blurb:'Barely damages anything. Slows what it can hit so everything else gets a second shot.'},
  observ:{name:'Observability grid',cost:165,col:'#35e6d5',dmg:26,rate:.95,range:2.8,kind:'bullet',vel:10,splash:1.0,reveal:true,
    blurb:'Splash damage, and the only thing that can see Shadow AI or unregistered agents.'},
  router:{name:'Model router',cost:200,col:'#ff8a4b',dmg:24,rate:1.05,range:3.0,kind:'chain',chain:4,falloff:.74,
    blurb:'Arcs across four targets. Best value against crowds, useless against anything that hides in one.'},
  council:{name:'Governance council',cost:250,col:'#a379ff',dmg:118,rate:1.75,range:5.0,kind:'beam',pierceArmor:true,
    blurb:'Slow and expensive. Ignores armour entirely, so it is your answer to the frozen middle.'},
  killswitch:{name:'Kill switch',cost:360,col:'#ff6b6b',dmg:175,rate:4.5,range:2.7,kind:'nova',nova:2.3,stun:1.3,
    blurb:'Detonates a whole area and stuns the survivors. One is a plan, three is a budget problem.'}
};
export const TOWER_KEYS=Object.keys(TOWERS);
TOWER_KEYS.forEach(k=>TOWERS[k].key=k);

/** Long-form shop copy: what each defence is for, and what it cannot do. */
export const TOWER_NOTES={
 evalsuite:{
  tags:['single target','2\u00d7 hallucinations','beats eval gap'],
  good:'Hallucinations, confident citations, and the eval gap, which ignores every other defence. Cheap enough to build three of.',
  weak:'Armour. Eight damage a shot means the frozen middle and legacy models take one point per hit.',
  hint:'Place early, place several. Long stretches of lane suit it because it fires four times a second.'},
 guardrail:{
  tags:['slows 50%','2.2s duration','low damage'],
  good:'Holding a crowd inside somebody else\u2019s kill zone. It multiplies every tower around it.',
  weak:'GPU quota, data swamp, red team findings, CEO mandates and the audit boss all ignore slows completely.',
  hint:'Worthless alone. Put it just before a cluster of damage, not at the end of the lane.'},
 observ:{
  tags:['splash 1.0','reveals invisible','area damage'],
  good:'Shadow AI, sub-agents and any wave that arrives in volume. Nothing else on the board can even target a cloaked threat.',
  weak:'Silent regression is immune to splash. Its damage is wasted on single armoured targets.',
  hint:'You need at least one covering the lane by era two, and its reveal only works inside its own range.'},
 router:{
  tags:['chains 4','\u221226% per jump','crowd damage'],
  good:'Dense packs moving together. Four arcs from one shot is the best focus-per-damage on the board.',
  weak:'Chains skip silent regression and anything invisible. Against a lone boss it is a weak single target tower.',
  hint:'Put it where the lane doubles back, so one shot can reach two rows of threats at once.'},
 council:{
  tags:['ignores armour','5 cell range','slow rate'],
  good:'The frozen middle, the model nobody retires, and every boss. Armour is subtracted before damage for everyone else, not for this.',
  weak:'Data residency is built to survive pierce, so its ten armour still applies. One shot every 1.75 seconds means swarms walk past it.',
  hint:'Its five cell range covers several bends. Place it centrally rather than beside the lane.'},
 killswitch:{
  tags:['nova 2.3','1.3s stun','very expensive'],
  good:'A lane about to break. It detonates everything in the blast and stuns the survivors long enough to recover.',
  weak:'Silent regression takes nothing from it, and bosses are immune to the stun. One shot every 4.5 seconds.',
  hint:'Buy it last. Position it over the section that leaks, not the section you are already holding.'}
};
