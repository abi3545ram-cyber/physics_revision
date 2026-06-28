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
  store.set('srItems',list);document.getElementById(p+'srInput').value='';logAction('practice');rerenderTools();
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
  store.set('transferNotes',list);logAction('apply');document.getElementById(p+'tExpl').value='';rerenderTools();
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

/* ---- activity tracking (powers streaks + dashboard) ----
   A day only counts toward the streak once EVERY item on today's plan is
   genuinely done. Plan items tick from real actions (logged below), never
   from merely opening a page. */
function todayActions(){const m=store.get('actionLog',{});return m[todayISO()]||[]}
function logAction(key){
  const m=store.get('actionLog',{});const t=todayISO();const a=m[t]||[];
  if(!a.includes(key)){a.push(key);m[t]=a;store.set('actionLog',m)}
  tryCompleteDay();
}
function planComplete(){const b=todayPlan();return b.length>0&&b.every(x=>x.done)}
function tryCompleteDay(){
  if(!planComplete())return;
  const days=store.get('activityDays',[]);const t=todayISO();
  if(!days.includes(t)){days.push(t);store.set('activityDays',days)}
}
/* recordActivity now just re-checks whether today's plan is fully complete;
   it no longer marks the day active on its own. */
function recordActivity(){tryCompleteDay()}
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
  trigDone=true;trigScore.t++;if(correct)trigScore.r++;logAction('practice');renderTrig();}
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
  if(QUIZ[qIdx].opts[i].c)qScore.r++;logAction('practice');renderQuiz();}
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
function exPredict(i){exPredPick=i;exPredicted=true;logAction('practice');renderEx();}
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
    ${cfShown?`<div class="note"><span class="eyebrow">The physics</span>${c.r}</div>`:`<button class="btn amber" onclick="cfShown=true;renderCF();logAction('apply')">Reveal the physics</button>`}
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
  store.set('srItems',list);logAction('practice');rerenderTools();}
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
  const blocks=[];const due=dueCount();const dom=dominantType();const log=getLog();
  const today=todayISO();const acts=todayActions();
  const hasLens=(typeof CURTOOLS!=='undefined')&&CURTOOLS.indexOf('lens')>=0;
  if(due>0)blocks.push({key:'reviews',m:10,t:`Clear ${due} due review${due>1?'s':''}`,d:'Overdue retrieval decays fastest — always first.',to:'scheduler'});
  if(!log.length){blocks.push({key:'diagnose',m:20,t:'Log a diagnostic paper section',d:'Sort every miss by failure type so the app can start coaching you.',to:'diagnose'});}
  else if(dom==='concept')blocks.push({key:'practice',m:15,t:'Hunt a misconception',d:'Your dominant gap is a broken model. Rebuild it actively.',to:'miscquiz'});
  else if(dom==='trigger')blocks.push({key:'practice',m:15,t:'Trigger recognition drills',d:'Train spotting which model a situation needs.',to:'trigger'});
  else if(dom==='recall')blocks.push({key:'practice',m:10,t:'Schedule & recall weak facts',d:'Push the missing facts into spaced retrieval.',to:'scheduler'});
  else if(dom==='slip')blocks.push({key:'practice',m:10,t:'Re-mark for slips, build a checklist',d:'Fix execution, not theory.',to:'diagnose'});
  else if(dom==='comp')blocks.push({key:'practice',m:10,t:'Command-word & vocabulary drill',d:'Make the questions decode instantly.',to:'misconceptions'});
  else blocks.push({key:'practice',m:15,t:'Pick any practice module',d:'No dominant weakness yet — generate some signal.',to:'trigger'});
  blocks.push({key:'apply',m:10,t:'One application or counterfactual',d:'Use a concept outside an exam question — that\'s where understanding shows.',to:'counterfactual'});
  if(hasLens)blocks.push({key:'lens',m:5,t:'Daily lens — explain one real thing',d:'Keep the transfer habit and the streak alive.',to:'lens'});
  /* done-state comes only from real, performed actions */
  blocks.forEach(b=>{
    if(b.key==='reviews')b.done=(dueCount()===0);
    else if(b.key==='diagnose')b.done=log.some(e=>e.date===today);
    else if(b.key==='lens')b.done=getLens().some(x=>x.date===today);
    else b.done=acts.indexOf(b.key)>=0; // practice / apply
  });
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
  const doneN=blocks.filter(b=>b.done).length;const allDone=blocks.length>0&&doneN===blocks.length;
  const rx=dom?PRESCRIPTION[dom]:null;const report=buildReport();const f=forgettingForecast();const p=getProfile();
  return `
  <div class="eyebrow">Start here · your tutor</div>
  <h2 class="h-sec">Today's plan</h2>
  <p class="lead">${p.goal?`Goal: <strong>${esc(p.goal)}</strong>${p.level?` · ${esc(p.level)}`:''}. `:''}A real tutor never makes you decide what to study. This page reads your data and lays out today's session — in order, time-boxed, each block one tap from the right tool.</p>

  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
      <div class="eyebrow">Today's session</div><span class="mono" style="font-size:.78rem;color:var(--ink-faint)">≈ ${total} min</span></div>
    ${blocks.map((b,i)=>`<div class="planrow${b.done?' done':''}" onclick="go('${b.to}')">
      <span class="plan-chk${b.done?' on':''}" title="${b.done?'Done':'Do this to tick it off'}">${b.done?'✓':''}</span>
      <div style="flex:1"><div style="font-weight:600">${b.t} <span class="mono" style="font-size:.72rem;color:var(--ink-faint)">· ${b.m} min</span></div>
        <div class="muted" style="font-size:.85rem">${b.d}</div></div>
      <span class="arrow">›</span></div>`).join('')}
    <div class="plan-status ${allDone?'done':''}">${allDone
      ? `<strong>✓ Plan complete</strong> — today counts toward your streak. 🔥`
      : `<strong>${doneN} / ${blocks.length} done.</strong> Items tick automatically once you actually do them — finish all of them to keep your streak.`}</div>
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
    <button class="${!isA?'on':''}" data-b="edexcel" onclick="setSpecBoard('edexcel')">${CUR_EDX}</button>
    <button class="${isA?'on':''}" data-b="aqa" onclick="setSpecBoard('aqa')">${CUR_AQA}</button>
  </div>
  <p class="muted" style="font-size:.84rem;margin:0 0 14px">Showing the board set above (your default is from <a onclick="go('welcome')">Welcome &amp; setup</a>). Triple-only topics are flagged — skip them if you sit Combined Science.</p>
  <div id="specBox"></div>`;
};

/* ---------- Resources: BOTH boards ---------- */
SEC.resources=()=>`
  <div class="eyebrow">Reference</div>
  <h2 class="h-sec">Resources</h2>
  <p class="lead">A short backbone — your raw material for the Diagnose phase. Both <strong>${CUR_EDX}</strong> and <strong>${CUR_AQA}</strong> are here; match your board before drilling technique. The content throughout this app covers both.</p>
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
  try{const bb=document.querySelector('.brand b'); if(bb&&typeof SUBJECTS!=='undefined'&&SUBJECTS[CURSUBJ]) bb.textContent=SUBJECTS[CURSUBJ].name;}catch(e){}
  const bar=acc?`<button class="acctbar" onclick="go('account')">
    <span class="acctav">${esc((acc.name||'?').slice(0,1).toUpperCase())}</span>
    <span class="acctmeta"><span class="acctname">${esc(acc.name)}</span><span class="acctrole">${acc.role==='teacher'?'Teacher':esc(acc.board||'Student')}</span></span>
    <span class="acctcaret">⌄</span></button>`:'';
  let subjBar='';
  try{ if(typeof SUBJECTS!=='undefined') subjBar='<div class="subjbar">'+Object.keys(SUBJECTS).map(id=>`<button class="subjbtn ${id===CURSUBJ?'on':''}" onclick="switchSubject('${id}')">${SUBJECTS[id].name}</button>`).join('')+'</div>'; }catch(e){}
  const tools=(typeof CURTOOLS!=='undefined')?CURTOOLS:null;
  const TOGGLE=new Set(['trigger','miscquiz','explorer','counterfactual','sandbox','misconceptions','contrast','models','analogies','conceptmap','spec','alevel','resources','transfer','lens']);
  let items=NAV.filter(x=>!(x.teacherOnly&&(!acc||acc.role!=='teacher'))&&!(x.grp==='Teacher'&&(!acc||acc.role!=='teacher'))&&!(x.id&&tools&&TOGGLE.has(x.id)&&tools.indexOf(x.id)<0));
  items=items.filter((x,i)=>!(x.grp&&(i===items.length-1||items[i+1].grp)));
  document.getElementById('nav').innerHTML=subjBar+bar+items.map(x=>x.grp
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
    if(error){ err.textContent='Wrong username or password.'; btn.textContent='Sign in'; btn.disabled=false; return; }
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
    /* A teacher owns their class via classes.teacher_id — their own
       profile.class_id is usually null, so resolve the class id(s) from the
       classes table rather than from the teacher's profile. */
    let classIds=[];
    try{ const {data:cls}=await sb.from('classes').select('id').eq('teacher_id',SBUSER.id); classIds=(cls||[]).map(c=>c.id); }catch(e){}
    if(SBPROFILE&&SBPROFILE.class_id&&classIds.indexOf(SBPROFILE.class_id)<0) classIds.push(SBPROFILE.class_id);
    if(!classIds.length){ host.innerHTML='<div class="note"><span class="eyebrow">No class linked</span>This teacher account isn\'t linked to a class yet. Create one, or check that a class row exists with teacher_id set to your account.</p>'; ROSTER=[]; return; }
    const {data:profs,error}=await sb.from('profiles').select('*').in('class_id',classIds);
    if(error) throw error;
    const students=(profs||[]).filter(p=>p.role==='student');
    const ids=students.map(s=>s.id);
    let prog=[];
    if(ids.length){ const {data}=await sb.from('progress').select('user_id,key,value').in('user_id',ids); prog=data||[]; }
    const byUser={}; prog.forEach(r=>{ (byUser[r.user_id]=byUser[r.user_id]||{})[r.key]=r.value; });
    ROSTER=students.map(s=>({ profile:s, data:byUser[s.id]||{} }));
    renderRoster();
  }catch(e){ host.innerHTML='<div class="note"><span class="eyebrow">Could not load students</span>'+esc(String(e.message||e))+' — if this mentions a policy or permission, the row-level security fix below is needed.</p>'; }
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

/* ============ CHEMISTRY content pack (GCSE, Edexcel 1CH0 / AQA 8462) ============ */
const CHEM = {
 name:'Chemistry', code:'chemistry', edx:'Edexcel (1CH0)', aqa:'AQA (8462)',
 tools:['trigger','miscquiz','explorer','counterfactual','misconceptions','contrast','models','analogies','spec'],
 DIAG_TOPICS:['Atomic structure','Periodic table','Bonding & structure','Quantitative (moles)','Chemical changes / acids','Electrolysis','Energy changes','Rates & equilibrium','Organic chemistry','Chemical analysis','Atmosphere','Using resources','Other'],
 MIS:[
  {t:'Mass disappears when a gas is given off',topic:'Quantitative (moles)',wrong:'In a reaction that releases gas, the mass falls, so mass is destroyed.',right:'Mass is always conserved. The mass falls only because gas particles escape the open container — weigh everything (including the gas) and the total is unchanged.',ana:'A balloon deflating "loses" nothing — the air just left the balloon.',tell:'Apparent mass loss = a gas escaped. In a sealed flask the mass would not change.'},
  {t:'Atoms, molecules and compounds are the same thing',topic:'Bonding & structure',wrong:'The words atom, molecule and compound mean roughly the same.',right:'An atom is a single particle of an element; a molecule is two or more atoms joined; a compound is two or more DIFFERENT elements chemically bonded. O₂ is a molecule but not a compound; H₂O is both.',ana:'Atoms are letters, molecules are words, compounds are words using more than one kind of letter.',tell:'Different elements bonded = compound. Same element bonded (O₂) = molecule, not compound.'},
  {t:'Dissolving is the same as melting',topic:'Bonding & structure',wrong:'When sugar dissolves it melts into the water.',right:'Dissolving spreads particles of a solute between solvent particles (a mixture) — no heat needed and it can be reversed by evaporation. Melting is a solid turning to liquid by heating. Different processes.',ana:'Dissolving is mixing sand into a crowd; melting is the crowd itself turning to liquid.',tell:'Dissolving = mixing (separable by evaporation). Melting = change of state by heat.'},
  {t:'Covalent bonds break when a substance melts',topic:'Bonding & structure',wrong:'Melting a simple molecular substance breaks its covalent bonds.',right:'Melting/boiling simple molecular substances breaks the weak INTERMOLECULAR forces between molecules, not the strong covalent bonds inside them. That is why they have low melting points.',ana:'You pull apart a box of paperclips (weak attractions between clips) without bending any single clip (strong internal bonds).',tell:'Low melting point = weak forces BETWEEN molecules breaking, not the covalent bonds within.'},
  {t:'A stronger acid is always more concentrated',topic:'Chemical changes / acids',wrong:'"Strong" and "concentrated" mean the same for acids.',right:'Strength = how fully the acid ionises (releases H⁺). Concentration = how much acid per volume. A strong acid can be dilute; a weak acid can be concentrated.',ana:'Strength is how spicy each chilli is; concentration is how many chillies are in the pot.',tell:'Strong/weak = degree of ionisation. Concentrated/dilute = amount per dm³. Independent.'},
  {t:'Neutralisation always gives pure, neutral water',topic:'Chemical changes / acids',wrong:'Acid + base always makes neutral water.',right:'Neutralisation makes a salt + water. The solution is only neutral (pH 7) if exactly the right amounts react; excess acid or base leaves it acidic or alkaline, and the salt may not be neutral.',ana:'Balancing a see-saw needs the right weights — too much on either side and it tips.',tell:'Acid + base → salt + water. Neutral only at the exact end point.'},
  {t:'Catalysts are used up in a reaction',topic:'Rates & equilibrium',wrong:'A catalyst is a reactant that gets consumed.',right:'A catalyst speeds up a reaction by providing a lower-activation-energy pathway and is chemically unchanged at the end — it can be reused. It does not appear in the overall equation.',ana:'A matchmaker introduces two people but leaves the wedding unchanged.',tell:'Catalyst: lowers activation energy, not used up, not in the balanced equation.'},
  {t:'Electrons orbit the nucleus like planets',topic:'Atomic structure',wrong:'Electrons travel in neat circular orbits around the nucleus.',right:'Electrons occupy energy levels (shells) — regions of probability — not fixed planetary orbits. The GCSE shell model is a useful simplification, not literal planetary motion.',ana:'A swarm of bees around a hive occupies regions, not tidy racetracks.',tell:'Think energy levels/shells filling up (2,8,8…), not orbiting planets.'},
  {t:'The reactivity of Group 1 decreases down the group',topic:'Periodic table',wrong:'Lithium is more reactive than sodium and potassium.',right:'Group 1 reactivity INCREASES down the group. The outer electron is further from the nucleus and more shielded, so it is lost more easily — potassium reacts more violently than lithium.',ana:'A loosely held ball further from your hand is easier to knock away.',tell:'Group 1: reactivity rises down. Group 7 (halogens): reactivity falls down.'},
  {t:'Group 7 reactivity increases down the group',topic:'Periodic table',wrong:'Iodine is more reactive than chlorine and fluorine.',right:'Halogen reactivity DECREASES down the group: gaining an electron gets harder as the outer shell is further out and more shielded. Fluorine is the most reactive halogen.',ana:'Catching a ball is harder when your hands (outer shell) are further from the thrower.',tell:'Halogens gain an electron — easier when the shell is closer, so reactivity falls down the group.'},
  {t:'Balancing an equation means changing the formulas',topic:'Quantitative (moles)',wrong:'To balance, you can change small subscripts in the formulas.',right:'You balance by placing big NUMBERS (coefficients) in front of formulas, never by altering the formula itself. Changing H₂O to H₂O₂ makes a different substance.',ana:'You add more identical boxes; you never resize a box to make the totals match.',tell:'Balance with coefficients in front. Never change the chemical formula.'},
  {t:'A mole is just another word for a molecule',topic:'Quantitative (moles)',wrong:'One mole means one molecule.',right:'A mole is a fixed NUMBER of particles (6.02×10²³, Avogadro\'s number) — like "a dozen" means 12. One mole of water is ~18 g and contains 6.02×10²³ molecules.',ana:'A "dozen" is 12 of anything; a "mole" is 6.02×10²³ of anything.',tell:'Mole = a counting unit for particles, not a single molecule.'},
  {t:'Bigger atoms always have a bigger mass number than smaller atoms',topic:'Atomic structure',wrong:'A physically larger atom must be heavier.',right:'Atomic radius and mass are different. Going across a period atoms get smaller yet heavier (more protons pull electrons in). Size depends on shells and nuclear charge, not just mass.',ana:'A heavy steel ball can be smaller than a light beach ball.',tell:'Mass number = protons + neutrons; size depends on shells and nuclear pull. Not the same thing.'},
  {t:'In electrolysis the electrode signs are easy to mix up',topic:'Electrolysis',wrong:'Positive ions go to the positive electrode.',right:'Opposite charges attract: positive ions (cations) move to the NEGATIVE electrode (cathode); negative ions (anions) move to the POSITIVE electrode (anode). Reduction at the cathode, oxidation at the anode.',ana:'Magnets: a north pole is pulled to a south pole, not another north.',tell:'Cations → cathode (−). Anions → anode (+). Opposites attract.'},
  {t:'Exothermic reactions feel cold',topic:'Energy changes',wrong:'Exothermic means energy goes in, so it feels cold.',right:'Exothermic reactions RELEASE energy to the surroundings, so the surroundings warm up (combustion, neutralisation). Endothermic reactions absorb energy and feel cold.',ana:'A fire (exothermic) warms the room; an instant cold-pack (endothermic) chills it.',tell:'Exo = exits/warms surroundings. Endo = enters/cools surroundings.'},
  {t:'Rusting and burning do not add mass',topic:'Quantitative (moles)',wrong:'When iron rusts or magnesium burns the mass cannot increase.',right:'Mass increases because the metal combines with oxygen from the air. Weigh the metal plus the oxygen gained and mass is conserved — it only looks like a gain because the oxygen came from outside.',ana:'You weigh more after a big meal — you took mass in from outside.',tell:'Reacting with oxygen adds the oxygen\'s mass. Conservation still holds across the whole system.'},
  {t:'Diamond and graphite are different elements',topic:'Bonding & structure',wrong:'Because they look and behave differently, diamond and graphite must be different elements.',right:'Both are pure carbon — they are allotropes. Different bonding arrangements give different properties: diamond\'s rigid 3D lattice is hard; graphite\'s layers slide and its free electrons conduct.',ana:'The same Lego bricks build either a solid cube or sliding sheets.',tell:'Diamond and graphite are both carbon; structure, not element, explains the difference.'},
  {t:'Metals conduct because electrons are shared in bonds',topic:'Bonding & structure',wrong:'Metals conduct because electrons sit in fixed bonds.',right:'Metallic bonding has a lattice of positive ions in a SEA of delocalised (free) electrons. Those mobile electrons carry charge and heat, which is why metals conduct and are malleable.',ana:'A crowd where everyone can shuffle freely passes a message along instantly.',tell:'Metal conduction = delocalised electrons free to move, not electrons locked in bonds.'},
  {t:'Increasing concentration always increases the yield',topic:'Rates & equilibrium',wrong:'More concentrated reactants give a bigger final yield.',right:'Concentration affects the RATE (speed). At equilibrium, changing concentration shifts position (Le Chatelier) but the amount of product depends on the conditions and stoichiometry, not simply "more in = more out".',ana:'Driving faster gets you there sooner; it does not change the destination.',tell:'Concentration changes rate; yield at equilibrium is about position and conditions.'},
  {t:'The pH scale is just "acid or alkali"',topic:'Chemical changes / acids',wrong:'pH only tells you acid (low) or alkali (high), nothing more.',right:'pH measures H⁺ concentration on a logarithmic scale: each unit is a 10× change. pH 3 is ten times more acidic than pH 4, a hundred times more than pH 5.',ana:'Each step on the Richter scale is a ten-fold jump — small numbers, big differences.',tell:'pH is logarithmic: one unit = 10× the H⁺ concentration.'},
  {t:'Filtration separates dissolved salt from water',topic:'Chemical analysis',wrong:'You can filter salty water to get the salt out.',right:'Filtration only removes INSOLUBLE solids (bits bigger than the filter pores). Dissolved salt passes straight through — you need evaporation/crystallisation or distillation to separate it.',ana:'A sieve catches stones but not the sugar already dissolved in the tea.',tell:'Filtration = insoluble solids only. Dissolved substances need evaporation or distillation.'},
  {t:'Greenhouse gases and the ozone hole are the same problem',topic:'Atmosphere',wrong:'Global warming and the ozone hole are one and the same issue.',right:'They are distinct. Greenhouse gases (CO₂, CH₄) trap infrared and warm the planet; the ozone layer (damaged historically by CFCs) blocks UV. Different gases, different mechanisms.',ana:'A blanket trapping heat is not the same as a sunhat blocking UV.',tell:'Greenhouse effect = trapping heat (CO₂/CH₄). Ozone = blocking UV. Don\'t merge them.'},
  {t:'Crude oil is a single compound',topic:'Organic chemistry',wrong:'Crude oil is one substance you simply refine.',right:'Crude oil is a MIXTURE of hydrocarbons separated by fractional distillation, exploiting their different boiling points (chain length). Longer chains condense lower down the column.',ana:'A mixed bag of ropes of different lengths, sorted by how easily each is lifted.',tell:'Crude oil = mixture; fractional distillation separates by boiling point (chain length).'}
 ],
 ANA:[
  {topic:'Quantitative (moles)',k:'Moles = a chemist\'s dozen',v:'A mole is just a counting number (6.02×10²³). Saying "2 moles of H₂" is like "2 dozen eggs" — a fixed quantity you can weigh out using relative formula mass.'},
  {topic:'Bonding & structure',k:'Ionic bonding = give-and-take',v:'A metal hands its outer electrons to a non-metal; both reach full shells. The oppositely charged ions then stick by strong electrostatic attraction in a giant lattice — hence high melting points.'},
  {topic:'Bonding & structure',k:'Covalent bonding = sharing custody',v:'Two non-metals share pairs of electrons so each "feels" a full shell. The shared pair is a strong bond, but separate molecules only attract each other weakly — low boiling points.'},
  {topic:'Bonding & structure',k:'Metallic bonding = ions in an electron sea',v:'Positive ions sit in a sea of free electrons. The sea carries charge (conduction) and lets layers slide without breaking (malleable) — the electrons glue it all together.'},
  {topic:'Atomic structure',k:'Shells = stadium tiers filling up',v:'Electrons fill the lowest energy levels first (2, then 8, then 8…), like a stadium filling from the front rows. The outer-shell count drives an element\'s chemistry and its group.'},
  {topic:'Rates & equilibrium',k:'Activation energy = a hill to climb',v:'Reactants must get over an energy hill before they can react. A catalyst digs a lower pass through the hill; heat gives particles more energy to climb it — both speed things up.'},
  {topic:'Rates & equilibrium',k:'Collision theory = more, harder, more often',v:'Reactions happen when particles collide with enough energy. Raise concentration, pressure, temperature or surface area and you get more frequent or more energetic collisions — faster rate.'},
  {topic:'Rates & equilibrium',k:'Dynamic equilibrium = a busy escalator',v:'In a closed reversible reaction, forward and backward reactions run at equal rates — like people going up and down an escalator so the numbers on each floor stay constant, though movement never stops.'},
  {topic:'Chemical changes / acids',k:'Neutralisation = balancing a see-saw',v:'Adding base to acid removes H⁺; at the exact balance point you reach pH 7. Too much of either side and it tips acidic or alkaline.'},
  {topic:'Electrolysis',k:'Electrolysis = pulling a compound apart with electricity',v:'Electricity drags ions to opposite electrodes: positives to the negative cathode (gaining electrons, reduction), negatives to the positive anode (losing electrons, oxidation).'},
  {topic:'Periodic table',k:'Periodic table = an organised street of houses',v:'Groups (columns) share outer-electron count and so similar chemistry; periods (rows) show shells filling. Position predicts behaviour — Group 1 metals all react with water, halogens all form salts.'},
  {topic:'Energy changes',k:'Bond breaking vs making = spending vs earning',v:'Breaking bonds costs energy (endothermic); making bonds releases it (exothermic). If you make more than you break, the reaction is overall exothermic — energy profit.'},
  {topic:'Organic chemistry',k:'Fractional distillation = sorting by boiling point',v:'Crude oil is vaporised; fractions condense at different heights as the column cools upward. Short chains (low boiling point) rise high; long chains condense low down.'},
  {topic:'Organic chemistry',k:'Polymerisation = clipping beads into a chain',v:'Many small alkene monomers (with a C=C double bond) open up and join end-to-end into a long polymer chain, like clicking thousands of identical beads together.'},
  {topic:'Quantitative (moles)',k:'Conservation of mass = nothing vanishes',v:'Atoms are only rearranged in a reaction, never created or destroyed. If mass seems to change, a gas entered or left — account for it and the books always balance.'},
  {topic:'Chemical analysis',k:'Chromatography = a race up the paper',v:'A solvent carries dissolved substances up the paper; the more soluble travel further. Different components separate into spots, and their Rf values identify them.'},
  {topic:'Atmosphere',k:'Greenhouse effect = a blanket for the planet',v:'Greenhouse gases let sunlight in but absorb the infrared the Earth re-emits, trapping heat like a blanket. More CO₂ and methane means a thicker blanket and warming.'},
  {topic:'Chemical changes / acids',k:'Reactivity series = an order of eagerness',v:'Metals are ranked by how readily they lose electrons. A more reactive metal displaces a less reactive one from its compound — the keener metal "takes the place" of the other.'}
 ],
 TRIG:[
  {s:'Magnesium ribbon is burned in air and the grey ash weighs more than the original ribbon.',mode:'multi',opts:[{t:'Conservation of mass',c:1},{t:'Reaction with oxygen adds mass',c:1},{t:'Oxidation',c:1},{t:'Mass was created',c:0}],why:'The magnesium combines with oxygen from the air to form magnesium oxide; the gained oxygen accounts for the extra mass. Mass is conserved across the whole system.'},
  {s:'A marble chip fizzes faster in acid when it is first ground into powder.',mode:'multi',opts:[{t:'Rate of reaction',c:1},{t:'Surface area effect',c:1},{t:'Collision theory',c:1},{t:'The acid became stronger',c:0}],why:'Powder exposes far more surface area, so more acid particles collide with the solid per second — more frequent collisions, faster rate. The acid is unchanged.'},
  {s:'Sodium fizzes and whizzes across water; potassium does the same but bursts into lilac flame.',mode:'multi',opts:[{t:'Group 1 reactivity',c:1},{t:'Reactivity increases down the group',c:1},{t:'Loss of the outer electron',c:1},{t:'Potassium is less reactive',c:0}],why:'Both are Group 1 metals reacting with water; potassium\'s outer electron is further out and more shielded, so it is lost more easily — more reactive, more violent.'},
  {s:'Molten lead bromide is connected to a power supply; a brown vapour appears at one electrode and a silvery bead at the other.',mode:'multi',opts:[{t:'Electrolysis',c:1},{t:'Reduction at the cathode',c:1},{t:'Oxidation at the anode',c:1},{t:'A spontaneous reaction',c:0}],why:'Electricity decomposes the molten ionic compound: Pb²⁺ gains electrons at the negative cathode (metal bead), Br⁻ loses electrons at the positive anode (bromine vapour).'},
  {s:'Hand-warmers get hot when activated; instant cold-packs get cold.',mode:'multi',opts:[{t:'Energy changes',c:1},{t:'Exothermic (warmer)',c:1},{t:'Endothermic (colder)',c:1},{t:'Energy destroyed',c:0}],why:'The warmer releases energy to the surroundings (exothermic); the cold-pack absorbs energy from the surroundings (endothermic). Energy is transferred, never destroyed.'},
  {s:'Two test tubes of acid and base are mixed; a thermometer reads a rise and the solution ends at pH 7.',mode:'multi',opts:[{t:'Neutralisation',c:1},{t:'Exothermic reaction',c:1},{t:'Salt + water formed',c:1},{t:'A gas was produced',c:0}],why:'Acid + base → salt + water, releasing heat (exothermic). Reaching pH 7 means the amounts exactly balanced. No gas in a simple acid-alkali neutralisation.'},
  {s:'Crude oil is heated in a tall column and different liquids are tapped off at different heights.',mode:'multi',opts:[{t:'Fractional distillation',c:1},{t:'Separating a mixture',c:1},{t:'Boiling point depends on chain length',c:1},{t:'A chemical reaction',c:0}],why:'Crude oil is a mixture separated physically by boiling point: shorter chains (lower boiling points) condense high up, longer chains low down. No bonds are broken — it is separation, not reaction.'},
  {s:'Adding a small amount of manganese dioxide makes hydrogen peroxide bubble vigorously, and the powder can be recovered unchanged.',mode:'multi',opts:[{t:'Catalysis',c:1},{t:'Lower activation energy',c:1},{t:'Catalyst not used up',c:1},{t:'The catalyst is a reactant',c:0}],why:'The manganese dioxide is a catalyst: it speeds decomposition by lowering the activation energy and is recovered unchanged, so it is not consumed and not in the overall equation.'},
  {s:'A drop of ink is placed on paper and a solvent rises, splitting it into separate coloured spots.',mode:'multi',opts:[{t:'Chromatography',c:1},{t:'Separating a mixture by solubility',c:1},{t:'Rf values identify components',c:1},{t:'A new compound forms',c:0}],why:'Chromatography separates a mixture: more soluble components travel further up the paper. The spots and their Rf values identify the components; nothing new is made.'},
  {s:'Iron filings are added to blue copper sulfate solution; the blue fades and an orange-brown solid appears.',mode:'multi',opts:[{t:'Displacement reaction',c:1},{t:'Reactivity series',c:1},{t:'Iron is more reactive than copper',c:1},{t:'Copper is more reactive',c:0}],why:'Iron is more reactive than copper, so it displaces copper from the solution: iron goes into solution and copper metal is deposited. Reactivity series predicts the outcome.'},
  {s:'Limestone is heated strongly and gives off a gas that turns limewater milky.',mode:'multi',opts:[{t:'Thermal decomposition',c:1},{t:'Carbon dioxide produced',c:1},{t:'Endothermic (needs heating)',c:1},{t:'Combustion',c:0}],why:'Heating calcium carbonate decomposes it into calcium oxide and carbon dioxide (which turns limewater milky). It needs continuous heating, so it is endothermic, not burning.'},
  {s:'A reversible reaction in a sealed flask reaches a steady colour even though molecules keep reacting.',mode:'multi',opts:[{t:'Dynamic equilibrium',c:1},{t:'Forward and backward rates equal',c:1},{t:'Closed system',c:1},{t:'The reaction has stopped',c:0}],why:'At dynamic equilibrium the forward and backward reactions continue at equal rates in a closed system, so concentrations stay constant — steady, but not stopped.'}
 ],
 QUIZ:[
  {_mt:'Mass disappears when a gas is given off',q:'Marble chips react with acid in an open flask and the balance reading falls. What happened to the "lost" mass?',opts:[{t:'CO₂ gas escaped the open flask',c:1},{t:'Mass was destroyed in the reaction',c:0},{t:'The acid evaporated',c:0}],feels:'The number on the balance really does go down, so it feels like mass vanished.',soc:['What gas is produced when a carbonate reacts with acid?','In an OPEN flask, where does that gas go?','If you captured the escaping gas and weighed it too, what would the total mass do?']},
  {_mt:'A stronger acid is always more concentrated',q:'A dilute solution of hydrochloric acid vs a concentrated solution of ethanoic (vinegar) acid — which is the "stronger" acid?',opts:[{t:'Hydrochloric — it ionises fully',c:1},{t:'The concentrated ethanoic acid',c:0},{t:'They are equally strong',c:0}],feels:'"Concentrated" sounds powerful, so it feels like the stronger acid.',soc:['What does "strong" mean for an acid — amount, or how fully it ionises?','Hydrochloric acid ionises completely; ethanoic only partly. Which releases more H⁺ per molecule?','So can a dilute acid still be "strong"?']},
  {_mt:'Catalysts are used up in a reaction',q:'After speeding up a reaction, the catalyst is recovered. How much of it remains?',opts:[{t:'All of it — it is chemically unchanged',c:1},{t:'About half',c:0},{t:'None — it was consumed',c:0}],feels:'It was clearly involved, so it feels like it must get used up.',soc:['Does a catalyst appear in the overall balanced equation?','What does a catalyst do to the activation energy?','If it is chemically unchanged at the end, how much can you recover?']},
  {_mt:'The reactivity of Group 1 decreases down the group',q:'Lithium, sodium and potassium are dropped on water. Which reacts most violently?',opts:[{t:'Potassium',c:1},{t:'Lithium',c:0},{t:'They react identically',c:0}],feels:'Lithium is at the top, so it can feel like the "first" and most reactive.',soc:['Where is the outer electron in potassium compared with lithium — closer or further from the nucleus?','Is a further, more shielded electron easier or harder to lose?','So as you go DOWN Group 1, does reactivity rise or fall?']},
  {_mt:'Covalent bonds break when a substance melts',q:'Ice melts at 0 °C. What is being broken?',opts:[{t:'The weak forces between water molecules',c:1},{t:'The O–H covalent bonds inside molecules',c:0},{t:'The water atoms themselves',c:0}],feels:'Melting feels drastic, so it seems like strong bonds must break.',soc:['Are the molecules still H₂O after the ice melts?','If the molecules are intact, were the strong covalent bonds inside them broken?','So melting breaks the forces BETWEEN molecules or the bonds WITHIN them?']},
  {_mt:'In electrolysis the electrode signs are easy to mix up',q:'In molten lead bromide, which electrode do the positive lead ions move to?',opts:[{t:'The negative electrode (cathode)',c:1},{t:'The positive electrode (anode)',c:0},{t:'They stay in the middle',c:0}],feels:'"Positive ion → positive electrode" sounds tidy, so it feels right.',soc:['Do like charges attract or repel?','A lead ion is positive. Which electrode has the OPPOSITE charge?','So positive ions go to which electrode — and what is it called?']},
  {_mt:'Balancing an equation means changing the formulas',q:'To balance H₂ + O₂ → H₂O, what may you change?',opts:[{t:'Only the big numbers in front of each formula',c:1},{t:'The small subscript numbers in the formulas',c:0},{t:'Either the formulas or the coefficients',c:0}],feels:'Tweaking a subscript looks like an easy way to make the atoms match.',soc:['If you change H₂O to H₂O₂, is it still water?','Which numbers can you change without changing what the substance IS?','So do you balance with coefficients in front, or by editing formulas?']},
  {_mt:'A mole is just another word for a molecule',q:'How many particles are in one mole of any substance?',opts:[{t:'6.02×10²³ (Avogadro\'s number)',c:1},{t:'Exactly one',c:0},{t:'It depends on the substance',c:0}],feels:'"Mole" sounds like it could name a single particle.',soc:['What does "a dozen" tell you — a single thing, or a fixed count?','A mole works the same way. Is it one particle or a fixed huge number?','So one mole of water contains how many molecules?']},
  {_mt:'Exothermic reactions feel cold',q:'You mix an acid and an alkali and the beaker gets warm. Exothermic or endothermic?',opts:[{t:'Exothermic',c:1},{t:'Endothermic',c:0},{t:'Neither',c:0}],feels:'The "exo/endo" words are easy to swap under pressure.',soc:['Did energy leave the reaction into the surroundings, or get taken in?','If the surroundings (the beaker) warmed up, where did that energy come from?','So is releasing heat to the surroundings exothermic or endothermic?']},
  {_mt:'Filtration separates dissolved salt from water',q:'You have salty water. Can filtering it give you the salt?',opts:[{t:'No — dissolved salt passes through the filter',c:1},{t:'Yes — the filter traps the salt',c:0},{t:'Only with very fine filter paper',c:0}],feels:'Filtering "cleans" water, so it feels like it should remove the salt.',soc:['Is dissolved salt made of big visible bits, or individual ions spread through the water?','Can particles smaller than the filter pores be trapped?','So to recover dissolved salt, do you filter or evaporate?']}
 ],
 EQS:[
  {id:'moles_mass',name:'Moles from mass',form:'moles = mass ÷ Mr',unit:'mol',vars:[{s:'m',label:'mass',min:0,max:200,step:1,val:36,unit:'g'},{s:'Mr',label:'relative formula mass',min:1,max:300,step:1,val:18,unit:''}],calc:v=>v.m/v.Mr,insight:'Moles convert a mass you can weigh into a particle count you can react. Water (Mr 18): 18 g is exactly one mole.',predict:{q:'For the same mass, a substance with a LARGER Mr gives…',opts:['fewer moles','more moles','the same moles'],a:0}},
  {id:'conc',name:'Concentration',form:'c = moles ÷ volume',unit:'mol/dm³',vars:[{s:'n',label:'moles of solute',min:0,max:5,step:0.1,val:1,unit:'mol'},{s:'V',label:'volume',min:0.1,max:5,step:0.1,val:1,unit:'dm³'}],calc:v=>v.n/v.V,insight:'Concentration is moles per dm³. Adding water (more volume) for the same moles dilutes the solution.',predict:{q:'Keep the moles; double the volume. Concentration will…',opts:['double','halve','stay the same'],a:1}},
  {id:'rfm_pct',name:'Percentage by mass',form:'% = (mass of element ÷ Mr) × 100',unit:'%',vars:[{s:'e',label:'mass of element in formula',min:1,max:200,step:1,val:16,unit:''},{s:'Mr',label:'relative formula mass',min:1,max:300,step:1,val:18,unit:''}],calc:v=>Math.min(v.e,v.Mr)/v.Mr*100,insight:'Tells you how much of a compound\'s mass is one element — e.g. oxygen is ~89% of water by mass.',predict:{q:'If the element\'s share of the formula mass rises, the percentage…',opts:['rises','falls','stays the same'],a:0}},
  {id:'rate',name:'Mean rate of reaction',form:'rate = quantity ÷ time',unit:'units/s',vars:[{s:'q',label:'amount used or made',min:0,max:100,step:1,val:40,unit:''},{s:'t',label:'time',min:1,max:120,step:1,val:20,unit:'s'}],calc:v=>v.q/v.t,insight:'The faster a product forms (or reactant disappears), the higher the rate. Powdering a solid or heating both raise it.',predict:{q:'Same amount reacts but in half the time. The rate…',opts:['halves','doubles','is unchanged'],a:1}},
  {id:'atomecon',name:'Atom economy',form:'% = (Mr useful ÷ Mr all products) × 100',unit:'%',vars:[{s:'u',label:'Mr of useful product',min:1,max:300,step:1,val:28,unit:''},{s:'a',label:'Mr of all products',min:1,max:400,step:1,val:44,unit:''}],calc:v=>Math.min(v.u,v.a)/v.a*100,insight:'High atom economy means little of your reactants become waste — greener and cheaper. It is fixed by the equation, unlike yield.',predict:{q:'If more of the product mass is the useful product, atom economy…',opts:['rises','falls','stays the same'],a:0}},
  {id:'pctyield',name:'Percentage yield',form:'% = (actual ÷ theoretical) × 100',unit:'%',vars:[{s:'a',label:'actual yield',min:0,max:100,step:1,val:8,unit:'g'},{s:'t',label:'theoretical yield',min:1,max:100,step:1,val:10,unit:'g'}],calc:v=>Math.min(v.a,v.t)/v.t*100,insight:'Real reactions rarely give 100% — losses, side reactions and reversible reactions cut the yield below the theoretical maximum.',predict:{q:'The closer the actual yield gets to the theoretical, the percentage yield…',opts:['rises toward 100%','falls','stays the same'],a:0}},
  {id:'molesgas',name:'Moles of a gas',form:'moles = volume ÷ 24',unit:'mol',vars:[{s:'V',label:'gas volume (room conditions)',min:0,max:120,step:1,val:24,unit:'dm³'}],calc:v=>v.V/24,insight:'At room temperature and pressure, one mole of any gas occupies ~24 dm³. So 48 dm³ is two moles — regardless of which gas.',predict:{q:'Double the gas volume at room conditions. Moles of gas…',opts:['double','halve','stay the same'],a:0}},
  {id:'rf',name:'Rf value (chromatography)',form:'Rf = spot distance ÷ solvent distance',unit:'',vars:[{s:'s',label:'distance moved by spot',min:0,max:10,step:0.1,val:3,unit:'cm'},{s:'f',label:'distance moved by solvent',min:0.1,max:10,step:0.1,val:6,unit:'cm'}],calc:v=>Math.min(v.s,v.f)/v.f,insight:'Rf is always between 0 and 1 and identifies a component in fixed conditions — the more soluble the substance, the further it travels and the higher the Rf.',predict:{q:'A more soluble component travels further up the paper, so its Rf is…',opts:['higher','lower','unchanged'],a:0}}
 ],
 CF:[
  {topic:'Quantitative (moles)',o:'Magnesium burns in air and the product weighs more than the metal.',f:'What if you did it in a sealed, rigid container?',r:'The total mass would not change at all — the oxygen comes from inside the sealed system. The "gain" in the open lab is just oxygen joining from the surrounding air.'},
  {topic:'Rates & equilibrium',o:'A reaction fizzes steadily at room temperature.',f:'What if you heated it by 10 °C?',r:'The rate roughly doubles: particles move faster and collide more often AND with more energy, so far more collisions exceed the activation energy.'},
  {topic:'Rates & equilibrium',o:'A catalyst speeds a reaction up.',f:'What if you removed the catalyst halfway through?',r:'The reaction continues but slows back to its uncatalysed rate. The catalyst lowered the activation energy while present; the final products and amounts are unchanged.'},
  {topic:'Electrolysis',o:'Molten sodium chloride is electrolysed, giving sodium and chlorine.',f:'What if you dissolved it in water and electrolysed that instead?',r:'Hydrogen is released at the cathode instead of sodium, because water is easier to reduce than Na⁺. In solution the products can change — water gets involved.'},
  {topic:'Chemical changes / acids',o:'A dilute strong acid has a certain pH.',f:'What if you diluted it ten-fold with water?',r:'The pH rises by about 1 unit (less acidic), because pH is logarithmic — a 10× drop in H⁺ concentration shifts pH by one. It does not become neutral instantly.'},
  {topic:'Bonding & structure',o:'Sodium chloride has a very high melting point.',f:'What if its bonding were simple covalent instead of ionic?',r:'It would melt at a low temperature. Ionic giant lattices need huge energy to overcome electrostatic attraction; simple molecular substances only need to overcome weak intermolecular forces.'},
  {topic:'Periodic table',o:'Fluorine readily displaces bromide ions from solution.',f:'What if you tried iodine to displace chloride?',r:'Nothing happens — iodine is less reactive than chlorine and cannot displace it. A halogen only displaces those below it in the group.'},
  {topic:'Organic chemistry',o:'Long-chain fractions of crude oil are in low demand.',f:'What if you cracked them?',r:'You break long alkanes into shorter, more useful alkanes plus alkenes (for fuels and plastics). Cracking matches supply to demand by converting surplus long chains.'},
  {topic:'Energy changes',o:'A reaction releases energy and warms the surroundings.',f:'What if more energy were needed to break bonds than was released making them?',r:'It would be endothermic instead — the surroundings would cool. Exo vs endo is decided by whether bond-making releases more than bond-breaking costs.'},
  {topic:'Atmosphere',o:'Atmospheric CO₂ is rising and so is global temperature.',f:'What if photosynthesis suddenly doubled worldwide?',r:'More CO₂ would be removed from the air, slowing the rise. Plants and oceans are key carbon sinks; changing them shifts the balance of the carbon cycle.'}
 ],
 CONTRAST:[
  {a:'Ionic bonding',b:'Covalent bonding',topic:'Bonding & structure',rows:[['Between','metal + non-metal','non-metal + non-metal'],['Electrons','transferred','shared'],['Particles','oppositely charged ions','molecules'],['Melting point','high (giant lattice)','low (simple molecular)'],['Conducts?','when molten/dissolved','no (no free charges)']],confusion:'Both hold atoms together to reach full shells, but one transfers electrons and one shares them.',tell:'Metal+non-metal = ionic (transfer). Non-metal+non-metal = covalent (share).'},
  {a:'Strong acid',b:'Concentrated acid',topic:'Chemical changes / acids',rows:[['Describes','degree of ionisation','amount per volume'],['Strong/weak axis','fully vs partly ionised','—'],['Conc/dilute axis','—','lots vs little per dm³'],['Example','dilute HCl is strong','concentrated ethanoic is weak']],confusion:'Both sound like "powerful acid", but they measure completely different things.',tell:'Strong = how fully it ionises. Concentrated = how much per dm³. A dilute strong acid exists.'},
  {a:'Exothermic',b:'Endothermic',topic:'Energy changes',rows:[['Energy','released to surroundings','absorbed from surroundings'],['Surroundings','warm up','cool down'],['Bonds','make > break','break > make'],['Examples','combustion, neutralisation','thermal decomposition, photosynthesis']],confusion:'Both involve energy transfer; the difference is the direction.',tell:'Exo = exits/warms. Endo = enters/cools. Compare bond-making vs bond-breaking energy.'},
  {a:'Element',b:'Compound',topic:'Bonding & structure',rows:[['Made of','one type of atom','two+ elements bonded'],['Separated by','—','chemical reaction only'],['On the periodic table','yes','no'],['Example','oxygen (O₂)','water (H₂O)']],confusion:'A mixture and a compound both contain different substances, but only a compound is chemically bonded.',tell:'Element = one kind of atom. Compound = different elements chemically joined (fixed ratio).'},
  {a:'Mixture',b:'Compound',topic:'Bonding & structure',rows:[['Joined?','not chemically','chemically bonded'],['Composition','any ratio','fixed ratio'],['Separated by','physical means','chemical reaction'],['Properties','those of its parts','new properties'],['Example','air','carbon dioxide']],confusion:'Both contain more than one element, but only a compound is chemically combined.',tell:'Mixture = physically together (easy to separate). Compound = chemically bonded (new substance).'},
  {a:'Oxidation',b:'Reduction',topic:'Electrolysis',rows:[['Electrons','lost','gained'],['Oxygen','gained','lost'],['At which electrode','anode (+)','cathode (−)'],['Memory aid','OIL','RIG']],confusion:'They always happen together (redox), so it is easy to mix up which is which.',tell:'OIL RIG: Oxidation Is Loss, Reduction Is Gain (of electrons).'},
  {a:'Diamond',b:'Graphite',topic:'Bonding & structure',rows:[['Element','carbon','carbon'],['Each carbon bonds to','4 others','3 others'],['Structure','rigid 3D lattice','layers'],['Conducts?','no','yes (free electrons)'],['Property','very hard','soft/slippery']],confusion:'Same element, opposite properties — students assume different elements.',tell:'Both pure carbon (allotropes). Bonding arrangement, not the element, explains the difference.'},
  {a:'Pure substance',b:'Mixture',topic:'Chemical analysis',rows:[['Melting point','sharp, fixed','melts over a range'],['Composition','single substance','more than one'],['Chromatography','one spot','several spots'],['Example','distilled water','sea water']],confusion:'"Pure" in everyday speech (e.g. pure orange juice) differs from the chemistry meaning.',tell:'Chemically pure = one substance, with a sharp melting point and one chromatography spot.'},
  {a:'Endothermic profile',b:'Exothermic profile',topic:'Energy changes',rows:[['Products vs reactants','products higher','products lower'],['Overall energy','absorbed','released'],['Activation energy','still a hill to climb','still a hill to climb'],['ΔH sign','positive','negative']],confusion:'Both reaction profiles show an activation-energy hump, so the overall direction gets missed.',tell:'Look at product level vs reactant level: higher = endothermic, lower = exothermic.'},
  {a:'Cathode',b:'Anode',topic:'Electrolysis',rows:[['Charge','negative','positive'],['Attracts','positive ions (cations)','negative ions (anions)'],['Reaction','reduction (gain e⁻)','oxidation (lose e⁻)'],['Typical product','metal or hydrogen','non-metal (e.g. Cl₂, O₂)']],confusion:'The names and signs are easily swapped.',tell:'Cathode = negative, attracts cations, reduction. Anode = positive, attracts anions, oxidation.'}
 ],
 MODELS:[
  {c:'The mole and conservation of mass',topic:'Quantitative (moles)',model:'A balanced equation counts particles in moles. Atoms are only rearranged, so the total mass of reactants equals the total mass of products — always.',wrong:['Mass can be created or destroyed in a reaction.','A mole means one molecule.'],predict:['If a flask seems to lose mass, a gas escaped.','If it gains mass, it took in a gas (e.g. oxygen).','Reacting masses follow the mole ratio in the equation.'],bound:['Open systems let gases in/out, hiding the conservation.','Moles count particles; convert via Mr.'],ex:['Predicting product mass from reactant mass.','Working out an unknown formula by experiment.']},
  {c:'Structure decides properties',topic:'Bonding & structure',model:'How particles are bonded and arranged determines melting point, conductivity, hardness and solubility. Ionic giant lattices, giant covalent, simple molecular and metallic each behave differently.',wrong:['Melting always breaks covalent bonds.','All carbon is the same regardless of structure.'],predict:['Giant ionic/covalent → high melting point.','Simple molecular → low melting point, no conduction.','Metallic/graphite → conduct via free electrons.'],bound:['Simple molecular melting breaks weak forces, not covalent bonds.','Ionic conducts only when molten or dissolved.'],ex:['Choosing materials by their bonding.','Explaining why diamond is hard but graphite is slippery.']},
  {c:'Collision theory & rate',topic:'Rates & equilibrium',model:'Reactions need particles to collide with at least the activation energy. Anything that makes collisions more frequent or more energetic — concentration, pressure, surface area, temperature, catalyst — increases the rate.',wrong:['Catalysts are used up.','Concentration changes the final yield, not the rate.'],predict:['Powdering a solid speeds it up (more surface area).','Heating speeds it up (more energetic collisions).','A catalyst lowers activation energy without being consumed.'],bound:['Catalysts change rate, not the position of equilibrium\'s products much.','Temperature affects both rate and equilibrium.'],ex:['Speeding up industrial reactions.','Explaining why flour dust can explode.']},
  {c:'Acids, bases and pH',topic:'Chemical changes / acids',model:'Acids release H⁺ in water; the pH scale (logarithmic) measures their concentration. Bases/alkalis neutralise them to form a salt + water. Strength (ionisation) and concentration (amount) are independent.',wrong:['Strong = concentrated.','Neutralisation always gives neutral water.'],predict:['Diluting 10× raises pH by ~1.','Acid + base → salt + water.','Neutral (pH 7) only at the exact end point.'],bound:['Each pH unit is a 10× change in H⁺.','The salt formed may not itself be neutral.'],ex:['Titrations to find concentration.','Treating acidic soil with lime.']},
  {c:'Redox and electrolysis',topic:'Electrolysis',model:'Electrolysis uses electricity to decompose ionic compounds. Cations go to the negative cathode and are reduced (gain electrons); anions go to the positive anode and are oxidised (lose electrons).',wrong:['Positive ions go to the positive electrode.','Electrolysis works on covalent liquids.'],predict:['Metal or hydrogen forms at the cathode.','Non-metal (Cl₂, O₂) forms at the anode.','In solution, water can be discharged instead of the metal.'],bound:['Needs ions free to move (molten or dissolved).','In solution, the easier-to-discharge species wins.'],ex:['Extracting reactive metals (aluminium).','Electroplating and purifying copper.']},
  {c:'Energy changes in reactions',topic:'Energy changes',model:'Breaking bonds takes in energy; making bonds gives it out. If more is given out than taken in, the reaction is exothermic (warms surroundings); if more is taken in, endothermic (cools them).',wrong:['Exothermic feels cold.','Energy is created or destroyed.'],predict:['Combustion and neutralisation warm the surroundings.','Thermal decomposition cools/needs heating.','Overall energy change = bonds made − bonds broken.'],bound:['Activation energy must still be supplied to start.','Total energy is always conserved.'],ex:['Hand-warmers and cold-packs.','Calculating energy change from bond energies.']},
  {c:'The periodic table predicts behaviour',topic:'Periodic table',model:'Elements are arranged by atomic number into groups (same outer electrons → similar chemistry) and periods (filling shells). Position predicts reactivity trends and the type of ion an element forms.',wrong:['Group 1 reactivity falls down the group.','Reactivity is random.'],predict:['Group 1 reactivity rises down; Group 7 falls down.','Group 1 form 1+ ions, Group 7 form 1− ions.','Transition metals form coloured compounds and act as catalysts.'],bound:['Trends rely on shielding and distance of the outer electron.','Noble gases are unreactive (full shells).'],ex:['Predicting a metal\'s reaction with water.','Explaining displacement reactions.']}
 ],
 SPEC:[
  {id:'cx1',n:1,paper:'Both papers',title:'Key concepts (atoms, elements, formulae)',pts:['Atomic structure, isotopes and the development of the model','Elements, compounds and mixtures; chemical formulae','The periodic table: groups, periods and trends','Electronic configuration and ions'],study:[['Misconception fixes','misconceptions'],['Concept contrasts','contrast']]},
  {id:'cx2',n:2,paper:'Paper 1',title:'States of matter & separation',pts:['States of matter and changes of state','Filtration, crystallisation, distillation, chromatography','Pure substances vs mixtures'],study:[['Concept contrasts','contrast'],['Trigger trainer','trigger']]},
  {id:'cx3',n:3,paper:'Paper 1',title:'Bonding & structure',pts:['Ionic, covalent and metallic bonding','Giant ionic, simple molecular, giant covalent, metallic structures','Properties from structure; allotropes of carbon; nanoparticles'],study:[['Concept contrasts','contrast'],['Mental models','models'],['Misconception fixes','misconceptions']]},
  {id:'cx4',n:4,paper:'Paper 1',title:'Quantitative chemistry',pts:['Conservation of mass and balanced equations','Relative formula mass; moles (HT)','Concentration, percentage yield and atom economy','Gas volumes'],study:[['Equation explorer','explorer'],['Mental models','models']]},
  {id:'cx5',n:5,paper:'Paper 1',title:'Chemical changes',pts:['Acids, bases, alkalis and the pH scale; neutralisation','Reactions of acids; making salts','Reactivity series and displacement','Electrolysis of molten and aqueous compounds'],study:[['Concept contrasts','contrast'],['Misconception fixes','misconceptions'],['Trigger trainer','trigger']]},
  {id:'cx6',n:6,paper:'Paper 1',title:'Energy changes',pts:['Exothermic and endothermic reactions','Reaction profiles and activation energy','Bond energy calculations (HT)','Cells and fuel cells'],study:[['Equation explorer','explorer'],['Concept contrasts','contrast']]},
  {id:'cx7',n:7,paper:'Paper 2',title:'Rates & equilibrium',pts:['Rate of reaction and collision theory','Factors affecting rate; catalysts','Reversible reactions and dynamic equilibrium','Le Chatelier\'s principle (HT)'],study:[['Mental models','models'],['Equation explorer','explorer'],['Trigger trainer','trigger']]},
  {id:'cx8',n:8,paper:'Paper 2',title:'Organic chemistry',pts:['Crude oil, fractional distillation and hydrocarbons','Alkanes and alkenes; combustion','Cracking; addition polymers','Alcohols and carboxylic acids (HT/separate)'],study:[['Analogy bank','analogies'],['Concept contrasts','contrast']]},
  {id:'cx9',n:9,paper:'Paper 2',title:'Chemical analysis',pts:['Pure substances and formulations','Chromatography and Rf values','Tests for gases and ions (flame tests, precipitates)'],study:[['Trigger trainer','trigger'],['Equation explorer','explorer']]},
  {id:'cx10',n:10,paper:'Paper 2',title:'Chemistry of the atmosphere',pts:['Evolution of the atmosphere','Greenhouse gases and climate change','Carbon footprint; atmospheric pollutants'],study:[['Misconception fixes','misconceptions'],['Analogy bank','analogies']]},
  {id:'cx11',n:11,paper:'Paper 2',title:'Using resources',pts:['Potable water and waste treatment','Life-cycle assessment and recycling','Extracting metals; reduction and phytomining/bioleaching','The Haber process and fertilisers (separate)'],study:[['Concept contrasts','contrast'],['Mental models','models']]}
 ],
 AQA_SPEC:[
  {id:'caq1',n:1,pap:1,title:'Atomic structure & the periodic table',pts:['Atoms, elements, compounds and mixtures; separation','The atomic model, isotopes and electronic structure','The periodic table; groups 0, 1 and 7; transition metals'],study:[['Misconception fixes','misconceptions'],['Concept contrasts','contrast']]},
  {id:'caq2',n:2,pap:1,title:'Bonding, structure & properties',pts:['Ionic, covalent and metallic bonding','States of matter and structures','Properties from structure; carbon allotropes; nanoscience'],study:[['Concept contrasts','contrast'],['Mental models','models']]},
  {id:'caq3',n:3,pap:1,title:'Quantitative chemistry',pts:['Conservation of mass and balanced equations','Relative formula mass and moles (HT)','Concentration, yield, atom economy and gas volumes'],study:[['Equation explorer','explorer'],['Mental models','models']]},
  {id:'caq4',n:4,pap:1,title:'Chemical changes',pts:['Reactivity of metals and extraction','Acids, neutralisation and making salts','Electrolysis of molten and aqueous compounds'],study:[['Concept contrasts','contrast'],['Trigger trainer','trigger']]},
  {id:'caq5',n:5,pap:1,title:'Energy changes',pts:['Exothermic and endothermic reactions and profiles','Bond energy calculations (HT)','Cells and fuel cells (separate)'],study:[['Equation explorer','explorer'],['Concept contrasts','contrast']]},
  {id:'caq6',n:6,pap:2,title:'Rate & extent of change',pts:['Rate of reaction and collision theory','Catalysts','Reversible reactions, equilibrium and Le Chatelier (HT)'],study:[['Mental models','models'],['Trigger trainer','trigger']]},
  {id:'caq7',n:7,pap:2,title:'Organic chemistry',pts:['Crude oil, alkanes, fractional distillation','Cracking and alkenes','Polymers; alcohols and carboxylic acids (separate)'],study:[['Analogy bank','analogies'],['Concept contrasts','contrast']]},
  {id:'caq8',n:8,pap:2,title:'Chemical analysis',pts:['Pure substances and formulations','Chromatography and Rf','Tests for ions and gases (separate depth)'],study:[['Trigger trainer','trigger'],['Equation explorer','explorer']]},
  {id:'caq9',n:9,pap:2,title:'Chemistry of the atmosphere',pts:['Composition and evolution of the atmosphere','Greenhouse gases and climate change','Atmospheric pollutants from fuels'],study:[['Misconception fixes','misconceptions'],['Analogy bank','analogies']]},
  {id:'caq10',n:10,pap:2,title:'Using resources',pts:['Finite vs renewable resources; potable water','Life-cycle assessment and recycling','The Haber process and NPK fertilisers (separate)'],study:[['Concept contrasts','contrast'],['Mental models','models']]}
 ],
 CPRAC:[['CP1','Making a salt','Prepare a pure, dry sample of a soluble salt from an insoluble base and an acid.'],['CP2','Titration','Find the volume of acid needed to neutralise an alkali and calculate concentration.'],['CP3','Electrolysis','Investigate the products of electrolysing aqueous solutions with inert electrodes.'],['CP4','Temperature change','Investigate the energy change of reactions (e.g. neutralisation, displacement).'],['CP5','Rate of reaction','Investigate how concentration/surface area affects rate (gas volume or colour change).'],['CP6','Chromatography','Separate the components of a mixture and calculate Rf values.'],['CP7','Identifying ions','Use flame tests and precipitate reactions to identify unknown ions.'],['CP8','Water purification','Analyse and purify water samples by distillation.']],
 AQA_PRAC:[['RP1','Making salts','Prepare a pure, dry sample of a soluble salt.'],['RP2','Titration','Determine the reacting volumes of an acid and alkali by titration.'],['RP3','Electrolysis','Investigate what is produced during the electrolysis of aqueous solutions.'],['RP4','Temperature changes','Measure energy changes (e.g. neutralisation, displacement, dissolving).'],['RP5','Rates of reaction','Investigate how a variable affects the rate of reaction.'],['RP6','Chromatography','Separate a mixture using paper chromatography and find Rf values.'],['RP7','Identifying ions','Use chemical tests to identify ions in unknown single ionic compounds.'],['RP8','Water purification','Analyse and purify water samples.']]
};

/* ============ BIOLOGY content pack (GCSE, Edexcel 1BI0 / AQA 8461) ============ */
const BIO = {
 name:'Biology', code:'biology', edx:'Edexcel (1BI0)', aqa:'AQA (8461)',
 tools:['trigger','miscquiz','explorer','counterfactual','misconceptions','contrast','models','analogies','spec'],
 DIAG_TOPICS:['Cell biology','Transport (diffusion/osmosis)','Organisation & enzymes','Circulation & blood','Disease & immunity','Bioenergetics (photo/resp)','Homeostasis & nervous system','Hormones','Inheritance & genetics','Variation & evolution','Ecology','Other'],
 MIS:[
  {t:'Osmosis is just diffusion',topic:'Transport (diffusion/osmosis)',wrong:'Osmosis and diffusion are the same thing.',right:'Osmosis is specifically the movement of WATER across a partially permeable membrane, from high water potential (dilute) to low (concentrated). Diffusion is any particle spreading from high to low concentration. All osmosis is special; not all diffusion is osmosis.',ana:'Osmosis is a one-lane bridge only water can cross; diffusion is an open field anything can wander across.',tell:'Osmosis = water + a partially permeable membrane. Diffusion = any particle, no membrane required.'},
  {t:'Diffusion and osmosis need energy',topic:'Transport (diffusion/osmosis)',wrong:'Cells must spend energy to make substances diffuse in.',right:'Diffusion and osmosis are PASSIVE — they happen down a concentration gradient with no energy from the cell. Only active transport (moving substances AGAINST the gradient) requires energy from respiration.',ana:'A ball rolling downhill needs no push; pushing it uphill (active transport) costs effort.',tell:'Down the gradient = passive (free). Against the gradient = active transport (costs ATP).'},
  {t:'Plants do not respire',topic:'Bioenergetics (photo/resp)',wrong:'Plants photosynthesise instead of respiring.',right:'Plants respire 24 hours a day, just like animals, to release energy from glucose. In daylight they ALSO photosynthesise, usually faster than they respire — but respiration never stops.',ana:'A factory that makes its own electricity still uses electricity around the clock.',tell:'Plants respire all the time AND photosynthesise in light. Both, not either/or.'},
  {t:'Plants get most of their mass from the soil',topic:'Bioenergetics (photo/resp)',wrong:'A tree\'s mass comes mainly from minerals in the soil.',right:'Most of a plant\'s mass is built from CARBON DIOXIDE in the air, fixed into glucose by photosynthesis. The soil supplies water and small amounts of mineral ions, not the bulk of the mass.',ana:'A tree is mostly "solidified air" — carbon pulled from the sky.',tell:'Plant mass comes mainly from CO₂ (air) via photosynthesis, not from soil.'},
  {t:'Arteries always carry oxygenated blood',topic:'Circulation & blood',wrong:'Arteries carry oxygenated blood, veins carry deoxygenated.',right:'Arteries carry blood AWAY from the heart; veins carry blood TOWARDS it. Usually arteries are oxygenated, but the pulmonary artery carries deoxygenated blood to the lungs and the pulmonary vein carries oxygenated blood back.',ana:'"Artery = away" is the rule; oxygen content is a usually-true side effect, not the definition.',tell:'Artery = away from heart, vein = towards. Pulmonary vessels are the exceptions to the oxygen rule.'},
  {t:'Antibiotics kill viruses',topic:'Disease & immunity',wrong:'You take antibiotics to fight a cold or flu.',right:'Antibiotics only kill BACTERIA — they target bacterial structures viruses do not have. Viruses (colds, flu, COVID) are unaffected; overusing antibiotics for them drives antibiotic resistance.',ana:'A key cut for a bacterial lock simply does not fit a virus.',tell:'Antibiotics = bacteria only. Viruses need antivirals or the immune system/vaccines.'},
  {t:'Vaccines give you the disease',topic:'Disease & immunity',wrong:'A vaccine infects you with the illness to build immunity.',right:'A vaccine contains a dead or weakened (or part of a) pathogen — enough for your white blood cells to make antibodies and memory cells, but not enough to cause the disease. You become immune without being ill.',ana:'A wanted poster lets police recognise a criminal without the crime happening first.',tell:'Vaccine = harmless version triggers memory cells; you gain immunity, not the disease.'},
  {t:'The dominant allele is the most common one',topic:'Inheritance & genetics',wrong:'Dominant means the allele most people have.',right:'Dominant just means the allele that is EXPRESSED when present (only one copy needed). It has nothing to do with how common it is — a dominant allele (e.g. polydactyly) can be rare; a recessive one (e.g. blue eyes in some populations) can be common.',ana:'The louder speaker in a duet is heard whether or not most songs use that voice.',tell:'Dominant = shows up with one copy. Frequency in the population is unrelated.'},
  {t:'Individuals evolve during their lifetime',topic:'Variation & evolution',wrong:'An organism evolves by changing itself to suit its environment.',right:'Individuals do not evolve — POPULATIONS do, over generations. Those with advantageous inherited variations survive and reproduce more, so the helpful alleles become more common. The individual stays as it was born.',ana:'One runner does not get faster mid-race; over many generations the fastest line of runners comes to dominate.',tell:'Evolution = change in allele frequencies across a population over generations, not within one individual.'},
  {t:'"Survival of the fittest" means the strongest survive',topic:'Variation & evolution',wrong:'Evolution favours the biggest, strongest animals.',right:'"Fittest" means best SUITED to the environment and most able to survive AND reproduce — which might mean best camouflaged, most disease-resistant, or best at attracting a mate, not strongest.',ana:'In a desert the "fittest" cactus stores water best — strength is irrelevant.',tell:'Fitness = reproductive success in that environment, not physical strength.'},
  {t:'All mutations are harmful',topic:'Variation & evolution',wrong:'A mutation always damages an organism.',right:'Most mutations are neutral (no effect), some are harmful, and a few are beneficial. Beneficial mutations are the raw material of evolution — they can spread through a population by natural selection.',ana:'A random typo usually does nothing, sometimes ruins a sentence, and occasionally improves it.',tell:'Mutations are random: mostly neutral, occasionally harmful, rarely beneficial — and the beneficial ones drive evolution.'},
  {t:'Enzymes are alive and can be killed',topic:'Organisation & enzymes',wrong:'High temperature kills enzymes.',right:'Enzymes are PROTEINS, not living things. Heat or extreme pH DENATURES them — it changes the shape of the active site so the substrate no longer fits. They are denatured, not "killed".',ana:'Melting a key out of shape stops it opening a lock — the key was never alive.',tell:'Enzymes are proteins. They denature (change shape), they don\'t die.'},
  {t:'Respiration only happens at night, photosynthesis only in the day',topic:'Bioenergetics (photo/resp)',wrong:'Plants swap: photosynthesis by day, respiration by night.',right:'Respiration happens CONTINUOUSLY, day and night, in all living cells. Photosynthesis only happens in light. During the day a plant does both; at night, only respiration.',ana:'A shop that generates power in daylight still draws power 24/7 to run its tills.',tell:'Respiration: always. Photosynthesis: light only. They overlap in daylight.'},
  {t:'Breathing and respiration are the same thing',topic:'Bioenergetics (photo/resp)',wrong:'Respiration is just breathing in and out.',right:'Breathing (ventilation) is the physical movement of air into and out of the lungs. Respiration is the chemical release of energy from glucose inside every cell. Breathing supplies the oxygen respiration uses.',ana:'Breathing is delivering fuel to the building; respiration is the engine burning it inside.',tell:'Breathing = gas exchange/ventilation. Respiration = energy release in cells. Don\'t confuse them.'},
  {t:'DNA, genes and chromosomes are interchangeable',topic:'Inheritance & genetics',wrong:'Gene, chromosome and DNA all mean the same thing.',right:'DNA is the molecule; a gene is a short section of DNA coding for a protein; a chromosome is a long coiled length of DNA carrying many genes. Nested scales: DNA → gene → chromosome → genome.',ana:'Letters (DNA) form words (genes) printed on pages (chromosomes) in a whole book (genome).',tell:'DNA = molecule; gene = section coding a protein; chromosome = many genes coiled up.'},
  {t:'Acquired characteristics are inherited',topic:'Variation & evolution',wrong:'If you build muscle or a giraffe stretches its neck, the offspring inherit it.',right:'Only changes to the DNA in gametes (sex cells) are inherited. Characteristics gained during life (muscles, scars, a stretched neck) are not passed on — that is the discredited Lamarckian idea.',ana:'Editing one printed copy of a book does not change the master file future copies are printed from.',tell:'Only gamete DNA is inherited. Lifestyle/acquired traits are not passed on.'},
  {t:'White blood cells "eat" all germs the same way',topic:'Disease & immunity',wrong:'White blood cells just swallow every pathogen.',right:'There are different mechanisms: phagocytes engulf (phagocytosis) pathogens; lymphocytes produce specific antibodies that lock onto a particular pathogen, and antitoxins that neutralise toxins. Specific antibodies give lasting memory.',ana:'Some guards tackle any intruder; others issue a unique warrant for one specific suspect.',tell:'Phagocytes engulf generally; lymphocytes make specific antibodies (and memory cells).'},
  {t:'Energy is recycled along a food chain',topic:'Ecology',wrong:'Energy cycles round an ecosystem like nutrients do.',right:'Energy FLOWS one way and is lost at each trophic level (as heat from respiration, movement, undigested waste). Only about 10% transfers to the next level — which is why food chains are short. Nutrients (carbon, nitrogen) cycle; energy does not.',ana:'Money passed along a chain shrinks at each hand-off (everyone takes a cut); it never loops back.',tell:'Energy flows and is lost (~90%) per level. Matter cycles; energy does not.'},
  {t:'The nervous and hormonal systems work at the same speed',topic:'Homeostasis & nervous system',wrong:'Nerves and hormones respond identically.',right:'Nervous responses are fast, short-lived and act on a precise target (electrical impulses). Hormonal responses are slower, longer-lasting and often act on several organs (chemicals in the blood). Different speed and duration.',ana:'A phone call (nerve: fast, direct) vs a posted letter to many people (hormone: slow, widespread).',tell:'Nerves = fast, brief, targeted. Hormones = slow, lasting, widespread.'},
  {t:'Insulin removes sugar from the body',topic:'Hormones',wrong:'Insulin gets rid of glucose.',right:'Insulin LOWERS blood glucose by making the liver and muscles take it in and store it as glycogen — it does not remove it from the body. Glucagon raises blood glucose by reversing this. The pair keep glucose steady (homeostasis).',ana:'Insulin tells the warehouse to stock the surplus away, not to throw it out.',tell:'Insulin stores glucose as glycogen (lowers blood sugar); glucagon releases it. Negative feedback.'},
  {t:'Deoxygenated blood is blue',topic:'Circulation & blood',wrong:'Blood low in oxygen is actually blue.',right:'All blood is red — deoxygenated blood is a darker, duller red. Veins look blue through the skin due to how light scatters, but the blood inside is not blue.',ana:'Deep water looks blue from above, but a glassful is clear — appearance ≠ the real colour.',tell:'Blood is always red (darker when deoxygenated). Veins only LOOK blue through skin.'},
  {t:'Bacteria and viruses are basically the same',topic:'Disease & immunity',wrong:'Bacteria and viruses are two words for germs.',right:'Bacteria are living cells that can reproduce on their own (and can be killed by antibiotics). Viruses are not cells — they hijack a host cell to reproduce and are much smaller. Different structure, different treatment.',ana:'A bacterium is a self-running machine; a virus is a USB stick that needs your computer to do anything.',tell:'Bacteria = living cells (antibiotics work). Viruses = non-living, need a host (antibiotics don\'t work).'}
 ],
 ANA:[
  {topic:'Transport (diffusion/osmosis)',k:'Osmosis = water levelling out',v:'Water moves across a partially permeable membrane from where it is plentiful (dilute solution) to where it is scarce (concentrated solution), trying to even out — no energy needed.'},
  {topic:'Transport (diffusion/osmosis)',k:'Active transport = pumping uphill',v:'To absorb mineral ions when there is already more inside than outside, root cells must pump them AGAINST the gradient — like pumping water uphill, which costs energy from respiration.'},
  {topic:'Organisation & enzymes',k:'Enzymes = lock and key',v:'Each enzyme has an active site shaped to fit one substrate, like a lock fitting one key. Heat or wrong pH warps the lock (denaturing) so the key no longer fits.'},
  {topic:'Bioenergetics (photo/resp)',k:'Photosynthesis = building with sunlight',v:'Plants use light energy to combine CO₂ and water into glucose (storing energy) and release oxygen. It is the reverse of respiration — building a fuel rather than burning it.'},
  {topic:'Bioenergetics (photo/resp)',k:'Respiration = burning fuel for energy',v:'Every cell breaks glucose down (with oxygen, aerobically) to release energy for life processes, producing CO₂ and water. It runs constantly in all living things.'},
  {topic:'Circulation & blood',k:'Double circulation = two loops',v:'Blood passes through the heart twice per circuit: one loop to the lungs to collect oxygen, one loop to the body to deliver it. Two pumps in one heart keep the pressure high.'},
  {topic:'Disease & immunity',k:'Immune memory = a wanted poster',v:'After meeting a pathogen, the body keeps memory cells. Next time, antibodies are made so fast you do not get ill — this is what vaccines set up in advance.'},
  {topic:'Homeostasis & nervous system',k:'Homeostasis = a thermostat',v:'The body detects a change from the set point and triggers a correction that reverses it (negative feedback) — like a thermostat switching heating on when it gets too cold and off when warm.'},
  {topic:'Homeostasis & nervous system',k:'Reflex arc = a shortcut',v:'In a reflex, the signal goes sensory → relay (spinal cord) → motor neurone without waiting for the brain, so you pull back from a pin instantly. Speed matters more than thought.'},
  {topic:'Inheritance & genetics',k:'DNA = a recipe book',v:'Genes are recipes (for proteins) written in the DNA code; chromosomes are the chapters; the whole genome is the book. Cells read the recipes they need to build the body.'},
  {topic:'Inheritance & genetics',k:'Meiosis = shuffling the deck',v:'Meiosis makes gametes with half the chromosomes and shuffles the genes, so offspring are genetically varied. Fertilisation deals two half-decks back into a full set.'},
  {topic:'Variation & evolution',k:'Natural selection = nature filtering',v:'Random variation throws up differences; the environment "selects" those that survive and reproduce best, so their alleles become more common over generations. No intent — just a filter.'},
  {topic:'Variation & evolution',k:'Selective breeding = a speeded-up version',v:'Humans choose which organisms breed (most milk, biggest fruit), doing on purpose and fast what nature does slowly — concentrating useful alleles over generations.'},
  {topic:'Ecology',k:'Food chain = energy losing value',v:'Energy enters via photosynthesis and is passed up trophic levels, but ~90% is lost at each step (heat, movement, waste). That is why there are few top predators.'},
  {topic:'Ecology',k:'Carbon cycle = borrowing and returning',v:'Carbon moves between air, living things and the ground: photosynthesis takes CO₂ in, respiration and combustion return it. Balance keeps atmospheric CO₂ steady — burning fossil fuels tips it.'},
  {topic:'Organisation & enzymes',k:'Surface area = more doors',v:'Exchange surfaces (alveoli, villi, root hairs) are folded and thin to maximise area and minimise distance — more "doorways" for diffusion means faster exchange.'},
  {topic:'Hormones',k:'Insulin & glucagon = a balancing pair',v:'When blood glucose rises, insulin stores it as glycogen; when it falls, glucagon releases glucose. The opposing pair holds blood sugar near a set point.'},
  {topic:'Disease & immunity',k:'Pathogens = different kinds of invader',v:'Bacteria, viruses, fungi and protists all cause disease in different ways. Knowing which type matters: antibiotics tackle bacteria, but not viruses.'}
 ],
 TRIG:[
  {s:'A potato cylinder placed in pure water gets heavier and firmer; one in strong salt solution gets lighter and floppy.',mode:'multi',opts:[{t:'Osmosis',c:1},{t:'Water moving across a membrane',c:1},{t:'Passive (no energy)',c:1},{t:'Active transport',c:0}],why:'Water moves by osmosis across the cell membranes: into cells in pure water (firmer), out of cells in salt solution (floppy). It is passive — down the water-potential gradient.'},
  {s:'Root hair cells take in mineral ions even though there is already a higher concentration inside the cell.',mode:'multi',opts:[{t:'Active transport',c:1},{t:'Against the concentration gradient',c:1},{t:'Requires energy from respiration',c:1},{t:'Diffusion',c:0}],why:'Absorbing ions against the gradient is active transport, which uses energy (ATP) from respiration. Diffusion only works down a gradient.'},
  {s:'A patient with a sore throat is prescribed antibiotics; a patient with flu is told to rest and is given no antibiotics.',mode:'multi',opts:[{t:'Bacteria vs viruses',c:1},{t:'Antibiotics kill bacteria only',c:1},{t:'Avoiding antibiotic resistance',c:1},{t:'Antibiotics cure flu',c:0}],why:'A bacterial throat infection responds to antibiotics; flu is viral, so antibiotics would not help and overuse breeds resistance.'},
  {s:'After a meal, blood glucose rises, then falls back to normal within an hour.',mode:'multi',opts:[{t:'Homeostasis',c:1},{t:'Insulin released',c:1},{t:'Negative feedback',c:1},{t:'Glucose was destroyed',c:0}],why:'Rising glucose triggers insulin, which makes the liver/muscles store glucose as glycogen, returning blood glucose to its set point — classic negative feedback.'},
  {s:'You touch a hot plate and your hand jerks away before you consciously feel the pain.',mode:'multi',opts:[{t:'Reflex action',c:1},{t:'Sensory → relay → motor pathway',c:1},{t:'Protective and fast',c:1},{t:'A conscious decision',c:0}],why:'A reflex arc routes the signal through the spinal cord (sensory → relay → motor) without waiting for the brain, so the response is fast and automatic.'},
  {s:'A green plant sealed in a jar in the dark produces carbon dioxide; in bright light it produces oxygen.',mode:'multi',opts:[{t:'Respiration occurs in the dark',c:1},{t:'Photosynthesis dominates in light',c:1},{t:'Both processes occur',c:1},{t:'Plants only photosynthesise',c:0}],why:'In the dark only respiration occurs (CO₂ out). In bright light, photosynthesis exceeds respiration so there is a net release of oxygen — but respiration never stops.'},
  {s:'Over decades, a population of moths becomes mostly dark-coloured after soot blackens the tree bark they rest on.',mode:'multi',opts:[{t:'Natural selection',c:1},{t:'Variation + selection pressure',c:1},{t:'Change in allele frequency',c:1},{t:'Individual moths turned dark',c:0}],why:'Dark moths are better camouflaged on sooty bark, so they survive and reproduce more; the dark allele becomes more common across the population. Individuals do not change colour.'},
  {s:'The lining of the small intestine is covered in millions of tiny finger-like projections.',mode:'multi',opts:[{t:'Large surface area for absorption',c:1},{t:'Adaptation of an exchange surface',c:1},{t:'Faster diffusion of nutrients',c:1},{t:'To slow food down',c:0}],why:'Villi hugely increase surface area and are thin with a good blood supply, maximising the rate of diffusion/absorption of digested food into the blood.'},
  {s:'A child is injected with a weakened form of a virus and does not fall ill, but is protected when exposed years later.',mode:'multi',opts:[{t:'Vaccination',c:1},{t:'Memory cells formed',c:1},{t:'Immune response without disease',c:1},{t:'The vaccine gave them the disease',c:0}],why:'The vaccine triggers white blood cells to make antibodies and memory cells without causing illness, so a later real infection is destroyed quickly.'},
  {s:'A tall pea plant crossed with another tall plant produces some short offspring.',mode:'multi',opts:[{t:'Recessive allele',c:1},{t:'Both parents were heterozygous (Tt)',c:1},{t:'Genetic inheritance',c:1},{t:'A mutation in the offspring',c:0}],why:'Both tall parents must carry a hidden recessive (short) allele (Tt × Tt); a 1-in-4 chance gives a short (tt) offspring. The short allele was carried, not newly mutated.'},
  {s:'A fox in the Arctic has small ears and thick white fur; a fox in the desert has large ears and thin sandy fur.',mode:'multi',opts:[{t:'Adaptation',c:1},{t:'Natural selection over generations',c:1},{t:'Suited to the environment',c:1},{t:'The foxes chose their features',c:0}],why:'Each population evolved features suited to its environment (heat retention vs heat loss, camouflage) through natural selection — not by individual choice.'},
  {s:'Cutting down a forest reduces the number of species living there.',mode:'multi',opts:[{t:'Loss of biodiversity',c:1},{t:'Habitat destruction',c:1},{t:'Human impact on ecosystems',c:1},{t:'No effect on the ecosystem',c:0}],why:'Removing habitat reduces the variety of organisms (biodiversity), which can destabilise the ecosystem and break food webs.'}
 ],
 QUIZ:[
  {_mt:'Osmosis is just diffusion',q:'Water moves into a plant cell through its membrane. Which process is this?',opts:[{t:'Osmosis',c:1},{t:'Diffusion',c:0},{t:'Active transport',c:0}],feels:'Water spreading out looks just like ordinary diffusion.',soc:['Is it specifically WATER moving, and is it crossing a membrane?','What is the special name for water moving across a partially permeable membrane?','So is this diffusion in general, or the specific case called osmosis?']},
  {_mt:'Plants get most of their mass from the soil',q:'A tree gains hundreds of kilograms as it grows. Where does most of that mass come from?',opts:[{t:'Carbon dioxide from the air',c:1},{t:'Minerals from the soil',c:0},{t:'Water alone',c:0}],feels:'Plants grow IN soil, so it feels like the soil must build them.',soc:['Which raw material does photosynthesis turn into glucose — soil, or CO₂ and water?','Where does that carbon dioxide come from?','So is the bulk of a tree built from soil, or from carbon taken out of the air?']},
  {_mt:'Antibiotics kill viruses',q:'You have a viral cold. Will antibiotics help?',opts:[{t:'No — antibiotics only work on bacteria',c:1},{t:'Yes — they kill all germs',c:0},{t:'Yes, but slowly',c:0}],feels:'Antibiotics are "germ killers", so they feel like they should work on a cold.',soc:['Do antibiotics target bacterial structures or viral ones?','Is a cold caused by a bacterium or a virus?','So will antibiotics affect the virus causing your cold?']},
  {_mt:'The dominant allele is the most common one',q:'A dominant allele in a population is found in only 1% of people. Is that possible?',opts:[{t:'Yes — dominance is about expression, not frequency',c:1},{t:'No — dominant means most common',c:0},{t:'Only if it mutates',c:0}],feels:'"Dominant" sounds like "in charge / most of them".',soc:['Does "dominant" describe how COMMON an allele is, or whether it SHOWS when present?','How many copies of a dominant allele are needed for it to be expressed?','So can a dominant allele be rare in a population?']},
  {_mt:'Individuals evolve during their lifetime',q:'A giraffe stretches for high leaves all its life. Will its offspring be born with longer necks because of this?',opts:[{t:'No — only inherited variation passes on',c:1},{t:'Yes — the stretching is inherited',c:0},{t:'Yes, after several stretches',c:0}],feels:'It seems fair that effort during life should be passed down.',soc:['Is a neck stretched by use a change to the DNA in the gametes?','Can characteristics gained during life be inherited?','So does the population change by individuals stretching, or by those born with longer necks surviving better?']},
  {_mt:'Enzymes are alive and can be killed',q:'An enzyme stops working after being heated to 80 °C. What happened to it?',opts:[{t:'It was denatured — its active site changed shape',c:1},{t:'It was killed',c:0},{t:'It dissolved',c:0}],feels:'Saying it was "killed" by heat feels natural.',soc:['Is an enzyme a living organism, or a protein molecule?','What does heat do to the SHAPE of the active site?','If the substrate no longer fits, is the enzyme dead — or denatured?']},
  {_mt:'Arteries always carry oxygenated blood',q:'Which blood vessel carries DEOXYGENATED blood away from the heart?',opts:[{t:'The pulmonary artery',c:1},{t:'There isn\'t one — all arteries are oxygenated',c:0},{t:'The aorta',c:0}],feels:'"Artery = oxygen-rich" is a tidy rule that mostly holds.',soc:['What actually defines an artery — its oxygen content, or its direction (away from the heart)?','Where does the pulmonary artery take blood, and is that blood going TO get oxygen?','So is every artery oxygenated?']},
  {_mt:'Respiration only happens at night, photosynthesis only in the day',q:'When does respiration occur in a plant?',opts:[{t:'All the time, day and night',c:1},{t:'Only at night',c:0},{t:'Only when not photosynthesising',c:0}],feels:'It seems efficient for a plant to "switch" between the two.',soc:['Do living cells ever stop needing energy?','Which process releases that energy from glucose?','So does respiration pause during the day, or run continuously?']},
  {_mt:'Energy is recycled along a food chain',q:'Why are food chains rarely more than four or five links long?',opts:[{t:'~90% of energy is lost at each level',c:1},{t:'Energy is recycled so it runs out',c:0},{t:'Top predators are too lazy to hunt',c:0}],feels:'It seems like energy should keep cycling round like nutrients.',soc:['Is energy lost as heat, movement and waste at each level?','If only ~10% passes on each time, how much reaches the fifth level?','So is there enough energy left to support many more links?']},
  {_mt:'Insulin removes sugar from the body',q:'What does insulin actually do when blood glucose is high?',opts:[{t:'Makes the liver/muscles store glucose as glycogen',c:1},{t:'Destroys the excess glucose',c:0},{t:'Removes glucose in urine',c:0}],feels:'Insulin "deals with" high sugar, so "removes it" sounds right.',soc:['Does insulin get rid of glucose, or move it into storage?','What is the storage molecule glucose is converted into?','So is the glucose destroyed, or stored away to be used later?']}
 ],
 EQS:[
  {id:'magnification',name:'Magnification',form:'magnification = image size ÷ actual size',unit:'×',vars:[{s:'i',label:'image size',min:1,max:200,step:1,val:50,unit:'mm'},{s:'a',label:'actual size',min:0.01,max:50,step:0.01,val:0.5,unit:'mm'}],calc:v=>v.i/v.a,insight:'Rearrange to find any of the three. Keep units the same on top and bottom. A 0.5 mm cell drawn 50 mm wide is magnified ×100.',predict:{q:'For the same actual size, a bigger image means the magnification is…',opts:['higher','lower','unchanged'],a:0}},
  {id:'bmi',name:'Body mass index',form:'BMI = mass ÷ height²',unit:'kg/m²',vars:[{s:'m',label:'mass',min:30,max:150,step:1,val:70,unit:'kg'},{s:'h',label:'height',min:1.2,max:2.1,step:0.01,val:1.75,unit:'m'}],calc:v=>v.m/(v.h*v.h),insight:'BMI relates mass to height² to estimate whether weight is healthy for height. Note the height is squared, so small height changes matter a lot.',predict:{q:'Two people of equal mass; the taller one has a BMI that is…',opts:['lower','higher','the same'],a:0}},
  {id:'rate_reaction_bio',name:'Rate of reaction (enzymes)',form:'rate = amount ÷ time',unit:'/s',vars:[{s:'q',label:'product formed',min:0,max:100,step:1,val:30,unit:'cm³'},{s:'t',label:'time taken',min:1,max:120,step:1,val:60,unit:'s'}],calc:v=>v.q/v.t,insight:'Enzyme-controlled rates peak at an optimum temperature and pH; too hot or wrong pH denatures the enzyme and the rate crashes.',predict:{q:'The same amount of product forms in half the time. The rate has…',opts:['doubled','halved','stayed the same'],a:0}},
  {id:'pop_estimate',name:'Population estimate (quadrats)',form:'total = mean per quadrat × total area ÷ quadrat area',unit:'',vars:[{s:'mean',label:'mean count per quadrat',min:0,max:50,step:1,val:6,unit:''},{s:'A',label:'total area',min:1,max:1000,step:1,val:200,unit:'m²'},{s:'q',label:'quadrat area',min:0.25,max:4,step:0.25,val:1,unit:'m²'}],calc:v=>v.mean*v.A/v.q,insight:'Sampling with quadrats estimates a whole population without counting every organism — scale the mean per quadrat up to the full area.',predict:{q:'Double the total field area (same mean per quadrat). The estimated population…',opts:['doubles','halves','is unchanged'],a:0}},
  {id:'percent_change_mass',name:'Percentage change in mass (osmosis)',form:'% change = (change ÷ start) × 100',unit:'%',vars:[{s:'c',label:'mass change',min:-5,max:5,step:0.1,val:0.6,unit:'g'},{s:'s',label:'starting mass',min:0.1,max:20,step:0.1,val:5,unit:'g'}],calc:v=>v.c/v.s*100,insight:'Used in the osmosis required practical. A positive value means water moved in (dilute surroundings); negative means water left (concentrated surroundings).',predict:{q:'A potato chip in concentrated salt solution shows a percentage change that is…',opts:['negative (lost mass)','positive (gained mass)','zero'],a:0}},
  {id:'breathing_rate',name:'Breathing / ventilation rate',form:'rate = breaths ÷ time',unit:'/min',vars:[{s:'b',label:'breaths counted',min:1,max:60,step:1,val:15,unit:''},{s:'t',label:'time',min:0.5,max:5,step:0.5,val:1,unit:'min'}],calc:v=>v.b/v.t,insight:'During exercise, breathing and heart rate rise to supply more oxygen and remove CO₂ faster, meeting the higher demand of respiring muscle.',predict:{q:'During hard exercise, the breathing rate compared with rest is…',opts:['higher','lower','unchanged'],a:0}}
 ],
 CF:[
  {topic:'Transport (diffusion/osmosis)',o:'A cell sits in a solution with the same concentration as its cytoplasm; its size is stable.',f:'What if you moved it into pure water?',r:'Water would enter by osmosis. An animal cell could burst (lysis); a plant cell would become turgid but be saved by its rigid cell wall.'},
  {topic:'Bioenergetics (photo/resp)',o:'A plant in good light grows steadily.',f:'What if you raised the CO₂ level but kept light the same?',r:'Growth would speed up only until light (or temperature) became the limiting factor — then adding more CO₂ would make no further difference. The slowest factor sets the rate.'},
  {topic:'Disease & immunity',o:'A vaccinated population is protected from a disease.',f:'What if vaccination rates fell below the herd-immunity threshold?',r:'Outbreaks could return, because there are enough unvaccinated hosts for the pathogen to spread between — herd immunity protects even the unvaccinated only while coverage is high.'},
  {topic:'Homeostasis & nervous system',o:'Blood glucose rises after a meal and is corrected.',f:'What if the pancreas could not make insulin (Type 1 diabetes)?',r:'Blood glucose would stay dangerously high because cells could not take it up to store it. It must be controlled by injecting insulin and managing diet.'},
  {topic:'Variation & evolution',o:'A bacterial infection is treated and clears up.',f:'What if a few bacteria carried a resistance mutation?',r:'Those survive the antibiotic and reproduce, so the population becomes resistant. Overusing antibiotics selects for resistance — exactly how superbugs arise.'},
  {topic:'Ecology',o:'A stable food web has predators and prey in balance.',f:'What if the top predator were removed?',r:'Prey numbers could explode, overgraze the producers and crash the whole web. Removing one species can destabilise many — ecosystems are interconnected.'},
  {topic:'Inheritance & genetics',o:'Two carriers of a recessive condition (Cc × Cc) have children.',f:'What is the chance each child is affected?',r:'1 in 4 (cc). Carriers show no symptoms but can pass the allele on; only inheriting two recessive alleles gives the condition.'},
  {topic:'Circulation & blood',o:'The heart pumps blood around a double circulation.',f:'What if humans had a single circulation like a fish?',r:'Blood pressure would drop after passing the gills/lungs, so delivery to the body would be slower. The double loop re-pressurises blood, supporting a high metabolic rate.'},
  {topic:'Organisation & enzymes',o:'An enzyme works fastest at 37 °C.',f:'What if you raised the temperature to 60 °C?',r:'The rate would fall sharply: the active site denatures (changes shape) so the substrate no longer fits. Beyond the optimum, more heat harms, not helps.'},
  {topic:'Bioenergetics (photo/resp)',o:'Muscles respire aerobically during gentle exercise.',f:'What if you sprinted and ran out of oxygen?',r:'Muscles switch to anaerobic respiration, producing lactic acid and far less energy per glucose. The lactic acid builds an oxygen debt repaid by panting afterwards.'}
 ],
 CONTRAST:[
  {a:'Diffusion',b:'Active transport',topic:'Transport (diffusion/osmosis)',rows:[['Direction','high → low concentration','low → high (against gradient)'],['Energy','none (passive)','needs ATP from respiration'],['Carrier proteins','not required','required'],['Example','oxygen into blood','mineral ions into root hairs']],confusion:'Both move substances across membranes, but only one goes "uphill" and costs energy.',tell:'Down the gradient = diffusion (free). Against it = active transport (costs energy).'},
  {a:'Mitosis',b:'Meiosis',topic:'Inheritance & genetics',rows:[['Purpose','growth & repair','making gametes'],['Daughter cells','2','4'],['Chromosomes','same as parent (diploid)','half (haploid)'],['Genetically','identical','varied'],['Where','body cells','reproductive organs']],confusion:'Both are cell division, but one copies and one halves & shuffles.',tell:'Mitosis = 2 identical diploid cells (growth). Meiosis = 4 varied haploid gametes.'},
  {a:'Photosynthesis',b:'Respiration',topic:'Bioenergetics (photo/resp)',rows:[['Energy','stores it (in glucose)','releases it'],['Gases','CO₂ in, O₂ out','O₂ in, CO₂ out'],['Where','chloroplasts','mitochondria'],['When','light only','all the time'],['Who','plants/algae','all living cells']],confusion:'They look like opposites and use the same molecules, so they get swapped.',tell:'Photosynthesis builds glucose using light; respiration breaks it down for energy. Opposite directions.'},
  {a:'Arteries',b:'Veins',topic:'Circulation & blood',rows:[['Direction','away from heart','towards heart'],['Walls','thick, muscular, elastic','thinner'],['Pressure','high','low'],['Valves','none','present (prevent backflow)'],['Usually carries','oxygenated*','deoxygenated*']],confusion:'The oxygen rule has exceptions (pulmonary vessels); the direction rule does not.',tell:'Artery = away (high pressure). Vein = towards (valves). *Pulmonary vessels reverse the oxygen rule.'},
  {a:'Bacteria',b:'Viruses',topic:'Disease & immunity',rows:[['Living?','living cells','not cells'],['Reproduce','on their own','only inside a host cell'],['Size','larger','much smaller'],['Antibiotics','can kill them','no effect'],['Example','tuberculosis','influenza, COVID']],confusion:'Both are "germs", so treatment gets confused.',tell:'Bacteria = living cells (antibiotics work). Viruses = non-living, hijack host cells (antibiotics don\'t).'},
  {a:'Nervous response',b:'Hormonal response',topic:'Homeostasis & nervous system',rows:[['Signal','electrical impulse','chemical in blood'],['Speed','very fast','slower'],['Duration','short-lived','long-lasting'],['Target','precise','often widespread'],['Example','reflex','puberty, blood sugar']],confusion:'Both coordinate the body, but at different speeds and durations.',tell:'Nerves = fast, brief, targeted. Hormones = slow, lasting, widespread.'},
  {a:'Dominant allele',b:'Recessive allele',topic:'Inheritance & genetics',rows:[['Shows when','one copy present','two copies needed'],['Written','capital (B)','lowercase (b)'],['Masks?','masks recessive','masked by dominant'],['Carrier?','—','can be carried unseen (Bb)']],confusion:'"Dominant" is wrongly read as "most common".',tell:'Dominant = expressed with one copy. Recessive = needs two copies; can hide as a carrier.'},
  {a:'Aerobic respiration',b:'Anaerobic respiration',topic:'Bioenergetics (photo/resp)',rows:[['Oxygen','required','none'],['Energy released','large amount','much less'],['Products (animals)','CO₂ + water','lactic acid'],['Products (yeast)','—','ethanol + CO₂'],['When','normal activity','hard exercise / low O₂']],confusion:'Both release energy from glucose, but with very different efficiency and products.',tell:'Aerobic = O₂, lots of energy, CO₂+water. Anaerobic = no O₂, little energy, lactic acid (or ethanol).'},
  {a:'Communicable disease',b:'Non-communicable disease',topic:'Disease & immunity',rows:[['Caused by','pathogens','not infectious'],['Spreads?','yes (person to person)','no'],['Examples','flu, measles, TB','cancer, heart disease, diabetes'],['Prevention','hygiene, vaccines','lifestyle, screening']],confusion:'Both are "diseases", but only one is catching.',tell:'Communicable = caused by pathogens and spreads. Non-communicable = lifestyle/genetic, not infectious.'},
  {a:'Producer',b:'Consumer',topic:'Ecology',rows:[['Energy source','makes own food (photosynthesis)','eats other organisms'],['Trophic level','first','second and above'],['Example','grass, algae','rabbit, fox'],['Role','enters energy into the web','passes energy along']],confusion:'Both are organisms in a food chain, but only producers capture energy from the Sun.',tell:'Producer = makes food (plants). Consumer = eats others. Energy enters via producers.'}
 ],
 MODELS:[
  {c:'Exchange surfaces',topic:'Organisation & enzymes',model:'Substances move in and out of organisms by diffusion, osmosis and active transport across exchange surfaces. Good surfaces are large in area, thin, moist and have a good blood supply to keep the gradient steep.',wrong:['Diffusion needs energy.','A small surface works just as well.'],predict:['Folded surfaces (alveoli, villi, gills) speed exchange.','A steeper gradient means faster diffusion.','Thin walls shorten the diffusion distance.'],bound:['Active transport (against the gradient) needs energy.','Single-celled organisms manage without special surfaces (big SA:V).'],ex:['Explaining alveoli, villi and root hairs.','Why large active animals need lungs and circulation.']},
  {c:'Homeostasis & negative feedback',topic:'Homeostasis & nervous system',model:'The body keeps internal conditions (temperature, blood glucose, water) near a set point. A receptor detects a change, a coordination centre processes it, and an effector reverses it — negative feedback.',wrong:['Insulin destroys glucose.','The body holds conditions perfectly constant with no fluctuation.'],predict:['High blood glucose → insulin → storage as glycogen.','Too hot → sweating and vasodilation.','Conditions oscillate slightly around the set point.'],bound:['Type 1 diabetes breaks the glucose loop (no insulin).','Feedback corrects deviations; it doesn\'t prevent them.'],ex:['Controlling blood sugar and temperature.','Understanding diabetes.']},
  {c:'Natural selection',topic:'Variation & evolution',model:'Within a varied population, individuals best suited to the environment survive and reproduce more, passing on their alleles. Over many generations the population changes — evolution.',wrong:['Individuals evolve in their lifetime.','"Fittest" means strongest.','All mutations are harmful.'],predict:['Antibiotic overuse selects for resistant bacteria.','Camouflaged prey survive and become common.','Beneficial mutations spread; harmful ones are removed.'],bound:['Needs heritable variation and a selection pressure.','Acts on populations over generations, not individuals.'],ex:['Antibiotic resistance.','Peppered moths and Darwin\'s finches.']},
  {c:'Energy flow through ecosystems',topic:'Ecology',model:'Energy enters via producers (photosynthesis) and flows up trophic levels. About 90% is lost at each level (respiration, movement, waste), so food chains are short and biomass forms a pyramid.',wrong:['Energy is recycled like nutrients.','Energy passes on fully at each step.'],predict:['Only ~10% of energy reaches the next level.','Fewer organisms can be supported higher up.','Removing one level disrupts the whole web.'],bound:['Matter (carbon, nitrogen) cycles; energy does not.','Pyramids of biomass narrow upwards.'],ex:['Why there are few top predators.','Efficiency of eating plants vs meat.']},
  {c:'Enzymes as biological catalysts',topic:'Organisation & enzymes',model:'Enzymes are proteins with a specific active site that speeds up one reaction (lock and key). They work fastest at an optimum temperature and pH; beyond it the active site denatures.',wrong:['Enzymes are alive and can be killed.','One enzyme works on any substrate.'],predict:['Rate rises with temperature up to the optimum, then crashes.','Wrong pH denatures the enzyme.','Each enzyme is specific to its substrate.'],bound:['Denaturing (above ~40 °C) is usually permanent.','Specificity comes from the active-site shape.'],ex:['Digestion (amylase, protease, lipase).','Why fevers are dangerous.']},
  {c:'Inheritance & genetic crosses',topic:'Inheritance & genetics',model:'Genes come in alleles; offspring inherit one from each parent. Dominant alleles show with one copy, recessive need two. Punnett squares predict the ratios of offspring genotypes and phenotypes.',wrong:['Dominant = most common.','Acquired characteristics are inherited.'],predict:['Two carriers (Cc × Cc) → 1 in 4 affected.','Dominant traits appear with a single copy.','Sex is determined by XX/XY.'],bound:['Most traits are polygenic, not single-gene.','Punnett squares give probabilities, not guarantees.'],ex:['Predicting inherited disorders (cystic fibrosis).','Monohybrid crosses.']},
  {c:'Pathogens & the immune response',topic:'Disease & immunity',model:'Pathogens (bacteria, viruses, fungi, protists) cause communicable disease. White blood cells defend by engulfing pathogens, making specific antibodies, and producing antitoxins; memory cells give long-term immunity, which vaccines exploit.',wrong:['Antibiotics kill viruses.','Vaccines give you the disease.'],predict:['Antibiotics treat bacterial, not viral, infections.','A second exposure is dealt with faster (memory cells).','Vaccinating enough people gives herd immunity.'],bound:['Antibiotic overuse breeds resistance.','New strains can evade existing immunity.'],ex:['Why we vaccinate.','Why colds aren\'t treated with antibiotics.']}
 ],
 SPEC:[
  {id:'bx1',n:1,paper:'Paper 1',title:'Cell biology',pts:['Animal, plant and bacterial cells; specialisation','Microscopy and magnification','Diffusion, osmosis and active transport','Mitosis, the cell cycle and stem cells'],study:[['Concept contrasts','contrast'],['Equation explorer','explorer'],['Misconception fixes','misconceptions']]},
  {id:'bx2',n:2,paper:'Paper 1',title:'Organisation',pts:['Cells → tissues → organs → systems','Enzymes and the digestive system','The heart, blood vessels and blood','Plant tissues, transpiration and translocation'],study:[['Concept contrasts','contrast'],['Mental models','models']]},
  {id:'bx3',n:3,paper:'Paper 1',title:'Infection & response',pts:['Pathogens: bacteria, viruses, fungi, protists','Defences and the immune system','Vaccination, antibiotics and painkillers','Drug development (Edexcel: plant defences)'],study:[['Misconception fixes','misconceptions'],['Concept contrasts','contrast'],['Trigger trainer','trigger']]},
  {id:'bx4',n:4,paper:'Paper 1',title:'Bioenergetics',pts:['Photosynthesis and limiting factors','Uses of glucose','Aerobic and anaerobic respiration','Metabolism and oxygen debt'],study:[['Concept contrasts','contrast'],['Mental models','models'],['Equation explorer','explorer']]},
  {id:'bx5',n:5,paper:'Paper 2',title:'Homeostasis & response',pts:['The nervous system and reflexes','Hormones; control of blood glucose','Water and temperature regulation','Reproduction hormones; plant hormones'],study:[['Concept contrasts','contrast'],['Mental models','models']]},
  {id:'bx6',n:6,paper:'Paper 2',title:'Inheritance, variation & evolution',pts:['DNA, genes and the genome; protein synthesis (HT)','Meiosis and sexual vs asexual reproduction','Genetic inheritance and Punnett squares','Variation, evolution, selective breeding and genetic engineering'],study:[['Concept contrasts','contrast'],['Misconception fixes','misconceptions'],['Mental models','models']]},
  {id:'bx7',n:7,paper:'Paper 2',title:'Ecology',pts:['Ecosystems, interdependence and competition','Sampling, quadrats and transects','Carbon and water cycles','Biodiversity and human impact'],study:[['Equation explorer','explorer'],['Mental models','models'],['Analogy bank','analogies']]}
 ],
 AQA_SPEC:[
  {id:'baq1',n:1,pap:1,title:'Cell biology',pts:['Cell structure and specialisation; microscopy','Cell division, mitosis and stem cells','Transport: diffusion, osmosis, active transport'],study:[['Concept contrasts','contrast'],['Equation explorer','explorer']]},
  {id:'baq2',n:2,pap:1,title:'Organisation',pts:['Digestive system and enzymes','Heart, lungs, blood and blood vessels','Health, disease and lifestyle','Plant tissues and transport'],study:[['Concept contrasts','contrast'],['Mental models','models']]},
  {id:'baq3',n:3,pap:1,title:'Infection & response',pts:['Communicable diseases and pathogens','Human defences and the immune system','Vaccination, antibiotics and drug development'],study:[['Misconception fixes','misconceptions'],['Trigger trainer','trigger']]},
  {id:'baq4',n:4,pap:1,title:'Bioenergetics',pts:['Photosynthesis and limiting factors','Respiration, aerobic and anaerobic','Response to exercise and metabolism'],study:[['Concept contrasts','contrast'],['Equation explorer','explorer']]},
  {id:'baq5',n:5,pap:2,title:'Homeostasis & response',pts:['Nervous system and reflexes','Hormonal coordination and blood glucose','Maintaining water and temperature; reproduction'],study:[['Concept contrasts','contrast'],['Mental models','models']]},
  {id:'baq6',n:6,pap:2,title:'Inheritance, variation & evolution',pts:['Reproduction, DNA and the genome','Genetic inheritance and variation','Evolution, selective breeding, genetic engineering','Classification'],study:[['Misconception fixes','misconceptions'],['Concept contrasts','contrast']]},
  {id:'baq7',n:7,pap:2,title:'Ecology',pts:['Adaptations, interdependence and competition','Organisation of an ecosystem and cycles','Biodiversity and the effect of human interaction'],study:[['Mental models','models'],['Equation explorer','explorer']]}
 ],
 CPRAC:[['CP1','Microscopy','Use a light microscope to observe cells and calculate magnification.'],['CP2','Osmosis','Investigate the effect of solution concentration on the mass of plant tissue.'],['CP3','Enzymes','Investigate how pH or temperature affects enzyme (amylase) activity.'],['CP4','Food tests','Use reagents to test foods for starch, sugars, protein and lipids.'],['CP5','Photosynthesis','Investigate how light intensity affects the rate of photosynthesis.'],['CP6','Reaction time','Investigate the effect of a factor on human reaction time.'],['CP7','Plant responses','Investigate the effect of light or gravity on seedling growth.'],['CP8','Field sampling','Use quadrats and transects to study the distribution of organisms.']],
 AQA_PRAC:[['RP1','Microscopy','Use a light microscope to observe, draw and label cells; calculate magnification.'],['RP2','Osmosis','Investigate the effect of a range of concentrations on plant tissue mass.'],['RP3','Enzymes','Investigate the effect of pH on the rate of amylase activity.'],['RP4','Food tests','Use qualitative reagents to test for biological molecules.'],['RP5','Photosynthesis','Investigate the effect of light intensity on photosynthesis.'],['RP6','Reaction time','Plan and carry out an investigation into human reaction time.'],['RP7','Field investigation','Measure the population size and distribution of a species using sampling.'],['RP8','Decay','Investigate the effect of temperature on the rate of decay (Biology only).']]
};

/* ============ MATHS content pack (GCSE, Edexcel 1MA1 / AQA 8300) ============ */
const MATHS = {
 name:'Maths', code:'maths', edx:'Edexcel (1MA1)', aqa:'AQA (8300)',
 tools:['trigger','miscquiz','explorer','counterfactual','misconceptions','contrast','models','analogies','spec'],
 DIAG_TOPICS:['Number','Algebra','Ratio & proportion','Geometry & measures','Trigonometry','Probability','Statistics','Other'],
 MIS:[
  {t:'Two negatives always make a positive',topic:'Number',wrong:'Any time I see two minus signs, the answer is positive — so −3 + −4 = +7.',right:'Two negatives make a positive only when MULTIPLYING or DIVIDING (−3 × −4 = +12). Adding two negatives makes a more negative number: −3 + −4 = −7. Subtracting a negative flips to adding: 5 − (−2) = 7.',ana:'Multiplying negatives = turning around twice (facing forward). Adding debts = owing even more.',tell:'"Two minuses = plus" is only for × and ÷. For + and −, track direction on a number line.'},
  {t:'(a + b)² equals a² + b²',topic:'Algebra',wrong:'To square a bracket, square each term: (a+b)² = a² + b².',right:'You must expand: (a+b)² = (a+b)(a+b) = a² + 2ab + b². The middle term 2ab is always there. Squaring a sum is not the same as summing the squares.',ana:'Building a square patio of side (a+b) gives four pieces: a², b² and TWO a×b rectangles.',tell:'Always expand brackets fully. (a+b)² = a² + 2ab + b² — never forget the 2ab.'},
  {t:'Multiplying always makes numbers bigger',topic:'Number',wrong:'Multiplying makes a number larger; dividing makes it smaller.',right:'Multiplying by a number between 0 and 1 makes it SMALLER (½ × 8 = 4); dividing by a number between 0 and 1 makes it BIGGER (8 ÷ ½ = 16). It depends on whether you multiply/divide by more or less than 1.',ana:'Multiplying by ½ is "take half" — clearly smaller, not bigger.',tell:'× by <1 shrinks; ÷ by <1 grows. The "bigger/smaller" rule only holds for numbers above 1.'},
  {t:'A percentage rise then an equal fall returns to the start',topic:'Ratio & proportion',wrong:'Up 20% then down 20% gets you back to where you began.',right:'No — the percentages act on different amounts. £100 up 20% is £120; then down 20% of £120 is £96, not £100. The fall is taken from the larger value, so you end up lower.',ana:'Climbing 20% of a small hill then descending 20% of a taller one leaves you below the start.',tell:'Percentage changes are multiplicative: ×1.2 then ×0.8 = ×0.96, not ×1.'},
  {t:'A bigger denominator means a bigger fraction',topic:'Number',wrong:'1/8 is bigger than 1/3 because 8 is bigger than 3.',right:'For the same numerator, a bigger denominator means SMALLER pieces, so a smaller fraction: 1/8 < 1/3. The denominator says how many parts the whole is split into.',ana:'A pizza shared among 8 people gives smaller slices than one shared among 3.',tell:'Bigger bottom = more, smaller pieces = smaller fraction (for equal numerators).'},
  {t:'aᵐ × aⁿ = aᵐⁿ',topic:'Algebra',wrong:'When multiplying powers, multiply the indices: a³ × a² = a⁶.',right:'You ADD the indices: a³ × a² = a⁵ (because it is a·a·a · a·a). You multiply indices only when raising a power to a power: (a³)² = a⁶.',ana:'a³ × a² is just five a\'s in a row — count them: 3 + 2 = 5.',tell:'Multiply powers → add indices. Power of a power → multiply indices.'},
  {t:'A negative index makes the number negative',topic:'Algebra',wrong:'2⁻³ is a negative number.',right:'A negative index means RECIPROCAL, not a negative value: 2⁻³ = 1/2³ = 1/8 — still positive. The minus tells you to flip, not to make it negative.',ana:'The minus is a "turn it upside down" instruction, not a "make it negative" one.',tell:'Negative index = one over (reciprocal). 2⁻³ = 1/8, a positive fraction.'},
  {t:'You can cancel any matching letters in a fraction',topic:'Algebra',wrong:'(a + b)/a cancels to b.',right:'You can only cancel a COMMON FACTOR of the WHOLE numerator and denominator. In (a+b)/a, a is not a factor of (a+b), so it cannot be cancelled. (a+b)/a = 1 + b/a.',ana:'You can split a shared cake, but you cannot delete one ingredient that is only in part of the recipe.',tell:'Only cancel factors of the entire top and bottom. Never cancel across a + or −.'},
  {t:'√(a + b) = √a + √b',topic:'Number',wrong:'The root of a sum is the sum of the roots: √(9+16) = 3+4 = 7.',right:'√(9+16) = √25 = 5, not 7. The square root does not distribute over addition. It does work for multiplication: √(a×b) = √a × √b.',ana:'You cannot un-square a total by un-squaring the parts separately.',tell:'√ distributes over × and ÷, never over + and −.'},
  {t:'Squaring a number always makes it bigger',topic:'Number',wrong:'x² is always greater than x.',right:'For 0 < x < 1, squaring makes it SMALLER (0.5² = 0.25). For x = 0 or 1 it stays the same. Only for x > 1 (or x < −1) does squaring increase the size.',ana:'Half of a half is a quarter — squaring a fraction shrinks it.',tell:'Squaring grows numbers >1 but shrinks fractions between 0 and 1.'},
  {t:'Probabilities can always just be added',topic:'Probability',wrong:'To find P(A or B), always add P(A) + P(B).',right:'You add probabilities only for MUTUALLY EXCLUSIVE events (they cannot both happen). If they can overlap, adding double-counts the overlap. For "A and B" of independent events, you MULTIPLY.',ana:'Counting people who like tea OR coffee — add the lists, but subtract those who like both, or you count them twice.',tell:'"OR" + mutually exclusive → add. "AND" + independent → multiply. Watch for overlap.'},
  {t:'To share in a ratio, divide the total by one number',topic:'Ratio & proportion',wrong:'Share £40 in the ratio 3:5 by doing 40 ÷ 3 or 40 ÷ 5.',right:'Add the ratio parts first (3 + 5 = 8), divide the total by that (40 ÷ 8 = £5 per part), then multiply: 3×5 = £15 and 5×5 = £25.',ana:'Cut the cake into the TOTAL number of equal shares first, then hand out each person\'s number of slices.',tell:'Ratio sharing: total ÷ (sum of parts) = one part, then multiply by each share.'},
  {t:'The mean is "the average" and the only one that matters',topic:'Statistics',wrong:'Average always means the mean.',right:'There are three averages: mean (add ÷ how many), median (middle when ordered) and mode (most common). The mean is distorted by outliers; the median is more robust for skewed data.',ana:'One billionaire walking into a café makes the MEAN income soar, but the MEDIAN barely moves.',tell:'Mean, median and mode are all averages. Choose by the data — outliers favour the median.'},
  {t:'Correlation means one thing causes the other',topic:'Statistics',wrong:'If two variables correlate, one must cause the other.',right:'Correlation shows a relationship, not causation. A third factor may drive both, or it may be coincidence. Ice-cream sales and drowning correlate — because of hot weather, not because ice cream causes drowning.',ana:'Two clocks ticking together aren\'t controlling each other — something else sets them both.',tell:'Correlation ≠ causation. A strong scatter trend does not prove cause.'},
  {t:'You forget to put the numbers in order before finding the median',topic:'Statistics',wrong:'The median is just the middle number as the data is written.',right:'You must ORDER the data first, then take the middle value (or the mean of the two middle values for an even count). The middle of an unordered list is meaningless.',ana:'You can\'t find the "middle height" of a line of people until you line them up by height.',tell:'Median = middle of the ORDERED data. Always sort first.'},
  {t:'Area and perimeter are interchangeable',topic:'Geometry & measures',wrong:'Bigger perimeter means bigger area, and they\'re basically the same measure.',right:'Perimeter is the distance around (a length, in cm); area is the space inside (in cm²). Two shapes can share a perimeter but have very different areas. They measure different things in different units.',ana:'The length of fence around a field (perimeter) tells you nothing exact about how much grass is inside (area).',tell:'Perimeter = distance around (units). Area = space inside (units²). Different quantities.'},
  {t:'Pythagoras works on any triangle',topic:'Trigonometry',wrong:'a² + b² = c² works for every triangle.',right:'Pythagoras\' theorem only works for RIGHT-ANGLED triangles, and c must be the hypotenuse (the longest side, opposite the right angle). For other triangles you need the sine or cosine rule.',ana:'The theorem is a tool built specifically for the right-angle corner — it does not fit other shapes.',tell:'Pythagoras: right-angled triangles only; c = hypotenuse (opposite the right angle).'},
  {t:'You can pick any side as the hypotenuse',topic:'Trigonometry',wrong:'The hypotenuse is just the bottom or the longest-looking side.',right:'The hypotenuse is always OPPOSITE the right angle and is the longest side. In SOHCAHTOA, correctly labelling opposite, adjacent and hypotenuse relative to the angle is essential.',ana:'The hypotenuse always "faces" the right angle, like the back of a deckchair facing the seat corner.',tell:'Hypotenuse = side opposite the right angle (longest). Label sides relative to the angle you use.'},
  {t:'BIDMAS is optional / you just work left to right',topic:'Number',wrong:'2 + 3 × 4 = 20 because you go left to right.',right:'Order of operations (BIDMAS/BODMAS) applies: do multiplication before addition, so 2 + 3 × 4 = 2 + 12 = 14. Brackets and indices come first, then ÷ and ×, then + and −.',ana:'Following a recipe in the wrong order ruins the dish — operations have a required sequence.',tell:'BIDMAS: Brackets, Indices, Division/Multiplication, Addition/Subtraction — not just left to right.'},
  {t:'Direct and inverse proportion are the same relationship',topic:'Ratio & proportion',wrong:'Proportion just means the variables are linked.',right:'In direct proportion, as one doubles the other doubles (y = kx, a straight line through the origin). In inverse proportion, as one doubles the other halves (y = k/x, a curve). Opposite behaviours.',ana:'Direct: more workers, more output. Inverse: more workers, less time each.',tell:'Direct: y = kx (both grow together). Inverse: y = k/x (one grows, the other shrinks).'},
  {t:'Rounding 4.5 — you always round down the 5',topic:'Number',wrong:'4.5 rounds to 4 because 5 is in the middle.',right:'The convention is to round a 5 UP, so 4.5 → 5. Also remember significant figures vs decimal places: 0.04982 to 2 s.f. is 0.050, but to 2 d.p. is 0.05.',ana:'The "5 rounds up" rule is the agreed tie-breaker, like always passing on the left.',tell:'A digit of 5 (or more) rounds up. Watch the difference between decimal places and significant figures.'},
  {t:'Speed, distance, time formulas are easy to mix up',topic:'Ratio & proportion',wrong:'Speed = time ÷ distance.',right:'Speed = distance ÷ time. Rearrange: distance = speed × time, time = distance ÷ speed. The same triangle works for density = mass ÷ volume and pressure = force ÷ area.',ana:'Cover the quantity you want in the D-S-T triangle to read off the formula.',tell:'Speed = distance ÷ time. Use the formula triangle to rearrange for any of the three.'},
  {t:'A bigger sample is biased; a small sample is fine',topic:'Statistics',wrong:'Sample size doesn\'t really matter as long as you pick "typical" people.',right:'Larger, RANDOM samples are more reliable and reduce the effect of chance. Small or non-random samples are easily biased and may not represent the population. Representativeness and size both matter.',ana:'Tasting one spoonful from a badly stirred pot can mislead; a larger, well-mixed taste is fairer.',tell:'Reliable statistics need a large enough, random, representative sample.'}
 ],
 ANA:[
  {topic:'Algebra',k:'Equations = balanced scales',v:'An equation balances two sides. Whatever you do to one side you must do to the other to keep it level — that\'s how you isolate the unknown without breaking the balance.'},
  {topic:'Algebra',k:'Expanding brackets = laying out a grid',v:'Multiplying (a+b)(c+d) is filling a 2×2 grid: every term on the left meets every term on the right. The grid method guarantees you never miss the middle terms.'},
  {topic:'Algebra',k:'Factorising = reverse-engineering',v:'Factorising undoes expanding: you look for what was multiplied together to make the expression. Spot the common factor or the pair of numbers that multiply and add correctly.'},
  {topic:'Number',k:'Fractions = slices of a whole',v:'The denominator says how many equal slices the whole is cut into; the numerator says how many you take. Common denominators just cut both into the same-sized slices so you can compare or add.'},
  {topic:'Ratio & proportion',k:'Ratio = a recipe',v:'A ratio fixes the proportions, not the amounts: 3:5 is like a recipe with 3 parts to 5 parts. Scale the whole recipe up or down, but keep the parts in the same proportion.'},
  {topic:'Ratio & proportion',k:'Percentages = multipliers',v:'A 15% rise is a ×1.15 multiplier; a 15% fall is ×0.85. Chaining changes just multiplies the multipliers, which is why "+20% then −20%" lands at ×0.96, not ×1.'},
  {topic:'Trigonometry',k:'Pythagoras = the right-angle fingerprint',v:'a² + b² = c² holds only where there is a right angle, with c facing it. Think of it as a property unique to right-angled triangles — a fingerprint of that 90° corner.'},
  {topic:'Trigonometry',k:'SOHCAHTOA = matching the right ratio',v:'Each trig ratio links an angle to two sides. Label opposite, adjacent and hypotenuse relative to your angle, then pick sin, cos or tan depending on which two sides you have.'},
  {topic:'Statistics',k:'Averages = different "typical" values',v:'Mean balances the total evenly; median is the middle once lined up; mode is the most popular. Each answers "what\'s typical?" differently — outliers swing the mean but not the median.'},
  {topic:'Probability',k:'Probability = a fraction of outcomes',v:'Probability is favourable outcomes ÷ total equally likely outcomes. Tree diagrams multiply along branches (AND) and add between branches (OR) to track combined events.'},
  {topic:'Algebra',k:'Sequences = a rule machine',v:'The nth-term rule is a machine: feed in the position n and out comes the term. dn + (first term − d) captures any linear (arithmetic) sequence in one expression.'},
  {topic:'Geometry & measures',k:'Similar shapes = scaled copies',v:'Similar shapes have the same angles and sides in the same ratio (a scale factor k). Lengths scale by k, areas by k², volumes by k³ — a crucial trap in exams.'},
  {topic:'Number',k:'Standard form = a place-value shortcut',v:'Standard form writes huge or tiny numbers as a number between 1 and 10 times a power of ten. The power just records how many places the decimal point shifts.'},
  {topic:'Algebra',k:'Inequalities = a balance that can tilt',v:'Inequalities behave like equations, with one twist: multiplying or dividing by a negative flips the sign (< becomes >), because it reverses the order on the number line.'},
  {topic:'Geometry & measures',k:'Transformations = moving rules',v:'Translations slide, reflections flip, rotations turn and enlargements scale. Each is a precise rule (vector, mirror line, centre and angle, centre and scale factor) — describe it fully to score.'},
  {topic:'Ratio & proportion',k:'Compound interest = a snowball',v:'Each year\'s interest is added to the balance, so next year you earn interest on interest. The amount grows by a fixed multiplier every year — a snowball rolling downhill.'}
 ],
 TRIG:[
  {s:'You are given a right-angled triangle with the two shorter sides and need the longest side.',mode:'single',opts:[{t:'Pythagoras\' theorem',c:1},{t:'The sine rule',c:0},{t:'SOHCAHTOA with tan',c:0},{t:'Cosine rule',c:0}],why:'Two sides of a right-angled triangle and no angle (other than the right angle) → Pythagoras: c² = a² + b². Trig ratios are for when an angle is involved.'},
  {s:'A right-angled triangle gives you one angle and the hypotenuse, and you want the opposite side.',mode:'single',opts:[{t:'sin = opposite ÷ hypotenuse',c:1},{t:'Pythagoras',c:0},{t:'cos = adjacent ÷ hypotenuse',c:0},{t:'The sine rule',c:0}],why:'Opposite and hypotenuse with an angle → SOH: sin θ = opp/hyp, so opp = hyp × sin θ. Pick the ratio that uses the two sides you have.'},
  {s:'You must solve x² − 5x + 6 = 0.',mode:'multi',opts:[{t:'Factorise into (x−2)(x−3)',c:1},{t:'Quadratic formula',c:1},{t:'Completing the square',c:1},{t:'Just divide by x',c:0}],why:'A quadratic that factorises neatly is quickest by factorising, but the formula or completing the square also work. You must never divide through by x — you would lose a solution.'},
  {s:'You need to solve a pair of equations: 2x + y = 7 and x − y = 2.',mode:'multi',opts:[{t:'Elimination (add the equations)',c:1},{t:'Substitution',c:1},{t:'Trial and error only',c:0},{t:'Graphically',c:1}],why:'Simultaneous equations are solved by elimination (adding/subtracting to cancel a variable), substitution, or graphically (the intersection). Here adding eliminates y instantly.'},
  {s:'£500 is invested at 3% compound interest for 4 years and you want the final amount.',mode:'single',opts:[{t:'Multiply by 1.03 four times: 500 × 1.03⁴',c:1},{t:'Add 3% once',c:0},{t:'500 × 0.03 × 4',c:0},{t:'500 ÷ 1.03⁴',c:0}],why:'Compound interest multiplies by 1.03 each year, so amount = 500 × 1.03⁴. Adding 3% × 4 would be simple interest, which ignores interest-on-interest.'},
  {s:'You want to find the probability of getting two heads when flipping a fair coin twice.',mode:'single',opts:[{t:'Multiply along branches: ½ × ½',c:1},{t:'Add the probabilities: ½ + ½',c:0},{t:'It is ½',c:0},{t:'Subtract: ½ − ½',c:0}],why:'"Heads AND heads" are independent events, so multiply along the tree branches: ½ × ½ = ¼. Adding would be for "OR" of mutually exclusive outcomes.'},
  {s:'A bag has 5 red and 3 blue counters; two are drawn WITHOUT replacement and you want P(both red).',mode:'multi',opts:[{t:'Multiply, changing the second fraction',c:1},{t:'5/8 × 4/7',c:1},{t:'5/8 × 5/8',c:0},{t:'Use a tree diagram',c:1}],why:'Without replacement, the second draw has one fewer red and one fewer total: 5/8 × 4/7. The denominators and numerators both change — a tree diagram keeps it organised.'},
  {s:'You need the area of a circle of radius 6 cm.',mode:'single',opts:[{t:'πr² = π × 6²',c:1},{t:'2πr',c:0},{t:'πd',c:0},{t:'½ × b × h',c:0}],why:'Area of a circle is πr² = π × 36 ≈ 113 cm². 2πr and πd give the circumference (a length), not the area.'},
  {s:'Two shapes are mathematically similar with length scale factor 3, and you want the ratio of their areas.',mode:'single',opts:[{t:'Square the scale factor: 9',c:1},{t:'The same: 3',c:0},{t:'Cube it: 27',c:0},{t:'Double it: 6',c:0}],why:'For similar shapes, area scales by the square of the length scale factor (3² = 9) and volume by the cube (27). A classic exam trap.'},
  {s:'You must share £60 between two people in the ratio 2:3.',mode:'single',opts:[{t:'Divide by 5 parts, then multiply: £24 and £36',c:1},{t:'Divide by 2 and by 3',c:0},{t:'Split it in half',c:0},{t:'Give £2 and £3',c:0}],why:'Add the parts (2 + 3 = 5), divide the total (60 ÷ 5 = £12 per part), then multiply: 2×12 = £24 and 3×12 = £36.'},
  {s:'You have a non-right-angled triangle with two sides and the angle between them, and want the third side.',mode:'single',opts:[{t:'The cosine rule',c:1},{t:'Pythagoras',c:0},{t:'SOHCAHTOA',c:0},{t:'Area = ½ab sin C',c:0}],why:'No right angle, with two sides and the included angle → cosine rule: c² = a² + b² − 2ab cos C. Pythagoras and SOHCAHTOA only work with a right angle.'},
  {s:'You need to find the nth term of the sequence 5, 8, 11, 14, …',mode:'single',opts:[{t:'Common difference 3 → 3n + 2',c:1},{t:'Multiply terms together',c:0},{t:'n + 3',c:0},{t:'3n',c:0}],why:'The common difference is 3, so the rule starts 3n; adjusting to match the first term (3×1 = 3, need 5, so +2) gives 3n + 2.'}
 ],
 QUIZ:[
  {_mt:'Two negatives always make a positive',q:'What is −3 + −4?',opts:[{t:'−7',c:1},{t:'+7',c:0},{t:'+1',c:0}],feels:'"Two minuses make a plus" is drilled in, so +7 feels right.',soc:['Does the "two minuses make a plus" rule apply to ADDING, or only to multiplying/dividing?','On a number line, if you start at −3 and add another −4, do you move toward zero or further away?','So is −3 + −4 positive or more negative?']},
  {_mt:'(a + b)² equals a² + b²',q:'Expand (x + 3)².',opts:[{t:'x² + 6x + 9',c:1},{t:'x² + 9',c:0},{t:'x² + 3',c:0}],feels:'Squaring each term separately looks quick and tidy.',soc:['What does (x+3)² actually mean — which two brackets are multiplied?','When you expand (x+3)(x+3), how many products do you get?','What is the middle term you must not lose?']},
  {_mt:'Multiplying always makes numbers bigger',q:'What is ½ × 8?',opts:[{t:'4 — smaller than 8',c:1},{t:'16 — bigger than 8',c:0},{t:'8',c:0}],feels:'"Multiplying makes things bigger" is a strong early habit.',soc:['Is ½ greater than 1 or less than 1?','"Half of 8" — is that more or less than 8?','So does multiplying by a number below 1 grow or shrink it?']},
  {_mt:'A percentage rise then an equal fall returns to the start',q:'£100 increases by 20%, then decreases by 20%. What is the result?',opts:[{t:'£96',c:1},{t:'£100',c:0},{t:'£104',c:0}],feels:'Up 20% then down 20% feels like it should cancel out.',soc:['What is £100 after a 20% rise?','The 20% fall is taken from which amount — £100 or £120?','So is 20% of £120 the same as 20% of £100?']},
  {_mt:'aᵐ × aⁿ = aᵐⁿ',q:'Simplify a³ × a².',opts:[{t:'a⁵',c:1},{t:'a⁶',c:0},{t:'a¹',c:0}],feels:'Seeing 3 and 2 next to a multiply sign tempts you to multiply them.',soc:['Write out a³ × a² as individual a\'s. How many are there?','Do you add or multiply the indices when MULTIPLYING powers?','When would you multiply the indices instead?']},
  {_mt:'√(a + b) = √a + √b',q:'What is √(9 + 16)?',opts:[{t:'5',c:1},{t:'7',c:0},{t:'25',c:0}],feels:'Rooting each number then adding (3 + 4) looks reasonable.',soc:['What is 9 + 16 first?','What is the square root of that single number?','Does the square root split over a + sign?']},
  {_mt:'To share in a ratio, divide the total by one number',q:'Share £40 in the ratio 3:5. How much is the smaller share?',opts:[{t:'£15',c:1},{t:'£13.33',c:0},{t:'£8',c:0}],feels:'Dividing £40 by 3 (one of the numbers) seems like the obvious move.',soc:['How many equal parts are there in total (3 + 5)?','What is one part worth (£40 ÷ that total)?','How many parts does the smaller share get, and what is that in pounds?']},
  {_mt:'Correlation means one thing causes the other',q:'Ice-cream sales and drowning deaths both rise together. Does ice cream cause drowning?',opts:[{t:'No — a third factor (hot weather) drives both',c:1},{t:'Yes — they are correlated',c:0},{t:'Yes, but only in summer',c:0}],feels:'A strong matching trend looks like proof of cause.',soc:['Could something else be causing BOTH to rise?','What happens in hot weather to both ice-cream sales and swimming?','So does correlation on its own prove causation?']},
  {_mt:'You forget to put the numbers in order before finding the median',q:'Find the median of 7, 2, 9, 4, 5.',opts:[{t:'5 (after ordering: 2,4,5,7,9)',c:1},{t:'9 (the middle as written)',c:0},{t:'4',c:0}],feels:'It is tempting to grab the middle number as listed.',soc:['What must you do to the numbers before finding the median?','Order them: 2, 4, 5, 7, 9 — which is now in the middle?','So is the median 9 or 5?']},
  {_mt:'Pythagoras works on any triangle',q:'Can you use a² + b² = c² on a triangle with angles 50°, 60°, 70°?',opts:[{t:'No — it has no right angle',c:1},{t:'Yes — it works on all triangles',c:0},{t:'Only if the sides are whole numbers',c:0}],feels:'Pythagoras is so familiar it feels universal.',soc:['Which special angle must a triangle contain for Pythagoras to apply?','Does a 50-60-70 triangle contain a 90° angle?','So which rules would you need here instead?']},
  {_mt:'A negative index makes the number negative',q:'What is 2⁻³?',opts:[{t:'1/8',c:1},{t:'−8',c:0},{t:'−6',c:0}],feels:'A minus sign suggests a negative answer.',soc:['What operation does a negative index tell you to do — make negative, or take the reciprocal?','What is 2³?','So what is 1 over 2³?']},
  {_mt:'Squaring a number always makes it bigger',q:'Is 0.5² bigger or smaller than 0.5?',opts:[{t:'Smaller (0.25)',c:1},{t:'Bigger',c:0},{t:'The same',c:0}],feels:'"Squaring makes bigger" is a strong habit from whole numbers.',soc:['What is 0.5 × 0.5?','Is 0.25 more or less than 0.5?','So does squaring always make a number bigger?']}
 ],
 EQS:[
  {id:'pythag',name:'Pythagoras\' theorem',form:'c = √(a² + b²)',unit:'',vars:[{s:'a',label:'shorter side a',min:0,max:20,step:0.5,val:3,unit:''},{s:'b',label:'shorter side b',min:0,max:20,step:0.5,val:4,unit:''}],calc:v=>Math.sqrt(v.a*v.a+v.b*v.b),insight:'The hypotenuse of a right-angled triangle. 3 and 4 give exactly 5 — the classic Pythagorean triple. Only valid where there is a right angle.',predict:{q:'Increase one of the shorter sides. The hypotenuse will…',opts:['increase','decrease','stay the same'],a:0}},
  {id:'circ_area',name:'Area of a circle',form:'A = πr²',unit:'units²',vars:[{s:'r',label:'radius',min:0,max:20,step:0.5,val:6,unit:'cm'}],calc:v=>Math.PI*v.r*v.r,insight:'Area grows with the SQUARE of the radius, so doubling the radius quadruples the area. Don\'t confuse with circumference 2πr.',predict:{q:'Double the radius. The area becomes…',opts:['four times as big','twice as big','unchanged'],a:0}},
  {id:'compound',name:'Compound interest',form:'A = P × (1 + r)ⁿ',unit:'',vars:[{s:'P',label:'principal',min:0,max:5000,step:50,val:500,unit:'£'},{s:'r',label:'rate per year',min:0,max:0.2,step:0.01,val:0.03,unit:''},{s:'n',label:'years',min:0,max:30,step:1,val:4,unit:''}],calc:v=>v.P*Math.pow(1+v.r,v.n),insight:'Each year multiplies by (1 + r), so interest earns interest. Over many years the curve steepens — that\'s exponential growth.',predict:{q:'For more years at the same rate, the amount grows…',opts:['faster and faster (exponentially)','by the same amount each year','not at all'],a:0}},
  {id:'speed',name:'Speed, distance, time',form:'speed = distance ÷ time',unit:'',vars:[{s:'d',label:'distance',min:0,max:500,step:5,val:150,unit:'km'},{s:'t',label:'time',min:0.1,max:10,step:0.1,val:2,unit:'h'}],calc:v=>v.d/v.t,insight:'The same triangle gives distance = speed × time and time = distance ÷ speed. It also models density = mass ÷ volume.',predict:{q:'Cover the same distance in less time. Your speed is…',opts:['higher','lower','unchanged'],a:0}},
  {id:'pctchange',name:'Percentage change',form:'% change = (change ÷ original) × 100',unit:'%',vars:[{s:'c',label:'change',min:-100,max:100,step:1,val:20,unit:''},{s:'o',label:'original',min:1,max:200,step:1,val:80,unit:''}],calc:v=>v.c/v.o*100,insight:'Always divide by the ORIGINAL amount, not the new one. A negative change is a decrease.',predict:{q:'For the same change, a bigger original value gives a percentage change that is…',opts:['smaller','bigger','the same'],a:0}},
  {id:'gradient',name:'Gradient of a line',form:'m = (change in y) ÷ (change in x)',unit:'',vars:[{s:'dy',label:'rise (change in y)',min:-10,max:10,step:0.5,val:6,unit:''},{s:'dx',label:'run (change in x)',min:0.5,max:10,step:0.5,val:3,unit:''}],calc:v=>v.dy/v.dx,insight:'Gradient is steepness: rise over run. In y = mx + c, m is the gradient and c the y-intercept. A negative rise means a downhill line.',predict:{q:'Same run, bigger rise. The line gets…',opts:['steeper','flatter','horizontal'],a:0}},
  {id:'cylinder',name:'Volume of a cylinder',form:'V = πr²h',unit:'units³',vars:[{s:'r',label:'radius',min:0,max:10,step:0.5,val:3,unit:'cm'},{s:'h',label:'height',min:0,max:20,step:0.5,val:10,unit:'cm'}],calc:v=>Math.PI*v.r*v.r*v.h,insight:'Volume = area of the circular base (πr²) times height. Radius is squared, so it affects volume far more strongly than height does.',predict:{q:'Doubling the radius vs doubling the height — which raises volume more?',opts:['doubling the radius','doubling the height','they are equal'],a:0}},
  {id:'trig_opp',name:'Trig: opposite side',form:'opposite = hyp × sin θ',unit:'',vars:[{s:'h',label:'hypotenuse',min:0,max:20,step:0.5,val:10,unit:''},{s:'th',label:'angle θ',min:0,max:90,step:1,val:30,unit:'°'}],calc:v=>v.h*Math.sin(v.th*Math.PI/180),insight:'From SOH: sin θ = opp/hyp, so opp = hyp × sin θ. At 30° the opposite is exactly half the hypotenuse.',predict:{q:'As the angle θ increases toward 90°, the opposite side…',opts:['approaches the full hypotenuse','approaches zero','stays the same'],a:0}},
  {id:'density',name:'Density',form:'density = mass ÷ volume',unit:'',vars:[{s:'m',label:'mass',min:0,max:1000,step:10,val:200,unit:'g'},{s:'V',label:'volume',min:1,max:500,step:1,val:50,unit:'cm³'}],calc:v=>v.m/v.V,insight:'Same triangle structure as speed. A dense object packs lots of mass into little volume. Rearranges to mass = density × volume.',predict:{q:'Same mass squeezed into a smaller volume gives a density that is…',opts:['higher','lower','unchanged'],a:0}},
  {id:'nth_term',name:'nth term (linear sequence)',form:'term = dn + (a − d)',unit:'',vars:[{s:'d',label:'common difference d',min:-10,max:10,step:1,val:3,unit:''},{s:'a',label:'first term a',min:-20,max:20,step:1,val:5,unit:''},{s:'n',label:'position n',min:1,max:20,step:1,val:1,unit:''}],calc:v=>v.d*v.n+(v.a-v.d),insight:'A linear sequence changes by a fixed amount d each step. The rule dn + (a − d) gives any term directly from its position.',predict:{q:'A larger common difference makes the sequence grow…',opts:['faster','slower','not at all'],a:0}}
 ],
 CF:[
  {topic:'Number',o:'Multiplying 8 by 2 gives 16 — bigger.',f:'What if you multiplied 8 by ½?',r:'You get 4 — smaller. Multiplying by a number below 1 shrinks the value, breaking the "multiplying makes bigger" rule learned with whole numbers.'},
  {topic:'Ratio & proportion',o:'A £100 item rises 20% to £120.',f:'What if it then falls by 20%?',r:'It drops to £96, not back to £100, because the 20% fall is taken from the larger £120. Equal-percentage up-then-down always lands below the start.'},
  {topic:'Algebra',o:'(x + 3)² expands to x² + 6x + 9.',f:'What if you wrongly wrote x² + 9?',r:'You would lose the 2ab middle term (6x). For x = 2 the correct value is 25 but the wrong one gives 13 — a large error from dropping the middle term.'},
  {topic:'Trigonometry',o:'A right-angled triangle lets you use Pythagoras.',f:'What if the right angle were 80° instead?',r:'Pythagoras would no longer apply — a² + b² = c² needs exactly 90°. You would switch to the cosine rule for the missing side.'},
  {topic:'Probability',o:'Drawing a red counter from a bag with replacement keeps the odds fixed.',f:'What if you did not replace it?',r:'The second draw\'s probabilities change — one fewer of that colour and one fewer in total. Without replacement, the denominators shrink each draw.'},
  {topic:'Geometry & measures',o:'Two similar shapes have a length scale factor of 2.',f:'What about their areas and volumes?',r:'Areas scale by 2² = 4 and volumes by 2³ = 8. Lengths, areas and volumes scale by k, k² and k³ respectively — a frequent exam trap.'},
  {topic:'Statistics',o:'A data set\'s mean nicely summarises it.',f:'What if you added one huge outlier?',r:'The mean would be dragged toward the outlier, while the median (the middle value) would barely move — which is why the median is preferred for skewed data.'},
  {topic:'Algebra',o:'Solving 2x = 6 gives x = 3 by dividing both sides by 2.',f:'What if you only divided one side by 2?',r:'The equation would no longer balance and the answer would be wrong. Equations are scales: do the same to both sides or they tip.'},
  {topic:'Number',o:'2 + 3 × 4 = 14 using BIDMAS.',f:'What if you worked strictly left to right?',r:'You would get 20 (doing 2 + 3 first). Order of operations exists precisely to avoid this — multiplication is done before addition.'},
  {topic:'Ratio & proportion',o:'At a fixed speed, doubling the time doubles the distance (direct proportion).',f:'What if speed and time were in INVERSE proportion for a fixed distance?',r:'Doubling the speed would HALVE the time. Direct proportion grows together; inverse proportion trades one off against the other.'}
 ],
 CONTRAST:[
  {a:'Expanding',b:'Factorising',topic:'Algebra',rows:[['Direction','brackets → terms','terms → brackets'],['Operation','multiply out','find common factors'],['Example','(x+2)(x+3)→x²+5x+6','x²+5x+6→(x+2)(x+3)'],['Check by','—','expanding back']],confusion:'They are inverse processes, so students apply one when they need the other.',tell:'Expand = remove brackets (multiply out). Factorise = put brackets back (reverse).'},
  {a:'Direct proportion',b:'Inverse proportion',topic:'Ratio & proportion',rows:[['Relationship','y = kx','y = k/x'],['As x doubles','y doubles','y halves'],['Graph','straight line through origin','curve (hyperbola)'],['Example','cost vs quantity','speed vs time for fixed distance']],confusion:'Both are "proportion", but they behave oppositely.',tell:'Direct: both grow together (y=kx). Inverse: one up, other down (y=k/x).'},
  {a:'Mean',b:'Median',topic:'Statistics',rows:[['Definition','total ÷ count','middle of ordered data'],['Outliers','heavily affected','barely affected'],['Best for','symmetric data','skewed data'],['Needs ordering?','no','yes']],confusion:'Both are "the average", but they respond to outliers very differently.',tell:'Mean uses every value (sensitive to outliers); median is the robust middle.'},
  {a:'Perimeter',b:'Area',topic:'Geometry & measures',rows:[['Measures','distance around','space inside'],['Units','cm','cm²'],['Found by','adding side lengths','length × width (etc.)'],['Same shape can have','—','same perimeter, different area']],confusion:'Both describe a shape\'s size, but in different dimensions and units.',tell:'Perimeter = boundary length (units). Area = surface inside (units²).'},
  {a:'Mutually exclusive events',b:'Independent events',topic:'Probability',rows:[['Meaning','can\'t both happen','one doesn\'t affect the other'],['Key rule','P(A or B) = P(A)+P(B)','P(A and B) = P(A)×P(B)'],['Example','rolling a 2 or a 5','two separate coin flips'],['Operation','add','multiply']],confusion:'Both involve combining probabilities, but with different rules.',tell:'Mutually exclusive → add (OR). Independent → multiply (AND).'},
  {a:'Equation',b:'Expression',topic:'Algebra',rows:[['Has an = sign?','yes','no'],['Can be solved?','yes (find the unknown)','no (only simplified)'],['Example','2x + 1 = 7','2x + 1'],['You can…','solve for x','expand/factorise/simplify']],confusion:'Students try to "solve" an expression, which has nothing to solve.',tell:'Equation has = and is solved. Expression has no = and is simplified.'},
  {a:'Pythagoras',b:'Trigonometry (SOHCAHTOA)',topic:'Trigonometry',rows:[['Use when','two sides, no angle','an angle is involved'],['Finds','a missing side','a side or an angle'],['Needs','right angle','right angle'],['Formula','a²+b²=c²','sin/cos/tan ratios']],confusion:'Both work on right-angled triangles, so the choice gets muddled.',tell:'No angle given → Pythagoras. An angle involved → SOHCAHTOA.'},
  {a:'Factor',b:'Multiple',topic:'Number',rows:[['Definition','divides into a number','is in the times table of'],['Size','≤ the number','≥ the number'],['Example (of 12)','1,2,3,4,6,12','12,24,36,…'],['How many','finite','infinite']],confusion:'The words sound similar and get swapped.',tell:'Factors divide INTO it (smaller); multiples come FROM it (bigger, endless).'},
  {a:'Simple interest',b:'Compound interest',topic:'Ratio & proportion',rows:[['Interest on','original only','original + previous interest'],['Growth','linear (same each year)','exponential (speeds up)'],['Formula','P × r × n','P × (1+r)ⁿ'],['Over time','grows slower','grows faster']],confusion:'Both add interest, but compound earns interest on interest.',tell:'Simple = fixed amount yearly. Compound = multiplies each year (interest on interest).'},
  {a:'Linear graph',b:'Quadratic graph',topic:'Algebra',rows:[['Equation','y = mx + c','y = ax² + bx + c'],['Shape','straight line','parabola (U-shape)'],['Highest power of x','1','2'],['Roots','one (crosses once)','up to two']],confusion:'Both are common graphs, but the squared term changes everything.',tell:'Linear = straight line (x¹). Quadratic = curved parabola (x²), up to two roots.'}
 ],
 MODELS:[
  {c:'Equations as balanced scales',topic:'Algebra',model:'An equation is two equal sides. To solve, do the SAME operation to both sides to isolate the unknown, keeping the balance. The solution is the value that makes both sides equal.',wrong:['You can change one side without the other.','You can divide through by x (losing solutions).'],predict:['Adding/subtracting/multiplying both sides keeps it balanced.','Inverse operations undo each other.','Checking: substitute the answer back in.'],bound:['Multiplying/dividing by a negative flips an inequality.','Never divide an equation by a variable that could be zero.'],ex:['Solving linear and simultaneous equations.','Rearranging formulae.']},
  {c:'Place value & proportion',topic:'Number',model:'Our number system is built on powers of ten; percentages, fractions and decimals are three views of the same proportion. Converting between them and using multipliers handles most number problems.',wrong:['A bigger denominator means a bigger fraction.','Up x% then down x% returns to the start.'],predict:['×1.15 is a 15% increase; ×0.85 a 15% decrease.','Chained percentage changes multiply.','Standard form shifts the decimal by the power of ten.'],bound:['Percentage changes act on different bases.','Rounding conventions (5 rounds up; s.f. vs d.p.).'],ex:['Best-buy and percentage problems.','Growth, decay and interest.']},
  {c:'Right-angled triangle toolkit',topic:'Trigonometry',model:'In a right-angled triangle, Pythagoras links the three sides and SOHCAHTOA links an angle to two sides. Choose the tool by what you are given: sides only vs an angle involved.',wrong:['Pythagoras works on any triangle.','Any side can be the hypotenuse.'],predict:['Two sides, no angle → Pythagoras.','An angle + a side → sin/cos/tan.','Hypotenuse is always opposite the right angle.'],bound:['Both need a right angle; otherwise use sine/cosine rules.','Label opposite/adjacent relative to the chosen angle.'],ex:['Finding heights and distances.','Bearings and ladders.']},
  {c:'Probability of combined events',topic:'Probability',model:'List equally likely outcomes; probability is favourable ÷ total. For combined events use tree diagrams: multiply along branches (AND), add between branches (OR). Watch for replacement.',wrong:['Always add probabilities.','Probabilities stay the same without replacement.'],predict:['Independent "AND" → multiply.','Mutually exclusive "OR" → add.','Without replacement, denominators shrink each draw.'],bound:['Adding only works for mutually exclusive events.','Total probability of all outcomes = 1.'],ex:['Cards, dice and counters.','Risk and expected outcomes.']},
  {c:'Averages & spread',topic:'Statistics',model:'Summarise data with an average (mean, median or mode) and a measure of spread (range, IQR). Choose the average to suit the data; interpret, don\'t just calculate. Correlation is not causation.',wrong:['The mean is the only average.','Correlation proves causation.'],predict:['Outliers pull the mean but not the median.','Skewed data → prefer the median.','A trend line shows correlation, not cause.'],bound:['Order data before finding the median.','A representative, large sample is needed for reliability.'],ex:['Comparing data sets.','Interpreting scatter graphs.']},
  {c:'Index laws',topic:'Algebra',model:'Indices count repeated multiplication. Multiplying powers adds indices, dividing subtracts, a power of a power multiplies; a negative index means reciprocal and a fractional index means a root.',wrong:['aᵐ × aⁿ = aᵐⁿ.','A negative index makes the number negative.'],predict:['aᵐ × aⁿ = aᵐ⁺ⁿ; aᵐ ÷ aⁿ = aᵐ⁻ⁿ.','(aᵐ)ⁿ = aᵐⁿ; a⁰ = 1.','a⁻ⁿ = 1/aⁿ; a^(1/2) = √a.'],bound:['Laws apply to the same base only.','Negative ≠ negative value; it means reciprocal.'],ex:['Simplifying algebra.','Standard form and surds.']},
  {c:'Similar shapes & scale',topic:'Geometry & measures',model:'Similar shapes are scaled copies: equal angles, sides in a fixed ratio k. Lengths scale by k, areas by k² and volumes by k³ — get the power right for the dimension.',wrong:['Area scales by the same factor as length.','Bigger perimeter means bigger area.'],predict:['Length ×k, area ×k², volume ×k³.','Map scales and enlargements use k.','Congruent = identical (k = 1).'],bound:['Only for mathematically similar shapes.','Match corresponding sides correctly.'],ex:['Enlargements and maps.','Volume/area comparison questions.']}
 ],
 SPEC:[
  {id:'mx1',n:1,paper:'All papers',title:'Number',pts:['Place value, factors, multiples, primes','Fractions, decimals and percentages','Indices, standard form and surds','Rounding, estimation and bounds'],study:[['Misconception fixes','misconceptions'],['Concept contrasts','contrast'],['Equation explorer','explorer']]},
  {id:'mx2',n:2,paper:'All papers',title:'Algebra',pts:['Manipulation: expand, factorise, simplify','Solving linear, simultaneous and quadratic equations','Sequences and the nth term','Graphs, inequalities and functions'],study:[['Concept contrasts','contrast'],['Mental models','models'],['Trigger trainer','trigger']]},
  {id:'mx3',n:3,paper:'All papers',title:'Ratio, proportion & rates of change',pts:['Ratio and sharing','Direct and inverse proportion','Percentages, interest, growth and decay','Compound measures (speed, density, pressure)'],study:[['Misconception fixes','misconceptions'],['Equation explorer','explorer'],['Concept contrasts','contrast']]},
  {id:'mx4',n:4,paper:'All papers',title:'Geometry & measures',pts:['Angles, polygons and circles','Area, surface area and volume','Transformations, congruence and similarity','Vectors and constructions'],study:[['Concept contrasts','contrast'],['Equation explorer','explorer'],['Mental models','models']]},
  {id:'mx5',n:5,paper:'All papers',title:'Trigonometry & Pythagoras',pts:['Pythagoras\' theorem','SOHCAHTOA in right-angled triangles','Sine and cosine rules (Higher)','Exact trig values'],study:[['Trigger trainer','trigger'],['Equation explorer','explorer'],['Mental models','models']]},
  {id:'mx6',n:6,paper:'All papers',title:'Probability',pts:['Theoretical and experimental probability','Sample space, tree and Venn diagrams','Mutually exclusive and independent events','With and without replacement'],study:[['Concept contrasts','contrast'],['Misconception fixes','misconceptions'],['Mental models','models']]},
  {id:'mx7',n:7,paper:'All papers',title:'Statistics',pts:['Averages and spread (mean, median, mode, range, IQR)','Charts, scatter graphs and correlation','Cumulative frequency and box plots','Sampling and reliability'],study:[['Misconception fixes','misconceptions'],['Concept contrasts','contrast'],['Mental models','models']]}
 ],
 AQA_SPEC:[
  {id:'maq1',n:1,pap:0,title:'Number',pts:['Structure and calculation; factors and primes','Fractions, decimals and percentages','Standard form, indices and surds','Rounding, bounds and estimation'],study:[['Misconception fixes','misconceptions'],['Concept contrasts','contrast']]},
  {id:'maq2',n:2,pap:0,title:'Algebra',pts:['Notation, manipulation and simplifying','Solving equations and inequalities','Sequences and graphs','Functions (Higher)'],study:[['Concept contrasts','contrast'],['Trigger trainer','trigger']]},
  {id:'maq3',n:3,pap:0,title:'Ratio, proportion & rates of change',pts:['Ratio and proportion','Percentages and interest','Compound measures and rates'],study:[['Equation explorer','explorer'],['Misconception fixes','misconceptions']]},
  {id:'maq4',n:4,pap:0,title:'Geometry & measures',pts:['Properties and constructions','Mensuration: area, volume, circles','Transformations, similarity and congruence','Vectors'],study:[['Concept contrasts','contrast'],['Equation explorer','explorer']]},
  {id:'maq5',n:5,pap:0,title:'Pythagoras & trigonometry',pts:['Pythagoras\' theorem','Trigonometric ratios (SOHCAHTOA)','Sine and cosine rules (Higher)'],study:[['Trigger trainer','trigger'],['Equation explorer','explorer']]},
  {id:'maq6',n:6,pap:0,title:'Probability',pts:['Probability scales and outcomes','Tree, Venn and sample-space diagrams','Independent and mutually exclusive events'],study:[['Concept contrasts','contrast'],['Mental models','models']]},
  {id:'maq7',n:7,pap:0,title:'Statistics',pts:['Sampling and data collection','Averages, spread and diagrams','Scatter graphs and correlation'],study:[['Misconception fixes','misconceptions'],['Mental models','models']]}
 ],
 CPRAC:[],
 AQA_PRAC:[]
};

/* ============ CHEMISTRY content pack — EXPANSION ============ */
CHEM.MIS.push(
 {t:'Ionic compounds conduct electricity when solid',topic:'Bonding & structure',wrong:'Salt conducts electricity as a solid because it is made of ions.',right:'Ionic solids do NOT conduct — the ions are locked in a fixed lattice and cannot move. They only conduct when MOLTEN or DISSOLVED, because then the ions are free to carry charge.',ana:'Bricks in a wall (solid) cannot move; tip them into a river (molten/dissolved) and they flow.',tell:'Ionic: conducts when molten or in solution, never as a solid (ions must be free to move).'},
 {t:'Breaking bonds releases energy',topic:'Energy changes',wrong:'Snapping a chemical bond gives out energy.',right:'Breaking bonds always REQUIRES energy (endothermic step); making bonds RELEASES energy (exothermic step). Whether a reaction is overall exo- or endothermic depends on which is bigger.',ana:'Pulling two magnets apart takes effort (energy in); letting them snap together gives energy out.',tell:'Bonds broken = energy in. Bonds made = energy out. Overall = made − broken.'},
 {t:'Relative atomic mass is the mass of one atom',topic:'Atomic structure',wrong:'The Ar of chlorine (35.5) is the mass of a single chlorine atom.',right:'Relative atomic mass is a WEIGHTED AVERAGE of the masses of all the isotopes, by abundance. Chlorine is ~75% Cl-35 and ~25% Cl-37, averaging 35.5 — no single atom has that mass.',ana:'The "average shoe size" in a class might be 7.4, even though nobody wears a 7.4.',tell:'Ar = weighted mean over isotopes. No individual atom need have that exact mass.'},
 {t:'Adding a catalyst increases the yield',topic:'Rates & equilibrium',wrong:'A catalyst makes more product form.',right:'A catalyst speeds up how FAST equilibrium is reached, but it does NOT change the position of equilibrium or the final yield — it speeds the forward and backward reactions equally.',ana:'A faster road gets you to the same destination sooner; it does not change where you end up.',tell:'Catalyst: reaches the same yield faster. It changes rate, not yield or equilibrium position.'},
 {t:'Heating an exothermic equilibrium increases its yield',topic:'Rates & equilibrium',wrong:'More heat always pushes a reaction to make more product.',right:'For an EXOTHERMIC forward reaction, raising temperature shifts equilibrium BACKWARD (Le Chatelier), reducing yield — though it speeds the rate. This is the compromise behind the Haber process.',ana:'A system pushed by heat fights back by absorbing it — favouring the endothermic (reverse) direction.',tell:'Le Chatelier: heat favours the endothermic direction. For exothermic forward reactions, heat lowers yield.'},
 {t:'Cracking is the same as fractional distillation',topic:'Organic chemistry',wrong:'Cracking and fractional distillation are two words for refining oil.',right:'Fractional distillation SEPARATES the mixture by boiling point (a physical change). Cracking BREAKS long hydrocarbon molecules into shorter ones using heat and a catalyst (a chemical change). Different processes.',ana:'Sorting ropes by length (distillation) is not the same as cutting long ropes into short ones (cracking).',tell:'Distillation = physical separation. Cracking = chemical breaking of long chains into shorter ones + alkenes.'},
 {t:'All polymers form the same way',topic:'Organic chemistry',wrong:'Polymers are all made by the same reaction.',right:'Addition polymers form from alkene monomers (C=C opens up) with NO other product. Condensation polymers form from two monomers with two functional groups, releasing a small molecule (often water) each link.',ana:'Addition = beads simply clicking together. Condensation = each link snaps on but spits out a tiny offcut.',tell:'Addition: alkenes, no by-product. Condensation: two monomers, loses a small molecule (e.g. water).'},
 {t:'Complete and incomplete combustion give the same products',topic:'Organic chemistry',wrong:'Burning a fuel always makes carbon dioxide and water.',right:'COMPLETE combustion (plenty of oxygen) gives CO₂ + water. INCOMPLETE combustion (limited oxygen) also gives toxic carbon monoxide (CO) and/or soot (carbon). Less oxygen = more dangerous products.',ana:'A well-fed fire burns clean; a starved one smokes and gives off poison.',tell:'Complete → CO₂ + H₂O. Incomplete (low O₂) → CO (toxic) and/or soot.'},
 {t:'Universal indicator gives the exact pH',topic:'Chemical changes / acids',wrong:'Universal indicator tells you the precise pH value.',right:'Universal indicator gives an APPROXIMATE pH from a colour. For an accurate value you use a pH meter (a numerical probe). The colour chart is a rough guide, not a precise measurement.',ana:'A mood ring hints at warmth; a thermometer gives the actual temperature.',tell:'Universal indicator = approximate pH (colour). pH meter = accurate numerical value.'},
 {t:'Stronger intermolecular forces mean stronger covalent bonds',topic:'Bonding & structure',wrong:'A high boiling point means the covalent bonds are very strong.',right:'Boiling point of a simple molecular substance depends on the INTERMOLECULAR forces (between molecules), not the covalent bonds (within molecules). Bigger molecules have stronger intermolecular forces, so higher boiling points — the covalent bonds are unchanged.',ana:'How hard it is to separate paperclips depends on how they cling together, not how strong each clip is.',tell:'Boiling point ↔ intermolecular forces. Covalent bond strength is a separate, internal property.'},
 {t:'Noble gases form ions to get a full shell',topic:'Periodic table',wrong:'Group 0 elements gain or lose electrons like other groups.',right:'Noble gases ALREADY have full outer shells, so they are stable and unreactive — they do not normally form ions or bonds. That full shell is exactly what other elements react to achieve.',ana:'Someone who already has everything has no reason to trade.',tell:'Noble gases (Group 0) have full shells — stable, unreactive, don\'t form ions.'},
 {t:'A more reactive metal is always extracted by electrolysis',topic:'Electrolysis',wrong:'All metals are extracted using electricity.',right:'Metals MORE reactive than carbon (e.g. aluminium) are extracted by electrolysis. Metals LESS reactive than carbon (e.g. iron, zinc) are extracted by reduction with carbon — cheaper. The method depends on reactivity.',ana:'You only call in the expensive specialist (electrolysis) when the cheap method (carbon) cannot do the job.',tell:'More reactive than carbon → electrolysis. Less reactive than carbon → reduction with carbon.'},
 {t:'Concentration and amount (moles) are the same',topic:'Quantitative (moles)',wrong:'A solution with more moles is always more concentrated.',right:'Concentration is moles PER unit volume. The same number of moles in a larger volume is LESS concentrated. Amount (moles) and concentration are linked by volume, not equal.',ana:'The same spoon of sugar makes a small cup sweet but a bucket barely flavoured.',tell:'Concentration = moles ÷ volume. Same moles, bigger volume = lower concentration.'},
 {t:'Every test for a gas is the same',topic:'Chemical analysis',wrong:'You test all gases the same way.',right:'Each gas has its own test: hydrogen gives a squeaky POP with a lit splint; oxygen RELIGHTS a glowing splint; carbon dioxide turns LIMEWATER milky; chlorine BLEACHES damp litmus paper.',ana:'Each suspect has a unique fingerprint — you match the right test to the right gas.',tell:'H₂ = squeaky pop; O₂ = relights splint; CO₂ = milky limewater; Cl₂ = bleaches litmus.'},
 {t:'The empirical and molecular formula are always the same',topic:'Quantitative (moles)',wrong:'A compound has just one formula.',right:'The MOLECULAR formula gives the actual atoms in a molecule (e.g. C₆H₁₂O₆). The EMPIRICAL formula is the simplest whole-number ratio (CH₂O). They are equal only when the ratio cannot be simplified.',ana:'A recipe for 6 cookies (molecular) vs the per-cookie ratio (empirical) — same proportions, different scale.',tell:'Molecular = actual atoms. Empirical = simplest ratio. Glucose: C₆H₁₂O₆ vs CH₂O.'},
 {t:'Surrounding a reaction with more reactant always reaches equilibrium faster forever',topic:'Rates & equilibrium',wrong:'Raising temperature keeps increasing the rate without limit and is always worth it.',right:'Higher temperature does increase rate, but for an exothermic equilibrium it lowers yield, and very high temperatures cost energy. Industry uses a COMPROMISE (e.g. Haber: 450 °C, 200 atm, iron catalyst) balancing rate, yield and cost.',ana:'Flooring the accelerator is fast but burns fuel and risks overshooting — you pick a sensible speed.',tell:'Industrial conditions are a compromise of rate, yield and cost, not just "hotter is better".'}
);
CHEM.ANA.push(
 {topic:'Rates & equilibrium',k:'Le Chatelier = a system that pushes back',v:'Change a condition (concentration, pressure, temperature) and a reversible reaction shifts to oppose the change. Add reactant → it shifts to make more product; add heat → it shifts the endothermic way.'},
 {topic:'Chemical changes / acids',k:'Reactivity series = a pecking order',v:'Metals queue by how readily they lose electrons. A metal higher up displaces one lower down from its compound, and the order also decides how a metal reacts with water, acid or oxygen.'},
 {topic:'Energy changes',k:'Bond energy = the price of a bond',v:'Each bond has a fixed energy to break. Total energy change = energy to break all bonds − energy released making new ones. A negative total means exothermic (energy profit).'},
 {topic:'Quantitative (moles)',k:'Empirical formula = the simplest recipe ratio',v:'Reduce the mole ratio of elements to its simplest whole numbers. From experimental masses you find moles of each element, then divide by the smallest to get the ratio.'},
 {topic:'Bonding & structure',k:'Giant covalent = an endless scaffold',v:'In diamond, graphite and silica, atoms are bonded covalently in a continuous 3D (or layered) network. Breaking it needs huge energy, so melting points are very high.'},
 {topic:'Bonding & structure',k:'Nanoparticles = tiny but huge surface',v:'As particles shrink, their surface-area-to-volume ratio rockets, so a little material exposes a lot of surface — making nanoparticles powerful catalysts and useful in sunscreens.'},
 {topic:'Electrolysis',k:'Half equations = bookkeeping for electrons',v:'At each electrode you track the electrons: cathode gains them (reduction, e.g. Cu²⁺ + 2e⁻ → Cu), anode loses them (oxidation). The electrons lost equal the electrons gained.'},
 {topic:'Organic chemistry',k:'Homologous series = a family with a pattern',v:'Alkanes, alkenes and alcohols each form a family with the same general formula and gradually changing properties (e.g. boiling point) as the chain lengthens — like siblings of increasing age.'},
 {topic:'Chemical analysis',k:'Flame tests = elements with signature colours',v:'Heated metal ions emit characteristic colours: lithium red, sodium yellow, potassium lilac, calcium orange-red, copper green. The colour is the element\'s fingerprint.'},
 {topic:'Atmosphere',k:'Carbon cycle = borrowing and returning carbon',v:'Photosynthesis locks carbon into plants; respiration, decay and combustion return it as CO₂. Burning fossil fuels releases carbon stored over millions of years far faster than it is removed.'},
 {topic:'Rates & equilibrium',k:'Catalyst = a shortcut tunnel through the hill',v:'Instead of climbing the full activation-energy hill, reactant particles take a lower-energy route the catalyst provides. The start and end points are unchanged — only the path is easier.'}
);
CHEM.TRIG.push(
 {s:'A lit splint is held at the mouth of a test tube and there is a squeaky pop.',mode:'multi',opts:[{t:'Test for hydrogen',c:1},{t:'Gas test',c:1},{t:'Combustion of hydrogen',c:1},{t:'Test for oxygen',c:0}],why:'The squeaky pop is the standard test for hydrogen — the hydrogen burns explosively with the oxygen in the air.'},
 {s:'A glowing (not flaming) splint bursts back into flame when placed in a gas.',mode:'multi',opts:[{t:'Test for oxygen',c:1},{t:'Oxygen supports combustion',c:1},{t:'Gas test',c:1},{t:'Test for carbon dioxide',c:0}],why:'Oxygen relights a glowing splint because it supports combustion — the standard test for oxygen.'},
 {s:'Bubbling a gas through limewater turns it cloudy/milky.',mode:'multi',opts:[{t:'Test for carbon dioxide',c:1},{t:'Gas test',c:1},{t:'Forms calcium carbonate',c:1},{t:'Test for hydrogen',c:0}],why:'Carbon dioxide turns limewater milky by forming insoluble calcium carbonate — the standard CO₂ test.'},
 {s:'Bromine water is shaken with a hydrocarbon and the orange colour disappears.',mode:'multi',opts:[{t:'Test for an alkene',c:1},{t:'C=C double bond present',c:1},{t:'Addition reaction',c:1},{t:'The hydrocarbon is an alkane',c:0}],why:'Alkenes decolourise bromine water because the C=C double bond adds bromine across it. Alkanes (no double bond) leave it orange.'},
 {s:'In the Haber process, raising the pressure increases the yield of ammonia.',mode:'multi',opts:[{t:'Le Chatelier\'s principle',c:1},{t:'Equilibrium shifts to fewer gas molecules',c:1},{t:'Reversible reaction',c:1},{t:'A catalyst caused it',c:0}],why:'There are fewer gas molecules on the ammonia side, so higher pressure shifts equilibrium that way, raising yield. A catalyst would only change the rate.'},
 {s:'A long-chain hydrocarbon is heated with a catalyst and breaks into a shorter alkane and an alkene.',mode:'multi',opts:[{t:'Cracking',c:1},{t:'Producing alkenes for plastics',c:1},{t:'Matching supply to demand',c:1},{t:'Fractional distillation',c:0}],why:'Cracking breaks long, less useful molecules into shorter, in-demand alkanes plus alkenes for polymers. Distillation only separates, it does not break molecules.'},
 {s:'A car exhaust in poorly ventilated conditions produces a colourless, toxic gas.',mode:'multi',opts:[{t:'Incomplete combustion',c:1},{t:'Carbon monoxide formed',c:1},{t:'Limited oxygen',c:1},{t:'Complete combustion',c:0}],why:'With limited oxygen, fuels burn incompletely, producing toxic carbon monoxide (and sometimes soot) rather than only CO₂.'},
 {s:'A clean iron nail is dipped in blue copper sulfate solution and becomes coated with pinkish-brown metal.',mode:'multi',opts:[{t:'Displacement',c:1},{t:'Iron more reactive than copper',c:1},{t:'Redox reaction',c:1},{t:'No reaction occurs',c:0}],why:'Iron is more reactive than copper, so it displaces copper from solution; copper metal deposits on the nail (a redox/displacement reaction).'},
 {s:'Aluminium is extracted from its molten ore using a large electric current, while iron is extracted in a blast furnace with carbon.',mode:'multi',opts:[{t:'Extraction method depends on reactivity',c:1},{t:'Aluminium is more reactive than carbon',c:1},{t:'Electrolysis vs reduction',c:1},{t:'Both use the same method',c:0}],why:'Aluminium is more reactive than carbon, so it needs electrolysis; iron is less reactive than carbon, so cheaper carbon reduction works.'},
 {s:'A few drops of solution are placed on a wire and held in a flame, giving a lilac colour.',mode:'multi',opts:[{t:'Flame test',c:1},{t:'Potassium ion present',c:1},{t:'Identifying a metal ion',c:1},{t:'Test for a gas',c:0}],why:'A lilac flame indicates potassium ions — flame tests identify certain metal ions by their characteristic colour.'},
 {s:'A green powder is heated and turns black, giving off a gas that turns limewater milky.',mode:'multi',opts:[{t:'Thermal decomposition of a carbonate',c:1},{t:'Carbon dioxide released',c:1},{t:'Endothermic (needs heating)',c:1},{t:'Neutralisation',c:0}],why:'Heating a metal carbonate (e.g. copper carbonate) decomposes it to the oxide plus CO₂ (milky limewater). It requires heat, so it is endothermic.'},
 {s:'During a titration, one more drop of acid turns the indicator from pink to colourless.',mode:'multi',opts:[{t:'The end point of a titration',c:1},{t:'Neutralisation',c:1},{t:'Finding concentration',c:1},{t:'A precipitate formed',c:0}],why:'The sharp colour change marks the end point, where the acid has exactly neutralised the alkali — used to calculate the unknown concentration.'}
);
CHEM.QUIZ.push(
 {_mt:'Ionic compounds conduct electricity when solid',q:'Solid sodium chloride does not conduct electricity, but molten sodium chloride does. Why?',opts:[{t:'In the solid the ions are fixed; molten, they can move',c:1},{t:'Melting creates new electrons',c:0},{t:'Solid salt has no ions',c:0}],feels:'Salt is "made of ions", so it feels like it should always conduct.',soc:['What has to move for something to conduct electricity?','In a solid lattice, can the ions move around?','What changes when you melt it?']},
 {_mt:'Breaking bonds releases energy',q:'Is breaking a chemical bond an energy-in or energy-out step?',opts:[{t:'Energy in (endothermic)',c:1},{t:'Energy out (exothermic)',c:0},{t:'No energy change',c:0}],feels:'Breaking something sounds like it should release energy.',soc:['Do two strongly attracted particles separate easily, or do you have to supply energy?','Which step releases energy — breaking bonds or making them?','So is bond breaking energy-in or energy-out?']},
 {_mt:'Adding a catalyst increases the yield',q:'You add a catalyst to a reversible reaction at equilibrium. What happens to the yield?',opts:[{t:'Nothing — it only reaches the same yield faster',c:1},{t:'The yield increases',c:0},{t:'The yield decreases',c:0}],feels:'A catalyst helps the reaction, so it feels like it should make more product.',soc:['Does a catalyst speed the forward and backward reactions equally?','Does it change WHERE equilibrium sits?','So does the final amount of product change?']},
 {_mt:'Heating an exothermic equilibrium increases its yield',q:'The forward reaction is exothermic. You raise the temperature. What happens to the yield?',opts:[{t:'It decreases (equilibrium shifts back)',c:1},{t:'It increases',c:0},{t:'No change',c:0}],feels:'Heat usually drives reactions forward, so more product feels right.',soc:['By Le Chatelier, the system opposes the added heat — which direction absorbs heat?','If the forward reaction releases heat, which direction is endothermic?','So does heating favour products or reactants here?']},
 {_mt:'Relative atomic mass is the mass of one atom',q:'Chlorine has Ar = 35.5. What does this number represent?',opts:[{t:'A weighted average of its isotopes',c:1},{t:'The mass of one chlorine atom',c:0},{t:'A rounding error',c:0}],feels:'A single value looks like it should be one atom\'s mass.',soc:['Does chlorine exist as more than one isotope?','If 75% is mass 35 and 25% is mass 37, what is the average?','Does any single atom actually weigh 35.5?']},
 {_mt:'A more reactive metal is always extracted by electrolysis',q:'Iron is extracted by heating its ore with carbon, not electrolysis. Why?',opts:[{t:'Iron is less reactive than carbon, so carbon can reduce it',c:1},{t:'Electrolysis does not work on iron',c:0},{t:'Iron has no ions',c:0}],feels:'Electrolysis is the "powerful" method, so it feels like it should be used for all metals.',soc:['Which is more reactive — iron or carbon?','Can a less reactive metal be displaced (reduced) by carbon?','So why use cheap carbon for iron but electrolysis for aluminium?']},
 {_mt:'Complete and incomplete combustion give the same products',q:'A fuel burns in a limited supply of oxygen. Which extra product can form?',opts:[{t:'Carbon monoxide (and/or soot)',c:1},{t:'Only carbon dioxide and water',c:0},{t:'Hydrogen',c:0}],feels:'Burning a fuel "always" makes CO₂ and water in your head.',soc:['Is there enough oxygen for complete combustion here?','With too little oxygen, can carbon be only partly oxidised?','What toxic gas does that partial oxidation produce?']}
);
CHEM.EQS.push(
 {id:'bondenergy',name:'Energy change from bond energies',form:'ΔH = (bonds broken) − (bonds made)',unit:'kJ/mol',vars:[{s:'br',label:'energy to break bonds',min:0,max:3000,step:10,val:1500,unit:''},{s:'mk',label:'energy released making bonds',min:0,max:3000,step:10,val:1800,unit:''}],calc:v=>v.br-v.mk,insight:'A negative result means more energy is released than used — exothermic. A positive result means endothermic. Bond breaking is the cost; bond making is the payback.',predict:{q:'If making bonds releases more than breaking them costs, the reaction is…',opts:['exothermic (negative ΔH)','endothermic (positive ΔH)','neither'],a:0}},
 {id:'concgdm3',name:'Concentration in g/dm³',form:'concentration = mass ÷ volume',unit:'g/dm³',vars:[{s:'m',label:'mass of solute',min:0,max:200,step:1,val:20,unit:'g'},{s:'V',label:'volume',min:0.1,max:5,step:0.1,val:0.5,unit:'dm³'}],calc:v=>v.m/v.V,insight:'Convert to mol/dm³ by dividing by the Mr. The same mass in a smaller volume is more concentrated.',predict:{q:'Halve the volume for the same mass. The concentration…',opts:['doubles','halves','is unchanged'],a:0}},
 {id:'particles',name:'Number of particles',form:'particles = moles × 6.02×10²³',unit:'',vars:[{s:'n',label:'moles',min:0,max:10,step:0.1,val:2,unit:'mol'}],calc:v=>v.n*6.02e23,insight:'Avogadro\'s constant links the mole (a weighable amount) to the actual number of atoms or molecules — an astronomically large number.',predict:{q:'Double the moles. The number of particles…',opts:['doubles','halves','is unchanged'],a:0}},
 {id:'calorimetry',name:'Energy released (calorimetry)',form:'q = m × c × ΔT',unit:'J',vars:[{s:'m',label:'mass of water',min:0,max:500,step:5,val:100,unit:'g'},{s:'c',label:'specific heat (water)',min:4.18,max:4.18,step:0.01,val:4.18,unit:'J/g°C'},{s:'dT',label:'temperature rise',min:0,max:80,step:1,val:20,unit:'°C'}],calc:v=>v.m*v.c*v.dT,insight:'Used to measure the energy released by a fuel or reaction: the heat goes into the water, raising its temperature. Bigger temperature rise = more energy released.',predict:{q:'A fuel that raises the water temperature more has released…',opts:['more energy','less energy','the same energy'],a:0}}
);
CHEM.CF.push(
 {topic:'Rates & equilibrium',o:'At equilibrium, ammonia is being made and broken down at equal rates.',f:'What if you removed the ammonia as it formed?',r:'Equilibrium shifts forward to replace it, so more reactants convert to product — continually removing product increases the overall yield. This is used industrially.'},
 {topic:'Rates & equilibrium',o:'Increasing pressure raises the yield of ammonia.',f:'What if you pumped in an unreactive gas like argon at constant volume?',r:'The position of equilibrium would not shift — only changes to the partial pressures of the reacting gases matter. Adding inert gas at constant volume changes nothing.'},
 {topic:'Energy changes',o:'A reaction releases energy and warms its surroundings.',f:'What if the bonds made released LESS energy than breaking the old bonds cost?',r:'The reaction would be endothermic — it would take energy in and cool the surroundings. The sign of ΔH flips when making bonds no longer outweighs breaking them.'},
 {topic:'Electrolysis',o:'Electrolysing molten lead bromide gives lead and bromine.',f:'What if you electrolysed concentrated sodium chloride SOLUTION instead?',r:'You would get hydrogen at the cathode, chlorine at the anode and sodium hydroxide left in solution — water gets involved, changing the products entirely.'},
 {topic:'Organic chemistry',o:'A fuel burns cleanly with a blue flame in plenty of air.',f:'What if the air supply were restricted?',r:'Combustion becomes incomplete: the flame turns yellow/sooty and toxic carbon monoxide forms. Less oxygen shifts the products toward CO and carbon.'},
 {topic:'Bonding & structure',o:'Graphite conducts electricity and is slippery.',f:'What if its carbon atoms each bonded to four others like diamond?',r:'It would become hard and non-conducting like diamond — no free electrons and no sliding layers. The number of bonds per carbon decides the properties.'},
 {topic:'Rates & equilibrium',o:'A reaction proceeds at a steady rate at room temperature.',f:'What if you cooled it in ice?',r:'The rate would slow markedly: particles move slower, collide less often and with less energy, so fewer collisions exceed the activation energy.'},
 {topic:'Chemical changes / acids',o:'A strong acid has a low pH.',f:'What if you neutralised half of it with alkali?',r:'The pH would rise toward 7 as H⁺ ions are removed, but only reach neutral when exactly enough alkali is added. Excess alkali would push it above 7.'}
);
CHEM.CONTRAST.push(
 {a:'Complete combustion',b:'Incomplete combustion',topic:'Organic chemistry',rows:[['Oxygen','plenty','limited'],['Carbon product','CO₂','CO and/or soot (C)'],['Flame','clean, blue','yellow, sooty'],['Danger','—','toxic CO, less energy']],confusion:'Both burn a fuel, but the oxygen supply changes the products.',tell:'Plenty of O₂ → CO₂ + water. Limited O₂ → toxic CO and soot.'},
 {a:'Addition polymerisation',b:'Condensation polymerisation',topic:'Organic chemistry',rows:[['Monomers','alkenes (C=C)','two groups, e.g. diol + diacid'],['By-product','none','a small molecule (e.g. water)'],['Example','poly(ethene)','polyester, nylon'],['Bond opened','the double bond','functional groups react']],confusion:'Both build long chains, but only one loses a small molecule each link.',tell:'Addition: alkenes, no by-product. Condensation: two monomers, loses water each link.'},
 {a:'Empirical formula',b:'Molecular formula',topic:'Quantitative (moles)',rows:[['Shows','simplest whole-number ratio','actual atoms in a molecule'],['Glucose','CH₂O','C₆H₁₂O₆'],['Found from','reacting masses / % composition','empirical × a whole number'],['Always equal?','—','only if ratio can\'t simplify']],confusion:'Both are "the formula", but one is reduced and one is the real count.',tell:'Empirical = simplest ratio. Molecular = real atom count (a multiple of empirical).'},
 {a:'Alkanes',b:'Alkenes',topic:'Organic chemistry',rows:[['Bonds','all single (saturated)','one C=C double (unsaturated)'],['General formula','CₙH₂ₙ₊₂','CₙH₂ₙ'],['Bromine water','no change (stays orange)','decolourised'],['Use','fuels','making polymers and alcohols']],confusion:'Both are hydrocarbons; the double bond changes the chemistry.',tell:'Alkanes = saturated (single bonds). Alkenes = one C=C; decolourise bromine water.'},
 {a:'Filtration',b:'Crystallisation',topic:'Chemical analysis',rows:[['Separates','insoluble solid from liquid','dissolved solid from solution'],['Method','pour through filter paper','evaporate solvent slowly'],['Keeps','residue (solid) / filtrate (liquid)','crystals of solute'],['Example','sand from water','salt from salt water']],confusion:'Both are separation techniques, but for soluble vs insoluble solids.',tell:'Filtration = insoluble solids. Crystallisation = recover dissolved solids by evaporation.'},
 {a:'Strong acid',b:'Weak acid',topic:'Chemical changes / acids',rows:[['Ionisation','fully ionised','partly ionised'],['pH (same conc.)','lower','higher'],['Example','HCl, H₂SO₄','ethanoic, citric'],['Reaction rate','faster','slower']],confusion:'Strength is about ionisation, separate from concentration.',tell:'Strong = fully ionised (more H⁺). Weak = partly ionised. Independent of concentration.'},
 {a:'Reduction with carbon',b:'Electrolysis',topic:'Electrolysis',rows:[['Used for','metals below carbon','metals above carbon'],['Example','iron, zinc','aluminium, sodium'],['Cost','cheaper','expensive (lots of electricity)'],['Process','heat ore with carbon','split molten compound with current']],confusion:'Both extract metals; reactivity decides which is suitable.',tell:'Below carbon → cheap carbon reduction. Above carbon → electrolysis.'}
);
CHEM.MODELS.push(
 {c:'Le Chatelier & equilibrium control',topic:'Rates & equilibrium',model:'A reversible reaction at equilibrium shifts to oppose any change in concentration, pressure or temperature. Industry uses this, plus catalysts, to choose conditions balancing yield, rate and cost.',wrong:['Catalysts increase yield.','Heating an exothermic reaction always raises yield.'],predict:['Add reactant / remove product → shifts forward.','Raise pressure → shifts to fewer gas molecules.','Heat → shifts in the endothermic direction.'],bound:['Catalysts change rate, not position.','Inert gas at constant volume has no effect.'],ex:['The Haber process conditions.','Maximising industrial yields.']},
 {c:'Organic families (homologous series)',topic:'Organic chemistry',model:'Hydrocarbons and their derivatives fall into families (alkanes, alkenes, alcohols) with a general formula and trends in properties. Crude oil supplies them; cracking and addition reactions convert between them.',wrong:['Crude oil is one compound.','All polymers form the same way.'],predict:['Alkenes decolourise bromine water; alkanes don\'t.','Longer chains have higher boiling points.','Cracking makes shorter alkanes + alkenes.'],bound:['Combustion can be complete or incomplete.','Addition vs condensation polymers differ.'],ex:['Fuels and plastics.','Identifying unsaturation.']},
 {c:'Extraction & reactivity',topic:'Chemical changes / acids',model:'A metal\'s position in the reactivity series decides how it is found and extracted: very reactive metals are electrolysed, less reactive ones reduced by carbon, and unreactive ones found native.',wrong:['All metals are extracted by electrolysis.','Reactivity is random.'],predict:['Above carbon → electrolysis.','Below carbon → carbon reduction.','More reactive metals displace less reactive ones.'],bound:['Cost drives the choice of method.','Gold/silver occur uncombined.'],ex:['Extracting aluminium vs iron.','Predicting displacement.']},
 {c:'Energy from bonds',topic:'Energy changes',model:'Every reaction breaks bonds (energy in) and makes bonds (energy out). Comparing the totals gives the overall energy change and whether the reaction warms or cools the surroundings.',wrong:['Breaking bonds releases energy.','Exothermic reactions feel cold.'],predict:['ΔH = bonds broken − bonds made.','Negative ΔH = exothermic (warms).','Activation energy must still be supplied.'],bound:['Bond energies are averages.','Total energy is always conserved.'],ex:['Calculating ΔH from bond energies.','Choosing fuels.']}
);

/* ============ BIOLOGY content pack — EXPANSION ============ */
BIO.MIS.push(
 {t:'Aerobic respiration happens in the lungs',topic:'Bioenergetics (photo/resp)',wrong:'Respiration takes place in the lungs where the oxygen is.',right:'Respiration happens in EVERY cell, inside the mitochondria. The lungs only carry out gas exchange — getting oxygen into the blood and CO₂ out. The oxygen is then delivered to cells, where respiration actually occurs.',ana:'The lungs are the loading bay; the engines (mitochondria) that burn the fuel are throughout the whole building.',tell:'Respiration = in cells (mitochondria). Lungs = gas exchange only.'},
 {t:'Mitosis produces gametes',topic:'Inheritance & genetics',wrong:'Sperm and egg cells are made by mitosis.',right:'Gametes are made by MEIOSIS, which halves the chromosome number and shuffles genes, giving variation. Mitosis makes genetically identical body cells for growth and repair.',ana:'Mitosis photocopies; meiosis deals out half-decks for new, varied hands.',tell:'Gametes ← meiosis (halving + variation). Body cells ← mitosis (identical copies).'},
 {t:'Evolution has a goal or direction',topic:'Variation & evolution',wrong:'Organisms evolve in order to become better or more advanced.',right:'Evolution has no goal or foresight. Random variation arises, and whatever happens to survive and reproduce in the current environment becomes common. "Better" only means better suited right now.',ana:'A river has no destination in mind — it simply follows the lowest path available.',tell:'Evolution is undirected: selection acts on existing variation, with no plan or "progress".'},
 {t:'Humans evolved from chimpanzees',topic:'Variation & evolution',wrong:'We are descended from modern chimps.',right:'Humans and chimps share a COMMON ANCESTOR that lived millions of years ago; both species evolved separately from it. Modern chimps are our cousins, not our ancestors.',ana:'You are not descended from your cousin — you both come from shared grandparents.',tell:'Humans and chimps share a common ancestor; we did not evolve from living chimps.'},
 {t:'"Theory" of evolution means it is just a guess',topic:'Variation & evolution',wrong:'Evolution is "only a theory", so it is unproven.',right:'In science, a THEORY is a well-tested explanation supported by a large body of evidence (fossils, DNA, observed selection) — not a hunch. Evolution is one of the best-evidenced ideas in biology.',ana:'"Theory" in science is like "the theory of gravity" — solidly evidenced, not a casual guess.',tell:'Scientific theory = robustly evidenced explanation, not a guess. Evolution is strongly supported.'},
 {t:'All cells have a nucleus',topic:'Cell biology',wrong:'Every cell contains a nucleus.',right:'Bacterial cells have NO nucleus (their DNA is a loop free in the cytoplasm), and mature human red blood cells lose theirs to carry more oxygen. A nucleus is typical of eukaryotic cells, not universal.',ana:'Most houses have a study, but not all — some are built without one for a special purpose.',tell:'Bacteria and red blood cells have no nucleus. Nucleus = typical of eukaryotes, not all cells.'},
 {t:'Photosynthesis happens in every plant cell',topic:'Bioenergetics (photo/resp)',wrong:'All cells of a plant photosynthesise.',right:'Only cells with CHLOROPLASTS, in the light, photosynthesise — mainly the palisade and spongy mesophyll in leaves. Roots have no chloroplasts and never see light, so they do not photosynthesise (but they do respire).',ana:'Only the rooms with solar panels (and sunlight) generate power; the basement does not.',tell:'Photosynthesis needs chloroplasts + light — leaf cells, not roots.'},
 {t:'Decomposers are unimportant',topic:'Ecology',wrong:'Bacteria and fungi that rot things just cause decay and disease.',right:'Decomposers are essential: they break down dead matter and return carbon and mineral nutrients (like nitrogen) to the soil and air, allowing the cycles of life to continue. Without them, nutrients would stay locked in dead bodies.',ana:'They are the recycling crew — without them, the world would pile up with un-reused material.',tell:'Decomposers recycle nutrients (carbon, nitrogen) back into ecosystems — vital, not just "rot".'},
 {t:'Diffusion stops once concentrations are equal',topic:'Transport (diffusion/osmosis)',wrong:'At equilibrium, particles stop moving across the membrane.',right:'Particles keep moving randomly even at equilibrium — there is just no NET movement, because as many cross each way. Diffusion is dynamic; equilibrium means balance, not stillness.',ana:'A crowd evenly spread keeps milling about, but the overall numbers on each side stay equal.',tell:'At equilibrium there is no NET diffusion, but particles still move randomly both ways.'},
 {t:'Antibodies and antibiotics are the same thing',topic:'Disease & immunity',wrong:'Antibodies and antibiotics both fight infection, so they are interchangeable.',right:'ANTIBODIES are proteins your own white blood cells make to target a specific pathogen. ANTIBIOTICS are drugs (often from fungi) that kill bacteria. One is made by your immune system; the other is a medicine.',ana:'Antibodies are the body\'s own custom-made guards; antibiotics are reinforcements brought in from outside.',tell:'Antibodies = made by your white blood cells. Antibiotics = drugs that kill bacteria.'},
 {t:'The heart adds oxygen to the blood',topic:'Circulation & blood',wrong:'Blood is oxygenated in the heart.',right:'Blood picks up oxygen in the LUNGS, not the heart. The heart is a pump that pushes blood to the lungs (to be oxygenated) and then to the body. It moves blood; it does not oxygenate it.',ana:'A pump moves water through a filter; the pump does not clean the water — the filter does.',tell:'Lungs oxygenate the blood; the heart just pumps it (to the lungs, then the body).'},
 {t:'Tendons join bone to bone',topic:'Organisation & enzymes',wrong:'Tendons hold bones together at a joint.',right:'TENDONS connect MUSCLE to bone (so the muscle can pull the bone); LIGAMENTS connect BONE to bone (stabilising joints). Mixing them up is common but they have different jobs.',ana:'Tendons are the ropes from the engine (muscle) to the load (bone); ligaments lash two bones together.',tell:'Tendon = muscle→bone. Ligament = bone→bone.'},
 {t:'Identical twins are identical in every way',topic:'Variation & evolution',wrong:'Identical twins have the same everything, including fingerprints.',right:'Identical twins share the same DNA but differ due to ENVIRONMENT — fingerprints, scars, even fitness differ. Variation comes from genes AND environment; only the genetic part is shared.',ana:'Two prints from the same template still differ if pressed differently.',tell:'Identical twins share genes, not environment — so they are not identical in everything.'},
 {t:'Enzymes are used up in the reactions they speed up',topic:'Organisation & enzymes',wrong:'An enzyme is consumed each time it works.',right:'Enzymes are biological CATALYSTS — they are not used up and can work again and again. A small amount can convert a large amount of substrate over time.',ana:'A key opens the same lock repeatedly without wearing out the door.',tell:'Enzymes are reusable catalysts — not consumed by the reaction.'},
 {t:'Carbon dioxide is toxic like carbon monoxide',topic:'Bioenergetics (photo/resp)',wrong:'CO₂ from respiration is a deadly poison.',right:'Carbon dioxide is a normal waste product we breathe out and is not poisonous at ordinary levels. CARBON MONOXIDE (CO) is the deadly gas — it binds to haemoglobin and stops it carrying oxygen.',ana:'CO₂ is the exhaust we all breathe out; CO is the silent killer from faulty heaters.',tell:'CO₂ = harmless waste gas. CO (carbon monoxide) = toxic, blocks oxygen transport.'}
);
BIO.ANA.push(
 {topic:'Cell biology',k:'Mitochondria = power stations',v:'These are where aerobic respiration releases energy from glucose. Busy cells (muscle, liver) are packed with mitochondria — more power stations for higher energy demand.'},
 {topic:'Bioenergetics (photo/resp)',k:'Chloroplasts = solar panels',v:'They capture light energy and use it to build glucose from CO₂ and water. Only cells with chloroplasts, in the light, can do this — mainly leaf cells.'},
 {topic:'Inheritance & genetics',k:'DNA replication = photocopying',v:'Before a cell divides, its DNA is copied exactly so each new cell gets a full set of instructions. Mitosis hands out identical photocopies.'},
 {topic:'Ecology',k:'Decomposers = nature\'s recycling crew',v:'Bacteria and fungi break down dead matter, returning carbon to the air and minerals to the soil so plants can reuse them. Without them, nutrients stay trapped in the dead.'},
 {topic:'Homeostasis & nervous system',k:'Hormones = chemical messengers in the post',v:'Glands release hormones into the blood, which carries them (slowly, widely) to target organs. Slower than nerve "phone calls", but longer-lasting and affecting many organs at once.'},
 {topic:'Bioenergetics (photo/resp)',k:'Limiting factor = the slowest worker',v:'A process runs no faster than its slowest requirement. In photosynthesis, light, CO₂ or temperature can each cap the rate — raise the limiting one and the rate climbs until another takes over.'},
 {topic:'Circulation & blood',k:'Capillaries = delivery to every door',v:'These tiny, one-cell-thick vessels reach every cell, letting oxygen and glucose diffuse out and waste diffuse in. Their thin walls and huge number make exchange fast and complete.'},
 {topic:'Organisation & enzymes',k:'Stomata = adjustable windows',v:'Tiny pores on leaves open to let CO₂ in (and water vapour out) and close to save water. Guard cells act like shutters, balancing photosynthesis against water loss.'},
 {topic:'Disease & immunity',k:'Phagocyte = a security guard that swallows intruders',v:'These white blood cells engulf and digest pathogens (phagocytosis), tackling any invader. Lymphocytes, by contrast, make a specific antibody for each particular pathogen.'},
 {topic:'Disease & immunity',k:'Antibodies = custom keys for antigen locks',v:'Each pathogen carries unique surface antigens (locks); lymphocytes make antibodies (keys) shaped to fit only those, marking the pathogen for destruction and giving lasting memory.'}
);
BIO.TRIG.push(
 {s:'Yeast is added to a sugary dough in a warm place and the dough rises as bubbles form.',mode:'multi',opts:[{t:'Anaerobic respiration (fermentation)',c:1},{t:'Carbon dioxide produced',c:1},{t:'Yeast respiring without oxygen',c:1},{t:'Photosynthesis',c:0}],why:'Yeast ferments the sugar anaerobically, producing ethanol and carbon dioxide; the CO₂ bubbles make the dough rise.'},
 {s:'After a 100 m sprint, an athlete keeps breathing hard for several minutes and their muscles ache.',mode:'multi',opts:[{t:'Anaerobic respiration occurred',c:1},{t:'Lactic acid built up',c:1},{t:'Repaying an oxygen debt',c:1},{t:'Aerobic respiration only',c:0}],why:'Sprinting outpaces oxygen supply, so muscles respire anaerobically, making lactic acid. The continued hard breathing repays the oxygen debt to break it down.'},
 {s:'You walk from a dark room into bright sunlight and your pupils shrink without you thinking about it.',mode:'multi',opts:[{t:'Reflex action',c:1},{t:'Protecting the retina',c:1},{t:'Automatic, not conscious',c:1},{t:'A hormonal response',c:0}],why:'The pupil reflex is a fast, automatic nervous response that protects the retina from bright light — no conscious thought required.'},
 {s:'On a hot day you start to sweat and your skin flushes red.',mode:'multi',opts:[{t:'Thermoregulation',c:1},{t:'Homeostasis',c:1},{t:'Cooling by evaporation and vasodilation',c:1},{t:'Shivering',c:0}],why:'To lose heat, blood vessels dilate (flushing) and sweat evaporates, cooling the body — negative feedback keeping core temperature steady.'},
 {s:'A bacterial population is treated repeatedly with an antibiotic, and over time the infection stops responding to it.',mode:'multi',opts:[{t:'Natural selection',c:1},{t:'Antibiotic resistance',c:1},{t:'Resistant mutants survived and reproduced',c:1},{t:'The bacteria chose to resist',c:0}],why:'A few bacteria carry resistance mutations; the antibiotic kills the rest, so resistant ones survive and multiply — natural selection producing a resistant population.'},
 {s:'A wilted plant becomes firm and upright again a few hours after watering.',mode:'multi',opts:[{t:'Osmosis',c:1},{t:'Cells become turgid',c:1},{t:'Water entering by water potential',c:1},{t:'Active transport of water',c:0}],why:'Water enters the cells by osmosis, making them turgid and pushing against the cell walls, so the plant becomes firm again.'},
 {s:'As light intensity increases, the rate of photosynthesis rises then levels off even though the light keeps getting brighter.',mode:'multi',opts:[{t:'Limiting factors',c:1},{t:'Another factor (CO₂ or temperature) now limits the rate',c:1},{t:'Investigating photosynthesis',c:1},{t:'Light is no longer needed',c:0}],why:'Once light is plentiful, something else (CO₂ level or temperature) becomes the limiting factor, capping the rate no matter how bright the light.'},
 {s:'Fallen leaves in a forest gradually rot away, and the soil becomes richer.',mode:'multi',opts:[{t:'Decomposers at work',c:1},{t:'The carbon cycle',c:1},{t:'Nutrients returned to the soil',c:1},{t:'Photosynthesis',c:0}],why:'Decomposers (bacteria and fungi) break down the dead leaves, releasing CO₂ and returning minerals to the soil — a key part of the carbon and nutrient cycles.'},
 {s:'A farmer always breeds from the cows that produce the most milk, and over generations milk yields rise.',mode:'multi',opts:[{t:'Selective breeding',c:1},{t:'Choosing parents with desired traits',c:1},{t:'Concentrating useful alleles',c:1},{t:'Natural selection',c:0}],why:'The farmer (not nature) selects which animals reproduce, concentrating the high-yield alleles over generations — selective breeding.'},
 {s:'Two brown-eyed parents have a blue-eyed child.',mode:'multi',opts:[{t:'Blue is recessive',c:1},{t:'Both parents are carriers (Bb)',c:1},{t:'Genetic inheritance',c:1},{t:'A new mutation in the child',c:0}],why:'Both brown-eyed parents must carry a hidden recessive blue allele (Bb × Bb); a 1-in-4 chance gives a blue-eyed (bb) child — the allele was carried, not newly mutated.'},
 {s:'When most children in a school are vaccinated, even the few unvaccinated ones rarely catch the disease.',mode:'multi',opts:[{t:'Herd immunity',c:1},{t:'The pathogen can\'t spread easily',c:1},{t:'Vaccination protects the wider community',c:1},{t:'The vaccine spread to others',c:0}],why:'With most people immune, the pathogen cannot find enough hosts to spread, so even the unvaccinated are protected — herd immunity.'}
);
BIO.QUIZ.push(
 {_mt:'Aerobic respiration happens in the lungs',q:'Where in the body does aerobic respiration actually take place?',opts:[{t:'In the mitochondria of every cell',c:1},{t:'In the lungs',c:0},{t:'In the blood',c:0}],feels:'Oxygen enters at the lungs, so respiration feels like it happens there.',soc:['What is the job of the lungs — gas exchange, or releasing energy?','Which organelle carries out aerobic respiration?','Are mitochondria only in the lungs, or in cells all over the body?']},
 {_mt:'Mitosis produces gametes',q:'Which type of cell division makes sperm and egg cells?',opts:[{t:'Meiosis',c:1},{t:'Mitosis',c:0},{t:'Either one',c:0}],feels:'Mitosis is the division you learn first, so it feels like the default.',soc:['Do gametes have the full number of chromosomes, or half?','Which division halves the chromosome number and adds variation?','So are gametes made by mitosis or meiosis?']},
 {_mt:'Humans evolved from chimpanzees',q:'What is the relationship between humans and modern chimpanzees?',opts:[{t:'We share a common ancestor',c:1},{t:'We are descended from modern chimps',c:0},{t:'Chimps are descended from us',c:0}],feels:'Chimps look like "earlier" humans, so descent feels intuitive.',soc:['Did the shared ancestor live recently, or millions of years ago?','Are modern chimps still evolving today, separately from us?','So are they our ancestors, or our cousins?']},
 {_mt:'"Theory" of evolution means it is just a guess',q:'What does "theory" mean in science, as in the theory of evolution?',opts:[{t:'A well-tested, evidence-backed explanation',c:1},{t:'An unproven guess',c:0},{t:'A personal opinion',c:0}],feels:'In everyday English "theory" often means a hunch.',soc:['Is the "theory of gravity" a guess?','How much evidence supports evolution (fossils, DNA, observed selection)?','So does scientific "theory" mean guess, or well-supported explanation?']},
 {_mt:'Enzymes are used up in the reactions they speed up',q:'After an enzyme has catalysed a reaction, what happens to it?',opts:[{t:'It is unchanged and can work again',c:1},{t:'It is used up',c:0},{t:'It turns into the product',c:0}],feels:'It is so involved that it feels like it must be consumed.',soc:['Is an enzyme a reactant, or a catalyst?','Does a catalyst get used up?','So can the same enzyme molecule work many times?']},
 {_mt:'Decomposers are unimportant',q:'Why are decomposers vital to an ecosystem?',opts:[{t:'They recycle nutrients back to the soil and air',c:1},{t:'They only cause disease',c:0},{t:'They produce energy for the food chain',c:0}],feels:'Rotting seems purely negative, so decomposers feel unimportant.',soc:['What happens to the carbon and minerals locked in dead organisms?','Who breaks down dead matter to release them?','What would happen to nutrient supply without decomposers?']}
);
BIO.EQS.push(
 {id:'cardiac',name:'Cardiac output',form:'cardiac output = stroke volume × heart rate',unit:'mL/min',vars:[{s:'sv',label:'stroke volume',min:40,max:120,step:5,val:70,unit:'mL'},{s:'hr',label:'heart rate',min:40,max:200,step:5,val:70,unit:'bpm'}],calc:v=>v.sv*v.hr,insight:'Cardiac output is how much blood the heart pumps per minute. During exercise both stroke volume and heart rate rise, sharply increasing output to supply working muscles.',predict:{q:'During exercise, cardiac output…',opts:['increases','decreases','stays the same'],a:0}},
 {id:'savratio',name:'Surface area : volume ratio',form:'SA:V = surface area ÷ volume',unit:'',vars:[{s:'sa',label:'surface area',min:1,max:600,step:1,val:6,unit:''},{s:'vol',label:'volume',min:1,max:1000,step:1,val:1,unit:''}],calc:v=>v.sa/v.vol,insight:'Small organisms have a high SA:V ratio, so they can exchange gases across their surface. Larger organisms have a low ratio and need specialised exchange surfaces (lungs, gills) and transport systems.',predict:{q:'As an organism gets bigger, its surface-area-to-volume ratio…',opts:['decreases','increases','stays the same'],a:0}},
 {id:'transrate',name:'Rate of water uptake',form:'rate = volume ÷ time',unit:'mL/min',vars:[{s:'vol',label:'water taken up',min:0,max:50,step:1,val:8,unit:'mL'},{s:'t',label:'time',min:1,max:60,step:1,val:10,unit:'min'}],calc:v=>v.vol/v.t,insight:'Measured with a potometer. Transpiration (and so water uptake) speeds up in warm, dry, windy, bright conditions — anything that increases evaporation from the leaves.',predict:{q:'On a warm, windy day the rate of transpiration is…',opts:['higher','lower','unchanged'],a:0}}
);
BIO.CF.push(
 {topic:'Ecology',o:'A forest floor steadily recycles fallen leaves into rich soil.',f:'What if all the decomposers were removed?',r:'Dead material would pile up and nutrients (carbon, nitrogen) would stay locked inside it. Plants would run short of minerals, and the carbon cycle would stall.'},
 {topic:'Organisation & enzymes',o:'A plant\'s stomata open to let CO₂ in for photosynthesis.',f:'What if you sealed every stoma shut?',r:'Photosynthesis would slow or stop (no CO₂ entering), and the leaf could not lose water vapour — gas exchange and transpiration would both halt.'},
 {topic:'Disease & immunity',o:'White blood cells clear a bacterial infection.',f:'What if a person had no functioning white blood cells?',r:'Even mild infections could become life-threatening, because the body could neither engulf pathogens nor make antibodies. The immune defence would be gone.'},
 {topic:'Disease & immunity',o:'A vaccinated child is protected from measles.',f:'What if vaccination rates dropped sharply?',r:'Herd immunity would break down and outbreaks could return, because the pathogen would find enough unvaccinated hosts to spread between.'},
 {topic:'Bioenergetics (photo/resp)',o:'A plant in bright light photosynthesises quickly.',f:'What if you put it in complete darkness?',r:'Photosynthesis would stop entirely (it needs light), but respiration would continue — so the plant would take in oxygen and release CO₂ overall.'},
 {topic:'Variation & evolution',o:'Selective breeding has produced high-yielding crops.',f:'What if breeders kept crossing only very closely related plants?',r:'Inbreeding reduces genetic variation, so the population becomes vulnerable — a single new disease could wipe out the lot, with no resistant variants to survive.'},
 {topic:'Homeostasis & nervous system',o:'Blood glucose is kept steady by insulin and glucagon.',f:'What if the body stopped responding to insulin (Type 2 diabetes)?',r:'Blood glucose would stay high after meals because cells could not take it up properly — managed by diet, exercise and sometimes medication.'}
);
BIO.CONTRAST.push(
 {a:'Gene',b:'Allele',topic:'Inheritance & genetics',rows:[['Definition','a section of DNA coding a protein','a version of a gene'],['Example','the gene for eye colour','brown allele vs blue allele'],['How many','one per characteristic','different versions exist'],['Inherited','—','one allele from each parent']],confusion:'The words are used loosely, but a gene can have several alleles.',tell:'Gene = the instruction for a trait. Allele = a particular version of that gene.'},
 {a:'Sexual reproduction',b:'Asexual reproduction',topic:'Inheritance & genetics',rows:[['Parents','two','one'],['Gametes','yes (fertilisation)','none'],['Offspring','genetically varied','identical clones'],['Division','meiosis + fusion','mitosis'],['Advantage','variation (adaptable)','fast, no mate needed']],confusion:'Both make new organisms, but only sexual reproduction generates variation.',tell:'Sexual = two parents, varied offspring. Asexual = one parent, identical clones.'},
 {a:'Inhaled air',b:'Exhaled air',topic:'Bioenergetics (photo/resp)',rows:[['Oxygen','more (~21%)','less (~16%)'],['Carbon dioxide','little (~0.04%)','more (~4%)'],['Water vapour','variable','more (saturated)'],['Temperature','ambient','warmer']],confusion:'Both are "air", but respiration changes its composition.',tell:'Exhaled air has less O₂, more CO₂ and water vapour — evidence of respiration.'},
 {a:'Type 1 diabetes',b:'Type 2 diabetes',topic:'Hormones',rows:[['Cause','pancreas makes little/no insulin','cells stop responding to insulin'],['Onset','often childhood','often later life'],['Treatment','insulin injections','diet, exercise, medication'],['Risk factors','—','obesity, inactivity']],confusion:'Both raise blood glucose, but the cause is different.',tell:'Type 1 = no insulin produced (inject it). Type 2 = insulin resistance (manage lifestyle).'},
 {a:'Phagocyte',b:'Lymphocyte',topic:'Disease & immunity',rows:[['Action','engulfs pathogens (phagocytosis)','makes specific antibodies'],['Specificity','any pathogen','one particular pathogen'],['Memory','no','yes (memory cells)'],['Speed','immediate','slower, but lasting']],confusion:'Both are white blood cells, but they defend in different ways.',tell:'Phagocytes engulf any invader; lymphocytes make specific antibodies and memory.'},
 {a:'Antigen',b:'Antibody',topic:'Disease & immunity',rows:[['What it is','marker on a pathogen','protein made by lymphocytes'],['Made by','the pathogen','your immune system'],['Role','identifies the invader','locks onto and tags the antigen'],['Fit','the lock','the key']],confusion:'Similar names; one is on the pathogen, one is your defence.',tell:'Antigen = the pathogen\'s marker (lock). Antibody = your matching protein (key).'}
);
BIO.MODELS.push(
 {c:'The cell as a factory',topic:'Cell biology',model:'Each organelle has a job: nucleus (control/DNA), mitochondria (respiration/energy), ribosomes (protein synthesis), chloroplasts (photosynthesis, plants), cell membrane (controls entry/exit). Specialised cells exaggerate the parts they need.',wrong:['All cells have a nucleus.','Respiration happens in the lungs.'],predict:['Active cells have many mitochondria.','Leaf cells are packed with chloroplasts.','Bacteria lack a nucleus and membrane-bound organelles.'],bound:['Red blood cells lose their nucleus.','Plant cells also have a wall, vacuole and chloroplasts.'],ex:['Linking structure to function.','Comparing plant, animal and bacterial cells.']},
 {c:'Gas exchange & breathing',topic:'Organisation & enzymes',model:'Large active organisms need specialised surfaces (alveoli) to exchange gases fast. Alveoli are numerous, thin, moist and well-supplied with blood, maximising diffusion of O₂ in and CO₂ out. Breathing ventilates them.',wrong:['Breathing and respiration are the same.','The lungs oxygenate by respiring.'],predict:['Bigger surface area → faster exchange.','A steep concentration gradient speeds diffusion.','Exhaled air has more CO₂ and water vapour.'],bound:['Gas exchange is diffusion; respiration is in cells.','Damage (e.g. emphysema) reduces surface area.'],ex:['Why alveoli are adapted as they are.','Effects of smoking on the lungs.']},
 {c:'The carbon cycle',topic:'Ecology',model:'Carbon moves between the atmosphere, living things and the ground. Photosynthesis removes CO₂; respiration, decomposition and combustion return it. Human burning of fossil fuels adds CO₂ faster than it is removed, raising atmospheric levels.',wrong:['Decomposers are unimportant.','Energy is recycled like carbon.'],predict:['Photosynthesis is a carbon sink; respiration a source.','Decomposers return carbon to the air and soil.','Burning fossil fuels raises atmospheric CO₂.'],bound:['Matter cycles; energy flows one way.','Oceans and forests are major carbon stores.'],ex:['Explaining rising CO₂.','The role of decomposers.']},
 {c:'Variation, classification & evolution',topic:'Variation & evolution',model:'Variation arises from genes and environment. Heritable variation plus selection pressure drives evolution over generations. Organisms are classified by shared features and, increasingly, by DNA, reflecting common ancestry.',wrong:['Individuals evolve.','Evolution has a goal.','We evolved from modern chimps.'],predict:['Common ancestors explain shared features.','DNA evidence refines classification.','Selection acts on existing variation.'],bound:['Only heritable variation is passed on.','Evolution is undirected.'],ex:['Antibiotic resistance.','Reading evolutionary trees.']}
);

/* ============ MATHS content pack — EXPANSION ============ */
MATHS.MIS.push(
 {t:'−3² and (−3)² are the same',topic:'Number',wrong:'−3² equals 9.',right:'Without brackets, the power binds tighter than the minus sign: −3² means −(3²) = −9. With brackets, (−3)² = (−3)×(−3) = +9. The brackets change everything.',ana:'The minus is "outside" the square unless brackets pull it in.',tell:'−3² = −9 (square first, then negate). (−3)² = 9 (negate first). Brackets matter.'},
 {t:'Dividing by a fraction makes the answer smaller',topic:'Number',wrong:'8 ÷ ½ is less than 8.',right:'Dividing by a fraction less than 1 makes the answer BIGGER: 8 ÷ ½ = 8 × 2 = 16. "Flip and multiply" — dividing by ½ is the same as multiplying by 2.',ana:'"How many halves fit in 8?" — sixteen of them, more than 8.',tell:'Divide by a fraction = multiply by its reciprocal. ÷½ means ×2 (bigger).'},
 {t:'Anything to the power zero is zero',topic:'Algebra',wrong:'5⁰ = 0.',right:'Any non-zero number to the power 0 equals 1: 5⁰ = 1. Following the index pattern (5³=125, 5²=25, 5¹=5, dividing by 5 each step) the next is 5⁰ = 1, not 0.',ana:'Each step down divides by 5; from 5¹ = 5, the next is 5 ÷ 5 = 1.',tell:'a⁰ = 1 for any non-zero a. Not zero.'},
 {t:'You never flip the inequality sign',topic:'Algebra',wrong:'Solving inequalities is exactly like equations — the sign stays put.',right:'When you multiply or divide BOTH sides by a NEGATIVE number, you must FLIP the inequality: −2x < 6 becomes x > −3 (not x < −3). Negatives reverse the order on the number line.',ana:'Turning the number line around swaps which side is "bigger".',tell:'Multiply/divide an inequality by a negative → flip the sign (< ↔ >).'},
 {t:'A probability can be more than 1',topic:'Probability',wrong:'A probability of 1.5 or 150% is fine.',right:'Probability runs from 0 (impossible) to 1 (certain). A value above 1 or below 0 is impossible — usually a sign of adding probabilities that should have been multiplied, or a miscount.',ana:'You cannot be "150% certain" — certainty maxes out at 1.',tell:'0 ≤ probability ≤ 1. A value outside that range signals an error.'},
 {t:'Perpendicular lines have the same gradient',topic:'Geometry & measures',wrong:'Lines at right angles have related-looking gradients of the same sign.',right:'Perpendicular gradients are NEGATIVE RECIPROCALS: if one line has gradient m, the perpendicular has −1/m. So gradient 2 → perpendicular gradient −½. Parallel lines (not perpendicular) share the same gradient.',ana:'Turning 90° flips steepness and direction — reciprocal and negative.',tell:'Parallel: same gradient. Perpendicular: gradient × (−1/that) — negative reciprocal.'},
 {t:'The interior angles of a polygon always add to 360°',topic:'Geometry & measures',wrong:'All polygons\' interior angles sum to 360°.',right:'It is the EXTERIOR angles that always sum to 360°. The INTERIOR angles sum to (n − 2) × 180°, which grows with the number of sides — a pentagon\'s interior angles total 540°, not 360°.',ana:'Walking once round any polygon you turn through 360° in total (exterior angles), however many corners there are.',tell:'Exterior angles sum to 360° always. Interior sum = (n − 2) × 180°.'},
 {t:'To reverse a percentage increase, decrease by the same percentage',topic:'Ratio & proportion',wrong:'A price is £120 after a 20% rise, so the original was £120 − 20% = £96.',right:'You must DIVIDE by the multiplier, not subtract the percentage. £120 ÷ 1.2 = £100 — that was the original. Subtracting 20% of the new price gives the wrong answer.',ana:'To undo "×1.2" you divide by 1.2, not subtract a fifth of the bigger number.',tell:'Reverse percentage: divide by the multiplier (÷1.2), don\'t subtract the same %.'},
 {t:'The estimated mean of grouped data uses the class widths',topic:'Statistics',wrong:'To estimate the mean from a grouped frequency table, add up the frequencies and divide.',right:'You use the MIDPOINT of each class as the representative value: estimated mean = Σ(midpoint × frequency) ÷ Σfrequency. You cannot find the exact mean from grouped data, only an estimate.',ana:'Each group is "represented" by the value in its middle, then weighted by how many are in it.',tell:'Estimated mean = Σ(midpoint × frequency) ÷ total frequency.'},
 {t:'Speed–time and distance–time graphs are read the same way',topic:'Ratio & proportion',wrong:'The gradient and area mean the same on both graphs.',right:'On a DISTANCE–time graph the GRADIENT is speed. On a SPEED–time graph the GRADIENT is acceleration and the AREA underneath is distance. The same feature means different things on each.',ana:'Same-looking graphs, different stories — always check the axes first.',tell:'Distance–time: gradient = speed. Speed–time: gradient = acceleration, area = distance.'},
 {t:'You can add surds like √2 + √3 = √5',topic:'Number',wrong:'√2 + √3 simplifies to √5.',right:'Surds do NOT add like that: √2 + √3 stays as it is (≈ 3.15, while √5 ≈ 2.24). You can only combine LIKE surds: 2√3 + 4√3 = 6√3. And √a × √b = √(ab).',ana:'You cannot merge "two roots" into one any more than 2 apples + 3 oranges = 5 of one fruit.',tell:'√a + √b ≠ √(a+b). Only add LIKE surds; multiply with √a × √b = √(ab).'},
 {t:'Rounding early in a calculation is fine',topic:'Number',wrong:'You can round each step to keep the numbers tidy.',right:'Rounding too early causes errors that build up. Keep full accuracy through the working and round only the FINAL answer to the required degree. Use the exact (or stored) value for intermediate steps.',ana:'Trimming each plank before measuring the whole shelf leaves it the wrong length.',tell:'Carry full precision through; round only at the end.'},
 {t:'The median is just the middle position number',topic:'Statistics',wrong:'For 20 values, the median is the 10th value.',right:'The median position is (n + 1) ÷ 2. For 20 values that is the 10.5th — the mean of the 10th and 11th values. For an even count you average the two middle (ordered) values.',ana:'With an even line of people, the "middle" sits between two of them — take the average of both.',tell:'Median position = (n+1)/2. Even n → average the two middle values.'},
 {t:'A ratio is the same as a fraction of the whole',topic:'Ratio & proportion',wrong:'In the ratio 2:3, the first part is 2/3 of the total.',right:'In 2:3 the parts are 2/5 and 3/5 of the WHOLE (because 2 + 3 = 5 parts). 2:3 means "2 parts to 3 parts", not "2 out of 3".',ana:'2:3 splits the cake into 5 slices, giving 2 and 3 — not 2 out of 3.',tell:'Ratio a:b → fractions a/(a+b) and b/(a+b) of the whole.'}
);
MATHS.ANA.push(
 {topic:'Algebra',k:'Inequalities = a number line, not a point',v:'An equation pins x to a value; an inequality gives a range. Solve like an equation, but remember multiplying or dividing by a negative flips the direction, like turning the number line around.'},
 {topic:'Geometry & measures',k:'Vectors = journeys with arrows',v:'A vector says "go this far in this direction". Adding vectors is doing one journey then another; the vector from A to B is "where you end minus where you start".'},
 {topic:'Algebra',k:'Simultaneous equations = where the lines cross',v:'Two equations are two lines; their solution is the single point that lies on both — the intersection. Elimination and substitution are just algebraic ways to find that crossing point.'},
 {topic:'Statistics',k:'Box plot = a five-number snapshot',v:'Minimum, lower quartile, median, upper quartile and maximum summarise a whole data set at a glance. The box holds the middle half (the interquartile range), showing the spread.'},
 {topic:'Statistics',k:'Cumulative frequency = a running total',v:'You keep adding frequencies as you go, so the graph only ever rises. Reading across from the half-way total gives the median; the quartiles come from the quarter and three-quarter points.'},
 {topic:'Probability',k:'Tree diagram = branching outcomes',v:'Each branch is a possible result with its probability. Multiply along a path (this AND then that) and add between paths (this OR that) to combine events without missing any.'},
 {topic:'Number',k:'Standard form = sliding the decimal point',v:'Writing a number as A × 10ⁿ just records how far the decimal point has moved. A big positive power means a large number; a negative power means a small one.'},
 {topic:'Geometry & measures',k:'Circle theorems = the rules of the circle',v:'A handful of fixed rules (angle in a semicircle is 90°, angles in the same segment are equal, the angle at the centre is twice the angle at the circumference) let you chase unknown angles around a circle.'},
 {topic:'Algebra',k:'Quadratic graph = a U-shaped bridge',v:'A quadratic curves into a parabola. Its roots are where it crosses the x-axis (the solutions), its turning point is the lowest (or highest) value, and a positive x² opens upward.'}
);
MATHS.TRIG.push(
 {s:'You must solve x² + 3x + 1 = 0, which does not factorise into whole numbers.',mode:'multi',opts:[{t:'The quadratic formula',c:1},{t:'Completing the square',c:1},{t:'Factorising into neat brackets',c:0},{t:'Dividing by x',c:0}],why:'When a quadratic will not factorise neatly, use the quadratic formula (or complete the square). Factorising only works for "nice" numbers, and you must never divide by x.'},
 {s:'A jacket costs £60 after a 20% discount, and you need the original price.',mode:'single',opts:[{t:'Reverse percentage: 60 ÷ 0.8',c:1},{t:'Add 20% to £60',c:0},{t:'60 × 0.8',c:0},{t:'60 + 20',c:0}],why:'£60 is 80% of the original, so divide by 0.8 to get £75. Adding 20% to the sale price gives the wrong answer — you must undo the multiplier.'},
 {s:'You are given a speed–time graph and need the total distance travelled.',mode:'single',opts:[{t:'Find the area under the graph',c:1},{t:'Find the gradient',c:0},{t:'Read the highest point',c:0},{t:'Use Pythagoras',c:0}],why:'On a speed–time graph, the AREA underneath represents distance. The gradient would give acceleration, not distance.'},
 {s:'You have a distance–time graph and want the speed at a steady section.',mode:'single',opts:[{t:'Find the gradient',c:1},{t:'Find the area underneath',c:0},{t:'Read off the y-intercept',c:0},{t:'Use the cosine rule',c:0}],why:'On a distance–time graph the GRADIENT (rise over run) is the speed. Area under it has no meaningful interpretation here.'},
 {s:'You need each interior angle of a regular hexagon.',mode:'single',opts:[{t:'(n−2)×180 ÷ n',c:1},{t:'360 ÷ n only',c:0},{t:'180 − n',c:0},{t:'n × 180',c:0}],why:'Interior angle sum is (n−2)×180 = 720° for a hexagon; divide by 6 sides for a regular shape → 120° each. (360 ÷ n gives the exterior angle.)'},
 {s:'You must find the area of an L-shaped (compound) figure.',mode:'multi',opts:[{t:'Split it into rectangles',c:1},{t:'Add the parts together',c:1},{t:'Subtract a cut-out from a big rectangle',c:1},{t:'Use πr²',c:0}],why:'Compound shapes are handled by splitting into known shapes and adding, or by finding a larger rectangle and subtracting the missing piece.'},
 {s:'You have a grouped frequency table and need an estimate of the mean.',mode:'single',opts:[{t:'Σ(midpoint × frequency) ÷ Σfrequency',c:1},{t:'Add the frequencies and divide by how many groups',c:0},{t:'Take the middle class',c:0},{t:'Use the class widths',c:0}],why:'Use the midpoint of each class as the representative value, weight by frequency, and divide by the total frequency — this estimates the mean.'},
 {s:'A shape is mapped onto another by a turn about a fixed point.',mode:'multi',opts:[{t:'Rotation',c:1},{t:'Describe with centre and angle',c:1},{t:'State the direction of turn',c:1},{t:'Translation by a vector',c:0}],why:'A turn about a point is a rotation; to describe it fully you give the centre, the angle and the direction (clockwise/anticlockwise).'},
 {s:'You are comparing two data sets where one has an extreme outlier.',mode:'multi',opts:[{t:'Compare the medians',c:1},{t:'Consider the range/IQR for spread',c:1},{t:'Be cautious using the mean',c:1},{t:'Just compare the modes',c:0}],why:'An outlier distorts the mean, so the median (and IQR) give a fairer comparison of typical value and spread.'},
 {s:'You know the position vectors of A and B and want the vector from A to B.',mode:'single',opts:[{t:'Subtract: b − a',c:1},{t:'Add: a + b',c:0},{t:'Multiply them',c:0},{t:'Average them',c:0}],why:'The vector AB is "destination minus start": b − a. Adding or averaging position vectors does not give the journey between them.'},
 {s:'In a circle, you need the angle at the circumference standing on a diameter.',mode:'single',opts:[{t:'It is 90° (angle in a semicircle)',c:1},{t:'It equals the centre angle',c:0},{t:'Use Pythagoras',c:0},{t:'It is 180°',c:0}],why:'The angle in a semicircle (subtended by a diameter at the circumference) is always 90° — a standard circle theorem.'}
);
MATHS.QUIZ.push(
 {_mt:'−3² and (−3)² are the same',q:'What is −3² (no brackets)?',opts:[{t:'−9',c:1},{t:'9',c:0},{t:'−6',c:0}],feels:'It looks like you are squaring −3, which would be +9.',soc:['Does the power apply to the 3 or to the −3 when there are no brackets?','So is it −(3²) or (−3)²?','What is −(3²)?']},
 {_mt:'Anything to the power zero is zero',q:'What is 7⁰?',opts:[{t:'1',c:1},{t:'0',c:0},{t:'7',c:0}],feels:'"Power zero" sounds like it should give zero.',soc:['Follow the pattern: 7³=343, 7²=49, 7¹=7. What do you divide by each step?','7¹ ÷ 7 = ?','So what is 7⁰?']},
 {_mt:'Dividing by a fraction makes the answer smaller',q:'What is 8 ÷ ½?',opts:[{t:'16',c:1},{t:'4',c:0},{t:'8',c:0}],feels:'Dividing "should" make things smaller.',soc:['How many halves fit into one whole?','So how many halves fit into 8?','Is that more or less than 8?']},
 {_mt:'Perpendicular lines have the same gradient',q:'A line has gradient 2. What is the gradient of a line perpendicular to it?',opts:[{t:'−½',c:1},{t:'2',c:0},{t:'−2',c:0}],feels:'Same line family, so the same gradient feels natural.',soc:['Do perpendicular or parallel lines share a gradient?','What is the negative reciprocal of 2?','So what is the perpendicular gradient?']},
 {_mt:'To reverse a percentage increase, decrease by the same percentage',q:'After a 25% rise a price is £100. What was the original price?',opts:[{t:'£80 (100 ÷ 1.25)',c:1},{t:'£75 (100 − 25%)',c:0},{t:'£125',c:0}],feels:'Subtracting 25% of £100 seems like the natural reverse.',soc:['£100 represents what percentage of the original (100% + 25%)?','To undo "×1.25", do you subtract or divide?','What is 100 ÷ 1.25?']},
 {_mt:'A probability can be more than 1',q:'You calculate a probability of 1.3. What does that tell you?',opts:[{t:'You have made an error',c:1},{t:'The event is very likely',c:0},{t:'It means 130% certain',c:0}],feels:'A bigger number looks like "more likely".',soc:['What is the largest a probability can be?','Is 1.3 within the range 0 to 1?','So what does a value above 1 indicate?']}
);
MATHS.EQS.push(
 {id:'discriminant',name:'Quadratic discriminant',form:'b² − 4ac',unit:'',vars:[{s:'a',label:'a',min:-5,max:5,step:0.5,val:1,unit:''},{s:'b',label:'b',min:-10,max:10,step:0.5,val:3,unit:''},{s:'c',label:'c',min:-10,max:10,step:0.5,val:1,unit:''}],calc:v=>v.b*v.b-4*v.a*v.c,insight:'The discriminant tells you how many real roots a quadratic has: positive → two roots, zero → one (repeated) root, negative → none. It is the part under the square root in the quadratic formula.',predict:{q:'A negative discriminant means the quadratic has…',opts:['no real roots','two roots','one root'],a:0}},
 {id:'trapezium',name:'Area of a trapezium',form:'A = ½(a + b)h',unit:'units²',vars:[{s:'a',label:'parallel side a',min:0,max:20,step:0.5,val:6,unit:''},{s:'b',label:'parallel side b',min:0,max:20,step:0.5,val:10,unit:''},{s:'h',label:'height',min:0,max:15,step:0.5,val:4,unit:''}],calc:v=>0.5*(v.a+v.b)*v.h,insight:'Average the two parallel sides, then multiply by the perpendicular height. It reduces to a rectangle or triangle in special cases.',predict:{q:'Increasing the height of a trapezium makes its area…',opts:['larger','smaller','unchanged'],a:0}},
 {id:'circumference',name:'Circumference of a circle',form:'C = 2πr',unit:'units',vars:[{s:'r',label:'radius',min:0,max:20,step:0.5,val:5,unit:'cm'}],calc:v=>2*Math.PI*v.r,insight:'Circumference grows in direct proportion to the radius (unlike area, which uses r²). Doubling the radius doubles the circumference.',predict:{q:'Double the radius. The circumference…',opts:['doubles','quadruples','is unchanged'],a:0}},
 {id:'sphere',name:'Volume of a sphere',form:'V = 4⁄3 πr³',unit:'units³',vars:[{s:'r',label:'radius',min:0,max:10,step:0.5,val:3,unit:'cm'}],calc:v=>4/3*Math.PI*v.r*v.r*v.r,insight:'Volume depends on the CUBE of the radius, so it grows very fast — doubling the radius multiplies the volume by 8.',predict:{q:'Double the radius of a sphere. The volume becomes…',opts:['8 times as big','2 times as big','4 times as big'],a:0}},
 {id:'simpleint',name:'Simple interest',form:'I = P × r × t',unit:'£',vars:[{s:'P',label:'principal',min:0,max:5000,step:50,val:500,unit:'£'},{s:'r',label:'rate per year',min:0,max:0.2,step:0.01,val:0.04,unit:''},{s:'t',label:'years',min:0,max:20,step:1,val:3,unit:''}],calc:v=>v.P*v.r*v.t,insight:'Simple interest is the same amount each year (on the original only), so it grows linearly — unlike compound interest, which earns interest on interest.',predict:{q:'Compared with compound interest over many years, simple interest gives…',opts:['less','more','the same'],a:0}},
 {id:'pctofamount',name:'Percentage of an amount',form:'result = (percent ÷ 100) × amount',unit:'',vars:[{s:'p',label:'percentage',min:0,max:100,step:1,val:15,unit:'%'},{s:'amt',label:'amount',min:0,max:500,step:5,val:80,unit:''}],calc:v=>v.p/100*v.amt,insight:'"Of" means multiply: 15% of 80 is 0.15 × 80 = 12. Useful for tips, discounts, VAT and interest.',predict:{q:'For a fixed percentage, a larger amount gives a result that is…',opts:['larger','smaller','unchanged'],a:0}}
);
MATHS.CF.push(
 {topic:'Algebra',o:'A quadratic factorises neatly into (x+2)(x+3).',f:'What if the numbers did not give whole-number factors?',r:'You would switch to the quadratic formula or completing the square. Factorising only works for "nice" quadratics; the formula always works.'},
 {topic:'Geometry & measures',o:'A line has gradient 3.',f:'What if you wanted a line perpendicular to it?',r:'Its gradient would be −1/3 (the negative reciprocal). Parallel would keep gradient 3; perpendicular flips and negates it.'},
 {topic:'Ratio & proportion',o:'A price rose by 25% to £100.',f:'What if you "reversed" it by subtracting 25% of £100?',r:'You would get £75, which is wrong. The correct original is £100 ÷ 1.25 = £80 — you must divide by the multiplier, not subtract the percentage of the new value.'},
 {topic:'Statistics',o:'A data set has a mean that summarises it well.',f:'What if you added one value ten times larger than the rest?',r:'The mean would jump toward the outlier, but the median would barely change — which is why the median is preferred for skewed data with outliers.'},
 {topic:'Geometry & measures',o:'A shape is enlarged by scale factor 2 about a point.',f:'What if you kept the scale factor but moved the centre of enlargement?',r:'The image would be the same size and shape but in a different position. The centre fixes where the enlargement is anchored; the scale factor fixes the size.'},
 {topic:'Ratio & proportion',o:'On a distance–time graph the gradient gives speed.',f:'What if it were a speed–time graph instead?',r:'Now the gradient gives acceleration, and the AREA underneath gives distance. The same graph feature means something different — always check the axes.'},
 {topic:'Number',o:'√2 × √8 simplifies neatly to √16 = 4.',f:'What if you tried √2 + √8 the same way?',r:'You cannot — surds add only when "like". √2 + √8 = √2 + 2√2 = 3√2, not √10. Multiplication combines surds; addition does not (unless like).'}
);
MATHS.CONTRAST.push(
 {a:'Distance–time graph',b:'Speed–time graph',topic:'Ratio & proportion',rows:[['Gradient means','speed','acceleration'],['Area underneath','no meaning','distance'],['Horizontal line','stationary','constant speed'],['Steeper line','faster','greater acceleration']],confusion:'They look alike, so gradient and area get misread.',tell:'Distance–time: gradient = speed. Speed–time: gradient = acceleration, area = distance.'},
 {a:'Interior angle',b:'Exterior angle',topic:'Geometry & measures',rows:[['Where','inside the corner','outside, on a straight line'],['Sum (polygon)','(n−2)×180°','always 360°'],['Pair','interior + exterior = 180°','—'],['Regular polygon','(n−2)×180 ÷ n','360 ÷ n']],confusion:'Both are polygon angles, with different sums.',tell:'Interior sum = (n−2)×180°. Exterior sum = 360° always. They add to 180° at each vertex.'},
 {a:'Congruent',b:'Similar',topic:'Geometry & measures',rows:[['Shape','same','same'],['Size','same','scaled (factor k)'],['Angles','equal','equal'],['Sides','equal','in proportion'],['Scale factor','1','any k']],confusion:'Both mean "the same shape", but only congruent means identical size.',tell:'Congruent = identical (k=1). Similar = same shape, scaled by k.'},
 {a:'Reflection',b:'Rotation',topic:'Geometry & measures',rows:[['Action','flip','turn'],['Defined by','a mirror line','centre + angle + direction'],['Orientation','reversed','preserved'],['Fixed points','points on the mirror','the centre']],confusion:'Both are transformations that preserve size, but describe them differently.',tell:'Reflection: mirror line (flips). Rotation: centre, angle and direction (turns).'},
 {a:'Discrete data',b:'Continuous data',topic:'Statistics',rows:[['Values','separate (countable)','any value in a range'],['Example','number of pets','height, time'],['From','counting','measuring'],['Graph','bar chart','histogram / line']],confusion:'Both are numerical, but one is counted and one measured.',tell:'Discrete = counted, separate values. Continuous = measured, any value in a range.'},
 {a:'Surd (exact)',b:'Decimal (rounded)',topic:'Number',rows:[['Form','√2, 3√5','1.414, 6.708'],['Accuracy','exact','approximate'],['Use','exact answers, algebra','practical estimates'],['Operations','√a×√b=√(ab)','normal arithmetic']],confusion:'A surd looks "unfinished", so students round it away.',tell:'Surds are exact — leave answers in surd form when accuracy is required.'},
 {a:'Vector',b:'Scalar',topic:'Geometry & measures',rows:[['Has direction?','yes','no'],['Describes','displacement, velocity, force','distance, speed, mass'],['Written','column / arrow','a number'],['Example','3 m east','3 m']],confusion:'Both can have the same number, but only vectors carry direction.',tell:'Vector = magnitude AND direction. Scalar = magnitude only.'}
);
MATHS.MODELS.push(
 {c:'Graph shapes',topic:'Algebra',model:'The highest power of x sets the shape: linear (x¹) is a straight line, quadratic (x²) a parabola, cubic (x³) an S-curve, and reciprocal (1/x) a hyperbola. Recognising the family helps you sketch and solve.',wrong:['All graphs are straight lines.','A quadratic has one root.'],predict:['y = mx + c → straight line.','y = ax² + bx + c → parabola (up to two roots).','y = k/x → reciprocal curve, never touching the axes.'],bound:['Number and nature of roots depend on the discriminant.','Transformations shift and stretch these shapes.'],ex:['Sketching graphs.','Solving equations graphically.']},
 {c:'Circle theorems toolkit',topic:'Geometry & measures',model:'A set of fixed rules lets you find unknown angles in circles: angle in a semicircle = 90°, angle at the centre = twice the angle at the circumference, angles in the same segment are equal, and a tangent meets a radius at 90°.',wrong:['Circle angles are random.','The interior angles add to 360°.'],predict:['A diameter subtends a right angle at the circumference.','Centre angle = 2 × circumference angle (same arc).','Opposite angles of a cyclic quadrilateral sum to 180°.'],bound:['Identify the right theorem for the configuration.','Combine with basic angle facts.'],ex:['Angle-chasing problems.','Proof questions.']},
 {c:'Transformations toolkit',topic:'Geometry & measures',model:'Four transformations move shapes: translation (slide by a vector), reflection (flip over a line), rotation (turn about a centre) and enlargement (scale from a centre). Describe each fully to earn the marks.',wrong:['Any transformation can be described loosely.','Enlargement keeps the size.'],predict:['Translation: a column vector.','Reflection: a mirror line.','Rotation: centre, angle, direction.','Enlargement: centre and scale factor.'],bound:['Negative/fractional scale factors are possible.','Area scales by k², volume by k³.'],ex:['Describing and performing transformations.','Combining transformations.']},
 {c:'The statistics cycle',topic:'Statistics',model:'Handle data in stages: collect a representative sample, present it (charts, box plots, cumulative frequency), summarise it (averages and spread), then interpret — remembering correlation is not causation and outliers distort the mean.',wrong:['The mean is the only average.','Correlation proves causation.'],predict:['Outliers favour the median over the mean.','Box plots show spread via the IQR.','A larger random sample is more reliable.'],bound:['Grouped data gives an estimated mean only.','A trend shows correlation, not cause.'],ex:['Comparing data sets.','Interpreting scatter and cumulative graphs.']}
);

/* ============ PHYSICS — EXPANSION (pushes to global banks) ============ */
MIS.push(
 {t:'Voltage flows through a circuit',topic:'Electricity',wrong:'Voltage flows around the circuit like current does.',right:'CURRENT (charge) flows THROUGH components; VOLTAGE (potential difference) is the energy per charge ACROSS them. Voltage is a difference between two points, not something that flows.',ana:'Current is the water flowing; voltage is the pressure difference pushing it.',tell:'Current flows through; voltage is across. Voltage doesn\'t flow.'},
 {t:'Components nearer the battery get more current',topic:'Electricity',wrong:'In a series circuit, the bulb closest to the battery is brightest.',right:'Current is the SAME everywhere in a single series loop — charge is not used up. All identical bulbs in series are equally bright; position makes no difference.',ana:'Water in a single pipe flows at the same rate all the way round — it doesn\'t "run out" at the far end.',tell:'Series current is identical throughout. Position relative to the battery is irrelevant.'},
 {t:'Renewable energy is always pollution-free',topic:'Energy',wrong:'Renewable resources never harm the environment.',right:'Renewable means it won\'t run out (replenished naturally), NOT that it has zero impact. Manufacturing turbines, flooding land for dams and habitat disruption all carry costs. "Renewable" ≠ "no impact".',ana:'A reusable bag is sustainable, but making it still used resources.',tell:'Renewable = won\'t run out. It is not the same as zero environmental impact.'},
 {t:'Red light is refracted the most',topic:'Waves',wrong:'In a prism, red bends the most.',right:'VIOLET light refracts the MOST and red the least, because violet has the shorter wavelength and is slowed more. That is why violet appears on the inside of a spectrum.',ana:'Shorter wavelengths "feel" the glass more and bend more sharply.',tell:'Violet refracts most, red least (shorter wavelength → more bending).'},
 {t:'Half-life is the time for a substance to fully decay',topic:'Atomic structure',wrong:'After one half-life, all the radioactive atoms have decayed.',right:'A half-life is the time for HALF the unstable nuclei to decay. After one half-life, half remain; after two, a quarter; and so on — it never reaches exactly zero.',ana:'Each half-life halves what is left, like repeatedly eating half a cake.',tell:'Half-life halves the amount remaining each time — not total decay.'},
 {t:'Nuclear fission and fusion are the same',topic:'Atomic structure',wrong:'Fission and fusion both just mean "nuclear energy".',right:'FISSION splits a large nucleus into smaller ones (used in power stations); FUSION joins small nuclei into a larger one (powers the Sun). They are opposite processes.',ana:'Fission is smashing one big thing apart; fusion is sticking small things together.',tell:'Fission splits big nuclei; fusion joins small nuclei. Opposite processes.'},
 {t:'A Newton\'s third-law pair acts on the same object',topic:'Forces',wrong:'The action and reaction forces both act on the same body, so they cancel.',right:'Third-law pairs act on DIFFERENT objects (A on B, and B on A), so they never cancel each other. Forces that balance on ONE object are a different idea (Newton\'s first law).',ana:'You push the wall (on the wall); the wall pushes you (on you) — two bodies, not one.',tell:'Third-law pairs act on different objects and are equal and opposite — they don\'t cancel.'},
 {t:'At terminal velocity no forces act',topic:'Forces',wrong:'A skydiver at terminal velocity has no forces on them.',right:'At terminal velocity the forces are BALANCED (weight = drag), giving zero RESULTANT force and constant velocity — but the individual forces are still very much present.',ana:'A tug-of-war that isn\'t moving still has both teams pulling hard.',tell:'Terminal velocity = balanced forces (zero resultant), not zero forces.'},
 {t:'A louder sound travels faster',topic:'Waves',wrong:'Increasing the volume makes sound reach you sooner.',right:'Loudness depends on AMPLITUDE, but the SPEED of sound depends only on the medium (and its temperature), not on amplitude or pitch. A loud and a quiet sound arrive together.',ana:'Shouting doesn\'t make your voice outrun a whisper across the room.',tell:'Sound speed depends on the medium, not loudness (amplitude) or pitch.'},
 {t:'Power and energy are the same thing',topic:'Energy',wrong:'Power and energy are interchangeable.',right:'ENERGY (joules) is the total transferred; POWER (watts) is the RATE of transfer — energy per second. A high-power device transfers energy quickly. P = E ÷ t.',ana:'Energy is the distance travelled; power is the speed.',tell:'Energy = total (J). Power = energy per second (W). P = E/t.'},
 {t:'Like magnetic poles attract',topic:'Magnetism',wrong:'Two north poles pull together.',right:'LIKE poles REPEL; UNLIKE poles attract. Two norths (or two souths) push apart. (This mirrors electric charges: like repels, unlike attracts.)',ana:'Try pushing the same ends of two bar magnets together — they fight back.',tell:'Like poles repel, unlike poles attract.'}
);
ANA.push(
 {topic:'Electricity',k:'Voltage = pressure, current = flow',v:'In the water analogy, current is the rate of water flow and voltage is the pressure difference driving it. Resistance is how narrow the pipe is. V = IR ties the three together.'},
 {topic:'Atomic structure',k:'Half-life = repeated halving',v:'Radioactive decay is random per nucleus, but in bulk a fixed fraction decays each period. Counting half-lives (½, ¼, ⅛ …) lets you find how much remains or how old a sample is.'},
 {topic:'Forces',k:'Resultant force = the net push',v:'Add all forces as vectors. A zero resultant means constant velocity (or rest); a non-zero resultant means acceleration in its direction, with F = ma fixing the size.'},
 {topic:'Energy',k:'Energy is transferred, never destroyed',v:'Energy moves between stores (kinetic, gravitational, thermal, chemical…) but the total is conserved. "Wasted" energy is usually spread out as heat, not gone.'},
 {topic:'Waves',k:'Refraction = changing speed at a boundary',v:'A wave bends when it speeds up or slows down crossing into a new medium. The bigger the speed change, the more it bends — and shorter wavelengths bend more.'},
 {topic:'Magnetism',k:'Field lines = a map of force',v:'Magnetic field lines run from north to south, closer together where the field is stronger. A current also makes a field, which is the basis of electromagnets and motors.'}
);
TRIG.push(
 {s:'Two identical bulbs are connected in series with a cell, and you are asked which is brighter.',mode:'multi',opts:[{t:'They are equally bright',c:1},{t:'Current is the same throughout a series circuit',c:1},{t:'Charge is conserved, not used up',c:1},{t:'The first bulb is brighter',c:0}],why:'Current is identical everywhere in a single series loop, so identical bulbs shine equally — charge is not consumed along the way.'},
 {s:'A skydiver falls at a steady (terminal) velocity.',mode:'multi',opts:[{t:'Forces are balanced',c:1},{t:'Weight equals air resistance',c:1},{t:'Resultant force is zero',c:1},{t:'No forces act',c:0}],why:'At terminal velocity weight and drag balance, giving zero resultant force and constant velocity — the forces are present but equal and opposite.'},
 {s:'White light passes through a prism and spreads into a spectrum.',mode:'multi',opts:[{t:'Dispersion by refraction',c:1},{t:'Violet bends the most',c:1},{t:'Different wavelengths slow by different amounts',c:1},{t:'Red bends the most',c:0}],why:'The glass refracts shorter wavelengths more, so violet bends most and red least, separating the colours.'},
 {s:'A sample of a radioactive isotope has a half-life of 5 years; after 15 years you want the fraction remaining.',mode:'single',opts:[{t:'One eighth (three half-lives)',c:1},{t:'Zero — it has all decayed',c:0},{t:'One third',c:0},{t:'One half',c:0}],why:'15 years is three half-lives, so the amount halves three times: ½ → ¼ → ⅛ remaining.'},
 {s:'You push against a wall and feel it push back on you.',mode:'multi',opts:[{t:'Newton\'s third law',c:1},{t:'The two forces act on different objects',c:1},{t:'They are equal and opposite',c:1},{t:'They cancel because they act on the same object',c:0}],why:'Your push on the wall and the wall\'s push on you are a third-law pair: equal, opposite, and on different objects, so they do not cancel.'},
 {s:'You want the power of a kettle that transfers 90,000 J in 60 s.',mode:'single',opts:[{t:'P = E ÷ t = 1500 W',c:1},{t:'P = E × t',c:0},{t:'P = 90,000 W',c:0},{t:'P = 60 W',c:0}],why:'Power is the rate of energy transfer: P = E ÷ t = 90,000 ÷ 60 = 1500 W.'}
);
QUIZ.push(
 {_mt:'Voltage flows through a circuit',q:'Which quantity actually flows through the components of a circuit?',opts:[{t:'Current (charge)',c:1},{t:'Voltage',c:0},{t:'Resistance',c:0}],feels:'We say "voltage through the bulb", so it sounds like it flows.',soc:['Is voltage a single value, or a difference between two points?','What is the thing that moves through the wire?','So which one flows — current or voltage?']},
 {_mt:'Half-life is the time for a substance to fully decay',q:'After one half-life, how much of a radioactive sample remains?',opts:[{t:'Half',c:1},{t:'None',c:0},{t:'A quarter',c:0}],feels:'"Half-life" can sound like the time to finish decaying.',soc:['What does the word "half" refer to here?','After the first half-life, what fraction is left?','Does it ever reach exactly zero?']},
 {_mt:'A Newton\'s third-law pair acts on the same object',q:'Action and reaction forces (a third-law pair) act on…',opts:[{t:'Two different objects',c:1},{t:'The same object',c:0},{t:'Nothing in particular',c:0}],feels:'They seem to be "at the same place", so the same object feels right.',soc:['When you push a wall, what does the wall push?','Does your push act on you or on the wall? And the reaction?','So do the two forces act on one object or two?']},
 {_mt:'A louder sound travels faster',q:'Does making a sound louder make it travel faster?',opts:[{t:'No — speed depends on the medium',c:1},{t:'Yes',c:0},{t:'Only in air',c:0}],feels:'More energy seems like it should mean more speed.',soc:['What property of the wave changes when it gets louder?','Does amplitude affect the speed, or the medium does?','So does a loud sound outrun a quiet one?']},
 {_mt:'Power and energy are the same thing',q:'A 2000 W heater and a 1000 W heater both run until each transfers 100 kJ. Which used more energy?',opts:[{t:'Neither — same energy, different time',c:1},{t:'The 2000 W one',c:0},{t:'The 1000 W one',c:0}],feels:'Higher power sounds like "more energy".',soc:['What does power measure — total energy, or energy per second?','If both transfer 100 kJ, is the total energy the same?','So which differs — the energy or the time taken?']}
);
EQS.push(
 {id:'p2_momentum',name:'Momentum',form:'p = m v',unit:'kg m/s',vars:[{s:'m',label:'mass',min:0,max:2000,step:10,val:1000,unit:'kg'},{s:'v',label:'velocity',min:0,max:40,step:1,val:20,unit:'m/s'}],calc:v=>v.m*v.v,insight:'Momentum is mass in motion. It is conserved in collisions: the total before equals the total after, which is why a heavy slow object can have as much momentum as a light fast one.',predict:{q:'Doubling the velocity (same mass) changes momentum by a factor of…',opts:['2','4','1'],a:0}},
 {id:'p2_pressure',name:'Pressure',form:'P = F ÷ A',unit:'Pa',vars:[{s:'F',label:'force',min:0,max:1000,step:10,val:200,unit:'N'},{s:'A',label:'area',min:0.01,max:5,step:0.01,val:0.5,unit:'m²'}],calc:v=>v.F/v.A,insight:'The same force over a smaller area gives a larger pressure — why sharp knives cut and snowshoes stop you sinking.',predict:{q:'For a fixed force, a smaller area gives a pressure that is…',opts:['larger','smaller','unchanged'],a:0}},
 {id:'p2_efficiency',name:'Efficiency',form:'efficiency = useful ÷ total',unit:'',vars:[{s:'u',label:'useful energy out',min:0,max:1000,step:10,val:600,unit:'J'},{s:'t',label:'total energy in',min:1,max:1000,step:10,val:1000,unit:'J'}],calc:v=>v.u/v.t,insight:'No real device is 100% efficient — some energy is always dissipated, usually as heat. Multiply by 100 for a percentage.',predict:{q:'Reducing wasted energy (same input) makes efficiency…',opts:['higher','lower','unchanged'],a:0}}
);
CF.push(
 {topic:'Electricity',o:'In a series circuit the current is the same everywhere.',f:'What if you added a second identical bulb in series?',r:'The total resistance rises, so the current FALLS and both bulbs dim equally. Current stays equal between them, but the whole loop carries less.'},
 {topic:'Forces',o:'A skydiver reaches terminal velocity when weight balances drag.',f:'What if they opened a parachute?',r:'Drag suddenly exceeds weight, giving an upward resultant force, so they decelerate to a new, lower terminal velocity where the forces balance again.'},
 {topic:'Atomic structure',o:'A sample halves every half-life.',f:'What if the half-life were twice as long?',r:'The sample would decay more slowly — after the same real time, more would remain. Longer half-life means a less active, longer-lasting source.'},
 {topic:'Waves',o:'Light slows and bends entering glass.',f:'What if it hit the boundary head-on (along the normal)?',r:'It would still slow down but NOT change direction — refraction only bends light that meets the boundary at an angle.'},
 {topic:'Energy',o:'A device transfers energy at a steady power.',f:'What if it ran for twice as long at the same power?',r:'It would transfer twice the energy (E = P × t). Power fixes the rate; total energy depends on how long it runs.'}
);
CONTRAST.push(
 {a:'Current',b:'Voltage',topic:'Electricity',rows:[['What it is','flow of charge','energy per charge (pd)'],['Measured','through a component (ammeter, in series)','across a component (voltmeter, in parallel)'],['Unit','ampere (A)','volt (V)'],['Flows?','yes','no — it is a difference']],confusion:'Both describe electricity, so the terms get swapped.',tell:'Current flows through (A, in series). Voltage is across (V, in parallel).'},
 {a:'Fission',b:'Fusion',topic:'Atomic structure',rows:[['Process','splits a large nucleus','joins small nuclei'],['Where','nuclear power stations','the Sun and stars'],['Fuel','uranium, plutonium','hydrogen isotopes'],['Conditions','controlled chain reaction','extreme temperature/pressure']],confusion:'Both are "nuclear", but they are opposite processes.',tell:'Fission splits big nuclei; fusion joins small ones.'},
 {a:'Speed',b:'Velocity',topic:'Forces',rows:[['Type','scalar','vector'],['Includes direction?','no','yes'],['Example','30 m/s','30 m/s north'],['Can change while constant?','—','velocity changes if direction changes']],confusion:'Used interchangeably in speech, but velocity carries direction.',tell:'Speed = how fast (scalar). Velocity = how fast and which way (vector).'},
 {a:'Series circuit',b:'Parallel circuit',topic:'Electricity',rows:[['Current','same everywhere','splits between branches'],['Voltage','shared across components','same across each branch'],['One breaks','all stop','others keep working'],['Total resistance','adds up','less than the smallest']],confusion:'The rules for current and voltage swap between the two.',tell:'Series: current shared-equal, voltage splits. Parallel: voltage equal, current splits.'}
);
MODELS.push(
 {c:'Forces & motion',topic:'Forces',model:'Add forces as vectors to find the resultant. Zero resultant → constant velocity (Newton 1); non-zero → acceleration via F = ma (Newton 2); forces come in equal-opposite pairs on different bodies (Newton 3).',wrong:['A moving object needs a forward force.','Terminal velocity means no forces.','Third-law pairs cancel.'],predict:['Balanced forces → steady speed or rest.','Resultant force → acceleration in its direction.','Pairs act on different objects.'],bound:['Mass resists acceleration (inertia).','Friction and drag oppose motion.'],ex:['Skydivers and terminal velocity.','Vehicles and braking.']},
 {c:'Electric circuits',topic:'Electricity',model:'Current is conserved charge flow; voltage is energy per charge supplied and shared; resistance opposes flow, with V = IR. Series and parallel arrangements distribute current and voltage by clear rules.',wrong:['Current gets used up.','Voltage flows.','Nearer components get more current.'],predict:['Series: same current, voltage shared.','Parallel: same voltage, current shared.','V = IR links the three quantities.'],bound:['Energy is conserved around the loop.','Component resistance may vary with conditions.'],ex:['Designing lighting circuits.','Fault-finding.']},
 {c:'Radioactive decay',topic:'Atomic structure',model:'Unstable nuclei decay randomly, but in bulk a fixed fraction goes each half-life. Activity falls over time; the type of radiation (alpha, beta, gamma) sets its penetration and danger.',wrong:['Half-life is the time to fully decay.','All radiation is equally penetrating.'],predict:['Each half-life halves what remains.','Alpha stopped by paper; gamma needs lead.','Activity decreases over time.'],bound:['Decay is random per nucleus.','Never reaches exactly zero.'],ex:['Carbon dating.','Choosing medical isotopes.']}
);
/* resolve any _mt links in the (physics) global QUIZ added above */
QUIZ.forEach(function(q){ if(q._mt!=null && (q.mi==null)){ var i=MIS.findIndex(function(m){return m.t===q._mt;}); q.mi=(i<0?0:i); } });

/* ============ CHEMISTRY / BIOLOGY / GCSE MATHS — EXPANSION 2 ============ */

/* ---------- CHEMISTRY ---------- */
CHEM.MIS.push(
 {t:'Isotopes of an element react differently',topic:'Atomic structure',wrong:'Different isotopes have different chemistry.',right:'Isotopes have the same number of ELECTRONS, so they react IDENTICALLY. They differ only in neutrons (mass), affecting physical properties like density, not chemical behaviour.',ana:'Same outfit, slightly different weight — they behave the same in company.',tell:'Isotopes: same chemistry (same electrons), different mass (neutrons).'},
 {t:'Atoms gain or lose protons in reactions',topic:'Bonding & structure',wrong:'Bonding changes the number of protons.',right:'Chemical reactions only ever involve ELECTRONS (shared or transferred). The number of protons (the element\'s identity) never changes — that would be a nuclear change.',ana:'Reactions rearrange the outer "handshakes" (electrons), not the core identity.',tell:'Reactions move electrons. Protons (the element) stay fixed.'},
 {t:'The group number equals the number of electron shells',topic:'Periodic table',wrong:'Group 2 means two shells.',right:'For the main groups, the GROUP number gives the number of OUTER-shell electrons; the PERIOD number gives the number of shells. Group 2 = 2 outer electrons; period tells you the shells.',ana:'Group = how many on the outside; period = how many layers deep.',tell:'Group = outer electrons. Period = number of shells.'},
 {t:'Diamond conducts electricity',topic:'Bonding & structure',wrong:'Diamond, being giant covalent, conducts.',right:'Diamond does NOT conduct — every carbon\'s four electrons are locked in bonds, with none free to move. GRAPHITE conducts because each carbon bonds to only three others, freeing one electron per atom.',ana:'Diamond uses up all its hands bonding; graphite keeps one free to pass charge along.',tell:'Diamond: insulator (no free electrons). Graphite: conducts (one free electron per atom).'},
 {t:'A pure substance melts over a range of temperatures',topic:'Chemical analysis',wrong:'Everything melts gradually over a range.',right:'A PURE substance has a SHARP, fixed melting point. Melting (or boiling) over a RANGE is a sign of a MIXTURE — a useful purity test.',ana:'A clean signal spikes at one value; a muddled one smears across a band.',tell:'Pure → sharp melting point. A range indicates impurity/mixture.'},
 {t:'All salts dissolve in water',topic:'Chemical changes / acids',wrong:'Every salt is soluble.',right:'Solubility follows rules: most nitrates and group-1 salts are soluble, but many carbonates, hydroxides and some sulfates/halides are INSOLUBLE — which is why precipitates form when solutions are mixed.',ana:'Some salts vanish into water; others refuse and settle out as a solid.',tell:'Salts vary: many carbonates/hydroxides are insoluble — hence precipitates.'},
 {t:'An endothermic reaction cannot happen by itself',topic:'Energy changes',wrong:'Reactions that take in heat can\'t be spontaneous.',right:'Endothermic reactions DO occur (e.g. dissolving ammonium nitrate, photosynthesis driven by light) — they simply absorb energy from the surroundings, cooling them. Taking energy in does not forbid a reaction.',ana:'A cold pack works by an endothermic change happening all on its own.',tell:'Endothermic reactions happen too — they absorb energy and cool the surroundings.'},
 {t:'Concentration does not affect reaction rate',topic:'Rates & equilibrium',wrong:'Only temperature changes how fast a reaction goes.',right:'Higher CONCENTRATION (or pressure for gases) means more frequent collisions, so a FASTER rate. Surface area, temperature, concentration and catalysts all affect rate via collision frequency or energy.',ana:'A more crowded dance floor means more collisions per second.',tell:'More concentration → more collisions → faster rate.'}
);
CHEM.ANA.push(
 {topic:'Atomic structure',k:'Electron shells = seating by rows',v:'Electrons fill shells from the inside out (2, then 8, then 8…). The outer-shell count drives bonding, which is why elements in the same group behave alike.'},
 {topic:'Rates & equilibrium',k:'Collision theory = bumping to react',v:'Reactions happen when particles collide hard enough (above the activation energy) and in the right orientation. Anything raising collision frequency or energy speeds the reaction up.'},
 {topic:'Chemical changes / acids',k:'Precipitation = insoluble partners meet',v:'Mix two solutions and if a pair of ions forms an insoluble compound, it drops out as a solid precipitate. Solubility rules predict which combinations do this.'},
 {topic:'Bonding & structure',k:'Bonding = the quest for a full shell',v:'Atoms gain, lose or share electrons to reach a stable full outer shell. Metals + non-metals transfer (ionic); non-metals share (covalent); metals pool electrons (metallic).'}
);
CHEM.TRIG.push(
 {s:'A solid melts sharply at exactly one temperature.',mode:'multi',opts:[{t:'It is likely pure',c:1},{t:'Melting point is a purity test',c:1},{t:'A mixture would melt over a range',c:1},{t:'It must be a metal',c:0}],why:'A sharp, fixed melting point indicates a pure substance; mixtures melt over a range, so this is a standard purity check.'},
 {s:'Two clear solutions are mixed and a cloudy solid forms instantly.',mode:'multi',opts:[{t:'A precipitation reaction',c:1},{t:'An insoluble salt formed',c:1},{t:'Solubility rules apply',c:1},{t:'A gas was produced',c:0}],why:'When mixed ions form an insoluble compound, it appears as a precipitate — predicted by solubility rules.'},
 {s:'You increase the concentration of an acid reacting with marble chips.',mode:'multi',opts:[{t:'The rate increases',c:1},{t:'More frequent collisions',c:1},{t:'Collision theory explains it',c:1},{t:'The rate stays the same',c:0}],why:'Higher concentration means more particles per volume, so more frequent successful collisions and a faster rate.'},
 {s:'You compare chlorine-35 and chlorine-37 in a reaction with sodium.',mode:'single',opts:[{t:'They react identically (same electrons)',c:1},{t:'Cl-37 reacts faster',c:0},{t:'Only Cl-35 reacts',c:0},{t:'They form different products',c:0}],why:'Isotopes have the same electron arrangement, so identical chemistry — they differ only in mass.'},
 {s:'You are told an element is in Group 2, Period 3.',mode:'multi',opts:[{t:'It has 2 outer-shell electrons',c:1},{t:'It has 3 electron shells',c:1},{t:'It is magnesium',c:1},{t:'It has 3 outer electrons',c:0}],why:'Group gives outer electrons (2), period gives shells (3) — that is magnesium, electron arrangement 2,8,2.'}
);
CHEM.QUIZ.push(
 {_mt:'Diamond conducts electricity',q:'Does diamond conduct electricity?',opts:[{t:'No — no free electrons',c:1},{t:'Yes, like graphite',c:0},{t:'Only when molten',c:0}],feels:'Both are carbon, so they feel like they should behave alike.',soc:['How many bonds does each carbon form in diamond?','Are any electrons left free to move?','So can diamond conduct — and why can graphite?']},
 {_mt:'Isotopes of an element react differently',q:'Do two isotopes of the same element have different chemical reactions?',opts:[{t:'No — same electrons, same chemistry',c:1},{t:'Yes',c:0},{t:'Only if radioactive',c:0}],feels:'Different mass suggests different behaviour.',soc:['What do isotopes differ in — electrons or neutrons?','What controls chemical reactions?','So is their chemistry the same or different?']},
 {_mt:'A pure substance melts over a range of temperatures',q:'A substance melts gradually between 50 and 60 °C. What does this suggest?',opts:[{t:'It is a mixture (impure)',c:1},{t:'It is pure',c:0},{t:'It is a metal',c:0}],feels:'Gradual melting can seem normal for any solid.',soc:['What kind of melting point does a pure substance have?','Does a range suggest one substance or several?','So is this pure or a mixture?']}
);
CHEM.EQS.push(
 {id:'c2_atomecon',name:'Atom economy',form:'% = (Mr of useful product ÷ Mr of all products) × 100',unit:'%',vars:[{s:'u',label:'Mr of useful product',min:0,max:300,step:1,val:56,unit:''},{s:'tot',label:'Mr of all products',min:1,max:300,step:1,val:100,unit:''}],calc:v=>v.u/v.tot*100,insight:'A high atom economy means little is wasted — greener and more efficient. Addition reactions have 100% atom economy; reactions with by-products are lower.',predict:{q:'Reducing the mass of by-products makes atom economy…',opts:['higher','lower','unchanged'],a:0}},
 {id:'c2_percyield',name:'Percentage yield',form:'% yield = (actual ÷ theoretical) × 100',unit:'%',vars:[{s:'a',label:'actual yield',min:0,max:100,step:1,val:7,unit:'g'},{s:'th',label:'theoretical yield',min:1,max:100,step:1,val:10,unit:'g'}],calc:v=>v.a/v.th*100,insight:'Real reactions rarely reach 100% — losses, side reactions and reversibility reduce yield. It measures how much product you actually obtained versus the maximum possible.',predict:{q:'Getting closer to the theoretical maximum makes percentage yield…',opts:['higher','lower','unchanged'],a:0}}
);
CHEM.CF.push(
 {topic:'Bonding & structure',o:'Graphite conducts because each carbon bonds to three others.',f:'What if each carbon bonded to four, as in diamond?',r:'There would be no free electrons, so it would not conduct — it would behave like diamond: hard and insulating.'},
 {topic:'Rates & equilibrium',o:'Increasing concentration speeds up a reaction.',f:'What if you instead ground a solid reactant into powder?',r:'The surface area increases, exposing more particles to collisions, so the rate also rises — another way to increase collision frequency.'},
 {topic:'Chemical analysis',o:'A pure compound melts at a single sharp temperature.',f:'What if it were contaminated with another substance?',r:'The melting point would lower and spread over a range — impurities disrupt the regular structure, so it no longer melts cleanly.'}
);
CHEM.CONTRAST.push(
 {a:'Diamond',b:'Graphite',topic:'Bonding & structure',rows:[['Bonds per carbon','4','3'],['Free electrons','none','one per atom'],['Conducts?','no','yes'],['Hardness','very hard','soft, slippery'],['Use','cutting tools','electrodes, lubricant']],confusion:'Both are pure carbon, so their differences seem surprising.',tell:'Diamond: 4 bonds, hard, insulator. Graphite: 3 bonds, layered, conducts.'},
 {a:'Pure substance',b:'Mixture',topic:'Chemical analysis',rows:[['Composition','one substance','two or more'],['Melting point','sharp, fixed','over a range'],['Separation','—','filtration, distillation, etc.'],['Example','distilled water','sea water']],confusion:'Both can look the same, but melting behaviour distinguishes them.',tell:'Pure = sharp melting point. Mixture = melts/boils over a range, separable.'},
 {a:'Exothermic',b:'Endothermic',topic:'Energy changes',rows:[['Energy','released to surroundings','absorbed from surroundings'],['Surroundings','warm up','cool down'],['ΔH sign','negative','positive'],['Example','combustion, neutralisation','thermal decomposition, dissolving NH₄NO₃']],confusion:'Both happen spontaneously; the direction of heat flow differs.',tell:'Exothermic releases heat (warms); endothermic absorbs heat (cools).'}
);
CHEM.MODELS.push(
 {c:'Collision theory & rates',topic:'Rates & equilibrium',model:'Reactions proceed via successful collisions — particles must meet with enough energy (activation energy) and the right orientation. Temperature, concentration/pressure, surface area and catalysts all change the rate through collision frequency or energy.',wrong:['Only temperature affects rate.','Catalysts are used up.'],predict:['More concentration/pressure → more collisions.','Smaller particles (more surface area) → faster.','Catalysts lower the activation energy.'],bound:['Rate falls as reactants are used up.','Orientation matters, not just energy.'],ex:['Speeding up industrial reactions.','Explaining rate graphs.']},
 {c:'Atomic structure & the periodic table',topic:'Atomic structure',model:'Atoms have a tiny nucleus (protons + neutrons) surrounded by electrons in shells. Outer-shell electrons drive chemistry, so the periodic table\'s groups (same outer electrons) share properties and periods count shells.',wrong:['Isotopes react differently.','Group number = number of shells.'],predict:['Group = outer electrons; period = shells.','Isotopes: same chemistry, different mass.','Reactions involve electrons, not protons.'],bound:['Transition metals break the simple pattern.','Protons fix the element\'s identity.'],ex:['Predicting reactivity.','Reading electron arrangements.']}
);

/* ---------- BIOLOGY ---------- */
BIO.MIS.push(
 {t:'Plants do not respire',topic:'Bioenergetics (photo/resp)',wrong:'Plants photosynthesise, so they don\'t respire.',right:'Plants respire ALL the time (day and night) to release energy, just like animals. In daylight photosynthesis usually outpaces respiration, but respiration never stops.',ana:'A factory that makes its own electricity still runs its machines around the clock.',tell:'Plants respire continuously. Photosynthesis is extra (in light), not a replacement.'},
 {t:'All arteries carry oxygenated blood',topic:'Circulation & blood',wrong:'Arteries always carry oxygen-rich blood.',right:'Arteries carry blood AWAY from the heart, usually oxygenated — but the PULMONARY ARTERY carries DEOXYGENATED blood to the lungs. "Artery" is defined by direction, not oxygen.',ana:'A road is defined by which way it leads, not by what the lorries carry.',tell:'Arteries = away from the heart. The pulmonary artery is the deoxygenated exception.'},
 {t:'Diffusion requires energy',topic:'Transport (diffusion/osmosis)',wrong:'Cells spend energy to make substances diffuse.',right:'Diffusion is PASSIVE — particles move down a concentration gradient by their own random motion, needing no energy from the cell. ACTIVE TRANSPORT (against the gradient) is what costs energy.',ana:'A ball rolling downhill needs no push; only pushing it uphill takes effort.',tell:'Diffusion = passive (down gradient, free). Active transport = energy (up gradient).'},
 {t:'Active transport moves substances down the gradient',topic:'Transport (diffusion/osmosis)',wrong:'Active transport just speeds up normal diffusion.',right:'Active transport moves substances AGAINST the concentration gradient (low to high), which is why it needs ENERGY (from respiration) and carrier proteins — e.g. roots absorbing minerals.',ana:'Pumping water uphill, against where it naturally wants to go.',tell:'Active transport: low → high concentration, against the gradient, uses energy.'},
 {t:'Natural selection means individuals change to adapt',topic:'Variation & evolution',wrong:'An organism alters itself during its life to survive, then passes that on.',right:'Individuals do NOT change to adapt. Variation already exists in the POPULATION; those with helpful inherited traits survive and reproduce more, so the POPULATION shifts over generations.',ana:'The population\'s mix changes as the well-suited reproduce — no individual rewrites its own genes.',tell:'Populations evolve, individuals don\'t. Selection acts on existing inherited variation.'},
 {t:'Antibodies kill pathogens directly',topic:'Disease & immunity',wrong:'Antibodies destroy germs on contact.',right:'Antibodies LOCK ON to a pathogen\'s antigens, clumping them together and marking them so that phagocytes engulf and destroy them. They tag and immobilise; other cells do the killing.',ana:'Antibodies are like handcuffs and a flag — they restrain and label, then the guards take over.',tell:'Antibodies tag/clump pathogens; phagocytes then destroy them.'},
 {t:'Genes, DNA and chromosomes are the same thing',topic:'Inheritance & genetics',wrong:'The three words are interchangeable.',right:'They nest: a GENE is a short section of DNA; DNA is the long molecule; a CHROMOSOME is a tightly coiled length of DNA carrying many genes. Smallest to largest: gene → DNA → chromosome.',ana:'A gene is a sentence, DNA the text, a chromosome a whole coiled-up book.',tell:'Gene (a section) ⊂ DNA (the molecule) ⊂ chromosome (coiled DNA, many genes).'},
 {t:'A larger surface area is always better for a cell',topic:'Transport (diffusion/osmosis)',wrong:'Cells and organisms always benefit from more surface area.',right:'A large surface-area-to-volume ratio speeds exchange but also speeds WATER and heat LOSS. Organisms balance the two — exchange surfaces are large, but bodies limit unwanted loss.',ana:'More windows let in light but also let out heat — it is a trade-off.',tell:'High SA:V aids exchange but increases water/heat loss — it is a balance.'}
);
BIO.ANA.push(
 {topic:'Transport (diffusion/osmosis)',k:'Active transport = pumping uphill',v:'Carrier proteins use energy from respiration to drag substances against the concentration gradient, letting roots absorb minerals and the gut absorb glucose even when levels inside are already higher.'},
 {topic:'Variation & evolution',k:'Selection = filtering the population',v:'Variation is the raw material; the environment filters it. Individuals with helpful inherited traits leave more offspring, so over generations those traits spread — the population changes, not the individual.'},
 {topic:'Inheritance & genetics',k:'Gene → DNA → chromosome = sentence to book',v:'A gene is a sentence of instructions, DNA the full text, and a chromosome the coiled-up book holding many genes. Each level nests inside the next.'},
 {topic:'Disease & immunity',k:'Antibodies = tag and flag',v:'Lymphocytes make antibodies that fit a pathogen\'s antigens, clumping them and flagging them for phagocytes to engulf. Memory cells keep the recipe for a fast response next time.'}
);
BIO.TRIG.push(
 {s:'A potted plant is sealed in the dark for 24 hours and the CO₂ level in the container rises.',mode:'multi',opts:[{t:'The plant is respiring',c:1},{t:'Respiration happens day and night',c:1},{t:'No photosynthesis in the dark to use the CO₂',c:1},{t:'Plants don\'t respire',c:0}],why:'In the dark there is no photosynthesis, so the plant\'s continuous respiration makes CO₂ accumulate — evidence that plants respire all the time.'},
 {s:'Root hair cells absorb mineral ions from soil even though the concentration inside the root is already higher.',mode:'multi',opts:[{t:'Active transport',c:1},{t:'Movement against the gradient',c:1},{t:'Requires energy from respiration',c:1},{t:'Simple diffusion',c:0}],why:'Moving ions from low (soil) to high (root) is against the gradient, so it needs active transport powered by respiration.'},
 {s:'Over many generations, a beetle population becomes mostly dark-coloured on soot-darkened trees.',mode:'multi',opts:[{t:'Natural selection',c:1},{t:'Dark beetles were better camouflaged and survived',c:1},{t:'The population changed, not individuals',c:1},{t:'Each beetle turned darker to hide',c:0}],why:'Pre-existing dark variants survived predation better and reproduced more, so the population shifted — individuals did not change colour to adapt.'},
 {s:'A pathogen enters the body and specific proteins clump it together for destruction.',mode:'multi',opts:[{t:'Antibodies produced by lymphocytes',c:1},{t:'They tag the pathogen for phagocytes',c:1},{t:'Memory cells give future immunity',c:1},{t:'Antibiotics made by the body',c:0}],why:'Lymphocytes make antibodies that bind antigens, clumping pathogens for phagocytes to engulf; memory cells provide lasting immunity. Antibiotics are drugs, not made by the body.'},
 {s:'A single-celled organism exchanges all its gases straight across its surface.',mode:'multi',opts:[{t:'It has a high surface-area-to-volume ratio',c:1},{t:'Diffusion alone is sufficient',c:1},{t:'No specialised exchange surface is needed',c:1},{t:'It needs lungs',c:0}],why:'Small organisms have a high SA:V ratio, so diffusion across the surface meets their needs without specialised exchange systems.'}
);
BIO.QUIZ.push(
 {_mt:'Plants do not respire',q:'Do plants respire at night?',opts:[{t:'Yes — plants respire continuously',c:1},{t:'No — only animals respire',c:0},{t:'No — they only photosynthesise',c:0}],feels:'Photosynthesis is so associated with plants that respiration gets forgotten.',soc:['How do plant cells release energy from glucose?','Does that process stop in the dark?','So do plants respire at night?']},
 {_mt:'Diffusion requires energy',q:'Does simple diffusion across a membrane use the cell\'s energy?',opts:[{t:'No — it is passive',c:1},{t:'Yes',c:0},{t:'Only in animals',c:0}],feels:'Movement sounds like it should cost energy.',soc:['Which way do particles move in diffusion — down or up the gradient?','Does moving down a gradient need a push?','So which process needs energy — diffusion or active transport?']},
 {_mt:'All arteries carry oxygenated blood',q:'Which vessel is an artery that carries deoxygenated blood?',opts:[{t:'The pulmonary artery',c:1},{t:'There is no such artery',c:0},{t:'The aorta',c:0}],feels:'"Artery = oxygenated" is a common shortcut.',soc:['What defines an artery — oxygen, or direction of flow?','Where does the pulmonary artery carry blood to?','Is blood going TO the lungs oxygenated or not?']}
);
BIO.EQS.push(
 {id:'b2_magnification',name:'Microscope magnification',form:'magnification = image size ÷ actual size',unit:'×',vars:[{s:'img',label:'image size',min:0,max:200,step:1,val:50,unit:'mm'},{s:'act',label:'actual size',min:0.01,max:10,step:0.01,val:0.5,unit:'mm'}],calc:v=>v.img/v.act,insight:'Rearranges to find any of the three. Keep units consistent. Electron microscopes reach far higher magnification and resolution than light microscopes.',predict:{q:'For a fixed image size, a smaller actual object means magnification is…',opts:['higher','lower','unchanged'],a:0}},
 {id:'b2_bmi',name:'Body mass index (BMI)',form:'BMI = mass ÷ height²',unit:'kg/m²',vars:[{s:'m',label:'mass',min:30,max:150,step:1,val:70,unit:'kg'},{s:'h',label:'height',min:1.2,max:2.1,step:0.01,val:1.75,unit:'m'}],calc:v=>v.m/(v.h*v.h),insight:'A rough screening measure linking mass to height. Used to flag possible health risks, though it does not distinguish muscle from fat.',predict:{q:'For the same mass, a taller person has a BMI that is…',opts:['lower','higher','the same'],a:0}}
);
BIO.CF.push(
 {topic:'Transport (diffusion/osmosis)',o:'Root hair cells use active transport to absorb minerals.',f:'What if the cell stopped respiring?',r:'Active transport would halt — no energy to power the carrier proteins. Minerals could no longer be taken in against their gradient, and the plant would suffer.'},
 {topic:'Bioenergetics (photo/resp)',o:'In daylight a plant photosynthesises faster than it respires.',f:'What about at night?',r:'Photosynthesis stops, but respiration continues, so the plant is a net consumer of oxygen and producer of CO₂ overnight.'},
 {topic:'Variation & evolution',o:'Dark beetles thrive on soot-darkened trees.',f:'What if the trees were cleaned and turned pale again?',r:'Selection would reverse: pale beetles would now be better camouflaged, survive more and increase — the population would shift back, tracking the environment.'}
);
BIO.CONTRAST.push(
 {a:'Diffusion',b:'Active transport',topic:'Transport (diffusion/osmosis)',rows:[['Direction','down the gradient','against the gradient'],['Energy','none (passive)','needs energy (respiration)'],['Carrier proteins','not required','required'],['Example','O₂ into cells','minerals into roots']],confusion:'Both move substances across membranes, but only one costs energy.',tell:'Diffusion: passive, down gradient. Active transport: energy, up gradient.'},
 {a:'Artery',b:'Vein',topic:'Circulation & blood',rows:[['Direction','away from the heart','back to the heart'],['Wall','thick, muscular','thinner'],['Pressure','high','low'],['Valves','none (usually)','yes'],['Oxygen','usually high (not pulmonary artery)','usually low (not pulmonary vein)']],confusion:'Defined by direction, but students tie them to oxygen.',tell:'Artery = away from heart (thick wall). Vein = back to heart (valves). Oxygen varies.'},
 {a:'Gene',b:'Chromosome',topic:'Inheritance & genetics',rows:[['Size','small section of DNA','long coiled DNA molecule'],['Carries','one instruction','many genes'],['Number (human)','thousands','46 (23 pairs)'],['Analogy','a sentence','a book']],confusion:'Both relate to DNA, so they get used interchangeably.',tell:'Gene = a section of DNA. Chromosome = coiled DNA carrying many genes.'}
);
BIO.MODELS.push(
 {c:'Movement across membranes',topic:'Transport (diffusion/osmosis)',model:'Substances cross membranes by diffusion (passive, down the gradient), osmosis (water, down its gradient) or active transport (against the gradient, using energy). Surface area, gradient and distance set the rate.',wrong:['Diffusion needs energy.','Active transport goes down the gradient.'],predict:['Down gradient → passive (free).','Against gradient → active (energy).','Bigger SA and steeper gradient → faster.'],bound:['Active transport needs respiration.','Osmosis is specifically water movement.'],ex:['Absorption in the gut and roots.','Gas exchange.']},
 {c:'Evolution by natural selection',topic:'Variation & evolution',model:'Heritable variation exists in a population; the environment selects which variants survive and reproduce, so advantageous traits become more common over generations. The population evolves; individuals do not adapt within their lifetime.',wrong:['Individuals change to adapt.','Evolution has a goal.'],predict:['Selection acts on existing variation.','Populations shift over generations.','Environment change can reverse the trend.'],bound:['Only heritable traits are passed on.','Mutation supplies new variation.'],ex:['Antibiotic resistance.','Camouflage and predation.']}
);

/* ---------- GCSE MATHS ---------- */
MATHS.MIS.push(
 {t:'Histogram bar height is the frequency',topic:'Statistics',wrong:'On a histogram, taller bars simply mean higher frequency.',right:'On a histogram the bar HEIGHT is FREQUENCY DENSITY (frequency ÷ class width), and the AREA represents frequency. With unequal class widths, height alone is misleading.',ana:'It is the area of each bar, not its height, that counts the data.',tell:'Histogram: height = frequency density; AREA = frequency.'},
 {t:'A negative scale factor only makes a shape smaller',topic:'Geometry & measures',wrong:'A scale factor of −2 just shrinks the shape.',right:'A NEGATIVE scale factor enlarges by the size (|−2| = 2) AND rotates the image 180° about the centre (placing it on the opposite side). The minus flips the position, not the size logic.',ana:'Negative means "through the centre and out the other side", inverted.',tell:'Negative scale factor: size |k|, but image inverted through the centre (180°).'},
 {t:'The upper bound is the value rounded up',topic:'Number',wrong:'A length given as 8 cm (to the nearest cm) has upper bound 9.',right:'Bounds are HALF a unit each side: 8 cm to the nearest cm means 7.5 ≤ length < 8.5. The upper bound is 8.5, not 9.',ana:'Anything from 7.5 up to (just under) 8.5 rounds to 8 — those are the limits.',tell:'To the nearest unit: bounds are ±0.5 (e.g. 8 → 7.5 to 8.5).'},
 {t:'Each slice of a pie chart is the same size',topic:'Statistics',wrong:'Pie-chart sectors are roughly equal.',right:'Each sector\'s ANGLE is PROPORTIONAL to its frequency: angle = (frequency ÷ total) × 360°. Bigger categories get bigger angles; they are not equal.',ana:'The bigger the share, the bigger the slice of the pie.',tell:'Pie sector angle = (frequency ÷ total) × 360°.'},
 {t:'3.2 × 10³ means 3.2 followed by three zeros',topic:'Number',wrong:'3.2 × 10³ = 3.2000.',right:'×10³ moves the decimal point three places right: 3.2 × 10³ = 3200. You shift the point, not append zeros after the existing digits blindly.',ana:'The power tells the point how far to slide, dragging the digits along.',tell:'×10ⁿ moves the decimal point n places (right for +n). 3.2 × 10³ = 3200.'},
 {t:'You can leave a surd in the denominator',topic:'Number',wrong:'1/√2 is a finished, simplified answer.',right:'Convention requires RATIONALISING the denominator: multiply top and bottom by √2 to get √2/2. A surd should not be left on the bottom of a fraction.',ana:'Tidy the root out of the basement and onto the top floor.',tell:'Rationalise: 1/√2 = √2/2 (multiply top and bottom by √2).'},
 {t:'Quantities that increase together are proportional',topic:'Ratio & proportion',wrong:'If both columns go up, the quantities are in proportion.',right:'Direct proportion needs a CONSTANT RATIO (y ÷ x the same throughout) and a graph through the origin. Two quantities can both increase without that fixed ratio, so they are not necessarily proportional.',ana:'Growing together isn\'t enough — they must grow at the same locked-in rate.',tell:'Proportional ⇒ constant ratio y/x and a straight line through the origin.'},
 {t:'When expanding (x − a)(x − b) the middle term is + (a + b)x',topic:'Algebra',wrong:'(x − 3)(x − 4) = x² + 7x + 12.',right:'Both inner products are negative: (x−3)(x−4) = x² − 7x + 12. The middle term is −(a + b)x and the constant +ab. Watch the signs carefully.',ana:'Two minuses in the brackets give a minus middle term but a plus constant.',tell:'(x−a)(x−b) = x² − (a+b)x + ab. Middle term negative, constant positive.'}
);
MATHS.ANA.push(
 {topic:'Statistics',k:'Histogram = area tells the story',v:'With unequal class widths, you plot frequency density so that each bar\'s AREA equals its frequency. Comparing heights alone misleads; comparing areas is fair.'},
 {topic:'Number',k:'Bounds = the rounding window',v:'A rounded value stands for a range. To the nearest unit, the true value lies within half a unit either side — the lower and upper bounds frame every value that would round to it.'},
 {topic:'Geometry & measures',k:'Negative enlargement = flip through the centre',v:'A negative scale factor scales by its size and projects the image through the centre to the opposite side, turning it 180°. The sign controls position and orientation, the size controls scale.'},
 {topic:'Number',k:'Standard form = a sliding decimal point',v:'Writing A × 10ⁿ just records how many places the decimal point has moved. Positive n slides it right (big numbers); negative n slides it left (small numbers).'}
);
MATHS.TRIG.push(
 {s:'You must draw a histogram for grouped data with UNEQUAL class widths.',mode:'single',opts:[{t:'Plot frequency density (frequency ÷ class width)',c:1},{t:'Plot frequency as the bar height',c:0},{t:'Use equal-width bars regardless',c:0},{t:'Draw a pie chart instead',c:0}],why:'With unequal widths, the bar height must be frequency density so that area represents frequency — plotting raw frequency would distort the picture.'},
 {s:'A length is measured as 12 cm to the nearest cm and you need the limits of its true value.',mode:'single',opts:[{t:'11.5 cm ≤ length < 12.5 cm',c:1},{t:'12 cm to 13 cm',c:0},{t:'11 cm to 13 cm',c:0},{t:'Exactly 12 cm',c:0}],why:'To the nearest cm, the bounds are half a unit each side: 11.5 (lower) up to but not including 12.5 (upper).'},
 {s:'You need to draw a pie chart and a category has 9 out of 36 items.',mode:'single',opts:[{t:'Its angle is (9 ÷ 36) × 360° = 90°',c:1},{t:'Its angle is 9°',c:0},{t:'Each category gets 360 ÷ number of categories',c:0},{t:'Its angle is 36°',c:0}],why:'The sector angle is the category\'s fraction of the total times 360°: (9/36) × 360 = 90°.'},
 {s:'You are asked to simplify 6/√3 into a form with a rational denominator.',mode:'single',opts:[{t:'Multiply top and bottom by √3',c:1},{t:'Leave it as 6/√3',c:0},{t:'Square the whole fraction',c:0},{t:'Cancel the 6 and the √3',c:0}],why:'Rationalise by multiplying numerator and denominator by √3: 6√3/3 = 2√3 — a rational denominator.'},
 {s:'You must expand and simplify (x − 5)(x − 2).',mode:'single',opts:[{t:'x² − 7x + 10',c:1},{t:'x² + 7x + 10',c:0},{t:'x² − 10x + 7',c:0},{t:'x² − 3x − 10',c:0}],why:'Outer + inner give −5x − 2x = −7x; the constants multiply to +10: x² − 7x + 10.'}
);
MATHS.QUIZ.push(
 {_mt:'The upper bound is the value rounded up',q:'A mass is 5 kg to the nearest kg. What is its upper bound?',opts:[{t:'5.5 kg',c:1},{t:'6 kg',c:0},{t:'5 kg',c:0}],feels:'"Upper bound" sounds like the next whole number up.',soc:['How far either side of 5 would still round to 5?','Half a unit above 5 is what value?','So is the upper bound 5.5 or 6?']},
 {_mt:'Histogram bar height is the frequency',q:'On a histogram with unequal class widths, what does the bar height represent?',opts:[{t:'Frequency density',c:1},{t:'Frequency',c:0},{t:'Class width',c:0}],feels:'Bar charts use height for frequency, so histograms seem the same.',soc:['What does the AREA of a histogram bar represent?','If area = frequency, what must height be (area ÷ width)?','So is the height frequency or frequency density?']},
 {_mt:'3.2 × 10³ means 3.2 followed by three zeros',q:'What is 3.2 × 10³ as an ordinary number?',opts:[{t:'3200',c:1},{t:'3.2000',c:0},{t:'32000',c:0}],feels:'"Three zeros" feels like you just tack them on.',soc:['What does ×10³ do to the decimal point?','Move the point in 3.2 three places right — what do you get?','So is it 3200 or 3.2000?']}
);
MATHS.CF.push(
 {topic:'Geometry & measures',o:'A shape enlarged by scale factor 2 doubles in size on the same side of the centre.',f:'What if the scale factor were −2?',r:'It would still double in size, but appear on the OPPOSITE side of the centre, rotated 180°. The negative sign flips the position and orientation.'},
 {topic:'Statistics',o:'A bar chart shows frequency by bar height.',f:'What if the classes had unequal widths (a histogram)?',r:'You would need frequency density for the height so that AREA represents frequency — otherwise wider classes would look misleadingly tall.'},
 {topic:'Number',o:'8 cm to the nearest cm has bounds 7.5 ≤ x < 8.5.',f:'What if it were measured to the nearest 2 cm?',r:'The bounds widen to ±1 cm: 7 ≤ x < 9. The rounding unit sets how far the bounds spread.'}
);
MATHS.CONTRAST.push(
 {a:'Bar chart',b:'Histogram',topic:'Statistics',rows:[['Data','categorical / discrete','continuous (grouped)'],['Bar height','frequency','frequency density'],['Represents frequency','height','area'],['Gaps','yes','no (bars touch)']],confusion:'They look similar, but the histogram uses area, not height.',tell:'Bar chart: height = frequency. Histogram: area = frequency (height = density).'},
 {a:'Positive scale factor',b:'Negative scale factor',topic:'Geometry & measures',rows:[['Size','×|k|','×|k|'],['Side of centre','same side','opposite side'],['Orientation','same way up','rotated 180°'],['Example','k = 2','k = −2']],confusion:'The size logic is identical; the sign changes position and orientation.',tell:'Negative scale factor: same scaling, but flipped through the centre (180°).'},
 {a:'Direct proportion',b:'Just increasing together',topic:'Ratio & proportion',rows:[['Ratio y/x','constant','can vary'],['Graph','line through origin','any rising shape'],['Doubling x','doubles y','not necessarily'],['Test','y = kx?','—']],confusion:'Both go up together, but only proportion has a fixed ratio.',tell:'Proportional ⇒ constant ratio and a line through the origin, not merely "both rise".'}
);
MATHS.MODELS.push(
 {c:'Accuracy & bounds',topic:'Number',model:'Every rounded or measured value stands for a range. To a given unit the true value lies within half that unit either side. Carrying bounds through calculations gives the limits of accuracy of a result.',wrong:['The upper bound is the value rounded up.','Rounding early is harmless.'],predict:['Nearest unit → ±0.5 bounds.','Combine bounds to find max/min results.','Use exact values until the final step.'],bound:['Adding uses both upper (or both lower) bounds.','Dividing flips which bound to use.'],ex:['Error in measurements.','Maximum/minimum problems.']},
 {c:'Representing data',topic:'Statistics',model:'Choose the display to fit the data: bar charts for categories, histograms (area = frequency) for grouped continuous data, pie charts for proportions, scatter graphs for relationships. Read area, angle or position appropriately.',wrong:['Histogram height = frequency.','Pie sectors are equal.'],predict:['Histogram: area = frequency.','Pie angle = (frequency/total) × 360°.','Scatter shows correlation, not cause.'],bound:['Match the chart to the data type.','Unequal classes need frequency density.'],ex:['Choosing and reading charts.','Comparing distributions.']}
);

/* ====================================================================
   VERSION 9 — MULTI-SUBJECT PLATFORM
   Snapshots physics into a registry, adds Chemistry/Biology/Maths,
   swaps content banks per subject, scopes cloud data by subject prefix,
   and gives the teacher a per-subject dashboard filter.
   ==================================================================== */

/* ---- registry: snapshot the (already-built) physics content, add packs ---- */
const SUBJECTS = {
  physics: {
    name:'Physics', code:'physics', edx:'Edexcel (1PH0)', aqa:'AQA (8463)',
    tools:['trigger','miscquiz','explorer','counterfactual','sandbox','misconceptions','contrast','models','analogies','conceptmap','spec','alevel','resources','transfer','lens'],
    MIS:[...MIS], ANA:[...ANA], TRIG:[...TRIG], QUIZ:[...QUIZ], EQS:[...EQS], CF:[...CF],
    CONTRAST:[...CONTRAST], MODELS:[...MODELS], NODES:[...NODES], DIAG_TOPICS:[...DIAG_TOPICS],
    SPEC:[...SPEC], AQA_SPEC:[...AQA_SPEC], CPRAC:[...CPRAC], AQA_PRAC:[...AQA_PRAC]
  },
  chemistry: CHEM,
  biology:   BIO,
  maths:     MATHS
};
/* give the non-physics packs the fields physics has but they may lack */
['chemistry','biology','maths'].forEach(id=>{const S=SUBJECTS[id];
  if(!S.NODES) S.NODES=[];
  if(!S.CPRAC) S.CPRAC=[]; if(!S.AQA_PRAC) S.AQA_PRAC=[];
});
/* resolve each new subject's QUIZ → MIS index from its _mt title */
['chemistry','biology','maths'].forEach(id=>{const S=SUBJECTS[id];
  (S.QUIZ||[]).forEach(q=>{ if(q._mt!=null){ const i=S.MIS.findIndex(m=>m.t===q._mt); q.mi=(i<0?0:i); } });
});

/* ---- current-subject state + board labels used by the spec page ---- */
let CURSUBJ='physics';
let CURTOOLS=SUBJECTS.physics.tools;
let CUR_EDX='Edexcel (1PH0)', CUR_AQA='AQA (8463)';

function swapArr(t,s){ if(!t)return; t.length=0; (s||[]).forEach(x=>t.push(x)); }
function useSubject(id){
  if(!SUBJECTS[id]) id='physics';
  CURSUBJ=id; const S=SUBJECTS[id];
  swapArr(MIS,S.MIS); swapArr(ANA,S.ANA); swapArr(TRIG,S.TRIG); swapArr(QUIZ,S.QUIZ);
  swapArr(EQS,S.EQS); swapArr(CF,S.CF); swapArr(CONTRAST,S.CONTRAST); swapArr(MODELS,S.MODELS);
  swapArr(NODES,S.NODES); swapArr(DIAG_TOPICS,S.DIAG_TOPICS);
  swapArr(SPEC,S.SPEC); swapArr(AQA_SPEC,S.AQA_SPEC); swapArr(CPRAC,S.CPRAC); swapArr(AQA_PRAC,S.AQA_PRAC);
  CURTOOLS=S.tools||[]; CUR_EDX=S.edx||'Edexcel'; CUR_AQA=S.aqa||'AQA';
  /* reset per-section state so stale indices can't point past the new (shorter) banks */
  try{trigIdx=0;trigPicked=new Set();trigDone=false;trigScore={r:0,t:0};}catch(e){}
  try{qIdx=0;qDone=false;qPicked=-1;qSocStep=0;qScore={r:0,t:0};}catch(e){}
  try{cfIdx=0;cfShown=false;}catch(e){}
  try{syncBoardFromAccount();}catch(e){}
}

/* ---- subject-scoped cloud store (prefix every key with the subject) ---- */
/* keys starting with __ stay global (e.g. __subject). Re-overrides modules7's store. */
function _spfx(k){ return (k.indexOf('__')!==0) ? (CURSUBJ+':'+k) : k; }
store.get=(k,d)=>{ const kk=_spfx(k); return (kk in CACHE)?CACHE[kk]:d; };
store.set=(k,v)=>{ const kk=_spfx(k); CACHE[kk]=v; _dirty[kk]=true; backupLocal(); scheduleFlush(); };
store.del=(k)=>{ const kk=_spfx(k); delete CACHE[kk]; backupLocal(); if(sb&&SBUSER) sb.from('progress').delete().eq('user_id',SBUSER.id).eq('key',kk); };

/* one-time migration: tag any old un-prefixed progress as physics: */
function migrateLegacyToPhysics(){
  Object.keys(CACHE).forEach(k=>{
    if(k.indexOf(':')<0 && k.indexOf('__')!==0){
      const nk='physics:'+k;
      if(!(nk in CACHE)){ CACHE[nk]=CACHE[k]; _dirty[nk]=true; }
      delete CACHE[k];
      if(sb&&SBUSER){ try{ sb.from('progress').delete().eq('user_id',SBUSER.id).eq('key',k); }catch(e){} }
    }
  });
  scheduleFlush();
}

/* ---- switch subject (persists choice, swaps banks, re-renders) ---- */
function switchSubject(id){
  if(id===CURSUBJ||!SUBJECTS[id]) return;
  try{flushWrites();}catch(e){}
  CACHE['__subject']=id; _dirty['__subject']=true; scheduleFlush();
  useSubject(id); buildNav(); go('dashboard');
}

/* ---- override onLogin to boot the subject layer after hydrate ---- */
async function onLogin(user){
  SBUSER=user;
  await sbLoadProfile();
  await hydrateStore();
  migrateLegacyToPhysics();
  CURSUBJ = (CACHE['__subject'] && SUBJECTS[CACHE['__subject']]) ? CACHE['__subject'] : 'physics';
  useSubject(CURSUBJ);
  try{ syncBoardFromAccount(); }catch(e){}
  recordActivity();
  hideLogin(); buildNav();
  const start=(location.hash||'').replace('#','');
  go(SEC[start]?start:'dashboard');
}

/* ---- teacher dashboard: per-subject view filter ---- */
let teachSubj='physics';
function setTeachSubj(id){ teachSubj=id; try{renderRoster();}catch(e){} }
function getterFor(rec){ return (k,d)=>{ const kk=(k.indexOf('__')!==0)?(teachSubj+':'+k):k; return (kk in rec.data)?rec.data[kk]:d; }; }

/* re-define the teacher page to include a subject selector above the roster */
SEC.students=()=>{ const a=currentAccount();
  if(!a||a.role!=='teacher') return `<h2 class="h-sec">My students</h2><p class="lead">This area is for the teacher account.</p>`;
  stuView2=null;
  const subjOpts=Object.keys(SUBJECTS).map(id=>`<option value="${id}" ${id===teachSubj?'selected':''}>${SUBJECTS[id].name}</option>`).join('');
  return `
  <div class="eyebrow">Teacher</div>
  <h2 class="h-sec">My students</h2>
  <p class="lead">Everyone in your class, syncing live. Create a login for each student below — they sign in on their own device and their progress appears here. Use the subject filter to see how they're doing in each subject.</p>
  <div class="card">
    <h4 style="margin:0 0 8px">Create a student login</h4>
    <div class="row">
      <div><label class="fld">Username</label><input id="csUser" placeholder="e.g. alex"></div>
      <div><label class="fld">Password</label><input id="csPass" placeholder="at least 6 characters"></div>
    </div>
    <label class="fld">Exam board (Physics default; they can set each subject themselves)</label>
    <select id="csBoard">${BOARDS.map(b=>`<option value="${b}">${b}</option>`).join('')}</select>
    <div style="margin-top:10px"><button class="btn amber sm" onclick="createStudent()">Create login</button></div>
    <div id="csMsg" class="mono" style="font-size:.8rem;margin-top:10px;min-height:18px"></div>
  </div>
  <div style="display:flex;align-items:center;gap:10px;margin:18px 0 4px;flex-wrap:wrap">
    <h3 class="blk" style="margin:0">Class roster</h3>
    <span style="flex:1"></span>
    <label class="fld" style="margin:0">Subject:</label>
    <select onchange="setTeachSubj(this.value)" style="max-width:180px">${subjOpts}</select>
  </div>
  <div id="rosterBox"></div>`;
};

/* ============ A-LEVEL MATHS (Edexcel 9MA0 / AQA 7357) ============ */
const ALMATHS = {
 name:'A-Level Maths', code:'alevelmaths', edx:'Edexcel (9MA0)', aqa:'AQA (7357)',
 tools:['trigger','miscquiz','explorer','counterfactual','misconceptions','contrast','models','analogies','spec'],
 DIAG_TOPICS:['Proof','Algebra & functions','Coordinate geometry','Sequences & series','Trigonometry','Exponentials & logs','Differentiation','Integration','Numerical methods','Vectors','Statistics','Mechanics','Other'],
 MIS:[
  {t:'The derivative of aˣ is x·aˣ⁻¹',topic:'Differentiation',wrong:'You differentiate 2ˣ like a power: x·2ˣ⁻¹.',right:'The power rule is for a variable BASE with a constant power (xⁿ). For a constant base with a variable power, d/dx(aˣ) = aˣ ln a. In particular d/dx(eˣ) = eˣ.',ana:'xⁿ and aˣ look similar but the variable is in a different place — different rule entirely.',tell:'d/dx(xⁿ)=nxⁿ⁻¹ (variable base). d/dx(aˣ)=aˣ ln a (variable power).'},
  {t:'The integral of 1/x is ln x',topic:'Integration',wrong:'∫1/x dx = ln x + c.',right:'It is ln|x| + c. The modulus is essential because 1/x is defined for negative x too, where ln x is not. Dropping the modulus loses half the domain.',ana:'The reciprocal curve lives on both sides of the y-axis; the antiderivative must too.',tell:'∫1/x dx = ln|x| + c — keep the modulus.'},
  {t:'You can forget the constant of integration',topic:'Integration',wrong:'∫2x dx = x², done.',right:'An indefinite integral always needs "+ c", because differentiating any constant gives zero — infinitely many functions share the same derivative. Omitting c loses marks and matters for differential equations.',ana:'Knowing the slope everywhere still leaves the curve free to slide up or down.',tell:'Indefinite integral → always + c. Use a boundary condition to find it.'},
  {t:'sin²x means sin(x²)',topic:'Trigonometry',wrong:'sin²x is the sine of x-squared.',right:'sin²x is the conventional shorthand for (sin x)² — square the sine. sin(x²) would be written explicitly. The exponent sits on the function value, not the angle.',ana:'It is "the sine, then squared", not "square the angle, then sine".',tell:'sin²x = (sin x)². For sin of x², write sin(x²).'},
  {t:'ln(a + b) equals ln a + ln b',topic:'Exponentials & logs',wrong:'You can split the log of a sum.',right:'Log laws apply to PRODUCTS and QUOTIENTS: ln(ab) = ln a + ln b, ln(a/b) = ln a − ln b. There is no rule for ln(a + b) — it cannot be simplified.',ana:'Logs turn multiplication into addition, not addition into addition.',tell:'ln(ab)=ln a+ln b. ln(a+b) does NOT split.'},
  {t:'A stationary point is always a maximum',topic:'Differentiation',wrong:'Where dy/dx = 0, the curve has a maximum.',right:'A stationary point can be a maximum, a minimum or a point of inflection. Check the SECOND derivative (or the sign of dy/dx either side): f″ < 0 → max, f″ > 0 → min, f″ = 0 → investigate further.',ana:'A flat spot might be a hilltop, a valley floor or a level ledge on a slope.',tell:'dy/dx = 0 just means flat. Classify with f″ or a sign change.'},
  {t:'A definite integral always gives the area',topic:'Integration',wrong:'The definite integral equals the area under the curve.',right:'A definite integral gives the SIGNED area: regions below the x-axis count as negative and can cancel positive regions. For total physical area you must integrate each region separately and add the magnitudes.',ana:'Profit and loss can sum to zero even when a lot of money moved.',tell:'Definite integral = signed area. For true area, split at the x-axis and take magnitudes.'},
  {t:'You must use degrees in calculus',topic:'Trigonometry',wrong:'Differentiate sin x and the answer works in degrees.',right:'The results d/dx(sin x)=cos x and the small-angle approximations only hold in RADIANS. Using degrees introduces a factor of π/180. Always switch to radians for calculus and limits.',ana:'Radians are the "natural" angle unit that makes the calculus come out clean.',tell:'Calculus of trig functions assumes radians, not degrees.'},
  {t:'arcsin gives the only solution',topic:'Trigonometry',wrong:'sin x = 0.5 means x = 30° and that is it.',right:'Inverse trig gives ONE principal value; over a range there are usually several solutions. Use the symmetry/period (e.g. sin is positive in the 1st and 2nd quadrants, period 360°) to find them all.',ana:'A calculator hands you one key that fits; the lock has several.',tell:'arcsin/arccos/arctan give one value — use symmetry and period for all solutions in range.'},
  {t:'|x| equations have only the positive case',topic:'Algebra & functions',wrong:'|x − 3| = 5 means x − 3 = 5, so x = 8.',right:'The modulus has TWO cases: x − 3 = 5 OR x − 3 = −5, giving x = 8 or x = −2. Forgetting the negative case loses solutions.',ana:'A distance of 5 from 3 reaches both 8 and −2 on the number line.',tell:'|A| = b → A = b or A = −b. Always consider both cases.'},
  {t:'A geometric series always has a sum to infinity',topic:'Sequences & series',wrong:'Every geometric series converges to a/(1−r).',right:'A sum to infinity exists ONLY when |r| < 1. If |r| ≥ 1 the terms do not shrink to zero and the series diverges (no finite sum).',ana:'Only steps that keep getting smaller can settle on a finishing line.',tell:'Sum to infinity = a/(1−r), valid only for |r| < 1.'},
  {t:'Weight and mass are the same',topic:'Mechanics',wrong:'An object\'s weight in newtons equals its mass in kg.',right:'Mass (kg) is the amount of matter; weight (N) is the gravitational force on it, W = mg. A 2 kg mass weighs about 19.6 N. Mass is constant; weight depends on g.',ana:'Mass is how much "stuff"; weight is how hard gravity pulls that stuff.',tell:'W = mg. Mass in kg, weight in newtons — not interchangeable.'},
  {t:'Friction always equals μR',topic:'Mechanics',wrong:'Friction = μR in every situation.',right:'F = μR is the MAXIMUM (limiting) friction, reached only when the object is on the point of sliding or moving. Below that, friction takes whatever value (≤ μR) is needed to keep equilibrium.',ana:'Friction pushes back exactly as hard as needed, up to a limit — not always at full strength.',tell:'Friction ≤ μR. It equals μR only at the point of slipping or while sliding.'},
  {t:'A projectile has horizontal acceleration',topic:'Mechanics',wrong:'A thrown ball accelerates forwards as well as downwards.',right:'Ignoring air resistance, the only force is gravity, so horizontal acceleration is ZERO (constant horizontal velocity) and vertical acceleration is g downward. Treat the two directions independently.',ana:'Nothing pushes the ball forward once released — only gravity pulls it down.',tell:'Projectile: horizontal a = 0 (constant vₓ); vertical a = g. Resolve independently.'},
  {t:'suvat works for any motion',topic:'Mechanics',wrong:'You can always use v = u + at and friends.',right:'The suvat equations require CONSTANT acceleration. If acceleration varies with time, you must use calculus: a = dv/dt, v = ds/dt (differentiate/integrate), not suvat.',ana:'A fixed recipe only works when the ingredients stay the same throughout.',tell:'suvat needs constant acceleration. Variable a → use calculus (differentiate/integrate).'},
  {t:'Failing to reject H₀ proves H₀ is true',topic:'Statistics',wrong:'If the test is not significant, the null hypothesis is correct.',right:'A hypothesis test can only REJECT or FAIL TO REJECT H₀ — never prove it. "Not significant" means insufficient evidence against H₀ at that level, not that H₀ is true.',ana:'A "not guilty" verdict means unproven, not innocent.',tell:'Tests reject or fail to reject H₀. Failing to reject ≠ proving it true.'},
  {t:'Correlation implies causation',topic:'Statistics',wrong:'A strong regression line shows one variable causes the other.',right:'Correlation/regression quantify association, not cause. A confounding variable or coincidence can produce a strong relationship without any causal link.',ana:'Two variables rising together may both be driven by a hidden third.',tell:'Correlation ≠ causation, however strong the fit.'},
  {t:'dy/dx is a fraction you can split freely',topic:'Differentiation',wrong:'You can treat dy and dx as separate numbers anytime.',right:'dy/dx is a single operator (a limit), not a literal fraction. The "separation" used in separable differential equations is a justified shorthand, not licence to cancel dy and dx like ordinary algebra everywhere.',ana:'It looks like a fraction, but it is really the limit of one.',tell:'dy/dx is one symbol. Separation of variables is a special, justified technique.'},
  {t:'eˣ and ln x can be simplified term by term',topic:'Exponentials & logs',wrong:'e^(a+b) = eᵃ + eᵇ.',right:'Indices add for a PRODUCT: e^(a+b) = eᵃ × eᵇ. Exponentials turn sums in the exponent into products, just as logs turn products into sums. They never split a sum into a sum.',ana:'The exponent\'s addition becomes multiplication outside, not addition.',tell:'e^(a+b) = eᵃ·eᵇ. It does not equal eᵃ + eᵇ.'},
  {t:'Independent and mutually exclusive mean the same',topic:'Statistics',wrong:'Two events that can\'t both happen are independent.',right:'MUTUALLY EXCLUSIVE means they cannot occur together (P(A∩B)=0). INDEPENDENT means one does not affect the other (P(A∩B)=P(A)P(B)). For events with non-zero probability, mutually exclusive events are actually DEPENDENT.',ana:'Two doors that can\'t both be open at once are very much linked, not independent.',tell:'Exclusive: P(A∩B)=0. Independent: P(A∩B)=P(A)P(B). Not the same.'},
  {t:'The binomial model fits any count',topic:'Statistics',wrong:'Any "number of successes" follows a binomial distribution.',right:'B(n,p) needs: a FIXED number of trials, two outcomes, a CONSTANT probability p, and INDEPENDENT trials. If trials are not independent or p changes, the binomial model does not apply.',ana:'The model only fits when the same fair coin is flipped a set number of independent times.',tell:'Binomial requires fixed n, constant p, two outcomes, independent trials.'},
  {t:'The chain rule is optional',topic:'Differentiation',wrong:'d/dx of (3x+1)⁵ is 5(3x+1)⁴.',right:'You must multiply by the derivative of the inside: 5(3x+1)⁴ × 3 = 15(3x+1)⁴. The chain rule handles a function of a function; forgetting the inner derivative is a classic error.',ana:'Peeling layers: differentiate the outer, then multiply by the rate of the inner.',tell:'Chain rule: differentiate outer × derivative of inner. Don\'t drop the inner factor.'},
  {t:'You can cancel to simplify before differentiating limits wrongly',topic:'Numerical methods',wrong:'A sign change in f(x) guarantees exactly one root in the interval.',right:'A change of sign of a continuous f guarantees at LEAST one root in the interval, but there could be several (or, if f is discontinuous, none). It locates roots; it does not count them.',ana:'Crossing from below to above the line happens at least once — but maybe more.',tell:'Sign change ⇒ at least one root (continuous f). Not necessarily exactly one.'},
  {t:'A bigger second derivative means a steeper curve',topic:'Differentiation',wrong:'f″ measures how steep the graph is.',right:'The FIRST derivative f′ measures steepness (gradient). The SECOND derivative f″ measures how the gradient is CHANGING — the curvature/concavity. A curve can be steep with small f″ or gentle with large f″.',ana:'f′ is your speed; f″ is your acceleration — how fast the speed itself changes.',tell:'f′ = gradient (steepness). f″ = rate of change of gradient (concavity).'}
 ],
 ANA:[
  {topic:'Differentiation',k:'Derivative = instantaneous rate',v:'dy/dx is the gradient of the tangent: the limit of average rates as the interval shrinks to zero. It answers "how fast is y changing right here?" — speed from displacement, acceleration from velocity.'},
  {topic:'Integration',k:'Integral = accumulation',v:'Integration adds up infinitely many tiny contributions. A definite integral accumulates the signed area under a curve; physically it turns a rate back into a total (velocity → displacement).'},
  {topic:'Integration',k:'Integration undoes differentiation',v:'They are inverse operations (the Fundamental Theorem). That is why "+ c" appears: differentiating destroys constant information that integration cannot recover without a boundary condition.'},
  {topic:'Exponentials & logs',k:'eˣ = its own derivative',v:'The exponential eˣ is the unique function equal to its own rate of change. That self-similarity is why it models unconstrained growth and decay so naturally.'},
  {topic:'Exponentials & logs',k:'ln = "what power of e?"',v:'The natural log answers "e to what gives this?". It linearises exponential data and turns products into sums, taming multiplicative relationships into straight lines.'},
  {topic:'Trigonometry',k:'Radians = arc length per radius',v:'One radian is the angle whose arc equals the radius. This natural measure makes arc = rθ, sector = ½r²θ, and the calculus of sine and cosine come out without stray constants.'},
  {topic:'Sequences & series',k:'Binomial expansion = organised choosing',v:'(a+b)ⁿ expands with coefficients ⁿCr — the number of ways to choose r b\'s from n brackets. Pascal\'s triangle is just these counts stacked up.'},
  {topic:'Differentiation',k:'Chain rule = peeling an onion',v:'For a function of a function, differentiate the outer layer, then multiply by the rate of the inner layer, working inwards. Each layer contributes its own factor.'},
  {topic:'Differentiation',k:'Stationary points = flat spots',v:'Where the gradient is zero the curve is momentarily level — a hilltop (max), valley floor (min) or a ledge (inflection). The second derivative tells you which.'},
  {topic:'Numerical methods',k:'Newton–Raphson = sliding down tangents',v:'From a guess, follow the tangent to where it cuts the x-axis; that becomes the next guess. Near a root it converges very fast, roughly doubling the accurate digits each step.'},
  {topic:'Numerical methods',k:'Iteration = repeated feedback',v:'Rearranging f(x)=0 into x = g(x) and feeding outputs back as inputs lets the sequence settle on a fixed point — provided |g′| < 1 near the root, so errors shrink each time.'},
  {topic:'Algebra & functions',k:'Modulus = distance from zero',v:'|x| is how far x is from the origin, always positive. |x − a| reads as the distance between x and a, which is why modulus equations split into two cases.'},
  {topic:'Statistics',k:'Hypothesis test = innocent until proven guilty',v:'Assume H₀ (the status quo), then ask how surprising the data would be if it were true. Only strong evidence (a small p-value) lets you reject it; otherwise you withhold judgement.'},
  {topic:'Statistics',k:'Normal distribution = the bell curve',v:'Many natural quantities cluster symmetrically about a mean, thinning towards the tails. Standardising with z = (x − μ)/σ lets one table serve every normal distribution.'},
  {topic:'Mechanics',k:'Forces = vector pushes and pulls',v:'Every force has size and direction, so they add as vectors. Resolving into perpendicular components and applying F = ma in each direction unlocks most mechanics problems.'},
  {topic:'Mechanics',k:'Projectile = two independent motions',v:'Horizontal motion (constant velocity) and vertical motion (constant acceleration g) happen independently and share only the time. Solve each direction separately, linked by t.'},
  {topic:'Mechanics',k:'Connected particles = one shared acceleration',v:'Objects joined by an inextensible string move together with the same acceleration. Apply Newton\'s second law to each, then solve the simultaneous equations.'},
  {topic:'Vectors',k:'Vectors = journeys in space',v:'A vector is a displacement with direction and magnitude. The dot product reveals angles (a·b = |a||b|cosθ), and position vectors pin points down relative to an origin.'},
  {topic:'Proof',k:'Proof by contradiction = assume the opposite',v:'Suppose the statement is false, then reason until something impossible appears. The contradiction shows the assumption was wrong, so the original statement must be true (e.g. √2 is irrational).'},
  {topic:'Sequences & series',k:'Geometric series = repeated multiplication',v:'Each term multiplies the last by a common ratio r. If |r| < 1 the terms vanish and the whole infinite series settles on a/(1−r); otherwise it grows without bound.'}
 ],
 TRIG:[
  {s:'You must differentiate y = (2x² + 1)⁵.',mode:'single',opts:[{t:'Chain rule',c:1},{t:'Product rule',c:0},{t:'Quotient rule',c:0},{t:'Just multiply the power down',c:0}],why:'A function raised to a power is a function of a function → chain rule: 5(2x²+1)⁴ × 4x. The inner derivative (4x) must be included.'},
  {s:'You must differentiate y = x² eˣ.',mode:'single',opts:[{t:'Product rule',c:1},{t:'Chain rule',c:0},{t:'Quotient rule',c:0},{t:'Add the derivatives',c:0}],why:'A product of two functions of x → product rule: u\'v + uv\' = 2x eˣ + x² eˣ.'},
  {s:'You must integrate ∫ x cos x dx.',mode:'single',opts:[{t:'Integration by parts',c:1},{t:'By substitution u = cos x',c:0},{t:'Partial fractions',c:0},{t:'Reverse chain rule',c:0}],why:'A product of an algebraic and a trig function with no inner-derivative pattern → integration by parts (let u = x, dv = cos x dx).'},
  {s:'You must integrate ∫ 2x(x² + 1)³ dx.',mode:'multi',opts:[{t:'Substitution u = x² + 1',c:1},{t:'Reverse chain rule (recognition)',c:1},{t:'Integration by parts',c:0},{t:'Partial fractions',c:0}],why:'The 2x is exactly the derivative of the inside x²+1, so substitution / reverse chain rule works neatly: result ¼(x²+1)⁴ + c.'},
  {s:'You must integrate ∫ (3x + 5)/((x+1)(x+2)) dx.',mode:'single',opts:[{t:'Split using partial fractions first',c:1},{t:'Integration by parts',c:0},{t:'Substitution u = x+1',c:0},{t:'Differentiate instead',c:0}],why:'A rational function with a factorisable denominator → partial fractions, then integrate each term to logs.'},
  {s:'Solve sin x = 0.5 for 0 ≤ x ≤ 360°.',mode:'multi',opts:[{t:'Find the principal value, then use symmetry',c:1},{t:'Give all solutions in range (30° and 150°)',c:1},{t:'Just state x = 30°',c:0},{t:'Use radians regardless of the range given',c:0}],why:'Sine is positive in the 1st and 2nd quadrants, so x = 30° and 180° − 30° = 150°. One arcsin value is not enough.'},
  {s:'You have dy/dx = xy and want y in terms of x.',mode:'single',opts:[{t:'Separate the variables and integrate',c:1},{t:'Use the product rule',c:0},{t:'Integration by parts',c:0},{t:'Newton–Raphson',c:0}],why:'A first-order separable differential equation: write (1/y) dy = x dx and integrate both sides.'},
  {s:'You need to find a root of x³ − x − 2 = 0 to high accuracy from a nearby guess.',mode:'multi',opts:[{t:'Newton–Raphson iteration',c:1},{t:'A fixed-point iteration x = g(x)',c:1},{t:'A change-of-sign check to locate it first',c:1},{t:'The quadratic formula',c:0}],why:'A cubic with no rational root → locate by sign change, then refine with Newton–Raphson or fixed-point iteration. The quadratic formula does not apply.'},
  {s:'You must approximate (1 + x)¹/² for small x.',mode:'single',opts:[{t:'Binomial expansion (valid for |x| < 1)',c:1},{t:'Differentiate it',c:0},{t:'Use the quadratic formula',c:0},{t:'Take logs',c:0}],why:'The binomial series gives 1 + ½x − ⅛x² + …, valid for |x| < 1 — ideal for small-x approximations.'},
  {s:'You need the angle between vectors a and b.',mode:'single',opts:[{t:'Use the scalar (dot) product: cosθ = a·b / (|a||b|)',c:1},{t:'Add the vectors',c:0},{t:'Use Pythagoras on the components',c:0},{t:'Subtract the magnitudes',c:0}],why:'The dot product encodes the angle: a·b = |a||b|cosθ, so rearrange for cosθ.'},
  {s:'A block on a slope is on the point of sliding and you must find the friction.',mode:'multi',opts:[{t:'Resolve forces parallel and perpendicular to the slope',c:1},{t:'Use limiting friction F = μR',c:1},{t:'Apply equilibrium (or F = ma) in each direction',c:1},{t:'Use suvat',c:0}],why:'On the point of sliding, friction is at its maximum μR; resolve along and perpendicular to the slope and apply Newton\'s laws.'},
  {s:'A ball is projected at 20 m/s at 30° above the horizontal; find its range.',mode:'multi',opts:[{t:'Split velocity into horizontal and vertical components',c:1},{t:'Use vertical motion to find the time of flight',c:1},{t:'Horizontal distance = horizontal velocity × time',c:1},{t:'Assume horizontal acceleration is g',c:0}],why:'Resolve the initial velocity, use the vertical component (a = g) to find the flight time, then multiply by the constant horizontal velocity. Horizontal acceleration is zero.'},
  {s:'You test whether a coin is biased towards heads after 20 flips give 15 heads.',mode:'single',opts:[{t:'A one-tailed binomial hypothesis test',c:1},{t:'A two-tailed test',c:0},{t:'A normal test with no model',c:0},{t:'Just compare 15 to 10',c:0}],why:'"Biased towards heads" is directional, so a one-tailed test on B(20, 0.5) is appropriate; compute P(X ≥ 15) and compare to the significance level.'},
  {s:'You are asked to find the sum of 3 + 6 + 12 + … to 10 terms.',mode:'single',opts:[{t:'Geometric series sum (r = 2)',c:1},{t:'Arithmetic series sum',c:0},{t:'Sum to infinity',c:0},{t:'Binomial expansion',c:0}],why:'Each term doubles (common ratio 2), so it is geometric: Sₙ = a(rⁿ − 1)/(r − 1). With |r| > 1 there is no sum to infinity.'}
 ],
 QUIZ:[
  {_mt:'The derivative of aˣ is x·aˣ⁻¹',q:'What is d/dx of 2ˣ?',opts:[{t:'2ˣ ln 2',c:1},{t:'x·2ˣ⁻¹',c:0},{t:'2ˣ',c:0}],feels:'It looks like a power, so the power rule feels right.',soc:['In xⁿ, where is the variable — base or exponent?','In 2ˣ, where is the variable?','So which rule applies: power rule or d/dx(aˣ)=aˣ ln a?']},
  {_mt:'The integral of 1/x is ln x',q:'What is ∫ 1/x dx?',opts:[{t:'ln|x| + c',c:1},{t:'ln x + c',c:0},{t:'x⁻² + c',c:0}],feels:'ln x is the obvious antiderivative.',soc:['Is 1/x defined for negative x?','Is ln x defined for negative x?','What do you add so the antiderivative covers both signs?']},
  {_mt:'sin²x means sin(x²)',q:'What does sin²x mean?',opts:[{t:'(sin x)²',c:1},{t:'sin(x²)',c:0},{t:'2 sin x',c:0}],feels:'The little 2 next to sin looks like it could apply to the x.',soc:['Where does the exponent sit — on the function or on the angle?','How would you write "sine of x squared" instead?','So is sin²x squaring the sine or the angle?']},
  {_mt:'A stationary point is always a maximum',q:'At a stationary point, dy/dx = 0. What does that tell you about its type?',opts:[{t:'Nothing yet — it could be max, min or inflection',c:1},{t:'It is a maximum',c:0},{t:'It is a minimum',c:0}],feels:'"Stationary point" often gets equated with "the top".',soc:['Can a curve be flat at the bottom of a valley too?','What can you check to classify it?','So does dy/dx = 0 alone tell you the type?']},
  {_mt:'A definite integral always gives the area',q:'A curve dips below the x-axis between the limits. Does the definite integral give the total area?',opts:[{t:'No — it gives signed area; below counts negative',c:1},{t:'Yes, always',c:0},{t:'Only if the curve is a straight line',c:0}],feels:'"Integral = area under the curve" is a strong slogan.',soc:['What sign does area below the x-axis contribute?','Could positive and negative regions cancel?','So for true area, what must you do at the crossing points?']},
  {_mt:'A geometric series always has a sum to infinity',q:'For which common ratio r does a geometric series have a sum to infinity?',opts:[{t:'|r| < 1',c:1},{t:'Any r',c:0},{t:'r > 1',c:0}],feels:'The formula a/(1−r) always exists numerically, so it feels universal.',soc:['What must the terms do for an infinite sum to settle?','Do the terms shrink if |r| ≥ 1?','So what condition on r is needed?']},
  {_mt:'Friction always equals μR',q:'A box sits still on a rough table, gently pushed but not moving. Is friction equal to μR?',opts:[{t:'No — friction ≤ μR; it equals μR only at the point of slipping',c:1},{t:'Yes, always μR',c:0},{t:'Friction is zero',c:0}],feels:'F = μR is the formula you memorise, so it feels like it always applies.',soc:['Is the box on the point of moving?','Does friction balance only the push needed, or always its maximum?','When exactly does friction reach μR?']},
  {_mt:'A projectile has horizontal acceleration',q:'Ignoring air resistance, what is a projectile\'s horizontal acceleration?',opts:[{t:'Zero',c:1},{t:'g, forwards',c:0},{t:'g, downwards',c:0}],feels:'It is moving forwards, so it feels like something accelerates it.',soc:['After release, what forces act on the projectile?','Does gravity have a horizontal component?','So what is the horizontal acceleration?']},
  {_mt:'ln(a + b) equals ln a + ln b',q:'Can ln(a + b) be rewritten as ln a + ln b?',opts:[{t:'No — there is no log law for a sum',c:1},{t:'Yes',c:0},{t:'Only if a = b',c:0}],feels:'The log laws make splitting feel allowed.',soc:['Which operation does ln(ab) = ln a + ln b apply to?','Is a + b a product or a sum?','So can you split ln of a sum?']},
  {_mt:'Weight and mass are the same',q:'A 5 kg mass sits on Earth (g = 9.8). What is its weight?',opts:[{t:'About 49 N',c:1},{t:'5 N',c:0},{t:'5 kg',c:0}],feels:'The number 5 feels like the answer in any unit.',soc:['What is the formula linking weight and mass?','What are the units of weight?','So what is 5 × 9.8, and in what unit?']},
  {_mt:'You must use degrees in calculus',q:'When differentiating sin x to get cos x, which angle unit must you use?',opts:[{t:'Radians',c:1},{t:'Degrees',c:0},{t:'Either works',c:0}],feels:'Degrees are the everyday unit, so they feel default.',soc:['Do the small-angle and derivative results hold in degrees?','What factor appears if you use degrees?','So which unit makes the calculus clean?']},
  {_mt:'Independent and mutually exclusive mean the same',q:'Two events with non-zero probability cannot both occur. Are they independent?',opts:[{t:'No — they are dependent (one occurring rules out the other)',c:1},{t:'Yes, independent',c:0},{t:'It cannot be decided',c:0}],feels:'"Separate" events sound independent.',soc:['If A happens, what is the probability B happens (they can\'t coincide)?','Does A occurring change B\'s probability?','So are they independent or dependent?']}
 ],
 EQS:[
  {id:'al_deriv',name:'Derivative of xⁿ at a point',form:'dy/dx = n·xⁿ⁻¹',unit:'',vars:[{s:'n',label:'power n',min:-3,max:5,step:0.5,val:3,unit:''},{s:'x',label:'x value',min:-5,max:5,step:0.1,val:2,unit:''}],calc:v=>v.n*Math.pow(v.x,v.n-1),insight:'The gradient of y = xⁿ at a chosen x. For n = 3, x = 2 the gradient is 3·2² = 12. Negative or fractional n still follow the same rule.',predict:{q:'For y = x², the gradient at larger positive x is…',opts:['larger','smaller','constant'],a:0}},
  {id:'al_defint',name:'Definite integral of x² (area)',form:'∫₀ᵇ x² dx = b³⁄3',unit:'',vars:[{s:'b',label:'upper limit b',min:0,max:6,step:0.1,val:3,unit:''}],calc:v=>Math.pow(v.b,3)/3,insight:'The signed area under y = x² from 0 to b. It grows with the cube of b — the curve gets steep, so area accumulates fast.',predict:{q:'Double the upper limit b. The area grows by a factor of…',opts:['8','2','4'],a:0}},
  {id:'al_geosum',name:'Geometric series sum',form:'Sₙ = a(1 − rⁿ)⁄(1 − r)',unit:'',vars:[{s:'a',label:'first term a',min:-10,max:10,step:0.5,val:3,unit:''},{s:'r',label:'common ratio r',min:-0.9,max:0.9,step:0.05,val:0.5,unit:''},{s:'n',label:'terms n',min:1,max:30,step:1,val:6,unit:''}],calc:v=>v.a*(1-Math.pow(v.r,v.n))/(1-v.r),insight:'Adds the first n terms. As n grows with |r| < 1 the sum approaches a/(1−r) — the sum to infinity.',predict:{q:'With |r| < 1, as n increases the sum…',opts:['approaches a fixed limit','grows without bound','oscillates forever'],a:0}},
  {id:'al_suminf',name:'Sum to infinity',form:'S∞ = a⁄(1 − r)',unit:'',vars:[{s:'a',label:'first term a',min:-10,max:10,step:0.5,val:4,unit:''},{s:'r',label:'common ratio |r|<1',min:-0.95,max:0.95,step:0.05,val:0.5,unit:''}],calc:v=>v.a/(1-v.r),insight:'Only valid for |r| < 1. As r approaches 1 the sum explodes; as r approaches 0 the sum approaches the first term a.',predict:{q:'As r gets closer to 1 (from below), the sum to infinity…',opts:['increases sharply','decreases','stays the same'],a:0}},
  {id:'al_ncr',name:'Binomial coefficient',form:'ⁿCr = n! ⁄ (r!(n−r)!)',unit:'',vars:[{s:'n',label:'n',min:0,max:12,step:1,val:5,unit:''},{s:'r',label:'r',min:0,max:12,step:1,val:2,unit:''}],calc:v=>{const f=k=>{let p=1;for(let i=2;i<=k;i++)p*=i;return p;};return v.r>v.n?0:f(v.n)/(f(v.r)*f(v.n-v.r));},insight:'The number of ways to choose r items from n — the coefficients in (a+b)ⁿ and Pascal\'s triangle. Symmetric: ⁿCr = ⁿC(n−r).',predict:{q:'ⁿC0 always equals…',opts:['1','0','n'],a:0}},
  {id:'al_compound',name:'Compound angle: sin(A+B)',form:'sin(A+B) = sinA cosB + cosA sinB',unit:'',vars:[{s:'A',label:'angle A',min:0,max:180,step:5,val:30,unit:'°'},{s:'B',label:'angle B',min:0,max:180,step:5,val:45,unit:'°'}],calc:v=>{const A=v.A*Math.PI/180,B=v.B*Math.PI/180;return Math.sin(A)*Math.cos(B)+Math.cos(A)*Math.sin(B);},insight:'Expands the sine of a sum. Setting A = B recovers the double-angle formula sin2A = 2sinA cosA. Compare the output to sin(A+B) directly — they match.',predict:{q:'sin(A+B) generally equals sinA + sinB?',opts:['no','yes','only at 90°'],a:0}},
  {id:'al_newton',name:'Newton–Raphson step',form:'x₁ = x₀ − f(x₀)⁄f′(x₀)',unit:'',vars:[{s:'x0',label:'current guess x₀',min:0.5,max:4,step:0.05,val:2,unit:''}],calc:v=>{const f=v.x0*v.x0-2,fp=2*v.x0;return v.x0-f/fp;},insight:'Shown for f(x)=x²−2 (root √2 ≈ 1.4142). From x₀ = 2 one step gives 1.5, then it converges rapidly toward √2. Each step roughly doubles the accurate digits.',predict:{q:'Near the root, Newton–Raphson converges…',opts:['very fast','slowly','not at all'],a:0}},
  {id:'al_expgrowth',name:'Exponential growth/decay',form:'A = A₀ e^{kt}',unit:'',vars:[{s:'A0',label:'initial amount A₀',min:0,max:1000,step:10,val:100,unit:''},{s:'k',label:'rate k',min:-0.5,max:0.5,step:0.01,val:0.1,unit:''},{s:'t',label:'time t',min:0,max:20,step:0.5,val:5,unit:''}],calc:v=>v.A0*Math.exp(v.k*v.t),insight:'Positive k is growth, negative k is decay. The rate of change is proportional to the current amount — the signature of exponential models.',predict:{q:'A negative value of k models…',opts:['decay','growth','no change'],a:0}},
  {id:'al_suvat',name:'SUVAT: displacement',form:'s = ut + ½at²',unit:'m',vars:[{s:'u',label:'initial velocity u',min:-20,max:30,step:1,val:5,unit:'m/s'},{s:'a',label:'acceleration a',min:-10,max:10,step:0.5,val:2,unit:'m/s²'},{s:'t',label:'time t',min:0,max:15,step:0.5,val:4,unit:'s'}],calc:v=>v.u*v.t+0.5*v.a*v.t*v.t,insight:'Valid only for constant acceleration. The first term is steady motion; the second is the extra distance from accelerating. Differentiating gives v = u + at.',predict:{q:'These equations require acceleration to be…',opts:['constant','increasing','zero'],a:0}},
  {id:'al_projrange',name:'Projectile range',form:'R = u² sin(2θ) ⁄ g',unit:'m',vars:[{s:'u',label:'launch speed u',min:0,max:40,step:1,val:20,unit:'m/s'},{s:'th',label:'launch angle θ',min:0,max:90,step:1,val:45,unit:'°'}],calc:v=>v.u*v.u*Math.sin(2*v.th*Math.PI/180)/9.8,insight:'Range is maximised at θ = 45° (where sin2θ = 1). Equal ranges occur for complementary angles (e.g. 30° and 60°).',predict:{q:'Which launch angle gives the greatest range?',opts:['45°','30°','75°'],a:0}},
  {id:'al_binom',name:'Binomial probability P(X = r)',form:'ⁿCr pʳ(1−p)ⁿ⁻ʳ',unit:'',vars:[{s:'n',label:'trials n',min:1,max:20,step:1,val:10,unit:''},{s:'p',label:'success prob p',min:0,max:1,step:0.05,val:0.5,unit:''},{s:'r',label:'successes r',min:0,max:20,step:1,val:5,unit:''}],calc:v=>{if(v.r>v.n)return 0;const f=k=>{let pr=1;for(let i=2;i<=k;i++)pr*=i;return pr;};const c=f(v.n)/(f(v.r)*f(v.n-v.r));return c*Math.pow(v.p,v.r)*Math.pow(1-v.p,v.n-v.r);},insight:'The chance of exactly r successes in n independent trials with constant p. The distribution peaks near np.',predict:{q:'The most likely number of successes is around…',opts:['np','n','p'],a:0}},
  {id:'al_sector',name:'Sector area (radians)',form:'A = ½ r²θ',unit:'units²',vars:[{s:'r',label:'radius r',min:0,max:15,step:0.5,val:5,unit:''},{s:'th',label:'angle θ (radians)',min:0,max:6.28,step:0.1,val:1.2,unit:'rad'}],calc:v=>0.5*v.r*v.r*v.th,insight:'Clean only in radians. The matching arc length is rθ. A full turn θ = 2π recovers the circle area πr².',predict:{q:'This formula assumes the angle is measured in…',opts:['radians','degrees','gradians'],a:0}}
 ],
 CF:[
  {topic:'Integration',o:'∫2x dx = x² + c, and a boundary condition fixes c.',f:'What if you dropped the + c?',r:'You would pick just one curve from a whole family that all have gradient 2x. Without c you cannot satisfy boundary or initial conditions — fatal for differential equations.'},
  {topic:'Mechanics',o:'A car with constant acceleration obeys v = u + at.',f:'What if the acceleration varied with time?',r:'suvat would no longer apply. You would model a = dv/dt and integrate, because the equations of constant acceleration are derived assuming a is fixed.'},
  {topic:'Sequences & series',o:'A geometric series with r = 0.5 sums to a/(1−r).',f:'What if r = 2 instead?',r:'There would be no sum to infinity — the terms grow, so the series diverges. The formula a/(1−r) only converges for |r| < 1.'},
  {topic:'Trigonometry',o:'In radians, d/dx(sin x) = cos x.',f:'What if you worked in degrees?',r:'An extra factor of π/180 would appear, so d/dx(sin x°) = (π/180)cos x°. The clean result is the reason calculus uses radians.'},
  {topic:'Differentiation',o:'At a maximum, f′ = 0 and f″ < 0.',f:'What if f″ = 0 at the stationary point?',r:'The second-derivative test is inconclusive — it could be a max, min or point of inflection. You must examine the sign of f′ on either side instead.'},
  {topic:'Mechanics',o:'Forces on a stationary block balance exactly.',f:'What if the applied force exceeded the maximum friction μR?',r:'The block would start to slide and accelerate, since the resultant force is no longer zero. Below μR it stays put; beyond it, F = ma takes over.'},
  {topic:'Trigonometry',o:'arcsin(0.5) = 30°, the principal value.',f:'What if you needed all solutions in 0°–360°?',r:'You would also include 150° (second quadrant). Taking only the principal value loses solutions — symmetry and period give the rest.'},
  {topic:'Statistics',o:'A binomial test gives a non-significant result.',f:'What if you concluded the null hypothesis is therefore true?',r:'That over-claims. "Not significant" means insufficient evidence to reject H₀, not proof of it — like a "not guilty" verdict, not "innocent".'},
  {topic:'Exponentials & logs',o:'ln(ab) splits into ln a + ln b.',f:'What if you tried the same on ln(a + b)?',r:'It would be wrong — there is no log law for a sum. Only products and quotients split.'},
  {topic:'Numerical methods',o:'A continuous function changes sign across an interval, locating a root.',f:'What if the function were discontinuous there?',r:'A sign change would no longer guarantee a root — the function could jump across the axis (e.g. 1/x at 0). Continuity is required for the argument.'},
  {topic:'Vectors',o:'The dot product a·b gives the angle between two vectors.',f:'What if a·b = 0 (but neither vector is zero)?',r:'The vectors are perpendicular, since cosθ = 0 means θ = 90°. The dot product is a quick perpendicularity test.'},
  {topic:'Differentiation',o:'d/dx of (3x+1)⁵ uses the chain rule: 15(3x+1)⁴.',f:'What if you forgot the inner derivative?',r:'You would get 5(3x+1)⁴, which is wrong by a factor of 3. The chain rule\'s inner factor is essential.'}
 ],
 CONTRAST:[
  {a:'Differentiation',b:'Integration',topic:'Differentiation',rows:[['Finds','rate / gradient','accumulation / area'],['Inverse of','integration','differentiation'],['Constant','disappears','appears (+ c)'],['xⁿ →','nxⁿ⁻¹','xⁿ⁺¹/(n+1) + c']],confusion:'They are inverse processes and the rules look mirror-imaged.',tell:'Differentiate → gradient (loses constants). Integrate → area (gains + c).'},
  {a:'Arithmetic series',b:'Geometric series',topic:'Sequences & series',rows:[['Step','add common difference d','multiply by ratio r'],['nth term','a + (n−1)d','arⁿ⁻¹'],['Sum','½n(2a+(n−1)d)','a(rⁿ−1)/(r−1)'],['Sum to infinity','never','only if |r| < 1']],confusion:'Both are series with similar-looking sum formulas.',tell:'Arithmetic adds d; geometric multiplies by r. Only geometric (|r|<1) sums to infinity.'},
  {a:'Permutations',b:'Combinations',topic:'Statistics',rows:[['Order matters?','yes','no'],['Formula','ⁿPr = n!/(n−r)!','ⁿCr = n!/(r!(n−r)!)'],['Example','race podium','choosing a committee'],['Count','larger','smaller (÷ r!)']],confusion:'Both count selections, but only permutations care about order.',tell:'Permutations: order matters. Combinations: order doesn\'t (divide by r!).'},
  {a:'Definite integral',b:'Indefinite integral',topic:'Integration',rows:[['Limits','yes (a to b)','no'],['Result','a number','a function + c'],['Meaning','signed area','general antiderivative'],['+ c','cancels out','required']],confusion:'Same symbol, but one gives a value and the other a family of functions.',tell:'Definite = a number (signed area). Indefinite = function + c.'},
  {a:'Mass',b:'Weight',topic:'Mechanics',rows:[['Quantity','amount of matter','gravitational force'],['Unit','kg','N'],['Depends on g?','no','yes (W = mg)'],['Changes on the Moon?','no','yes']],confusion:'Everyday speech treats them as the same.',tell:'Mass = matter (kg, constant). Weight = force of gravity (N, W = mg).'},
  {a:'Static friction',b:'Limiting/kinetic friction',topic:'Mechanics',rows:[['Value','whatever balances (≤ μR)','μR (maximum / sliding)'],['Motion','stationary','on the point of, or sliding'],['Direction','opposes tendency to move','opposes motion'],['Formula','F ≤ μR','F = μR']],confusion:'Students apply F = μR even when the object is not slipping.',tell:'Below slipping: friction adjusts (≤ μR). At/after slipping: friction = μR.'},
  {a:'One-tailed test',b:'Two-tailed test',topic:'Statistics',rows:[['Hypothesis','directional (>, or <)','non-directional (≠)'],['Rejection region','one end','split between both ends'],['Critical value','all α at one tail','α/2 each tail'],['Use when','testing an increase or decrease','testing for any change']],confusion:'Choosing the wrong tail changes the critical region and conclusion.',tell:'One-tailed: directional claim, all α in one tail. Two-tailed: "any change", α split.'},
  {a:'Degrees',b:'Radians',topic:'Trigonometry',rows:[['Full turn','360°','2π'],['Arc length','needs conversion','rθ directly'],['Calculus','adds π/180 factors','clean (d/dx sin x = cos x)'],['Use','everyday angles','calculus, analysis']],confusion:'Mixing them breaks calculus results and arc/sector formulas.',tell:'Use radians for calculus, arc length (rθ) and sector area (½r²θ).'},
  {a:'Local maximum',b:'Global maximum',topic:'Differentiation',rows:[['Definition','highest nearby','highest overall'],['Found by','f′ = 0, f″ < 0','compare all stationary pts + endpoints'],['Guaranteed?','from calculus','must check the whole domain'],['Example','a small hill','the tallest peak']],confusion:'A stationary point is only locally extreme; the global one may be elsewhere.',tell:'Local: extreme nearby. Global: compare every stationary point and the endpoints.'},
  {a:'Chain rule',b:'Product rule',topic:'Differentiation',rows:[['Applies to','a function of a function','a product of two functions'],['Example','(2x+1)⁵','x² eˣ'],['Method','outer\' × inner\'','u\'v + uv\''],['Trigger','"nested" brackets/powers','two factors multiplied']],confusion:'Both involve "two things", so the wrong rule gets used.',tell:'Nested function → chain rule. Two factors multiplied → product rule.'}
 ],
 MODELS:[
  {c:'Calculus: rates and accumulation',topic:'Differentiation',model:'Differentiation finds instantaneous rates (gradients); integration reverses it to accumulate totals and areas. Together (the Fundamental Theorem) they connect a quantity and its rate of change.',wrong:['A stationary point is always a maximum.','Definite integrals always give physical area.'],predict:['f′ = 0 locates stationary points; f″ classifies them.','Integrate a rate to recover the total.','Signed area can be negative.'],bound:['suvat-style shortcuts need constant rates.','Use radians for trig calculus.'],ex:['Optimisation problems.','Kinematics from calculus.']},
  {c:'Exponential & logarithmic models',topic:'Exponentials & logs',model:'When a quantity changes at a rate proportional to itself, it grows or decays exponentially (A = A₀eᵏᵗ). Logs invert this and linearise power/exponential data so a straight-line fit reveals the parameters.',wrong:['ln(a+b) splits.','e^(a+b) = eᵃ + eᵇ.'],predict:['Positive k = growth, negative k = decay.','Take logs to linearise y = axⁿ or y = abˣ.','Half-life/doubling time are constant.'],bound:['Log laws apply to products/quotients only.','Domain of ln is x > 0.'],ex:['Population and radioactive decay.','Fitting models to data.']},
  {c:'Trigonometric modelling',topic:'Trigonometry',model:'Identities and compound/double-angle formulas reshape trig expressions; in radians, arcs, sectors and calculus stay clean. Solving over a range needs symmetry and periodicity to capture every solution.',wrong:['arcsin gives the only solution.','sin²x = sin(x²).'],predict:['Rsin(x+α) form models oscillations.','Find all solutions using period and symmetry.','Small-angle: sin x ≈ x, cos x ≈ 1 − x²/2 (radians).'],bound:['Calculus results assume radians.','Watch the given range.'],ex:['Tides and waves.','Solving trig equations.']},
  {c:'Newtonian mechanics',topic:'Mechanics',model:'Resolve forces into perpendicular components and apply F = ma in each direction. Constant acceleration uses suvat; varying acceleration uses calculus. Friction acts up to a limit μR.',wrong:['Weight = mass.','Friction always equals μR.','Projectiles accelerate horizontally.'],predict:['Resultant force = ma in each direction.','Connected particles share one acceleration.','Projectiles: horizontal constant, vertical g.'],bound:['suvat needs constant acceleration.','Model assumptions (smooth, light, inextensible).'],ex:['Slopes and pulleys.','Projectile motion.']},
  {c:'Probability distributions',topic:'Statistics',model:'A random variable\'s behaviour is captured by a distribution. The binomial counts successes in fixed independent trials; the normal models symmetric continuous data, standardised with z = (x−μ)/σ.',wrong:['Any count is binomial.','Independent = mutually exclusive.'],predict:['Binomial needs fixed n, constant p, independence.','Normal: standardise to use one table.','Mean of B(n,p) is np.'],bound:['Check modelling conditions.','Continuity corrections when approximating.'],ex:['Quality control.','Modelling measurements.']},
  {c:'Hypothesis testing framework',topic:'Statistics',model:'Assume the null hypothesis, then measure how surprising the data would be under it (the p-value). If that probability falls below the significance level, reject H₀; otherwise withhold judgement. One- or two-tailed depends on the claim.',wrong:['Failing to reject proves H₀.','Correlation proves causation.'],predict:['Small p-value → reject H₀.','Directional claim → one-tailed.','State hypotheses, test, conclude in context.'],bound:['Significance level is chosen in advance.','Tests never prove H₀.'],ex:['Testing a claimed proportion.','Testing correlation.']},
  {c:'Proof methods',topic:'Proof',model:'Rigorous argument takes several forms: direct deduction, proof by exhaustion (check all cases), disproof by counter-example, and proof by contradiction (assume the negation, derive an absurdity).',wrong:['One example proves a general statement.','A pattern guarantees a rule.'],predict:['A single counter-example disproves a claim.','Contradiction proves irrationality results.','Exhaustion suits finitely many cases.'],bound:['Examples never prove "for all".','Each method has its appropriate use.'],ex:['Proving √2 irrational.','Disproving false conjectures.']}
 ],
 SPEC:[
  {id:'alp1',n:1,paper:'Pure',title:'Proof',pts:['Proof by deduction, exhaustion and contradiction','Disproof by counter-example'],study:[['Mental models','models'],['Misconception fixes','misconceptions']]},
  {id:'alp2',n:2,paper:'Pure',title:'Algebra & functions',pts:['Indices, surds, quadratics, simultaneous equations and inequalities','Polynomials, graphs and transformations','Partial fractions and the modulus function'],study:[['Misconception fixes','misconceptions'],['Concept contrasts','contrast'],['Equation explorer','explorer']]},
  {id:'alp3',n:3,paper:'Pure',title:'Coordinate geometry',pts:['Straight lines and circles','Parametric equations'],study:[['Equation explorer','explorer'],['Mental models','models']]},
  {id:'alp4',n:4,paper:'Pure',title:'Sequences & series',pts:['Arithmetic and geometric series','Binomial expansion','Recurrence relations and sigma notation'],study:[['Concept contrasts','contrast'],['Equation explorer','explorer'],['Trigger trainer','trigger']]},
  {id:'alp5',n:5,paper:'Pure',title:'Trigonometry',pts:['Radians, arcs and sectors','Identities, double and compound angles, Rsin(x+α)','Solving equations and small-angle approximations'],study:[['Trigger trainer','trigger'],['Misconception fixes','misconceptions'],['Equation explorer','explorer']]},
  {id:'alp6',n:6,paper:'Pure',title:'Exponentials & logarithms',pts:['eˣ and ln x','Laws of logarithms','Exponential growth and decay; linearising'],study:[['Concept contrasts','contrast'],['Mental models','models']]},
  {id:'alp7',n:7,paper:'Pure',title:'Differentiation',pts:['First principles and standard derivatives','Chain, product and quotient rules; implicit and parametric','Stationary points, concavity and connected rates'],study:[['Trigger trainer','trigger'],['Misconception fixes','misconceptions'],['Equation explorer','explorer']]},
  {id:'alp8',n:8,paper:'Pure',title:'Integration',pts:['Standard integrals and definite integrals','Substitution, by parts and partial fractions','Areas, the trapezium rule and differential equations'],study:[['Trigger trainer','trigger'],['Concept contrasts','contrast'],['Mental models','models']]},
  {id:'alp9',n:9,paper:'Pure',title:'Numerical methods',pts:['Location of roots by change of sign','Iteration x = g(x) and Newton–Raphson','The trapezium rule'],study:[['Trigger trainer','trigger'],['Equation explorer','explorer']]},
  {id:'alp10',n:10,paper:'Pure',title:'Vectors',pts:['2D and 3D vectors, magnitude and direction','Position vectors and geometric problems','The scalar (dot) product'],study:[['Mental models','models'],['Misconception fixes','misconceptions']]},
  {id:'als1',n:11,paper:'Statistics',title:'Statistical sampling & data',pts:['Populations, samples and sampling methods','Measures of location and spread; outliers','Correlation and regression'],study:[['Concept contrasts','contrast'],['Misconception fixes','misconceptions']]},
  {id:'als2',n:12,paper:'Statistics',title:'Probability & distributions',pts:['Venn and tree diagrams; conditional probability','Independence and mutually exclusive events','The binomial and normal distributions'],study:[['Concept contrasts','contrast'],['Equation explorer','explorer'],['Mental models','models']]},
  {id:'als3',n:13,paper:'Statistics',title:'Hypothesis testing',pts:['Null and alternative hypotheses','Binomial, correlation and normal tests','One- and two-tailed tests'],study:[['Mental models','models'],['Concept contrasts','contrast']]},
  {id:'alm1',n:14,paper:'Mechanics',title:'Kinematics',pts:['Constant acceleration (suvat) and graphs','Calculus for variable acceleration','Projectile motion'],study:[['Trigger trainer','trigger'],['Equation explorer','explorer'],['Misconception fixes','misconceptions']]},
  {id:'alm2',n:15,paper:'Mechanics',title:'Forces & Newton\'s laws',pts:['F = ma and resolving forces','Friction and connected particles','Weight, tension and normal reaction'],study:[['Mental models','models'],['Misconception fixes','misconceptions'],['Trigger trainer','trigger']]},
  {id:'alm3',n:16,paper:'Mechanics',title:'Moments',pts:['Turning effect of a force','Equilibrium of rigid bodies'],study:[['Mental models','models'],['Concept contrasts','contrast']]}
 ],
 AQA_SPEC:[
  {id:'alaq1',n:1,pap:0,title:'Proof',pts:['Deduction, exhaustion, contradiction','Counter-examples'],study:[['Mental models','models']]},
  {id:'alaq2',n:2,pap:0,title:'Algebra & functions',pts:['Indices, surds, quadratics, inequalities','Functions, graphs and transformations','Partial fractions and modulus'],study:[['Misconception fixes','misconceptions'],['Concept contrasts','contrast']]},
  {id:'alaq3',n:3,pap:0,title:'Coordinate geometry',pts:['Lines, circles and parametric curves'],study:[['Equation explorer','explorer']]},
  {id:'alaq4',n:4,pap:0,title:'Sequences & series',pts:['Arithmetic and geometric series','Binomial expansion','Sigma notation'],study:[['Concept contrasts','contrast'],['Trigger trainer','trigger']]},
  {id:'alaq5',n:5,pap:0,title:'Trigonometry',pts:['Radians, identities and compound angles','Solving trig equations'],study:[['Trigger trainer','trigger'],['Equation explorer','explorer']]},
  {id:'alaq6',n:6,pap:0,title:'Exponentials & logarithms',pts:['eˣ, ln x and log laws','Growth and decay'],study:[['Mental models','models']]},
  {id:'alaq7',n:7,pap:0,title:'Differentiation',pts:['Rules of differentiation','Stationary points and applications'],study:[['Trigger trainer','trigger'],['Misconception fixes','misconceptions']]},
  {id:'alaq8',n:8,pap:0,title:'Integration',pts:['Methods of integration','Areas and differential equations'],study:[['Trigger trainer','trigger'],['Mental models','models']]},
  {id:'alaq9',n:9,pap:0,title:'Numerical methods',pts:['Root location, iteration, Newton–Raphson','Numerical integration'],study:[['Equation explorer','explorer']]},
  {id:'alaq10',n:10,pap:0,title:'Vectors',pts:['2D and 3D vectors and the dot product'],study:[['Mental models','models']]},
  {id:'alaq11',n:11,pap:1,title:'Statistics',pts:['Sampling, data and regression','Probability and distributions','Hypothesis testing'],study:[['Concept contrasts','contrast'],['Mental models','models']]},
  {id:'alaq12',n:12,pap:2,title:'Mechanics',pts:['Kinematics and projectiles','Forces, Newton\'s laws and moments'],study:[['Trigger trainer','trigger'],['Equation explorer','explorer']]}
 ],
 CPRAC:[],
 AQA_PRAC:[]
};

/* ============ FURTHER MATHS (Edexcel 9FM0 / AQA 7367) ============ */
const FMATHS = {
 name:'Further Maths', code:'furthermaths', edx:'Edexcel (9FM0)', aqa:'AQA (7367)',
 tools:['trigger','miscquiz','explorer','counterfactual','misconceptions','contrast','models','analogies','spec'],
 DIAG_TOPICS:['Complex numbers','Matrices','Roots of polynomials','Series & induction','Further calculus','Further vectors','Polar coordinates','Hyperbolic functions','Differential equations','Options','Other'],
 MIS:[
  {t:'i² equals 1',topic:'Complex numbers',wrong:'Since i = √(−1), squaring it gives 1.',right:'By definition i² = −1 (that is the whole point of i). So √(−1)·√(−1) = −1, not 1. This single fact drives all complex arithmetic.',ana:'i is built precisely so that its square is negative — the property ordinary numbers lack.',tell:'i² = −1. Every complex calculation hinges on replacing i² with −1.'},
  {t:'You cannot take the square root of a negative number',topic:'Complex numbers',wrong:'√(−9) has no value.',right:'In the complex numbers √(−9) = 3i, because (3i)² = 9i² = −9. Negative roots are perfectly defined once you allow i.',ana:'Stepping off the real line into the complex plane gives roots that "don\'t exist" on the line alone.',tell:'√(−a) = i√a for a > 0. Negative square roots are imaginary, not impossible.'},
  {t:'The modulus of a + bi is a',topic:'Complex numbers',wrong:'|3 + 4i| = 3.',right:'The modulus is the distance from the origin in the Argand plane: |a + bi| = √(a² + b²). So |3 + 4i| = √(9 + 16) = 5, not 3.',ana:'It is the length of the arrow to the point, found by Pythagoras — not just the horizontal part.',tell:'|a + bi| = √(a² + b²). Use both parts.'},
  {t:'The argument is just arctan(b/a)',topic:'Complex numbers',wrong:'arg(a + bi) = tan⁻¹(b/a) straight off the calculator.',right:'arctan(b/a) gives the right answer only in the first/fourth quadrants. You must check which QUADRANT a + bi lies in and adjust by ±π, or the argument is wrong by 180°.',ana:'The calculator can\'t see which corner of the plane you\'re in — you have to tell it.',tell:'arg = arctan(b/a) adjusted for the quadrant of (a, b).'},
  {t:'Matrix multiplication is commutative',topic:'Matrices',wrong:'AB = BA for matrices, like ordinary numbers.',right:'In general AB ≠ BA — order matters. It reflects that doing transformation B then A differs from A then B. Even the sizes may not allow both products.',ana:'Rotating then reflecting is not the same as reflecting then rotating.',tell:'Matrices generally don\'t commute: AB ≠ BA. Keep the order.'},
  {t:'You multiply matrices element by element',topic:'Matrices',wrong:'To find AB, multiply matching entries.',right:'Matrix multiplication is ROW times COLUMN: each entry of AB is the dot product of a row of A with a column of B. Element-wise multiplication is a different (rarely used) operation.',ana:'Each output cell pairs a whole row against a whole column, not single cells.',tell:'AB entry = (row of A)·(column of B). Not element-wise.'},
  {t:'Every matrix has an inverse',topic:'Matrices',wrong:'You can always find A⁻¹.',right:'A square matrix is invertible only if its DETERMINANT is non-zero. If det A = 0 the matrix is singular and has no inverse — it collapses space, losing information.',ana:'A transformation that squashes the plane onto a line can\'t be undone.',tell:'Inverse exists ⇔ det A ≠ 0. det A = 0 ⇒ singular, no inverse.'},
  {t:'(AB)⁻¹ = A⁻¹B⁻¹',topic:'Matrices',wrong:'Invert a product by inverting each factor in place.',right:'The inverse of a product REVERSES the order: (AB)⁻¹ = B⁻¹A⁻¹. To undo "do B then A", you undo A first, then B.',ana:'Putting on socks then shoes is undone by removing shoes first, then socks.',tell:'(AB)⁻¹ = B⁻¹A⁻¹ — reverse the order.'},
  {t:'The volume of revolution uses ∫y dx',topic:'Further calculus',wrong:'Rotate a curve and the volume is ∫y dx.',right:'Rotating about the x-axis gives volume π∫y² dx — each thin slice is a disc of area πy². Forgetting the square (and the π) is the classic error.',ana:'Each slice is a circle, and a circle\'s area uses the radius squared.',tell:'Volume about the x-axis = π∫y² dx (discs), not ∫y dx.'},
  {t:'The area of a polar curve uses ∫r dθ',topic:'Polar coordinates',wrong:'Polar area is ∫r dθ.',right:'It is ½∫r² dθ — each elementary sector has area ½r² dθ. The square and the half both come from the sector-area formula.',ana:'Sweeping out tiny sectors, each like ½r²θ, then adding them up.',tell:'Polar area = ½∫r² dθ.'},
  {t:'cosh and sinh are periodic like cos and sin',topic:'Hyperbolic functions',wrong:'cosh x repeats every 2π.',right:'Hyperbolic functions are NOT periodic. cosh x = (eˣ + e⁻ˣ)/2 grows without bound; sinh x increases steadily. They are built from exponentials, not rotations.',ana:'Cos/sin trace a circle (repeating); cosh/sinh trace a hyperbola (running off to infinity).',tell:'cosh/sinh are exponential, non-periodic. Only the names echo cos/sin.'},
  {t:'cosh²x + sinh²x = 1',topic:'Hyperbolic functions',wrong:'The hyperbolic identity matches cos²+sin²=1.',right:'The correct identity has a MINUS: cosh²x − sinh²x = 1. The sign change (Osborn\'s rule) is what distinguishes hyperbolic from circular identities.',ana:'The hyperbola x² − y² = 1 has a minus where the circle x² + y² = 1 has a plus.',tell:'cosh²x − sinh²x = 1 (minus, not plus).'},
  {t:'Complex roots can appear singly',topic:'Roots of polynomials',wrong:'A real polynomial can have just one complex root.',right:'For a polynomial with REAL coefficients, non-real roots occur in CONJUGATE PAIRS: if a + bi is a root, so is a − bi. So complex roots come two at a time.',ana:'They are mirror images across the real axis — you never get one without the other.',tell:'Real coefficients ⇒ complex roots come in conjugate pairs.'},
  {t:'A second-order ODE needs only the complementary function',topic:'Differential equations',wrong:'Solving ay″ + by′ + cy = f(x) just means finding the complementary function.',right:'The general solution is the complementary function PLUS a particular integral: y = CF + PI. The CF solves the homogeneous part; the PI handles the f(x) on the right.',ana:'CF is the system\'s natural behaviour; PI is its forced response to the input.',tell:'Second-order ODE solution = complementary function + particular integral.'},
  {t:'The cross product gives a number',topic:'Further vectors',wrong:'a × b is a scalar like the dot product.',right:'The VECTOR (cross) product a × b is a VECTOR, perpendicular to both a and b, with magnitude |a||b|sinθ. The DOT product is the scalar. Don\'t swap them.',ana:'Cross product points out of the plane; dot product is just a size.',tell:'a · b = scalar. a × b = vector (perpendicular, magnitude |a||b|sinθ).'},
  {t:'Maclaurin series are valid for all x',topic:'Series & induction',wrong:'A Maclaurin expansion equals the function everywhere.',right:'Many series converge only within a radius of convergence (e.g. the binomial/ln series for |x| < 1). Some (eˣ, sin x) converge for all x, but you cannot assume it — check validity.',ana:'A local polynomial mimic is faithful near 0 but may drift far away.',tell:'Maclaurin series have a range of validity; check convergence before using.'},
  {t:'det(A + B) = det A + det B',topic:'Matrices',wrong:'The determinant distributes over a sum.',right:'It does NOT: det(A + B) ≠ det A + det B in general. However, the determinant IS multiplicative: det(AB) = det A · det B.',ana:'Areas don\'t add when you add transformations, but they do multiply when you compose them.',tell:'det(AB) = det A · det B, but det(A + B) does not split.'},
  {t:'A polar r value must be positive',topic:'Polar coordinates',wrong:'r is a distance, so it cannot be negative.',right:'Conventionally r can be negative: a point (−r, θ) is plotted at distance |r| in the OPPOSITE direction (θ + π). Allowing negative r lets curves like r = cos2θ trace fully.',ana:'A negative step means "go backwards" along the ray.',tell:'Negative r is allowed: plot at θ + π, distance |r|.'},
  {t:'An improper integral always diverges',topic:'Further calculus',wrong:'Integrating to infinity never gives a finite answer.',right:'Some improper integrals CONVERGE (e.g. ∫₁^∞ 1/x² dx = 1), others diverge (∫₁^∞ 1/x dx). You evaluate the limit to decide — infinity in a limit doesn\'t guarantee divergence.',ana:'An infinitely long but fast-thinning shape can still enclose a finite area.',tell:'Improper integrals may converge or diverge — take the limit to find out.'},
  {t:'Proof by induction is just checking a few cases',topic:'Series & induction',wrong:'Show it works for n = 1, 2, 3 and you\'re done.',right:'Induction needs a BASE CASE and an INDUCTIVE STEP: assume true for n = k, then PROVE true for n = k + 1. Checking examples alone never proves a statement for all n.',ana:'Toppling dominoes needs the first to fall AND each to knock over the next — not just watching three fall.',tell:'Induction = base case + (assume k ⇒ prove k+1). Examples are not proof.'}
 ],
 ANA:[
  {topic:'Complex numbers',k:'Complex numbers = points in a plane',v:'a + bi is the point (a, b) on the Argand diagram. Addition is vector addition; the modulus is the arrow\'s length and the argument its angle — geometry and algebra fused.'},
  {topic:'Complex numbers',k:'Multiplying = rotate and scale',v:'In modulus–argument form, multiplying two complex numbers multiplies their moduli and ADDS their arguments. So multiplying by a unit complex number is a pure rotation.'},
  {topic:'Complex numbers',k:'de Moivre = repeated rotation',v:'(cosθ + isinθ)ⁿ = cos nθ + i sin nθ: raising to a power multiplies the angle by n. It turns powers and roots of complex numbers into simple angle arithmetic.'},
  {topic:'Matrices',k:'Matrices = transformation machines',v:'A matrix maps vectors to vectors — rotating, reflecting, stretching or shearing space. Multiplying matrices composes transformations, which is why order matters.'},
  {topic:'Matrices',k:'Determinant = area scale factor',v:'The determinant tells you how a transformation scales area (2D) or volume (3D). A determinant of zero squashes space flat — irreversibly, hence no inverse.'},
  {topic:'Matrices',k:'Inverse matrix = the undo button',v:'A⁻¹ reverses A\'s transformation, returning every vector to where it started. It exists only when nothing was lost — that is, when det A ≠ 0.'},
  {topic:'Roots of polynomials',k:'Vieta\'s = roots in disguise',v:'The sum and product of a polynomial\'s roots are read straight from its coefficients (e.g. sum = −b/a). Symmetric functions of the roots appear without solving the equation.'},
  {topic:'Series & induction',k:'Maclaurin = a polynomial mimic near 0',v:'A function is approximated by a polynomial matching its value and derivatives at 0. More terms hug the curve more closely — within the range where the series converges.'},
  {topic:'Series & induction',k:'Induction = falling dominoes',v:'Prove the first domino falls (base case) and that any falling domino topples the next (inductive step); then all of them fall. That establishes a result for every positive integer n.'},
  {topic:'Further calculus',k:'Volume of revolution = a stack of discs',v:'Rotating a curve about an axis sweeps out thin discs of radius y. Each has area πy²; integrating π∫y² dx stacks them into the solid.'},
  {topic:'Further vectors',k:'Cross product = the perpendicular maker',v:'a × b produces a vector at right angles to both, with length equal to the area of the parallelogram they span. It is ideal for finding normals to planes.'},
  {topic:'Further vectors',k:'A plane = a point plus a normal',v:'Fix one point and a perpendicular (normal) direction and the plane is determined: every point on it makes a right angle with the normal — the basis of r·n = d.'},
  {topic:'Polar coordinates',k:'Polar = distance and direction',v:'Instead of (x, y), describe a point by how far out (r) and at what angle (θ). Curves with rotational symmetry — spirals, roses, cardioids — become simple in polar form.'},
  {topic:'Hyperbolic functions',k:'Hyperbolic = the hyperbola\'s trig',v:'cosh and sinh parametrise the hyperbola x² − y² = 1 just as cos and sin parametrise the circle. Built from eˣ, they share many identities but with key sign changes (Osborn\'s rule).'},
  {topic:'Differential equations',k:'Differential equations = laws of change',v:'They relate a quantity to its rates of change, encoding physical laws. Solving them recovers the behaviour over time — growth, oscillation or decay — from the rule that governs it.'},
  {topic:'Differential equations',k:'SHM = a restoring pull',v:'Simple harmonic motion obeys a = −ω²x: the acceleration always points back toward equilibrium, proportional to displacement. That balance produces sinusoidal oscillation.'}
 ],
 TRIG:[
  {s:'You must find all solutions of z⁴ = 1.',mode:'multi',opts:[{t:'Write 1 in modulus–argument form',c:1},{t:'Use de Moivre / roots of unity',c:1},{t:'Space four roots equally around the unit circle',c:1},{t:'Just take the real fourth root',c:0}],why:'The four fourth-roots of unity sit equally spaced on the unit circle (1, i, −1, −i). de Moivre gives them; taking only the real root misses three.'},
  {s:'You must solve the simultaneous equations represented by AX = B for a 2×2 invertible A.',mode:'single',opts:[{t:'Compute X = A⁻¹B',c:1},{t:'X = BA⁻¹',c:0},{t:'Divide B by A element-wise',c:0},{t:'Transpose A',c:0}],why:'Pre-multiply both sides by A⁻¹: X = A⁻¹B. Order matters (A⁻¹ on the left), and matrices are not divided.'},
  {s:'You need the volume when y = √x (0 to 4) is rotated about the x-axis.',mode:'single',opts:[{t:'π∫₀⁴ y² dx',c:1},{t:'∫₀⁴ y dx',c:0},{t:'2π∫₀⁴ y dx',c:0},{t:'½∫₀⁴ y² dx',c:0}],why:'Rotation about the x-axis gives discs of area πy², so volume = π∫y² dx = π∫₀⁴ x dx.'},
  {s:'You must find the area enclosed by the polar curve r = 1 + cosθ.',mode:'single',opts:[{t:'½∫ r² dθ over the correct range',c:1},{t:'∫ r dθ',c:0},{t:'π r²',c:0},{t:'∫ r² dθ',c:0}],why:'Polar area is ½∫r² dθ; integrate over the θ-range that traces the curve once.'},
  {s:'You must solve y″ + y = 0.',mode:'multi',opts:[{t:'Form the auxiliary (characteristic) equation',c:1},{t:'Complementary function from complex roots ±i',c:1},{t:'General solution A cos x + B sin x',c:1},{t:'Separate the variables',c:0}],why:'A linear second-order homogeneous ODE: the auxiliary equation m² + 1 = 0 gives m = ±i, so y = A cos x + B sin x. Separation of variables is for first-order separable equations.'},
  {s:'You must find the angle between a line and a plane.',mode:'single',opts:[{t:'Use the dot product with the plane\'s normal',c:1},{t:'Use the cross product magnitude only',c:0},{t:'Add the direction vectors',c:0},{t:'Use de Moivre',c:0}],why:'Find the angle between the line\'s direction and the normal via the dot product, then take the complement (90° minus that) for the line–plane angle.'},
  {s:'You must sum the series Σ 1/(r(r+1)) from r = 1 to n.',mode:'single',opts:[{t:'Method of differences (telescoping)',c:1},{t:'Geometric series formula',c:0},{t:'Binomial expansion',c:0},{t:'Integration',c:0}],why:'Split into partial fractions 1/r − 1/(r+1); successive terms cancel (telescope), leaving 1 − 1/(n+1).'},
  {s:'You must integrate ∫ 1/√(x² + 1) dx.',mode:'single',opts:[{t:'Hyperbolic substitution x = sinh u',c:1},{t:'Substitution x = sin u',c:0},{t:'Integration by parts',c:0},{t:'Partial fractions',c:0}],why:'The form √(x² + 1) suggests x = sinh u, since cosh²u − sinh²u = 1 turns the root into cosh u, giving arsinh x.'},
  {s:'You need to determine whether a 2×2 matrix is invertible.',mode:'single',opts:[{t:'Check whether the determinant is non-zero',c:1},{t:'Check whether it is symmetric',c:0},{t:'Add the diagonal entries',c:0},{t:'See if all entries are positive',c:0}],why:'A matrix is invertible exactly when det ≠ 0; a zero determinant means it is singular.'},
  {s:'You must prove that Σr from 1 to n = ½n(n+1) for all positive integers n.',mode:'multi',opts:[{t:'Proof by induction',c:1},{t:'Verify the base case n = 1',c:1},{t:'Assume true for n = k, prove for n = k+1',c:1},{t:'Check n = 1, 2, 3 and stop',c:0}],why:'A "for all n" statement calls for induction: establish the base case, then the inductive step. Checking a few cases is not a proof.'},
  {s:'You must express z = 1 + i in modulus–argument form.',mode:'multi',opts:[{t:'Modulus √2',c:1},{t:'Argument π/4',c:1},{t:'Check the quadrant of (1, 1)',c:1},{t:'Argument is arctan(1) with no quadrant check needed... ignore the plane',c:0}],why:'|1 + i| = √2 and, since (1, 1) is in the first quadrant, arg = π/4. The quadrant check confirms the angle is correct.'},
  {s:'You must find the equation of a plane through a point with a given normal vector.',mode:'single',opts:[{t:'Use r·n = a·n',c:1},{t:'Use the cross product as the equation',c:0},{t:'Use r = a + λb + μc with no normal',c:0},{t:'Use de Moivre',c:0}],why:'With a normal n and a known point a, every point r on the plane satisfies r·n = a·n — the scalar product form.'}
 ],
 QUIZ:[
  {_mt:'i² equals 1',q:'What is i²?',opts:[{t:'−1',c:1},{t:'1',c:0},{t:'i',c:0}],feels:'Squaring usually gives a positive result.',soc:['How is i defined?','If i = √(−1), what is (√(−1))²?','So what is i²?']},
  {_mt:'The modulus of a + bi is a',q:'What is |3 + 4i|?',opts:[{t:'5',c:1},{t:'3',c:0},{t:'7',c:0}],feels:'The real part 3 looks like the obvious size.',soc:['How do you measure distance from the origin in the plane?','What is √(3² + 4²)?','So is the modulus 3 or 5?']},
  {_mt:'Matrix multiplication is commutative',q:'For general matrices A and B, does AB = BA?',opts:[{t:'No, usually not',c:1},{t:'Yes, always',c:0},{t:'Only for 2×2 matrices',c:0}],feels:'Ordinary number multiplication commutes, so matrices "should" too.',soc:['Do transformations depend on the order you apply them?','Is "rotate then reflect" the same as "reflect then rotate"?','So is matrix multiplication commutative?']},
  {_mt:'(AB)⁻¹ = A⁻¹B⁻¹',q:'What is (AB)⁻¹ in terms of A⁻¹ and B⁻¹?',opts:[{t:'B⁻¹A⁻¹',c:1},{t:'A⁻¹B⁻¹',c:0},{t:'(AB)⁻¹ can\'t be found',c:0}],feels:'Keeping the same order looks natural.',soc:['To undo "do B then A", which do you undo first?','Like socks then shoes — what comes off first?','So in what order do the inverses go?']},
  {_mt:'Every matrix has an inverse',q:'When does a square matrix fail to have an inverse?',opts:[{t:'When its determinant is zero',c:1},{t:'Never — all have inverses',c:0},{t:'When it is not symmetric',c:0}],feels:'Numbers (except 0) all have reciprocals, so matrices feel similar.',soc:['What does a zero determinant do to area/volume?','Can you undo a transformation that flattens space?','So which matrices have no inverse?']},
  {_mt:'The volume of revolution uses ∫y dx',q:'A curve y = f(x) is rotated about the x-axis. What is the volume?',opts:[{t:'π∫y² dx',c:1},{t:'∫y dx',c:0},{t:'2π∫y dx',c:0}],feels:'∫y dx (the area) feels like the natural thing to integrate.',soc:['What shape is each thin slice of the solid?','What is the area of a disc of radius y?','So what do you integrate for the volume?']},
  {_mt:'The area of a polar curve uses ∫r dθ',q:'What integral gives the area swept by a polar curve r(θ)?',opts:[{t:'½∫r² dθ',c:1},{t:'∫r dθ',c:0},{t:'∫r² dθ',c:0}],feels:'∫r dθ looks like the obvious analogue of ∫y dx.',soc:['What is the area of a tiny sector of radius r and angle dθ?','Where do the ½ and the square come from?','So what is the polar area formula?']},
  {_mt:'cosh and sinh are periodic like cos and sin',q:'Is cosh x periodic?',opts:[{t:'No — it grows without bound',c:1},{t:'Yes, period 2π',c:0},{t:'Yes, period π',c:0}],feels:'The names cos/cosh suggest the same behaviour.',soc:['What is cosh x in terms of eˣ?','Does (eˣ + e⁻ˣ)/2 repeat, or keep growing?','So is cosh periodic?']},
  {_mt:'cosh²x + sinh²x = 1',q:'Which identity is correct for hyperbolic functions?',opts:[{t:'cosh²x − sinh²x = 1',c:1},{t:'cosh²x + sinh²x = 1',c:0},{t:'sinh²x − cosh²x = 1',c:0}],feels:'The circular identity cos²+sin²=1 makes the plus version feel right.',soc:['Which curve do cosh/sinh parametrise — circle or hyperbola?','What is the equation of that hyperbola (plus or minus)?','So which sign appears in the identity?']},
  {_mt:'Complex roots can appear singly',q:'A polynomial with real coefficients has 2 + 3i as a root. What else must be a root?',opts:[{t:'2 − 3i (the conjugate)',c:1},{t:'Nothing else is forced',c:0},{t:'−2 − 3i',c:0}],feels:'One complex root seems like it could stand alone.',soc:['What does "real coefficients" force about complex roots?','What is the conjugate of 2 + 3i?','So which root must also appear?']},
  {_mt:'The cross product gives a number',q:'Is the vector (cross) product a × b a scalar or a vector?',opts:[{t:'A vector, perpendicular to both',c:1},{t:'A scalar',c:0},{t:'Sometimes either',c:0}],feels:'The dot product gives a number, so cross might too.',soc:['Which product gives a scalar — dot or cross?','What direction does a × b point relative to a and b?','So is the cross product a scalar or a vector?']},
  {_mt:'Proof by induction is just checking a few cases',q:'What must a proof by induction contain?',opts:[{t:'A base case and an inductive step',c:1},{t:'Three worked examples',c:0},{t:'A single counter-example',c:0}],feels:'Checking n = 1, 2, 3 feels convincing enough.',soc:['Does verifying examples prove a statement for ALL n?','What lets you pass from n = k to n = k + 1?','So what two parts must an induction proof have?']}
 ],
 EQS:[
  {id:'fm_mod',name:'Modulus of a complex number',form:'|a + bi| = √(a² + b²)',unit:'',vars:[{s:'a',label:'real part a',min:-10,max:10,step:0.5,val:3,unit:''},{s:'b',label:'imaginary part b',min:-10,max:10,step:0.5,val:4,unit:''}],calc:v=>Math.sqrt(v.a*v.a+v.b*v.b),insight:'The distance from the origin to (a, b) in the Argand plane — Pythagoras again. (3, 4) gives 5, a familiar triple.',predict:{q:'Increasing the imaginary part b (a fixed) makes the modulus…',opts:['increase','decrease','stay the same'],a:0}},
  {id:'fm_det',name:'Determinant of a 2×2 matrix',form:'det = ad − bc',unit:'',vars:[{s:'a',label:'a',min:-6,max:6,step:1,val:2,unit:''},{s:'b',label:'b',min:-6,max:6,step:1,val:1,unit:''},{s:'c',label:'c',min:-6,max:6,step:1,val:1,unit:''},{s:'d',label:'d',min:-6,max:6,step:1,val:3,unit:''}],calc:v=>v.a*v.d-v.b*v.c,insight:'The area scale factor of the transformation. A determinant of zero means the matrix is singular (no inverse) — it collapses the plane onto a line.',predict:{q:'If the determinant is zero, the matrix…',opts:['has no inverse','has two inverses','is the identity'],a:0}},
  {id:'fm_demoivre',name:'de Moivre: real part of (cosθ+isinθ)ⁿ',form:'cos(nθ)',unit:'',vars:[{s:'th',label:'angle θ',min:0,max:360,step:5,val:30,unit:'°'},{s:'n',label:'power n',min:1,max:8,step:1,val:3,unit:''}],calc:v=>Math.cos(v.n*v.th*Math.PI/180),insight:'Raising to the nth power multiplies the argument by n. The real part is cos(nθ): powers of complex numbers become angle multiplication.',predict:{q:'Raising to a power n multiplies the argument by…',opts:['n','n²','1/n'],a:0}},
  {id:'fm_cosh',name:'Hyperbolic cosine',form:'cosh x = (eˣ + e⁻ˣ)⁄2',unit:'',vars:[{s:'x',label:'x',min:-3,max:3,step:0.1,val:1,unit:''}],calc:v=>(Math.exp(v.x)+Math.exp(-v.x))/2,insight:'Built from exponentials, cosh x ≥ 1 with a minimum of 1 at x = 0, and it grows without bound — never repeating, unlike cos.',predict:{q:'The smallest value cosh x takes is…',opts:['1','0','−1'],a:0}},
  {id:'fm_sinh',name:'Hyperbolic sine',form:'sinh x = (eˣ − e⁻ˣ)⁄2',unit:'',vars:[{s:'x',label:'x',min:-3,max:3,step:0.1,val:1,unit:''}],calc:v=>(Math.exp(v.x)-Math.exp(-v.x))/2,insight:'An odd function passing through the origin, increasing for all x. With cosh it satisfies cosh²x − sinh²x = 1.',predict:{q:'sinh(0) equals…',opts:['0','1','−1'],a:0}},
  {id:'fm_maclaurin',name:'Maclaurin partial sum for eˣ',form:'1 + x + x²⁄2! + x³⁄3!',unit:'',vars:[{s:'x',label:'x',min:-2,max:2,step:0.1,val:1,unit:''}],calc:v=>1+v.x+v.x*v.x/2+v.x*v.x*v.x/6,insight:'The first four terms of the series for eˣ. Compare with the true eˣ: near x = 0 the match is excellent, drifting as |x| grows. More terms widen the good region.',predict:{q:'The approximation is most accurate when x is…',opts:['near 0','large positive','large negative'],a:0}},
  {id:'fm_volrev',name:'Volume of revolution of y = x',form:'V = π∫₀ᵇ x² dx = πb³⁄3',unit:'',vars:[{s:'b',label:'upper limit b',min:0,max:5,step:0.1,val:2,unit:''}],calc:v=>Math.PI*Math.pow(v.b,3)/3,insight:'Rotating y = x about the x-axis produces a cone; the disc method π∫y² dx gives πb³/3, matching the cone formula ⅓πr²h.',predict:{q:'Doubling b multiplies the volume by…',opts:['8','2','4'],a:0}},
  {id:'fm_polararea',name:'Polar area of a circle r = a',form:'A = ½∫₀²π a² dθ = πa²',unit:'',vars:[{s:'a',label:'radius a',min:0,max:10,step:0.5,val:3,unit:''}],calc:v=>Math.PI*v.a*v.a,insight:'For the constant curve r = a, the polar-area formula ½∫r² dθ over a full turn recovers πa² — the ordinary circle area, as it must.',predict:{q:'The ½ and the square in ½∫r² dθ come from…',opts:['the sector-area formula','a guess','the radius being negative'],a:0}},
  {id:'fm_shm',name:'SHM displacement',form:'x = A cos(ωt)',unit:'',vars:[{s:'A',label:'amplitude A',min:0,max:10,step:0.5,val:5,unit:''},{s:'w',label:'angular frequency ω',min:0.1,max:5,step:0.1,val:2,unit:''},{s:'t',label:'time t',min:0,max:10,step:0.1,val:1,unit:''}],calc:v=>v.A*Math.cos(v.w*v.t),insight:'Simple harmonic motion oscillates between ±A. The acceleration is −ω²x (always toward equilibrium), giving the period 2π/ω.',predict:{q:'A larger ω makes the oscillation…',opts:['faster (shorter period)','slower','larger in amplitude'],a:0}},
  {id:'fm_sumdiff',name:'Telescoping sum Σ1/(r(r+1))',form:'1 − 1⁄(n+1)',unit:'',vars:[{s:'n',label:'upper limit n',min:1,max:50,step:1,val:5,unit:''}],calc:v=>1-1/(v.n+1),insight:'Method of differences: 1/(r(r+1)) = 1/r − 1/(r+1), so almost everything cancels, leaving 1 − 1/(n+1). As n → ∞ the sum approaches 1.',predict:{q:'As n grows large, this sum approaches…',opts:['1','0','infinity'],a:0}}
 ],
 CF:[
  {topic:'Complex numbers',o:'With i² = −1, (1 + i)² = 1 + 2i + i² = 2i.',f:'What if i² were +1 instead?',r:'Complex numbers would collapse — i would behave like an ordinary ±1 and the whole structure (rotations, the Argand plane, conjugate roots) would vanish. i² = −1 is what makes them new.'},
  {topic:'Matrices',o:'Applying matrix B then A is the product AB.',f:'What if you swapped to BA?',r:'You would generally get a different transformation, since AB ≠ BA. Order encodes "which transformation happens first", so swapping changes the result.'},
  {topic:'Matrices',o:'An invertible matrix can undo its transformation.',f:'What if its determinant were zero?',r:'It would be singular — squashing space onto a line or point, losing information. No inverse could recover the original, because different inputs now map to the same output.'},
  {topic:'Roots of polynomials',o:'A real cubic has the root 1 + 2i.',f:'What if its conjugate 1 − 2i were NOT also a root?',r:'Then the coefficients could not all be real — non-real roots of real polynomials must come in conjugate pairs, so the third root here must be real.'},
  {topic:'Polar coordinates',o:'The area of a polar curve is ½∫r² dθ.',f:'What if you used ∫r dθ instead?',r:'You would get the wrong answer (and wrong units) — each element is a sector of area ½r² dθ, not r dθ. The square and the half are essential.'},
  {topic:'Hyperbolic functions',o:'cosh x grows steadily and never repeats.',f:'What if it were periodic like cos x?',r:'It would have to be bounded and oscillate, but (eˣ + e⁻ˣ)/2 increases without limit. Being exponential in origin, it cannot be periodic.'},
  {topic:'Further calculus',o:'∫₁^∞ 1/x² dx converges to 1.',f:'What if the integrand were 1/x instead?',r:'∫₁^∞ 1/x dx diverges — it grows like ln x without bound. A small change in the power flips convergence to divergence.'},
  {topic:'Differential equations',o:'The general solution of y″ + y = 0 is A cos x + B sin x.',f:'What if you only wrote the complementary function for y″ + y = x?',r:'You would miss the particular integral. The full solution needs CF + PI; the PI accounts for the forcing term x on the right.'},
  {topic:'Further vectors',o:'a × b gives a vector perpendicular to both.',f:'What if a and b were parallel?',r:'The cross product would be the zero vector, since sinθ = 0. Parallel vectors span no area, so there is no perpendicular direction to point in.'},
  {topic:'Series & induction',o:'Induction proves Σr = ½n(n+1) for all n.',f:'What if you skipped the base case?',r:'The proof would be invalid — the inductive step only passes truth along; without a first true case, nothing is anchored, like dominoes that never start falling.'}
 ],
 CONTRAST:[
  {a:'Dot product',b:'Cross product',topic:'Further vectors',rows:[['Result','scalar','vector'],['Formula','|a||b|cosθ','|a||b|sinθ (direction ⊥)'],['Zero when','perpendicular','parallel'],['Use','angle / projection','normal / area']],confusion:'Both combine two vectors but give different kinds of object.',tell:'Dot = scalar (cosθ, angles). Cross = vector (sinθ, perpendicular/area).'},
  {a:'Circular (cos/sin)',b:'Hyperbolic (cosh/sinh)',topic:'Hyperbolic functions',rows:[['Built from','rotation / unit circle','eˣ / unit hyperbola'],['Identity','cos²+sin²=1','cosh²−sinh²=1'],['Periodic?','yes','no'],['Range of cos/cosh','[−1, 1]','[1, ∞)']],confusion:'The names and identities look parallel, but signs and behaviour differ.',tell:'cos/sin: circle, periodic, plus identity. cosh/sinh: hyperbola, non-periodic, minus identity.'},
  {a:'Vector line',b:'Plane',topic:'Further vectors',rows:[['Equation','r = a + λd','r·n = d'],['Defined by','point + 1 direction','point + normal (or 2 directions)'],['Dimension','1D','2D'],['Parameters','one (λ)','two (or a normal)']],confusion:'Both are linear objects in 3D with similar-looking vector equations.',tell:'Line: a + λd (one direction). Plane: r·n = d (a normal).'},
  {a:'Real roots',b:'Complex roots',topic:'Roots of polynomials',rows:[['On the graph','x-axis crossings','none visible'],['Occur','singly or repeated','in conjugate pairs (real coeffs)'],['Discriminant (quadratic)','≥ 0','< 0'],['Argand plane','on the real axis','off the axis, mirrored']],confusion:'Complex roots are invisible on the usual graph, so they get forgotten.',tell:'Real roots cross the x-axis; complex roots come in conjugate pairs (real coefficients).'},
  {a:'Singular matrix',b:'Invertible matrix',topic:'Matrices',rows:[['Determinant','zero','non-zero'],['Inverse','none','exists'],['Effect on space','collapses (loses dimension)','preserves dimension'],['AX = B','no unique solution','unique X = A⁻¹B']],confusion:'Whether a system has a unique solution hinges on this distinction.',tell:'det = 0 → singular (no inverse). det ≠ 0 → invertible (unique solutions).'},
  {a:'Complementary function',b:'Particular integral',topic:'Differential equations',rows:[['Solves','homogeneous part (= 0)','the forcing term f(x)'],['Contains','arbitrary constants','no new constants'],['From','auxiliary equation roots','a trial form like f(x)'],['Role','natural behaviour','forced response']],confusion:'Students stop at the CF and forget the PI for non-zero right-hand sides.',tell:'General solution = CF (homogeneous) + PI (handles f(x)).'},
  {a:'Modulus–argument form',b:'Cartesian form',topic:'Complex numbers',rows:[['Written','r(cosθ + isinθ)','a + bi'],['Best for','multiplying, powers, roots','adding and subtracting'],['Key data','modulus r, argument θ','real a, imaginary b'],['de Moivre','natural','awkward']],confusion:'Each form suits different operations; using the wrong one is laborious.',tell:'Add/subtract in Cartesian; multiply, power and root in modulus–argument form.'},
  {a:'Maclaurin series',b:'Taylor series',topic:'Series & induction',rows:[['Expanded about','x = 0','a general point x = a'],['Terms use','derivatives at 0','derivatives at a'],['Special case','—','Maclaurin is Taylor at a = 0'],['Use','standard functions near 0','approximating near any a']],confusion:'Maclaurin is just the special case of Taylor centred at zero.',tell:'Maclaurin = Taylor about 0. Taylor works about any point a.'}
 ],
 MODELS:[
  {c:'Complex numbers & the Argand plane',topic:'Complex numbers',model:'Complex numbers extend the reals with i² = −1 and live as points in the Argand plane. Cartesian form suits addition; modulus–argument form (with de Moivre) suits multiplication, powers and roots.',wrong:['i² = 1.','|a + bi| = a.','Complex roots appear singly.'],predict:['Multiplying multiplies moduli, adds arguments.','de Moivre: (cosθ+isinθ)ⁿ = cos nθ + i sin nθ.','Real coefficients ⇒ conjugate-pair roots.'],bound:['Check the quadrant for the argument.','nth roots are equally spaced on a circle.'],ex:['Solving zⁿ = w.','Loci in the Argand plane.']},
  {c:'Matrices as transformations',topic:'Matrices',model:'A matrix maps vectors to vectors; multiplying matrices composes transformations (order matters). The determinant is the area/volume scale factor and decides invertibility.',wrong:['AB = BA.','Every matrix has an inverse.','(AB)⁻¹ = A⁻¹B⁻¹.'],predict:['det ≠ 0 ⇔ invertible.','(AB)⁻¹ = B⁻¹A⁻¹.','Solve AX = B with X = A⁻¹B.'],bound:['det(AB) = det A·det B, but det(A+B) doesn\'t split.','Dimensions must match to multiply.'],ex:['Geometric transformations.','Simultaneous equations.']},
  {c:'Roots of polynomials',topic:'Roots of polynomials',model:'A polynomial\'s coefficients encode symmetric functions of its roots (Vieta\'s formulas): sums, products and more, without solving. Real coefficients force complex roots into conjugate pairs.',wrong:['Complex roots appear singly.','You must solve to find root sums.'],predict:['Sum of roots = −b/a; product relates to the constant.','Form new equations by substitution.','Conjugate pairs for real coefficients.'],bound:['Vieta\'s needs the leading coefficient.','Watch signs carefully.'],ex:['Finding root sums/products.','Equations with related roots.']},
  {c:'Series & induction',topic:'Series & induction',model:'Standard summation results, the method of differences (telescoping) and Maclaurin expansions handle series; proof by induction rigorously establishes results for all positive integers.',wrong:['Maclaurin series work for all x.','Checking cases proves a statement.'],predict:['Telescoping cancels middle terms.','Maclaurin matches value and derivatives at 0.','Induction = base case + inductive step.'],bound:['Series have a range of validity.','Induction needs both parts.'],ex:['Summing series.','Proving divisibility and sum formulas.']},
  {c:'Further calculus',topic:'Further calculus',model:'Extends integration to volumes of revolution (π∫y² dx), improper integrals (via limits), mean values and arc length, often using hyperbolic or trigonometric substitutions.',wrong:['Volume uses ∫y dx.','Improper integrals always diverge.'],predict:['Disc method: V = π∫y² dx.','Evaluate improper integrals as limits.','Use x = sinh u for √(x²+1).'],bound:['Check convergence of improper integrals.','Mind the axis of rotation.'],ex:['Volumes of solids.','Integrals to infinity.']},
  {c:'Vectors, lines & planes',topic:'Further vectors',model:'In 3D, the dot product finds angles and tests perpendicularity; the cross product gives normals and areas. Lines are r = a + λd and planes r·n = d, enabling intersection and distance problems.',wrong:['Cross product is a scalar.','A line and a plane have the same equation.'],predict:['a·b = 0 ⇒ perpendicular.','a × b ⊥ both, magnitude = parallelogram area.','Plane: r·n = a·n.'],bound:['Parallel vectors give zero cross product.','Choose dot vs cross by what you need.'],ex:['Angles and distances in 3D.','Intersection of lines and planes.']},
  {c:'Polar coordinates',topic:'Polar coordinates',model:'Describe points by distance r and angle θ. Curves with rotational symmetry are simpler in polar form, and enclosed area is ½∫r² dθ. Negative r is allowed, plotted in the opposite direction.',wrong:['Polar area is ∫r dθ.','r must be positive.'],predict:['Area = ½∫r² dθ over the tracing range.','r = a is a circle; r = a(1+cosθ) a cardioid.','Convert with x = r cosθ, y = r sinθ.'],bound:['Identify the correct θ-range.','Watch where r = 0.'],ex:['Areas of roses and cardioids.','Spiral curves.']},
  {c:'Differential equations & SHM',topic:'Differential equations',model:'First-order equations are solved by separation or integrating factors; linear second-order equations by complementary function plus particular integral. Simple harmonic motion (a = −ω²x) is the key oscillatory model.',wrong:['Second-order ODEs need only the CF.','a = −ω²x means decay.'],predict:['General solution = CF + PI.','SHM gives sinusoidal motion, period 2π/ω.','Auxiliary equation roots set the CF form.'],bound:['Use boundary/initial conditions for constants.','Match the PI trial to the forcing term.'],ex:['Modelling oscillations and growth.','Damped and forced systems.']}
 ],
 SPEC:[
  {id:'fmp1',n:1,paper:'Core Pure',title:'Complex numbers',pts:['Arithmetic, conjugates and the Argand diagram','Modulus–argument form and loci','de Moivre\'s theorem and nth roots'],study:[['Misconception fixes','misconceptions'],['Concept contrasts','contrast'],['Equation explorer','explorer']]},
  {id:'fmp2',n:2,paper:'Core Pure',title:'Matrices',pts:['Arithmetic, determinants and inverses (2×2 and 3×3)','Matrices as linear transformations','Solving systems of equations'],study:[['Misconception fixes','misconceptions'],['Mental models','models'],['Equation explorer','explorer']]},
  {id:'fmp3',n:3,paper:'Core Pure',title:'Further algebra & functions',pts:['Roots of polynomials (Vieta\'s formulas)','Series: method of differences and Maclaurin','Proof by induction'],study:[['Trigger trainer','trigger'],['Mental models','models'],['Concept contrasts','contrast']]},
  {id:'fmp4',n:4,paper:'Core Pure',title:'Further calculus',pts:['Improper integrals and the mean value','Volumes of revolution','Further integration techniques'],study:[['Equation explorer','explorer'],['Misconception fixes','misconceptions']]},
  {id:'fmp5',n:5,paper:'Core Pure',title:'Further vectors',pts:['Vector equations of lines and planes','The scalar and vector products','Distances and angles in 3D'],study:[['Concept contrasts','contrast'],['Mental models','models'],['Trigger trainer','trigger']]},
  {id:'fmp6',n:6,paper:'Core Pure',title:'Polar coordinates',pts:['Polar curves and conversions','Area enclosed by a polar curve','Tangents at the pole'],study:[['Misconception fixes','misconceptions'],['Equation explorer','explorer']]},
  {id:'fmp7',n:7,paper:'Core Pure',title:'Hyperbolic functions',pts:['Definitions and identities (Osborn\'s rule)','Inverse hyperbolic functions','Calculus of hyperbolic functions'],study:[['Concept contrasts','contrast'],['Equation explorer','explorer'],['Misconception fixes','misconceptions']]},
  {id:'fmp8',n:8,paper:'Core Pure',title:'Differential equations',pts:['First-order: separation and integrating factor','Second-order: complementary function + particular integral','Simple harmonic motion and modelling'],study:[['Trigger trainer','trigger'],['Mental models','models'],['Equation explorer','explorer']]},
  {id:'fmo1',n:9,paper:'Options',title:'Further Mechanics (option)',pts:['Momentum, impulse and collisions','Work, energy and power','Circular motion and elastic strings'],study:[['Mental models','models'],['Concept contrasts','contrast']]},
  {id:'fmo2',n:10,paper:'Options',title:'Further Statistics (option)',pts:['Discrete and continuous distributions','Chi-squared and goodness of fit','Further hypothesis testing'],study:[['Concept contrasts','contrast'],['Mental models','models']]},
  {id:'fmo3',n:11,paper:'Options',title:'Decision Maths (option)',pts:['Graphs, networks and algorithms','Critical path and linear programming','Shortest path and matchings'],study:[['Mental models','models'],['Concept contrasts','contrast']]}
 ],
 AQA_SPEC:[
  {id:'fmaq1',n:1,pap:0,title:'Complex numbers',pts:['Argand diagrams and modulus–argument form','de Moivre and roots','Loci'],study:[['Misconception fixes','misconceptions'],['Equation explorer','explorer']]},
  {id:'fmaq2',n:2,pap:0,title:'Matrices',pts:['Determinants, inverses and transformations','Solving linear systems'],study:[['Mental models','models'],['Misconception fixes','misconceptions']]},
  {id:'fmaq3',n:3,pap:0,title:'Further algebra & functions',pts:['Roots of polynomials','Series and Maclaurin','Proof by induction'],study:[['Trigger trainer','trigger'],['Mental models','models']]},
  {id:'fmaq4',n:4,pap:0,title:'Further calculus',pts:['Volumes of revolution and improper integrals','Further integration'],study:[['Equation explorer','explorer']]},
  {id:'fmaq5',n:5,pap:0,title:'Further vectors',pts:['Lines, planes, scalar and vector products'],study:[['Concept contrasts','contrast'],['Mental models','models']]},
  {id:'fmaq6',n:6,pap:0,title:'Polar coordinates',pts:['Polar curves and areas'],study:[['Equation explorer','explorer']]},
  {id:'fmaq7',n:7,pap:0,title:'Hyperbolic functions',pts:['Definitions, identities and calculus'],study:[['Concept contrasts','contrast'],['Misconception fixes','misconceptions']]},
  {id:'fmaq8',n:8,pap:0,title:'Differential equations',pts:['First- and second-order equations','SHM and modelling'],study:[['Trigger trainer','trigger'],['Mental models','models']]},
  {id:'fmaq9',n:9,pap:1,title:'Options',pts:['Further Mechanics, Further Statistics or Discrete Maths'],study:[['Mental models','models']]}
 ],
 CPRAC:[],
 AQA_PRAC:[]
};

/* ====================================================================
   Register A-Level Maths and Further Maths as subjects
   ==================================================================== */
[['alevelmaths',ALMATHS],['furthermaths',FMATHS]].forEach(function(pair){
  var id=pair[0], S=pair[1];
  if(!S.NODES) S.NODES=[];
  if(!S.CPRAC) S.CPRAC=[];
  if(!S.AQA_PRAC) S.AQA_PRAC=[];
  (S.QUIZ||[]).forEach(function(q){ if(q._mt!=null){ var i=S.MIS.findIndex(function(m){return m.t===q._mt;}); q.mi=(i<0?0:i); } });
  SUBJECTS[id]=S;
});

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
  try{const bb=document.querySelector('.brand b'); if(bb&&typeof SUBJECTS!=='undefined'&&SUBJECTS[CURSUBJ]) bb.textContent=SUBJECTS[CURSUBJ].name;}catch(e){}
  const bar=acc?`<button class="acctbar" onclick="go('account')">
    <span class="acctav">${esc((acc.name||'?').slice(0,1).toUpperCase())}</span>
    <span class="acctmeta"><span class="acctname">${esc(acc.name)}</span><span class="acctrole">${acc.role==='teacher'?'Teacher':esc(acc.board||'Student')}</span></span>
    <span class="acctcaret">⌄</span></button>`:'';
  let subjBar='';
  try{ if(typeof SUBJECTS!=='undefined') subjBar='<div class="subjbar">'+Object.keys(SUBJECTS).map(id=>`<button class="subjbtn ${id===CURSUBJ?'on':''}" onclick="switchSubject('${id}')">${SUBJECTS[id].name}</button>`).join('')+'</div>'; }catch(e){}
  const tools=(typeof CURTOOLS!=='undefined')?CURTOOLS:null;
  const TOGGLE=new Set(['trigger','miscquiz','explorer','counterfactual','sandbox','misconceptions','contrast','models','analogies','conceptmap','spec','alevel','resources','transfer','lens']);
  let items=NAV.filter(x=>!(x.teacherOnly&&(!acc||acc.role!=='teacher'))&&!(x.grp==='Teacher'&&(!acc||acc.role!=='teacher'))&&!(x.id&&tools&&TOGGLE.has(x.id)&&tools.indexOf(x.id)<0));
  items=items.filter((x,i)=>!(x.grp&&(i===items.length-1||items[i+1].grp)));
  document.getElementById('nav').innerHTML=subjBar+bar+items.map(x=>x.grp
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
