import { WAVES, CAMPAIGN_WAVES } from './waves.js';

/**
 * The playbook. One lesson per campaign wave — clearing wave N unlocks
 * LESSONS[N - 1] permanently, and clearing all 25 unlocks the full page.
 *
 *   wave     the wave that unlocks it (1-indexed, must stay dense and sorted)
 *   threat   threat key used for the artwork thumbnail
 *   title    the lesson itself, stated flat
 *   counter  how you beat that wave in the game
 *   lesson   what the same problem looks like at work
 */
export const LESSONS = [
  { wave: 1, threat: 'hallu', title: 'Build the measurement before the model',
    counter: 'Eval suites do double damage to hallucinations and cost 65. Two cheap eval suites in era one carry you further than one expensive tower.',
    lesson: 'The first thing to fund is not a better model, it is the thing that tells you when the model is wrong. Everything downstream is guesswork without it.' },

  { wave: 2, threat: 'ctx', title: 'Volume is a different problem to difficulty',
    counter: 'Context switches arrive twelve at a time. Guardrails plus anything with splash. Never spend single-target damage on a swarm.',
    lesson: 'A hundred small interruptions cost more than one hard problem, and they need a class-level fix rather than a hundred individual ones.' },

  { wave: 3, threat: 'token', title: 'Cost is a clock, not a line item',
    counter: 'Token burn drains four focus every second it is alive. Kill it in the first third of the lane or you pay for the delay twice.',
    lesson: 'Inference spend accrues while you deliberate. A decision deferred for a quarter is a decision you already paid for.' },

  { wave: 4, threat: 'pilot', title: 'A pilot with no end date has already failed',
    counter: 'Pilot purgatory heals 18 a second, so chip damage never finishes it. Hold burst damage and commit it all at once.',
    lesson: 'Pilots do not die of their own accord. Give every one a kill date and a decision it is supposed to produce, or it will renew itself forever.' },

  { wave: 5, threat: 'review', title: 'Your first review decides whether there is a second',
    counter: 'The first pilot review freezes every defence within four cells and keeps sending ROI demands. Anything you built in one tidy cluster stops firing at the same moment.',
    lesson: 'Ninety days in, nobody is grading the architecture. Bring one number you would defend under oath, and make sure it was instrumented on day one.' },

  { wave: 6, threat: 'shadow', title: 'You cannot govern what you cannot see',
    counter: 'Nothing can target Shadow AI without an observability grid in range. Build one before era two starts, not during it.',
    lesson: 'People using personal accounts are not being disobedient, they are serving demand you did not. Inventory first, policy second.' },

  { wave: 7, threat: 'sprawl', title: 'Kill the parent, not the children',
    counter: 'Agent sprawl spawns a sub-agent every 2.6 seconds forever. Killing the children is pure wasted damage.',
    lesson: 'Every ungoverned agent is a symptom. Fix the process that keeps minting them, or you will spend the year deleting instances.' },

  { wave: 8, threat: 'gpu', title: 'Compute is rationed, expectations are not',
    counter: 'GPU quota denied is armoured and immune to slows. Guardrails do nothing here — council damage or raw router output.',
    lesson: 'Capacity is a promise you make using somebody else’s budget. Reset the expectation the week the quota lands, not the week you miss the date.' },

  { wave: 9, threat: 'vendor', title: 'Lock-in and blind spots are the same trap',
    counter: 'Vendor lock-in shields everything within two cells, so snipe it first. Eval gap takes 65% less damage from everything except the eval suite.',
    lesson: 'Both remove your ability to change your mind: one because switching is expensive, the other because you have no evidence you should. Keep an exit and keep a benchmark.' },

  { wave: 10, threat: 'board', title: 'The board is asking for one number',
    counter: 'The quarterly board review freezes your budget, drains eight focus a second, and burns tokens the whole way down. Bank focus during the build phase before it arrives.',
    lesson: 'Not a portfolio, not a roadmap. One number, attributable, with a method you can repeat next quarter. Pick it early enough that you are still collecting the data.' },

  { wave: 11, threat: 'inject', title: 'Anything the model reads, someone can write',
    counter: 'Prompt injection hijacks any defence it walks past for four seconds. Do not line your towers along one stretch of lane.',
    lesson: 'Untrusted input is input. Treat retrieved documents, tickets and web pages as hostile, and never give one line of defence the whole job.' },

  { wave: 12, threat: 'swamp', title: 'The data was never ready',
    counter: 'Data swamp leaves sludge that makes every tower standing in it fire 70% slower. Do not build your cluster on a straight it will occupy.',
    lesson: 'Data work is the project, not the prerequisite to it. Plan it as delivery with its own headcount, or it will quietly slow everything you build on top.' },

  { wave: 13, threat: 'frozen', title: 'The frozen middle is un-incentivised, not stupid',
    counter: 'Eighteen flat armour eats small hits entirely. Only the governance council ignores armour, so this is the wave that punishes skipping it.',
    lesson: 'Middle management resists because their targets were set before your project existed. Change what they are measured on and the armour comes off.' },

  { wave: 14, threat: 'residency', title: 'Some constraints cannot be routed around',
    counter: 'Data residency has ten armour that the council cannot pierce, so bring raw damage. PII leak is fast, thin and costs four sanity if it lands.',
    lesson: 'Residency, retention and consent are the shape of the build, not obstacles in front of it. Design inside them and you spend the effort once.' },

  { wave: 15, threat: 'audit', title: 'Evidence is written before the audit, not during it',
    counter: 'The EU AI Act audit regenerates its shield, ignores slows, and permanently deletes one of your defences every eleven seconds. Redundancy is the only counter.',
    lesson: 'Model cards, risk classifications and decision logs are cheap while you are building and impossible to reconstruct afterwards. Assume the register will be read.' },

  { wave: 16, threat: 'silent', title: 'The failure that raises no alert',
    counter: 'Silent regression is immune to splash and chain, so observability and routers cannot touch it. Keep single-target fire on every stretch.',
    lesson: 'Quality decays without an incident, a ticket or a complaint. Only a scheduled eval running against a fixed set notices, and only if someone reads it.' },

  { wave: 17, threat: 'oncall', title: 'Shipping it means operating it',
    counter: 'The 3am page stuns whatever it passes for two and a half seconds and moves fast. Slow it at the entrance or it walks your entire line down.',
    lesson: 'The moment a model is in a customer path it has a pager, a rota and an error budget. Staff that before launch, because the alternative is staffing it during an outage.' },

  { wave: 18, threat: 'legacyai', title: 'Budget the decommission with the launch',
    counter: 'The model nobody retires is armoured and leaves two Six months later behind it. Kill it early so the children still have the whole lane to walk.',
    lesson: 'Every system you ship joins a list nobody is funded to shorten. Name the owner and the retirement trigger on the day it goes live.' },

  { wave: 19, threat: 'attrition', title: 'The capability lives in people',
    counter: 'Attrition strips a level off every tower it walks past. Put your upgraded defences one cell back from the lane, not beside it.',
    lesson: 'Two resignations can undo a year of platform work. Spread the knowledge deliberately — the alternative is discovering the single point of failure by losing it.' },

  { wave: 20, threat: 'reorg', title: 'When it is everyone’s job, make sure it is still someone’s',
    counter: 'The reorg strips a level off every defence in range and sends attrition alongside it. Nothing survives being concentrated in one place.',
    lesson: 'Broad AI mandates dissolve ownership. Keep a named owner for evals, for incidents and for the model register, whatever the org chart does around them.' },

  { wave: 21, threat: 'inferbill', title: 'Unit economics are set at design time',
    counter: 'The inference bill gains health every second while draining your focus. It is the one threat where killing it fast is literally cheaper than killing it well.',
    lesson: 'Model choice, context size and retry policy decide the margin, and they are chosen months before finance ever sees a bill. Price the request, not the month.' },

  { wave: 22, threat: 'demo', title: 'The distance between demo and production is the budget',
    counter: 'Hype demos die easily and leave three Six months later behind. AI washing needs one hit to strip the disguise before you know what you are fighting.',
    lesson: 'A demo skips evaluation, latency, failure modes and support. Quote the gap honestly the first time it is shown, because nobody will hear it later.' },

  { wave: 23, threat: 'trust', title: 'One incident costs more than a year of features earns',
    counter: 'A trust incident breaks into three PII leaks when killed. Contain it in the first half of the lane or you are defending four things at once.',
    lesson: 'Adoption is the scarce resource, and it is spent instantly. Rate of recovery — disclosure, fix, evidence — matters more than the original defect.' },

  { wave: 24, threat: 'inject', title: 'You are judged on your worst lane',
    counter: 'Everything at once: armour, pierce-proof armour, splash immunity and hijacks in the same wave. Coverage beats optimisation here.',
    lesson: 'A mature AI function is graded on the weakest system it owns, not the best one it demos. Breadth of basic controls beats depth in one showcase.' },

  { wave: 25, threat: 'rogue', title: 'Autonomy scales your worst decision as fast as your best',
    counter: 'The rogue agent heals, drains focus, hijacks your three closest defences and replicates three times on the way down. Damage has to already be spread across the whole lane.',
    lesson: 'Give anything that acts on its own a bounded scope, a logged trail and a stop button somebody is willing to press. Design that in at the start — by wave 25 there is no time to build it.' },
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
