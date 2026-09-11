import { WAVES, CAMPAIGN_WAVES } from './waves.js';

/**
 * The playbook. One lesson per campaign wave: clearing wave N unlocks
 * LESSONS[N - 1] permanently, and clearing all 25 unlocks the full page.
 *
 *   wave     the wave that unlocks it (1-indexed, must stay dense and sorted)
 *   threat   threat key used for the artwork thumbnail
 *   title    the lesson itself, stated flat
 *   counter  how you beat that wave in the game
 *   lesson   what the same problem looks like at work
 *
 * Every number quoted in `counter` comes from data/threats.js, data/towers.js
 * or core/config.js. Change one of those and the advice here has to move too.
 */
export const LESSONS = [
  { wave: 1, threat: 'hallu', title: 'Build the measurement before the model',
    counter: 'Eval suites cost 65 and do double damage to anything the model invented, so four of them fit inside your opening 300 focus. Every hallucination splits into two faster citations when it dies, and those carry the same weakness. Kill the parent early in the lane so the pair still has to walk your whole line.',
    lesson: 'The first thing to fund is not a better model, it is the thing that tells you when the model is wrong. Write down what a good answer looks like on fifty real cases before you tune anything, because that set is the only evidence you will have when someone asks whether it improved. Without it, every review turns into an argument about impressions, and the loudest reviewer wins.' },

  { wave: 2, threat: 'ctx', title: 'Volume is a different problem to difficulty',
    counter: 'Twelve context switches arrive a third of a second apart and weave while they walk, so single target fire wastes most of its shots on empty lane. Guardrails hold the pack inside somebody else’s kill zone, but seven damage a shot means they never kill anything on their own. Save for the observability grid or the router, because area damage is the only thing that scales with the size of a crowd.',
    lesson: 'A hundred small interruptions cost more than one hard problem, and they need a fix at the level of the category rather than a hundred separate ones. Look for the shared cause behind them: one broken handoff, one missing field, one tool nobody can find. Fixing the class once is cheaper than fixing any single instance well.' },

  { wave: 3, threat: 'token', title: 'Cost is a clock, not a line item',
    counter: 'Token burn drains four focus every second it is alive, which is exactly the rate you earn back by starting a wave early. Six of them walking together drain faster than the wave will pay out when it clears. Put your damage near the entrance rather than the exit, because the fee is charged for the whole walk, not the last step of it.',
    lesson: 'Inference spend accrues while you deliberate, so a decision deferred for a quarter is a decision you already paid for. Track cost per request next to each feature that calls a model, because a monthly total hides which request is doing the bleeding. Set a spend ceiling that triggers a review rather than an incident.' },

  { wave: 4, threat: 'pilot', title: 'A pilot with no end date has already failed',
    counter: 'Pilot purgatory heals about eighteen a second, so any defence dealing less than that is dealing nothing at all. Overlap two or three towers on the same stretch so their damage lands in the same window instead of in shifts. Guardrails earn their cost here by holding it inside that overlap for an extra two seconds.',
    lesson: 'Pilots do not die of their own accord, they renew. Give every one a kill date and a decision it is meant to produce, both written down before it starts. The pilots that never reach production are usually the ones that were given a budget but never a definition of finished.' },

  { wave: 5, threat: 'review', title: 'Your first review decides whether there is a second',
    counter: 'The first pilot review freezes every defence within about four cells for four seconds, and it does that every eight seconds. Anything you built as one tidy cluster stops firing at the same moment, so split your line into two groups at opposite ends of the lane. The ROI demands it keeps sending cost three sanity each, and that is what actually ends the run.',
    lesson: 'Ninety days in, nobody is grading the architecture. Bring one number you would defend under oath and the method you used to get it. It has to be instrumented from day one, because a metric assembled the week before the review reads exactly like a metric assembled the week before the review.' },

  { wave: 6, threat: 'shadow', title: 'You cannot govern what you cannot see',
    counter: 'Shadow AI cannot be targeted by anything until an observability grid has it inside its own range, and the reveal ends the moment it walks back out. One grid covering a single bend leaves the rest of the lane blind, and nothing else on the board can see for it. Build it in the break after wave 5, not while six invisible threats are already moving.',
    lesson: 'People on personal accounts are not being disobedient, they are serving demand you did not. Inventory before policy: which tool, whose account, what data, connected to what. Giving people an approved alternative cuts unsanctioned use far more reliably than a ban, because the underlying need does not disappear when the policy lands.' },

  { wave: 7, threat: 'sprawl', title: 'Kill the parent, not the children',
    counter: 'Agent sprawl spawns a sub-agent every 2.6 seconds and never stops, so damage spent on the children buys you nothing at all. Put everything into the parents and accept the small ones reaching you, since each costs one sanity and killing the source ends the supply. Three parents alive at once out-produce any board you can afford at wave 7.',
    lesson: 'Every ungoverned agent is a symptom of a process that keeps minting them. Fix the intake, the registry and who is allowed to deploy, or you will spend the year deleting instances. The useful question is who owns the next one, not who cleans up the last one.' },

  { wave: 8, threat: 'gpu', title: 'Compute is rationed, expectations are not',
    counter: 'GPU quota is armoured and immune to slows, so guardrails contribute nothing and each eval suite shot lands for a single point. Armour is subtracted from every individual hit, which makes a few large hits worth far more than many small ones. The council ignores armour outright, and even a level one router still puts seventeen through per arc.',
    lesson: 'Capacity is a promise you make using somebody else’s budget. Reset the expectation the week the quota lands, not the week you miss the date. Say out loud which use case gets the compute and which one waits, because refusing to choose means both of them slip.' },

  { wave: 9, threat: 'vendor', title: 'Lock-in and blind spots are the same trap',
    counter: 'Vendor lock-in gives everything within two cells 45% damage reduction, but it does not protect itself, so it is the easiest target in its own group. Kill it first and the rest of the wave stops soaking your board. The eval gap ignores 65% of the damage from every defence except the eval suite, at any level, so keep one on every stretch you defend.',
    lesson: 'Both of these remove your ability to change your mind: one because switching is expensive, the other because you have no evidence you should. Keep an exit that has actually been tested and a benchmark that runs against more than one provider. The cost of leaving is a number to know before the renewal conversation, not during it.' },

  { wave: 10, threat: 'board', title: 'The board is asking for one number',
    counter: 'The quarterly board review drains eight focus a second and keeps spawning token burn, so your income for this wave is effectively zero. Everything you intend to spend has to be on the board before it arrives, and unused build time converts at four focus a second when you start the wave early. Its budget freeze fires every seven and a half seconds, so two separated clusters keep half your damage alive through each one.',
    lesson: 'One number, not a portfolio and not a roadmap. Make it attributable, with a method you can repeat next quarter without renegotiating what it means. Pick it early enough that you are still collecting the data, because the reporting date is fixed and your instrumentation is not.' },

  { wave: 11, threat: 'inject', title: 'Anything the model reads, someone can write',
    counter: 'Prompt injection hijacks any defence it passes within about one cell for four seconds, once per tower per threat. Seven of them walking the same stretch will silence the same tower seven times over while the rest of the lane goes unwatched. Spread your damage across separate bends so a hijacked cluster is never the only thing covering the board.',
    lesson: 'Untrusted input is input. Treat retrieved documents, tickets, emails and web pages as hostile, and scope the model’s tools so a successful injection cannot reach much. The accepted answer is layered: separate instructions from content, give least privilege to every tool, and require a human approval step for anything irreversible.' },

  { wave: 12, threat: 'swamp', title: 'The data was never ready',
    counter: 'Data swamp drops sludge as it walks, and each patch adds 70% to the cooldown of any tower standing in it for the next seven seconds. It is armoured and immune to slows, so the long straight it occupies is the worst possible place to have built your cluster. Deprecation notices travel with it and sunset any tower they pass for five seconds, which is why one defence per stretch is never enough.',
    lesson: 'Data work is the project, not the prerequisite to it. Plan it as delivery, with its own headcount and its own dates, or it will quietly slow everything built on top of it. The cost turns up anyway, as every model team spending half its time on pipelines nobody scheduled.' },

  { wave: 13, threat: 'frozen', title: 'The frozen middle is un-incentivised, not stupid',
    counter: 'Eighteen flat armour comes off every hit, so eval suites and guardrails both land one point a shot no matter how many you own. The governance council is the only defence that ignores armour, which makes this the wave that punishes skipping it; a kill switch still lands 157 after armour but only fires once every 4.5 seconds. AI washing arrives in the same wave disguised as something worse, so hit it once to find out what it really is before you rebuild around it.',
    lesson: 'Middle management resists because their targets were set before your project existed. Change what they are measured on and the armour comes off, which is a conversation with their manager rather than with them. Training and enthusiasm move nobody whose bonus still depends on the old number.' },

  { wave: 14, threat: 'residency', title: 'Some constraints cannot be routed around',
    counter: 'Data residency carries ten armour that the council specifically cannot pierce, so your most expensive defence is the wrong tool for this one. Bring raw damage instead: a levelled kill switch or router beats the beam here. PII leaks cost four sanity each and move fast, and model drift accelerates the whole way down, so nothing in this wave rewards waiting.',
    lesson: 'Residency, retention and consent are the shape of the build, not obstacles in front of it. Decide where data lives and how long it stays before you choose an architecture, because retrofitting either one means rebuilding. Design inside them once and you stop paying an exception tax on every launch after this.' },

  { wave: 15, threat: 'audit', title: 'Evidence is written before the audit, not during it',
    counter: 'The audit regenerates its shield after three seconds without damage, so any gap in your fire hands back work you already paid for. Every eleven seconds it deletes the nearest defence within about four and a half cells, and that one is gone for the rest of the wave. Keep something cheap closer to the lane than your council, because it always takes whatever is nearest first.',
    lesson: 'Model cards, risk classifications and decision logs are cheap while you are building and impossible to reconstruct afterwards. The EU AI Act expects high risk systems to generate automatic logs, hold technical documentation, and be registered before they go into service. Assume the register will be read by someone who was not in the room when the decisions were made.' },

  { wave: 16, threat: 'silent', title: 'The failure that raises no alert',
    counter: 'Silent regression is immune to splash and chain, so the observability grid, the router and the kill switch cannot damage it at all. Eval suites, guardrails and the council are the only three defences that register, and the same wave carries an eval gap that only the eval suite can hurt. A board built entirely from area damage by now lets six of these walk through untouched.',
    lesson: 'Quality decays without an incident, a ticket or a complaint, because nothing technically failed. Only a scheduled eval against a fixed set notices, and only if somebody actually reads the result. Refresh that set as your traffic changes, since last year’s golden set measures a product you no longer have.' },

  { wave: 17, threat: 'oncall', title: 'Shipping it means operating it',
    counter: 'The 3am page stuns every defence within about one cell of it for two and a half seconds, and eight arrive one after another. Move your towers a cell further back where range allows, because the stun needs proximity and most of your reach is wasted hugging the lane. Red team findings come with them, faster than anything else in the game and immune to slows, so guardrails will not buy you the time.',
    lesson: 'The moment a model sits in a customer path it has a pager, a rota and an error budget. Staff that before launch, because the alternative is staffing it during an outage with whoever picks up. Decide in advance what the fallback is when the model is wrong or slow, and make sure the person on call can switch it on alone.' },

  { wave: 18, threat: 'legacyai', title: 'Budget the decommission with the launch',
    counter: 'The model nobody retires is armoured and leaves two Six months later behind when it dies, each armoured in turn. Kill it in the first third of the lane so that pair still has the whole walk ahead of them rather than a head start. Data swamp is in this wave too, so the towers doing that work should not be the ones standing in sludge.',
    lesson: 'Every system you ship joins a list nobody is funded to shorten. Name the owner and the retirement trigger on the day it goes live, and put the decommission work in the same budget as the launch. Version one keeps serving traffic long after everyone agrees it should not, because switching it off is always somebody’s unpaid weekend.' },

  { wave: 19, threat: 'attrition', title: 'The capability lives in people',
    counter: 'Attrition strips a level off every defence it walks within roughly one cell of, and it cannot touch a level one tower at all. Keep your upgraded towers two cells back from the lane and let cheap unupgraded ones hold the edge, since they have nothing left to lose. Six of them in one wave can undo every upgrade you bought since wave 15.',
    lesson: 'Two resignations can undo a year of platform work. Spread the knowledge on purpose: write the runbook, rotate the on-call, have people review each other’s pipelines. The alternative is discovering the single point of failure by losing it.' },

  { wave: 20, threat: 'reorg', title: 'When it is everyone’s job, make sure it is still someone’s',
    counter: 'The reorg strips a level off every defence within about four cells every ten seconds and sends attrition alongside it, so the downgrades keep coming. Spend on new towers rather than upgrades while it is on the board, because levels are the only thing either of them can take. Fourteen context switches follow it in, and that is the part that actually reaches your sanity while you are busy with the boss.',
    lesson: 'Broad AI mandates dissolve ownership, because a job that belongs to everyone appears on nobody’s calendar. Keep a named owner for evals, for incidents and for the model register, whatever the org chart does around them. Ownership survives a reorg only when it is written somewhere other than the org chart.' },

  { wave: 21, threat: 'inferbill', title: 'Unit economics are set at design time',
    counter: 'The inference bill gains sixteen health a second while draining three focus, so a slow kill costs you twice over. It is the one threat where killing it fast is literally cheaper than killing it well. Power budget arrives with it and adds 80% to the cooldown of every tower within three cells, so your damage is at its weakest exactly while the bill compounds.',
    lesson: 'Model choice, context size and retry policy decide the margin, and all three are fixed months before finance ever sees a bill. Context is the quiet one, because a long prompt on every call multiplies cost by your traffic rather than by your feature count. Price the request first, then decide what you can afford to put inside it.' },

  { wave: 22, threat: 'demo', title: 'The distance between demo and production is the budget',
    counter: 'Hype demos have a hundred health and die to almost anything, then leave three armoured Six months later apiece. Six demos become eighteen of them, on top of the eight already in the wave, so the real fight starts after the easy kills. AI washing needs one hit to drop its disguise, so tag it early rather than planning your board around a threat that was never there.',
    lesson: 'A demo skips evaluation, latency, failure modes, security review and support. Quote that gap the first time it is shown, because nobody will hear it after the applause. Production regularly costs several times the pilot estimate, so repeating the pilot number is a promise you will end up breaking.' },

  { wave: 23, threat: 'trust', title: 'One incident costs more than a year of features earns',
    counter: 'Every trust incident breaks into three PII leaks when it dies, and each leak costs four sanity if it reaches you. Kill them in the first half of the lane or you are defending eighteen fast leaks in the half that is left. Ten more PII leaks arrive on their own, so a board built for slow armoured targets loses this wave outright.',
    lesson: 'Adoption is the scarce resource, and it is spent instantly. Rate of recovery matters more than the original defect: disclose, fix, then show the evidence, in that order. The people who quietly stop using it after an incident rarely tell you why, which is why the usage graph moves before the feedback does.' },

  { wave: 24, threat: 'inject', title: 'You are judged on your worst lane',
    counter: 'Armour the council pierces, armour it cannot, splash immunity and hijacking all arrive at once. No single defence answers more than one of those, so a board tuned for the last five waves fails on whichever one it left out. Coverage wins here: one of everything, spread along the lane, beats three levelled copies of your best tower.',
    lesson: 'A mature AI function is judged on the weakest system it owns, not the best one it demos. Breadth of basic controls beats depth in one showcase, so go and look at the thing nobody has touched since it launched. That is usually where the audit finding and the incident both start.' },

  { wave: 25, threat: 'rogue', title: 'Autonomy scales your worst decision as fast as your best',
    counter: 'The rogue agent heals thirty a second, so damage arriving in bursts between hijacks never gets ahead of it. It always takes the three closest defences whatever they are, so leave something cheap near its path and keep the real damage back, where the council’s five cell range still reaches. It replicates at 70%, 45% and 20% health, and CEO mandates follow it in at five sanity each.',
    lesson: 'Give anything that acts on its own a bounded scope, a logged trail and a stop button somebody is willing to press. Design that in at the start, because by the time you need it there is no time left to build it. Oversight is only real when the person holding it has the authority to stop the system and the information to know when to.' },
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
