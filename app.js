/* ============ persistence (safe: falls back to memory if storage blocked) ============ */
const mem={};
/* keys kept global (shared across every account on this device) */
const GLOBAL_KEYS=new Set(['__accounts','__active','__snaps']);
function _activeId(){try{const v=localStorage.getItem('__active');return v==null?(mem['__active']||null):JSON.parse(v)}catch(e){return mem['__active']||null}}
function _nskey(k){return GLOBAL_KEYS.has(k)?k:('u:'+(_activeId()||'guest')+':'+k)}
const store={
  get(k,d){const kk=_nskey(k);try{const v=localStorage.getItem(kk);return v==null?(mem[kk]!=null?mem[kk]:d):JSON.parse(v)}catch(e){return mem[kk]!=null?mem[kk]:d}},
  set(k,v){const kk=_nskey(k);try{localStorage.setItem(kk,JSON.stringify(v))}catch(e){mem[kk]=v}},
  del(k){const kk=_nskey(k);try{localStorage.removeItem(kk)}catch(e){}delete mem[kk]},
  rawGet(kk,d){try{const v=localStorage.getItem(kk);return v==null?(mem[kk]!=null?mem[kk]:d):JSON.parse(v)}catch(e){return mem[kk]!=null?mem[kk]:d}},
  rawKeys(){try{return Object.keys(localStorage)}catch(e){return Object.keys(mem)}}
};
const uid=()=>Math.random().toString(36).slice(2,9);
const todayISO=()=>new Date().toISOString().slice(0,10);
const daysBetween=(a,b)=>Math.round((new Date(b)-new Date(a))/864e5);
const fmtDate=s=>{if(!s)return'';const d=new Date(s);return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})};

/* ============ nav structure ============ */
const NAV=[
  {grp:'You'},
  {id:'account', n:'◐', t:'Account'},
  {id:'students', n:'◍', t:'My students', teacherOnly:true},
  {grp:'Tutorial'},
  {id:'tutorial', n:'◆', t:'How to use this app'},
  {id:'spec', n:'◇', t:'Spec coverage'},
  {grp:'Start here'},
  {id:'dashboard', n:'★', t:'Dashboard'},
  {id:'plan',      n:'▶', t:"Today's plan"},
  {id:'welcome',   n:'⚙', t:'Welcome & setup'},
  {grp:'The method'},
  {id:'overview', n:'00', t:'Why this works'},
  {id:'loop',     n:'01', t:'The weekly loop'},
  {grp:'The five phases'},
  {id:'diagnose', n:'02', t:'Diagnose'},
  {id:'repair',   n:'03', t:'Repair'},
  {id:'test',     n:'04', t:'Test'},
  {id:'apply',    n:'05', t:'Apply'},
  {id:'retain',   n:'06', t:'Retain'},
  {grp:'Active practice'},
  {id:'trigger',        n:'A', t:'Trigger trainer'},
  {id:'miscquiz',       n:'B', t:'Misconception check'},
  {id:'explorer',       n:'C', t:'Equation explorer'},
  {id:'counterfactual', n:'D', t:'Counterfactuals'},
  {id:'sandbox',        n:'E', t:'Physics sandbox'},
  {grp:'Working tools'},
  {id:'errorlog', n:'07', t:'Error log'},
  {id:'scheduler',n:'08', t:'Review scheduler'},
  {id:'transfer', n:'09', t:'Transfer notebook'},
  {id:'lens',     n:'10', t:'Daily lens'},
  {grp:'Reference'},
  {id:'misconceptions', n:'11', t:'Misconception fixes'},
  {id:'contrast',       n:'12', t:'Concept contrasts'},
  {id:'models',         n:'13', t:'Mental models'},
  {id:'analogies',      n:'14', t:'Analogy bank'},
  {id:'conceptmap',     n:'15', t:'Concept map'},
  {grp:'Next'},
  {id:'alevel',    n:'16', t:'A-level bridge'},
  {id:'resources', n:'17', t:'Resources'},
];
/* ---- hero signature: spaced-review retention curve, computed ---- */
function heroSVG(){
  const x0=58,x1=672,y0=28,y1=170,W=x1-x0,H=y1-y0;
  const Y=p=>y1-(p/100)*H;               // p% retention -> y
  const reviews=[0,.22,.46,.72];          // fractional x of each review
  const taus=[.10,.16,.24,.40];           // decay slows after each review
  const seg=160;                          // samples
  // spaced curve (resets to 100 at each review, slower decay each time)
  let spaced='';
  for(let i=0;i<reviews.length;i++){
    const start=reviews[i], end=(i<reviews.length-1?reviews[i+1]:1.02);
    const tau=taus[i];
    for(let s=0;s<=seg;s++){
      const f=start+(end-start)*(s/seg); if(f>1.02)break;
      const t=(f-start);
      const p=100*Math.exp(-t/tau);
      const X=x0+W*f, Yy=Y(p);
      spaced+=(spaced===''?'M':'L')+X.toFixed(1)+' '+Yy.toFixed(1)+' ';
    }
  }
  // single-pass forgetting (no review) faint dashed
  let forget='';
  for(let s=0;s<=seg;s++){const f=s/seg;const p=100*Math.exp(-f/.13);
    forget+=(s===0?'M':'L')+(x0+W*f).toFixed(1)+' '+Y(p).toFixed(1)+' ';}
  // review markers
  let marks='';
  reviews.slice(1).forEach(f=>{const X=x0+W*f;
    marks+=`<line x1="${X}" y1="${Y(100)}" x2="${X}" y2="${y1}" stroke="#DB8B1E" stroke-width="1" stroke-dasharray="2 3" opacity=".5"/>`+
           `<circle cx="${X}" cy="${Y(100)}" r="4" fill="#DB8B1E"/>`;});
  return `<svg viewBox="0 0 700 200" role="img" aria-label="A forgetting curve that resets and flattens each time you review.">
    <line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}" stroke="#414A63" stroke-width="1"/>
    <line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="#414A63" stroke-width="1"/>
    <text x="${x0-8}" y="${Y(100)+4}" fill="#7E879C" font-size="10" text-anchor="end" font-family="IBM Plex Mono">100%</text>
    <text x="${x0-8}" y="${y1+2}" fill="#7E879C" font-size="10" text-anchor="end" font-family="IBM Plex Mono">0</text>
    <text x="${x1}" y="${y1+16}" fill="#7E879C" font-size="10" text-anchor="end" font-family="IBM Plex Mono">time →</text>
    <path d="${forget}" fill="none" stroke="#5A647E" stroke-width="1.4" stroke-dasharray="4 4" opacity=".8"/>
    ${marks}
    <path d="${spaced}" fill="none" stroke="#DB8B1E" stroke-width="2.6" stroke-linejoin="round"/>
    <text x="${x0+W*.5}" y="${Y(20)+2}" fill="#7E879C" font-size="10.5" font-family="Inter">forgetting without review</text>
  </svg>`;
}

/* ============ section content ============ */
const SEC={};

SEC.overview=()=>`
<div class="hero">
  <div class="eyebrow" style="color:#DB8B1E">The whole idea on one screen</div>
  <h1>Each review you do bends the forgetting curve flatter.</h1>
  <p>The dashed line is what happens to a fact you learn once and leave alone. The amber line is the same fact reviewed at widening intervals — it keeps resetting to full, and decays more slowly every time. This app is built to make that amber line happen on purpose.</p>
  ${heroSVG()}
</div>

<div class="eyebrow">Read this first</div>
<h2 class="h-sec">Why this method, not just "do papers"</h2>
<p class="lead">Doing past papers tells you your <em>score</em>. It does not, by itself, tell you <em>why</em> you missed marks, fix your mental model, or make the knowledge stick past next week. Those are three separate jobs, and each needs a different tool. That is what the five phases are for.</p>

<div class="card">
<p style="margin:0"><strong>The core claim from learning science:</strong> understanding and retention are <em>built by retrieval and varied application</em>, not by exposure. Re-reading notes and watching explanations feel productive and barely move the needle. Pulling an idea out of an empty head, explaining it aloud, and using it in a situation the textbook never mentioned — that is what actually wires it in. Every tool here is a way to force one of those three actions.</p>
</div>

<h3 class="blk">The trap specific to GCSE physics</h3>
<p>GCSE is conceptually shallow enough that <strong>you can get answers right while holding a broken mental model.</strong> People pass believing heavier objects fall faster, that current gets "used up" round a circuit, that a moving object must have a force pushing it. The exam doesn't catch these — but A-level is built directly on top of them, so it detonates there instead.</p>
<div class="note"><span class="eyebrow">Your real GCSE target</span>Not the mark. The mark is a proxy. The target is making sure the <strong>foundational intuitions are correct</strong>, because everything in A-level is stacked on them. When you get something right, occasionally poke it: <em>would I still get this if they flipped the scenario or changed the numbers?</em></p>

<h3 class="blk">The three things every phase is trying to produce</h3>
<div class="t4">
  <div class="stat"><div class="big">Retention</div><div class="lbl">it's still there in a month</div></div>
  <div class="stat"><div class="big">Understanding</div><div class="lbl">you hold a correct mechanism</div></div>
  <div class="stat"><div class="big">Transfer</div><div class="lbl">it works on novel scenarios</div></div>
</div>
<p class="muted">Most self-learners get the first by accident, neglect the second, and skip the third entirely. The third is the whole reason you said "not just exam questions." It is the part this app pushes hardest.</p>
`;

SEC.loop=()=>`
<div class="eyebrow">The engine</div>
<h2 class="h-sec">The weekly loop</h2>
<p class="lead">Five phases, run in order, every cycle. A "cycle" can be one topic or one paper section — scale it to the time you have. The point is that you never skip a phase, because each one does a job the others can't.</p>

<div class="phases">
  <span class="chip" style="border-color:var(--t-recall);color:var(--t-recall)">◆ diagnose</span>
  <span class="chip" style="border-color:var(--t-concept);color:var(--t-concept)">◆ repair</span>
  <span class="chip" style="border-color:var(--accent-deep);color:var(--accent-deep)">◆ test</span>
  <span class="chip" style="border-color:var(--t-slip);color:var(--t-slip)">◆ apply</span>
  <span class="chip" style="border-color:var(--t-comp);color:var(--t-comp)">◆ retain</span>
</div>

<div class="loopline card">
  <div class="loopstep"><div class="num"></div><div><h4>Diagnose — find the gap and its <em>type</em></h4><p>Do a paper section or a recall test. For everything wrong or shaky, log <em>what kind</em> of failure it was. Don't just record the score.</p></div></div>
  <div class="loopstep"><div class="num"></div><div><h4>Repair — rebuild the model, not just the fact</h4><p>For each gap, relearn the <em>mechanism</em> and <em>why the equation has the shape it does</em> — not the bare formula. Kill any misconception at the root.</p></div></div>
  <div class="loopstep"><div class="num"></div><div><h4>Test — prove it from an empty head</h4><p>Active recall + the Feynman pass: explain it aloud in plain words. The exact moment you go vague is the part you don't actually have.</p></div></div>
  <div class="loopstep"><div class="num"></div><div><h4>Apply — push it somewhere new</h4><p>Solve <em>varied, interleaved</em> problems, then invent 2–3 real-world scenarios the textbook never mentioned.</p></div></div>
  <div class="loopstep"><div class="num"></div><div><h4>Retain — schedule the comeback</h4><p>Drop the equation into a flashcard deck, and diary the <em>problem</em> for a spaced re-attempt. A concept you can't re-solve cold next month hasn't stuck.</p></div></div>
</div>

<div class="note"><span class="eyebrow">Mechanisms over memorisation</span>GCSE rewards pattern-matching, but the lasting wins come from understanding the <strong>why</strong>. Move briskly through the routine number-plugging and spend the saved time rebuilding mechanisms — that is what holds up at A-level.</p>

<h3 class="blk">A realistic single cycle, start to finish</h3>
<p>So the abstraction isn't floating, here's one full pass on a single topic so you can see every phase touch the same idea.</p>
<div class="acc-host" data-acc="loopworked"></div>
`;
SEC.diagnose=()=>`
<div class="eyebrow">Phase 02 · ◆ diagnose</div>
<h2 class="h-sec">Diagnose the <em>type</em> of failure</h2>
<p class="lead">A wrong answer is not one thing. "Got it wrong" lumps together five completely different problems that each need a different fix. Marking a paper without sorting your mistakes by type wastes most of the diagnostic value.</p>

<h3 class="blk">The five failure types</h3>
<p>Every mistake — and every <em>right</em> answer you felt shaky about — falls into one of these. Learn to name them instantly; it becomes second nature after one paper.</p>

<div class="grid two">
  <div class="card" style="border-left:3px solid var(--t-recall)">
    <span class="tg" style="background:var(--t-recall)">RECALL GAP</span>
    <p style="margin:10px 0 0"><strong>You didn't know the fact or equation.</strong></p>
    <p class="muted" style="font-size:.9rem;margin:6px 0 0"><em>e.g.</em> Couldn't remember that gravitational PE = <span class="mono">m g h</span>.<br><strong>Fix →</strong> flashcard it, schedule spaced review. Cheap to fix.</p>
  </div>
  <div class="card" style="border-left:3px solid var(--t-trigger)">
    <span class="tg" style="background:var(--t-trigger)">TRIGGER GAP</span>
    <p style="margin:10px 0 0"><strong>You knew the tool but didn't see it was the moment to use it.</strong></p>
    <p class="muted" style="font-size:.9rem;margin:6px 0 0"><em>e.g.</em> A ball falls from a roof; you knew KE and GPE equations but didn't recognise this as an <em>energy-conservation</em> problem.<br><strong>Fix →</strong> more <em>varied</em> problems, interleaved.</p>
  </div>
  <div class="card" style="border-left:3px solid var(--t-concept)">
    <span class="tg" style="background:var(--t-concept)">CONCEPTUAL ERROR</span>
    <p style="margin:10px 0 0"><strong>Your mental model is actually wrong.</strong> The dangerous one.</p>
    <p class="muted" style="font-size:.9rem;margin:6px 0 0"><em>e.g.</em> You believe the heavier ball lands first.<br><strong>Fix →</strong> stop. Rebuild the model in <a onclick="go('repair')">Repair</a>. Don't paper over it.</p>
  </div>
  <div class="card" style="border-left:3px solid var(--t-slip)">
    <span class="tg" style="background:var(--t-slip)">SLIP</span>
    <p style="margin:10px 0 0"><strong>You knew everything but botched the execution.</strong></p>
    <p class="muted" style="font-size:.9rem;margin:6px 0 0"><em>e.g.</em> Used grams where the formula wants kg — answer off by 1000. Rearranged wrong.<br><strong>Fix →</strong> a checklist habit (units first), not more theory.</p>
  </div>
  <div class="card" style="border-left:3px solid var(--t-comp)">
    <span class="tg" style="background:var(--t-comp)">COMPREHENSION</span>
    <p style="margin:10px 0 0"><strong>You couldn't decode what the question was asking.</strong></p>
    <p class="muted" style="font-size:.9rem;margin:6px 0 0"><em>e.g.</em> Didn't know what "terminal velocity" or "in terms of" was after.<br><strong>Fix →</strong> learn the exam's vocabulary and command words.</p>
  </div>
  <div class="card" style="background:var(--ink);color:#EDEFF4;border:0">
    <span class="eyebrow" style="color:var(--accent)">The point</span>
    <p style="margin:10px 0 0;color:#EDEFF4">A trigger gap and a conceptual error look identical on the mark scheme — both are "0 marks". But one means <em>do more problems</em> and the other means <em>your physics is broken</em>. Only the sort tells them apart.</p>
  </div>
</div>

<h3 class="blk">Run the diagnostic well</h3>
<ul class="clean">
  <li><strong>Mark honestly, then re-mark for confidence.</strong> Go back over the questions you got <em>right</em> and flag any you'd have missed with different numbers. Shaky-right is a real gap; treat it like a wrong one.</li>
  <li><strong>Log every gap by type</strong> in the <a onclick="go('errorlog')">Error log</a>. Over a few papers, clusters appear — and GCSE has only a handful of core models (energy, forces, waves, electricity, particle model, radioactivity, magnetism), so your gaps will concentrate fast.</li>
  <li><strong>Don't fix anything yet.</strong> Diagnose the whole section first. Fixing mid-paper biases you toward whack-a-mole instead of seeing the pattern.</li>
</ul>

<div class="note"><span class="eyebrow">The "shaky-right" probe</span>For any answer you're not sure about, ask the three flip questions: <em>change the numbers · flip the scenario · explain the mechanism.</em> If any of those would trip you, it's a gap. Log it.</p>

<h3 class="blk">Log a gap now</h3>
<p class="muted" style="margin-top:-4px">Mini error log — full version with filtering lives in <a onclick="go('errorlog')">Error log</a>.</p>
<div class="acc-host" data-tool="errorlog-mini"></div>
`;

SEC.repair=()=>`
<div class="eyebrow">Phase 03 · ◆ repair</div>
<h2 class="h-sec">Repair the model, not the symptom</h2>
<p class="lead">This is where understanding is actually built. The rule: never relearn a bare fact. Relearn the <strong>mechanism</strong> behind it and <strong>why the equation has the shape it does</strong>. A formula you can reconstruct is one you also know when <em>not</em> to use.</p>

<h3 class="blk">Four habits that force genuine understanding</h3>

<h4 class="sub">1 · Derive or justify, don't memorise</h4>
<p>At GCSE you can't fully derive <span class="mono">KE = ½mv²</span>, but you can own the <em>shape</em>: double the speed and the energy <em>quadruples</em>, because v is squared. Knowing that means you can sanity-check answers and you know the relationship even when you forget the constant.</p>
<div class="eq">E<sub>k</sub> = <span class="c">½</span> m v<span class="c">²</span>   →   v ×2  ⇒  E<sub>k</sub> ×4</div>

<h4 class="sub">2 · Predict before you calculate</h4>
<p>Before plugging numbers in, say out loud what <em>should</em> happen qualitatively. <em>"I'm adding resistance in series, so current should drop, so the bulb should dim."</em> Then run the maths and check it agrees with your prediction. The mismatches are where the real learning is — a number that disagrees with your story means either the arithmetic or the model is wrong, and you need to know which.</p>

<h4 class="sub">3 · Always carry a causal story</h4>
<p>Physics is mechanisms, not formulas. "Why does the bulb dim when I add a second bulb in series?" should have a <em>story</em> — more resistance → less current everywhere → less power dissipated in each bulb — not just an equation. If your only answer is an equation, you've memorised, not understood.</p>

<h4 class="sub">4 · Kill misconceptions at the root</h4>
<p>If Diagnose flagged a <span class="tg" style="background:var(--t-concept)">CONCEPTUAL ERROR</span>, the fix is not "remember the right answer" — it's replacing the broken model with a correct one, usually via an analogy concrete enough that the wrong model stops feeling true. The <a onclick="go('misconceptions')">Misconception fixes</a> bank pairs the classic GCSE wrong-models with the correct mechanism and the analogy that dislodges it.</p>

<div class="warn"><span class="eyebrow" style="color:var(--t-concept)">Watch for self-rescue</span>When you catch yourself thinking "well, what I <em>meant</em> was…" after seeing the answer — stop. That's your broken model quietly editing the memory so it still feels right. Write down what you <em>actually</em> thought before the answer appeared, and repair <em>that</em>.</p>

<h3 class="blk">The repair worktable</h3>
<p>A four-line frame to run on any gap. Fill it in your notes (or head) for each repair — it forces the mechanism out into the open.</p>
<div class="card">
<table style="width:100%;border-collapse:collapse;font-size:.92rem">
<tr style="border-bottom:1px solid var(--line)"><td style="padding:9px 8px;width:34%;font-weight:600">What I believed</td><td style="padding:9px 8px;color:var(--ink-soft)">the model I actually used, before the answer</td></tr>
<tr style="border-bottom:1px solid var(--line)"><td style="padding:9px 8px;font-weight:600">What's true</td><td style="padding:9px 8px;color:var(--ink-soft)">the correct mechanism, in one sentence</td></tr>
<tr style="border-bottom:1px solid var(--line)"><td style="padding:9px 8px;font-weight:600">Why the equation looks like that</td><td style="padding:9px 8px;color:var(--ink-soft)">what each symbol does; why squared / inverse / etc.</td></tr>
<tr><td style="padding:9px 8px;font-weight:600">The tell</td><td style="padding:9px 8px;color:var(--ink-soft)">how I'll recognise this situation next time</td></tr>
</table>
</div>
`;
SEC.test=()=>`
<div class="eyebrow">Phase 04 · ◆ test</div>
<h2 class="h-sec">Test it from an empty head</h2>
<p class="lead">Re-reading and re-watching feel like learning and mostly aren't — they let you confuse <em>recognising</em> an idea with being able to <em>produce</em> it. The only honest test is retrieval: close everything and rebuild the idea from nothing.</p>

<h3 class="blk">Active recall — the non-negotiable</h3>
<ul class="clean">
  <li><strong>Blank-page it.</strong> Shut the notes. Write the concept, the equation, the derivation-sketch, and the causal story from memory. Then check. The gap between what you produced and what's correct is your precise remaining weakness — far sharper than any score.</li>
  <li><strong>Re-solve, don't re-read, old problems.</strong> A worked example you can follow is not one you can do. Cover the solution and redo it cold.</li>
  <li><strong>Recall is uncomfortable; that discomfort is the mechanism.</strong> Easy review = weak encoding. If it felt effortless you probably recognised rather than retrieved.</li>
</ul>

<h3 class="blk">The Feynman pass</h3>
<p>Explain the concept out loud, in plain words, as if to someone with no physics — no jargon allowed. <strong>The exact point where you go vague or reach for a technical word to paper over a gap is your real weak spot.</strong> It's brutal and it's the fastest gap-finder there is.</p>
<div class="card">
<div class="eyebrow">Feynman prompts — pick one and talk for 60 seconds, no notes</div>
<div id="feynPrompt" style="font-size:1.12rem;font-family:'Space Grotesk';font-weight:500;margin:12px 0;min-height:2.4em">Why does a heavier object <em>not</em> fall faster than a light one in a vacuum?</div>
<div style="display:flex;gap:8px;flex-wrap:wrap">
  <button class="btn sm" onclick="nextFeyn()">Another prompt</button>
  <button class="btn sm ghost" onclick="go('scheduler')">I was vague — schedule a review</button>
</div>
<p class="muted" style="font-size:.85rem;margin:12px 0 0">If you stalled, that concept goes straight into Repair, then the scheduler. A stall is a successful diagnosis, not a failure.</p>
</div>

<div class="note"><span class="eyebrow">Teach-back beats highlighter every time</span>If you can explain it to a rubber duck without jargon, you own it. If you can't, you've found exactly what to repair — which is the point.</p>
`;

SEC.apply=()=>`
<div class="eyebrow">Phase 05 · ◆ apply</div>
<h2 class="h-sec">Apply it somewhere the textbook didn't</h2>
<p class="lead">This is the phase most self-learners skip, and it's the one you specifically asked for: making concepts work on <em>any</em> scenario, not just exam questions. Transfer doesn't happen automatically — you have to deliberately drag each idea into new territory.</p>

<h3 class="blk">Two moves that build transfer</h3>

<h4 class="sub">1 · Interleave your practice</h4>
<p>Don't do 20 energy problems in a row. Mixing topics together is harder and feels worse — and that's exactly why it works. Blocked practice lets you autopilot ("we're on the energy chapter, so use energy equations"). Interleaving forces you to first <em>decide which model applies</em>, which is the trigger-recognition skill that real problems demand. The difficulty is the feature.</p>

<h4 class="sub">2 · Invent your own scenarios</h4>
<p>After learning a concept, apply it to <strong>three real situations the textbook never mentioned.</strong> Generate them yourself — that generation is where transfer is forged. Examples to aim at:</p>
<ul class="clean">
  <li>Why does a heavy door swing slower than a light one given the same push? <span class="muted">(moments · rotational inertia)</span></li>
  <li>Why does a shopping trolley get easier to push <em>after</em> it's already moving? <span class="muted">(static vs kinetic friction · Newton 1)</span></li>
  <li>Why does a phone charger feel warm? <span class="muted">(resistive heating · P = I²R · efficiency)</span></li>
  <li>Why do coastal towns have milder winters than inland ones? <span class="muted">(specific heat capacity of water)</span></li>
</ul>

<div class="note"><span class="eyebrow">Pull a prompt, then capture your answer</span>The <a onclick="go('transfer')">Transfer notebook</a> hands you a real-world scenario for whatever topic you pick and saves your explanation, so you build a personal bank of "I can apply this here" evidence. Get one now:</p>
<div class="acc-host" data-tool="transfer-mini"></div>

<h3 class="blk">Predict before you check</h3>
<p>The strongest application habit is to commit to an outcome <em>before</em> revealing the answer. Use the <a onclick="go('explorer')">equation explorer</a> and <a onclick="go('counterfactual')">counterfactuals</a> for this: state what will happen and why, then test it. A wrong prediction is far more useful than a passively-read correct answer — it shows you exactly where your model is off.</p>
`;

SEC.retain=()=>`
<div class="eyebrow">Phase 06 · ◆ retain</div>
<h2 class="h-sec">Schedule the comeback</h2>
<p class="lead">A concept learned today and never revisited is, in a month, mostly gone — that's the dashed line on the front page. Retention is a <em>scheduling</em> problem, and it's solved by two cheap, evidence-backed habits.</p>

<h3 class="blk">1 · Spaced repetition</h3>
<p>Review at widening intervals — roughly <span class="mono">1 → 3 → 7 → 16 → 35 → 75</span> days — each successful recall pushing the next review further out. Two layers:</p>
<ul class="clean">
  <li><strong>Facts & equations → flashcards.</strong> Anki or any deck. Definitions, constants, the equations and what each symbol means.</li>
  <li><strong>Problems & concepts → re-attempts.</strong> Flashcards can't test whether you can still <em>solve</em>. Diary the actual problem and re-do it cold at the spaced interval. The <a onclick="go('scheduler')">Review scheduler</a> here is built for exactly this — concept-level, not card-level.</li>
</ul>

<h3 class="blk">2 · Interleave the reviews too</h3>
<p>When reviews come due, don't batch them by topic. A mixed review queue rebuilds the trigger-recognition you built in Apply. The scheduler surfaces whatever's due regardless of topic, which keeps it naturally mixed.</p>

<div class="note"><span class="eyebrow">The honesty rule</span>Mark a review "solid" only if you produced it <em>cold</em> — no notes, no peeking. Recognising the answer when you see it is not recall, and grading yourself generously just moves the forgetting back onto the dashed line.</p>

<h3 class="blk">What's due right now</h3>
<div class="acc-host" data-tool="scheduler-mini"></div>
`;
/* ============ DATA: misconception fixes ============ */
const MIS=[
 {t:'Heavier objects fall faster',topic:'Forces',
  wrong:'A heavier ball, dropped with a light one, hits the ground first because gravity pulls it harder.',
  right:'In a vacuum everything accelerates at the same g ≈ 9.8 m/s². Gravity does pull the heavy object with more force, but it also has proportionally more mass to move, so the acceleration (a = F/m) is identical. The two effects cancel exactly.',
  ana:'The hammer-and-feather drop on the Moon (Apollo 15, real footage): no air, both land together. On Earth the only reason a feather loses is air resistance, not weight.',
  tell:'Whenever a question says "in a vacuum" or "ignore air resistance", weight is irrelevant to acceleration. Air resistance is the hidden variable that makes the everyday intuition feel true.'},

 {t:'Current gets "used up" round a circuit',topic:'Electricity',
  wrong:'The bulb uses up some of the current, so there is less current after the bulb than before it.',
  right:'Current (charge per second) is the SAME everywhere in a single loop — charge is conserved, none is consumed. What the bulb consumes is ENERGY carried by the charge, not the charge itself.',
  ana:'A bike chain: every link moves at the same speed all the way round — the chain isn\'t eaten by the gears. The pedals (cell) do work on it, the back wheel (bulb) takes work out, but the same chain passes every point. Energy is transferred; the chain is not consumed.',
  tell:'In a series circuit, current is identical at every point. If you ever think "less current after the component", you\'ve slipped into the consumed-current model.'},

 {t:'Mass and weight are the same thing',topic:'Forces',
  wrong:'Weight and mass are interchangeable; an astronaut on the Moon "weighs less" so has less mass.',
  right:'Mass is the amount of matter (kg), and is the same everywhere. Weight is the force of gravity on that mass (newtons), W = m g, and changes with g. On the Moon your mass is unchanged; your weight is about 1/6.',
  ana:'Mass is how much "stuff" is in your suitcase — identical on Earth, Moon, or in deep space. Weight is how hard the bathroom scale is pushed, which depends on where you stand.',
  tell:'Units are the giveaway: kilograms = mass, newtons = weight. If a question changes planet or mentions the Moon/space, expect weight to change and mass to stay put.'},

 {t:'A moving object must have a force pushing it',topic:'Forces',
  wrong:'If something is moving, there must be a forward force keeping it going; when the force runs out, it stops.',
  right:'Newton\'s first law: with zero resultant force an object keeps moving at constant velocity forever. Things stop on Earth because of a hidden resultant force — friction or drag — not because "the push ran out".',
  ana:'Slide on ice, or throw something in deep space: it keeps gliding because there\'s almost nothing to slow it. The "you need a constant push" feeling comes from living inside constant friction.',
  tell:'Constant velocity ⇒ balanced forces (resultant zero). Acceleration ⇒ unbalanced. A steady speed needs a force only to cancel friction, not to "maintain motion".'},

 {t:'Heat and temperature are the same',topic:'Particle model',
  wrong:'A hotter thing always contains more heat energy.',
  right:'Temperature measures the AVERAGE kinetic energy per particle. Thermal energy ("heat") is the TOTAL energy of all particles, so it also depends on how many there are and what the substance is. Small + very hot can hold less energy than large + warm.',
  ana:'A sparkler burns at ~1000 °C but barely warms you — tiny mass, little total energy. A lukewarm bath at 40 °C holds vastly more thermal energy and could scald you for far longer. High temperature ≠ lots of heat.',
  tell:'If a problem changes the mass or the material, you need thermal energy (Q = m c ΔT), not temperature alone. Temperature is per-particle; heat is the total.'},

 {t:'Heavier / bigger things sink, lighter ones float',topic:'Forces',
  wrong:'Heavy objects sink and light ones float — it\'s about weight.',
  right:'Floating is about DENSITY relative to the fluid, not weight. An object floats if it\'s less dense than the fluid it displaces. A huge steel ship floats; a tiny steel bolt sinks — same material, opposite outcome.',
  ana:'A steel ship floats because its overall shape encloses lots of air, dropping its average density below water\'s. Crush it into a solid block and the same steel sinks. It was never about how heavy — it\'s mass per volume.',
  tell:'Compare densities, not weights. "Would 1 cm³ of this be heavier than 1 cm³ of the fluid?" is the real question.'},

 {t:'Vacuums "suck" / nature abhors a vacuum',topic:'Pressure',
  wrong:'A vacuum actively pulls things into it.',
  right:'There is no pulling force. A vacuum is just absence of pressure; the gas on the OTHER side pushes things in. All the action is the higher-pressure side pushing toward the lower-pressure side.',
  ana:'A drinking straw: you don\'t suck the drink up — you lower the pressure in your mouth, and atmospheric pressure pushes the drink up the straw. The push comes from outside, not a pull from the gap.',
  tell:'Reframe every "suction" as "higher pressure pushing in". Pressure differences push; they never pull.'},

 {t:'In space there\'s no gravity',topic:'Forces / Space',
  wrong:'Astronauts on the ISS float because there\'s no gravity that far up.',
  right:'Gravity at the ISS is still ~90% of surface gravity. They float because they\'re in continuous FREE FALL — the station and everything in it fall toward Earth together while moving sideways fast enough to keep missing it (orbit). Falling together = apparent weightlessness.',
  ana:'A dropped lift: for the few seconds it falls, you and the floor fall at the same rate, so you feel weightless. The ISS is a lift that falls forever because it\'s also moving sideways at ~7.7 km/s.',
  tell:'"Weightless" almost always means free fall, not absence of gravity. Orbit = falling and missing the ground.'},

 {t:'Bigger resistance means bigger current',topic:'Electricity',
  wrong:'Adding more resistance gives more current because resistance "powers" the flow.',
  right:'Resistance opposes current. For a fixed voltage, I = V/R, so more resistance means LESS current. Resistance is the bottleneck, never the driver.',
  ana:'A crowded corridor: the narrower and more crowded it is (higher resistance), the fewer people get through per second (lower current). Voltage is how hard you push from behind.',
  tell:'I = V/R. Resistance is on the bottom — up it goes, down current comes (for fixed V).'},

 {t:'Sound and light travel the same way',topic:'Waves',
  wrong:'Sound and light are basically the same kind of wave.',
  right:'Sound is a LONGITUDINAL wave needing a medium (particles compress and rarefy) — no air, no sound. Light is a TRANSVERSE electromagnetic wave that travels through vacuum and is ~880,000× faster. Different mechanism, different requirements.',
  ana:'Sound is a slinky pushed end-on — compressions travelling through stuff. Light is a rope shaken side-to-side, and it needs no rope at all. That\'s why space is silent but not dark.',
  tell:'"Through a vacuum?" Light yes, sound no. Longitudinal = sound/along; transverse = light/across.'},

 {t:'Acceleration means speeding up',topic:'Motion',
  wrong:'Acceleration only means going faster; slowing down isn\'t acceleration.',
  right:'Acceleration is any change in velocity — speeding up, slowing down (negative acceleration), OR changing direction at constant speed. A car going round a roundabout at steady speed is accelerating because its direction changes.',
  ana:'Velocity is an arrow (size + direction). Bend the arrow round a corner without changing its length and you\'ve still changed velocity — so there\'s acceleration, and therefore a resultant force (which is why you feel thrown to the side).',
  tell:'Direction change = acceleration = resultant force. Circular motion at constant speed is still accelerating.'},

 {t:'Energy gets "used up" and disappears',topic:'Energy',
  wrong:'When a ball stops bouncing, its energy is used up and gone.',
  right:'Energy is conserved — never created or destroyed, only transferred between stores and dissipated. The "lost" energy spread out as thermal energy (heat in the ball, ground, and air) and a little sound. It\'s not gone; it\'s diluted into a less useful form.',
  ana:'A bank transfer: moving money between current and savings doesn\'t change your net worth. Energy moves between kinetic, gravitational, elastic, thermal stores — the total is fixed. "Wasted" energy is just money scattered as untraceable coins (thermal), still there but impossible to gather back.',
  tell:'Never say energy is "used up". Ask "which store did it move to?" — usually thermal via friction/drag. Dissipated ≠ destroyed.'},
];
/* ============ DATA: analogy bank ============ */
const ANA=[
 {topic:'Electricity',k:'Current = a bike chain',v:'Charge isn\'t consumed, it circulates. Every link of the chain moves at the same speed all the way round — so current is identical at every point in a series loop. The cell does work on the chain; the bulb takes work out; the chain itself is never eaten.'},
 {topic:'Electricity',k:'Voltage = height of a water tank',v:'Voltage (potential difference) is the energy given per unit charge — the "push". A higher tank gives water more pressure; a higher voltage gives charge more energy to dump in components. EMF is the pump that lifts the water back up.'},
 {topic:'Electricity',k:'Resistance = a crowded corridor',v:'The narrower and more crowded the corridor, the fewer people pass per second for the same push. More resistance ⇒ less current at fixed voltage. I = V/R.'},
 {topic:'Energy',k:'Energy stores = bank accounts',v:'Energy lives in accounts — kinetic, gravitational, elastic, chemical, thermal. Conservation = your net worth is fixed; you only ever transfer between accounts. "Wasted" energy is coins scattered as thermal — still yours, just impossible to collect back.'},
 {topic:'Forces',k:'Newton 1 = sliding on ice',v:'With no resultant force, motion continues unchanged. On ice friction nearly vanishes and you glide; in space you\'d glide forever. The everyday "needs a constant push" feeling is just constant friction in disguise.'},
 {topic:'Forces',k:'Newton 2 (F=ma) = shopping trolley',v:'An empty trolley leaps forward from a small push; a full one barely moves from the same push. Same force, more mass ⇒ less acceleration. a = F/m made physical.'},
 {topic:'Forces',k:'Newton 3 = stepping off a boat',v:'Push the boat backward and it pushes you forward — equal and opposite. Rockets do the same to exhaust gas. Forces always come in pairs acting on different objects.'},
 {topic:'Pressure',k:'Pressure = high heels vs flat shoes',v:'Same weight, tiny area under a stiletto ⇒ huge pressure (dents floors); spread over a flat sole ⇒ low pressure. P = F/A. A bed of nails works by spreading force over many points.'},
 {topic:'Waves',k:'Waves = a Mexican wave',v:'The wave travels round the stadium but each person stays in their seat — energy and the pattern move, the medium does not. Waves transfer energy without transferring matter.'},
 {topic:'Waves',k:'Transverse vs longitudinal = rope vs slinky',v:'Shake a rope side-to-side and the wiggle travels along it while the rope moves across the motion — transverse (light, water). Push a slinky end-on and compressions travel along the push direction — longitudinal (sound).'},
 {topic:'Waves',k:'Refraction = trolley hitting mud at an angle',v:'A trolley rolling onto mud at an angle: one wheel slows before the other, so it swings round and changes direction. Light slows entering glass; if it hits at an angle, one side slows first and the beam bends. Same mechanism.'},
 {topic:'Radioactivity',k:'Decay = popcorn popping',v:'You can\'t predict which kernel pops next — each is random — but you can predict the overall rate. Radioactive decay is random per nucleus yet statistically precise in bulk, which is why half-life is reliable even though individual atoms aren\'t.'},
 {topic:'Radioactivity',k:'Half-life = a bucket of dice',v:'Roll thousands of dice, remove every 6, re-roll, repeat. The count drops by a predictable fraction each round even though no single die is predictable. Half-life is the time for the population to halve, set by probability not by clock.'},
 {topic:'Particle model',k:'Temperature vs heat = sparkler vs bath',v:'A sparkler at 1000 °C barely warms you (little total energy); a 40 °C bath holds enormous thermal energy. Temperature = average energy per particle; heat = total across all particles.'},
 {topic:'Particle model',k:'Specific heat capacity = bucket size',v:'Water has a huge heat capacity — a big bucket that takes lots of energy to fill (heat up) and holds it well. That\'s why the sea moderates coastal climates and why water is used as a coolant.'},
 {topic:'Motion',k:'Velocity = an arrow, not a number',v:'Velocity has size and direction. Bend the arrow round a corner without changing its length and you\'ve still changed velocity — hence acceleration and a resultant force in circular motion, even at constant speed.'},
 {topic:'Forces',k:'Momentum = lorry vs bike',v:'A lorry and a bike at the same speed — the lorry is far harder to stop because p = mv. Momentum bundles "how much motion" by combining mass and velocity; big mass means big momentum even at modest speed.'},
 {topic:'Energy',k:'Power = two cranes, same load',v:'Two cranes lift identical loads to the same height; the faster one is more powerful. Power = energy transferred per second. Same work, less time ⇒ more power.'},
 {topic:'Energy',k:'Work = pushing a wall does none',v:'Strain against an immovable wall all day and, in physics, you do zero work — nothing moves. Work = force × distance moved in the force\'s direction. Everyday "effort" and physics "work" are different things.'},
 {topic:'Forces',k:'Density = box of feathers vs box of lead',v:'Same box (volume), wildly different mass. Density is mass per unit volume — it decides floating/sinking (vs the fluid), not how heavy something happens to be overall.'},
];

/* ============ render: reference banks ============ */
SEC.misconceptions=()=>{
  const topics=[...new Set(MIS.map(m=>m.topic))];
  const items=MIS.map((m,i)=>`
    <div class="acc" data-topic="${m.topic}">
      <button onclick="toggleAcc(this)">
        <span><span class="mono" style="color:var(--t-concept);font-size:.8em">✕</span> ${m.t}</span>
        <span style="display:flex;gap:8px;align-items:center">
          <span class="tag" style="background:var(--ink-soft)">${m.topic}</span>
          <span class="arrow">›</span>
        </span>
      </button>
      <div class="body">
        <p style="margin-top:12px"><span class="tg" style="background:var(--t-concept)">THE WRONG MODEL</span><br><span class="muted">${m.wrong}</span></p>
        <p><span class="tg" style="background:var(--t-slip)">WHAT'S TRUE</span><br>${m.right}</p>
        <div class="note" style="margin:10px 0"><span class="eyebrow">The analogy that dislodges it</span>${m.ana}</div>
        <p style="margin-bottom:14px"><span class="tg" style="background:var(--t-trigger)">THE TELL</span><br><span class="muted">${m.tell}</span></p>
      </div>
    </div>`).join('');
  return `
  <div class="eyebrow">Reference bank · 10</div>
  <h2 class="h-sec">Misconception fixes</h2>
  <p class="lead">The broken models that survive GCSE and then break A-level. Each is paired with the correct mechanism and the concrete analogy that makes the wrong version stop feeling true. When Diagnose flags a <span class="tg" style="background:var(--t-concept)">CONCEPTUAL ERROR</span>, come here.</p>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px">
    <button class="btn sm ghost filt on" data-f="all" onclick="filtMis(this,'all')">All</button>
    ${topics.map(t=>`<button class="btn sm ghost filt" data-f="${t}" onclick="filtMis(this,'${t}')">${t}</button>`).join('')}
  </div>
  <div id="misList">${items}</div>`;
};

SEC.analogies=()=>{
  const topics=[...new Set(ANA.map(a=>a.topic))];
  const cards=ANA.map(a=>`
    <div class="card analo" data-topic="${a.topic}" style="margin:0">
      <span class="tag" style="background:var(--ink-soft)">${a.topic}</span>
      <h4 style="margin:10px 0 6px;font-size:1.04rem">${a.k}</h4>
      <p style="margin:0;font-size:.92rem;color:var(--ink-soft)">${a.v}</p>
    </div>`).join('');
  return `
  <div class="eyebrow">Reference bank · 11</div>
  <h2 class="h-sec">Analogy bank</h2>
  <p class="lead">Twenty load-bearing analogies across the GCSE core. An analogy isn't decoration — it's a correct mental model you can run forward to predict what happens. Reach for these in Repair, and when inventing your own transfer scenarios.</p>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px">
    <button class="btn sm ghost filt on" data-f="all" onclick="filtAna(this,'all')">All</button>
    ${topics.map(t=>`<button class="btn sm ghost filt" data-f="${t}" onclick="filtAna(this,'${t}')">${t}</button>`).join('')}
  </div>
  <div class="grid" id="anaList" style="grid-template-columns:1fr 1fr">${cards}</div>`;
};

SEC.alevel=()=>`
  <div class="eyebrow">Phase next · 13</div>
  <h2 class="h-sec">The A-level bridge</h2>
  <p class="lead">Once GCSE diagnostics come back clean — meaning correct <em>models</em>, not just passing marks — switch to learning concept-by-concept. Two things change.</p>

  <h3 class="blk">What's different about A-level</h3>
  <ul class="clean">
    <li><strong>The maths becomes load-bearing, not decorative.</strong> Calculus shows up everywhere — rates of change, and areas under graphs as real physical quantities.</li>
    <li><strong>It genuinely rewards deriving from first principles</strong> in a way GCSE doesn't. The "justify the equation's shape" habit from Repair stops being optional and becomes the main event.</li>
    <li><strong>Topics interlink hard.</strong> Energy threads through mechanics, fields, and thermal physics; the same exponential appears in capacitors and radioactivity. Isolated-topic study quietly fails here.</li>
  </ul>

  <h3 class="blk">Build a concept map as you go</h3>
  <p>Because topics interlink, don't treat them as a checklist. Keep a living dependency map — what must be solid <em>before</em> what. A rough mechanics-first ordering:</p>
  <div class="card mono" style="font-size:.84rem;line-height:1.9;overflow-x:auto">
    vectors &amp; components<br>
    &nbsp;&nbsp;└─ kinematics (SUVAT, graphs)<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ Newton's laws ── forces &amp; resultants<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─ momentum &amp; impulse<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─ work · energy · power ──┐<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ circular motion        │<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ SHM ── oscillations ──┤<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ energy in fields (gravitational · electric)
  </div>
  <p class="muted">The same five-phase loop runs unchanged — only now "Repair" leans harder on derivation and first-principles reasoning, and the <a onclick="go('conceptmap')">concept map</a> becomes essential for keeping topics in dependency order.</p>

  <div class="note"><span class="eyebrow">Don't rush the switch</span>The temptation is to leave GCSE the moment the marks are fine. Resist it until the <em>models</em> are clean — a buried misconception costs ten times more to fix once it's load-bearing under A-level material.</p>
`;

SEC.resources=()=>`
  <div class="eyebrow">14</div>
  <h2 class="h-sec">Resources</h2>
  <p class="lead">A deliberately short list — backbone, not a pile of tabs you never open.</p>
  <div class="grid two">
    <div class="card"><h4 style="margin:0 0 6px">Isaac Physics</h4><p style="margin:0;font-size:.92rem;color:var(--ink-soft)">Run by Cambridge, free, spans GCSE → university. Built for problem-solving <em>depth</em> rather than exam-cramming. Make this your backbone for the Apply phase.</p></div>
    <div class="card"><h4 style="margin:0 0 6px">Physics &amp; Maths Tutor</h4><p style="margin:0;font-size:.92rem;color:var(--ink-soft)">Past papers and mark schemes organised by board and by topic. Your raw material for the Diagnose phase.</p></div>
    <div class="card"><h4 style="margin:0 0 6px">Anki</h4><p style="margin:0;font-size:.92rem;color:var(--ink-soft)">For the fact/equation layer of Retain. Pairs with the concept-level <a onclick="go('scheduler')">scheduler</a> here — cards for facts, scheduler for problems.</p></div>
  </div>
  <div class="note"><span class="eyebrow">One housekeeping note</span>Confirm your exam board before downloading papers (AQA, Edexcel, OCR). For a pure diagnostic it barely matters — the core physics is shared — but match the board once you're drilling exam technique.</p>
  <div class="divider"></div>
  <p class="muted" style="font-size:.86rem">Everything you log in this app — error entries, scheduled reviews, transfer scenarios — is saved in your own browser only. Nothing leaves the page. Keep the file and reopen it to pick up where you left off.</p>
`;
/* ============ shared small data ============ */
const TYPE_META={
  recall:{label:'Recall gap',c:'var(--t-recall)'},
  trigger:{label:'Trigger gap',c:'var(--t-trigger)'},
  concept:{label:'Conceptual error',c:'var(--t-concept)'},
  slip:{label:'Slip',c:'var(--t-slip)'},
  comp:{label:'Comprehension',c:'var(--t-comp)'},
};
const FEYN=[
 'Why does a heavier object <em>not</em> fall faster than a light one in a vacuum?',
 'Why is the current the same at every point in a series circuit?',
 'What is the difference between heat and temperature?',
 'Why does an object in orbit feel weightless even though gravity is still acting?',
 'Why does adding a second bulb in series make both dimmer?',
 'What actually happens to the energy when a bouncing ball finally stops?',
 'Why does a car going round a roundabout at steady speed still accelerate?',
 'Why does a steel ship float but a steel bolt sinks?',
 'How can a sparkler be at 1000 °C but not burn you, while warm water can?',
 'Why does refraction bend light when it enters glass?',
 'What keeps a satellite up — and why doesn\'t it just fall down?',
 'Why does pushing a wall as hard as you can do zero work, in physics terms?',
];
const SR_INT=[1,3,7,16,35,75];

const TRANSFER_PROMPTS={
 'Forces':['Why does a heavy door swing more slowly than a light one given the same push?','Why is it harder to start a stationary trolley moving than to keep it moving?','Why do you lurch forward when a bus brakes suddenly?','Why does a karate chop work better fast than slow (think force, time, momentum)?'],
 'Energy':['Why does a phone charger feel warm even when "doing nothing useful"?','Why does a ball never bounce back to its original height?','Why is it more efficient to coast a bike to a stop than to brake hard?','Where does the chemical energy in your breakfast actually end up by midnight?'],
 'Electricity':['Why does a long thin extension lead get warmer than a short fat one?','Why might house lights dim for a moment when a kettle switches on?','Why are Christmas lights wired so one failure doesn\'t kill the whole string (mostly)?','Why does a phone battery drain faster in the cold?'],
 'Waves':['Why can you hear around a corner but not see around it?','Why does a straw look bent in a glass of water?','Why is the deep end of a pool further away than it looks?','Why does your voice sound different in the shower?'],
 'Particle model':['Why does the sea stay cooler than the sand on a hot day?','Why does blowing on hot soup cool it?','Why do metal railings feel colder than wooden ones at the same temperature?','Why does a pressure cooker cook food faster?'],
 'Radioactivity':['Why is carbon dating useless for something a few years old but great for thousands of years?','Why can\'t you "rush" radioactive waste into decaying faster?','Why is a smoke detector\'s tiny radioactive source considered safe?'],
 'Motion':['Why does a passenger feel pushed outward on a sharp bend?','Why do dropped objects in a moving train land at your feet, not behind you?','Why does a spinning ice skater speed up when they pull their arms in?'],
};
const TRANSFER_TOPICS=Object.keys(TRANSFER_PROMPTS);

/* ============ ERROR LOG ============ */
function getLog(){return store.get('errorLog',[])}
function addError(mini){
  const p=mini?'m':'';
  const type=document.getElementById(p+'eType').value;
  const topic=document.getElementById(p+'eTopic').value.trim();
  const note=document.getElementById(p+'eNote').value.trim();
  const paper=mini?'':(document.getElementById('ePaper').value.trim());
  if(!topic&&!note){return}
  const log=getLog();
  log.unshift({id:uid(),date:todayISO(),type,topic:topic||'(untitled)',note,paper});
  store.set('errorLog',log);recordActivity();
  document.getElementById(p+'eTopic').value='';document.getElementById(p+'eNote').value='';
  if(!mini&&document.getElementById('ePaper'))document.getElementById('ePaper').value='';
  rerenderTools();
}
function delError(id){store.set('errorLog',getLog().filter(e=>e.id!==id));rerenderTools()}
let logFilter='all';
function filtLog(el,f){logFilter=f;document.querySelectorAll('#logFilters .filt').forEach(b=>b.classList.toggle('on',b===el));renderLogList()}

function errorForm(mini){
  const p=mini?'m':'';
  const opts=Object.entries(TYPE_META).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('');
  return `<div class="card">
    ${mini?'':'<div class="row"><div><label class="fld">Date</label><input id="eDate" type="date" value="'+todayISO()+'" disabled></div><div><label class="fld">Paper / source</label><input id="ePaper" placeholder="e.g. AQA P1 2019"></div></div>'}
    <div class="row">
      <div><label class="fld">Failure type</label><select id="${p}eType">${opts}</select></div>
      <div><label class="fld">Topic / question</label><input id="${p}eTopic" placeholder="e.g. energy of falling ball"></div>
    </div>
    <label class="fld">What actually went wrong (the model you used, before the answer)</label>
    <textarea id="${p}eNote" placeholder="Be honest about what you were thinking — that's the repairable part."></textarea>
    <button class="btn amber sm" onclick="addError(${mini?'true':'false'})">Log this gap</button>
  </div>`;
}
function logStats(){
  const log=getLog();if(!log.length)return'';
  const counts={};Object.keys(TYPE_META).forEach(k=>counts[k]=0);
  log.forEach(e=>counts[e.type]=(counts[e.type]||0)+1);
  const top=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  return `<div class="t4">${Object.entries(TYPE_META).map(([k,v])=>`<div class="stat"><div class="big" style="color:${v.c}">${counts[k]}</div><div class="lbl">${v.label}</div></div>`).join('')}</div>
  ${top&&top[1]>0?`<div class="note"><span class="eyebrow">Your cluster</span>Most logged: <strong style="color:${TYPE_META[top[0]].c}">${TYPE_META[top[0]].label}</strong>. ${clusterAdvice(top[0])}</div>`:''}`;
}
function clusterAdvice(t){return{
  recall:'Cheap to fix — push these into flashcards and the scheduler and they\'ll fade fast.',
  trigger:'You know the tools but miss the cue. Do more <em>interleaved</em> mixed problems so choosing the model becomes the skill you practise.',
  concept:'The expensive kind. Stop drilling and rebuild these models in Repair using the misconception bank before doing more problems.',
  slip:'Not a knowledge problem. Build a fixed pre-flight checklist: units to SI first, write the equation, then substitute.',
  comp:'A vocabulary problem. Drill command words ("describe" vs "explain" vs "evaluate") and key terms until the questions decode instantly.'}[t]}

function renderLogList(){
  const host=document.getElementById('logList');if(!host)return;
  let log=getLog();if(logFilter!=='all')log=log.filter(e=>e.type===logFilter);
  if(!log.length){host.innerHTML='<p class="empty">No entries yet. Log a gap above — patterns appear after a couple of papers.</p>';return}
  host.innerHTML=log.map(e=>{const m=TYPE_META[e.type];return `<div class="srrow">
    <span class="tg" style="background:${m.c}">${m.label}</span>
    <div style="flex:1;min-width:160px"><div class="cn">${esc(e.topic)}</div>${e.note?`<div class="meta" style="color:var(--ink-soft);white-space:normal;font-family:Inter;font-size:.85rem;margin-top:2px">${esc(e.note)}</div>`:''}</div>
    <span class="meta">${fmtDate(e.date)}${e.paper?' · '+esc(e.paper):''}</span>
    <button class="btn sm ghost" onclick="delError('${e.id}')" aria-label="delete">✕</button>
  </div>`}).join('');
}
SEC.errorlog=()=>`
  <div class="eyebrow">Working tool · 07</div>
  <h2 class="h-sec">Error log</h2>
  <p class="lead">Every gap, sorted by <em>type</em>, in one place. The value isn't any single entry — it's the cluster that emerges over a few papers, which tells you whether to drill, rebuild models, or fix execution habits.</p>
  ${errorForm(false)}
  <div id="logStats">${logStats()}</div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin:18px 0 4px" id="logFilters">
    <button class="btn sm ghost filt ${logFilter==='all'?'on':''}" onclick="filtLog(this,'all')">All</button>
    ${Object.entries(TYPE_META).map(([k,v])=>`<button class="btn sm ghost filt ${logFilter===k?'on':''}" onclick="filtLog(this,'${k}')">${v.label}</button>`).join('')}
  </div>
  <div id="logList"></div>`;

/* ============ SCHEDULER ============ */
function getSR(){return store.get('srItems',[])}
function addSR(mini){
  const p=mini?'m':'';
  const c=document.getElementById(p+'srInput').value.trim();if(!c)return;
  const list=getSR();
  const due=new Date();due.setDate(due.getDate()+SR_INT[0]);
  list.push({id:uid(),concept:c,added:todayISO(),idx:0,due:due.toISOString().slice(0,10)});
  store.set('srItems',list);document.getElementById(p+'srInput').value='';recordActivity();rerenderTools();
}
function reviewSR(id,solid){
  const list=getSR();const it=list.find(x=>x.id===id);if(!it)return;
  if(solid){it.idx=Math.min(it.idx+1,SR_INT.length-1)}else{it.idx=0}
  const d=new Date();d.setDate(d.getDate()+SR_INT[it.idx]);it.due=d.toISOString().slice(0,10);
  store.set('srItems',list);rerenderTools();
}
function delSR(id){store.set('srItems',getSR().filter(x=>x.id!==id));rerenderTools()}
function renderSRList(host,miniOnlyDue){
  if(!host)return;
  const list=getSR();const today=todayISO();
  const due=list.filter(x=>x.due<=today).sort((a,b)=>a.due.localeCompare(b.due));
  const later=list.filter(x=>x.due>today).sort((a,b)=>a.due.localeCompare(b.due));
  if(!list.length){host.innerHTML='<p class="empty">Nothing scheduled. Add a concept or problem you want to still know in a month.</p>';return}
  const row=(x,isDue)=>{const over=daysBetween(x.due,today);
    const status=isDue?(over>0?`${over}d overdue`:'due today'):`in ${daysBetween(today,x.due)}d`;
    const col=isDue?'var(--due)':'var(--rest)';
    return `<div class="srrow">
      <span class="dot" style="background:${col}"></span>
      <span class="cn">${esc(x.concept)}</span>
      <span class="meta">${status} · stage ${x.idx+1}/${SR_INT.length}</span>
      ${isDue?`<span style="display:flex;gap:6px"><button class="btn sm amber" onclick="reviewSR('${x.id}',true)">Solid</button><button class="btn sm ghost" onclick="reviewSR('${x.id}',false)">Struggled</button></span>`:`<button class="btn sm ghost" onclick="delSR('${x.id}')">✕</button>`}
    </div>`};
  let html='';
  if(due.length)html+=`<div class="eyebrow" style="margin:6px 0 8px">Due now · ${due.length}</div>`+due.map(x=>row(x,true)).join('');
  else if(!miniOnlyDue)html+='<p class="empty">Nothing due today. The amber line is holding. ✓</p>';
  if(!miniOnlyDue&&later.length)html+=`<div class="eyebrow" style="margin:18px 0 8px">Upcoming</div>`+later.map(x=>row(x,false)).join('');
  if(miniOnlyDue&&!due.length)html='<p class="empty">Nothing due today. Add something below or open the full scheduler.</p>';
  host.innerHTML=html;
}
function srForm(mini){const p=mini?'m':'';return `<div class="card"><label class="fld">Concept or problem to lock in</label>
  <div style="display:flex;gap:8px"><input id="${p}srInput" placeholder="e.g. re-solve the projectile range problem" style="margin:0" onkeydown="if(event.key==='Enter')addSR(${mini})">
  <button class="btn amber" onclick="addSR(${mini})" style="white-space:nowrap">Schedule</button></div>
  <p class="muted" style="font-size:.8rem;margin:8px 0 0">Reviews widen ${SR_INT.join(' → ')} days. Mark "Solid" only if you produced it cold.</p></div>`}
SEC.scheduler=()=>`
  <div class="eyebrow">Working tool · 08</div>
  <h2 class="h-sec">Review scheduler</h2>
  <p class="lead">Concept-level spaced repetition — for the things flashcards can't test, like whether you can still <em>solve</em> a problem cold. Each "Solid" pushes the next review further out; each "Struggled" resets it.</p>
  ${srForm(false)}
  <div id="srList" style="margin-top:18px"></div>`;

/* ============ TRANSFER NOTEBOOK ============ */
function getTransfer(){return store.get('transferNotes',[])}
let curPrompt={topic:TRANSFER_TOPICS[0],text:TRANSFER_PROMPTS[TRANSFER_TOPICS[0]][0]};
function pullPrompt(mini){
  const p=mini?'m':'';
  const topic=document.getElementById(p+'tTopic').value;
  const arr=TRANSFER_PROMPTS[topic];
  curPrompt={topic,text:arr[Math.floor(Math.random()*arr.length)]};
  const el=document.getElementById(p+'tPrompt');if(el)el.textContent=curPrompt.text;
}
function saveTransfer(mini){
  const p=mini?'m':'';
  const expl=document.getElementById(p+'tExpl').value.trim();if(!expl)return;
  const list=getTransfer();
  list.unshift({id:uid(),topic:curPrompt.topic,scenario:curPrompt.text,explanation:expl,date:todayISO()});
  store.set('transferNotes',list);recordActivity();document.getElementById(p+'tExpl').value='';rerenderTools();
}
function delTransfer(id){store.set('transferNotes',getTransfer().filter(x=>x.id!==id));rerenderTools()}
function transferForm(mini){const p=mini?'m':'';
  return `<div class="card">
    <div class="row"><div><label class="fld">Topic</label><select id="${p}tTopic" onchange="pullPrompt(${mini})">${TRANSFER_TOPICS.map(t=>`<option>${t}</option>`).join('')}</select></div>
    <div style="display:flex;align-items:flex-end"><button class="btn ghost sm" onclick="pullPrompt(${mini})" style="margin-bottom:10px">↻ New scenario</button></div></div>
    <div class="note" style="margin:4px 0 12px"><span class="eyebrow">Real-world scenario</span><span id="${p}tPrompt" style="font-family:'Space Grotesk';font-weight:500">${curPrompt.text}</span></div>
    <label class="fld">Your explanation — which concept, what mechanism</label>
    <textarea id="${p}tExpl" placeholder="Name the physics, then tell the causal story. No equations needed — the mechanism is the point."></textarea>
    <button class="btn amber sm" onclick="saveTransfer(${mini})">Save to notebook</button>
  </div>`}
function renderTransferList(){
  const host=document.getElementById('tfList');if(!host)return;
  const list=getTransfer();
  if(!list.length){host.innerHTML='<p class="empty">Empty. Pull a scenario, explain it, and build your own evidence that you can apply this anywhere.</p>';return}
  host.innerHTML=list.map(x=>`<div class="card" style="margin:10px 0">
    <span class="tag" style="background:var(--ink-soft)">${x.topic}</span><span class="meta" style="float:right;color:var(--ink-faint);font-family:'IBM Plex Mono';font-size:.7rem">${fmtDate(x.date)}</span>
    <p style="font-weight:500;margin:10px 0 6px">${esc(x.scenario)}</p>
    <p style="margin:0;color:var(--ink-soft);font-size:.92rem">${esc(x.explanation)}</p>
    <button class="btn sm ghost" style="margin-top:10px" onclick="delTransfer('${x.id}')">Remove</button>
  </div>`).join('');
}
SEC.transfer=()=>`
  <div class="eyebrow">Working tool · 09</div>
  <h2 class="h-sec">Transfer notebook</h2>
  <p class="lead">The Apply phase, made concrete. Pull a real-world scenario, explain which physics governs it and why, and save it. Over time you build a personal bank proving you can use each concept <em>outside</em> the exam — which was the whole goal.</p>
  ${transferForm(false)}
  <div id="tfList" style="margin-top:8px"></div>`;
/* ============ helpers ============ */
function esc(s){return(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function toggleAcc(btn){btn.parentElement.classList.toggle('open')}
function filtMis(el,f){document.querySelectorAll('#misList .filt,[data-f]').forEach(()=>{});
  document.querySelectorAll('.filt').forEach(b=>{});
  document.querySelectorAll('#misList').forEach(()=>{});
  document.querySelectorAll('[data-topic]').forEach(()=>{});
  document.querySelectorAll('#misList .acc').forEach(a=>a.style.display=(f==='all'||a.dataset.topic===f)?'':'none');
  el.closest('div').querySelectorAll('.filt').forEach(b=>b.classList.toggle('on',b===el));}
function filtAna(el,f){document.querySelectorAll('#anaList .analo').forEach(a=>a.style.display=(f==='all'||a.dataset.topic===f)?'':'none');
  el.closest('div').querySelectorAll('.filt').forEach(b=>b.classList.toggle('on',b===el));}
let feynI=0;function nextFeyn(){feynI=(feynI+1)%FEYN.length;const el=document.getElementById('feynPrompt');if(el)el.innerHTML=FEYN[feynI]}

/* worked-loop accordion (loop page) */
function workedLoop(){
  const steps=[
   ['02','◆ diagnose','var(--t-concept)','You drop a "heavier falls faster" question and get it wrong — you said the 5 kg ball lands before the 1 kg ball. Logged not as "wrong" but as a <strong>conceptual error</strong>: your actual model is that gravity drags heavy things down quicker.'],
   ['03','◆ repair','var(--t-concept)','You rebuild the model: gravity <em>does</em> pull harder on more mass, but there\'s proportionally more mass to shift, so a = F/m comes out identical. You anchor it with the Moon hammer-and-feather drop. You write the tell: "vacuum / ignore air resistance ⇒ weight irrelevant to acceleration."'],
   ['04','◆ test','var(--accent-deep)','You shut the page and Feynman it aloud: "Both fall at the same rate because…" — and you make it to the end without going vague. If you\'d stalled, back to Repair.'],
   ['05','◆ apply','var(--t-slip)','Transfer: why <em>does</em> a feather lose on Earth? (air resistance, not weight). Then open the <a onclick="go(\'sandbox\')">sandbox</a>, set drag to zero and watch a heavy and light object fall together — then add drag and watch them diverge.'],
   ['06','◆ retain','var(--t-comp)','Equation card (W = m g) into Anki; the <em>problem</em> ("explain the vacuum drop") into the <a onclick="go(\'scheduler\')">scheduler</a> for re-attempt in 3 days. Next month you can still produce it cold — it stuck.'],
  ];
  return steps.map(s=>`<div class="acc open"><button onclick="toggleAcc(this)"><span><span class="mono" style="color:${s[2]}">${s[0]}</span>&nbsp; ${s[1]}</span><span class="arrow">›</span></button><div class="body"><p style="margin:12px 0 14px">${s[3]}</p></div></div>`).join('');
}

/* ====================================================================
   VERSION 2 MODULES — adaptive coach, generators, interactive tools
   Spliced in before the render engine. All client-side, all persistent-safe.
   ==================================================================== */

/* ---- activity tracking (powers streaks + dashboard) ---- */
function recordActivity(){
  const days=store.get('activityDays',[]);const t=todayISO();
  if(!days.includes(t)){days.push(t);store.set('activityDays',days)}
}
function currentStreak(){
  const days=store.get('activityDays',[]).slice().sort();
  if(!days.length)return 0;
  let streak=0;let d=new Date();
  for(;;){const iso=d.toISOString().slice(0,10);
    if(days.includes(iso)){streak++;d.setDate(d.getDate()-1)}
    else if(streak===0&&iso===todayISO()){d.setDate(d.getDate()-1)} // today not yet done: keep yesterday's streak
    else break;}
  return streak;
}

/* ---- per-page help banners: what it's for + how to use it ---- */
const HELP={
 dashboard:{what:'Your home base. It reads everything you\'ve logged and tells you what to work on next.',
   how:['Glance at the streak and what\'s due.','Read the one recommended action at the top and do it.','Use the weakness bars to see whether your problem is knowledge, recognition, or broken models.']},
 overview:{what:'The reasoning behind the whole method.',how:['Read once.','Come back when you\'re tempted to just "do more papers".']},
 loop:{what:'The five-phase cycle you repeat for every topic.',how:['Run the phases in order.','Never skip one — each does a job the others can\'t.','See the worked example to watch one idea pass through all five.']},
 diagnose:{what:'Turn wrong answers into sorted, fixable information.',how:['After a paper, classify every miss by failure type.','Log it below — patterns appear after a couple of papers.','Don\'t fix anything yet; diagnose the whole section first.']},
 repair:{what:'Rebuild the broken model, not just the missing fact.',how:['For each gap, relearn the mechanism and why the equation has its shape.','Use the misconception bank for conceptual errors.','Fill the repair worktable in your notes.']},
 test:{what:'Prove you own it by producing it from an empty head.',how:['Blank-page the concept and derivation.','Do the Feynman pass — explain aloud, no jargon.','Where you go vague is the gap; send it back to Repair.']},
 apply:{what:'Make concepts work outside exam questions.',how:['Interleave mixed problems so you practise choosing the model.','Invent real-world scenarios, or pull one from the Transfer notebook.','Predict outcomes before checking — use the explorer and counterfactuals.']},
 retain:{what:'Schedule the comebacks so knowledge survives the month.',how:['Facts → flashcards. Problems → the scheduler.','Review when due, grading yourself honestly.','Keep reviews mixed across topics.']},
 errorlog:{what:'Every gap, sorted by type, in one place.',how:['Log type, topic, and what you actually believed.','Watch the cluster counts — they tell you what kind of work to do.','Filter by type to drill a single weakness.']},
 scheduler:{what:'Concept-level spaced repetition for things flashcards can\'t test.',how:['Add a concept or whole problem to re-solve.','When due, attempt it cold, then grade Again / Hard / Good / Easy.','Honest grading is the whole point — recognising ≠ recalling.']},
 transfer:{what:'Build proof you can apply each concept to the real world.',how:['Pick a topic and pull a scenario.','Name the physics and tell the causal story.','Save it — your notebook becomes evidence of transfer.']},
 lens:{what:'A daily habit: explain one real thing you saw using physics.',how:['Read today\'s nudge.','Write what you noticed and the physics behind it.','Keep the streak — small daily transfer compounds.']},
 trigger:{what:'Trains the skill of recognising which model a situation needs — no maths.',how:['Read the scenario.','Select the concept(s) or the single best model.','Check, read why, and log any miss as a trigger gap.']},
 miscquiz:{what:'Actively hunts the broken models that survive GCSE.',how:['Answer each question honestly — pick what feels true.','If wrong, read why it feels intuitive and the correct mechanism.','Walk the Socratic questions to rebuild the model yourself.']},
 explorer:{what:'Discover what an equation means by moving its variables.',how:['First predict what happens when a variable changes.','Then drag the sliders and watch the result update live.','Read the insight — the relationship is the lesson, not the number.']},
 counterfactual:{what:'Tests real understanding by breaking the scenario.',how:['Read the flipped or "what if" situation.','Predict the consequence out loud first.','Reveal the physics and check your reasoning.']},
 sandbox:{what:'A live playground — change the rules of physics and watch.',how:['Drag gravity, drag, mass, bounciness.','Launch and observe; try to predict before you press go.','Use it to feel concepts the equations only describe.']},
 conceptmap:{what:'The A-level mechanics dependency tree — what must be solid before what.',how:['Click any node for its core intuition, the A-level shift, and the trap to kill.','Weak topics from your error log are ringed — fix roots before branches.','Never climb a tier until the one above is ironclad.']},
 misconceptions:{what:'A reference of broken models, each with the analogy that dislodges it.',how:['Filter by topic.','When Diagnose flags a conceptual error, find it here.','Read the tell so you recognise the trap next time.']},
 analogies:{what:'Load-bearing analogies you can run forward to predict behaviour.',how:['Filter by topic.','Reach for these in Repair and when inventing transfer scenarios.','Try writing your own — it\'s a strong test.']},
 alevel:{what:'How the method changes when you move up to A-level.',how:['Switch only when your GCSE models are clean, not just your marks.','Lean on derivation and first principles.','Use the concept map to keep topics in dependency order.']},
 resources:{what:'A short backbone of external tools.',how:['Isaac Physics for depth, PMT for papers.','Anki for facts, the scheduler here for problems.','Confirm your exam board before drilling technique.']},
};
function helpBanner(id){
  const h=HELP[id];if(!h)return'';
  const open=store.get('helpOpen',true);
  return `<div class="help ${open?'open':''}" id="helpBox">
    <button class="help-h" onclick="toggleHelp()" aria-expanded="${open}">
      <span><span class="help-i">?</span> How to use this page</span><span class="arrow">›</span>
    </button>
    <div class="help-b">
      <p style="margin:0 0 8px"><strong>What it's for.</strong> ${h.what}</p>
      <div class="eyebrow" style="margin-bottom:4px">How to use it</div>
      <ol class="howlist">${h.how.map(s=>`<li>${s}</li>`).join('')}</ol>
    </div>
  </div>`;
}
function toggleHelp(){const b=document.getElementById('helpBox');if(!b)return;
  b.classList.toggle('open');store.set('helpOpen',b.classList.contains('open'))}

/* ---- shared: segmented option button feedback states handled inline ---- */
/* ====================== DASHBOARD / ADAPTIVE COACH ====================== */
function dueCount(){const t=todayISO();return getSR().filter(x=>x.due<=t).length}
function typeCounts(){const c={};Object.keys(TYPE_META).forEach(k=>c[k]=0);getLog().forEach(e=>c[e.type]++);return c}
function weakTopics(){const m={};getLog().forEach(e=>{const k=e.topic||'(untitled)';m[k]=m[k]||{n:0,concept:0};m[k].n++;if(e.type==='concept')m[k].concept++});
  return Object.entries(m).map(([k,v])=>({topic:k,...v})).sort((a,b)=>b.n-a.n).slice(0,6)}
function resurrectable(){const cut=new Date();cut.setDate(cut.getDate()-30);const c=cut.toISOString().slice(0,10);
  return getLog().filter(e=>e.date<=c)}
function nextAction(){
  const due=dueCount();const tc=typeCounts();const log=getLog();const res=resurrectable();
  if(due>0)return{t:`${due} review${due>1?'s':''} due — clear them first`,d:'Spaced reviews decay fastest when overdue. This is always the highest-value 10 minutes.',to:'scheduler',cta:'Go to scheduler'};
  if(res.length)return{t:`${res.length} mistake${res.length>1?'s':''} from 30+ days ago — still solid?`,d:'Resurrect an old error and see if you can still solve it cold. If not, it goes into the scheduler.',to:'dashboard',cta:'See below ↓'};
  if(!log.length)return{t:'Log your first diagnostic',d:'Do a GCSE paper section, then sort every miss by failure type. The app can only coach you once it has data.',to:'diagnose',cta:'Start diagnosing'};
  const dom=Object.entries(tc).sort((a,b)=>b[1]-a[1])[0];
  if(dom[1]===0)return{t:'Pick any practice module',d:'No dominant weakness yet. Try the trigger trainer or a misconception check to generate signal.',to:'trigger',cta:'Open trigger trainer'};
  const route={recall:['scheduler','Flashcard and schedule these — cheap to fix.'],
    trigger:['trigger','Your bottleneck is recognition, not knowledge. Train it directly.'],
    concept:['miscquiz','Broken models are the expensive kind. Hunt them with the misconception quiz.'],
    slip:['diagnose','Execution, not theory. Build a units-first checklist habit.'],
    comp:['misconceptions','A vocabulary problem. Drill command words and key terms.']}[dom[0]];
  return{t:`Your bottleneck: ${TYPE_META[dom[0]].label.toLowerCase()}`,d:route[1],to:route[0],cta:'Work on it'};
}
function masteryBar(label,pct,col){return `<div style="margin:8px 0">
  <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:3px"><span style="font-weight:500">${label}</span><span class="mono" style="color:var(--ink-faint)">${pct}%</span></div>
  <div class="bar"><div class="bar-fill" style="width:${pct}%;background:${col}"></div></div></div>`}

SEC.dashboard=()=>{
  const tc=typeCounts();const total=Object.values(tc).reduce((a,b)=>a+b,0);
  const streak=currentStreak();const due=dueCount();const tn=getTransfer().length;
  const act=nextAction();const wt=weakTopics();const res=resurrectable();
  const maxType=Math.max(1,...Object.values(tc));
  const bars=Object.entries(TYPE_META).map(([k,v])=>{const n=tc[k];const pct=Math.round(n/maxType*100);
    return `<div style="display:flex;align-items:center;gap:10px;margin:6px 0">
      <span style="width:120px;font-size:.82rem">${v.label}</span>
      <div class="bar" style="flex:1"><div class="bar-fill" style="width:${total?pct:0}%;background:${v.c}"></div></div>
      <span class="mono" style="font-size:.78rem;color:var(--ink-faint);width:20px;text-align:right">${n}</span></div>`}).join('');
  const dom=Object.entries(tc).sort((a,b)=>b[1]-a[1])[0];
  return `
  <div class="eyebrow">Home · your coach</div>
  <h2 class="h-sec">Dashboard</h2>
  <p class="lead">This page reads everything you log and points you at the single highest-value thing to do next. The more you use the app, the sharper it gets.</p>

  <div class="action-card">
    <div class="eyebrow" style="color:var(--accent)">Do this next</div>
    <h3 style="margin:6px 0 6px;font-size:1.3rem;color:#fff">${act.t}</h3>
    <p style="color:#AEB6C9;margin:0 0 14px;font-size:.95rem">${act.d}</p>
    <button class="btn amber" onclick="go('${act.to}')">${act.cta}</button>
  </div>

  <div class="t4" style="margin-top:18px">
    <div class="stat"><div class="big">${streak}</div><div class="lbl">day streak 🔥</div></div>
    <div class="stat"><div class="big" style="color:${due?'var(--due)':'var(--rest)'}">${due}</div><div class="lbl">reviews due</div></div>
    <div class="stat"><div class="big">${total}</div><div class="lbl">gaps logged</div></div>
    <div class="stat"><div class="big">${tn}</div><div class="lbl">transfers saved</div></div>
  </div>

  <h3 class="blk">Weakness engine</h3>
  <p class="muted" style="margin-top:-4px">What <em>kind</em> of mistake you make most. This decides whether you need knowledge, recognition, or model-repair work.</p>
  ${total?`<div class="card">${bars}
    <div class="note" style="margin:14px 0 0"><span class="eyebrow">Read-out</span>Your most common failure is <strong style="color:${TYPE_META[dom[0]].c}">${TYPE_META[dom[0]].label}</strong>. ${clusterAdvice(dom[0])}</div></div>`
    :`<div class="card"><p class="empty" style="margin:0">No gaps logged yet. Once you log a few from <a onclick="go('diagnose')">Diagnose</a>, your bottleneck appears here and the whole app starts adapting to it.</p></div>`}

  ${wt.length?`<h3 class="blk">Topics needing attention</h3>
  <p class="muted" style="margin-top:-4px">Ranked by how often they show up in your error log. Conceptual errors (✕) are weighted as the urgent kind.</p>
  <div class="card">${wt.map(t=>`<div class="srrow" style="padding:9px 12px">
    <span class="cn">${esc(t.topic)}</span>
    ${t.concept?`<span class="tg" style="background:var(--t-concept)">✕ ${t.concept} model error${t.concept>1?'s':''}</span>`:''}
    <span class="meta">${t.n} log${t.n>1?'s':''}</span></div>`).join('')}</div>`:''}

  ${res.length?`<h3 class="blk">Error resurrection</h3>
  <p class="muted" style="margin-top:-4px">Mistakes you logged 30+ days ago. The real test of learning: can you still solve them cold?</p>
  <div class="card">${res.slice(0,5).map(e=>`<div class="srrow" style="padding:10px 12px;flex-wrap:wrap">
    <span class="tg" style="background:${TYPE_META[e.type].c}">${TYPE_META[e.type].label}</span>
    <span class="cn">${esc(e.topic)}</span><span class="meta">${fmtDate(e.date)}</span>
    <button class="btn sm amber" onclick="resurrect('${e.id}')">Still solid → schedule</button></div>`).join('')}
    <p class="muted" style="font-size:.82rem;margin:10px 0 0">Scheduling adds it to spaced review so a shaky old idea gets re-tested at widening intervals.</p></div>`:''}

  <h3 class="blk">The mastery ladder</h3>
  <p class="muted" style="margin-top:-4px">"Topic complete" is the wrong target. Real mastery climbs five rungs — this app has a tool for each. Aim to push every topic up the ladder, not tick it off.</p>
  <div class="card">
    ${[['Recall','can reproduce facts & equations cold','var(--t-recall)','scheduler'],
       ['Understanding','holds the correct mechanism','var(--t-concept)','miscquiz'],
       ['Application','solves varied, unfamiliar problems','var(--accent-deep)','trigger'],
       ['Transfer','explains real-world scenarios','var(--t-slip)','transfer'],
       ['Teaching','can explain it to anyone, no jargon','var(--t-comp)','test']]
      .map((r,i)=>`<div class="ladder-row"><span class="ladder-n">${i+1}</span>
      <div style="flex:1"><strong>${r[0]}</strong> <span class="muted" style="font-size:.88rem">— ${r[1]}</span></div>
      <button class="btn sm ghost" onclick="go('${r[3]}')" style="border-color:${r[2]};color:${r[2]}">tool ›</button></div>`).join('')}
  </div>`;
};
function resurrect(id){const e=getLog().find(x=>x.id===id);if(!e)return;
  const list=getSR();const due=new Date();due.setDate(due.getDate()+1);
  list.push({id:uid(),concept:'Re-solve: '+e.topic,added:todayISO(),idx:0,due:due.toISOString().slice(0,10)});
  store.set('srItems',list);recordActivity();go('dashboard',true);
}
/* ====================== TRIGGER RECOGNITION TRAINER ====================== */
const TRIG=[
 {s:'A satellite moves in a steady circular orbit around Earth.',mode:'multi',
  opts:[{t:'Gravity',c:1},{t:'Circular motion',c:1},{t:'Friction',c:0},{t:'Centripetal force',c:1},{t:'Air resistance',c:0}],
  why:'Gravity supplies the centripetal force that keeps it turning in a circle. No friction or air resistance acts in the vacuum of space — that\'s why orbits persist.'},
 {s:'Two identical trolleys collide and stick together, then move off slower.',mode:'multi',
  opts:[{t:'Momentum conservation',c:1},{t:'Kinetic energy is conserved',c:0},{t:'Inelastic collision',c:1},{t:'Newton\'s third law',c:1}],
  why:'Momentum is always conserved in collisions. They stick, so it\'s inelastic — kinetic energy is NOT conserved (some becomes heat/sound). Equal-and-opposite forces act during contact.'},
 {s:'A bulb glows dimmer when a second identical bulb is added in series.',mode:'single',
  opts:[{t:'The first bulb uses up the current',c:0},{t:'Total resistance rises, so current falls everywhere',c:1},{t:'Voltage is destroyed by the bulb',c:0}],
  why:'Adding a bulb in series increases total resistance; with I = V/R the current drops throughout the single loop, so each bulb gets less power. Current is never "used up".'},
 {s:'A skydiver falls and eventually stops accelerating, descending at a steady speed.',mode:'multi',
  opts:[{t:'Terminal velocity',c:1},{t:'Balanced forces',c:1},{t:'Weight exceeds drag',c:0},{t:'Air resistance (drag)',c:1}],
  why:'At terminal velocity drag has grown to equal weight, so forces balance, resultant force is zero, and acceleration stops. Steady speed always means balanced forces.'},
 {s:'A ball is thrown horizontally off a cliff and follows a curved path.',mode:'multi',
  opts:[{t:'Independence of horizontal & vertical motion',c:1},{t:'Constant horizontal velocity',c:1},{t:'Vertical acceleration g',c:1},{t:'A forward force pushing it along',c:0}],
  why:'Horizontal and vertical motions are independent: horizontal velocity stays constant (no horizontal force), while gravity accelerates it downward. No forward force is needed once released.'},
 {s:'The sea warms up far more slowly than the sand on a hot beach day.',mode:'single',
  opts:[{t:'Water has a high specific heat capacity',c:1},{t:'Water reflects all the sunlight',c:0},{t:'Sand has more mass',c:0}],
  why:'Water needs a lot of energy per kilogram to raise its temperature (high specific heat capacity), so it heats and cools slowly — which also moderates coastal climates.'},
 {s:'A spinning ice skater pulls their arms in and speeds up.',mode:'multi',
  opts:[{t:'Conservation of angular momentum',c:1},{t:'Moment of inertia decreases',c:1},{t:'They push harder on the ice',c:0}],
  why:'Angular momentum is conserved. Pulling arms in lowers the moment of inertia, so the rotation rate must rise to compensate — no extra push required.'},
 {s:'A phone charger feels warm even when the phone is fully charged.',mode:'single',
  opts:[{t:'Resistive heating — energy dissipated as P = I²R',c:1},{t:'The charger stores heat as a battery',c:0},{t:'Warmth means it is broken',c:0}],
  why:'Current through the charger\'s components has resistance, dissipating some electrical energy as heat (P = I²R). This is normal inefficiency, not a fault.'},
 {s:'A straw looks bent where it enters a glass of water.',mode:'single',
  opts:[{t:'Refraction — light changes speed entering water',c:1},{t:'Reflection off the glass',c:0},{t:'The straw is actually bent',c:0}],
  why:'Light slows as it passes from water to air and bends at the surface (refraction), so the submerged part appears displaced.'},
 {s:'You feel pushed outward when a car turns a sharp corner at speed.',mode:'multi',
  opts:[{t:'Inertia (Newton\'s first law)',c:1},{t:'Change of direction = acceleration',c:1},{t:'A real outward force',c:0},{t:'Centripetal force from the seat/door',c:1}],
  why:'Your body tends to continue in a straight line (inertia); the car turns, so the seat/door pushes you inward (centripetal). The "outward push" is the felt absence of that — there is no real outward force.'},
 {s:'A bouncing ball returns to a lower height each bounce until it stops.',mode:'multi',
  opts:[{t:'Energy dissipation to heat & sound',c:1},{t:'Energy is destroyed',c:0},{t:'Conservation of energy',c:1},{t:'Inelastic deformation',c:1}],
  why:'Energy is conserved but transfers: each bounce sends some kinetic energy to heat and sound via deformation, so less returns as height. It\'s redistributed, never destroyed.'},
 {s:'Train tracks are laid with small gaps between sections.',mode:'single',
  opts:[{t:'Thermal expansion — rails lengthen when hot',c:1},{t:'To save on steel',c:0},{t:'For drainage',c:0}],
  why:'Metal expands when heated; the gaps give the rails room to lengthen on hot days without buckling.'},
];
let trigIdx=0,trigPicked=new Set(),trigDone=false,trigScore={r:0,t:0};
function renderTrig(){
  const host=document.getElementById('trigBox');if(!host)return;
  const it=TRIG[trigIdx];
  const opts=it.opts.map((o,i)=>{
    let cls='opt';
    if(trigDone){if(o.c)cls+=' good';else if(trigPicked.has(i))cls+=' bad';}
    else if(trigPicked.has(i))cls+=' sel';
    return `<button class="${cls}" onclick="pickTrig(${i})" ${trigDone?'disabled':''}>
      <span class="opt-box">${it.mode==='multi'?(trigPicked.has(i)?'✓':''):(trigPicked.has(i)?'●':'')}</span>${esc(o.t)}</button>`}).join('');
  let fb='';
  if(trigDone){
    const correct=it.opts.every((o,i)=>(!!o.c)===trigPicked.has(i));
    fb=`<div class="${correct?'note':'warn'}" style="margin:14px 0 0">
      <span class="eyebrow" style="color:${correct?'var(--accent-deep)':'var(--t-concept)'}">${correct?'Correct':'Not quite'}</span>${it.why}
      ${correct?'':`<div style="margin-top:10px"><button class="btn sm ghost" onclick="logTrigMiss()">Log this as a trigger gap</button></div>`}</div>`;
  }
  host.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <span class="mono" style="font-size:.74rem;color:var(--ink-faint)">Scenario ${trigIdx+1} / ${TRIG.length}</span>
      <span class="mono" style="font-size:.74rem;color:var(--ink-faint)">Score ${trigScore.r}/${trigScore.t}</span>
    </div>
    <div class="scenario">${esc(it.s)}</div>
    <p class="muted" style="font-size:.84rem;margin:10px 0 6px">${it.mode==='multi'?'Select every concept at work — no calculation.':'Pick the single best explanation.'}</p>
    <div class="opts">${opts}</div>
    ${trigDone?'':`<button class="btn amber" style="margin-top:14px" onclick="checkTrig()" id="trigCheck" ${trigPicked.size?'':'disabled'}>Check</button>`}
    ${fb}
    ${trigDone?`<div style="margin-top:14px"><button class="btn" onclick="nextTrig()">${trigIdx<TRIG.length-1?'Next scenario':'Restart set'}</button></div>`:''}`;
}
function pickTrig(i){if(trigDone)return;const it=TRIG[trigIdx];
  if(it.mode==='single'){trigPicked=new Set([i])}else{trigPicked.has(i)?trigPicked.delete(i):trigPicked.add(i)}
  const b=document.getElementById('trigCheck');renderTrig();}
function checkTrig(){if(!trigPicked.size)return;const it=TRIG[trigIdx];
  const correct=it.opts.every((o,i)=>(!!o.c)===trigPicked.has(i));
  trigDone=true;trigScore.t++;if(correct)trigScore.r++;recordActivity();renderTrig();}
function nextTrig(){trigIdx=(trigIdx+1)%TRIG.length;if(trigIdx===0){trigScore={r:0,t:0}}trigPicked=new Set();trigDone=false;renderTrig();}
function logTrigMiss(){const it=TRIG[trigIdx];const list=getLog();
  list.unshift({id:uid(),date:todayISO(),type:'trigger',topic:it.s.slice(0,48),note:'Missed in trigger trainer. '+it.why,paper:'Trigger trainer'});
  store.set('errorLog',list);recordActivity();
  const btn=event.target;btn.textContent='Logged ✓';btn.disabled=true;}
SEC.trigger=()=>`
  <div class="eyebrow">Practice · active</div>
  <h2 class="h-sec">Trigger trainer</h2>
  <p class="lead">Knowing equations is useless if you don't recognise <em>when</em> to use them — that's the "trigger gap". This drills pure recognition: read a situation, name the physics, no maths. It attacks the most common failure type head-on.</p>
  <div class="card" id="trigBox"></div>`;

/* ====================== MISCONCEPTION QUIZ + SOCRATIC ====================== */
const QUIZ=[
 {mi:0,q:'In a vacuum, a 5 kg ball and a 1 kg ball are dropped together. Which lands first?',
  opts:[{t:'The 5 kg ball — gravity pulls it harder',c:0},{t:'They land at the same time',c:1},{t:'Depends on their size',c:0}],
  feels:'It feels obvious that more weight means a faster fall, because in everyday life heavier things often do drop faster — but that\'s air resistance, not weight.',
  soc:['Gravity does pull harder on the 5 kg ball. So why doesn\'t it win?',
       'The heavier ball also has more mass to accelerate. What does a = F/m do when BOTH force and mass scale up together?',
       'If a = F/m and force and mass both ×5, the acceleration is unchanged. So in a vacuum, what decides the fall?']},
 {mi:1,q:'In a simple series circuit, how does the current just AFTER the bulb compare to just BEFORE it?',
  opts:[{t:'Less after — the bulb uses some up',c:0},{t:'Exactly the same',c:1},{t:'More after',c:0}],
  feels:'"The bulb consumes something" feels right because the bulb clearly takes energy from the circuit — but what it takes is energy, not charge.',
  soc:['If charge piled up or vanished at the bulb, what would happen to the wire over time?',
       'Think of a bike chain looping round gears — is any chain lost as it passes the gear?',
       'So what is the bulb actually taking from the charge, if not the charge itself?']},
 {mi:2,q:'An astronaut travels to the Moon. What happens to their mass and their weight?',
  opts:[{t:'Both decrease',c:0},{t:'Mass stays the same, weight decreases',c:1},{t:'Both stay the same',c:0}],
  feels:'We use "weight" and "mass" interchangeably in daily speech, so it feels like they must move together.',
  soc:['What is mass actually a measure of — does the amount of stuff in the astronaut change on the Moon?',
       'Weight is a force: W = m g. Which symbol changes between Earth and Moon?',
       'So which quantity is a property of the object, and which depends on where it is?']},
 {mi:3,q:'A puck glides at constant velocity across frictionless ice. What is the net (resultant) force on it?',
  opts:[{t:'A forward force keeping it moving',c:0},{t:'Zero net force',c:1},{t:'A force equal to its weight, forwards',c:0}],
  feels:'On Earth things slow and stop, so it feels like motion needs a continuous push to keep going.',
  soc:['What makes ordinary moving things slow down and stop?',
       'Remove that — frictionless ice, deep space. What would now change the puck\'s motion?',
       'Newton\'s first law: with no resultant force, what does a moving object do?']},
 {mi:4,q:'A sparkler at ~1000 °C and a warm bath at 40 °C. Which holds more thermal energy?',
  opts:[{t:'The sparkler — it\'s far hotter',c:0},{t:'The bath — far more total energy',c:1},{t:'They\'re equal',c:0}],
  feels:'Higher temperature feels like "more heat", so the glowing 1000 °C sparkler seems to win.',
  soc:['Temperature measures the average energy per particle. How many particles are in a sparkler tip vs a bathtub?',
       'Total thermal energy depends on temperature AND how much stuff there is. Which has vastly more stuff?',
       'So can something be very hot yet hold little total energy?']},
 {mi:7,q:'Why do astronauts float inside the ISS, 400 km up?',
  opts:[{t:'There\'s no gravity that high',c:0},{t:'They\'re in continuous free fall (orbit)',c:1},{t:'They\'re beyond Earth\'s pull',c:0}],
  feels:'Floating looks exactly like zero gravity, and "space = no gravity" is a common shorthand.',
  soc:['Gravity at the ISS is still about 90% of surface gravity. So it\'s not absent — what else could cause floating?',
       'In a lift whose cable snaps, you and the floor fall together — what do you feel for those seconds?',
       'The ISS falls toward Earth but moves sideways fast enough to keep missing it. What is that called?']},
 {mi:8,q:'For a fixed voltage, you increase the resistance. What happens to the current?',
  opts:[{t:'It increases',c:0},{t:'It decreases',c:1},{t:'It stays the same',c:0}],
  feels:'If you picture resistance as "powering" the flow, more of it seems like more current — but resistance opposes flow.',
  soc:['Write the relationship: I = V / R. If V is fixed and R grows, which way does the fraction go?',
       'Picture a crowded corridor — does making it narrower let MORE people through per second?',
       'So is resistance the thing driving current, or the thing limiting it?']},
 {mi:10,q:'A car drives round a roundabout at a constant 30 mph. Is it accelerating?',
  opts:[{t:'No — its speed is constant',c:0},{t:'Yes — its direction is changing',c:1},{t:'Only when it brakes',c:0}],
  feels:'"Accelerating" colloquially means speeding up, so constant speed feels like zero acceleration.',
  soc:['Velocity has size AND direction. Is the car\'s direction constant on the curve?',
       'If velocity (the arrow) changes in any way, what must be happening to it?',
       'A changing velocity needs a resultant force — which is why you feel pushed sideways. So is it accelerating?']},
 {mi:11,q:'A bouncing ball finally stops. What happened to its energy?',
  opts:[{t:'It was used up and destroyed',c:0},{t:'It dissipated as heat and sound',c:1},{t:'It turned into mass',c:0}],
  feels:'The energy clearly "ran out", so it feels like it was consumed and gone.',
  soc:['Energy can\'t be created or destroyed. So if it\'s not in motion or height any more, where is it?',
       'Each bounce squashes the ball and makes a sound — what forms of energy are those?',
       'Is "dissipated and spread out as thermal energy" the same as "destroyed"?']},
];
let qIdx=0,qDone=false,qPicked=-1,qSocStep=0,qScore={r:0,t:0};
function renderQuiz(){
  const host=document.getElementById('quizBox');if(!host)return;
  const item=QUIZ[qIdx];const mis=MIS[item.mi];
  const opts=item.opts.map((o,i)=>{let cls='opt';
    if(qDone){if(o.c)cls+=' good';else if(i===qPicked)cls+=' bad';}else if(i===qPicked)cls+=' sel';
    return `<button class="${cls}" onclick="pickQuiz(${i})" ${qDone?'disabled':''}>${esc(o.t)}</button>`}).join('');
  let fb='';
  if(qDone){const right=item.opts[qPicked]&&item.opts[qPicked].c;
    fb=`<div class="${right?'note':'warn'}" style="margin:14px 0 0">
      <span class="eyebrow" style="color:${right?'var(--accent-deep)':'var(--t-concept)'}">${right?'Correct model':'Broken model caught'}</span>
      ${right?'':`<p style="margin:0 0 8px"><strong>Why the wrong answer feels right:</strong> ${item.feels}</p>`}
      <p style="margin:0 0 8px"><strong>What\'s true:</strong> ${mis.right}</p>
      <p style="margin:0"><strong>Analogy:</strong> ${mis.ana}</p></div>
      <div class="card" style="margin-top:12px;background:var(--paper-2)">
        <div class="eyebrow">Rebuild it yourself — Socratic walk</div>
        <div id="socBox"></div></div>`;
  }
  host.innerHTML=`
    <div style="display:flex;justify-content:space-between;margin-bottom:10px">
      <span class="mono" style="font-size:.74rem;color:var(--ink-faint)">Question ${qIdx+1} / ${QUIZ.length}</span>
      <span class="mono" style="font-size:.74rem;color:var(--ink-faint)">Score ${qScore.r}/${qScore.t}</span></div>
    <div class="scenario">${esc(item.q)}</div>
    <div class="opts" style="margin-top:12px">${opts}</div>
    ${fb}
    ${qDone?`<div style="margin-top:14px"><button class="btn" onclick="nextQuiz()">${qIdx<QUIZ.length-1?'Next question':'Restart quiz'}</button></div>`:''}`;
  if(qDone)renderSoc();
}
function renderSoc(){const box=document.getElementById('socBox');if(!box)return;const soc=QUIZ[qIdx].soc;
  let html=soc.slice(0,qSocStep+1).map((s,i)=>`<p style="margin:0 0 10px;${i===qSocStep?'':'opacity:.6'}"><span class="mono" style="color:var(--accent-deep)">Q${i+1}.</span> ${s}</p>`).join('');
  if(qSocStep<soc.length-1)html+=`<button class="btn sm ghost" onclick="qSocStep++;renderSoc()">Next question ›</button>`;
  else html+=`<p class="mono" style="font-size:.78rem;color:var(--rest);margin:4px 0 0">✓ You\'ve walked the full chain. Say the answer aloud.</p>`;
  box.innerHTML=html;}
function pickQuiz(i){if(qDone)return;qPicked=i;qDone=true;qScore.t++;qSocStep=0;
  if(QUIZ[qIdx].opts[i].c)qScore.r++;recordActivity();renderQuiz();}
function nextQuiz(){qIdx=(qIdx+1)%QUIZ.length;if(qIdx===0)qScore={r:0,t:0};qDone=false;qPicked=-1;qSocStep=0;renderQuiz();}
SEC.miscquiz=()=>`
  <div class="eyebrow">Practice · active</div>
  <h2 class="h-sec">Misconception check</h2>
  <p class="lead">Each question is built around a tempting wrong answer — the exact broken model that survives GCSE. Pick what feels true. If it's the trap, you'll see why it fooled you, the correct mechanism, and a Socratic chain that rebuilds the idea from your own reasoning.</p>
  <div class="card" id="quizBox"></div>`;
/* ====================== EQUATION EXPLORER (predict → reveal) ====================== */
const EQS=[
 {id:'ke',name:'Kinetic energy',form:'Eₖ = ½ · m · v²',unit:'J',
  vars:[{s:'m',label:'mass',min:1,max:50,step:1,val:10,unit:'kg'},{s:'v',label:'velocity',min:0,max:20,step:1,val:5,unit:'m/s'}],
  calc:v=>0.5*v.m*v.v*v.v,
  insight:'v is squared. Double the velocity and energy <strong>quadruples</strong>; double the mass and it only doubles. Speed dominates energy — which is why crash energy rises so steeply with speed.',
  predict:{q:'Before touching anything: if you double the velocity (mass fixed), kinetic energy will…',opts:['double','quadruple','stay the same'],a:1}},
 {id:'weight',name:'Weight',form:'W = m · g',unit:'N',
  vars:[{s:'m',label:'mass',min:1,max:100,step:1,val:50,unit:'kg'},{s:'g',label:'gravity',min:0,max:25,step:0.5,val:9.8,unit:'N/kg'}],
  calc:v=>v.m*v.g,
  insight:'Mass stays fixed wherever you go; weight scales with g. On the Moon (g ≈ 1.6) the same mass weighs about a sixth. Mass is the stuff; weight is the pull.',
  predict:{q:'Move the mass slider to the Moon\'s gravity (~1.6). The mass reading will…',opts:['drop too','stay the same','go up'],a:1}},
 {id:'ohm',name:'Ohm\'s law (current)',form:'I = V / R',unit:'A',
  vars:[{s:'V',label:'voltage',min:1,max:24,step:1,val:12,unit:'V'},{s:'R',label:'resistance',min:1,max:100,step:1,val:6,unit:'Ω'}],
  calc:v=>v.V/v.R,
  insight:'Resistance is on the bottom: raise R and current <strong>falls</strong>. Resistance limits flow, it never drives it — the classic backwards intuition.',
  predict:{q:'With voltage fixed, you slide resistance much higher. Current will…',opts:['increase','decrease','stay the same'],a:1}},
 {id:'power',name:'Resistive heating',form:'P = I² · R',unit:'W',
  vars:[{s:'I',label:'current',min:0,max:10,step:0.5,val:2,unit:'A'},{s:'R',label:'resistance',min:1,max:50,step:1,val:5,unit:'Ω'}],
  calc:v=>v.I*v.I*v.R,
  insight:'Current is squared, so heat dissipated climbs steeply with current. This is why thin overloaded wires get dangerously hot and why power is sent at high voltage / low current.',
  predict:{q:'Double the current (resistance fixed). Power dissipated will…',opts:['double','quadruple','halve'],a:1}},
 {id:'fma',name:'Newton\'s second law',form:'a = F / m',unit:'m/s²',
  vars:[{s:'F',label:'resultant force',min:0,max:200,step:5,val:50,unit:'N'},{s:'m',label:'mass',min:1,max:100,step:1,val:25,unit:'kg'}],
  calc:v=>v.F/v.m,
  insight:'For the same force, more mass means less acceleration — the loaded trolley barely moves. This is exactly why a heavy and light object fall together: gravity gives more force AND more mass, cancelling.',
  predict:{q:'Same force, but you double the mass. Acceleration will…',opts:['double','halve','stay the same'],a:1}},
 {id:'gpe',name:'Gravitational PE',form:'Eₚ = m · g · h',unit:'J',
  vars:[{s:'m',label:'mass',min:1,max:50,step:1,val:10,unit:'kg'},{s:'h',label:'height',min:0,max:30,step:1,val:10,unit:'m'}],
  calc:v=>v.m*9.8*v.h,
  insight:'All three factors are linear here (g fixed at 9.8). Lifting twice as high stores twice the energy — which becomes kinetic energy on the way down, linking GPE and KE.',
  predict:{q:'Lift the same mass to triple the height. Stored energy will…',opts:['triple','×9','stay the same'],a:0}},
];
let exIdx=0,exPredicted=false,exVals={},exPredPick=-1;
function loadEx(){const e=EQS[exIdx];exVals={};e.vars.forEach(v=>exVals[v.s]=v.val);exPredicted=false;exPredPick=-1;}
function renderEx(){
  const host=document.getElementById('exBox');if(!host)return;const e=EQS[exIdx];
  const tabs=EQS.map((q,i)=>`<button class="seg ${i===exIdx?'on':''}" onclick="exIdx=${i};loadEx();renderEx()">${q.name}</button>`).join('');
  let body;
  if(!exPredicted){
    body=`<div class="predict">
      <div class="eyebrow">Predict first</div>
      <p style="margin:6px 0 12px;font-weight:500">${e.predict.q}</p>
      <div class="opts">${e.predict.opts.map((o,i)=>`<button class="opt" onclick="exPredict(${i})">${o}</button>`).join('')}</div>
      <p class="muted" style="font-size:.82rem;margin:10px 0 0">Committing to a prediction first is what turns a slider into learning.</p>
    </div>`;
  }else{
    const res=e.calc(exVals);
    const sliders=e.vars.map(v=>`<div class="sld">
      <div style="display:flex;justify-content:space-between;font-size:.84rem;margin-bottom:2px"><span>${v.label} (${v.s})</span><span class="mono">${exVals[v.s]} ${v.unit}</span></div>
      <input type="range" min="${v.min}" max="${v.max}" step="${v.step}" value="${exVals[v.s]}" oninput="exSet('${v.s}',this.value)"></div>`).join('');
    const correct=exPredPick===e.predict.a;
    body=`<div class="${correct?'note':'warn'}" style="margin:0 0 14px">
        <span class="eyebrow" style="color:${correct?'var(--accent-deep)':'var(--t-concept)'}">Your prediction: ${e.predict.opts[exPredPick]} — ${correct?'right':'let the sliders show you'}</span>
        ${e.insight}</div>
      ${sliders}
      <div class="readout"><span class="mono" style="font-size:.86rem;color:var(--ink-faint)">${e.form} =</span>
        <span class="big-res">${fmtNum(res)}</span><span class="mono">${e.unit}</span></div>`;
  }
  host.innerHTML=`<div class="segwrap">${tabs}</div>
    <h4 class="sub" style="margin:16px 0 2px">${e.name}</h4>
    <div class="eq" style="margin:8px 0 16px">${e.form}</div>${body}`;
}
function fmtNum(n){if(!isFinite(n))return'∞';if(Math.abs(n)>=1000)return Math.round(n).toLocaleString();return Math.round(n*100)/100}
function exPredict(i){exPredPick=i;exPredicted=true;recordActivity();renderEx();}
function exSet(s,val){exVals[s]=parseFloat(val);renderEx();
  // keep focus feel: re-grab slider not needed since values shown in label
}
SEC.explorer=()=>`
  <div class="eyebrow">Practice · interactive</div>
  <h2 class="h-sec">Equation explorer</h2>
  <p class="lead">An equation is a relationship, not a string of letters. Predict what a change will do, then move the sliders and watch — until "v is squared" stops being a fact you memorised and becomes something you've seen.</p>
  <div class="card" id="exBox"></div>`;

/* ====================== COUNTERFACTUAL GENERATOR ====================== */
const CF=[
 {topic:'Forces',o:'A ball is dropped on Earth and accelerates downward.',f:'What if gravity suddenly doubled?',r:'It would accelerate twice as fast (a = g, now ~19.6 m/s²), hit the ground sooner and harder. Weight (mg) doubles, but its mass — the amount of stuff — is unchanged.'},
 {topic:'Forces',o:'A car drives along a flat road and must keep its engine on to hold speed.',f:'What if all friction and air resistance vanished?',r:'It would keep moving at constant velocity with the engine off (Newton\'s first law). On Earth the engine only exists to cancel friction and drag, not to "maintain motion".'},
 {topic:'Waves',o:'Light travels from air into glass and slows, bending toward the normal.',f:'Flip it: light travels from glass into air.',r:'It speeds up and bends AWAY from the normal. Past a critical angle it can\'t escape at all — total internal reflection, the principle behind optical fibres.'},
 {topic:'Electricity',o:'Two identical bulbs are wired in series and glow dimly.',f:'What if you rewired them in parallel instead?',r:'Each bulb gets the full supply voltage, so both glow brightly. Total resistance drops, total current rises, and one bulb failing no longer breaks the other\'s circuit.'},
 {topic:'Particle model',o:'A sealed gas cylinder sits at room temperature with a steady pressure.',f:'What if you doubled the absolute temperature?',r:'Particles move faster and hit the walls harder and more often, so pressure roughly doubles (at fixed volume). Temperature is average particle kinetic energy made visible as pressure.'},
 {topic:'Energy',o:'A pendulum swings, trading height for speed and back.',f:'What if there were no air resistance or friction at the pivot?',r:'It would swing forever at the same amplitude — energy perfectly cycling between gravitational and kinetic stores. Real pendulums die down only because friction dissipates energy as heat.'},
 {topic:'Forces',o:'A skydiver reaches terminal velocity and falls at a steady speed.',f:'What if they fell on the Moon (no atmosphere)?',r:'No air means no drag, so there is no terminal velocity — they accelerate the whole way down at the Moon\'s g (~1.6 m/s²), never reaching a steady speed.'},
 {topic:'Radioactivity',o:'A sample has a half-life of 10 years; after 10 years half remains.',f:'What if you heated it strongly or crushed it?',r:'Nothing changes. Radioactive decay is a property of the unstable nucleus and is unaffected by temperature, pressure, or chemistry — you cannot rush or slow it.'},
 {topic:'Motion',o:'You drop a coin while standing still and it lands at your feet.',f:'What if you dropped it on a smoothly moving train?',r:'It still lands at your feet. The coin shares the train\'s horizontal velocity (inertia), so from inside it falls straight down — exactly as if the train were still.'},
 {topic:'Energy',o:'An electric car brakes to a stop using friction brakes.',f:'What if it used regenerative braking instead?',r:'Instead of dumping kinetic energy as brake heat, the motor runs as a generator and returns much of it to the battery. Same physics — energy can\'t be destroyed, only redirected to a more useful store.'},
];
let cfIdx=0,cfShown=false;
function renderCF(){const host=document.getElementById('cfBox');if(!host)return;const c=CF[cfIdx];
  host.innerHTML=`<span class="tag" style="background:var(--ink-soft)">${c.topic}</span>
    <p style="margin:12px 0 4px;color:var(--ink-soft);font-size:.92rem"><strong>Setup:</strong> ${esc(c.o)}</p>
    <div class="scenario" style="margin:8px 0">${esc(c.f)}</div>
    <p class="muted" style="font-size:.84rem;margin:0 0 12px">Say your prediction out loud — commit to a mechanism — before revealing.</p>
    ${cfShown?`<div class="note"><span class="eyebrow">The physics</span>${c.r}</div>`:`<button class="btn amber" onclick="cfShown=true;renderCF();recordActivity()">Reveal the physics</button>`}
    <div style="margin-top:14px"><button class="btn ghost sm" onclick="cfNext()">↻ Another scenario</button></div>`;
}
function cfNext(){cfIdx=(cfIdx+1)%CF.length;cfShown=false;renderCF();}
SEC.counterfactual=()=>`
  <div class="eyebrow">Practice · interactive</div>
  <h2 class="h-sec">Counterfactuals</h2>
  <p class="lead">The fastest way to test whether you understand a mechanism is to break it. Each scenario flips a rule — what if gravity doubled, friction vanished, the light went the other way — and asks you to predict the consequence before revealing it.</p>
  <div class="card" id="cfBox"></div>`;

/* ====================== DAILY PHYSICS LENS ====================== */
const LENS=['a kettle boiling','a lift starting and stopping','kicking a football','riding a bicycle','a microwave heating food','a phone charging','ice melting in a drink','a door swinging shut','rain on a car window','a spinning office chair','headphones producing sound','a fridge keeping cool','a bridge under traffic','sunlight through a window','a ball bouncing'];
function lensToday(){const d=todayISO();let h=0;for(const ch of d)h=(h*31+ch.charCodeAt(0))%9973;return LENS[h%LENS.length]}
function getLens(){return store.get('lensJournal',[])}
function saveLens(){const t=document.getElementById('lensText').value.trim();if(!t)return;
  const list=getLens();list.unshift({id:uid(),date:todayISO(),prompt:lensToday(),text:t});
  store.set('lensJournal',list);document.getElementById('lensText').value='';recordActivity();go('lens',true);}
function delLens(id){store.set('lensJournal',getLens().filter(x=>x.id!==id));go('lens',true)}
SEC.lens=()=>{const list=getLens();const doneToday=list.some(x=>x.date===todayISO());
  return `
  <div class="eyebrow">Working tool · daily</div>
  <h2 class="h-sec">Daily physics lens</h2>
  <p class="lead">Transfer is a habit, not an event. Once a day, explain one ordinary thing you saw using physics. Tiny, but it trains your brain to see mechanisms everywhere — which is the real goal.</p>
  <div class="card">
    <div class="eyebrow">Today's nudge</div>
    <div class="scenario" style="margin:8px 0 12px">Explain the physics of <strong>${lensToday()}</strong> — or anything else you noticed today.</div>
    ${doneToday?'<p class="mono" style="color:var(--rest);font-size:.84rem;margin:0 0 10px">✓ Logged today. Add another if you like.</p>':''}
    <textarea id="lensText" placeholder="What did you notice, and which physics explains it? A sentence or two is plenty."></textarea>
    <button class="btn amber sm" onclick="saveLens()">Save to journal</button>
  </div>
  <h3 class="blk">Your physics-in-the-wild journal</h3>
  <div id="lensList">${list.length?list.map(x=>`<div class="card" style="margin:10px 0">
    <span class="meta mono" style="font-size:.7rem;color:var(--ink-faint)">${fmtDate(x.date)} · ${esc(x.prompt)}</span>
    <p style="margin:8px 0 0;font-size:.93rem">${esc(x.text)}</p>
    <button class="btn sm ghost" style="margin-top:8px" onclick="delLens('${x.id}')">Remove</button></div>`).join(''):'<p class="empty">Empty. Your first entry starts the journal — and the streak on your dashboard.</p>'}</div>`;
};
/* ====================== CONCEPT DEPENDENCY MAP ====================== */
const NODES=[
 {id:'vec',label:'Vectors &\ncomponents',x:300,y:40,kw:['vector','component','resolve'],
  intuition:'Orthogonal directions don\'t talk to each other — what happens horizontally is independent of what happens vertically.',
  shift:'You stop using scalars and start resolving forces and velocities into components (F·cosθ, F·sinθ).',
  cs:'Exactly like a 2D game loop: x and y velocity components update independently each frame.',
  trap:'Treating a diagonal force as a single number instead of two independent components.',prereq:[]},
 {id:'kin',label:'Kinematics\n(calculus of motion)',x:300,y:140,kw:['kinematic','suvat','velocity','acceleration','motion','speed'],
  intuition:'Velocity is how fast position updates; acceleration is how fast velocity updates.',
  shift:'GCSE\'s constant-acceleration SUVAT gives way to changing acceleration via calculus: v = ds/dt, a = dv/dt, s = ∫v dt.',
  cs:'If you grasp an Euler loop — velocity += accel*dt; position += velocity*dt — you already grasp kinematics.',
  trap:'Confusing the gradient (rate) with the area (accumulated quantity) on motion graphs.',prereq:['vec']},
 {id:'newton',label:'Newton\'s laws\n(dynamics)',x:300,y:240,kw:['newton','force','dynamics','resultant','equilibrium','friction'],
  intuition:'Force doesn\'t cause motion — it CHANGES motion. Zero net force means velocity is unchanged, even at 100 m/s.',
  shift:'You build free-body diagrams for inclined planes, friction, and connected masses, solving ΣF = ma simultaneously.',
  cs:'Net force is the only thing that mutates the velocity vector; with ΣF = 0 the state just persists.',
  trap:'Believing a forward-moving object must have a forward force on it.',prereq:['kin']},
 {id:'energy',label:'Work–energy\ntheorem',x:160,y:350,kw:['energy','work','power','kinetic','potential','gpe','ke'],
  intuition:'Energy is scalar bookkeeping. Work is the mechanism that transfers it: force acting over a distance.',
  shift:'You track transformations between GPE (mgh), KE (½mv²) and dissipation, using W = ∫F·dx.',
  cs:'A running total you add to and subtract from — direction doesn\'t matter, only amount.',
  trap:'Saying energy is "used up" rather than transferred to a less useful (usually thermal) store.',prereq:['newton']},
 {id:'mom',label:'Momentum\n& impulse',x:440,y:350,kw:['momentum','impulse','collision','conservation'],
  intuition:'Energy tracks force over distance; momentum tracks force over TIME. Impulse = ∫F dt = Δp.',
  shift:'You use vector components (Tier 1) to handle 2D collisions — balls scattering at angles.',
  cs:'A conserved vector quantity: the total before equals the total after, summed component-wise.',
  trap:'Assuming kinetic energy is conserved in every collision — only momentum always is.',prereq:['newton']},
 {id:'rot',label:'Rotational\nmechanics & moments',x:300,y:455,kw:['moment','torque','rotation','pivot','inertia','angular'],
  intuition:'Forces can rotate as well as push. The turning effect depends on perpendicular distance from the pivot: M = F·d.',
  shift:'You solve static equilibrium where BOTH ΣF = 0 and ΣM = 0 must hold.',
  cs:'Add an angular state (angle, angular velocity) alongside the linear one — same integration, new axis.',
  trap:'Forgetting that a balanced object needs zero net moment, not just zero net force.',prereq:['energy','mom']},
];
function weakNodes(){const topics=getLog().filter(e=>e.type==='concept'||e.type==='trigger').map(e=>(e.topic||'').toLowerCase());
  const set=new Set();NODES.forEach(n=>{if(topics.some(t=>n.kw.some(k=>t.includes(k))))set.add(n.id)});return set}
let selectedNode=null;
function conceptSVG(){
  const weak=weakNodes();
  const edge=(a,b)=>{const A=NODES.find(n=>n.id===a),B=NODES.find(n=>n.id===b);
    return `<line x1="${A.x}" y1="${A.y+18}" x2="${B.x}" y2="${B.y-18}" stroke="var(--line)" stroke-width="2"/>`};
  let edges='';NODES.forEach(n=>n.prereq.forEach(p=>edges+=edge(p,n.id)));
  const nodes=NODES.map(n=>{const w=weak.has(n.id);const sel=selectedNode===n.id;
    const lines=n.label.split('\n');
    return `<g class="cnode ${sel?'sel':''}" tabindex="0" role="button" aria-label="${n.label.replace(/\n/g,' ')}"
       onclick="selNode('${n.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selNode('${n.id}')}">
      <rect x="${n.x-78}" y="${n.y-20}" width="156" height="40" rx="9"
        fill="${sel?'var(--ink)':'var(--card)'}" stroke="${w?'var(--t-concept)':(sel?'var(--ink)':'var(--line)')}" stroke-width="${w?2.5:1.5}"/>
      ${lines.map((l,i)=>`<text x="${n.x}" y="${n.y+(lines.length===1?4:(i===0?-2:11))}" text-anchor="middle" font-size="11" font-weight="500"
        fill="${sel?'#fff':'var(--ink)'}" font-family="Inter">${l}</text>`).join('')}
      ${w?`<circle cx="${n.x+68}" cy="${n.y-12}" r="7" fill="var(--t-concept)"/><text x="${n.x+68}" y="${n.y-8}" text-anchor="middle" font-size="9" fill="#fff" font-weight="700">!</text>`:''}
    </g>`}).join('');
  return `<svg viewBox="0 0 600 510" role="img" aria-label="Mechanics concept dependency tree">${edges}${nodes}</svg>`;
}
function selNode(id){selectedNode=id;const svgHost=document.getElementById('cmSvg');if(svgHost)svgHost.innerHTML=conceptSVG();
  const d=document.getElementById('nodeDetail');const n=NODES.find(x=>x.id===id);if(!d||!n)return;
  const weak=weakNodes().has(id);const prereqLabels=n.prereq.map(p=>NODES.find(x=>x.id===p).label.replace(/\n/g,' ')).join(', ');
  d.innerHTML=`<div class="card" style="margin:0">
    <h4 style="margin:0 0 8px">${n.label.replace(/\n/g,' ')}</h4>
    ${weak?`<div class="warn" style="margin:0 0 12px"><span class="eyebrow" style="color:var(--t-concept)">Flagged weak</span>Your error log shows conceptual or trigger gaps in this area. Repair it before relying on anything below it in the tree.</div>`:''}
    <p style="margin:0 0 8px"><strong>Core intuition.</strong> ${n.intuition}</p>
    <p style="margin:0 0 8px"><strong>The A-level shift.</strong> ${n.shift}</p>
    <p style="margin:0 0 8px"><span class="tg" style="background:var(--t-concept)">TRAP TO KILL</span> ${n.trap}</p>
    <p style="margin:0;font-size:.86rem;color:var(--ink-faint)"><strong>Depends on:</strong> ${prereqLabels||'nothing — this is a foundation'}</p>
  </div>`;
}
SEC.conceptmap=()=>{selectedNode=null;return `
  <div class="eyebrow">Reference · A-level</div>
  <h2 class="h-sec">Concept dependency map</h2>
  <p class="lead">A-level mechanics is integrated, not modular. This is the order the ideas actually depend on each other — never climb a tier until the one above is ironclad. Topics your error log flags as weak are ringed in red.</p>
  <div class="card"><div id="cmSvg">${conceptSVG()}</div>
    <p class="muted" style="font-size:.82rem;margin:10px 0 0;text-align:center">Tap any node for its intuition, the A-level shift, and the trap to kill.</p></div>
  <div id="nodeDetail" style="margin-top:16px"><p class="empty">Select a node above to see how to master it — and what it secretly depends on.</p></div>`;
};

/* ====================== PHYSICS SANDBOX (canvas) ====================== */
let sbRaf=null,sbBalls=[],sbCanvas=null,sbCtx=null;
let sbG=0.4,sbDrag=0,sbRest=0.8;
function stopSandbox(){if(sbRaf){cancelAnimationFrame(sbRaf);sbRaf=null}}
function startSandbox(){
  sbCanvas=document.getElementById('sbCanvas');if(!sbCanvas)return;
  sbCtx=sbCanvas.getContext('2d');
  if(!sbBalls.length)sbDropDemo();
  stopSandbox();loopSandbox();
}
function sbAddBall(r){const W=sbCanvas.width;sbBalls.push({x:40+Math.random()*(W-80),y:40,vx:(Math.random()-.5)*4,vy:0,r:r||(8+Math.random()*16)});}
function sbDropDemo(){sbBalls=[{x:sbCanvas.width*0.38,y:30,vx:0,vy:0,r:10},{x:sbCanvas.width*0.62,y:30,vx:0,vy:0,r:26}];}
function sbLaunch(){sbBalls.push({x:24,y:sbCanvas.height-24,vx:7+Math.random()*3,vy:-(9+Math.random()*3),r:11});}
function sbClear(){sbBalls=[];}
function loopSandbox(){
  if(!sbCtx)return;const W=sbCanvas.width,H=sbCanvas.height;
  sbCtx.clearRect(0,0,W,H);
  // grid floor line
  sbCtx.strokeStyle='rgba(22,27,46,.12)';sbCtx.beginPath();sbCtx.moveTo(0,H-2);sbCtx.lineTo(W,H-2);sbCtx.stroke();
  sbBalls.forEach(b=>{
    b.vy+=sbG;
    if(sbDrag>0){const f=1-sbDrag*0.02;b.vx*=f;b.vy*=f;}
    b.x+=b.vx;b.y+=b.vy;
    if(b.y+b.r>H){b.y=H-b.r;b.vy*=-sbRest;if(Math.abs(b.vy)<0.6)b.vy=0;b.vx*=0.99;}
    if(b.x-b.r<0){b.x=b.r;b.vx*=-sbRest;}
    if(b.x+b.r>W){b.x=W-b.r;b.vx*=-sbRest;}
    const grd=sbCtx.createRadialGradient(b.x-b.r*.3,b.y-b.r*.3,b.r*.2,b.x,b.y,b.r);
    grd.addColorStop(0,'#E9A94B');grd.addColorStop(1,'#C77F1A');
    sbCtx.fillStyle=grd;sbCtx.beginPath();sbCtx.arc(b.x,b.y,b.r,0,7);sbCtx.fill();
  });
  sbRaf=requestAnimationFrame(loopSandbox);
}
function sbControl(which,val){val=parseFloat(val);if(which==='g')sbG=val;if(which==='drag')sbDrag=val;if(which==='rest')sbRest=val;
  document.getElementById('sb_'+which+'_v').textContent=val.toFixed(2);}
SEC.sandbox=()=>`
  <div class="eyebrow">Practice · sandbox</div>
  <h2 class="h-sec">Physics sandbox</h2>
  <p class="lead">Change the rules of the world and watch what happens. Try the "drop two masses" demo with drag at zero — they fall together — then add drag and watch the big one win. Feeling it beats being told it.</p>
  <div class="card">
    <canvas id="sbCanvas" width="540" height="300" style="width:100%;height:auto;background:var(--paper-2);border-radius:10px;display:block"></canvas>
    <div class="sbctl">
      <div class="sld"><div style="display:flex;justify-content:space-between;font-size:.82rem"><span>Gravity</span><span class="mono" id="sb_g_v">0.40</span></div>
        <input type="range" min="0" max="1.2" step="0.05" value="0.4" oninput="sbControl('g',this.value)"></div>
      <div class="sld"><div style="display:flex;justify-content:space-between;font-size:.82rem"><span>Air drag</span><span class="mono" id="sb_drag_v">0.00</span></div>
        <input type="range" min="0" max="2" step="0.1" value="0" oninput="sbControl('drag',this.value)"></div>
      <div class="sld"><div style="display:flex;justify-content:space-between;font-size:.82rem"><span>Bounciness</span><span class="mono" id="sb_rest_v">0.80</span></div>
        <input type="range" min="0" max="1" step="0.05" value="0.8" oninput="sbControl('rest',this.value)"></div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
      <button class="btn sm amber" onclick="sbDropDemo()">Drop heavy + light</button>
      <button class="btn sm" onclick="sbLaunch()">Launch projectile</button>
      <button class="btn sm ghost" onclick="sbAddBall()">Add ball</button>
      <button class="btn sm ghost" onclick="sbClear()">Clear</button>
    </div>
    <p class="muted" style="font-size:.82rem;margin:12px 0 0">Note: the two demo balls are different sizes but fall identically while drag = 0 — size and weight don't change acceleration under gravity alone. Crank drag up and the larger one slows more, just like a feather in air.</p>
  </div>`;

/* ====================== SCHEDULER v2 — confidence-based ====================== */
function reviewSR(id,grade){const list=getSR();const it=list.find(x=>x.id===id);if(!it)return;
  const max=SR_INT.length-1;
  if(grade==='again')it.idx=0;
  else if(grade==='hard')it.idx=it.idx; // repeat same interval
  else if(grade==='good')it.idx=Math.min(it.idx+1,max);
  else if(grade==='easy')it.idx=Math.min(it.idx+2,max);
  const d=new Date();d.setDate(d.getDate()+SR_INT[it.idx]);it.due=d.toISOString().slice(0,10);
  store.set('srItems',list);recordActivity();rerenderTools();}
function renderSRList(host,miniOnlyDue){
  if(!host)return;const list=getSR();const today=todayISO();
  const due=list.filter(x=>x.due<=today).sort((a,b)=>a.due.localeCompare(b.due));
  const later=list.filter(x=>x.due>today).sort((a,b)=>a.due.localeCompare(b.due));
  if(!list.length){host.innerHTML='<p class="empty">Nothing scheduled. Add a concept or whole problem you want to still know in a month.</p>';return}
  const grades=`<span class="grades">
     <button class="gbtn again" onclick="reviewSR('$ID','again')" title="Couldn't do it">Again</button>
     <button class="gbtn hard" onclick="reviewSR('$ID','hard')" title="Got there, hard">Hard</button>
     <button class="gbtn good" onclick="reviewSR('$ID','good')" title="Solid, cold">Good</button>
     <button class="gbtn easy" onclick="reviewSR('$ID','easy')" title="Trivial now">Easy</button></span>`;
  const row=(x,isDue)=>{const over=daysBetween(x.due,today);
    const status=isDue?(over>0?`${over}d overdue`:'due today'):`in ${daysBetween(today,x.due)}d`;
    return `<div class="srrow">
      <span class="dot" style="background:${isDue?'var(--due)':'var(--rest)'}"></span>
      <span class="cn">${esc(x.concept)}</span>
      <span class="meta">${status} · stage ${x.idx+1}/${SR_INT.length}</span>
      ${isDue?grades.replace(/\$ID/g,x.id):`<button class="btn sm ghost" onclick="delSR('${x.id}')">✕</button>`}
    </div>`};
  let html='';
  if(due.length)html+=`<div class="eyebrow" style="margin:6px 0 8px">Due now · ${due.length} — attempt cold, then grade honestly</div>`+due.map(x=>row(x,true)).join('');
  else if(!miniOnlyDue)html+='<p class="empty">Nothing due today. The amber line is holding. ✓</p>';
  if(!miniOnlyDue&&later.length)html+=`<div class="eyebrow" style="margin:18px 0 8px">Upcoming</div>`+later.map(x=>row(x,false)).join('');
  if(miniOnlyDue&&!due.length)html='<p class="empty">Nothing due today. Add something below or open the full scheduler.</p>';
  host.innerHTML=html;}
function srForm(mini){const p=mini?'m':'';return `<div class="card"><label class="fld">Concept or problem to lock in</label>
  <div style="display:flex;gap:8px"><input id="${p}srInput" placeholder="e.g. re-solve the projectile range problem" style="margin:0" onkeydown="if(event.key==='Enter')addSR(${mini})">
  <button class="btn amber" onclick="addSR(${mini})" style="white-space:nowrap">Schedule</button></div>
  <p class="muted" style="font-size:.8rem;margin:8px 0 0">When due, attempt it <em>cold</em>, then grade: <strong>Again</strong> resets · <strong>Hard</strong> repeats · <strong>Good</strong> advances · <strong>Easy</strong> jumps ahead. Intervals: ${SR_INT.join(' → ')} days.</p></div>`}
SEC.scheduler=()=>`
  <div class="eyebrow">Working tool</div>
  <h2 class="h-sec">Review scheduler</h2>
  <p class="lead">Concept-level spaced repetition for what flashcards can't test — whether you can still <em>solve</em> a problem cold. Grade by confidence and the intervals adapt: shaky items come back fast, solid ones drift away.</p>
  ${srForm(false)}
  <div id="srList" style="margin-top:18px"></div>`;

/* ====================================================================
   VERSION 3 — TUTOR INTELLIGENCE LAYER
   Onboarding · study plan · written diagnosis · concept contrasts ·
   mental-model pages · memory-strength · root-cause hints
   ==================================================================== */

/* ---- learner profile (light setup, never blocks use) ---- */
function getProfile(){return store.get('profile',{level:null,goal:null})}
function setProfile(k,v){const p=getProfile();p[k]=v;store.set('profile',p)}

/* ---- memory-strength labels (more intuitive than %) ---- */
const STRENGTH=[{l:'New',c:'var(--ink-faint)'},{l:'Weak',c:'var(--t-concept)'},{l:'Stable',c:'var(--accent-deep)'},{l:'Strong',c:'var(--t-slip)'},{l:'Automatic',c:'var(--t-slip)'},{l:'Automatic',c:'var(--t-slip)'}];
function strengthFor(idx){return STRENGTH[Math.min(idx,STRENGTH.length-1)]}

/* ---- root-cause: map a weak topic to its prerequisite foundations ---- */
function rootCauseFor(topic){const t=(topic||'').toLowerCase();
  const node=NODES.find(n=>n.kw.some(k=>t.includes(k)));
  if(!node||!node.prereq.length)return null;
  return node.prereq.map(p=>NODES.find(x=>x.id===p).label.replace(/\n/g,' '));}

/* ---- HELP additions for new pages ---- */
HELP.plan={what:'Your tutor\'s plan for today — what to do, in what order, and why.',
  how:['Work top to bottom; each block links straight to the tool.','Read the prescription — it tells you what to do AND what to avoid.','Check the written diagnosis to see what\'s really holding you back.']};
HELP.contrast={what:'Side-by-side pages for the concept pairs students mix up constantly.',
  how:['Pick a pair.','Read the two columns together — the meaning is in the difference.','Memorise the "tell" so you never confuse them in an exam.']};
HELP.models={what:'Deep mental-model pages: the correct model, the wrong ones, and where each model stops working.',
  how:['Open a concept.','Read the model, then the predictions it makes.','Pay attention to the boundaries — knowing where a model breaks is real understanding.']};

/* ====================== STUDY PLAN / PRESCRIPTION / DIAGNOSIS ====================== */
const PRESCRIPTION={
 recall:{dx:'Recall gap — facts and equations aren\'t sticking',
   doIt:['Make flashcards for each missing fact','Add the trickier ones to the scheduler','Quick daily retrieval until they\'re automatic'],
   avoid:'Avoid grinding full problem sets — the bottleneck is memory, not method.'},
 trigger:{dx:'Trigger gap — you know the tools but miss the cue to use them',
   doIt:['Do interleaved, mixed-topic problems','Run the trigger trainer','Force yourself to name the model before any maths'],
   avoid:'Avoid blocked single-topic drilling — it hides the very skill you\'re missing.'},
 concept:{dx:'Conceptual error — a broken mental model is firing',
   doIt:['Stop doing problems for now','Rebuild the model in Repair + the misconception check','Explain it aloud (Feynman) before returning to practice'],
   avoid:'Avoid more practice questions — you\'ll just reinforce the broken model.'},
 slip:{dx:'Slips — the physics is right, the execution isn\'t',
   doIt:['Build a fixed pre-flight checklist: units → equation → substitute → check','Slow down on the final lines','Re-mark your own work hunting only for careless errors'],
   avoid:'Avoid blaming "silly mistakes" — treat them as a process to fix, not bad luck.'},
 comp:{dx:'Comprehension — you\'re losing marks decoding the question',
   doIt:['Drill command words: state / describe / explain / evaluate','Annotate key terms before answering','Rephrase each question in your own words first'],
   avoid:'Avoid diving into calculation before you\'re sure what\'s being asked.'},
};
function dominantType(){const tc=typeCounts();const e=Object.entries(tc).sort((a,b)=>b[1]-a[1])[0];return e&&e[1]>0?e[0]:null}
function forgettingForecast(){const list=getSR();const today=new Date();const horizon=new Date();horizon.setDate(today.getDate()+4);
  const h=horizon.toISOString().slice(0,10);const t=todayISO();
  return list.filter(x=>x.due>t&&x.due<=h).sort((a,b)=>a.due.localeCompare(b.due));}
function todayPlan(){
  const blocks=[];const due=dueCount();const dom=dominantType();const log=getLog();const res=resurrectable();
  if(due>0)blocks.push({m:10,t:`Clear ${due} due review${due>1?'s':''}`,d:'Overdue retrieval decays fastest — always first.',to:'scheduler'});
  if(res.length)blocks.push({m:5,t:'Revisit one 30-day-old mistake',d:'The real test of learning: can you still solve it cold?',to:'dashboard'});
  if(!log.length){blocks.push({m:20,t:'Log a diagnostic paper section',d:'Sort every miss by failure type so the app can start coaching you.',to:'diagnose'});}
  else if(dom==='concept')blocks.push({m:15,t:'Hunt a misconception',d:'Your dominant gap is a broken model. Rebuild it actively.',to:'miscquiz'});
  else if(dom==='trigger')blocks.push({m:15,t:'Trigger recognition drills',d:'Train spotting which model a situation needs.',to:'trigger'});
  else if(dom==='recall')blocks.push({m:10,t:'Schedule & recall weak facts',d:'Push the missing facts into spaced retrieval.',to:'scheduler'});
  else if(dom==='slip')blocks.push({m:10,t:'Re-mark for slips, build a checklist',d:'Fix execution, not theory.',to:'diagnose'});
  else if(dom==='comp')blocks.push({m:10,t:'Command-word & vocabulary drill',d:'Make the questions decode instantly.',to:'misconceptions'});
  else blocks.push({m:15,t:'Pick any practice module',d:'No dominant weakness yet — generate some signal.',to:'trigger'});
  blocks.push({m:10,t:'One application or counterfactual',d:'Use a concept outside an exam question — that\'s where understanding shows.',to:'counterfactual'});
  blocks.push({m:5,t:'Daily lens — explain one real thing',d:'Keep the transfer habit and the streak alive.',to:'lens'});
  return blocks;
}
function buildReport(){
  const log=getLog();const streak=currentStreak();const dom=dominantType();
  const sr=getSR();const tn=getTransfer().length;const due=dueCount();const lens=getLens().length;
  const out=[];
  out.push(streak>=3?`You're on a ${streak}-day streak — consistency is the single biggest predictor of retention, and you've got it.`:
    streak>0?`You've been active ${streak} day${streak>1?'s':''} running. Aim for a steady daily rhythm — little and often beats cramming.`:
    `No active streak right now. The most valuable thing you can do is show up briefly every day, even for ten minutes.`);
  if(!log.length){out.push('There isn\'t enough logged data yet to diagnose your weaknesses. Do one paper section, sort the misses by failure type in the error log, and this report will sharpen immediately.');return out;}
  const tc=typeCounts();const total=Object.values(tc).reduce((a,b)=>a+b,0);
  out.push(`You've logged ${total} gap${total>1?'s':''}. Your dominant failure type is ${TYPE_META[dom].label.toLowerCase()} — ${PRESCRIPTION[dom].dx.split('—')[1].trim()}. ${clusterAdvice(dom)}`);
  // balance review vs application
  if(sr.length>=3&&tn===0)out.push('You\'re building review habits but haven\'t saved a single transfer scenario. Retention without application is fragile — spend more time using concepts in real-world situations.');
  else if(tn>=3&&sr.length===0)out.push('You\'re strong on application but nothing is in spaced review. You risk forgetting solid ideas — schedule a few problems so they survive the month.');
  else if(sr.length||tn)out.push(`Your mix looks reasonable: ${sr.length} item${sr.length===1?'':'s'} in spaced review and ${tn} transfer note${tn===1?'':'s'}. Keep both moving.`);
  // forecast
  const f=forgettingForecast();
  if(f.length)out.push(`Heads-up: ${f.length} item${f.length>1?'s are':' is'} about to fall due (${f.slice(0,3).map(x=>x.concept).join('; ')}${f.length>3?'…':''}). Catching them just before you\'d forget is exactly when review pays off most.`);
  if(due>0)out.push(`You have ${due} review${due>1?'s':''} due right now. Clear those before learning anything new.`);
  return out;
}
SEC.plan=()=>{
  const blocks=todayPlan();const total=blocks.reduce((a,b)=>a+b.m,0);const dom=dominantType();
  const rx=dom?PRESCRIPTION[dom]:null;const report=buildReport();const f=forgettingForecast();const p=getProfile();
  return `
  <div class="eyebrow">Start here · your tutor</div>
  <h2 class="h-sec">Today's plan</h2>
  <p class="lead">${p.goal?`Goal: <strong>${esc(p.goal)}</strong>${p.level?` · ${esc(p.level)}`:''}. `:''}A real tutor never makes you decide what to study. This page reads your data and lays out today's session — in order, time-boxed, each block one tap from the right tool.</p>

  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
      <div class="eyebrow">Today's session</div><span class="mono" style="font-size:.78rem;color:var(--ink-faint)">≈ ${total} min</span></div>
    ${blocks.map((b,i)=>`<div class="planrow" onclick="go('${b.to}')">
      <span class="plan-n">${i+1}</span>
      <div style="flex:1"><div style="font-weight:600">${b.t} <span class="mono" style="font-size:.72rem;color:var(--ink-faint)">· ${b.m} min</span></div>
        <div class="muted" style="font-size:.85rem">${b.d}</div></div>
      <span class="arrow">›</span></div>`).join('')}
  </div>

  ${rx?`<h3 class="blk">Your learning prescription</h3>
  <div class="card" style="border-left:3px solid ${TYPE_META[dom].c}">
    <p style="margin:0 0 10px"><span class="tg" style="background:${TYPE_META[dom].c}">DIAGNOSIS</span> ${rx.dx}.</p>
    <div class="eyebrow" style="margin-bottom:4px">Prescription — do this</div>
    <ul class="clean" style="margin:0 0 10px">${rx.doIt.map(x=>`<li>${x}</li>`).join('')}</ul>
    <p style="margin:0;color:var(--t-concept);font-size:.9rem"><strong>Don't:</strong> ${rx.avoid.replace(/^Avoid /,'')}</p>
  </div>`:''}

  ${f.length?`<h3 class="blk">Forgetting forecast</h3>
  <p class="muted" style="margin-top:-4px">Likely to fade within four days unless reviewed — the highest-value moment to retrieve them.</p>
  <div class="card">${f.slice(0,6).map(x=>{const s=strengthFor(x.idx);return `<div class="srrow" style="padding:9px 12px">
    <span class="dot" style="background:var(--rest)"></span><span class="cn">${esc(x.concept)}</span>
    <span class="tg" style="background:${s.c}">${s.l}</span>
    <span class="meta">due ${fmtDate(x.due)}</span></div>`}).join('')}</div>`:''}

  <h3 class="blk">Your tutor's diagnosis</h3>
  <div class="card report">${report.map(p=>`<p>${p}</p>`).join('')}
    <p class="muted" style="font-size:.82rem;margin:10px 0 0">This updates every time you log, review, or practise. The more honest your inputs, the sharper the diagnosis.</p></div>`;
};
/* ====================== CONCEPT CONTRASTS ====================== */
const CONTRAST=[
 {a:'Mass',b:'Weight',topic:'Forces',
  rows:[['What it is','Amount of matter in an object','The force of gravity on that mass'],
        ['Unit','kilograms (kg)','newtons (N)'],
        ['Changes with location?','No — same on Earth, Moon, deep space','Yes — W = m·g, so it scales with gravity'],
        ['Measured by','a balance (compares masses)','a scale / force-meter (measures pull)']],
  confusion:'Everyday speech uses "weight" for what physics calls mass ("I weigh 70 kg" is really a mass).',
  tell:'Units give it away: kg → mass, N → weight. If the planet changes, weight changes and mass stays put.'},
 {a:'Speed',b:'Velocity',topic:'Motion',
  rows:[['Type','Scalar — size only','Vector — size AND direction'],
        ['Example','30 m/s','30 m/s due north'],
        ['Can it change at constant size?','No','Yes — turning a corner changes velocity though speed is constant'],
        ['Average over a round trip','Can be large','Can be zero (you end where you started)']],
  confusion:'They share a unit (m/s) and feel identical until direction matters.',
  tell:'If direction is part of the answer, it\'s velocity. A car at constant speed round a bend has changing velocity.'},
 {a:'Velocity',b:'Acceleration',topic:'Motion',
  rows:[['What it measures','How fast position changes','How fast velocity changes'],
        ['Unit','m/s','m/s²'],
        ['Zero when…','the object is stationary','the velocity is steady (any constant velocity)'],
        ['On a graph','gradient of a displacement–time graph','gradient of a velocity–time graph']],
  confusion:'"Accelerating" colloquially means "going fast", but a fast steady cruise has zero acceleration.',
  tell:'High velocity ≠ acceleration. Acceleration is any change in velocity — speeding up, slowing, or turning.'},
 {a:'Heat',b:'Temperature',topic:'Particle model',
  rows:[['What it is','Total thermal energy of all particles','Average kinetic energy per particle'],
        ['Unit','joules (J)','degrees / kelvin (°C, K)'],
        ['Depends on amount of stuff?','Yes — more particles, more total energy','No — it\'s a per-particle average'],
        ['Example','a warm bath holds huge heat','a sparkler has very high temperature']],
  confusion:'A hotter thing seems like it must contain "more heat", but a tiny very hot object can hold little energy.',
  tell:'Change the mass or material and you need heat (Q = mcΔT), not temperature. Temperature is per-particle; heat is the total.'},
 {a:'Current',b:'Voltage',topic:'Electricity',
  rows:[['What it is','Rate of flow of charge','Energy given per unit charge (the push)'],
        ['Unit','amperes (A)','volts (V)'],
        ['Measured…','in series (ammeter in the line)','across a component (voltmeter in parallel)'],
        ['Water analogy','the flow rate of water','the pressure / height driving it']],
  confusion:'Both are "electrical" and get lumped together, but one is flow and the other is the push causing it.',
  tell:'Current flows through; voltage is across. I = V/R links them: push divided by opposition gives flow.'},
 {a:'Energy',b:'Power',topic:'Energy',
  rows:[['What it is','Capacity to do work','Rate of transferring energy'],
        ['Unit','joules (J)','watts (W) = joules per second'],
        ['Question it answers','how much work in total?','how fast is it being done?'],
        ['Example','lifting a box stores GPE','two cranes lift the same box — the faster one is more powerful']],
  confusion:'A "powerful" battery often just means high energy; physics keeps the two strictly separate.',
  tell:'Power = energy ÷ time. Same energy in less time means more power. Watts are joules per second.'},
];
let contIdx=0;
function renderContrast(){const host=document.getElementById('contBox');if(!host)return;const c=CONTRAST[contIdx];
  host.innerHTML=`
    <div class="segwrap" style="margin-bottom:16px">${CONTRAST.map((x,i)=>`<button class="seg ${i===contIdx?'on':''}" onclick="contIdx=${i};renderContrast()">${x.a} vs ${x.b}</button>`).join('')}</div>
    <span class="tag" style="background:var(--ink-soft)">${c.topic}</span>
    <div class="vs">
      <div class="vs-col"><div class="vs-h">${c.a}</div></div>
      <div class="vs-mid">vs</div>
      <div class="vs-col"><div class="vs-h">${c.b}</div></div>
    </div>
    <div class="vs-table">${c.rows.map(r=>`<div class="vs-row">
      <div class="vs-aspect">${r[0]}</div><div class="vs-a">${r[1]}</div><div class="vs-b">${r[2]}</div></div>`).join('')}</div>
    <div class="warn" style="margin:14px 0 0"><span class="eyebrow" style="color:var(--t-concept)">Why they get confused</span>${c.confusion}</div>
    <div class="note" style="margin:10px 0 0"><span class="eyebrow">The tell</span>${c.tell}</div>`;
}
SEC.contrast=()=>`
  <div class="eyebrow">Reference · contrasts</div>
  <h2 class="h-sec">Concept contrasts</h2>
  <p class="lead">Half of physics mistakes are really two ideas getting blurred together. You understand a concept best by seeing exactly how it differs from the one next to it. Read each pair as a unit.</p>
  <div class="card" id="contBox"></div>`;

/* ====================== MENTAL MODEL PAGES ====================== */
const MODELS=[
 {c:'Newton\'s first law (inertia)',topic:'Forces',
  model:'Things naturally keep doing what they\'re doing. With zero resultant force, a still object stays still and a moving object keeps moving in a straight line at constant speed — forever.',
  wrong:['Moving objects need a constant force to keep going.','When the push "runs out", things stop on their own.'],
  predict:['Slide a puck on frictionless ice — it never slows.','In deep space a probe coasts for centuries with engines off.','A tablecloth yanked fast leaves the plates put — their inertia resists the sudden pull.'],
  bound:['Inside an accelerating frame (a braking car) you feel "phantom" forces — the law needs an inertial frame.','At everyday scales it\'s exact; near light-speed you need relativity.'],
  ex:['A passenger lurches forward when a bus brakes.','Seatbelts exist precisely because your body keeps moving when the car stops.']},
 {c:'Current in a circuit',topic:'Electricity',
  model:'Charge circulates a complete loop like a conveyor belt; the cell does work on it, components take energy out. The same current passes every point in a series loop — charge is conserved.',
  wrong:['Current gets "used up" as it passes through a bulb.','There\'s less current after a component than before it.'],
  predict:['An ammeter reads the same before and after a series bulb.','Add a second series bulb: total resistance rises, so current falls everywhere equally and both dim.','Break the loop anywhere and all current stops instantly.'],
  bound:['It\'s energy, not charge, that\'s consumed.','The simple "same current" picture is for a single series loop; parallel branches split the current.'],
  ex:['Fairy lights in series all dim together.','A short circuit draws huge current because resistance collapses.']},
 {c:'Conservation of energy',topic:'Energy',
  model:'Energy is never created or destroyed, only moved between stores (kinetic, gravitational, elastic, thermal, chemical…). "Lost" energy has actually spread out as thermal energy, usually via friction or drag.',
  wrong:['Energy gets "used up" and disappears.','A machine can be 100% efficient, or create energy.'],
  predict:['A bouncing ball returns lower each time — the missing energy became heat and sound.','A pendulum trades height for speed and back, total energy flat (until friction).','Regenerative brakes recover kinetic energy instead of dumping it as heat.'],
  bound:['Energy is conserved overall, but useful energy always degrades (second law).','Mass itself is an energy store at extreme scales (E = mc²).'],
  ex:['A phone charger warms up — wasted electrical energy as heat.','Friction brakes turn motion into hot discs.']},
 {c:'Gravity & free fall',topic:'Forces',
  model:'Gravity gives every object the same acceleration g regardless of mass, because more mass means more force AND more inertia, which cancel (a = F/m). Apparent "weightlessness" is just falling freely.',
  wrong:['Heavier objects fall faster.','There\'s no gravity in space / orbit.'],
  predict:['In a vacuum a feather and a hammer land together.','Astronauts float because they and the station fall together (orbit), not because gravity is absent.','Double an object\'s mass and its fall time is unchanged.'],
  bound:['On Earth, air resistance breaks the "same rate" rule — that\'s why feathers lose.','g varies slightly with altitude and location.'],
  ex:['The Apollo 15 hammer-and-feather drop.','A dropped lift would make you briefly weightless inside it.']},
 {c:'Pressure',topic:'Pressure',
  model:'Pressure is force spread over an area: P = F/A. The same force concentrated on a tiny area gives huge pressure; spread over a large area, very little. Gas pressure is countless particle impacts per second.',
  wrong:['A vacuum "sucks" things in.','Pressure is the same as force.'],
  predict:['A stiletto heel dents a floor a flat shoe won\'t — same weight, far smaller area.','A drinking straw works because atmospheric pressure pushes the drink up, not suction.','Heating a sealed gas raises its pressure as particles hit the walls harder.'],
  bound:['"Suction" is always higher pressure pushing from the other side.','In liquids, pressure also grows with depth (ρgh).'],
  ex:['Snowshoes spread weight to stop you sinking.','A pressure cooker raises boiling point by raising pressure.']},
 {c:'Waves',topic:'Waves',
  model:'A wave transfers energy without transferring matter — the medium oscillates in place while the pattern travels. Transverse waves oscillate across the direction of travel (light, water); longitudinal along it (sound).',
  wrong:['Waves carry the medium along with them.','Sound and light are basically the same kind of wave.'],
  predict:['A cork on water bobs up and down as waves pass — it doesn\'t travel with them.','Sound needs a medium, so space is silent; light crosses a vacuum, so space isn\'t dark.','Refraction: a wave bends when it changes speed entering a new medium.'],
  bound:['Sound can\'t travel through a vacuum; light can.','At very high intensity or small scale, simple wave rules need extending (quantum effects).'],
  ex:['A stadium Mexican wave — people stay put, the pattern moves.','A straw looks bent where light refracts at the water surface.']},
];
function renderModels(){const host=document.getElementById('modelBox');if(!host)return;
  host.innerHTML=MODELS.map((m,i)=>`<div class="acc">
    <button onclick="toggleAcc(this)"><span>${m.c}</span>
      <span style="display:flex;gap:8px;align-items:center"><span class="tag" style="background:var(--ink-soft)">${m.topic}</span><span class="arrow">›</span></span></button>
    <div class="body"><div style="padding:12px 0 14px">
      <p style="margin:0 0 12px"><span class="tg" style="background:var(--t-slip)">THE MODEL</span><br>${m.model}</p>
      <p style="margin:0 0 6px"><span class="tg" style="background:var(--t-concept)">COMMON WRONG MODELS</span></p>
      <ul class="clean" style="margin:0 0 12px">${m.wrong.map(w=>`<li>${w}</li>`).join('')}</ul>
      <p style="margin:0 0 6px"><span class="tg" style="background:var(--accent-deep)">WHAT THE MODEL PREDICTS</span></p>
      <ul class="clean" style="margin:0 0 12px">${m.predict.map(w=>`<li>${w}</li>`).join('')}</ul>
      <p style="margin:0 0 6px"><span class="tg" style="background:var(--t-trigger)">WHERE IT STOPS WORKING</span></p>
      <ul class="clean" style="margin:0 0 12px">${m.bound.map(w=>`<li>${w}</li>`).join('')}</ul>
      <div class="note" style="margin:0"><span class="eyebrow">Seen in the wild</span>${m.ex.join(' · ')}</div>
    </div></div></div>`).join('');
}
SEC.models=()=>`
  <div class="eyebrow">Reference · understanding</div>
  <h2 class="h-sec">Mental model pages</h2>
  <p class="lead">A formula is the surface; the mental model is what's actually happening underneath. Each page gives the correct model, the wrong ones it replaces, the predictions it makes, and — most importantly — the boundary where it stops working. Knowing that edge is real understanding.</p>
  <div id="modelBox"></div>`;
/* ====================== ONBOARDING + SETUP WIZARD ====================== */
HELP.welcome={what:'Set up the app and replay the guided tour any time.',
  how:['Set your level and goal — it tailors the language and plan.','Replay the walkthrough if you want a refresher.','Then head to Today\'s plan and just follow it.']};
const ONB=[
 {h:'Welcome — this is a method, not a textbook',
  b:'Most apps go <em>content → quiz → score</em>. This one works like a tutor: <strong>diagnose → repair → test → apply → retain</strong>. You bring the physics; it makes sure the learning actually sticks.'},
 {h:'Quick setup (optional)',
  b:'Tell it where you\'re aiming so it can tailor the plan. You can skip and change this any time on the Welcome page.',setup:true},
 {h:'You\'ll never have to guess what to do',
  b:'Every page has a <span class="help-i" style="position:relative;top:1px">?</span> <strong>How to use this page</strong> banner. And your <strong>Dashboard</strong> and <strong>Today\'s plan</strong> always tell you the single highest-value next step — no decision fatigue.'},
 {h:'The loop in one line',
  b:'After a paper: sort misses by <em>type</em> (Diagnose) → rebuild broken models (Repair) → produce it from memory (Test) → use it in the real world (Apply) → schedule the comeback (Retain). Start on the Dashboard whenever you\'re unsure.'},
];
let onbStep=0;
function showOnboard(){onbStep=0;let o=document.getElementById('onboard');if(!o){o=document.createElement('div');o.id='onboard';document.body.appendChild(o);}o.style.display='flex';renderOnboard();}
function hideOnboard(){const o=document.getElementById('onboard');if(o)o.style.display='none';store.set('onboarded',true);}
function renderOnboard(){const o=document.getElementById('onboard');if(!o)return;const s=ONB[onbStep];const p=getProfile();
  const setup=s.setup?`<div class="setup">
    <div class="eyebrow" style="margin-bottom:6px">Your level</div>
    <div class="opts" style="flex-direction:row;flex-wrap:wrap">${['GCSE','A-level','University'].map(l=>`<button class="opt ${p.level===l?'sel':''}" style="flex:1;justify-content:center" onclick="onbSet('level','${l}')">${l}</button>`).join('')}</div>
    <div class="eyebrow" style="margin:14px 0 6px">Your goal</div>
    <div class="opts" style="flex-direction:row;flex-wrap:wrap">${['Pass','Grade 7','Grade 9 / A*','Deep understanding'].map(g=>`<button class="opt ${p.goal===g?'sel':''}" style="flex:1;justify-content:center;min-width:120px" onclick="onbSet('goal','${g}')">${g}</button>`).join('')}</div>
  </div>`:'';
  o.innerHTML=`<div class="onb-card">
    <div class="onb-dots">${ONB.map((_,i)=>`<span class="${i===onbStep?'on':''}"></span>`).join('')}</div>
    <h3 style="margin:6px 0 10px;font-size:1.35rem">${s.h}</h3>
    <p style="color:var(--ink-soft);line-height:1.6;margin:0 0 14px">${s.b}</p>
    ${setup}
    <div class="onb-nav">
      <button class="btn ghost sm" onclick="hideOnboard()">Skip</button>
      <div style="display:flex;gap:8px">
        ${onbStep>0?`<button class="btn sm" onclick="onbStep--;renderOnboard()">Back</button>`:''}
        ${onbStep<ONB.length-1?`<button class="btn amber sm" onclick="onbStep++;renderOnboard()">Next</button>`:`<button class="btn amber sm" onclick="hideOnboard();go('tutorial')">Start learning</button>`}
      </div>
    </div></div>`;
}
function onbSet(k,v){setProfile(k,v);renderOnboard();}
SEC.welcome=()=>{const p=getProfile();return `
  <div class="eyebrow">Start here</div>
  <h2 class="h-sec">Welcome &amp; setup</h2>
  <p class="lead">A working method that behaves like a tutor: it diagnoses what's actually wrong, rebuilds the model, and schedules the comeback. Set your target below — it tailors your plan — then let <a onclick="go('plan')">Today's plan</a> drive.</p>
  <div class="card">
    <div class="eyebrow" style="margin-bottom:6px">Your level</div>
    <div class="opts" style="flex-direction:row;flex-wrap:wrap">${['GCSE','A-level','University'].map(l=>`<button class="opt ${p.level===l?'sel':''}" style="flex:1;justify-content:center" onclick="setProfile('level','${l}');go('welcome',true)">${l}</button>`).join('')}</div>
    <div class="eyebrow" style="margin:16px 0 6px">Your goal</div>
    <div class="opts" style="flex-direction:row;flex-wrap:wrap">${['Pass','Grade 7','Grade 9 / A*','Deep understanding'].map(g=>`<button class="opt ${p.goal===g?'sel':''}" style="flex:1;justify-content:center;min-width:120px" onclick="setProfile('goal','${g}');go('welcome',true)">${g}</button>`).join('')}</div>
    ${p.level||p.goal?`<p class="mono" style="font-size:.82rem;color:var(--rest);margin:14px 0 0">✓ Saved${p.level?' · '+esc(p.level):''}${p.goal?' · '+esc(p.goal):''}. Your plan and diagnosis now reflect this.</p>`:''}
  </div>
  <div class="card" style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
    <div><strong>Guided walkthrough</strong><div class="muted" style="font-size:.88rem">A 4-step tour of how the method works.</div></div>
    <button class="btn amber" onclick="showOnboard()">Replay the tour</button>
  </div>
  <div class="note" style="margin-top:16px"><span class="eyebrow">The one habit that matters</span>When in doubt, open <a onclick="go('plan')">Today's plan</a> and do the top block. Everything else is optional depth.</p>`;
};

/* ---- override: scheduler rows show memory-strength label ---- */
function renderSRList(host,miniOnlyDue){
  if(!host)return;const list=getSR();const today=todayISO();
  const due=list.filter(x=>x.due<=today).sort((a,b)=>a.due.localeCompare(b.due));
  const later=list.filter(x=>x.due>today).sort((a,b)=>a.due.localeCompare(b.due));
  if(!list.length){host.innerHTML='<p class="empty">Nothing scheduled. Add a concept or whole problem you want to still know in a month.</p>';return}
  const grades=`<span class="grades">
     <button class="gbtn again" onclick="reviewSR('$ID','again')" title="Couldn't do it">Again</button>
     <button class="gbtn hard" onclick="reviewSR('$ID','hard')" title="Got there, hard">Hard</button>
     <button class="gbtn good" onclick="reviewSR('$ID','good')" title="Solid, cold">Good</button>
     <button class="gbtn easy" onclick="reviewSR('$ID','easy')" title="Trivial now">Easy</button></span>`;
  const row=(x,isDue)=>{const over=daysBetween(x.due,today);const s=strengthFor(x.idx);
    const status=isDue?(over>0?`${over}d overdue`:'due today'):`in ${daysBetween(today,x.due)}d`;
    return `<div class="srrow">
      <span class="dot" style="background:${isDue?'var(--due)':'var(--rest)'}"></span>
      <span class="cn">${esc(x.concept)}</span>
      <span class="tg" style="background:${s.c}">${s.l}</span>
      <span class="meta">${status}</span>
      ${isDue?grades.replace(/\$ID/g,x.id):`<button class="btn sm ghost" onclick="delSR('${x.id}')">✕</button>`}
    </div>`};
  let html='';
  if(due.length)html+=`<div class="eyebrow" style="margin:6px 0 8px">Due now · ${due.length} — attempt cold, then grade honestly</div>`+due.map(x=>row(x,true)).join('');
  else if(!miniOnlyDue)html+='<p class="empty">Nothing due today. The amber line is holding. ✓</p>';
  if(!miniOnlyDue&&later.length)html+=`<div class="eyebrow" style="margin:18px 0 8px">Upcoming</div>`+later.map(x=>row(x,false)).join('');
  if(miniOnlyDue&&!due.length)html='<p class="empty">Nothing due today. Add something below or open the full scheduler.</p>';
  host.innerHTML=html;}

/* ---- override: report adds root-cause analysis ---- */
function buildReport(){
  const log=getLog();const streak=currentStreak();const dom=dominantType();
  const sr=getSR();const tn=getTransfer().length;const due=dueCount();
  const out=[];
  out.push(streak>=3?`You're on a ${streak}-day streak — consistency is the single biggest predictor of retention, and you've got it.`:
    streak>0?`You've been active ${streak} day${streak>1?'s':''} running. Aim for a steady daily rhythm — little and often beats cramming.`:
    `No active streak right now. The most valuable thing you can do is show up briefly every day, even for ten minutes.`);
  if(!log.length){out.push('There isn\'t enough logged data yet to diagnose your weaknesses. Do one paper section, sort the misses by failure type in the error log, and this report will sharpen immediately.');return out;}
  const tc=typeCounts();const total=Object.values(tc).reduce((a,b)=>a+b,0);
  out.push(`You've logged ${total} gap${total>1?'s':''}. Your dominant failure type is ${TYPE_META[dom].label.toLowerCase()} — ${clusterAdvice(dom)}`);
  // root cause from weakest topic
  const wt=weakTopics();
  if(wt.length){const rc=rootCauseFor(wt[0].topic);
    if(rc)out.push(`A root-cause note: your most-logged topic is "${wt[0].topic}", which sits on top of ${rc.join(' and ')}. Weakness there often traces back to those foundations — shore them up first, or the topic above keeps collapsing.`);}
  if(sr.length>=3&&tn===0)out.push('You\'re building review habits but haven\'t saved a single transfer scenario. Retention without application is fragile — spend more time using concepts in real-world situations.');
  else if(tn>=3&&sr.length===0)out.push('You\'re strong on application but nothing is in spaced review. You risk forgetting solid ideas — schedule a few problems so they survive the month.');
  else if(sr.length||tn)out.push(`Your mix looks reasonable: ${sr.length} item${sr.length===1?'':'s'} in spaced review and ${tn} transfer note${tn===1?'':'s'}. Keep both moving.`);
  const f=forgettingForecast();
  if(f.length)out.push(`Heads-up: ${f.length} item${f.length>1?'s are':' is'} about to fall due (${f.slice(0,3).map(x=>x.concept).join('; ')}${f.length>3?'…':''}). Catching them just before you'd forget is exactly when review pays off most.`);
  if(due>0)out.push(`You have ${due} review${due>1?'s':''} due right now. Clear those before learning anything new.`);
  return out;
}

/* ---- override: lens gains a random-object generator ---- */
let lensPick=null;
function lensObject(){lensPick=LENS[Math.floor(Math.random()*LENS.length)];const el=document.getElementById('lensNudge');if(el)el.innerHTML='Explain the physics of <strong>'+lensPick+'</strong> — or anything else you noticed today.';}
SEC.lens=()=>{const list=getLens();const doneToday=list.some(x=>x.date===todayISO());const nudge=lensPick||lensToday();
  return `
  <div class="eyebrow">Working tool · daily</div>
  <h2 class="h-sec">Daily physics lens</h2>
  <p class="lead">Transfer is a habit, not an event. Once a day, explain one ordinary thing you saw using physics. Tiny, but it trains your brain to see mechanisms everywhere — which is the real goal.</p>
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center"><div class="eyebrow">Today's nudge</div>
      <button class="btn ghost sm" onclick="lensObject()">🎲 Random object</button></div>
    <div class="scenario" id="lensNudge" style="margin:8px 0 12px">Explain the physics of <strong>${nudge}</strong> — or anything else you noticed today.</div>
    ${doneToday?'<p class="mono" style="color:var(--rest);font-size:.84rem;margin:0 0 10px">✓ Logged today. Add another if you like.</p>':''}
    <textarea id="lensText" placeholder="What did you notice, and which physics explains it? A sentence or two is plenty."></textarea>
    <button class="btn amber sm" onclick="saveLens()">Save to journal</button>
  </div>
  <h3 class="blk">Your physics-in-the-wild journal</h3>
  <div id="lensList">${list.length?list.map(x=>`<div class="card" style="margin:10px 0">
    <span class="meta mono" style="font-size:.7rem;color:var(--ink-faint)">${fmtDate(x.date)} · ${esc(x.prompt)}</span>
    <p style="margin:8px 0 0;font-size:.93rem">${esc(x.text)}</p>
    <button class="btn sm ghost" style="margin-top:8px" onclick="delLens('${x.id}')">Remove</button></div>`).join(''):'<p class="empty">Empty. Your first entry starts the journal — and the streak on your dashboard.</p>'}</div>`;
};

/* ====================================================================
   VERSION 4 — TUTORIAL SECTION + COMPREHENSIVE GCSE CONTENT EXPANSION
   Pushes large banks onto MIS / ANA / TRIG / QUIZ / EQS / CF / CONTRAST / MODELS
   Covers all GCSE physics: Energy, Electricity, Particle model, Atomic &
   radioactivity, Forces & motion, Waves & light, Magnetism, Space.
   ==================================================================== */

HELP.tutorial={what:'The starting point — what every section is for, when to use it, and how often.',
  how:['Read this once before you begin.','Use the cadence table to build a weekly rhythm.','Come back any time you are unsure where a section fits.']};

SEC.tutorial=()=>`
  <div class="eyebrow">Tutorial · read me first</div>
  <h2 class="h-sec">How to use this app</h2>
  <p class="lead">This is a method that behaves like a tutor, not a textbook to read cover to cover. Below is exactly what each section is for, <strong>when</strong> to reach for it, and <strong>how often</strong>. If you only remember one thing: open <a onclick="go('plan')">Today's plan</a> at the start of every session and do the top block.</p>

  <h3 class="blk">The rhythm at a glance</h3>
  <div class="vs-table" style="margin-top:8px">
    <div class="vs-row" style="grid-template-columns:1.1fr 2fr"><div class="vs-aspect">Every day · 10–25 min</div><div class="vs-a" style="grid-column:span 2">Open <strong>Today's plan</strong> → clear any due <strong>reviews</strong> → do the one practice module it points to → one <strong>Daily lens</strong> entry.</div></div>
    <div class="vs-row" style="grid-template-columns:1.1fr 2fr"><div class="vs-aspect">After every past paper</div><div class="vs-a" style="grid-column:span 2">Run the five phases: <strong>Diagnose</strong> (log every miss by type) → <strong>Repair</strong> → <strong>Test</strong> → <strong>Apply</strong> → <strong>Retain</strong> (schedule it).</div></div>
    <div class="vs-row" style="grid-template-columns:1.1fr 2fr"><div class="vs-aspect">2–3 × per week</div><div class="vs-a" style="grid-column:span 2">A focused <strong>practice</strong> block: trigger trainer, misconception check, equation explorer, or counterfactuals — whichever your weakness points to.</div></div>
    <div class="vs-row" style="grid-template-columns:1.1fr 2fr"><div class="vs-aspect">Once a week</div><div class="vs-a" style="grid-column:span 2">Read your <strong>tutor's diagnosis</strong> on the plan page, scan the <strong>Dashboard</strong> weakness engine, and review the <strong>Concept map</strong> for what to shore up next.</div></div>
    <div class="vs-row" style="grid-template-columns:1.1fr 2fr"><div class="vs-aspect">As needed (reference)</div><div class="vs-a" style="grid-column:span 2">Open misconceptions, contrasts, mental models, analogies, or the sandbox the moment a specific gap or confusion appears.</div></div>
  </div>

  <h3 class="blk">Every section, and when to use it</h3>

  <div class="eyebrow" style="margin:14px 0 6px">Start here</div>
  ${tutRow('Dashboard','Daily, at a glance','Your state in one screen: streak, what is due, your dominant weakness, and the single best next action. Glance at it whenever you open the app.')}
  ${tutRow("Today's plan",'Start of every session','The tutor\'s ordered, time-boxed plan for today plus a written diagnosis. This is the page that removes all guesswork — make it your habit.')}
  ${tutRow('Welcome & setup','Once, then rarely','Set your level and goal so the plan is tailored. Replay the tour here whenever you want a refresher.')}

  <div class="eyebrow" style="margin:18px 0 6px">The method &amp; five phases</div>
  ${tutRow('Why this works / The weekly loop','Read once, revisit when drifting','The reasoning behind the method. Re-read the loop whenever you feel tempted to just grind past papers.')}
  ${tutRow('Diagnose','After every paper','Sort each miss by failure type. The single most valuable habit — it tells you what kind of work you actually need.')}
  ${tutRow('Repair','Right after diagnosing','Rebuild the broken mechanism for each conceptual error before doing any more questions.')}
  ${tutRow('Test','After repairing','Produce the idea from a blank page and explain it aloud. Where you go vague is your real gap.')}
  ${tutRow('Apply','Every study session','Mixed, interleaved problems plus real-world scenarios. This is where understanding actually forms.')}
  ${tutRow('Retain','End of every session','Send facts to flashcards and whole problems to the scheduler so they survive the month.')}

  <div class="eyebrow" style="margin:18px 0 6px">Active practice</div>
  ${tutRow('Trigger trainer','2–3 ×/week, daily if it is your weakness','Trains recognising which model a situation needs — no maths. Best antidote to trigger gaps.')}
  ${tutRow('Misconception check','When conceptual errors dominate','Hunts broken models with tempting wrong answers, then rebuilds them with a Socratic walk.')}
  ${tutRow('Equation explorer','When learning or revising any equation','Predict, then move the sliders. Turns formulas into felt relationships.')}
  ${tutRow('Counterfactuals','A few each week','Breaks a scenario ("what if gravity doubled?") to test whether you truly understand the mechanism.')}
  ${tutRow('Physics sandbox','As needed, to build intuition','A live playground — change gravity, drag, bounciness and watch. Predict before you press go.')}

  <div class="eyebrow" style="margin:18px 0 6px">Working tools</div>
  ${tutRow('Error log','After every paper','Every gap, sorted by type. Watch the clusters — they drive the whole app.')}
  ${tutRow('Review scheduler','Daily (clear what is due)','Spaced repetition for whole problems. Attempt cold, then grade honestly.')}
  ${tutRow('Transfer notebook','1–2 entries/week','Explain real-world scenarios with physics — builds proof you can apply each concept.')}
  ${tutRow('Daily lens','Once a day','Explain one real thing you saw. Tiny, but it compounds into real transfer.')}

  <div class="eyebrow" style="margin:18px 0 6px">Reference — open when a specific gap appears</div>
  ${tutRow('Misconception fixes','When Diagnose flags a conceptual error','The broken model, the truth, and the analogy that dislodges it.')}
  ${tutRow('Concept contrasts','When two ideas blur together','Side-by-side pages for the pairs students mix up — mass vs weight, heat vs temperature, and more.')}
  ${tutRow('Mental models','When learning a concept deeply','The correct model, the wrong ones, its predictions, and where it stops working.')}
  ${tutRow('Analogy bank','In Repair, and when inventing scenarios','Load-bearing analogies you can run forward to predict behaviour.')}
  ${tutRow('Concept map','Weekly, for A-level prep','The dependency tree — fix foundations before the topics that sit on them.')}

  <div class="eyebrow" style="margin:18px 0 6px">Next</div>
  ${tutRow('A-level bridge','When your GCSE models are clean','How the method shifts when you move up — switch only when models, not just marks, are solid.')}
  ${tutRow('Resources','When you need external material','A short backbone: Isaac Physics, PMT, Anki.')}

  <div class="note" style="margin-top:20px"><span class="eyebrow">Your first week</span>Day 1: read this page, then do <a onclick="go('diagnose')">Diagnose</a> on one paper section. Days 2–6: open <a onclick="go('plan')">Today's plan</a> and follow it — clear reviews, do the practice it suggests, one lens entry. Day 7: read your tutor's diagnosis and adjust. After that, the rhythm runs itself.</p>
`;
function tutRow(name,when,why){return `<div class="tutrow">
  <div class="tutrow-head"><strong>${name}</strong><span class="tutwhen">${when}</span></div>
  <div class="muted" style="font-size:.9rem">${why}</div></div>`}
/* ====================== MISCONCEPTIONS (push ~24 new, all topics) ====================== */
MIS.push(
 // --- Electricity ---
 {t:'A bulb lights with a battery and one wire',topic:'Electricity',
  wrong:'A single wire from one battery terminal to a bulb is enough to light it.',
  right:'You need a COMPLETE circuit — a continuous loop back to the other terminal. Charge must have a path all the way round, or no current flows at all.',
  ana:'Like a conveyor belt or a circular train track: unless the loop is closed, nothing can keep moving round it.',
  tell:'If the circuit is not a closed loop, current is zero. Always trace the path from one terminal back to the other.'},
 {t:'Voltage flows through a component',topic:'Electricity',
  wrong:'Voltage flows through the wires and components like current does.',
  right:'Current flows THROUGH a component; voltage (potential difference) is measured ACROSS it — it is the energy difference between two points. They are different kinds of quantity.',
  ana:'Current is the flow of water in a pipe; voltage is the pressure difference between two ends. You measure flow along the pipe, pressure across it.',
  tell:'Ammeter in series (in the line), voltmeter in parallel (across). "Through" = current, "across" = voltage.'},
 {t:'Thicker wires have more resistance',topic:'Electricity',
  wrong:'A thicker wire resists current more because there is more metal in the way.',
  right:'A thicker wire has LESS resistance — more cross-sectional area gives charge more room to flow. Resistance rises with length and falls with thickness.',
  ana:'A wide motorway carries traffic more easily than a narrow lane; widening the road reduces the jam, it does not add to it.',
  tell:'Longer or thinner ⇒ more resistance. Shorter or thicker ⇒ less. Heat also raises resistance in metals.'},
 {t:'A battery stores charge / electricity',topic:'Electricity',
  wrong:'A battery is a tank of charge or electricity that empties as you use it.',
  right:'A battery stores CHEMICAL energy and uses it to do work on charge, pushing it round the circuit. The charge is already in the wires; the battery is the pump, not the reservoir of charge.',
  ana:'A central-heating pump does not store the water — it pushes water that is already in the pipes. The battery pushes charge that is already in the circuit.',
  tell:'Batteries store energy (chemical), not charge. "Flat" means the chemical energy is spent, not that the charge ran out.'},
 // --- Particle model / thermal ---
 {t:'Particles themselves expand when heated',topic:'Particle model',
  wrong:'When a material is heated its particles grow bigger, so the material expands.',
  right:'Individual particles do not change size. Heating makes them move/vibrate faster and take up more space on average, so the material expands — the spacing increases, not the particles.',
  ana:'Dancers on a floor moving more wildly need more room and spread out — the dancers themselves are the same size.',
  tell:'Thermal expansion = more particle motion and bigger gaps, never bigger particles.'},
 {t:'Cold flows into warm things',topic:'Particle model',
  wrong:'Cold moves into an object to cool it down.',
  right:'There is no such thing as "cold" flowing. Only thermal energy moves, and it always flows from hotter to colder. Something feels cold because energy leaves YOU into it.',
  ana:'Darkness is not a thing that flows in — it is the absence of light. "Cold" is just less thermal energy.',
  tell:'Reframe every "cold gets in" as "heat flows out". Energy only ever moves hot → cold.'},
 {t:'Boiling and evaporation are the same',topic:'Particle model',
  wrong:'Evaporation and boiling are just two words for the same process.',
  right:'Evaporation happens only at the surface, at any temperature, as the fastest particles escape. Boiling happens throughout the liquid, only at the boiling point, with bubbles of vapour forming inside.',
  ana:'A puddle drying in the sun (evaporation, surface only) versus a rolling pan of water (boiling, bubbles throughout).',
  tell:'Surface + any temperature = evaporation. Throughout + fixed boiling point + bubbles = boiling.'},
 {t:'Gases have no mass / weigh nothing',topic:'Particle model',
  wrong:'Air and other gases are weightless because you cannot feel them.',
  right:'Gases are made of particles with mass, so they have mass and weight. A litre of air weighs roughly a gram; the atmosphere presses on you with real force.',
  ana:'A football feels heavier when fully pumped — you have added the mass of the air inside.',
  tell:'Gas particles have mass, so gases do too. You do not feel it because pressure pushes equally on all sides.'},
 // --- Atomic & radioactivity ---
 {t:'Irradiated objects become radioactive',topic:'Radioactivity',
  wrong:'Anything exposed to radiation becomes radioactive itself.',
  right:'Irradiation (being exposed to radiation) does not usually make something radioactive. Becoming radioactive requires CONTAMINATION — radioactive atoms physically landing on or in the object.',
  ana:'Standing in sunlight does not turn you into a light source. Getting glow-paint on your hands does. Irradiation is the sunlight; contamination is the paint.',
  tell:'Irradiation = exposed to rays (usually harmless afterwards). Contamination = radioactive material on/in you (keeps emitting).'},
 {t:'Half-life is half the time to fully decay',topic:'Radioactivity',
  wrong:'After one half-life the sample is gone; after two it has been gone twice over.',
  right:'A half-life is the time for HALF the remaining unstable nuclei to decay. After each half-life half of what is left decays, so it approaches zero but never fully "runs out" on a clean schedule.',
  ana:'Eat half a cake, then half of what remains, then half of that — you keep halving and never quite reach zero.',
  tell:'Each half-life halves what is LEFT: 100 → 50 → 25 → 12.5. It is repeated halving, not a countdown to empty.'},
 {t:'Alpha radiation is always the most dangerous',topic:'Radioactivity',
  wrong:'Alpha is the most dangerous because it is the most ionising.',
  right:'It depends on where the source is. Outside the body, alpha is stopped by skin and is least dangerous. Inside the body, its strong ionisation makes it the MOST dangerous. Context decides.',
  ana:'A blowtorch is harmless across the room but devastating against your skin. Alpha is the blowtorch — danger depends on distance.',
  tell:'Outside: gamma/beta worse (they penetrate). Inside: alpha worst (most ionising). Always ask "source inside or outside?".'},
 {t:'The Sun is burning like a fire',topic:'Space',
  wrong:'The Sun produces light and heat by burning fuel, like a giant fire (combustion).',
  right:'The Sun runs on nuclear FUSION — hydrogen nuclei fusing into helium, releasing huge energy. It is not combustion and needs no oxygen; a fire could not last billions of years.',
  ana:'A campfire chemically burns wood and needs air. The Sun fuses nuclei — a completely different, far more powerful process.',
  tell:'Stars shine by fusion, not burning. No oxygen in space, and combustion could never power it for billions of years.'},
 {t:'Seasons are caused by distance from the Sun',topic:'Space',
  wrong:'It is summer when Earth is closer to the Sun and winter when it is further away.',
  right:'Seasons come from Earth\'s axial TILT. The tilted hemisphere gets more direct sunlight and longer days (summer). Earth is actually slightly closer to the Sun during northern winter.',
  ana:'Tilting a torch onto a table: angle it steeply and the light concentrates and brightens a small patch — that is summer. Spread it out and it weakens — winter.',
  tell:'Opposite hemispheres have opposite seasons at the same time, which distance alone could never explain. Tilt is the cause.'},
 // --- Forces & motion ---
 {t:'Action and reaction forces cancel out',topic:'Forces',
  wrong:'Newton\'s third-law pairs cancel, so nothing should ever move.',
  right:'Equal and opposite pairs act on DIFFERENT objects, so they never cancel. Cancellation only happens between forces on the SAME object. You push the ground back, it pushes you forward.',
  ana:'You push a wall (force on wall) and it pushes you (force on you). Those act on different things, so they cannot cancel each other.',
  tell:'Third-law pairs act on two different objects — they never cancel. Balanced forces act on one object.'},
 {t:'Centrifugal force pushes you outward',topic:'Motion',
  wrong:'On a roundabout a real outward force throws you to the edge.',
  right:'There is no real outward force. Your body tries to go straight (inertia) while the seat/door pushes you INWARD (centripetal). The "outward" feeling is just your inertia resisting being turned.',
  ana:'On a sharp bend you slide toward the door because you wanted to keep going straight — the door then pushes you inward. Nothing pushes you out.',
  tell:'Circular motion needs an inward (centripetal) force. The outward feeling is inertia, not a real force.'},
 {t:'At terminal velocity there is no force',topic:'Forces',
  wrong:'A skydiver at terminal velocity has no forces acting because they stop accelerating.',
  right:'Forces are still there and large — weight down, drag up — but they are now BALANCED, so the resultant is zero and acceleration stops. Zero resultant force is not zero force.',
  ana:'A tug-of-war with both teams pulling hard but neither moving: huge forces, zero resultant.',
  tell:'Constant velocity means balanced forces, not absent forces. Terminal velocity = weight equals drag.'},
 {t:'Bigger area always means more friction',topic:'Forces',
  wrong:'A wider contact area always gives more friction.',
  right:'For solid surfaces, friction depends on the surfaces and how hard they are pressed together (the normal force), not on the contact area. Wider tyres help through grip and heat, not simple area in the basic model.',
  ana:'A heavy book slides with the same friction whether laid flat or on its spine — what matters is its weight pressing down and the surfaces, not the area.',
  tell:'In the GCSE model, friction depends on surfaces and normal force, not contact area.'},
 // --- Waves & light ---
 {t:'In refraction the frequency changes',topic:'Waves',
  wrong:'When light slows entering glass, its frequency drops.',
  right:'Frequency stays the SAME in refraction (it is set by the source). The speed and wavelength change together, which is what bends the ray. Frequency is conserved across the boundary.',
  ana:'People stepping from pavement onto mud: they take the same number of steps per second (frequency) but each step is shorter and slower (wavelength and speed change).',
  tell:'Refraction: speed and wavelength change, frequency does not. Colour (set by frequency) stays the same.'},
 {t:'Amplitude controls the pitch of a sound',topic:'Waves',
  wrong:'A bigger amplitude makes a higher-pitched note.',
  right:'Amplitude controls LOUDNESS (volume); FREQUENCY controls pitch. A loud low note has large amplitude and low frequency. They are independent.',
  ana:'Shouting a low note versus whispering a high one: loudness (amplitude) and pitch (frequency) clearly come apart.',
  tell:'Amplitude → loudness. Frequency → pitch. Do not let "bigger wave" mean "higher note".'},
 {t:'Electromagnetic waves need a medium',topic:'Waves',
  wrong:'Light and other EM waves need air or some material to travel through.',
  right:'EM waves (light, radio, X-rays…) travel through a vacuum — that is why sunlight reaches us across empty space. Only mechanical waves like sound need a medium.',
  ana:'Space is silent (no medium for sound) but not dark (light needs none). The Sun proves light crosses a vacuum.',
  tell:'Through a vacuum? EM waves yes, sound no. "Needs a medium" is the signature of a mechanical wave.'},
 {t:'Red light carries more energy than blue',topic:'Waves',
  wrong:'Red is a "hot", strong colour, so red light has more energy.',
  right:'Higher frequency means higher energy, and blue/violet light has a higher frequency than red. So BLUE light carries more energy per photon than red — the opposite of the "warm colour" intuition.',
  ana:'Going up the rainbow toward violet is going up in frequency and energy; ultraviolet beyond it is energetic enough to burn skin, while infrared below red is gentler.',
  tell:'Across the EM spectrum, energy rises with frequency: radio < infrared < red < blue < UV < X-ray < gamma.'},
 // --- Magnetism ---
 {t:'All metals are magnetic',topic:'Magnetism',
  wrong:'Magnets attract all metals.',
  right:'Only a few metals are magnetic — iron, steel, nickel and cobalt. Common metals like copper, aluminium and gold are not attracted to a magnet at all.',
  ana:'A magnet will grab a steel paperclip but ignore an aluminium can or a copper coin entirely.',
  tell:'Magnetic materials are iron, steel, nickel, cobalt. If a "metal" is not pulled, it is probably copper/aluminium.'},
 {t:'A compass needle points to true (geographic) north',topic:'Magnetism',
  wrong:'A compass points exactly at the geographic North Pole.',
  right:'A compass aligns with Earth\'s MAGNETIC field, pointing to the magnetic north pole, which is offset from the geographic pole. Also, the pole it points to is physically a magnetic SOUTH pole (opposite poles attract).',
  ana:'The needle follows the field lines, not the map\'s grid — like water following the slope of the land, not the drawn borders.',
  tell:'Compasses follow the magnetic field, not geography. The north-seeking tip is attracted to Earth\'s magnetic south.'},
 // --- Energy ---
 {t:'Renewable energy means clean and unlimited',topic:'Energy',
  wrong:'Renewable resources never run out and never cause any harm.',
  right:'Renewable means it is replenished on a human timescale (wind, solar, tidal), but they still have downsides — intermittency, land use, manufacturing impacts — and are not "free" or limitless in practice.',
  ana:'A well-managed orchard regrows fruit each year (renewable), but it still needs land, labour and good weather — it is not effort-free or infinite.',
  tell:'Renewable = replenished naturally, NOT automatically clean, free, or unlimited. Weigh reliability and impact too.'}
);
/* ====================== ANALOGIES (push ~24 new) ====================== */
ANA.push(
 {topic:'Electricity',k:'Complete circuit = a circular train track',v:'Charge can only flow if the loop is closed all the way round. Break the track anywhere and every train stops — which is why a single wire to a bulb does nothing.'},
 {topic:'Electricity',k:'Series vs parallel = one road vs many lanes',v:'In series all current takes one road, so adding a component slows everything. In parallel each branch is its own lane at full voltage, so each works independently and total current rises.'},
 {topic:'Electricity',k:'Wire thickness = width of a corridor',v:'A wide corridor lets people through easily (low resistance); a narrow one jams (high resistance). Longer corridor, more resistance; wider, less.'},
 {topic:'Electricity',k:'Static charge = socks on a carpet',v:'Rubbing transfers electrons, leaving one object negative and the other positive. The build-up jumps as a spark when it finally finds a path to earth.'},
 {topic:'Particle model',k:'States of matter = a dance floor',v:'Solid: dancers locked in a grid, vibrating in place. Liquid: still touching but shuffling past each other. Gas: flying apart across the whole room. Same dancers, different freedom.'},
 {topic:'Particle model',k:'Specific heat capacity = bucket size',v:'Water is a big bucket — it takes a lot of energy to fill (heat up) and holds it well. That is why the sea moderates climate and water is used as a coolant.'},
 {topic:'Particle model',k:'Latent heat = paying to change the queue, not move it',v:'During melting or boiling the temperature pauses: all the energy goes into breaking bonds (changing state), not raising temperature. It is a one-off toll to change phase.'},
 {topic:'Particle model',k:'Gas pressure = popcorn hitting the lid',v:'Countless particles drumming on the walls create pressure. Heat them and they hit harder and more often, so pressure rises — the basis of the pressure-temperature law.'},
 {topic:'Radioactivity',k:'Half-life = halving a cake',v:'Each half-life removes half of what remains: 100 → 50 → 25 → 12.5. You keep halving and approach zero without a clean "all gone" moment.'},
 {topic:'Radioactivity',k:'Irradiation vs contamination = sunlight vs paint',v:'Standing in radiation (irradiation) is like standing in sunlight — it stops when you leave. Getting radioactive dust on you (contamination) is like glow-paint that keeps emitting until removed.'},
 {topic:'Radioactivity',k:'Random decay = popcorn popping',v:'You cannot predict which kernel pops next (each nucleus is random), yet the overall rate is reliable — which is why half-life works in bulk despite individual unpredictability.'},
 {topic:'Forces',k:'Newton\'s third law = stepping off a boat',v:'Push the boat backward and it pushes you forward — equal and opposite, on different objects. Rockets push exhaust down and are pushed up the same way.'},
 {topic:'Forces',k:'Moments = a longer spanner',v:'Turning effect = force × distance from the pivot. A longer spanner multiplies your force, which is why it loosens a stubborn bolt a short one cannot.'},
 {topic:'Forces',k:'Pressure in fluids = deeper water squeezes harder',v:'Pressure grows with depth because more liquid weighs down from above. Dam walls are built thicker at the bottom for exactly this reason.'},
 {topic:'Forces',k:'Hooke\'s law = a well-behaved spring',v:'Within its limit, a spring stretches in proportion to the force: double the pull, double the extension. Past the limit of proportionality the rule breaks and it deforms.'},
 {topic:'Forces',k:'Stopping distance = thinking plus braking',v:'Total stopping distance is reaction-time travel (thinking) plus braking distance. Speed stretches both, and braking distance grows with the square of speed — small speed rises cost a lot of metres.'},
 {topic:'Motion',k:'Distance vs displacement = a walk to the shop and back',v:'Walk there and back: distance is the full path you covered, displacement is zero because you ended where you started. One is a total, the other a straight-line from start to finish.'},
 {topic:'Waves',k:'Refraction = a trolley rolling onto mud at an angle',v:'One wheel hits the mud and slows before the other, swinging the trolley round. Light slows entering glass at an angle and bends the same way — speed changes, frequency does not.'},
 {topic:'Waves',k:'EM spectrum = one family, different energies',v:'Radio, microwave, infrared, visible, UV, X-ray, gamma are all the same kind of wave at rising frequency and energy. Same nature, wildly different effects — from radio signals to cell-damaging gamma.'},
 {topic:'Waves',k:'Amplitude vs frequency = loudness vs pitch',v:'Amplitude is how big the wave is (loudness/brightness); frequency is how often it cycles (pitch/colour). You can change one without the other — a loud low note, a quiet high one.'},
 {topic:'Magnetism',k:'Magnetic field = iron-filing contours',v:'Field lines run north to south, closest together where the field is strongest (at the poles). A compass simply lines up along these invisible contours.'},
 {topic:'Magnetism',k:'Electromagnet = magnetism you can switch',v:'A current through a coil makes a magnetic field; cut the current and it vanishes. That on/off control is why scrapyard cranes and door locks use electromagnets, not bar magnets.'},
 {topic:'Magnetism',k:'Generator = motor run backwards',v:'A motor turns current into motion; spin it by hand instead and it produces current. Moving a wire through a field induces a voltage — the basis of power stations.'},
 {topic:'Space',k:'Orbit = falling and forever missing the ground',v:'A satellite is pulled down by gravity but moves sideways so fast it keeps missing Earth. It is in constant free fall, which is why everything inside floats.'}
);

/* ====================== CONCEPT CONTRASTS (push ~10 new) ====================== */
CONTRAST.push(
 {a:'Series',b:'Parallel',topic:'Electricity',
  rows:[['Current path','one single loop','splits across branches'],
        ['Current','same everywhere','divides between branches'],
        ['Voltage','shared across components','full supply across each branch'],
        ['If one breaks','whole circuit stops','other branches keep working'],
        ['Total resistance','adds up (rises)','less than the smallest branch']],
  confusion:'Both are "circuits with components", but current and voltage behave oppositely in each.',
  tell:'Series = one path, shared voltage, one break kills all. Parallel = many paths, full voltage each, independent.'},
 {a:'Conduction',b:'Convection',topic:'Particle model',
  rows:[['How energy moves','vibrations passed particle to particle','warm fluid rises, cool sinks (a current)'],
        ['Happens in','mainly solids (especially metals)','liquids and gases (fluids)'],
        ['Particles travel?','no — they stay put','yes — the fluid itself moves'],
        ['Example','a metal spoon heating up','a radiator warming a room']],
  confusion:'Both transfer thermal energy, but only convection actually moves the material.',
  tell:'Conduction = energy passed along, particles stay. Convection = the fluid itself circulates.'},
 {a:'Fission',b:'Fusion',topic:'Radioactivity',
  rows:[['Process','a large nucleus splits','small nuclei join together'],
        ['Fuel','uranium / plutonium','hydrogen isotopes'],
        ['Where','nuclear power stations now','the Sun and stars'],
        ['Conditions','triggered by a neutron','enormous temperature & pressure']],
  confusion:'Both are nuclear and release huge energy, but one splits and the other joins.',
  tell:'Fission = split a big nucleus (power stations). Fusion = join small ones (stars). Splitting vs joining.'},
 {a:'Alpha',b:'Beta',topic:'Radioactivity',
  rows:[['What it is','2 protons + 2 neutrons (helium nucleus)','a fast electron from the nucleus'],
        ['Charge','+2','−1'],
        ['Ionising power','very strong','moderate'],
        ['Penetration','stopped by paper/skin','stopped by a few mm of aluminium']],
  confusion:'Both are particle radiations, but differ in mass, charge and how far they get.',
  tell:'Alpha: big, +2, very ionising, barely penetrates. Beta: tiny electron, −1, moderate everything.'},
 {a:'Transverse',b:'Longitudinal',topic:'Waves',
  rows:[['Oscillation','across the direction of travel','along the direction of travel'],
        ['Looks like','peaks and troughs','compressions and rarefactions'],
        ['Examples','light, water, EM waves','sound, a pushed slinky'],
        ['Through a vacuum?','EM ones yes','no — needs a medium']],
  confusion:'Both transfer energy without moving matter, but the oscillation direction differs.',
  tell:'Transverse = oscillate across (rope shaken sideways). Longitudinal = oscillate along (slinky pushed end-on).'},
 {a:'Reflection',b:'Refraction',topic:'Waves',
  rows:[['What happens','wave bounces off a surface','wave bends entering a new medium'],
        ['Speed change?','no','yes — it speeds up or slows down'],
        ['Cause','angle in = angle out','one side slows before the other'],
        ['Example','a mirror image','a straw looking bent in water']],
  confusion:'Both change a wave\'s direction, but only refraction involves a change of speed.',
  tell:'Reflection bounces (same medium, same speed). Refraction bends because speed changes at a boundary.'},
 {a:'Mass',b:'Inertia',topic:'Forces',
  rows:[['What it is','the amount of matter (kg)','resistance to a change in motion'],
        ['Measured as','kilograms','no separate unit — quantified by mass'],
        ['Relationship','mass IS the measure of inertia','more mass ⇒ more inertia'],
        ['Felt as','how much stuff there is','how hard it is to start/stop/turn']],
  confusion:'They are closely linked — inertia is what mass does — but they are not the same idea.',
  tell:'Mass is the amount of matter; inertia is its reluctance to change motion. More mass = more inertia.'},
 {a:'Distance',b:'Displacement',topic:'Motion',
  rows:[['Type','scalar — size only','vector — size and direction'],
        ['Measures','total path travelled','straight line from start to end'],
        ['There and back','adds up','can be zero'],
        ['Example','a 400 m lap = 400 m','a 400 m lap = 0 m displacement']],
  confusion:'They are equal for a straight-line trip, which hides the difference until the path curves or returns.',
  tell:'Distance is the whole journey; displacement is start-to-finish with direction. A round trip has zero displacement.'},
 {a:'AC',b:'DC',topic:'Electricity',
  rows:[['Direction of flow','reverses back and forth','one constant direction'],
        ['Source','mains supply','cells and batteries'],
        ['Frequency (UK)','50 Hz','0 Hz (steady)'],
        ['Used for','transmitting mains power','electronics, portable devices']],
  confusion:'Both are electric current; the difference is whether the direction keeps flipping.',
  tell:'AC alternates (mains, 50 Hz). DC is steady one-way (batteries). Direction is the whole distinction.'},
 {a:'Conductor',b:'Insulator',topic:'Electricity',
  rows:[['Charge flow','allows it easily','blocks it'],
        ['Free electrons','many','very few'],
        ['Examples','metals, graphite','plastic, rubber, glass'],
        ['Used for','wires, contacts','cable coatings, safety casing']],
  confusion:'Both are everywhere in a circuit; one carries current, the other contains it safely.',
  tell:'Conductors have free electrons and carry current; insulators do not and block it. Metals conduct, plastics insulate.'}
);
/* ====================== TRIGGER TRAINER (push ~28 new, all topics) ====================== */
TRIG.push(
 // Energy
 {s:'A kettle is switched on and the water heats up, but the kettle and kitchen also get slightly warm.',mode:'multi',
  opts:[{t:'Energy transfer (electrical → thermal)',c:1},{t:'Conservation of energy',c:1},{t:'Efficiency / wasted energy',c:1},{t:'Energy being destroyed',c:0}],
  why:'Electrical energy transfers mostly to the water\'s thermal store; some dissipates to the surroundings (wasted), but the total is conserved — efficiency is just the useful fraction.'},
 {s:'A diver climbs a 10 m board, pauses, then jumps and speeds up on the way down.',mode:'multi',
  opts:[{t:'Gravitational potential energy',c:1},{t:'Kinetic energy',c:1},{t:'Energy transfer GPE → KE',c:1},{t:'Elastic potential energy',c:0}],
  why:'Climbing stores GPE; falling transfers it to KE, which is why speed builds. No spring is involved, so there is no elastic store here.'},
 {s:'A wind-up toy is wound, then released, and it scoots across the floor before stopping.',mode:'multi',
  opts:[{t:'Elastic potential energy',c:1},{t:'Energy transfer to kinetic',c:1},{t:'Dissipation by friction',c:1},{t:'Nuclear energy',c:0}],
  why:'Winding stores elastic PE in the spring; it transfers to KE to move the toy; friction dissipates it as heat until it stops.'},
 // Electricity
 {s:'Two bulbs are wired in parallel; you unscrew one and the other stays lit at full brightness.',mode:'single',
  opts:[{t:'Each branch gets the full supply voltage independently',c:1},{t:'Current is used up by the first bulb',c:0},{t:'They share the voltage equally',c:0}],
  why:'In parallel each branch is across the full supply voltage and forms its own loop, so removing one does not affect the other.'},
 {s:'A phone charger plug feels warm after charging for an hour.',mode:'multi',
  opts:[{t:'Resistive (Joule) heating, P = I²R',c:1},{t:'Energy dissipated as heat',c:1},{t:'Efficiency below 100%',c:1},{t:'The charger storing heat',c:0}],
  why:'Current through resistance dissipates some electrical energy as heat (P = I²R). It is normal inefficiency, not heat being stored.'},
 {s:'You rub a balloon on your hair and it then sticks to the wall.',mode:'multi',
  opts:[{t:'Static electricity (charge transfer)',c:1},{t:'Electrons transferred by friction',c:1},{t:'Induced charge / attraction',c:1},{t:'Magnetism',c:0}],
  why:'Rubbing transfers electrons, charging the balloon. The charged balloon induces an opposite charge in the wall and is attracted — this is electrostatics, not magnetism.'},
 {s:'A 2 kW heater is left on for twice as long as a 1 kW heater.',mode:'single',
  opts:[{t:'Energy = power × time, so it uses four times as much',c:1},{t:'They use the same energy',c:0},{t:'Power and energy are the same thing',c:0}],
  why:'Energy = power × time. Double the power AND double the time multiplies energy by four. Power is the rate; energy is the total.'},
 // Particle model / thermal
 {s:'A sealed, rigid can of gas is heated over a flame and eventually bursts.',mode:'multi',
  opts:[{t:'Gas pressure rises with temperature',c:1},{t:'Particles hit the walls harder and more often',c:1},{t:'Fixed volume (rigid can)',c:1},{t:'The gas gains mass',c:0}],
  why:'Heating speeds the particles so they strike the walls harder and more frequently; at fixed volume this raises pressure until the can fails. Mass is unchanged.'},
 {s:'Ice cubes are added to a warm drink and the drink cools while the ice melts.',mode:'multi',
  opts:[{t:'Thermal energy flows from hot to cold',c:1},{t:'Latent heat absorbed during melting',c:1},{t:'Specific heat capacity',c:1},{t:'Cold flowing from ice into the drink',c:0}],
  why:'Energy flows from the warm drink to the ice (never "cold" the other way). Some warms the meltwater (specific heat); much is absorbed as latent heat to melt the ice with no temperature rise.'},
 {s:'A puddle slowly disappears on a cool day without ever boiling.',mode:'single',
  opts:[{t:'Evaporation — fast surface particles escape',c:1},{t:'Boiling',c:0},{t:'The water was destroyed',c:0}],
  why:'Evaporation happens at the surface at any temperature as the fastest particles escape; no bubbles or boiling point are needed.'},
 // Atomic & radioactivity
 {s:'A radioactive sample\'s count rate drops from 80 to 20 counts/s over 10 minutes.',mode:'multi',
  opts:[{t:'Half-life (two halvings here)',c:1},{t:'Random but predictable-in-bulk decay',c:1},{t:'Activity decreasing over time',c:1},{t:'The source being used up evenly',c:0}],
  why:'80 → 40 → 20 is two halvings, so the half-life is 5 minutes. Decay is random per nucleus but statistically reliable, and activity falls (it does not decrease linearly to empty).'},
 {s:'A worker stands near a sealed gamma source for a short time, then leaves unaffected.',mode:'single',
  opts:[{t:'Irradiation (exposure), not contamination',c:1},{t:'They are now radioactive',c:0},{t:'They are contaminated',c:0}],
  why:'Being exposed to rays is irradiation; it does not make the person radioactive. Contamination would require radioactive material physically on or in them.'},
 // Forces — moments, pressure, springs, momentum, stopping
 {s:'A child sits far from the pivot of a see-saw to balance a heavier adult sitting close in.',mode:'multi',
  opts:[{t:'Moments (turning effect)',c:1},{t:'Moment = force × distance from pivot',c:1},{t:'Principle of balanced moments',c:1},{t:'Air resistance',c:0}],
  why:'Balance needs equal clockwise and anticlockwise moments. The lighter child compensates with a larger distance from the pivot, since moment = force × distance.'},
 {s:'A drawing pin pushed with gentle thumb pressure pierces a board easily.',mode:'multi',
  opts:[{t:'Pressure = force / area',c:1},{t:'Tiny contact area concentrates the force',c:1},{t:'High pressure at the point',c:1},{t:'The thumb exerts huge force',c:0}],
  why:'A modest force on the pin\'s tiny tip gives enormous pressure (P = F/A), enough to pierce — the force is small, the area is what makes the difference.'},
 {s:'A spring stretches 4 cm under 2 N and 8 cm under 4 N, then stops being proportional.',mode:'multi',
  opts:[{t:'Hooke\'s law (force ∝ extension)',c:1},{t:'Spring constant',c:1},{t:'Limit of proportionality',c:1},{t:'Momentum',c:0}],
  why:'Equal extension per newton shows Hooke\'s law and a constant spring constant — until the limit of proportionality, beyond which the linear relationship breaks down.'},
 {s:'A loaded lorry and a bicycle travel at the same speed; the lorry is far harder to stop.',mode:'multi',
  opts:[{t:'Momentum p = mv',c:1},{t:'Greater mass ⇒ greater momentum',c:1},{t:'Larger force or time needed to stop it',c:1},{t:'The lorry has more energy only because it is faster',c:0}],
  why:'At equal speed the lorry\'s far larger mass gives it much greater momentum, so stopping it needs a bigger force or a longer time (impulse = change in momentum).'},
 {s:'A car travelling faster needs a much longer distance to stop in an emergency.',mode:'multi',
  opts:[{t:'Stopping distance = thinking + braking distance',c:1},{t:'Braking distance grows with speed squared',c:1},{t:'Kinetic energy to dissipate',c:1},{t:'Reaction time depends on speed',c:0}],
  why:'Higher speed increases thinking distance (linearly) and braking distance (with the square of speed), because far more kinetic energy must be removed. Reaction time itself is roughly fixed.'},
 {s:'A car airbag inflates so the passenger stops over a longer time in a crash.',mode:'multi',
  opts:[{t:'Impulse = force × time',c:1},{t:'Longer stopping time reduces the force',c:1},{t:'Change in momentum is the same either way',c:1},{t:'The airbag removes the momentum for free',c:0}],
  why:'The change in momentum is fixed by the crash, but spreading it over a longer time lowers the peak force on the passenger — that is why airbags and crumple zones save lives.'},
 // Waves & light
 {s:'A straw in a glass of water looks bent at the surface.',mode:'single',
  opts:[{t:'Refraction — light changes speed at the boundary',c:1},{t:'Reflection',c:0},{t:'The straw is actually bent',c:0}],
  why:'Light slows passing from water to air and bends at the surface, so the submerged part appears displaced — refraction, with frequency unchanged.'},
 {s:'A radio works indoors, but visible light cannot pass through the walls.',mode:'multi',
  opts:[{t:'Electromagnetic spectrum (different frequencies)',c:1},{t:'Longer wavelengths penetrate more',c:1},{t:'Radio and light are the same kind of wave',c:1},{t:'Radio needs a medium',c:0}],
  why:'Radio and light are both EM waves; their very different frequencies/wavelengths give very different behaviour (radio passes through walls, visible light does not). Neither needs a medium.'},
 {s:'A guitar string is plucked harder and the same note sounds louder.',mode:'multi',
  opts:[{t:'Amplitude controls loudness',c:1},{t:'Frequency (pitch) unchanged',c:1},{t:'Energy carried by the wave increases',c:1},{t:'Pitch rises with amplitude',c:0}],
  why:'Plucking harder increases amplitude (loudness) and the energy carried, but the frequency — and so the pitch — is unchanged. Amplitude and pitch are independent.'},
 {s:'Sunlight reaches Earth across the vacuum of space, but astronauts cannot hear each other without radios.',mode:'multi',
  opts:[{t:'Light is an EM wave (no medium needed)',c:1},{t:'Sound is mechanical (needs a medium)',c:1},{t:'Vacuum carries EM but not sound',c:1},{t:'Space is too far for sound only',c:0}],
  why:'EM waves cross a vacuum (so we get sunlight), but sound is mechanical and needs particles, so there is silence in space regardless of distance.'},
 // Magnetism & electromagnetism
 {s:'A current-carrying wire placed between magnet poles jumps sideways when switched on.',mode:'multi',
  opts:[{t:'The motor effect',c:1},{t:'Force on a current in a magnetic field',c:1},{t:'Fleming\'s left-hand rule',c:1},{t:'Static electricity',c:0}],
  why:'A current in a magnetic field experiences a force (the motor effect); its direction follows Fleming\'s left-hand rule. This is the basis of electric motors.'},
 {s:'A magnet is pushed in and out of a coil and a sensitive meter flicks back and forth.',mode:'multi',
  opts:[{t:'Electromagnetic induction',c:1},{t:'A changing magnetic field induces a voltage',c:1},{t:'Generator effect',c:1},{t:'A steady field induces current',c:0}],
  why:'A CHANGING magnetic field through the coil induces a voltage (and current). Movement is essential — a stationary magnet induces nothing. This is how generators work.'},
 {s:'A device steps mains voltage down from 230 V to 12 V for a doorbell.',mode:'multi',
  opts:[{t:'Transformer',c:1},{t:'Relies on alternating current',c:1},{t:'Turns ratio sets the voltage ratio',c:1},{t:'Works on direct current',c:0}],
  why:'A transformer changes AC voltage using the ratio of coil turns. It needs AC (a changing field) to work — it does nothing with steady DC.'},
 // Space
 {s:'The International Space Station orbits Earth and the astronauts float inside.',mode:'multi',
  opts:[{t:'Gravity still acts (provides centripetal force)',c:1},{t:'Continuous free fall = apparent weightlessness',c:1},{t:'Orbital (circular) motion',c:1},{t:'There is no gravity that high',c:0}],
  why:'Gravity is still strong and provides the centripetal force for the orbit; the floating is because the station and astronauts fall together (free fall), not because gravity is absent.'},
 {s:'Light from distant galaxies is shifted toward the red end of the spectrum, more so for further galaxies.',mode:'multi',
  opts:[{t:'Red shift',c:1},{t:'Evidence the universe is expanding',c:1},{t:'Supports the Big Bang',c:1},{t:'The galaxies are physically red-coloured',c:0}],
  why:'Red shift means wavelengths are stretched as galaxies recede; greater shift for more distant galaxies indicates expansion, key evidence for the Big Bang — not that the galaxies are coloured red.'},
 {s:'A massive star runs out of fuel, swells, then collapses and explodes.',mode:'multi',
  opts:[{t:'Star life cycle',c:1},{t:'Fusion balance lost when fuel runs low',c:1},{t:'Supernova for massive stars',c:1},{t:'It simply burns out like a candle',c:0}],
  why:'A star is balanced between gravity and fusion pressure; when fuel runs low that balance fails, and a massive star swells then collapses and explodes as a supernova — not a gentle burnout.'}
);
/* ====================== MISCONCEPTION QUIZ (push ~20 new, with Socratic walks) ====================== */
function miIdx(title){return MIS.findIndex(m=>m.t===title)}
QUIZ.push(
 {mi:miIdx('Heavier / bigger things sink, lighter ones float'),
  q:'A huge steel cargo ship floats, but a small steel bolt sinks. Why?',
  opts:[{t:'Floating depends on density vs water, not weight',c:1},{t:'The ship is lighter than the bolt',c:0},{t:'Big things always float',c:0}],
  feels:'Heavy things often sink in everyday life, so "the ship is heavier so it should sink" feels right — but it is density that matters.',
  soc:['Is the steel ship heavier or lighter than the steel bolt?',
       'The ship\'s shape encloses a lot of air. What does that do to its AVERAGE density?',
       'If its average density is less than water\'s, what happens — and what if you crushed it into a solid block?']},
 {mi:miIdx('Vacuums "suck" / nature abhors a vacuum'),
  q:'You drink through a straw. What actually moves the liquid up?',
  opts:[{t:'Atmospheric pressure pushes it up from outside',c:1},{t:'Your mouth sucks/pulls it up',c:0},{t:'The vacuum pulls it up',c:0}],
  feels:'It feels exactly like sucking, so "I pull the drink up" seems obviously true.',
  soc:['When you "suck", what happens to the air pressure inside your mouth?',
       'Now the pressure outside (atmosphere) is higher than inside. Which way will it push the liquid?',
       'So is the drink pulled by a vacuum, or pushed by the higher pressure outside?']},
 {mi:miIdx('Sound and light travel the same way'),
  q:'Astronauts on a spacewalk need radios to talk, yet they can clearly see each other. Why?',
  opts:[{t:'Light is EM (crosses vacuum); sound is mechanical (needs a medium)',c:1},{t:'Space is too far for sound but not light',c:0},{t:'Their helmets block sound',c:0}],
  feels:'Sound and light both "travel to us", so it feels like they should behave the same way in space.',
  soc:['Sound is particles passing on a vibration. Is there a medium to carry it in space?',
       'Light is an electromagnetic wave. Does it need particles to travel?',
       'So why is space silent but not dark?']},
 {mi:miIdx('A bulb lights with a battery and one wire'),
  q:'You connect one wire from a battery to a bulb. Will it light?',
  opts:[{t:'No — you need a complete loop back to the other terminal',c:1},{t:'Yes — one wire is enough to deliver current',c:0},{t:'Only if the wire is thick',c:0}],
  feels:'One connection looks like "plugged in", so it feels like current should flow.',
  soc:['Current is charge flowing round. Where does the charge go after the bulb if there is only one wire?',
       'For a steady flow, what kind of path does the charge need?',
       'So how many connections back to the battery does a working circuit need?']},
 {mi:miIdx('Voltage flows through a component'),
  q:'How do you connect a voltmeter to measure the voltage across a bulb?',
  opts:[{t:'In parallel — across the bulb',c:1},{t:'In series — in the line with the bulb',c:0},{t:'Either way works the same',c:0}],
  feels:'If you picture voltage as something flowing, putting the meter "in the flow" (series) feels right.',
  soc:['Does current flow THROUGH a component, or is voltage measured ACROSS it?',
       'Voltage is the energy difference between two points. How many points must the meter touch?',
       'So should the voltmeter sit in the line (series) or bridge across the two ends (parallel)?']},
 {mi:miIdx('Thicker wires have more resistance'),
  q:'Which has the lower resistance: a short fat wire or a long thin one (same metal)?',
  opts:[{t:'The short fat wire',c:0},{t:'They are equal',c:0},{t:'The short fat wire has lower resistance',c:1}],
  feels:'A thick wire has "more metal", so it feels like more material to push through.',
  soc:['Picture charge flowing like traffic. Does a wider road carry traffic more or less easily?',
       'Now make the road longer. Does that help or hinder the flow?',
       'So how do thickness and length each affect resistance?']},
 {mi:miIdx('A battery stores charge / electricity'),
  q:'What does a battery actually store?',
  opts:[{t:'Chemical energy',c:1},{t:'A supply of charge/electricity',c:0},{t:'Electrons it sends out one-way',c:0}],
  feels:'A "flat" battery feels empty of electricity, so it seems like it stored charge that ran out.',
  soc:['Is there already charge (electrons) in the metal wires before you connect the battery?',
       'If the charge is already there, what is the battery adding to make it move?',
       'So what runs out when a battery goes flat — the charge, or the stored energy?']},
 {mi:miIdx('Particles themselves expand when heated'),
  q:'A metal bar expands when heated. What happens to its atoms?',
  opts:[{t:'They vibrate more and sit slightly further apart',c:1},{t:'Each atom grows bigger',c:0},{t:'New atoms appear',c:0}],
  feels:'The bar got bigger, so it feels like the atoms inside must have grown.',
  soc:['Heating gives particles more energy. What does that do to their motion?',
       'If they vibrate more vigorously, what happens to the average space between them?',
       'So does the metal expand because atoms grow, or because the gaps grow?']},
 {mi:miIdx('Cold flows into warm things'),
  q:'You hold an ice cube and your hand feels cold. What is really happening?',
  opts:[{t:'Thermal energy flows from your hand into the ice',c:1},{t:'Cold flows from the ice into your hand',c:0},{t:'Both cold and heat swap over',c:0}],
  feels:'It genuinely feels like cold is entering your hand, so "cold flows in" seems obvious.',
  soc:['Is "cold" a substance, or just the absence of thermal energy?',
       'Energy always flows from hotter to colder. Which is hotter, your hand or the ice?',
       'So which way does the energy actually move, and why does your hand feel cold?']},
 {mi:miIdx('Boiling and evaporation are the same'),
  q:'A wet towel dries on a cool washing line. Is this boiling or evaporation?',
  opts:[{t:'Evaporation — surface particles escape at any temperature',c:1},{t:'Boiling',c:0},{t:'Neither — the water vanishes',c:0}],
  feels:'Both turn liquid into gas, so they feel like the same process with different names.',
  soc:['Is the towel anywhere near water\'s boiling point?',
       'Where do the escaping particles leave from — throughout the liquid, or just the surface?',
       'So which process needs the boiling point and bubbles, and which happens at any temperature at the surface?']},
 {mi:miIdx('Irradiated objects become radioactive'),
  q:'Food is passed through a gamma beam to kill bacteria. Is the food now radioactive?',
  opts:[{t:'No — irradiation does not make it radioactive',c:1},{t:'Yes — anything hit by radiation becomes radioactive',c:0},{t:'Only the surface becomes radioactive',c:0}],
  feels:'"Exposed to radiation" sounds like it must leave the food radioactive.',
  soc:['Does standing in sunlight turn you into a source of light afterwards?',
       'What would have to physically happen for the food to keep emitting radiation itself?',
       'So what is the difference between irradiation (exposure) and contamination (material on/in it)?']},
 {mi:miIdx('Half-life is half the time to fully decay'),
  q:'A sample has a half-life of 5 years. How much is left after 10 years?',
  opts:[{t:'A quarter of the original',c:1},{t:'None — it has fully decayed',c:0},{t:'Half of the original',c:0}],
  feels:'"Half-life" sounds like half the time to disappear, so two of them feels like "all gone".',
  soc:['What does one half-life do to the amount remaining?',
       'Start with 100%. After the first 5 years, how much is left? After the next 5?',
       'So is each half-life halving the time, or halving what remains?']},
 {mi:miIdx('The Sun is burning like a fire'),
  q:'What process powers the Sun?',
  opts:[{t:'Nuclear fusion of hydrogen into helium',c:1},{t:'Burning fuel (combustion)',c:0},{t:'Friction of gases',c:0}],
  feels:'The Sun looks like a giant fire, so "it is burning" feels obvious.',
  soc:['Combustion needs oxygen. Is there oxygen in space for the Sun to burn in?',
       'Could any chemical fire keep going for billions of years?',
       'So what nuclear process — joining small nuclei — actually releases the Sun\'s energy?']},
 {mi:miIdx('Seasons are caused by distance from the Sun'),
  q:'Why is it summer in the UK while it is winter in Australia at the same time?',
  opts:[{t:'Earth\'s axial tilt changes the angle of sunlight',c:1},{t:'The UK is closer to the Sun then',c:0},{t:'The Sun gets hotter for the UK',c:0}],
  feels:'Closer-means-hotter feels intuitive, so "summer = nearer the Sun" seems reasonable.',
  soc:['If seasons were caused by distance, would both hemispheres not have the same season at once?',
       'They have OPPOSITE seasons. What about Earth could cause that?',
       'How does tilting a hemisphere toward the Sun change the directness of the sunlight it gets?']},
 {mi:miIdx('Action and reaction forces cancel out'),
  q:'A rocket pushes exhaust gas down and accelerates up. If the forces are equal and opposite, why does it move?',
  opts:[{t:'The pair acts on different objects, so they do not cancel',c:1},{t:'The upward force is actually bigger',c:0},{t:'Action-reaction does not apply to rockets',c:0}],
  feels:'"Equal and opposite" sounds like it should add to zero and stop anything moving.',
  soc:['Which object does the "push down on the gas" act on? Which does the "push up on the rocket" act on?',
       'Can two forces cancel if they act on different objects?',
       'So what has to be true for forces to cancel — and is that the case here?']},
 {mi:miIdx('At terminal velocity there is no force'),
  q:'A skydiver falls at a steady terminal velocity. What is the resultant force on them?',
  opts:[{t:'Zero — weight and drag are balanced',c:1},{t:'There are no forces acting',c:0},{t:'A large downward force',c:0}],
  feels:'No acceleration feels like "nothing is acting", so "no force" seems right.',
  soc:['Is the skydiver\'s weight still pulling down?',
       'Is air resistance (drag) still pushing up?',
       'If both are large but equal, what is the RESULTANT — and is that the same as "no force"?']},
 {mi:miIdx('In refraction the frequency changes'),
  q:'Light slows as it enters glass and bends. What happens to its frequency?',
  opts:[{t:'It stays the same; speed and wavelength change',c:1},{t:'The frequency drops',c:0},{t:'The frequency rises',c:0}],
  feels:'Since the wave clearly changes as it enters, it feels like everything about it changes.',
  soc:['What sets the frequency of the light — the glass, or the source that produced it?',
       'If the source is unchanged, can the boundary alter how many waves per second arrive?',
       'So in refraction, which two quantities change together, and which stays fixed?']},
 {mi:miIdx('Amplitude controls the pitch of a sound'),
  q:'You pluck a guitar string harder. What changes about the sound?',
  opts:[{t:'It gets louder (bigger amplitude), same pitch',c:1},{t:'It gets higher in pitch',c:0},{t:'Both pitch and loudness rise together',c:0}],
  feels:'A "bigger" wave feels like it should be a "higher" note.',
  soc:['Which wave property does plucking harder increase — amplitude or frequency?',
       'Which property sets loudness, and which sets pitch?',
       'So does a harder pluck change the volume, the pitch, or both?']},
 {mi:miIdx('Electromagnetic waves need a medium'),
  q:'How does the Sun\'s light reach Earth across empty space?',
  opts:[{t:'EM waves travel through a vacuum — no medium needed',c:1},{t:'Through air all the way from the Sun',c:0},{t:'Space is not really empty, so sound carries it',c:0}],
  feels:'All the waves we meet daily travel through something, so it feels like light must too.',
  soc:['Between the Sun and Earth there is a vacuum. Does light still get through?',
       'Which kind of wave needs particles to carry it — mechanical or electromagnetic?',
       'So can light cross empty space, and what does that tell you about EM waves?']},
 {mi:miIdx('All metals are magnetic'),
  q:'A magnet is held near a copper coin and an iron nail. What happens?',
  opts:[{t:'Only the iron nail is attracted',c:1},{t:'Both are attracted — they are metals',c:0},{t:'Only the copper coin is attracted',c:0}],
  feels:'Magnets and metals go together in everyday experience, so "all metals stick" feels true.',
  soc:['Name the metals that are actually magnetic.',
       'Is copper one of them?',
       'So will a magnet grab the copper coin, the iron nail, or both?']}
);
/* ====================== EQUATION EXPLORER (push ~18 new — full GCSE set) ====================== */
EQS.push(
 {id:'work',name:'Work done',form:'W = F · s',unit:'J',
  vars:[{s:'F',label:'force',min:0,max:200,step:5,val:50,unit:'N'},{s:'s',label:'distance',min:0,max:20,step:1,val:5,unit:'m'}],
  calc:v=>v.F*v.s,
  insight:'Work is force times the distance moved in its direction. Push a wall (no movement) and you do zero work, however hard you strain.',
  predict:{q:'Double the distance moved (same force). Work done will…',opts:['double','quadruple','stay the same'],a:0}},
 {id:'power',name:'Power (energy/time)',form:'P = E / t',unit:'W',
  vars:[{s:'E',label:'energy transferred',min:0,max:10000,step:100,val:2000,unit:'J'},{s:'t',label:'time',min:1,max:60,step:1,val:10,unit:'s'}],
  calc:v=>v.E/v.t,
  insight:'Power is energy transferred per second. The same job done in less time means more power — that is all "more powerful" really means.',
  predict:{q:'Transfer the same energy in half the time. Power will…',opts:['halve','double','stay the same'],a:1}},
 {id:'eff',name:'Efficiency',form:'efficiency = useful ÷ total',unit:'%',
  vars:[{s:'u',label:'useful output',min:0,max:100,step:5,val:40,unit:'J'},{s:'t',label:'total input',min:10,max:100,step:5,val:100,unit:'J'}],
  calc:v=>Math.min(v.u,v.t)/v.t*100,
  insight:'Efficiency is the useful fraction of energy. It can never exceed 100% — the rest is dissipated, usually as heat. Real devices always waste some.',
  predict:{q:'As useful output rises toward the total input, efficiency…',opts:['falls','rises toward 100%','stays the same'],a:1}},
 {id:'epower',name:'Electrical power',form:'P = I · V',unit:'W',
  vars:[{s:'I',label:'current',min:0,max:13,step:0.5,val:3,unit:'A'},{s:'V',label:'voltage',min:0,max:240,step:5,val:230,unit:'V'}],
  calc:v=>v.I*v.V,
  insight:'Mains power is current times voltage. High-power appliances (kettles, heaters) pull large currents, which is why they need thick cables and their own fuses.',
  predict:{q:'Double the current at the same voltage. Power will…',opts:['double','quadruple','halve'],a:0}},
 {id:'charge',name:'Charge flow',form:'Q = I · t',unit:'C',
  vars:[{s:'I',label:'current',min:0,max:10,step:0.5,val:2,unit:'A'},{s:'t',label:'time',min:0,max:300,step:10,val:60,unit:'s'}],
  calc:v=>v.I*v.t,
  insight:'Charge delivered is current times time. A small current over a long time can move just as much charge as a big current briefly.',
  predict:{q:'Keep the current; double the time. Charge that flows will…',opts:['double','quadruple','stay the same'],a:0}},
 {id:'eqv',name:'Energy transferred by charge',form:'E = Q · V',unit:'J',
  vars:[{s:'Q',label:'charge',min:0,max:100,step:5,val:20,unit:'C'},{s:'V',label:'voltage',min:0,max:12,step:0.5,val:6,unit:'V'}],
  calc:v=>v.Q*v.V,
  insight:'Each coulomb of charge carries V joules. More charge, or a bigger potential difference, means more energy delivered to the component.',
  predict:{q:'Double the voltage (same charge). Energy transferred will…',opts:['double','quadruple','halve'],a:0}},
 {id:'wave',name:'Wave speed',form:'v = f · λ',unit:'m/s',
  vars:[{s:'f',label:'frequency',min:1,max:1000,step:10,val:200,unit:'Hz'},{s:'L',label:'wavelength',min:0.1,max:10,step:0.1,val:2,unit:'m'}],
  calc:v=>v.f*v.L,
  insight:'Speed is frequency times wavelength. In a single medium the speed is fixed, so a higher frequency must mean a shorter wavelength — they trade off.',
  predict:{q:'Double the frequency at fixed wavelength. The computed wave speed will…',opts:['double','halve','stay the same'],a:0}},
 {id:'period',name:'Period & frequency',form:'T = 1 / f',unit:'s',
  vars:[{s:'f',label:'frequency',min:0.5,max:50,step:0.5,val:2,unit:'Hz'}],
  calc:v=>1/v.f,
  insight:'Period and frequency are reciprocals. 2 Hz means two cycles a second, so each cycle lasts 0.5 s. Faster frequency, shorter period.',
  predict:{q:'Double the frequency. The period of each cycle will…',opts:['double','halve','stay the same'],a:1}},
 {id:'density',name:'Density',form:'ρ = m / V',unit:'kg/m³',
  vars:[{s:'m',label:'mass',min:1,max:1000,step:10,val:100,unit:'kg'},{s:'V',label:'volume',min:0.1,max:10,step:0.1,val:1,unit:'m³'}],
  calc:v=>v.m/v.V,
  insight:'Density is mass per unit volume — it decides floating vs sinking against a fluid, not how heavy something is overall.',
  predict:{q:'Keep the mass; double the volume. Density will…',opts:['double','halve','stay the same'],a:1}},
 {id:'shc',name:'Thermal energy (specific heat)',form:'ΔE = m · c · Δθ',unit:'J',
  vars:[{s:'m',label:'mass',min:0.5,max:5,step:0.5,val:2,unit:'kg'},{s:'d',label:'temp change',min:1,max:100,step:1,val:20,unit:'°C'}],
  calc:v=>v.m*4200*v.d,
  insight:'With water\'s large specific heat capacity (c = 4200), even modest heating needs a lot of energy — which is why water stores heat well and moderates climate.',
  predict:{q:'Double the temperature change (same mass). Energy needed will…',opts:['double','quadruple','halve'],a:0}},
 {id:'latent',name:'Latent heat',form:'E = m · L',unit:'J',
  vars:[{s:'m',label:'mass',min:0.1,max:5,step:0.1,val:1,unit:'kg'},{s:'L',label:'latent heat',min:100000,max:2500000,step:100000,val:334000,unit:'J/kg'}],
  calc:v=>v.m*v.L,
  insight:'Latent heat is energy to change state with NO temperature change. It is huge — which is why steam at 100 °C scalds far worse than water at 100 °C.',
  predict:{q:'Double the mass changing state. Energy required will…',opts:['double','quadruple','stay the same'],a:0}},
 {id:'hooke',name:'Hooke\'s law',form:'F = k · e',unit:'N',
  vars:[{s:'k',label:'spring constant',min:1,max:100,step:1,val:20,unit:'N/m'},{s:'e',label:'extension',min:0,max:0.5,step:0.01,val:0.1,unit:'m'}],
  calc:v=>v.k*v.e,
  insight:'Within the limit of proportionality, force is proportional to extension. A stiffer spring (bigger k) needs more force for the same stretch.',
  predict:{q:'Double the extension (same spring). Force needed will…',opts:['double','quadruple','halve'],a:0}},
 {id:'epe',name:'Elastic potential energy',form:'Eₑ = ½ · k · e²',unit:'J',
  vars:[{s:'k',label:'spring constant',min:1,max:100,step:1,val:20,unit:'N/m'},{s:'e',label:'extension',min:0,max:0.5,step:0.01,val:0.1,unit:'m'}],
  calc:v=>0.5*v.k*v.e*v.e,
  insight:'Extension is squared: stretch twice as far and you store four times the energy. This is why a fully drawn bow holds so much more energy than a half-drawn one.',
  predict:{q:'Double the extension. Stored elastic energy will…',opts:['double','quadruple','halve'],a:1}},
 {id:'moment',name:'Moment (turning effect)',form:'M = F · d',unit:'N·m',
  vars:[{s:'F',label:'force',min:0,max:200,step:5,val:40,unit:'N'},{s:'d',label:'distance from pivot',min:0,max:2,step:0.1,val:0.5,unit:'m'}],
  calc:v=>v.F*v.d,
  insight:'Turning effect grows with distance from the pivot — which is why a longer spanner, or pushing a door far from its hinge, makes turning so much easier.',
  predict:{q:'Double the distance from the pivot. The moment will…',opts:['double','quadruple','stay the same'],a:0}},
 {id:'pressure',name:'Pressure',form:'P = F / A',unit:'Pa',
  vars:[{s:'F',label:'force',min:0,max:1000,step:10,val:500,unit:'N'},{s:'A',label:'area',min:0.001,max:1,step:0.001,val:0.01,unit:'m²'}],
  calc:v=>v.F/v.A,
  insight:'The same force on a smaller area gives far higher pressure — the principle behind drawing pins, knife edges, and why snowshoes spread weight to stop you sinking.',
  predict:{q:'Halve the contact area (same force). Pressure will…',opts:['halve','double','stay the same'],a:1}},
 {id:'liquidp',name:'Pressure in a liquid',form:'p = h · ρ · g',unit:'Pa',
  vars:[{s:'h',label:'depth',min:0,max:50,step:1,val:10,unit:'m'},{s:'r',label:'liquid density',min:500,max:1500,step:50,val:1000,unit:'kg/m³'}],
  calc:v=>v.h*v.r*9.8,
  insight:'Pressure rises with depth because more liquid weighs down from above — which is why dam walls are thicker at the bottom and deep dives need protection.',
  predict:{q:'Double the depth. Liquid pressure will…',opts:['double','quadruple','stay the same'],a:0}},
 {id:'mom',name:'Momentum',form:'p = m · v',unit:'kg·m/s',
  vars:[{s:'m',label:'mass',min:1,max:2000,step:10,val:1000,unit:'kg'},{s:'v',label:'velocity',min:0,max:40,step:1,val:10,unit:'m/s'}],
  calc:v=>v.m*v.v,
  insight:'Momentum bundles mass and velocity. A lorry has enormous momentum even at low speed, which is why it needs a large force or a long time to stop.',
  predict:{q:'Double the velocity (same mass). Momentum will…',opts:['double','quadruple','halve'],a:0}},
 {id:'accel',name:'Acceleration',form:'a = Δv / t',unit:'m/s²',
  vars:[{s:'d',label:'change in velocity',min:0,max:50,step:1,val:20,unit:'m/s'},{s:'t',label:'time taken',min:0.1,max:20,step:0.1,val:5,unit:'s'}],
  calc:v=>v.d/v.t,
  insight:'Acceleration is the change in velocity per second. The same speed gain achieved in less time is a bigger acceleration — and needs a bigger force.',
  predict:{q:'Same change in velocity, but over half the time. Acceleration will…',opts:['halve','double','stay the same'],a:1}}
);
/* ====================== COUNTERFACTUALS (push ~18 new) ====================== */
CF.push(
 {topic:'Electricity',o:'A bulb is connected in a simple series circuit and glows.',f:'What if you doubled the supply voltage?',r:'Current rises (I = V/R), so the bulb glows brighter and dissipates more power (P = IV). Push it too far and the filament overheats and blows.'},
 {topic:'Electricity',o:'Two bulbs are in series and glow dimly.',f:'What if a third identical bulb were added in series?',r:'Total resistance rises again, so the current falls further and all three glow even more dimly. Series sharing means more components = less for each.'},
 {topic:'Electricity',o:'A wire carries a steady current and warms up slightly.',f:'What if you replaced it with a much thinner wire?',r:'Thinner means higher resistance, so for the same current it dissipates more power (P = I²R) and gets hotter — the principle behind a fuse melting to break the circuit.'},
 {topic:'Particle model',o:'A balloon sits at room temperature, full and firm.',f:'What if you put it in the freezer?',r:'The particles slow and hit the walls less hard and less often, so the pressure drops and the balloon shrinks — even though no air escaped.'},
 {topic:'Particle model',o:'A sealed syringe of gas is at a fixed temperature.',f:'What if you pushed the plunger to halve the volume?',r:'The same particles hit a smaller area more often, so the pressure roughly doubles (at constant temperature) — Boyle\'s-law behaviour you can feel in your hand.'},
 {topic:'Particle model',o:'A metal spoon and a wooden spoon sit in hot soup.',f:'What if you swapped which one you held?',r:'The metal feels far hotter because it conducts thermal energy to your hand quickly; wood is a poor conductor, so it feels cooler at the same temperature.'},
 {topic:'Radioactivity',o:'A source has a half-life of 6 hours.',f:'What if you heated it, cooled it, or crushed it?',r:'Nothing changes. Radioactive decay is a nuclear property, unaffected by temperature, pressure, or chemistry — you cannot speed it up or slow it down.'},
 {topic:'Radioactivity',o:'An alpha source sits safely in a sealed container on a bench.',f:'What if it were swallowed instead?',r:'Outside the body alpha is stopped by skin and is least dangerous; inside, its intense ionisation makes it the most dangerous. The danger flips entirely with location.'},
 {topic:'Forces',o:'A car cruises along a flat motorway at steady speed with the engine on.',f:'What if all friction and air resistance vanished?',r:'It would keep moving at constant velocity with the engine off (Newton\'s first law). The engine normally exists only to cancel friction and drag, not to "maintain motion".'},
 {topic:'Forces',o:'A skydiver reaches terminal velocity in the atmosphere.',f:'What if they fell on the airless Moon instead?',r:'With no air there is no drag, so there is no terminal velocity — they accelerate the whole way down at the Moon\'s lower g, never settling to a steady speed.'},
 {topic:'Forces',o:'A see-saw balances with a child on each side.',f:'What if one child slid closer to the pivot?',r:'Their moment (force × distance) shrinks, so that side rises — balance is lost. To rebalance, either add force or move back out, restoring equal moments.'},
 {topic:'Forces',o:'A drawing pin is pushed into a board, point first.',f:'What if you pushed it the other way, head first?',r:'The large flat head spreads the same force over a big area, so the pressure is far too low to pierce — same force, very different pressure (P = F/A).'},
 {topic:'Motion',o:'A passenger sits still in a car moving at a steady speed.',f:'What if the driver suddenly braked hard?',r:'The passenger keeps moving forward (inertia) until the seatbelt provides the backward force to stop them — which is exactly why seatbelts exist.'},
 {topic:'Waves',o:'A ray of light passes from air into glass, slowing and bending.',f:'What if it travelled from glass back into air?',r:'It speeds up and bends away from the normal. Beyond a critical angle it cannot escape at all — total internal reflection, the basis of optical fibres.'},
 {topic:'Waves',o:'You hear a friend speak across a room.',f:'What if all the air were removed from the room?',r:'You would hear nothing. Sound is a mechanical wave needing particles to carry it; in a vacuum there is no medium, so it cannot travel — though you would still see them fine.'},
 {topic:'Magnetism',o:'A current flows through a wire between two magnet poles and it jumps one way.',f:'What if you reversed the current direction?',r:'The force reverses, so the wire jumps the opposite way (Fleming\'s left-hand rule). Reversing the magnetic poles would do the same — this switching is how motors keep turning.'},
 {topic:'Magnetism',o:'A transformer steps mains AC down to a lower voltage.',f:'What if you fed it steady DC instead?',r:'It would not work. Transformers need a CHANGING magnetic field to induce a voltage in the second coil; steady DC produces no change, so no output (and the coil may overheat).'},
 {topic:'Space',o:'Earth orbits the Sun with its axis tilted, giving seasons.',f:'What if Earth\'s axis were not tilted at all?',r:'Seasons would essentially vanish — every place would get roughly the same sunlight year-round. Seasons come from the tilt, not from distance to the Sun.'}
);

/* ====================== MENTAL MODELS (push ~10 new) ====================== */
MODELS.push(
 {c:'Static electricity',topic:'Electricity',
  model:'Rubbing transfers electrons between insulators, leaving one positively and one negatively charged. Like charges repel, opposites attract, and the build-up discharges as a spark when it finds a path to earth.',
  wrong:['Charge is created by rubbing.','Both objects gain the same charge.'],
  predict:['A balloon rubbed on hair sticks to a wall (induced opposite charge).','A charged rod deflects a thin stream of water.','You feel a shock touching metal after walking on carpet.'],
  bound:['Only electrons move; protons stay put.','Conductors let charge flow away, so static builds only on insulators (or isolated conductors).'],
  ex:['Lightning is static discharge on a vast scale.','Anti-static straps protect electronics from sudden discharge.']},
 {c:'Radioactive decay & half-life',topic:'Radioactivity',
  model:'Unstable nuclei decay at random, but in bulk the rate is precise. Half-life is the time for half the remaining nuclei to decay, so the amount halves repeatedly and approaches — but never cleanly reaches — zero.',
  wrong:['Decay is predictable for each individual nucleus.','After two half-lives nothing is left.'],
  predict:['100% → 50% → 25% → 12.5% over equal time steps.','Heating or crushing the sample changes nothing.','Activity (counts per second) falls in step with the amount remaining.'],
  bound:['Half-life describes populations, not single atoms.','Irradiation is not contamination — exposure does not usually make things radioactive.'],
  ex:['Carbon-14 dating of ancient remains.','Choosing isotopes by half-life for medical tracers.']},
 {c:'Thermal energy & specific heat',topic:'Particle model',
  model:'Temperature is the average kinetic energy per particle; thermal energy is the total. Specific heat capacity is how much energy one kilogram needs to warm by one degree — large for water, small for metals.',
  wrong:['Hotter always means more energy.','All materials heat up at the same rate.'],
  predict:['Water heats and cools slowly (high c), moderating climates.','A metal pan heats fast (low c) while its water stays cooler.','Doubling the mass doubles the energy needed for the same temperature rise.'],
  bound:['During a change of state, energy goes to latent heat and temperature pauses.','Heat always flows hot → cold; "cold" never flows.'],
  ex:['Hot-water bottles stay warm for hours.','Coastal areas have milder temperature swings than inland.']},
 {c:'Momentum & collisions',topic:'Forces',
  model:'Momentum (mass × velocity) is conserved in every collision because the forces between objects are equal and opposite and act for the same time. Spreading a collision over more time reduces the peak force.',
  wrong:['Kinetic energy is always conserved in collisions.','A heavier object always "wins" regardless of speed.'],
  predict:['Two trolleys that stick together move off slower (momentum shared).','An airbag lowers the force by extending the stopping time.','Recoil: a fired gun kicks back as the bullet goes forward.'],
  bound:['Only momentum is always conserved; kinetic energy is lost in inelastic collisions.','Needs a closed system — no external forces like strong friction.'],
  ex:['Crumple zones extend crash time to cut force.','Rockets gain momentum by expelling exhaust.']},
 {c:'Pressure in fluids',topic:'Pressure',
  model:'In a gas, pressure is countless particle impacts per second on the walls. In a liquid, pressure also grows with depth as the weight of fluid above presses down. Pressure differences push; nothing ever "sucks".',
  wrong:['A vacuum pulls things in.','Pressure and force are the same.'],
  predict:['Heating a sealed gas raises its pressure (harder, more frequent impacts).','A dam wall must be thickest at the bottom.','A straw works because atmospheric pressure pushes the drink up.'],
  bound:['Liquid pressure depends on depth and density, not the container\'s shape.','Reframe all "suction" as higher pressure pushing.'],
  ex:['Ears pop as air pressure changes with altitude.','Hydraulic brakes transmit pressure through fluid.']},
 {c:'Magnetic fields & the motor effect',topic:'Magnetism',
  model:'A magnet (or a current-carrying wire) is surrounded by a field running north to south. When a current flows across a magnetic field, the wire feels a force — the motor effect — whose direction follows Fleming\'s left-hand rule.',
  wrong:['All metals are magnetic.','A steady current near a magnet does nothing.'],
  predict:['A wire between magnet poles jumps when current flows.','Reversing the current or the field reverses the force.','Stronger current or field gives a bigger force.'],
  bound:['Only iron, steel, nickel and cobalt are magnetic.','The force needs the current to cross the field, not run along it.'],
  ex:['Electric motors and loudspeakers.','Maglev trains using powerful electromagnets.']},
 {c:'Electromagnetic induction',topic:'Magnetism',
  model:'A CHANGING magnetic field through a coil induces a voltage (and current if the circuit is complete). Move a magnet, spin a coil, or change a current nearby — the change is what matters. This runs generators and transformers.',
  wrong:['A stationary magnet in a coil induces a current.','Transformers work on direct current.'],
  predict:['Pushing a magnet in and out of a coil flicks a meter back and forth.','Spinning a coil in a field generates AC.','A transformer changes AC voltage by its turns ratio but does nothing with steady DC.'],
  bound:['No change, no induction — motion or a changing current is essential.','Transformers need AC; ideal ones conserve power (VₚIₚ = VₛIₛ).'],
  ex:['Power-station generators.','Phone chargers and the national grid.']},
 {c:'The electromagnetic spectrum',topic:'Waves',
  model:'Radio, microwave, infrared, visible, ultraviolet, X-ray and gamma are all the same kind of transverse EM wave, differing only in frequency and wavelength. All travel at the speed of light through a vacuum; energy rises with frequency.',
  wrong:['EM waves need a medium.','Red light has more energy than blue.'],
  predict:['Higher frequency (toward gamma) means more energy and more damage to cells.','All EM waves cross empty space at the same speed.','Radio (long wavelength) diffracts around obstacles; visible light mostly does not.'],
  bound:['Only EM waves cross a vacuum; sound (mechanical) cannot.','Frequency, not "warm colour", sets energy.'],
  ex:['Microwaves heat food; X-rays image bones; UV causes sunburn.','Infrared cameras see heat.']},
 {c:'Stopping distances',topic:'Forces',
  model:'Total stopping distance = thinking distance (during reaction time) + braking distance (while decelerating). Thinking distance grows with speed; braking distance grows with the square of speed, because kinetic energy (½mv²) scales with v².',
  wrong:['Braking distance grows in proportion to speed.','Reaction time gets shorter at higher speed.'],
  predict:['Doubling speed roughly quadruples braking distance.','Tiredness, alcohol or distraction lengthen thinking distance.','Wet or icy roads and worn tyres lengthen braking distance.'],
  bound:['Reaction time is roughly fixed; speed scales the distance travelled during it.','The squared term comes from the kinetic energy that brakes must remove.'],
  ex:['Speed-limit choices near schools.','Tailgating leaves no room for thinking + braking distance.']},
 {c:'Orbits & gravity',topic:'Space',
  model:'Gravity provides the centripetal force that bends a satellite\'s path into an orbit. The satellite is in continuous free fall — moving sideways fast enough that it keeps missing the planet — so everything inside floats.',
  wrong:['There is no gravity in space.','Satellites need constant thrust to stay up.'],
  predict:['Astronauts float because they fall with the station, not because gravity is gone.','A faster sideways speed gives a higher, wider orbit.','Cut the speed and the orbit decays — the craft spirals in.'],
  bound:['Orbits need the right sideways speed for the altitude.','Air drag in low orbits slowly removes energy, so orbits decay over time.'],
  ex:['The ISS and communication satellites.','The Moon orbiting Earth.']}
);

/* ====================================================================
   VERSION 5 — EDEXCEL (1PH0) TAILORING + EXHAUSTIVE SPEC COVERAGE
   Adds: Edexcel specification map (all 15 topics + 8 core practicals) with
   a RAG revision checklist, Edexcel-specific resources/setup, and gap-filling
   content so every Edexcel sub-topic is represented.
   ==================================================================== */

HELP.spec={what:'The complete GCSE Physics specification for your board (Edexcel or AQA), topic by topic — your master revision checklist.',
  how:['Open any topic to see its sub-points and where to study them in this app.','Tag each topic red / amber / green to track your confidence.','Make sure every core practical is ticked — they are tested directly in both papers.']};

/* ---- RAG revision tracker ---- */
function getRAG(){return store.get('specRAG',{})}
function setRAG(id,v){const r=getRAG();r[id]=(r[id]===v?null:v);store.set('specRAG',r);recordActivity();const host=document.getElementById('specBox');if(host){renderSpec()}}
const RAGC={r:'var(--t-concept)',a:'var(--t-trigger)',g:'var(--t-slip)'};

/* ---- Edexcel core practicals (separate physics, 8) ---- */
const CPRAC=[
 ['CP1','Force, mass &amp; acceleration','Vary the force/mass on a trolley and measure acceleration — verifies F = ma.'],
 ['CP2','Speed of waves','Measure frequency &amp; wavelength to find wave speed in a solid (or string) and in water.'],
 ['CP3','Refraction through glass','Trace rays through a rectangular glass block; measure how light bends entering and leaving.'],
 ['CP4','Thermal radiation (Triple)','Use a Leslie cube to compare how surface colour/texture affects radiation emitted or absorbed.'],
 ['CP5','I–V characteristics','Investigate how current varies with potential difference for a resistor, filament lamp and diode.'],
 ['CP6','Density','Determine the densities of regular &amp; irregular solids and of liquids using mass and volume.'],
 ['CP7','Specific heat capacity','Heat a known mass, measure energy in and temperature rise to find c.'],
 ['CP8','Force &amp; extension (Hooke)','Add masses to a spring and plot force against extension to find the spring constant and the limit of proportionality.'],
];

/* ---- the full Edexcel 1PH0 specification ---- */
const SPEC=[
 {id:'t1',n:1,paper:'Both papers',title:'Key concepts of physics',
  pts:['SI base units and unit prefixes (nano → giga)','Scalar vs vector quantities','Standard form and significant figures','Selecting, rearranging and substituting into equations'],
  study:[['Concept map','conceptmap'],['Equation explorer','explorer']]},
 {id:'t2',n:2,paper:'Paper 1',title:'Motion and forces',cp:'CP1',
  pts:['Distance/displacement and speed/velocity (scalars vs vectors)','Acceleration; uniform acceleration v² = u² + 2as','Distance–time and velocity–time graphs (gradient = rate, area = distance)','Newton\'s first, second and third laws; inertial mass','Momentum p = mv and F = Δp/Δt (HT)','Stopping distance = thinking + braking; dangers of large decelerations'],
  study:[['Trigger trainer','trigger'],['Equation explorer','explorer'],['Mental models','models'],['Concept contrasts','contrast']]},
 {id:'t3',n:3,paper:'Paper 1',title:'Conservation of energy',
  pts:['Energy stores and transfers; conservation and dissipation','Efficiency and reducing unwanted energy transfers','Energy resources: renewable vs non-renewable','Patterns of energy use and environmental impact'],
  study:[['Equation explorer','explorer'],['Concept contrasts','contrast'],['Misconception fixes','misconceptions']]},
 {id:'t4',n:4,paper:'Paper 1',title:'Waves',cp:'CP2',
  pts:['Transverse and longitudinal waves','Amplitude, wavelength, frequency, period','Wave speed v = f λ and T = 1/f','Wave behaviours; sound and the human hearing range','Uses of waves across the spectrum'],
  study:[['Equation explorer','explorer'],['Concept contrasts','contrast'],['Mental models','models']]},
 {id:'t5',n:5,paper:'Paper 1',title:'Light &amp; the EM spectrum',cp:'CP3',
  pts:['Reflection and refraction; the law of reflection','The EM spectrum order and properties','Uses and dangers of each EM region','Colour, filters and the appearance of objects','Lenses and ray diagrams (Triple)','Infrared / thermal radiation and black bodies (Triple, CP4)'],
  study:[['Concept contrasts','contrast'],['Mental models','models'],['Trigger trainer','trigger']]},
 {id:'t6',n:6,paper:'Paper 1',title:'Radioactivity',
  pts:['Development of the atomic model; isotopes','Alpha, beta and gamma: nature, charge, ionising power, penetration','Nuclear equations for alpha and beta decay','Half-life and activity; randomness of decay','Background radiation; contamination vs irradiation','Dangers and uses; nuclear fission and fusion'],
  study:[['Concept contrasts','contrast'],['Mental models','models'],['Misconception fixes','misconceptions']]},
 {id:'t7',n:7,paper:'Paper 1 · Triple only',triple:true,title:'Astronomy',
  pts:['Gravity, circular orbits and orbital speed','Structure of the solar system','Life cycle of stars (low-mass and massive)','Red shift and the expanding universe','The Big Bang and its supporting evidence'],
  study:[['Mental models','models'],['Trigger trainer','trigger']]},
 {id:'t8',n:8,paper:'Paper 2',title:'Energy — forces doing work',
  pts:['Work done W = F s and power P = E/t','Kinetic energy Eₖ = ½ m v²','Gravitational PE = m g h','Conservation of energy in mechanical systems'],
  study:[['Equation explorer','explorer'],['Mental models','models']]},
 {id:'t9',n:9,paper:'Paper 2',title:'Forces and their effects',
  pts:['Vector diagrams and free-body diagrams','Resultant forces and equilibrium','Moments, levers and gears','Turning effect M = F d'],
  study:[['Equation explorer','explorer'],['Trigger trainer','trigger'],['Concept map','conceptmap']]},
 {id:'t10',n:10,paper:'Paper 2',title:'Electricity and circuits',cp:'CP5',
  pts:['Charge Q = I t; current, potential difference','Resistance and Ohm\'s law; I–V characteristics (resistor, filament, diode)','Series and parallel circuits','LDRs and thermistors','Electrical power P = I V = I²R and energy E = I V t','Mains electricity, AC/DC, the three-pin plug','The National Grid and transformers'],
  study:[['Equation explorer','explorer'],['Concept contrasts','contrast'],['Misconception fixes','misconceptions'],['Mental models','models']]},
 {id:'t11',n:11,paper:'Paper 2 · Triple only',triple:true,title:'Static electricity',
  pts:['Charging insulators by friction (electron transfer)','Electric fields around charges','Sparks and discharge to earth','Uses and dangers of static electricity'],
  study:[['Mental models','models'],['Trigger trainer','trigger'],['Analogy bank','analogies']]},
 {id:'t12',n:12,paper:'Paper 2',title:'Magnetism &amp; the motor effect',
  pts:['Permanent and induced magnets; magnetic fields','Electromagnets and their uses','The motor effect; force F = B I L','Fleming\'s left-hand rule; electric motors'],
  study:[['Mental models','models'],['Trigger trainer','trigger'],['Equation explorer','explorer']]},
 {id:'t13',n:13,paper:'Paper 2',title:'Electromagnetic induction',
  pts:['The generator effect; inducing a potential difference','Alternators, dynamos, microphones and loudspeakers','Transformers and the turns ratio Vₚ/Vₛ = Nₚ/Nₛ','Power in an ideal transformer VₚIₚ = VₛIₛ'],
  study:[['Mental models','models'],['Trigger trainer','trigger']]},
 {id:'t14',n:14,paper:'Paper 2',title:'Particle model',cp:'CP6 · CP7',
  pts:['Density ρ = m/V; measuring density','States of matter and changes of state','Internal energy; specific heat capacity ΔE = m c Δθ','Specific latent heat E = m L','Gas pressure and temperature; pressure–volume (HT)'],
  study:[['Equation explorer','explorer'],['Concept contrasts','contrast'],['Mental models','models']]},
 {id:'t15',n:15,paper:'Paper 2',title:'Forces and matter',cp:'CP8',
  pts:['Forces and extension; Hooke\'s law F = k e','Elastic vs inelastic deformation','Elastic potential energy Eₑ = ½ k e²','Pressure in fluids p = h ρ g and upthrust (Triple)','Atmospheric pressure and how it varies with height'],
  study:[['Equation explorer','explorer'],['Concept contrasts','contrast'],['Trigger trainer','trigger']]},
];
function specTopicCard(t){const rag=getRAG()[t.id];
  return `<div class="acc" ${rag?`style="border-left:3px solid ${RAGC[rag]}"`:''}>
    <button onclick="toggleAcc(this)"><span><span class="mono" style="color:var(--ink-faint)">T${t.n}</span>&nbsp; ${t.title}</span>
      <span style="display:flex;gap:8px;align-items:center">${t.triple?'<span class="tag" style="background:var(--t-comp)">Triple</span>':''}${t.cp?`<span class="tag" style="background:var(--accent-deep)">${t.cp}</span>`:''}<span class="arrow">›</span></span></button>
    <div class="body"><div style="padding:12px 0 14px">
      <ul class="clean" style="margin:0 0 12px">${t.pts.map(p=>`<li>${p}</li>`).join('')}</ul>
      <div class="eyebrow" style="margin-bottom:6px">Study this in</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">${t.study.map(s=>`<button class="btn sm ghost" onclick="go('${s[1]}')">${s[0]} ›</button>`).join('')}</div>
      <div class="eyebrow" style="margin-bottom:6px">Confidence</div>
      <div class="rag">
        <button class="ragb ${rag==='r'?'on':''}" style="--rc:${RAGC.r}" onclick="setRAG('${t.id}','r')">Red</button>
        <button class="ragb ${rag==='a'?'on':''}" style="--rc:${RAGC.a}" onclick="setRAG('${t.id}','a')">Amber</button>
        <button class="ragb ${rag==='g'?'on':''}" style="--rc:${RAGC.g}" onclick="setRAG('${t.id}','g')">Green</button>
      </div>
    </div></div></div>`}
function renderSpec(){const host=document.getElementById('specBox');if(!host)return;
  const rag=getRAG();const counts={r:0,a:0,g:0,none:0};
  SPEC.forEach(t=>{const v=rag[t.id];if(v)counts[v]++;else counts.none++});
  const p1=SPEC.filter(t=>t.paper.startsWith('Paper 1')||t.paper==='Both papers');
  const p2=SPEC.filter(t=>t.paper.startsWith('Paper 2'));
  host.innerHTML=`
    <div class="t4" style="margin-bottom:18px">
      <div class="stat"><div class="big" style="color:${RAGC.g}">${counts.g}</div><div class="lbl">green</div></div>
      <div class="stat"><div class="big" style="color:${RAGC.a}">${counts.a}</div><div class="lbl">amber</div></div>
      <div class="stat"><div class="big" style="color:${RAGC.r}">${counts.r}</div><div class="lbl">red</div></div>
      <div class="stat"><div class="big">${counts.none}</div><div class="lbl">untagged</div></div>
    </div>
    <h3 class="blk">Paper 1 — Topics 1–7 <span class="muted" style="font-weight:400;font-size:.8rem">(motion, energy, waves, light, radioactivity, astronomy)</span></h3>
    ${p1.map(specTopicCard).join('')}
    <h3 class="blk">Paper 2 — Topics 1, 8–15 <span class="muted" style="font-weight:400;font-size:.8rem">(work, forces, electricity, magnetism, particles, matter)</span></h3>
    ${p2.map(specTopicCard).join('')}
    <h3 class="blk">The 8 core practicals</h3>
    <p class="muted" style="margin-top:-4px">Not done in the exam, but tested directly across both papers — methods, variables, results and the physics behind them.</p>
    <div class="card">${CPRAC.map(c=>`<div class="srrow" style="padding:10px 12px;align-items:flex-start;flex-wrap:wrap">
      <span class="tag" style="background:var(--accent-deep)">${c[0]}</span>
      <div style="flex:1;min-width:200px"><div class="cn">${c[1]}</div><div class="muted" style="font-size:.84rem;white-space:normal">${c[2]}</div></div></div>`).join('')}</div>`;
}
SEC.spec=()=>`
  <div class="eyebrow">Edexcel · 1PH0</div>
  <h2 class="h-sec">Specification coverage</h2>
  <p class="lead">The complete Pearson Edexcel GCSE Physics (1PH0) specification — every topic and sub-topic, plus all eight core practicals. Use it as your master checklist: tag each topic <span style="color:${RAGC.r}">red</span> / <span style="color:${RAGC.a}">amber</span> / <span style="color:${RAGC.g}">green</span> as you go, and jump straight to where each is taught in the app. <span class="muted">(On Combined Science 1SC0? Skip the Triple-only topics, flagged below.)</span></p>
  <div id="specBox"></div>`;
/* ---- default the board to Edexcel ---- */
if(!getProfile().board){setProfile('board','Edexcel (1PH0)')}

/* ---- Edexcel equation additions ---- */
EQS.push(
 {id:'suvat',name:'Uniform acceleration (final speed)',form:'v² = u² + 2 · a · s',unit:'m/s',
  vars:[{s:'u',label:'initial velocity',min:0,max:30,step:1,val:0,unit:'m/s'},{s:'a',label:'acceleration',min:0,max:20,step:1,val:5,unit:'m/s²'},{s:'s',label:'distance',min:0,max:100,step:5,val:20,unit:'m'}],
  calc:v=>Math.sqrt(v.u*v.u+2*v.a*v.s),
  insight:'This links motion without needing time. Rearranged, it shows braking distance depends on the square of speed — which is why stopping distance grows so fast.',
  predict:{q:'Increase the distance travelled (same u and a). The final velocity will…',opts:['rise','fall','stay the same'],a:0}},
 {id:'eivt',name:'Electrical energy transferred',form:'E = I · V · t',unit:'J',
  vars:[{s:'I',label:'current',min:0,max:13,step:0.5,val:3,unit:'A'},{s:'V',label:'voltage',min:0,max:240,step:10,val:230,unit:'V'},{s:'t',label:'time',min:0,max:300,step:10,val:60,unit:'s'}],
  calc:v=>v.I*v.V*v.t,
  insight:'Electrical energy is power (IV) times time. It is why a high-power appliance left on for a long time dominates your electricity bill.',
  predict:{q:'Double the time the appliance runs. Energy transferred will…',opts:['double','quadruple','halve'],a:0}},
 {id:'bil',name:'Force on a conductor (motor effect)',form:'F = B · I · L',unit:'N',
  vars:[{s:'B',label:'flux density',min:0,max:1,step:0.05,val:0.2,unit:'T'},{s:'I',label:'current',min:0,max:10,step:0.5,val:3,unit:'A'},{s:'L',label:'length in field',min:0,max:1,step:0.05,val:0.2,unit:'m'}],
  calc:v=>v.B*v.I*v.L,
  insight:'The motor-effect force grows with field strength, current and the length of wire in the field — the principle behind every electric motor and loudspeaker.',
  predict:{q:'Double the current (same field and length). The force will…',opts:['double','quadruple','halve'],a:0}},
 {id:'transformer',name:'Transformer (turns ratio)',form:'Vₛ = Vₚ · Nₛ / Nₚ',unit:'V',
  vars:[{s:'Vp',label:'primary voltage',min:0,max:240,step:10,val:230,unit:'V'},{s:'Np',label:'primary turns',min:1,max:1000,step:10,val:1000,unit:'turns'},{s:'Ns',label:'secondary turns',min:1,max:1000,step:10,val:100,unit:'turns'}],
  calc:v=>v.Vp*v.Ns/v.Np,
  insight:'A transformer scales voltage by the ratio of turns. Fewer secondary turns step the voltage down (and current up) — exactly how the National Grid works.',
  predict:{q:'Halve the number of secondary turns. The output voltage will…',opts:['double','halve','stay the same'],a:1}}
);

/* ---- override: Edexcel-specific resources ---- */
SEC.resources=()=>`
  <div class="eyebrow">Edexcel · 1PH0</div>
  <h2 class="h-sec">Resources</h2>
  <p class="lead">A short backbone tuned to <strong>Pearson Edexcel GCSE Physics (1PH0)</strong> — and Combined Science (1SC0) where relevant. Backbone, not a pile of tabs you never open.</p>
  <div class="grid two">
    <div class="card"><h4 style="margin:0 0 6px">Pearson Edexcel specification &amp; exam aid</h4><p style="margin:0;font-size:.92rem;color:var(--ink-soft)">The official 1PH0 specification and the Pearson <em>equations/exam aid</em> sheet — the exact wording and equation list your papers use. Your <a onclick="go('spec')">spec-coverage checklist</a> mirrors it.</p></div>
    <div class="card"><h4 style="margin:0 0 6px">Physics &amp; Maths Tutor (Edexcel)</h4><p style="margin:0;font-size:.92rem;color:var(--ink-soft)">Past papers, topic questions and mark schemes filtered to Edexcel. Your raw material for the Diagnose phase — match the board before drilling technique.</p></div>
    <div class="card"><h4 style="margin:0 0 6px">Save My Exams / Cognito (Edexcel)</h4><p style="margin:0;font-size:.92rem;color:var(--ink-soft)">Concise Edexcel-specific revision notes and topic questions, organised by the 15-topic structure.</p></div>
    <div class="card"><h4 style="margin:0 0 6px">Anki</h4><p style="margin:0;font-size:.92rem;color:var(--ink-soft)">For the fact/equation layer of Retain. Pairs with the concept-level <a onclick="go('scheduler')">scheduler</a> here — cards for facts, scheduler for problems.</p></div>
  </div>
  <div class="note"><span class="eyebrow">Edexcel specifics worth knowing</span>Topic 1 (Key concepts) is examined on <strong>both</strong> papers. Paper 1 covers Topics 1–7, Paper 2 covers Topics 1 and 8–15. At least 30% of marks are maths. All 8 core practicals are tested directly — see the <a onclick="go('spec')">spec coverage</a> page. If you are on Combined Science (1SC0), skip the Triple-only topics (Astronomy, Static electricity, lenses, thermal radiation, deeper EM induction).</p>
  <div class="divider"></div>
  <p class="muted" style="font-size:.86rem">Everything you log in this app — error entries, scheduled reviews, transfer scenarios, spec confidence tags — is saved in your own browser only. Nothing leaves the page. Keep the file and reopen it to pick up where you left off.</p>
`;

/* ---- override: Welcome page gains exam-board setup ---- */
SEC.welcome=()=>{const p=getProfile();const board=p.board||'Edexcel (1PH0)';
  const boards=['Edexcel (1PH0)','Edexcel Combined (1SC0)','AQA','OCR','Other'];
  return `
  <div class="eyebrow">Start here</div>
  <h2 class="h-sec">Welcome &amp; setup</h2>
  <p class="lead">A working method that behaves like a tutor: it diagnoses what's actually wrong, rebuilds the model, and schedules the comeback. This build is tuned to <strong>Edexcel</strong> — set your details below, then let <a onclick="go('plan')">Today's plan</a> drive.</p>
  <div class="card">
    <div class="eyebrow" style="margin-bottom:6px">Exam board</div>
    <div class="opts" style="flex-direction:row;flex-wrap:wrap">${boards.map(b=>`<button class="opt ${board===b?'sel':''}" style="flex:1;justify-content:center;min-width:130px" onclick="setProfile('board','${b}');go('welcome',true)">${b}</button>`).join('')}</div>
    <div class="eyebrow" style="margin:16px 0 6px">Your level</div>
    <div class="opts" style="flex-direction:row;flex-wrap:wrap">${['GCSE','A-level','University'].map(l=>`<button class="opt ${p.level===l?'sel':''}" style="flex:1;justify-content:center" onclick="setProfile('level','${l}');go('welcome',true)">${l}</button>`).join('')}</div>
    <div class="eyebrow" style="margin:16px 0 6px">Your goal</div>
    <div class="opts" style="flex-direction:row;flex-wrap:wrap">${['Pass','Grade 7','Grade 9 / A*','Deep understanding'].map(g=>`<button class="opt ${p.goal===g?'sel':''}" style="flex:1;justify-content:center;min-width:120px" onclick="setProfile('goal','${g}');go('welcome',true)">${g}</button>`).join('')}</div>
    <p class="mono" style="font-size:.82rem;color:var(--rest);margin:14px 0 0">✓ ${esc(board)}${p.level?' · '+esc(p.level):''}${p.goal?' · '+esc(p.goal):''}. Your plan, diagnosis and <a onclick="go('spec')">spec checklist</a> reflect this.</p>
  </div>
  <div class="card" style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
    <div><strong>Guided walkthrough</strong><div class="muted" style="font-size:.88rem">A 4-step tour of how the method works.</div></div>
    <button class="btn amber" onclick="showOnboard()">Replay the tour</button>
  </div>
  <div class="note" style="margin-top:16px"><span class="eyebrow">The one habit that matters</span>When in doubt, open <a onclick="go('plan')">Today's plan</a> and do the top block. Everything else is optional depth.</p>`;
};
/* ====================== EDEXCEL GAP-FILL: MISCONCEPTIONS ====================== */
MIS.push(
 {t:'A steeper distance–time graph means slowing down',topic:'Motion',
  wrong:'A steeper line on a distance–time graph shows the object decelerating.',
  right:'On a distance–time graph the GRADIENT is the speed, so steeper means FASTER, not slower. A curve getting steeper shows acceleration; a flat line means stationary.',
  ana:'A hill\'s steepness tells you how fast you descend — steeper slope, faster journey. The graph\'s slope is the speed.',
  tell:'Distance–time: gradient = speed. Velocity–time: gradient = acceleration, area = distance. Know which graph you are reading.'},
 {t:'Area under a velocity–time graph is the speed',topic:'Motion',
  wrong:'The area under a velocity–time graph gives the speed.',
  right:'On a velocity–time graph the speed is read off the y-axis directly; the AREA underneath gives the distance travelled, and the GRADIENT gives the acceleration.',
  ana:'Speed × time = distance, which is exactly a rectangle\'s area on the graph. Adding up those areas totals the distance.',
  tell:'Velocity–time graph: height = velocity, gradient = acceleration, AREA = distance. Three different readings.'},
 {t:'Doubling speed doubles the braking distance',topic:'Forces',
  wrong:'Twice the speed needs twice the distance to stop.',
  right:'Braking distance depends on the SQUARE of speed (the kinetic energy ½mv² brakes must remove). Double the speed and braking distance roughly QUADRUPLES — which is why small speed rises are so dangerous.',
  ana:'Energy to remove scales with v², so 30 → 60 mph is not twice as hard to stop, it is about four times.',
  tell:'Thinking distance scales with speed; braking distance scales with speed squared. Double speed ⇒ ~4× braking distance.'},
 {t:'The National Grid uses high current to cut losses',topic:'Electricity',
  wrong:'Power is sent at high current so more energy gets through.',
  right:'The grid transmits at high VOLTAGE and LOW current. Power lost as heat in the cables is I²R, so lowering the current massively cuts wasted energy. Transformers step voltage up for transmission and down for use.',
  ana:'A narrow fast jet (high current) heats the pipe far more than a gentle high-pressure flow (high voltage). Lowering current is what saves the energy.',
  tell:'Grid = high voltage, low current. Losses are I²R, so cutting current is what reduces them — done with transformers.'},
 {t:'The image in a plane mirror is on the mirror\'s surface',topic:'Waves',
  wrong:'A mirror image sits on the glass where you see it.',
  right:'A plane mirror forms a VIRTUAL image that appears as far BEHIND the mirror as the object is in front. Light only appears to come from there; no light actually reaches that point.',
  ana:'Your reflection looks like a twin standing the same distance behind the glass — step back and the image steps back too.',
  tell:'Plane-mirror image: virtual, upright, same size, as far behind as the object is in front.'},
 {t:'Transformers work on direct current',topic:'Magnetism',
  wrong:'A transformer changes the voltage of any electricity, including DC.',
  right:'Transformers need a CHANGING magnetic field to induce a voltage in the secondary coil, so they only work with alternating current (AC). Steady DC produces no change and no output.',
  ana:'Induction needs movement/change — a still magnet in a coil induces nothing. Steady DC is like a still magnet; AC keeps changing.',
  tell:'Transformers (and the grid) need AC. Feed them DC and you get no output — and possibly an overheating coil.'},
 {t:'Gas pressure is the gas pushing down by its weight',topic:'Particle model',
  wrong:'A gas presses on its container because the gas is heavy and sinks onto the walls.',
  right:'Gas pressure comes from countless particle COLLISIONS with the walls in all directions, not from the gas\'s weight. Heating speeds the particles so they hit harder and more often, raising pressure.',
  ana:'Like popcorn drumming on a pan lid from inside — the drumming is the pressure, and it pushes equally in every direction, not just down.',
  tell:'Gas pressure = particle impacts in all directions. Raise temperature ⇒ harder, more frequent hits ⇒ more pressure.'},
 {t:'A lens makes light itself bigger',topic:'Waves',
  wrong:'A magnifying lens enlarges the light to make things look bigger.',
  right:'A lens REFRACTS (bends) light rays so they appear to come from a larger (or differently placed) image. It changes the direction of rays, not the "size" of light.',
  ana:'The lens redirects rays like a set of angled mirrors, so your eye traces them back to a bigger image — the light is bent, not inflated.',
  tell:'Lenses work by refraction. A convex lens converges rays; where they meet (or appear to) sets the image size and position.'}
);

/* ====================== EDEXCEL GAP-FILL: CONTRASTS ====================== */
CONTRAST.push(
 {a:'Scalar',b:'Vector',topic:'Key concepts',
  rows:[['What it has','size (magnitude) only','size AND direction'],
        ['Examples','distance, speed, mass, energy, time','displacement, velocity, force, momentum, acceleration'],
        ['Adding two','simple arithmetic','must account for direction (can partly cancel)'],
        ['Shown as','a number + unit','an arrow (length = size, way = direction)']],
  confusion:'Some pairs look identical (speed vs velocity) until direction matters.',
  tell:'If direction is part of the quantity, it is a vector. Distance/speed/mass/energy are scalars; force/velocity/momentum are vectors.'},
 {a:'Distance–time graph',b:'Velocity–time graph',topic:'Motion',
  rows:[['Y-axis','distance','velocity'],
        ['Gradient gives','speed','acceleration'],
        ['Flat (horizontal) line','stationary','constant velocity'],
        ['Area underneath','no special meaning','distance travelled']],
  confusion:'Both are motion graphs with time on the x-axis, so students read the wrong quantity off the wrong graph.',
  tell:'Distance–time: gradient = speed. Velocity–time: gradient = acceleration, AREA = distance.'},
 {a:'Renewable',b:'Non-renewable',topic:'Energy',
  rows:[['Replenished?','yes, on a human timescale','no — finite, runs out'],
        ['Examples','wind, solar, tidal, hydro, geothermal','coal, oil, gas, nuclear fuel'],
        ['Carbon emissions','low in use (not always zero)','high for fossil fuels'],
        ['Reliability','often intermittent','usually reliable/on-demand']],
  confusion:'"Renewable" is taken to mean clean and unlimited; "non-renewable" to mean simply bad.',
  tell:'Renewable = replenished naturally (not automatically clean/limitless). Non-renewable = finite. Weigh reliability AND impact.'},
 {a:'Elastic',b:'Inelastic',topic:'Forces',
  rows:[['Deformation','returns to original shape','permanently changed'],
        ['Energy','stored, then released','some not recovered (work done to deform)'],
        ['Below/above limit','within elastic limit','beyond the elastic limit'],
        ['Example','a stretched spring springing back','a bent paperclip staying bent']],
  confusion:'Both involve a force changing an object\'s shape; the difference is whether it recovers.',
  tell:'Elastic = springs back (energy stored/released). Inelastic = stays deformed. The elastic limit is the boundary.'},
 {a:'Ohmic resistor',b:'Filament lamp',topic:'Electricity',
  rows:[['I–V graph','straight line through origin','S-shaped curve'],
        ['Resistance','constant','rises as it heats up'],
        ['Why','temperature roughly constant','filament gets hot, ions vibrate more'],
        ['Ohm\'s law','obeys it','does not (resistance changes)']],
  confusion:'Both are circuit components, but only one keeps a constant resistance.',
  tell:'Ohmic resistor: straight I–V line, constant R. Filament lamp: curves as heating raises its resistance.'},
 {a:'Permanent magnet',b:'Induced magnet',topic:'Magnetism',
  rows:[['Magnetism','always magnetic','only magnetic in a field'],
        ['When field removed','stays magnetic','loses its magnetism'],
        ['Force','attracts or repels','only ever attracts'],
        ['Example','a bar magnet','a paperclip near a magnet']],
  confusion:'An induced magnet behaves like a magnet while near one, so it is mistaken for a permanent magnet.',
  tell:'Permanent: always magnetic, can repel. Induced: magnetic only in a field, always attracts, then loses it.'}
);

/* ====================== EDEXCEL GAP-FILL: MENTAL MODELS ====================== */
MODELS.push(
 {c:'Reading motion graphs',topic:'Motion',
  model:'On a distance–time graph the gradient is the speed (flat = stopped, curve = changing speed). On a velocity–time graph the gradient is the acceleration and the area underneath is the distance travelled.',
  wrong:['A steeper distance–time line means slowing down.','The area under a velocity–time graph is the speed.'],
  predict:['A horizontal distance–time line = stationary; a horizontal velocity–time line = constant speed.','A straight sloping velocity–time line = constant acceleration.','The area of the velocity–time graph totals the distance, even for changing speed.'],
  bound:['Always check which quantity is on the y-axis before reading gradient or area.','Curved lines need a tangent for instantaneous gradient.'],
  ex:['Interpreting a car\'s journey trace.','Finding distance from a velocity–time graph by counting area.']},
 {c:'The National Grid',topic:'Electricity',
  model:'Power stations generate electricity, transformers step the voltage UP for transmission (so current is low and I²R heating losses are small), then step it DOWN again for safe use in homes.',
  wrong:['Electricity is sent at high current to deliver more power.','Transformers can work on DC.'],
  predict:['Higher transmission voltage means lower current and less wasted heat.','Step-up at the station, step-down near homes.','Transformers need AC — a changing field — to function.'],
  bound:['Power is conserved in an ideal transformer (VₚIₚ = VₛIₛ): stepping voltage up steps current down.','Only works with alternating current.'],
  ex:['Pylons carry hundreds of kilovolts.','The local substation steps voltage down to 230 V.']},
 {c:'Life cycle of a star',topic:'Space',
  model:'A star forms from a collapsing nebula and shines by fusion, balanced between gravity (inward) and radiation pressure (outward). When fuel runs low the balance fails: low-mass stars swell to red giants then become white dwarfs; massive stars become red supergiants, explode as supernovae, and leave neutron stars or black holes.',
  wrong:['Stars burn like a fire and simply go out.','All stars end the same way.'],
  predict:['A stable "main sequence" star has gravity and fusion pressure balanced.','More massive stars live shorter, more violent lives.','Supernovae scatter heavy elements that seed new stars and planets.'],
  bound:['Final fate depends on mass.','Fusion, not combustion, powers every stage.'],
  ex:['Our Sun will become a red giant then a white dwarf.','Supernova remnants like the Crab Nebula.']},
 {c:'Scalars, vectors & resultant forces',topic:'Forces',
  model:'Scalars have size only; vectors have size and direction and are drawn as arrows. Forces are vectors, so they combine by direction: a single resultant force replaces several, and balanced forces give a zero resultant (no change in motion).',
  wrong:['All quantities add up by simple arithmetic.','If something moves, the forces must be unbalanced.'],
  predict:['Two equal opposite forces give zero resultant — no acceleration.','At constant velocity the resultant force is zero.','Forces at angles combine using a vector diagram.'],
  bound:['Only a non-zero resultant changes motion (Newton\'s second law).','Free-body diagrams show every force on one object.'],
  ex:['A book resting on a table (weight balanced by reaction).','A car at steady speed (thrust balances drag and friction).']},
 {c:'Gas pressure & the gas laws',topic:'Particle model',
  model:'Gas pressure is countless particle impacts on the walls. Heating the gas speeds the particles, so they hit harder and more often — pressure rises (at fixed volume). Squeezing it into a smaller volume packs the impacts closer, so pressure also rises (at fixed temperature).',
  wrong:['Gas presses down by its weight.','Heating a sealed gas does nothing to its pressure.'],
  predict:['Heat a sealed rigid can and its pressure climbs until it may burst.','Halve the volume at constant temperature and pressure roughly doubles.','Cool a balloon and it shrinks as impacts weaken.'],
  bound:['Pressure acts in all directions, not just downward.','Constant-temperature pressure–volume behaviour is Higher Tier.'],
  ex:['A pressure cooker raises pressure and boiling point.','Tyres read higher pressure when hot.']},
 {c:'Lenses & images',topic:'Waves',
  model:'A lens refracts light rays. A convex (converging) lens bends parallel rays to a focal point; depending on where the object sits, it forms a real inverted image (object beyond the focal length) or a magnified virtual image (object inside it — a magnifying glass).',
  wrong:['A lens makes the light itself bigger.','All lens images are the right way up.'],
  predict:['Object far away ⇒ small, inverted, real image (as in a camera).','Object inside the focal length ⇒ enlarged, upright, virtual image.','A concave (diverging) lens always gives a smaller virtual image.'],
  bound:['Image type depends on lens shape and object distance.','Ray diagrams use the principal focus and the optical centre.'],
  ex:['A magnifying glass held close to text.','A camera or the eye forming a real image.']}
);
/* ====================== EDEXCEL GAP-FILL: ANALOGIES ====================== */
ANA.push(
 {topic:'Key concepts',k:'Vectors = arrows you can add tip-to-tail',v:'A vector is an arrow: length is the size, direction is the way it points. Add two by placing them tip-to-tail; if they oppose, they partly cancel — which is how a resultant force is found.'},
 {topic:'Motion',k:'Velocity–time area = stacking rectangles',v:'Distance = speed × time, which is a rectangle on the graph. The whole area under the line stacks those rectangles together, giving total distance — even when the speed changes.'},
 {topic:'Electricity',k:'National Grid = wide gentle river, not a fire hose',v:'High voltage and low current is like moving water as a broad, slow river — little friction (heat) lost in the banks. High current is a narrow fast jet that scorches the pipe (I²R losses).'},
 {topic:'Electricity',k:'LDR and thermistor = automatic dimmer switches',v:'An LDR\'s resistance falls in bright light; a thermistor\'s falls when hot. Wired into a circuit, they let light or temperature control current automatically — street lights, thermostats.'},
 {topic:'Space',k:'Red shift = dots on an inflating balloon',v:'Draw dots on a balloon and inflate it: every dot moves away from every other, and the further apart, the faster they separate. Galaxies do the same as space expands — light stretches to longer (redder) wavelengths.'},
 {topic:'Forces',k:'Gears = trading speed for turning effect',v:'A large gear driving a small one spins it faster with less force; the reverse trades speed for a bigger turning effect. Like cycling gears — easy-to-pedal hills versus fast flats.'},
 {topic:'Waves',k:'Convex lens = rays funnelled to a focus',v:'A converging lens bends parallel rays inward to meet at the focal point, like a funnel gathering rain to a single spout. Where the rays cross sets where the image forms.'},
 {topic:'Particle model',k:'Latent heat plateau = paying the doorman',v:'On a heating curve the temperature pauses during melting/boiling: all the energy goes to breaking bonds (the entry fee to change state), not to raising temperature, until everyone is through the door.'}
);

/* ====================== EDEXCEL GAP-FILL: TRIGGER TRAINER ====================== */
TRIG.push(
 {s:'A velocity–time graph shows a straight line sloping upward from the origin.',mode:'multi',
  opts:[{t:'Constant acceleration (steady gradient)',c:1},{t:'Distance = area under the line',c:1},{t:'Velocity increasing with time',c:1},{t:'The object is slowing down',c:0}],
  why:'A straight upward slope on a velocity–time graph means constant acceleration; the area beneath gives the distance travelled. The velocity is rising, not falling.'},
 {s:'A town must choose between a gas power station and an offshore wind farm.',mode:'multi',
  opts:[{t:'Renewable vs non-renewable resource',c:1},{t:'Reliability / intermittency trade-off',c:1},{t:'Environmental impact and CO₂',c:1},{t:'Wind is completely free of any downside',c:0}],
  why:'This weighs a finite, reliable, higher-CO₂ fossil source against a renewable but intermittent one. Renewables have lower emissions in use but are not downside-free (variable output, land/sea use).'},
 {s:'A hospital uses one type of radiation to image bones and another to sterilise equipment, and warns staff to limit exposure.',mode:'multi',
  opts:[{t:'EM spectrum — different regions, different uses',c:1},{t:'Ionising radiation has dangers',c:1},{t:'Higher frequency = higher energy',c:1},{t:'All EM waves are equally safe',c:0}],
  why:'X-rays image bones and gamma sterilises because higher-frequency EM waves carry more energy and ionise — useful but hazardous, so exposure is limited.'},
 {s:'An unstable nucleus emits an alpha particle and becomes a different element.',mode:'multi',
  opts:[{t:'Nuclear (radioactive) decay',c:1},{t:'Mass number falls by 4, atomic number by 2',c:1},{t:'Conservation in the nuclear equation',c:1},{t:'A chemical reaction',c:0}],
  why:'Alpha emission removes 2 protons and 2 neutrons, so the mass number drops by 4 and the atomic number by 2, forming a new element. Mass and charge balance across the nuclear equation. It is nuclear, not chemical.'},
 {s:'A street light switches itself on automatically as dusk falls.',mode:'single',
  opts:[{t:'An LDR raises its resistance in low light, triggering the circuit',c:1},{t:'A thermistor responds to the dark',c:0},{t:'The bulb senses light itself',c:0}],
  why:'A light-dependent resistor (LDR) has high resistance in the dark; wired into a sensing circuit it switches the lamp on as light levels drop.'},
 {s:'Electricity leaves a power station at 25 kV, is raised to 400 kV for the pylons, then lowered to 230 V for homes.',mode:'multi',
  opts:[{t:'Transformers (step-up then step-down)',c:1},{t:'High voltage, low current cuts I²R losses',c:1},{t:'Requires alternating current',c:1},{t:'High current is used to save energy',c:0}],
  why:'Step-up transformers raise the voltage (lowering current and I²R heating losses) for efficient transmission; step-down transformers lower it for safe use. Transformers need AC.'},
 {s:'Refuelling a plane, technicians bond it to earth with a cable before pumping fuel.',mode:'multi',
  opts:[{t:'Static electricity build-up',c:1},{t:'Risk of a spark/discharge',c:1},{t:'Earthing to remove excess charge safely',c:1},{t:'Magnetism',c:0}],
  why:'Flowing fuel can build static charge; a spark near fuel vapour is dangerous, so bonding to earth lets charge flow away safely. This is electrostatics, not magnetism.'},
 {s:'A magnifying glass held close to a stamp shows it enlarged and upright.',mode:'multi',
  opts:[{t:'Convex (converging) lens',c:1},{t:'Refraction of light',c:1},{t:'A magnified virtual image (object inside focal length)',c:1},{t:'The lens enlarges the light itself',c:0}],
  why:'A convex lens refracts rays; with the object inside the focal length it forms an enlarged, upright, virtual image. The light is bent, not "made bigger".'},
 {s:'A child on a see-saw uses a longer plank on their side and can now lift a heavier adult.',mode:'multi',
  opts:[{t:'Moments / turning effect',c:1},{t:'Levers multiply force with distance',c:1},{t:'Moment = force × distance from pivot',c:1},{t:'The child became stronger',c:0}],
  why:'A lever multiplies turning effect with distance from the pivot. A greater distance lets a smaller force produce a larger moment — the principle of levers.'},
 {s:'A sealed pan of water is heated; the temperature climbs, then pauses at 100 °C while it boils.',mode:'multi',
  opts:[{t:'Specific heat capacity (the climb)',c:1},{t:'Latent heat of vaporisation (the plateau)',c:1},{t:'Change of state at constant temperature',c:1},{t:'The thermometer is faulty',c:0}],
  why:'Energy first raises the temperature (specific heat capacity), then the plateau is latent heat — energy breaking bonds to change state with no temperature rise.'},
 {s:'A diver descends and feels increasing pressure on their ears.',mode:'multi',
  opts:[{t:'Pressure in a liquid increases with depth',c:1},{t:'p = h ρ g',c:1},{t:'Weight of water above presses down',c:1},{t:'Water sucks inward on the ears',c:0}],
  why:'Liquid pressure rises with depth because more water weighs down from above (p = hρg). Nothing "sucks" — it is the increasing push of the water column.'},
 {s:'A satellite is moved to a higher orbit and travels more slowly around the Earth.',mode:'multi',
  opts:[{t:'Gravity provides the centripetal force',c:1},{t:'Higher orbit ⇒ lower orbital speed',c:1},{t:'Circular motion',c:1},{t:'No gravity acts at that height',c:0}],
  why:'Gravity supplies the centripetal force for the orbit; higher orbits require a lower speed to stay in balance. Gravity is still very much present.'}
);

/* ====================== EDEXCEL GAP-FILL: COUNTERFACTUALS ====================== */
CF.push(
 {topic:'Electricity',o:'The National Grid transmits power at very high voltage and low current.',f:'What if it transmitted at low voltage and high current instead?',r:'Energy lost as heat in the cables is I²R, so a high current would waste enormous energy along the lines. High voltage / low current is precisely what keeps transmission efficient.'},
 {topic:'Motion',o:'A velocity–time graph for a car is a straight line sloping upward.',f:'What if the line became horizontal?',r:'A horizontal velocity–time line means zero gradient, so zero acceleration — the car moves at constant velocity. The area underneath still gives the distance travelled.'},
 {topic:'Magnetism',o:'A transformer steps mains voltage down using its turns ratio.',f:'What if you doubled the number of secondary turns?',r:'The output voltage would double (Vₛ = Vₚ·Nₛ/Nₚ). In an ideal transformer the current would then halve, since power is conserved (VₚIₚ = VₛIₛ).'},
 {topic:'Waves',o:'A magnifying glass held close to text shows it enlarged.',f:'What if you moved it far beyond the focal length?',r:'Past the focal length the image flips to a real, inverted, smaller image (as in a camera). The same convex lens gives very different images depending on the object distance.'},
 {topic:'Space',o:'Distant galaxies show red shift, growing with distance.',f:'What if they showed blue shift instead?',r:'Blue shift would mean galaxies are approaching — the universe contracting rather than expanding. The observed red shift is key evidence the universe is expanding (the Big Bang).'},
 {topic:'Particle model',o:'A sealed rigid can of gas sits at room temperature.',f:'What if you cooled it close to absolute zero?',r:'The particles slow almost to a stop, hitting the walls rarely and feebly, so the pressure falls toward zero. Pressure tracks particle motion, which tracks temperature.'},
 {topic:'Forces',o:'A spring obeys Hooke\'s law, stretching evenly as load is added.',f:'What if you kept loading it past its elastic limit?',r:'Beyond the elastic limit the extension is no longer proportional to force, and the spring deforms permanently — it will not return to its original length when unloaded.'},
 {topic:'Space',o:'A satellite orbits steadily at a fixed altitude.',f:'What if it slowed down (lost speed)?',r:'With too little sideways speed for that altitude, gravity pulls it into a lower orbit; in low orbits, air drag then removes more energy and the orbit decays — the satellite spirals in and re-enters.'}
);

/* ====================== EDEXCEL GAP-FILL: QUIZ (Socratic) ====================== */
QUIZ.push(
 {mi:miIdx('A steeper distance–time graph means slowing down'),
  q:'On a distance–time graph, what does a steeper line tell you?',
  opts:[{t:'The object is moving faster',c:1},{t:'The object is slowing down',c:0},{t:'The object has stopped',c:0}],
  feels:'"Steep" can feel like "struggling/slowing", and graphs are easy to misread under pressure.',
  soc:['On a distance–time graph, what does the gradient (steepness) represent?',
       'If the gradient is the speed, what does a steeper gradient mean for the speed?',
       'So is a steep line fast or slow — and what would a flat line mean?']},
 {mi:miIdx('Area under a velocity–time graph is the speed'),
  q:'What does the area under a velocity–time graph give you?',
  opts:[{t:'The distance travelled',c:1},{t:'The speed',c:0},{t:'The acceleration',c:0}],
  feels:'Everything is on one graph, so it is easy to mix up what the height, gradient and area each mean.',
  soc:['On a velocity–time graph, where do you read the speed from — the axis or the area?',
       'Distance = speed × time. On the graph, what shape does speed × time make?',
       'So what does adding up that area give you — speed, acceleration, or distance?']},
 {mi:miIdx('Doubling speed doubles the braking distance'),
  q:'A car doubles its speed. Roughly what happens to its braking distance?',
  opts:[{t:'It roughly quadruples',c:1},{t:'It doubles',c:0},{t:'It stays the same',c:0}],
  feels:'Double-and-double feels proportional, so "twice the speed, twice the distance" seems natural.',
  soc:['Braking removes the car\'s kinetic energy. What is the formula for kinetic energy?',
       'If KE depends on v², what happens to it when v doubles?',
       'So if four times the energy must be removed, what happens to the braking distance?']},
 {mi:miIdx('The National Grid uses high current to cut losses'),
  q:'Why does the National Grid transmit power at very high voltage?',
  opts:[{t:'So the current is low, cutting I²R heating losses',c:1},{t:'So more current flows to deliver power',c:0},{t:'High voltage is safer for the cables',c:0}],
  feels:'"More power" sounds like "more current", so high current seems like the efficient choice.',
  soc:['Power lost as heat in a cable is I²R. Which variable should you minimise to reduce it?',
       'For a fixed power (P = VI), if you raise the voltage, what happens to the current?',
       'So does high voltage mean high or low current — and why does that cut the losses?']},
 {mi:miIdx('Transformers work on direct current'),
  q:'A transformer is connected to a steady DC supply. What is its output?',
  opts:[{t:'Nothing — transformers need AC',c:1},{t:'A stepped-up or stepped-down DC voltage',c:0},{t:'The same DC voltage',c:0}],
  feels:'A transformer changes voltage, so it feels like it should change any supply, DC included.',
  soc:['What induces a voltage in the secondary coil — a steady field or a changing one?',
       'Does steady DC in the primary produce a changing magnetic field?',
       'So can a transformer produce an output from DC, and what does it need instead?']},
 {mi:miIdx('Gas pressure is the gas pushing down by its weight'),
  q:'What causes the pressure a gas exerts on its container?',
  opts:[{t:'Particle collisions with the walls in all directions',c:1},{t:'The weight of the gas pressing down',c:0},{t:'The gas trying to escape upward',c:0}],
  feels:'Things usually press down because they are heavy, so it feels like gas does the same.',
  soc:['Does a gas press only on the bottom of its container, or on every wall?',
       'If it pushes equally in all directions, can that be due to weight (which acts only downward)?',
       'So what are the particles doing to the walls to create pressure?']},
 {mi:miIdx('The image in a plane mirror is on the mirror\'s surface'),
  q:'Where does the image you see in a flat mirror actually appear to be?',
  opts:[{t:'As far behind the mirror as you are in front',c:1},{t:'On the surface of the glass',c:0},{t:'Halfway inside the mirror',c:0}],
  feels:'You focus on the shiny surface, so the image seems to sit right there on the glass.',
  soc:['When you step back from a mirror, does your reflection move closer or further away?',
       'If it moves back as you move back, can it be fixed on the glass surface?',
       'So how far behind the mirror does the virtual image appear, compared with your distance in front?']},
 {mi:miIdx('A lens makes light itself bigger'),
  q:'How does a magnifying glass make text look bigger?',
  opts:[{t:'It refracts (bends) the rays so they appear to come from a larger image',c:1},{t:'It enlarges the light itself',c:0},{t:'It adds more light to the text',c:0}],
  feels:'Things look bigger through it, so it feels like the lens must be enlarging the light.',
  soc:['What does a lens physically do to light rays passing through it?',
       'If the rays are bent, where does your eye trace them back to?',
       'So is the light being "made bigger", or redirected to form a larger image?']}
);

/* ====================================================================
   VERSION 6 — AQA RESTORED ALONGSIDE EDEXCEL + DIAGNOSTIC FORM UPGRADE
   - Board-aware spec page (Edexcel ⇄ AQA toggle), AQA spec + practicals
   - Resources for both boards
   - Error log: topic DROPDOWN + typed QUESTION field
   ==================================================================== */

/* ---------- DIAGNOSTIC FORM: topic dropdown + typed question ---------- */
const DIAG_TOPICS=['Key concepts (units / vectors)','Motion','Forces','Energy','Electricity',
 'Magnetism & electromagnetism','Waves','Light & EM spectrum','Particle model',
 'Radioactivity','Space','Pressure & matter','Other'];

function errorForm(mini){
  const p=mini?'m':'';
  const opts=Object.entries(TYPE_META).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('');
  const tops='<option value="">— choose topic —</option>'+DIAG_TOPICS.map(t=>`<option value="${t}">${t}</option>`).join('');
  return `<div class="card">
    ${mini?'':'<div class="row"><div><label class="fld">Date</label><input id="eDate" type="date" value="'+todayISO()+'" disabled></div><div><label class="fld">Paper / source</label><input id="ePaper" placeholder="e.g. Edexcel 1PH0 P1 2022"></div></div>'}
    <div class="row">
      <div><label class="fld">Failure type</label><select id="${p}eType">${opts}</select></div>
      <div><label class="fld">Topic</label><select id="${p}eTopic">${tops}</select></div>
    </div>
    <label class="fld">The question (type or paste it)</label>
    <input id="${p}eQuestion" placeholder="e.g. Calculate the kinetic energy of a 2 kg ball moving at 3 m/s">
    <label class="fld">What actually went wrong (the model you used, before the answer)</label>
    <textarea id="${p}eNote" placeholder="Be honest about what you were thinking — that's the repairable part."></textarea>
    <button class="btn amber sm" onclick="addError(${mini?'true':'false'})">Log this gap</button>
  </div>`;
}
function addError(mini){
  const p=mini?'m':'';
  const type=document.getElementById(p+'eType').value;
  const topicSel=document.getElementById(p+'eTopic');
  const topic=topicSel?topicSel.value:'';
  const question=document.getElementById(p+'eQuestion').value.trim();
  const note=document.getElementById(p+'eNote').value.trim();
  const paper=mini?'':((document.getElementById('ePaper')||{}).value||'').trim();
  if(!question&&!note){return}
  const log=getLog();
  log.unshift({id:uid(),date:todayISO(),type,topic,question,note,paper});
  store.set('errorLog',log);recordActivity();
  document.getElementById(p+'eQuestion').value='';document.getElementById(p+'eNote').value='';
  if(topicSel)topicSel.selectedIndex=0;
  if(!mini&&document.getElementById('ePaper'))document.getElementById('ePaper').value='';
  rerenderTools();
}
function renderLogList(){
  const host=document.getElementById('logList');if(!host)return;
  let log=getLog();if(logFilter!=='all')log=log.filter(e=>e.type===logFilter);
  if(!log.length){host.innerHTML='<p class="empty">No entries yet. Log a gap above — patterns appear after a couple of papers.</p>';return}
  host.innerHTML=log.map(e=>{const m=TYPE_META[e.type];const main=e.question||e.topic||'(untitled)';
    const chip=(e.question&&e.topic)?`<div class="mono" style="font-size:.68rem;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">${esc(e.topic)}</div>`:'';
    return `<div class="srrow">
    <span class="tg" style="background:${m.c}">${m.label}</span>
    <div style="flex:1;min-width:160px">${chip}<div class="cn">${esc(main)}</div>${e.note?`<div class="meta" style="color:var(--ink-soft);white-space:normal;font-family:Inter;font-size:.85rem;margin-top:2px">${esc(e.note)}</div>`:''}</div>
    <span class="meta">${fmtDate(e.date)}${e.paper?' · '+esc(e.paper):''}</span>
    <button class="btn sm ghost" onclick="delError('${e.id}')" aria-label="delete">✕</button>
  </div>`}).join('');
}
/* keep trigger-miss + resurrection compatible with the new shape */
function logTrigMiss(){const it=TRIG[trigIdx];const list=getLog();
  list.unshift({id:uid(),date:todayISO(),type:'trigger',topic:'Trigger gap',question:it.s.slice(0,90),note:'Missed in trigger trainer. '+it.why,paper:'Trigger trainer'});
  store.set('errorLog',list);recordActivity();
  const btn=event.target;btn.textContent='Logged ✓';btn.disabled=true;}
function resurrect(id){const e=getLog().find(x=>x.id===id);if(!e)return;
  const list=getSR();const due=new Date();due.setDate(due.getDate()+1);
  list.push({id:uid(),concept:'Re-solve: '+(e.question||e.topic||'logged gap'),added:todayISO(),idx:0,due:due.toISOString().slice(0,10)});
  store.set('srItems',list);recordActivity();go('dashboard',true);}
/* ---------- AQA (8463) specification + required practicals ---------- */
const AQA_PRAC=[
 ['RP1','Specific heat capacity','Heat a known mass of a material, measure energy supplied and temperature rise to find c.'],
 ['RP2','Thermal insulation (Physics only)','Investigate how the material/thickness of insulation affects the rate of cooling of water.'],
 ['RP3','Resistance','Investigate how resistance depends on the length of a wire, and on series/parallel combinations.'],
 ['RP4','I–V characteristics','Investigate how current varies with potential difference for a resistor, filament lamp and diode.'],
 ['RP5','Density','Determine the densities of regular and irregular solid objects and of liquids.'],
 ['RP6','Force and extension','Investigate the relationship between force and extension for a spring (Hooke\'s law).'],
 ['RP7','Acceleration','Investigate how acceleration depends on force and on mass.'],
 ['RP8','Waves','Measure the frequency, wavelength and speed of waves in a ripple tank and on a string.'],
 ['RP9','Radiation &amp; absorption','Use a Leslie cube to investigate how surface affects infrared radiation emitted/absorbed.'],
 ['RP10','Refraction / lenses (Physics only)','Investigate refraction through glass blocks and image formation by lenses.'],
];
const AQA_SPEC=[
 {id:'aq1',n:1,pap:1,title:'Energy',cp:'RP1',
  pts:['Energy stores, systems and transfers; conservation','Kinetic, gravitational and elastic potential energy','Specific heat capacity (RP1) and power','Efficiency and reducing unwanted transfers','Energy resources: renewable vs non-renewable; the National Grid'],
  study:[['Equation explorer','explorer'],['Concept contrasts','contrast'],['Mental models','models']]},
 {id:'aq2',n:2,pap:1,title:'Electricity',cp:'RP3 · RP4',
  pts:['Current, potential difference and resistance; Ohm\'s law','I–V characteristics (RP4); resistance of a wire (RP3)','LDRs and thermistors','Series and parallel circuits','Mains electricity, AC/DC and the three-pin plug','Electrical power and energy','Static electricity and electric fields (Physics only)'],
  study:[['Equation explorer','explorer'],['Concept contrasts','contrast'],['Misconception fixes','misconceptions'],['Mental models','models']]},
 {id:'aq3',n:3,pap:1,title:'Particle model of matter',cp:'RP5',
  pts:['Density of materials (RP5)','States of matter and changes of state','Internal energy and specific latent heat','Particle motion in gases; gas pressure','Pressure and volume (Physics only, HT)'],
  study:[['Equation explorer','explorer'],['Concept contrasts','contrast'],['Mental models','models']]},
 {id:'aq4',n:4,pap:1,title:'Atomic structure',
  pts:['The atom and the development of the nuclear model; isotopes','Alpha, beta and gamma radiation; properties','Nuclear equations for decay','Half-life and activity; randomness of decay','Contamination vs irradiation; hazards and uses','Background radiation; nuclear fission and fusion (Physics only)'],
  study:[['Concept contrasts','contrast'],['Mental models','models'],['Misconception fixes','misconceptions']]},
 {id:'aq5',n:5,pap:2,title:'Forces',cp:'RP6 · RP7',
  pts:['Scalars and vectors; contact and non-contact forces; weight','Resultant forces and free-body diagrams','Work done and forces &amp; elasticity (Hooke, RP6)','Moments, levers and gears; pressure in fluids (Physics only)','Distance/displacement, speed/velocity, acceleration; motion graphs','Newton\'s laws; acceleration (RP7); stopping distances; momentum (HT)'],
  study:[['Equation explorer','explorer'],['Trigger trainer','trigger'],['Mental models','models'],['Concept contrasts','contrast']]},
 {id:'aq6',n:6,pap:2,title:'Waves',cp:'RP8 · RP9',
  pts:['Transverse and longitudinal waves; properties and v = f λ (RP8)','Reflection, refraction and sound (Physics only)','The electromagnetic spectrum: properties, uses and dangers','Infrared radiation and emission/absorption (RP9)','Black-body radiation and lenses (Physics only)'],
  study:[['Equation explorer','explorer'],['Concept contrasts','contrast'],['Mental models','models']]},
 {id:'aq7',n:7,pap:2,title:'Magnetism &amp; electromagnetism',
  pts:['Permanent and induced magnets; magnetic fields and compasses','Electromagnets and their uses','The motor effect; force F = B I L','Induced potential, transformers and the generator effect (Physics only)'],
  study:[['Mental models','models'],['Trigger trainer','trigger'],['Equation explorer','explorer']]},
 {id:'aq8',n:8,pap:2,triple:true,title:'Space physics (Physics only)',
  pts:['The solar system and orbital motion','The life cycle of stars','Red shift and the expanding universe','The Big Bang theory and its evidence'],
  study:[['Mental models','models'],['Trigger trainer','trigger']]},
];

/* ---------- board-aware spec page ---------- */
let specBoard=((getProfile().board||'').toUpperCase().includes('AQA'))?'aqa':'edexcel';
function setSpecBoard(b){specBoard=b;renderSpec();const t=document.getElementById('specToggle');if(t)t.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x.dataset.b===b));}
function renderSpec(){const host=document.getElementById('specBox');if(!host)return;
  const isA=specBoard==='aqa';
  const data=isA?AQA_SPEC:SPEC, prac=isA?AQA_PRAC:CPRAC;
  const rag=getRAG();const counts={r:0,a:0,g:0,none:0};
  data.forEach(t=>{const v=rag[t.id];if(v)counts[v]++;else counts.none++});
  const p1=isA?data.filter(t=>t.pap===1):data.filter(t=>t.paper.startsWith('Paper 1')||t.paper==='Both papers');
  const p2=isA?data.filter(t=>t.pap===2):data.filter(t=>t.paper.startsWith('Paper 2'));
  const h1=isA?'Paper 1 — Topics 1–4':'Paper 1 — Topics 1–7';
  const s1=isA?'(energy, electricity, particle model, atomic structure)':'(motion, energy, waves, light, radioactivity, astronomy)';
  const h2=isA?'Paper 2 — Topics 5–8':'Paper 2 — Topics 1, 8–15';
  const s2=isA?'(forces, waves, magnetism, space)':'(work, forces, electricity, magnetism, particles, matter)';
  const pracTitle=isA?`AQA required practicals`:`The 8 core practicals`;
  host.innerHTML=`
    <div class="t4" style="margin-bottom:18px">
      <div class="stat"><div class="big" style="color:${RAGC.g}">${counts.g}</div><div class="lbl">green</div></div>
      <div class="stat"><div class="big" style="color:${RAGC.a}">${counts.a}</div><div class="lbl">amber</div></div>
      <div class="stat"><div class="big" style="color:${RAGC.r}">${counts.r}</div><div class="lbl">red</div></div>
      <div class="stat"><div class="big">${counts.none}</div><div class="lbl">untagged</div></div>
    </div>
    <h3 class="blk">${h1} <span class="muted" style="font-weight:400;font-size:.8rem">${s1}</span></h3>
    ${p1.map(specTopicCard).join('')}
    <h3 class="blk">${h2} <span class="muted" style="font-weight:400;font-size:.8rem">${s2}</span></h3>
    ${p2.map(specTopicCard).join('')}
    <h3 class="blk">${pracTitle}</h3>
    <p class="muted" style="margin-top:-4px">Not done in the exam, but tested directly across both papers — methods, variables, results and the physics behind them.</p>
    <div class="card">${prac.map(c=>`<div class="srrow" style="padding:10px 12px;align-items:flex-start;flex-wrap:wrap">
      <span class="tag" style="background:var(--accent-deep)">${c[0]}</span>
      <div style="flex:1;min-width:200px"><div class="cn">${c[1]}</div><div class="muted" style="font-size:.84rem;white-space:normal">${c[2]}</div></div></div>`).join('')}</div>`;
}
SEC.spec=()=>{const isA=specBoard==='aqa';
  return `
  <div class="eyebrow">Specification coverage</div>
  <h2 class="h-sec">Specification coverage</h2>
  <p class="lead">The full GCSE Physics specification for your board — every topic and sub-topic, plus the required practicals. Use it as your master checklist: tag each topic <span style="color:${RAGC.r}">red</span> / <span style="color:${RAGC.a}">amber</span> / <span style="color:${RAGC.g}">green</span>, and jump straight to where each is taught in the app.</p>
  <div id="specToggle" class="boardtoggle" style="margin-bottom:6px">
    <button class="${!isA?'on':''}" data-b="edexcel" onclick="setSpecBoard('edexcel')">Edexcel (1PH0)</button>
    <button class="${isA?'on':''}" data-b="aqa" onclick="setSpecBoard('aqa')">AQA (8463)</button>
  </div>
  <p class="muted" style="font-size:.84rem;margin:0 0 14px">Showing the board set above (your default is from <a onclick="go('welcome')">Welcome &amp; setup</a>). Triple-only topics are flagged — skip them if you sit Combined Science.</p>
  <div id="specBox"></div>`;
};

/* ---------- Resources: BOTH boards ---------- */
SEC.resources=()=>`
  <div class="eyebrow">Reference</div>
  <h2 class="h-sec">Resources</h2>
  <p class="lead">A short backbone — your raw material for the Diagnose phase. Both <strong>Edexcel (1PH0)</strong> and <strong>AQA (8463)</strong> are here; match your board before drilling technique. The physics content throughout this app covers both.</p>
  <div class="grid two">
    <div class="card"><h4 style="margin:0 0 6px">Edexcel — spec &amp; papers</h4><p style="margin:0;font-size:.92rem;color:var(--ink-soft)">The Pearson 1PH0 specification and equations/exam-aid sheet, plus PMT and Save My Exams filtered to Edexcel. Your <a onclick="setSpecBoard('edexcel');go('spec')">Edexcel checklist</a> mirrors the spec.</p></div>
    <div class="card"><h4 style="margin:0 0 6px">AQA — spec &amp; papers</h4><p style="margin:0;font-size:.92rem;color:var(--ink-soft)">The AQA 8463 specification and equation sheet, plus PMT and Save My Exams filtered to AQA. Your <a onclick="setSpecBoard('aqa');go('spec')">AQA checklist</a> mirrors the spec.</p></div>
    <div class="card"><h4 style="margin:0 0 6px">Isaac Physics</h4><p style="margin:0;font-size:.92rem;color:var(--ink-soft)">Board-agnostic problem sets with rising difficulty — excellent for the Apply phase and for stretch beyond either spec.</p></div>
    <div class="card"><h4 style="margin:0 0 6px">Anki</h4><p style="margin:0;font-size:.92rem;color:var(--ink-soft)">For the fact/equation layer of Retain. Pairs with the concept-level <a onclick="go('scheduler')">scheduler</a> here — cards for facts, scheduler for whole problems.</p></div>
  </div>
  <div class="note"><span class="eyebrow">Board differences worth knowing</span>Edexcel splits the content into 15 smaller topics (Topic 1 sits on both papers); AQA uses 8 larger ones. The physics is ~95% shared. Triple/Separate adds Astronomy/Space, static electricity, lenses, thermal radiation and deeper electromagnetic induction — skip those on Combined Science. At least 30% of marks are maths on both boards. All required practicals are tested directly — see <a onclick="go('spec')">spec coverage</a>.</p>
  <div class="divider"></div>
  <p class="muted" style="font-size:.86rem">Everything you log in this app — error entries, scheduled reviews, transfer scenarios, spec confidence tags — is saved in your own browser only. Nothing leaves the page.</p>
`;

/* ====================================================================
   VERSION 7 — ACCOUNTS, FIRST-RUN WIZARD & TEACHER (MASTER) DASHBOARD
   Local, no-backend accounts. Each account's data is namespaced in the
   store. A teacher account sees every account on this device plus any
   student progress snapshots imported via a share code.
   ==================================================================== */

/* ---------- accounts registry ---------- */
function getAccounts(){return store.get('__accounts',[])}
function setAccounts(a){store.set('__accounts',a)}
function activeId(){return store.get('__active',null)}
function currentAccount(){const id=activeId();return getAccounts().find(a=>a.id===id)||null}
function setActive(id){store.set('__active',id)}
function getSnaps(){return store.get('__snaps',[])}
function setSnaps(s){store.set('__snaps',s)}
function createAccount(d){const a=getAccounts();
  const acc={id:uid(),name:(d.name||'Student').trim(),role:d.role||'student',year:d.year||'',board:d.board||'Edexcel (1PH0)',goal:d.goal||'',created:todayISO()};
  a.push(acc);setAccounts(a);return acc;}
function updateAccount(id,patch){const a=getAccounts();const x=a.find(y=>y.id===id);if(x){Object.assign(x,patch);setAccounts(a)}}
function deleteAccount(id){setAccounts(getAccounts().filter(y=>y.id!==id));
  store.rawKeys().filter(k=>k.indexOf('u:'+id+':')===0).forEach(k=>{try{localStorage.removeItem(k)}catch(e){}delete mem[k]});}
function acctRead(id,key,d){return store.rawGet('u:'+id+':'+key,d)}

/* migrate any pre-accounts (un-namespaced) data into the first account */
function migrateLegacy(newId){
  store.rawKeys().filter(k=>k.indexOf('u:')!==0&&!GLOBAL_KEYS.has(k)&&k.indexOf('__')!==0).forEach(k=>{
    try{const v=localStorage.getItem(k);if(v!=null){localStorage.setItem('u:'+newId+':'+k,v);localStorage.removeItem(k)}}catch(e){}
  });
}

/* sync the spec board toggle + profile to the active account */
function syncBoardFromAccount(){const acc=currentAccount();if(acc){if(!getProfile().board)setProfile('board',acc.board);}
  specBoard=((getProfile().board||(acc&&acc.board)||'').toUpperCase().includes('AQA'))?'aqa':'edexcel';}
function switchAccount(id){setActive(id);syncBoardFromAccount();buildNav();go('dashboard');}

/* ---------- first-run wizard ---------- */
const YEARS=['Year 9','Year 10','Year 11','Year 12 / 13 (A-level)','Adult / re-learner'];
const BOARDS=['Edexcel (1PH0)','Edexcel Combined (1SC0)','AQA (8463)','OCR','Other / not sure'];
const GOALS=['Pass','Grade 5','Grade 7','Grade 9 / A*','Deep understanding'];
let wiz={step:0,role:null,name:'',year:'',board:'Edexcel (1PH0)',goal:''};
function showWizard(add){wiz={step:0,role:add?'student':null,name:'',year:'',board:'Edexcel (1PH0)',goal:'',add:!!add};
  let o=document.getElementById('wizard');if(!o){o=document.createElement('div');o.id='wizard';document.body.appendChild(o);}
  o.style.display='flex';renderWizard();}
function hideWizard(){const o=document.getElementById('wizard');if(o)o.style.display='none';}
function wizSet(k,v){wiz[k]=v;renderWizard();}
function wizName(v){wiz.name=v;}
function wizCanNext(){if(wiz.step===0)return!!wiz.role;if(wiz.step===1)return wiz.name.trim().length>0;return true;}
function wizNext(){const nm=document.getElementById('wizNameInput');if(nm)wiz.name=nm.value;
  if(!wizCanNext())return;
  const last=wizLastStep();
  if(wiz.step>=last){finishWizard();return}
  wiz.step++;renderWizard();}
function wizBack(){if(wiz.step>0){wiz.step--;renderWizard()}}
function wizLastStep(){return wiz.role==='teacher'?2:3;} // teacher: role,name,board ; student: role,name,year+board,goal
function finishWizard(){
  const first=!getAccounts().length;
  const acc=createAccount({name:wiz.name,role:wiz.role,year:wiz.year,board:wiz.board,goal:wiz.goal});
  setActive(acc.id);
  if(first)migrateLegacy(acc.id);
  // seed this account's profile
  setProfile('board',wiz.board);
  setProfile('level', wiz.year.indexOf('A-level')>=0?'A-level':(wiz.role==='teacher'?'GCSE':'GCSE'));
  if(wiz.goal)setProfile('goal',wiz.goal);
  syncBoardFromAccount();recordActivity();
  hideWizard();buildNav();
  // land somewhere friendly (not straight into the tutorial)
  go('dashboard');
  showWelcomeToast(acc);
}
function showWelcomeToast(acc){/* gentle nudge to the tour, shown on the dashboard */
  const c=document.getElementById('content');if(!c)return;
  const note=document.createElement('div');note.className='wtoast';
  note.innerHTML=`<div><strong>Welcome, ${esc(acc.name)}.</strong> ${acc.role==='teacher'?'Your <a onclick="go(\'students\')">students dashboard</a> is in the sidebar.':'New here? Take the 90-second tour of how the method works.'}</div>
    <div style="display:flex;gap:8px;flex-shrink:0">${acc.role!=='teacher'?'<button class="btn amber sm" onclick="this.closest(\'.wtoast\').remove();showOnboard()">Take the tour</button>':''}<button class="btn ghost sm" onclick="this.closest('.wtoast').remove()">Dismiss</button></div>`;
  c.prepend(note);
}
function renderWizard(){const o=document.getElementById('wizard');if(!o)return;
  const total=wiz.role==='teacher'?3:4;
  const dots=Array.from({length:total}).map((_,i)=>`<span class="${i===wiz.step?'on':''}"></span>`).join('');
  let body='';
  if(wiz.step===0){
    body=`<div class="weyebrow">Welcome to</div>
      <div class="wbrand"><img src="logo.svg" width="40" height="40" style="border-radius:9px"> Relearning <b>Physics</b></div>
      <p class="wsub">A working method for relearning physics — it diagnoses what's actually wrong, rebuilds the idea, and schedules the comeback. First, who are you?</p>
      <div class="wopts">
        <button class="wbig ${wiz.role==='student'?'sel':''}" onclick="wizSet('role','student')"><span class="wbi">🎓</span><span><strong>I'm a student</strong><small>Learn and track my own progress</small></span></button>
        <button class="wbig ${wiz.role==='teacher'?'sel':''}" onclick="wizSet('role','teacher')"><span class="wbi">🧑‍🏫</span><span><strong>I'm a teacher</strong><small>Create student accounts and see how they're doing</small></span></button>
      </div>`;
  } else if(wiz.step===1){
    body=`<div class="weyebrow">${wiz.role==='teacher'?'Teacher account':'Student account'}</div>
      <h3 class="wh">What's your name?</h3>
      <p class="wsub">This is just a label on this device — it personalises your dashboard.</p>
      <input id="wizNameInput" class="winput" placeholder="${wiz.role==='teacher'?'e.g. Mr Patel':'e.g. Alex'}" value="${esc(wiz.name)}" oninput="wizName(this.value)" onkeydown="if(event.key==='Enter')wizNext()" autofocus>`;
  } else if(wiz.step===2 && wiz.role!=='teacher'){
    body=`<div class="weyebrow">A bit about your course</div>
      <h3 class="wh">Year &amp; exam board</h3>
      <div class="weyebrow" style="margin:14px 0 6px">Year</div>
      <div class="wgrid">${YEARS.map(y=>`<button class="wchip ${wiz.year===y?'sel':''}" onclick="wizSet('year','${y}')">${y}</button>`).join('')}</div>
      <div class="weyebrow" style="margin:16px 0 6px">Exam board</div>
      <div class="wgrid">${BOARDS.map(b=>`<button class="wchip ${wiz.board===b?'sel':''}" onclick="wizSet('board','${b}')">${b}</button>`).join('')}</div>`;
  } else if(wiz.step===2 && wiz.role==='teacher'){
    body=`<div class="weyebrow">Your class</div>
      <h3 class="wh">Default exam board</h3>
      <p class="wsub">The board new student accounts start on. You can change it per student later.</p>
      <div class="wgrid">${BOARDS.map(b=>`<button class="wchip ${wiz.board===b?'sel':''}" onclick="wizSet('board','${b}')">${b}</button>`).join('')}</div>`;
  } else if(wiz.step===3){
    body=`<div class="weyebrow">Last thing</div>
      <h3 class="wh">What are you aiming for?</h3>
      <p class="wsub">This tailors your plan and the tutor's diagnosis. You can change it anytime.</p>
      <div class="wgrid">${GOALS.map(g=>`<button class="wchip ${wiz.goal===g?'sel':''}" onclick="wizSet('goal','${g}')">${g}</button>`).join('')}</div>`;
  }
  const isLast=wiz.step>=wizLastStep();
  o.innerHTML=`<div class="onb-card wizcard">
    <div class="onb-dots">${dots}</div>
    ${body}
    <div class="onb-nav">
      ${wiz.add?`<button class="btn ghost sm" onclick="hideWizard()">Cancel</button>`:`<span></span>`}
      <div style="display:flex;gap:8px">
        ${wiz.step>0?`<button class="btn sm" onclick="wizBack()">Back</button>`:''}
        <button class="btn amber sm" onclick="wizNext()" ${wizCanNext()?'':'disabled style="opacity:.5"'}>${isLast?(wiz.add?'Create account':'Finish setup'):'Next'}</button>
      </div>
    </div></div>`;
  const nm=document.getElementById('wizNameInput');if(nm){nm.focus();nm.setSelectionRange(nm.value.length,nm.value.length);}
}
/* ---------- per-student stats (works for a local account or an imported snapshot) ---------- */
function statGetter(id,source){
  if(source==='snap'){const s=getSnaps().find(x=>x.id===id);return (k,d)=>{const v=s&&s.data?s.data[k]:undefined;return (v===undefined||v===null)?d:v}}
  return (k,d)=>acctRead(id,k,d);
}
function statsFor(getter){
  const log=getter('errorLog',[])||[],sr=getter('srItems',[])||[],rag=getter('specRAG',{})||{},days=getter('activityDays',[])||[];
  const t=todayISO();
  const counts={};Object.keys(TYPE_META).forEach(k=>counts[k]=0);log.forEach(e=>{if(counts[e.type]!=null)counts[e.type]++});
  const dom=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  const due=sr.filter(x=>x.due<=t).length;
  let streak=0,d=new Date();const sset=new Set(days);
  for(;;){const iso=d.toISOString().slice(0,10);if(sset.has(iso)){streak++;d.setDate(d.getDate()-1)}else if(streak===0&&iso===t){d.setDate(d.getDate()-1)}else break;}
  const rags={r:0,a:0,g:0};Object.values(rag).forEach(v=>{if(rags[v]!=null)rags[v]++});
  const m={};log.forEach(e=>{const k=e.topic||'—';m[k]=m[k]||{n:0,concept:0};m[k].n++;if(e.type==='concept')m[k].concept++});
  const weak=Object.entries(m).map(([k,v])=>({topic:k,...v})).sort((a,b)=>b.n-a.n).slice(0,4);
  return {gaps:log.length,counts,dom:(dom&&dom[1]>0)?dom[0]:null,due,streak,rags,last:days.length?days.slice().sort().slice(-1)[0]:null,weak,log,sr};
}

/* ---------- share codes (export / import) ---------- */
function b64enc(s){try{return btoa(unescape(encodeURIComponent(s)))}catch(e){return ''}}
function b64dec(s){try{return decodeURIComponent(escape(atob(s.trim())))}catch(e){return ''}}
function exportProgress(id){const acc=getAccounts().find(a=>a.id===id);if(!acc)return'';
  const data={};store.rawKeys().filter(k=>k.indexOf('u:'+id+':')===0).forEach(k=>{const bare=k.slice(('u:'+id+':').length);try{data[bare]=JSON.parse(localStorage.getItem(k))}catch(e){}});
  return b64enc(JSON.stringify({v:1,meta:{name:acc.name,role:acc.role,year:acc.year,board:acc.board,exported:new Date().toISOString()},data}));
}
function downloadText(name,text){try{const b=new Blob([text],{type:'text/plain'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}catch(e){}}
function copyShare(id){const code=exportProgress(id);const ta=document.getElementById('shareBox');if(ta){ta.value=code;ta.select();try{document.execCommand('copy')}catch(e){}}
  const s=document.getElementById('shareMsg');if(s)s.textContent='Copied — paste it to your teacher, or use Download.';}
function downloadShare(id){const acc=getAccounts().find(a=>a.id===id);downloadText('physics-progress-'+(acc?acc.name.replace(/\s+/g,'-'):'student')+'.txt',exportProgress(id));}
function importSnapshot(){const code=(document.getElementById('importBox')||{}).value||'';const json=b64dec(code);
  const msg=document.getElementById('importMsg');
  if(!json){if(msg)msg.textContent='That code could not be read. Copy the whole thing and try again.';return}
  let obj;try{obj=JSON.parse(json)}catch(e){if(msg){msg.textContent='That code is not valid.';}return}
  if(!obj||!obj.data){if(msg)msg.textContent='That code does not contain progress data.';return}
  const snaps=getSnaps();snaps.unshift({id:uid(),name:(obj.meta&&obj.meta.name)||'Student',year:(obj.meta&&obj.meta.year)||'',board:(obj.meta&&obj.meta.board)||'',importedAt:todayISO(),exported:(obj.meta&&obj.meta.exported)||'',data:obj.data});
  setSnaps(snaps);if(msg)msg.textContent='Imported ✓';go('students',true);
}
function deleteSnap(id){setSnaps(getSnaps().filter(s=>s.id!==id));go('students',true)}

/* ---------- Account page (everyone) ---------- */
SEC.account=()=>{const acc=currentAccount();if(!acc)return'<p class="lead">No account yet.</p>';
  const others=getAccounts().filter(a=>a.id!==acc.id);
  return `
  <div class="eyebrow">You</div>
  <h2 class="h-sec">Account</h2>
  <p class="lead">Your profile on this device. ${acc.role==='teacher'?'As a teacher you can add student accounts and review them in <a onclick="go(\'students\')">My students</a>.':'Switch profiles, update your details, or share your progress with a teacher.'}</p>
  <div class="card">
    <div style="display:flex;align-items:center;gap:14px">
      <span class="acctav big">${esc(acc.name.slice(0,1).toUpperCase())}</span>
      <div><div style="font-weight:700;font-size:1.1rem">${esc(acc.name)}</div>
      <div class="muted" style="font-size:.9rem">${acc.role==='teacher'?'Teacher':esc(acc.year||'Student')}${acc.role!=='teacher'?' · '+esc(acc.board):''}</div></div>
    </div>
    ${acc.role!=='teacher'?`<div class="eyebrow" style="margin:16px 0 6px">Exam board</div>
      <div class="opts" style="flex-direction:row;flex-wrap:wrap">${BOARDS.map(b=>`<button class="opt ${acc.board===b?'sel':''}" style="flex:1;justify-content:center;min-width:130px" onclick="updateAccount('${acc.id}',{board:'${b}'});setProfile('board','${b}');syncBoardFromAccount();go('account',true)">${b}</button>`).join('')}</div>
      <div class="eyebrow" style="margin:16px 0 6px">Goal</div>
      <div class="opts" style="flex-direction:row;flex-wrap:wrap">${GOALS.map(g=>`<button class="opt ${(getProfile().goal)===g?'sel':''}" style="flex:1;justify-content:center;min-width:110px" onclick="setProfile('goal','${g}');updateAccount('${acc.id}',{goal:'${g}'});go('account',true)">${g}</button>`).join('')}</div>`:''}
  </div>

  ${acc.role!=='teacher'?`<div class="card" style="margin-top:14px">
    <h4 style="margin:0 0 4px">Share my progress with a teacher</h4>
    <p class="muted" style="font-size:.9rem;margin:0 0 10px">Copy this code (or download it) and send it to your teacher. It's a private snapshot — they import it to see how you're doing. Re-send any time to update them.</p>
    <textarea id="shareBox" class="winput" style="height:80px;font-family:'IBM Plex Mono';font-size:.7rem" readonly onclick="this.select()">${exportProgress(acc.id)}</textarea>
    <div style="display:flex;gap:8px;margin-top:8px"><button class="btn amber sm" onclick="copyShare('${acc.id}')">Copy code</button><button class="btn sm" onclick="downloadShare('${acc.id}')">Download file</button></div>
    <div id="shareMsg" class="mono" style="font-size:.78rem;color:var(--rest);margin-top:8px"></div>
  </div>`:''}

  <div class="card" style="margin-top:14px">
    <h4 style="margin:0 0 10px">Switch account</h4>
    ${others.length?others.map(a=>`<div class="srrow"><span class="acctav">${esc(a.name.slice(0,1).toUpperCase())}</span>
      <div style="flex:1"><div class="cn">${esc(a.name)}</div><div class="muted" style="font-size:.82rem">${a.role==='teacher'?'Teacher':esc(a.board||'Student')}</div></div>
      <button class="btn sm" onclick="switchAccount('${a.id}')">Switch</button></div>`).join(''):'<p class="muted" style="margin:0">No other accounts on this device yet.</p>'}
    <div style="display:flex;gap:8px;margin-top:12px"><button class="btn amber sm" onclick="showWizard(true)">+ Add an account</button></div>
  </div>

  <div class="card" style="margin-top:14px;border-color:var(--line-soft)">
    <details><summary style="cursor:pointer;color:var(--ink-soft);font-size:.9rem">Remove this account from the device</summary>
    <p class="muted" style="font-size:.86rem;margin:10px 0">This permanently deletes <strong>${esc(acc.name)}</strong> and all its data on this browser. This cannot be undone.</p>
    ${others.length?`<button class="btn sm" style="color:var(--t-concept);border-color:var(--t-concept)" onclick="if(confirm('Delete ${esc(acc.name)} and all their data on this device?')){const o=getAccounts().find(a=>a.id!=='${acc.id}');deleteAccount('${acc.id}');switchAccount(o.id)}">Delete account</button>`:'<p class="muted" style="font-size:.82rem">You can\'t delete the only account. Add another first.</p>'}</details>
  </div>`;
};

/* ---------- Teacher dashboard ---------- */
let stuView=null;
function openStudent(id,source){stuView={id,source};go('students',true)}
function closeStudent(){stuView=null;go('students',true)}
function rosterCard(name,sub,g,onclick,extra){const st=statsFor(g);const dm=st.dom?TYPE_META[st.dom]:null;
  return `<div class="stucard" onclick="${onclick}">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
      <span class="acctav">${esc(name.slice(0,1).toUpperCase())}</span>
      <div style="flex:1"><div style="font-weight:700">${esc(name)}</div><div class="muted" style="font-size:.8rem">${esc(sub)}</div></div>
      ${extra||''}
    </div>
    <div class="stustats">
      <div><span class="ssbig">${st.streak}</span><span class="sslbl">streak</span></div>
      <div><span class="ssbig">${st.gaps}</span><span class="sslbl">gaps</span></div>
      <div><span class="ssbig" style="color:var(--due)">${st.due}</span><span class="sslbl">due</span></div>
      <div><span class="ssbig" style="color:var(--t-slip)">${st.rags.g}</span><span class="sslbl">green</span></div>
    </div>
    ${dm?`<div class="mono" style="font-size:.72rem;color:var(--ink-faint);margin-top:8px">Main gap: <span style="color:${dm.c}">${dm.label}</span>${st.last?' · last active '+fmtDate(st.last):''}</div>`:`<div class="mono" style="font-size:.72rem;color:var(--ink-faint);margin-top:8px">No activity logged yet</div>`}
  </div>`;
}
function studentDetail(){const {id,source}=stuView;const g=statGetter(id,source);const st=statsFor(g);
  let name,sub;
  if(source==='snap'){const s=getSnaps().find(x=>x.id===id);name=s?s.name:'Student';sub=(s&&s.board||'')+(s&&s.exported?' · snapshot from '+fmtDate(s.exported.slice(0,10)):'');}
  else{const a=getAccounts().find(x=>x.id===id);name=a?a.name:'Student';sub=(a&&a.board||'')+(a&&a.year?' · '+a.year:'');}
  const dm=st.dom?TYPE_META[st.dom]:null;
  return `<button class="btn ghost sm" onclick="closeStudent()">‹ All students</button>
    <h2 class="h-sec" style="margin-top:12px">${esc(name)}</h2>
    <p class="lead">${esc(sub)}${source==='local'?` · <a onclick="switchAccount('${id}')">open this account</a>`:''}</p>
    <div class="t4">
      <div class="stat"><div class="big">${st.streak}</div><div class="lbl">day streak</div></div>
      <div class="stat"><div class="big">${st.gaps}</div><div class="lbl">gaps logged</div></div>
      <div class="stat"><div class="big" style="color:var(--due)">${st.due}</div><div class="lbl">reviews due</div></div>
      <div class="stat"><div class="big" style="color:var(--t-slip)">${st.rags.g}</div><div class="lbl">topics green</div></div>
    </div>
    <h3 class="blk">Failure-type breakdown</h3>
    <div class="t4">${Object.entries(TYPE_META).map(([k,v])=>`<div class="stat"><div class="big" style="color:${v.c}">${st.counts[k]||0}</div><div class="lbl">${v.label}</div></div>`).join('')}</div>
    ${dm?`<div class="note"><span class="eyebrow">Dominant pattern</span>Most-logged failure: <strong style="color:${dm.c}">${dm.label}</strong>. ${clusterAdvice(st.dom)}</div>`:''}
    <h3 class="blk">Spec confidence</h3>
    <div class="card" style="display:flex;gap:18px"><div><span class="ssbig" style="color:var(--t-slip)">${st.rags.g}</span> <span class="muted">green</span></div><div><span class="ssbig" style="color:var(--t-trigger)">${st.rags.a}</span> <span class="muted">amber</span></div><div><span class="ssbig" style="color:var(--t-concept)">${st.rags.r}</span> <span class="muted">red</span></div></div>
    <h3 class="blk">Weakest topics</h3>
    ${st.weak.length?`<div class="card">${st.weak.map(w=>`<div class="srrow"><div style="flex:1" class="cn">${esc(w.topic)}</div><span class="meta">${w.n} gap${w.n>1?'s':''}${w.concept?' · '+w.concept+' conceptual':''}</span></div>`).join('')}</div>`:'<p class="muted">No topic gaps logged yet.</p>'}
    <h3 class="blk">Recent gaps</h3>
    ${st.log.length?`<div class="card">${st.log.slice(0,8).map(e=>{const m=TYPE_META[e.type]||{c:'#888',label:e.type};return `<div class="srrow"><span class="tg" style="background:${m.c}">${m.label}</span><div style="flex:1"><div class="cn">${esc(e.question||e.topic||'(untitled)')}</div>${e.note?`<div class="meta" style="white-space:normal;font-family:Inter;font-size:.84rem;color:var(--ink-soft)">${esc(e.note)}</div>`:''}</div><span class="meta">${fmtDate(e.date)}</span></div>`}).join('')}</div>`:'<p class="muted">Nothing logged yet.</p>'}`;
}
SEC.students=()=>{const acc=currentAccount();
  if(!acc||acc.role!=='teacher')return `<h2 class="h-sec">My students</h2><p class="lead">This area is for teacher accounts. <a onclick="go('account')">Switch to a teacher account</a> to use it.</p>`;
  if(stuView)return studentDetail();
  const locals=getAccounts().filter(a=>a.role!=='teacher');
  const snaps=getSnaps();
  return `
  <div class="eyebrow">Teacher</div>
  <h2 class="h-sec">My students</h2>
  <p class="lead">Everyone you're tracking. <strong>Local accounts</strong> live in this browser (good for a shared classroom device). <strong>Imported snapshots</strong> come from a student's share code — that's how you see students working on their own devices.</p>

  <div class="grid two" style="margin-bottom:8px">
    <div class="card"><h4 style="margin:0 0 6px">Add a student on this device</h4><p class="muted" style="font-size:.88rem;margin:0 0 10px">Creates a local account you can hand to a student or use to demo.</p><button class="btn amber sm" onclick="showWizard(true)">+ New student account</button></div>
    <div class="card"><h4 style="margin:0 0 6px">Import a student's progress</h4><p class="muted" style="font-size:.88rem;margin:0 0 8px">Paste the share code a student sent you.</p>
      <textarea id="importBox" class="winput" style="height:60px;font-family:'IBM Plex Mono';font-size:.7rem" placeholder="Paste share code here…"></textarea>
      <div style="display:flex;gap:8px;margin-top:8px"><button class="btn amber sm" onclick="importSnapshot()">Import</button></div>
      <div id="importMsg" class="mono" style="font-size:.78rem;color:var(--rest);margin-top:8px"></div></div>
  </div>

  ${locals.length?`<h3 class="blk">Local accounts (${locals.length})</h3><div class="stugrid">${locals.map(a=>rosterCard(a.name,(a.year?a.year+' · ':'')+a.board,statGetter(a.id,'local'),`openStudent('${a.id}','local')`)).join('')}</div>`:''}
  ${snaps.length?`<h3 class="blk">Imported snapshots (${snaps.length})</h3><div class="stugrid">${snaps.map(s=>rosterCard(s.name,(s.board||'')+' · imported '+fmtDate(s.importedAt),statGetter(s.id,'snap'),`openStudent('${s.id}','snap')`,`<button class="btn ghost sm" onclick="event.stopPropagation();deleteSnap('${s.id}')" aria-label="remove">✕</button>`)).join('')}</div>`:''}
  ${!locals.length&&!snaps.length?'<div class="note"><span class="eyebrow">No students yet</span>Add a local account above, or ask a student to open <strong>Account → Share my progress</strong> and send you the code.</p>':''}
  <div class="note" style="margin-top:18px"><span class="eyebrow">How syncing works</span>This app has no server, so a teacher and a student on <em>different devices</em> aren't connected live. Snapshots are the bridge: the student sends a code whenever they want you to see their latest progress. For automatic, live class tracking you'd host a backend — ask and I'll explain that path.</p>`;
};

/* ---------- nav: account switcher + teacher-only items ---------- */
function buildNav(){const acc=currentAccount();
  const bar=acc?`<button class="acctbar" onclick="go('account')">
    <span class="acctav">${esc((acc.name||'?').slice(0,1).toUpperCase())}</span>
    <span class="acctmeta"><span class="acctname">${esc(acc.name)}</span><span class="acctrole">${acc.role==='teacher'?'Teacher':esc(acc.board||'Student')}</span></span>
    <span class="acctcaret">⌄</span></button>`:'';
  const items=NAV.filter(x=>!(x.teacherOnly&&(!acc||acc.role!=='teacher'))&&!(x.grp==='Teacher'&&(!acc||acc.role!=='teacher')));
  document.getElementById('nav').innerHTML=bar+items.map(x=>x.grp
    ?`<div class="grp">${x.grp}</div>`
    :`<a data-id="${x.id}" onclick="go('${x.id}')"><span class="n">${x.n}</span>${x.t}</a>`).join('');
  document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.id===current));
}

/* ====================================================================
   VERSION 8 — SUPABASE: login, cloud-synced store, teacher provisioning
   Replaces the local-account model with real auth. Each signed-in user's
   data lives in the `progress` table; a cache keeps the app instant/offline.
   ==================================================================== */

/* ========== CONFIG — your two values (already filled in) ========== */
/* If the publishable key below is ever truncated/wrong, replace this one line
   with the full value from Supabase → Settings → API Keys → Publishable key. */
const SB_URL = 'https://gofxdyxmbyrtmvvmjzfd.supabase.co';
const SB_KEY = 'sb_publishable_UtlY7EQXHRuFyweHzfs7hw_VzeI25Rc';
const SB_DOMAIN = '@revision.local';   // usernames map to username@revision.local
/* ================================================================== */

const sb = (window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(SB_URL, SB_KEY, { auth:{ persistSession:true, autoRefreshToken:true } })
  : null;

let SBUSER=null, SBPROFILE=null, CACHE={}, _dirty={}, _flushT=null;

/* ---------- cloud-synced store (overrides the local one) ---------- */
store.get = (k,d)=> (k in CACHE) ? CACHE[k] : d;
store.set = (k,v)=>{ CACHE[k]=v; _dirty[k]=true; backupLocal(); scheduleFlush(); };
store.del = (k)=>{ delete CACHE[k]; backupLocal(); if(sb&&SBUSER) sb.from('progress').delete().eq('user_id',SBUSER.id).eq('key',k); };
function backupLocal(){ try{ if(SBUSER) localStorage.setItem('cache:'+SBUSER.id, JSON.stringify(CACHE)); }catch(e){} }
function scheduleFlush(){ clearTimeout(_flushT); _flushT=setTimeout(flushWrites,700); }
async function flushWrites(){
  if(!sb||!SBUSER) return;
  const keys=Object.keys(_dirty); if(!keys.length) return;
  const rows=keys.map(k=>({ user_id:SBUSER.id, key:k, value:CACHE[k], updated_at:new Date().toISOString() }));
  _dirty={};
  try{ const {error}=await sb.from('progress').upsert(rows,{onConflict:'user_id,key'}); if(error) keys.forEach(k=>_dirty[k]=true); }
  catch(e){ keys.forEach(k=>_dirty[k]=true); }
}
window.addEventListener('beforeunload', ()=>{ try{ flushWrites(); }catch(e){} });
setInterval(()=>{ if(Object.keys(_dirty).length) flushWrites(); }, 5000); // safety flush

async function hydrateStore(){
  CACHE={};
  try{
    const {data,error}=await sb.from('progress').select('key,value').eq('user_id',SBUSER.id);
    if(!error&&data) data.forEach(r=>{ CACHE[r.key]=r.value; });
  }catch(e){}
  // merge any offline backup that hasn't synced
  try{ const off=JSON.parse(localStorage.getItem('cache:'+SBUSER.id)||'{}'); for(const k in off){ if(!(k in CACHE)) CACHE[k]=off[k]; } }catch(e){}
  // reflect the profile's board into the app's profile blob
  const prof=store.get('profile',{level:null,goal:null});
  if(SBPROFILE&&SBPROFILE.board&&!prof.board){ prof.board=SBPROFILE.board; CACHE.profile=prof; }
}

/* ---------- identity (overrides local currentAccount) ---------- */
function currentAccount(){ return SBPROFILE ? {id:SBPROFILE.id,name:SBPROFILE.name||'You',role:SBPROFILE.role,board:SBPROFILE.board||''} : null; }
async function sbLoadProfile(){
  try{ const {data}=await sb.from('profiles').select('*').eq('id',SBUSER.id).single(); SBPROFILE=data; }catch(e){}
  if(!SBPROFILE) SBPROFILE={ id:SBUSER.id, name:(SBUSER.email||'You').split('@')[0], role:'student', board:null, class_id:null };
}

/* ---------- auth boot ---------- */
async function initApp(){
  if(!sb){ document.getElementById('content').innerHTML='<div class="wrap" style="padding:40px"><h2>Connection not configured</h2><p class="lead">The Supabase client did not load. Check that the supabase-js script tag is present in index.html and that SB_URL / SB_KEY are set.</p></div>'; return; }
  try{
    const {data:{session}}=await sb.auth.getSession();
    if(session&&session.user){ await onLogin(session.user); } else { showLogin(); }
  }catch(e){ showLogin(); }
  sb.auth.onAuthStateChange((event)=>{ if(event==='SIGNED_OUT'){ location.reload(); } });
}
async function onLogin(user){
  SBUSER=user;
  await sbLoadProfile();
  await hydrateStore();
  try{ syncBoardFromAccount(); }catch(e){}
  recordActivity();            // mark today active (syncs)
  hideLogin();
  buildNav();
  const start=(location.hash||'').replace('#','');
  go(SEC[start]?start:'dashboard');
}
async function doLogout(){ try{ await flushWrites(); }catch(e){} try{ await sb.auth.signOut(); }catch(e){} location.reload(); }

/* ---------- login screen ---------- */
function showLogin(){
  let o=document.getElementById('login'); if(!o){ o=document.createElement('div'); o.id='login'; document.body.appendChild(o); }
  o.style.display='flex';
  o.innerHTML=`<div class="onb-card wizcard" style="max-width:420px">
    <div class="wbrand"><img src="logo.svg" width="38" height="38" style="border-radius:9px"> Relearning <b>Physics</b></div>
    <p class="wsub">Sign in to continue. Students: use the username and password your teacher gave you.</p>
    <label class="weyebrow">Username</label>
    <input id="liUser" class="winput" autocomplete="username" placeholder="username" onkeydown="if(event.key==='Enter')document.getElementById('liPass').focus()">
    <label class="weyebrow" style="margin-top:12px;display:block">Password</label>
    <input id="liPass" class="winput" type="password" autocomplete="current-password" placeholder="password" onkeydown="if(event.key==='Enter')doLogin()">
    <div id="liErr" style="color:var(--t-concept);font-size:.85rem;min-height:18px;margin:10px 0 0"></div>
    <button class="btn amber" style="width:100%;margin-top:6px;justify-content:center" id="liBtn" onclick="doLogin()">Sign in</button>
  </div>`;
  setTimeout(()=>{ const u=document.getElementById('liUser'); if(u) u.focus(); },50);
}
function hideLogin(){ const o=document.getElementById('login'); if(o) o.style.display='none'; }
async function doLogin(){
  const u=(document.getElementById('liUser').value||'').toLowerCase().trim();
  const p=document.getElementById('liPass').value||'';
  const err=document.getElementById('liErr'), btn=document.getElementById('liBtn');
  if(!u||!p){ err.textContent='Enter your username and password.'; return; }
  btn.textContent='Signing in…'; btn.disabled=true; err.textContent='';
  try{
    const {data,error}=await sb.auth.signInWithPassword({ email:u+SB_DOMAIN, password:p });
    if(error){ err.textContent=error.message; btn.textContent='Sign in'; btn.disabled=false; return; }
    await onLogin(data.user);
  }catch(e){ err.textContent='Could not sign in. Check your connection.'; btn.textContent='Sign in'; btn.disabled=false; }
}
/* ---------- Account page ---------- */
async function updateMyBoard(b){ setProfile('board',b); try{ await sb.from('profiles').update({board:b}).eq('id',SBUSER.id); }catch(e){} try{syncBoardFromAccount();}catch(e){} go('account',true); }
SEC.account=()=>{ const a=currentAccount(); if(!a) return '<p class="lead">Not signed in.</p>';
  return `
  <div class="eyebrow">You</div>
  <h2 class="h-sec">Account</h2>
  <p class="lead">Signed in as <strong>${esc(a.name)}</strong>${a.role==='teacher'?' · teacher':''}. Your progress saves to the cloud automatically, so it follows you to any device you sign in on.</p>
  <div class="card">
    <div style="display:flex;align-items:center;gap:14px">
      <span class="acctav big">${esc((a.name||'?').slice(0,1).toUpperCase())}</span>
      <div><div style="font-weight:700;font-size:1.1rem">${esc(a.name)}</div>
        <div class="muted" style="font-size:.9rem">${a.role==='teacher'?'Teacher account':esc(a.board||'Student')}</div></div>
    </div>
    ${a.role!=='teacher'?`<div class="eyebrow" style="margin:16px 0 6px">Exam board</div>
      <div class="opts" style="flex-direction:row;flex-wrap:wrap">${BOARDS.map(b=>`<button class="opt ${a.board===b?'sel':''}" style="flex:1;justify-content:center;min-width:130px" onclick="updateMyBoard('${b}')">${b}</button>`).join('')}</div>
      <div class="eyebrow" style="margin:16px 0 6px">Goal</div>
      <div class="opts" style="flex-direction:row;flex-wrap:wrap">${GOALS.map(g=>`<button class="opt ${(getProfile().goal)===g?'sel':''}" style="flex:1;justify-content:center;min-width:110px" onclick="setProfile('goal','${g}');go('account',true)">${g}</button>`).join('')}</div>`:`<p class="muted" style="margin-top:14px">Manage your class from <a onclick="go('students')">My students</a>.</p>`}
  </div>
  <div class="card" style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
    <div><strong>Sign out</strong><div class="muted" style="font-size:.88rem">Your work is saved to the cloud.</div></div>
    <button class="btn" onclick="doLogout()">Sign out</button>
  </div>`;
};

/* ---------- teacher: create a student via the Edge Function ---------- */
async function createStudent(){
  const u=(document.getElementById('csUser').value||'').toLowerCase().trim();
  const p=document.getElementById('csPass').value||'';
  const b=document.getElementById('csBoard').value||'';
  const msg=document.getElementById('csMsg');
  if(!u||!p){ msg.style.color='var(--t-concept)'; msg.textContent='Enter a username and password.'; return; }
  if(p.length<6){ msg.style.color='var(--t-concept)'; msg.textContent='Password must be at least 6 characters.'; return; }
  msg.style.color='var(--ink-soft)'; msg.textContent='Creating…';
  try{
    const {data:{session}}=await sb.auth.getSession();
    const res=await fetch(SB_URL+'/functions/v1/create-student',{
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+session.access_token, 'apikey':SB_KEY },
      body:JSON.stringify({ username:u, password:p, board:b })
    });
    const out=await res.json();
    if(!res.ok){ msg.style.color='var(--t-concept)'; msg.textContent=out.error||('Failed ('+res.status+')'); return; }
    msg.style.color='var(--t-slip)'; msg.textContent='Created ✓  '+u+' can now sign in.';
    document.getElementById('csUser').value=''; document.getElementById('csPass').value='';
    loadRoster();
  }catch(e){ msg.style.color='var(--t-concept)'; msg.textContent='Network error contacting the function.'; }
}

/* ---------- teacher dashboard (data from Supabase) ---------- */
let ROSTER=null, stuView2=null;
async function loadRoster(){
  const host=document.getElementById('rosterBox'); if(!host) return;
  host.innerHTML='<p class="muted">Loading your students…</p>';
  try{
    const {data:profs,error}=await sb.from('profiles').select('*').eq('class_id',SBPROFILE.class_id||'__none__');
    if(error) throw error;
    const students=(profs||[]).filter(p=>p.role==='student');
    const ids=students.map(s=>s.id);
    let prog=[];
    if(ids.length){ const {data}=await sb.from('progress').select('user_id,key,value').in('user_id',ids); prog=data||[]; }
    const byUser={}; prog.forEach(r=>{ (byUser[r.user_id]=byUser[r.user_id]||{})[r.key]=r.value; });
    ROSTER=students.map(s=>({ profile:s, data:byUser[s.id]||{} }));
    renderRoster();
  }catch(e){ host.innerHTML='<div class="note"><span class="eyebrow">Could not load students</span>'+esc(String(e.message||e))+'</p>'; }
}
function getterFor(rec){ return (k,d)=> (k in rec.data) ? rec.data[k] : d; }
function renderRoster(){
  const host=document.getElementById('rosterBox'); if(!host) return;
  if(stuView2){ host.innerHTML=studentDetail2(stuView2); return; }
  if(!ROSTER||!ROSTER.length){ host.innerHTML='<div class="note"><span class="eyebrow">No students yet</span>Create one above — they sign in with the username and password you set, on any device.</p>'; return; }
  host.innerHTML=`<div class="stugrid">${ROSTER.map((rec,i)=>{ const st=statsFor(getterFor(rec)); const dm=st.dom?TYPE_META[st.dom]:null; const name=rec.profile.name||'Student';
    return `<div class="stucard" onclick="openStu2(${i})">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <span class="acctav">${esc(name.slice(0,1).toUpperCase())}</span>
        <div style="flex:1"><div style="font-weight:700">${esc(name)}</div><div class="muted" style="font-size:.8rem">${esc(rec.profile.board||'—')}</div></div>
      </div>
      <div class="stustats">
        <div><span class="ssbig">${st.streak}</span><span class="sslbl">streak</span></div>
        <div><span class="ssbig">${st.gaps}</span><span class="sslbl">gaps</span></div>
        <div><span class="ssbig" style="color:var(--due)">${st.due}</span><span class="sslbl">due</span></div>
        <div><span class="ssbig" style="color:var(--t-slip)">${st.rags.g}</span><span class="sslbl">green</span></div>
      </div>
      ${dm?`<div class="mono" style="font-size:.72rem;color:var(--ink-faint);margin-top:8px">Main gap: <span style="color:${dm.c}">${dm.label}</span>${st.last?' · '+fmtDate(st.last):''}</div>`:'<div class="mono" style="font-size:.72rem;color:var(--ink-faint);margin-top:8px">No activity yet</div>'}
    </div>`; }).join('')}</div>`;
}
function openStu2(i){ stuView2=ROSTER[i]; renderRoster(); }
function closeStu2(){ stuView2=null; renderRoster(); }
function studentDetail2(rec){ const g=getterFor(rec); const st=statsFor(g); const name=rec.profile.name||'Student'; const dm=st.dom?TYPE_META[st.dom]:null;
  return `<button class="btn ghost sm" onclick="closeStu2()">‹ All students</button>
    <h2 class="h-sec" style="margin-top:12px">${esc(name)}</h2>
    <p class="lead">${esc(rec.profile.board||'')}</p>
    <div class="t4">
      <div class="stat"><div class="big">${st.streak}</div><div class="lbl">day streak</div></div>
      <div class="stat"><div class="big">${st.gaps}</div><div class="lbl">gaps logged</div></div>
      <div class="stat"><div class="big" style="color:var(--due)">${st.due}</div><div class="lbl">reviews due</div></div>
      <div class="stat"><div class="big" style="color:var(--t-slip)">${st.rags.g}</div><div class="lbl">topics green</div></div>
    </div>
    <h3 class="blk">Failure-type breakdown</h3>
    <div class="t4">${Object.entries(TYPE_META).map(([k,v])=>`<div class="stat"><div class="big" style="color:${v.c}">${st.counts[k]||0}</div><div class="lbl">${v.label}</div></div>`).join('')}</div>
    ${dm?`<div class="note"><span class="eyebrow">Dominant pattern</span>Most-logged: <strong style="color:${dm.c}">${dm.label}</strong>. ${clusterAdvice(st.dom)}</div>`:''}
    <h3 class="blk">Spec confidence</h3>
    <div class="card" style="display:flex;gap:18px"><div><span class="ssbig" style="color:var(--t-slip)">${st.rags.g}</span> <span class="muted">green</span></div><div><span class="ssbig" style="color:var(--t-trigger)">${st.rags.a}</span> <span class="muted">amber</span></div><div><span class="ssbig" style="color:var(--t-concept)">${st.rags.r}</span> <span class="muted">red</span></div></div>
    <h3 class="blk">Weakest topics</h3>
    ${st.weak.length?`<div class="card">${st.weak.map(w=>`<div class="srrow"><div style="flex:1" class="cn">${esc(w.topic)}</div><span class="meta">${w.n} gap${w.n>1?'s':''}${w.concept?' · '+w.concept+' conceptual':''}</span></div>`).join('')}</div>`:'<p class="muted">No topic gaps logged yet.</p>'}
    <h3 class="blk">Recent gaps</h3>
    ${st.log.length?`<div class="card">${st.log.slice(0,8).map(e=>{const m=TYPE_META[e.type]||{c:'#888',label:e.type};return `<div class="srrow"><span class="tg" style="background:${m.c}">${m.label}</span><div style="flex:1"><div class="cn">${esc(e.question||e.topic||'(untitled)')}</div>${e.note?`<div class="meta" style="white-space:normal;font-family:Inter;font-size:.84rem;color:var(--ink-soft)">${esc(e.note)}</div>`:''}</div><span class="meta">${fmtDate(e.date)}</span></div>`}).join('')}</div>`:'<p class="muted">Nothing logged yet.</p>'}`;
}
SEC.students=()=>{ const a=currentAccount();
  if(!a||a.role!=='teacher') return `<h2 class="h-sec">My students</h2><p class="lead">This area is for the teacher account.</p>`;
  stuView2=null;
  return `
  <div class="eyebrow">Teacher</div>
  <h2 class="h-sec">My students</h2>
  <p class="lead">Everyone in your class, syncing live. Create a login for each student below — they sign in on their own device and their progress appears here automatically.</p>
  <div class="card">
    <h4 style="margin:0 0 8px">Create a student login</h4>
    <div class="row">
      <div><label class="fld">Username</label><input id="csUser" placeholder="e.g. alex"></div>
      <div><label class="fld">Password</label><input id="csPass" placeholder="at least 6 characters"></div>
    </div>
    <label class="fld">Exam board</label>
    <select id="csBoard">${BOARDS.map(b=>`<option value="${b}">${b}</option>`).join('')}</select>
    <div style="margin-top:10px"><button class="btn amber sm" onclick="createStudent()">Create login</button></div>
    <div id="csMsg" class="mono" style="font-size:.8rem;margin-top:10px;min-height:18px"></div>
  </div>
  <h3 class="blk">Class roster</h3>
  <div id="rosterBox"></div>`;
};

/* ============ render engine ============ */
let current='overview';
function fillHosts(){
  document.querySelectorAll('[data-acc="loopworked"]').forEach(h=>h.innerHTML=workedLoop());
  document.querySelectorAll('[data-tool="errorlog-mini"]').forEach(h=>{h.innerHTML=errorForm(true)+'<div id="mLogList" style="margin-top:10px"></div>'});
  document.querySelectorAll('[data-tool="scheduler-mini"]').forEach(h=>{h.innerHTML=srForm(true)+'<div id="mSrList" style="margin-top:12px"></div>'});
  document.querySelectorAll('[data-tool="transfer-mini"]').forEach(h=>{h.innerHTML=transferForm(true)});
  rerenderTools();
}
function rerenderTools(){
  const ls=document.getElementById('logStats');if(ls)ls.innerHTML=logStats();
  if(document.getElementById('logList'))renderLogList();
  const ml=document.getElementById('mLogList');
  if(ml){const log=getLog().slice(0,3);ml.innerHTML=log.length?log.map(e=>{const m=TYPE_META[e.type];return `<div class="srrow" style="padding:8px 12px"><span class="tg" style="background:${m.c}">${m.label}</span><span class="cn" style="font-size:.9rem">${esc(e.topic)}</span><span class="meta">${fmtDate(e.date)}</span></div>`}).join('')+`<p class="muted" style="font-size:.8rem;margin:8px 0 0">Full log & clusters → <a onclick="go('errorlog')">Error log</a></p>`:'<p class="empty" style="font-size:.85rem">Logged gaps appear here.</p>'}
  if(document.getElementById('srList'))renderSRList(document.getElementById('srList'),false);
  if(document.getElementById('mSrList'))renderSRList(document.getElementById('mSrList'),true);
  if(document.getElementById('tfList'))renderTransferList();
}
function buildNav(){const acc=currentAccount();
  const bar=acc?`<button class="acctbar" onclick="go('account')">
    <span class="acctav">${esc((acc.name||'?').slice(0,1).toUpperCase())}</span>
    <span class="acctmeta"><span class="acctname">${esc(acc.name)}</span><span class="acctrole">${acc.role==='teacher'?'Teacher':esc(acc.board||'Student')}</span></span>
    <span class="acctcaret">⌄</span></button>`:'';
  const items=NAV.filter(x=>!(x.teacherOnly&&(!acc||acc.role!=='teacher'))&&!(x.grp==='Teacher'&&(!acc||acc.role!=='teacher')));
  document.getElementById('nav').innerHTML=bar+items.map(x=>x.grp
    ?`<div class="grp">${x.grp}</div>`
    :`<a data-id="${x.id}" onclick="go('${x.id}')"><span class="n">${x.n}</span>${x.t}</a>`).join('');
  document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.id===current));
}
function go(id,noscroll){
  if(!SEC[id])return;current=id;
  if(id!=='students'){stuView=null}
  stopSandbox();
  if(id==='lens')lensPick=null;
  document.getElementById('content').innerHTML=`<section class="on">${helpBanner(id)}${SEC[id]()}</section>`;
  document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.id===id));
  fillHosts();
  if(id==='test'){feynI=0}
  if(id==='trigger'){trigIdx=0;trigPicked=new Set();trigDone=false;trigScore={r:0,t:0};renderTrig()}
  if(id==='miscquiz'){qIdx=0;qDone=false;qPicked=-1;qScore={r:0,t:0};renderQuiz()}
  if(id==='explorer'){loadEx();renderEx()}
  if(id==='counterfactual'){cfIdx=0;cfShown=false;renderCF()}
  if(id==='sandbox'){requestAnimationFrame(startSandbox)}
  if(id==='contrast'){contIdx=0;renderContrast()}
  if(id==='models'){renderModels()}
  if(id==='spec'){renderSpec()}
  if(id==='students'){loadRoster()}
  if(window.innerWidth<=860){document.getElementById('side').classList.remove('show');document.getElementById('scrim').classList.remove('show')}
  if(!noscroll)window.scrollTo({top:0,behavior:'instant'in window?'instant':'auto'});
  try{history.replaceState(null,'','#'+id)}catch(e){}
}
function toggleNav(){document.getElementById('side').classList.toggle('show');document.getElementById('scrim').classList.toggle('show')}

/* ============ init ============ */
/* boot via Supabase auth */
initApp();
