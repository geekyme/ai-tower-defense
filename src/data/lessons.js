import { WAVES, CAMPAIGN_WAVES } from './waves.js';

/**
 * The playbook. One lesson per campaign wave: clearing wave N unlocks
 * LESSONS[N - 1] permanently, and clearing all 25 unlocks the full page.
 *
 *   wave     the wave that unlocks it (1-indexed, must stay dense and sorted)
 *   threat   threat key used for the artwork thumbnail
 *   title    the lesson itself, stated flat
 *   counter  how you beat that wave, in two sentences and no more
 *   lesson   the call the same problem asks a head of AI to make
 *
 * Every number quoted in `counter` comes from data/threats.js, data/towers.js
 * or core/config.js. Change one of those and the advice here has to move too.
 */
export const LESSONS = [
  { wave: 1, threat: 'hallu', title: 'Build the measurement before the model',
    counter: 'Eval suites cost 65 and do double damage to anything the model invented, so open with four of them. Kill each hallucination early, because it splits into two faster citations.',
    lesson: 'Fund the eval set before the model upgrade. Fifty labelled cases from real traffic, owned by a named person, is what turns “it feels better” into something you can put in front of a board. Until that exists you cannot approve a model change, size a regression, or justify a rollback.' },

  { wave: 2, threat: 'ctx', title: 'Volume is a different problem to difficulty',
    counter: 'Twelve context switches arrive a third of a second apart and weave as they walk. Single target fire misses most of them, so buy area damage and use guardrails to hold the pack inside it.',
    lesson: 'The expensive AI problem in most companies is not the hard one, it is the thousand small ones. Fund the fix at the level of the category rather than letting nine teams each automate their own copy of it. Your leverage is the shared layer: retrieval, identity, logging, the same three things everyone is otherwise rebuilding.' },

  { wave: 3, threat: 'token', title: 'Cost is a clock, not a line item',
    counter: 'Token burn drains four focus a second while it lives, the same rate you earn by starting a wave early. Put the damage at the entrance, not the exit.',
    lesson: 'Inference accrues while you deliberate, so a decision deferred a quarter is already paid for. Ask for cost per request per feature, because a monthly total never tells you which product to go and fix. Set the threshold that triggers a design review, and give the number to the team that owns the feature.' },

  { wave: 4, threat: 'pilot', title: 'A pilot with no end date has already failed',
    counter: 'Pilot purgatory heals about eighteen a second, so anything slower than that achieves nothing. Overlap two or three towers on one stretch and slow it while it stands in them.',
    lesson: 'Every pilot needs a kill date and the decision it exists to produce, both written down before it starts. Without those you will be running nine of them next year and still be asked what shipped. Cancel two publicly and the rest of the portfolio starts believing your dates.' },

  { wave: 5, threat: 'review', title: 'Your first review decides whether there is a second',
    counter: 'The first pilot review freezes every defence within about four cells, every eight seconds. Two clusters at opposite ends of the lane means it can only silence half your board at a time.',
    lesson: 'Ninety days in, nobody is grading the architecture. Bring one number with a method you can repeat, instrumented before the work started rather than the week before the meeting. If you genuinely do not have one, say what you now know and what it costs to find out, because a vague answer here sets your budget for the year.' },

  { wave: 6, threat: 'shadow', title: 'You cannot govern what you cannot see',
    counter: 'Nothing can target Shadow AI unless an observability grid has it in range at that moment. Build the grid in the break before the wave, not while six invisible threats are walking.',
    lesson: 'People on personal accounts are serving demand you have not met. Inventory first, tool by tool: whose account, which data, connected to what. Then give the top three uses a sanctioned path inside a quarter, because a ban with no substitute just moves the traffic somewhere you cannot see it.' },

  { wave: 7, threat: 'sprawl', title: 'Kill the parent, not the children',
    counter: 'Agent sprawl spawns a sub-agent every 2.6 seconds forever, so damage spent on the children buys nothing. Kill the parents and accept the one sanity each child costs you.',
    lesson: 'Every ungoverned agent is a process failure rather than a user failure. Put in a registry, an owner field and a deployment gate, or you will spend the year deleting instances that teams rebuild in a week. What you need to control is who can put an agent in front of a customer, not who can experiment.' },

  { wave: 8, threat: 'gpu', title: 'Compute is rationed, expectations are not',
    counter: 'GPU quota is armoured and immune to slows, and armour comes off every individual hit. Bring fewer, bigger hits: the council ignores armour and a router still lands seventeen per arc.',
    lesson: 'Capacity is a promise you make out of somebody else’s budget, so reset the expectation the week the quota lands. Publish which use cases get compute and which ones wait, with your name against the order. Declining to rank them means everything slips and you own the aggregate.' },

  { wave: 9, threat: 'vendor', title: 'Lock-in and blind spots are the same trap',
    counter: 'Vendor lock-in gives everything within two cells 45% resistance but never protects itself, so shoot it first. The eval gap ignores every defence except an eval suite.',
    lesson: 'Know your cost of leaving before the renewal rather than during it. Keep one benchmark that runs against a second provider, and one workload portable enough to prove the number is real. A tested exit is the only leverage you take into that negotiation.' },

  { wave: 10, threat: 'board', title: 'The board is asking for one number',
    counter: 'The board review drains eight focus a second, so your income during this wave is effectively zero. Buy everything before it lands, and start the wave early to bank the unused build time at four a second.',
    lesson: 'One number, not a portfolio and not a roadmap. Choose it two quarters out so the instrumentation exists by the time the meeting arrives. Use the same method every quarter, including the quarters when the number is bad, because changing the method is how you lose the room.' },

  { wave: 11, threat: 'inject', title: 'Anything the model reads, someone can write',
    counter: 'Prompt injection hijacks any defence it passes for four seconds, once per tower. Seven of them along one stretch silence the same towers over and over, so spread across separate bends.',
    lesson: 'Treat retrieved documents, tickets and emails as attacker controlled, because that is what they are. Scope tool permissions so a hijacked agent cannot move money, mail a customer or delete anything, and put a human step in front of whatever is irreversible. This is the risk that turns a product incident into a security one, so it belongs on your register with an owner.' },

  { wave: 12, threat: 'swamp', title: 'The data was never ready',
    counter: 'Data swamp is armoured, immune to slows, and drops sludge that adds 70% to the cooldown of any tower standing in it. Do not build your cluster on the straight it walks.',
    lesson: 'Data work is delivery, so fund it with headcount and dates instead of calling it a prerequisite. Skip that and your model teams spend half their time on pipelines, which reaches the board as slow progress rather than as a staffing decision you did not make. Put it on the roadmap with a name against it.' },

  { wave: 13, threat: 'frozen', title: 'The frozen middle is un-incentivised, not stupid',
    counter: 'Eighteen flat armour comes off every hit, so eval suites and guardrails land one point a shot. Only the council ignores armour, though a kill switch still lands 157 once every 4.5 seconds.',
    lesson: 'Middle managers resist because their targets were set before your project existed. The fix sits with their manager: change what gets measured, or accept the pace and plan around it. Roadshows and training move nobody whose bonus still depends on the old number.' },

  { wave: 14, threat: 'residency', title: 'Some constraints cannot be routed around',
    counter: 'Data residency carries ten armour that the council specifically cannot pierce, so bring raw damage instead. Keep something fast on the PII leaks travelling with it at four sanity each.',
    lesson: 'Residency, retention and consent are the shape of the build, not obstacles in front of it. Settle where data lives and how long it stays before you choose an architecture, because retrofitting either one is a rebuild. Put legal in the design review instead of the launch review and you pay that cost once.' },

  { wave: 15, threat: 'audit', title: 'Evidence is written before the audit, not during it',
    counter: 'The audit regrows its shield after three seconds without damage, so never let your fire stop. Every eleven seconds it deletes the nearest defence in range, so park something cheap closer to the lane than your council.',
    lesson: 'Model cards, risk classifications and decision logs are cheap during the build and impossible to reconstruct afterwards. The EU AI Act expects high risk systems to generate automatic logs, hold technical documentation and be registered before they go into service. Give the register to a person rather than a team, and assume it gets read by someone who is not on your side.' },

  { wave: 16, threat: 'silent', title: 'The failure that raises no alert',
    counter: 'Silent regression is immune to splash and chain, so the grid, the router and the kill switch cannot touch it. Eval suites, guardrails and the council are the only three that land.',
    lesson: 'Quality decays without failing, so nothing pages anyone. Schedule an eval against a fixed set, route the result to a named person, and treat a drop as an incident rather than as a chart. Refresh the set as traffic shifts, or you are grading last year’s product.' },

  { wave: 17, threat: 'oncall', title: 'Shipping it means operating it',
    counter: 'The 3am page stuns anything within about a cell for two and a half seconds, eight times in a row. Sit your towers a cell further back, and do not rely on slows: red team findings ignore them.',
    lesson: 'A model in a customer path needs a rota, an error budget and a documented fallback. Fund all three in the launch business case, because they do not become optional later. If the person on call cannot switch the fallback on without waking you, you do not have one.' },

  { wave: 18, threat: 'legacyai', title: 'Budget the decommission with the launch',
    counter: 'The model nobody retires is armoured and leaves two Six months later behind when it dies. Kill it in the first third of the lane so that pair still has the full walk ahead of it.',
    lesson: 'Name the owner and the retirement trigger on the day it goes live, and put the decommission in the same budget as the launch. Otherwise version one keeps serving traffic that nobody monitors and nobody is paid to move. A capped number of systems you agree to run constrains the estate better than any architecture review.' },

  { wave: 19, threat: 'attrition', title: 'The capability lives in people',
    counter: 'Attrition strips a level off any tower within about a cell, and cannot touch a level one at all. Keep upgraded towers two cells back and let cheap ones hold the edge.',
    lesson: 'Two resignations can undo a year of platform work. Rotate the on-call, require review across team boundaries, and pay for the documentation nobody volunteers to write. Your single point of failure is usually a person, and the normal way to find them is to lose them.' },

  { wave: 20, threat: 'reorg', title: 'When it is everyone’s job, make sure it is still someone’s',
    counter: 'The reorg downgrades every defence within about four cells, every ten seconds. Spend on new towers rather than upgrades while it is alive, because levels are the only thing it can take.',
    lesson: 'Once AI is everyone’s job it stops being anyone’s. Keep named owners for evals, for incidents and for the model register, and re-confirm them in writing after each reorg. Ownership that exists only in the org chart disappears with the org chart.' },

  { wave: 21, threat: 'inferbill', title: 'Unit economics are set at design time',
    counter: 'The inference bill gains sixteen health a second and drains focus the whole time, so killing it fast beats killing it well. Keep your towers three cells clear of the power budget walking with it.',
    lesson: 'Margin is decided by model choice, context size and retry policy, all fixed months before finance sees a bill. Long context on every call multiplies cost by your traffic, which is how the cheap feature becomes the expensive one at scale. Price the request first, then decide what you can afford to put inside it.' },

  { wave: 22, threat: 'demo', title: 'The distance between demo and production is the budget',
    counter: 'Hype demos die to almost anything and leave three armoured Six months later apiece. The wave is the eighteen that follow, not the six you killed.',
    lesson: 'A demo skips evaluation, latency, failure modes, security review and support. Say the size of that gap the first time it is shown, because after the applause nobody hears it. Production routinely lands at several times the pilot estimate, so repeating the pilot figure is a promise you will end up breaking.' },

  { wave: 23, threat: 'trust', title: 'One incident costs more than a year of features earns',
    counter: 'Every trust incident breaks into three PII leaks at four sanity each. Contain them in the first half of the lane or you are defending eighteen of them in the second.',
    lesson: 'Adoption is your scarce resource and it is spent instantly. Rehearse the recovery now: who discloses, how fast, and what evidence follows, because that sequence costs less than the defect did. Usage falls before anyone complains, so watch the curve rather than the inbox.' },

  { wave: 24, threat: 'inject', title: 'You are judged on your worst lane',
    counter: 'Armour, pierce-proof armour, splash immunity and hijacking all arrive in the same wave. One of everything spread along the lane beats three levelled copies of your best tower.',
    lesson: 'You are judged on the weakest system you own, not the best one you demo. Go and look at whatever nobody has touched since it launched, because that is where the audit finding and the incident both begin. Breadth of basic controls beats depth in one showcase.' },

  { wave: 25, threat: 'rogue', title: 'Autonomy scales your worst decision as fast as your best',
    counter: 'The rogue agent heals thirty a second and always hijacks the three closest defences. Leave something cheap near its path and keep your real damage back at council range.',
    lesson: 'Anything that acts on its own needs a bounded scope, a logged trail and a stop button somebody is willing to press. Decide in advance who holds that authority and what evidence they need to use it, because the middle of an incident is too late to work out. Autonomy scales your worst decision at exactly the speed of your best.' },
];

/** Invariant: exactly one lesson per campaign wave, in order. */
if (LESSONS.length !== CAMPAIGN_WAVES || LESSONS.some((l, i) => l.wave !== i + 1)) {
  console.warn('lessons.js is out of sync with waves.js');
}

/** Era index (0-4) a lesson belongs to, for grouping on the lessons page. */
export function lessonEra(lesson) {
  return WAVES[lesson.wave - 1].e;
}

export function lessonForWave(wave) {
  return LESSONS[wave - 1] || null;
}
