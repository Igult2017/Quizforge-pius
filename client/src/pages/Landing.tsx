import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Footer } from "@/components/Footer";
import { BookOpen, Timer, Brain } from "lucide-react";

/* ─── BREAKPOINT HOOK ─── */
function useWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

const QUESTIONS = [
  { section:"Reading", sectionColor:"#2563eb", sectionBg:"#eff6ff",
    q:"A nursing student reads: 'Hypertension, often called the silent killer, affects nearly 1 in 3 adults. Regular blood pressure monitoring is essential because symptoms rarely appear until the condition has caused serious damage.' What is the main idea?",
    opts:["Blood pressure monitors are expensive medical devices","Hypertension is dangerous partly because it shows no warning signs","Adults over 40 should visit their doctor annually","Nurses must specialize in cardiovascular care"],
    ans:1, rationale:"The passage emphasizes that hypertension is dangerous because it has no symptoms ('silent killer') until serious damage occurs — making monitoring essential." },
  { section:"Reading", sectionColor:"#2563eb", sectionBg:"#eff6ff",
    q:"Based on context clues, what does 'benign' most likely mean in: 'The biopsy results showed a benign tumor, so no further treatment was needed.'",
    opts:["Malignant and spreading","Not harmful or cancerous","Requiring immediate surgery","Rare and unusual"],
    ans:1, rationale:"The context clue 'no further treatment was needed' signals a positive outcome, indicating benign means not harmful or cancerous." },
  { section:"Math", sectionColor:"#7c3aed", sectionBg:"#f5f3ff",
    q:"A nurse needs to administer 250 mg of medication. It is available as 125 mg/5 mL. How many mL should the nurse give?",
    opts:["5 mL","10 mL","12.5 mL","15 mL"],
    ans:1, rationale:"Using the proportion: 125mg/5mL = 250mg/x. Cross-multiply: 125x = 1250, so x = 10 mL." },
  { section:"Math", sectionColor:"#7c3aed", sectionBg:"#f5f3ff",
    q:"A patient's IV is set to deliver fluids at 60 mL/hour. How many mL will the patient receive in 8 hours?",
    opts:["360 mL","420 mL","480 mL","540 mL"],
    ans:2, rationale:"Multiply rate x time: 60 mL/hr x 8 hrs = 480 mL." },
  { section:"Math", sectionColor:"#7c3aed", sectionBg:"#f5f3ff",
    q:"Convert 0.75 to a percentage.",
    opts:["0.75%","7.5%","75%","750%"],
    ans:2, rationale:"To convert a decimal to a percentage, multiply by 100. 0.75 x 100 = 75%." },
  { section:"Science", sectionColor:"#047857", sectionBg:"#f0fdf4",
    q:"Which chamber of the heart pumps oxygenated blood to the rest of the body?",
    opts:["Right atrium","Right ventricle","Left atrium","Left ventricle"],
    ans:3, rationale:"The left ventricle pumps oxygen-rich blood into the aorta and out to the systemic circulation. The right ventricle sends deoxygenated blood to the lungs." },
  { section:"Science", sectionColor:"#047857", sectionBg:"#f0fdf4",
    q:"Which of the following is NOT a function of the lymphatic system?",
    opts:["Transporting excess interstitial fluid back to the bloodstream","Producing red blood cells","Fighting infections through lymphocytes","Absorbing dietary fats from the digestive tract"],
    ans:1, rationale:"Red blood cells are produced in the red bone marrow, not the lymphatic system. The lymphatic system handles fluid return, immune defense, and fat absorption." },
  { section:"Science", sectionColor:"#047857", sectionBg:"#f0fdf4",
    q:"During which phase of mitosis do chromosomes line up along the cell's equator?",
    opts:["Prophase","Metaphase","Anaphase","Telophase"],
    ans:1, rationale:"During metaphase, chromosomes align along the metaphase plate (equator). This ensures each daughter cell receives one copy of each chromosome." },
  { section:"English", sectionColor:"#b45309", sectionBg:"#fffbeb",
    q:"Which sentence uses correct subject-verb agreement?",
    opts:["The group of nurses are preparing for rounds.","Neither the doctor nor the nurses was available.","The data shows a clear pattern in patient outcomes.","Each of the students have submitted their assignments."],
    ans:2, rationale:"'The data shows' is correct — 'data' is treated as a singular collective noun in medical/scientific writing." },
  { section:"English", sectionColor:"#b45309", sectionBg:"#fffbeb",
    q:"Identify the correctly punctuated sentence:",
    opts:["The patient, was discharged after three days.","After surgery the patient felt much better.","The nurse administered the medication, and documented it immediately.","Before the procedure, the nurse reviewed the patient's allergies."],
    ans:3, rationale:"'Before the procedure, the nurse reviewed the patient's allergies.' correctly uses a comma after an introductory phrase." },
];

const CheckIcon = ({ color="#22c55e", size=20 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ flexShrink:0 }}>
    <circle cx="10" cy="10" r="9" fill={color}/>
    <path d="M6 10l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const XIcon = ({ size=20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ flexShrink:0 }}>
    <circle cx="10" cy="10" r="9" fill="#ef4444"/>
    <path d="M7 7l6 6M13 7l-6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

/* ─── HERO VISUAL CARDS ─── */
function HeroVisuals({ isMobile }: { isMobile: boolean }) {
  const [animated, setAnimated] = useState(false);
  const [scoreVal, setScoreVal] = useState(0);
  const [bars, setBars] = useState([0,0,0]);

  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (!animated) return;
    let frame: number;
    const start = performance.now();
    const run = (now: number) => { const p=Math.min((now-start)/1600,1); const e=1-Math.pow(1-p,3); setScoreVal(Math.round(e*75)); if(p<1) frame=requestAnimationFrame(run); };
    frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }, [animated]);
  useEffect(() => {
    if (!animated) return;
    const targets=[44,68,88]; let frame: number;
    const start = performance.now();
    const run = (now: number) => { const p=Math.min((now-start)/900,1); const e=1-Math.pow(1-p,3); setBars(targets.map(t=>Math.round(e*t))); if(p<1) frame=requestAnimationFrame(run); };
    const tid = setTimeout(() => { frame=requestAnimationFrame(run); }, 400);
    return () => { cancelAnimationFrame(frame); clearTimeout(tid); };
  }, [animated]);

  const circ = 2*Math.PI*35;
  const dash = circ-(scoreVal/100)*circ;
  const card: React.CSSProperties = { background:"rgba(255,255,255,0.12)", backdropFilter:"blur(12px)", border:"1.5px solid rgba(255,255,255,0.25)", borderRadius:16, transition:"opacity 0.5s ease, transform 0.5s ease" };

  if (isMobile) return (
    <div style={{ display:"flex", gap:10, width:"100%", overflowX:"auto", paddingBottom:4 }}>
      <div style={{ ...card, padding:"14px 12px", display:"flex", flexDirection:"column", alignItems:"center", gap:6, opacity:animated?1:0, transform:animated?"translateY(0)":"translateY(10px)", minWidth:110, flex:1 }}>
        <span style={{ fontSize:10, color:"rgba(255,255,255,0.7)", fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>Progress</span>
        <svg width="72" height="72" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r="35" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8"/>
          <circle cx="55" cy="55" r="35" fill="none" stroke="#fbbf24" strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dash} transform="rotate(-90 55 55)" style={{ transition:"stroke-dashoffset 0.05s" }}/>
          <text x="55" y="50" textAnchor="middle" fontSize="20" fontWeight="800" fill="white" fontFamily="Montserrat,sans-serif">{scoreVal}%</text>
          <text x="55" y="66" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.6)" fontFamily="Montserrat,sans-serif">Score</text>
        </svg>
        <span style={{ fontSize:10, color:"#86efac", fontWeight:800 }}>+22pts this week</span>
      </div>
      <div style={{ ...card, padding:"14px 12px", display:"flex", flexDirection:"column", gap:8, flex:2, opacity:animated?1:0, transform:animated?"translateY(0)":"translateY(10px)", transitionDelay:"0.15s", minWidth:140 }}>
        <span style={{ background:"rgba(255,255,255,0.2)", color:"white", fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:20, textTransform:"uppercase", alignSelf:"flex-start" }}>Science</span>
        <p style={{ fontSize:11, fontWeight:600, color:"white", lineHeight:1.4, margin:0 }}>Which chamber pumps oxygenated blood to the body?</p>
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 8px", borderRadius:8, border:"1.5px solid rgba(239,68,68,0.6)", background:"rgba(239,68,68,0.15)" }}>
            <div style={{ width:14,height:14,borderRadius:"50%",background:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}><svg width="8" height="8" viewBox="0 0 10 10"><path d="M2 2l6 6M8 2L2 8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg></div>
            <span style={{ fontSize:10, color:"#fca5a5", fontWeight:600 }}>Right ventricle</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 8px", borderRadius:8, border:"1.5px solid rgba(34,197,94,0.7)", background:"rgba(34,197,94,0.15)" }}>
            <div style={{ width:14,height:14,borderRadius:"50%",background:"#22c55e",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}><svg width="8" height="8" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg></div>
            <span style={{ fontSize:10, color:"#86efac", fontWeight:700 }}>Left ventricle</span>
          </div>
        </div>
      </div>
      <div style={{ ...card, padding:"14px 12px", display:"flex", flexDirection:"column", gap:6, flex:1.5, opacity:animated?1:0, transform:animated?"translateY(0)":"translateY(10px)", transitionDelay:"0.3s", minWidth:120 }}>
        <div style={{ display:"flex", gap:1 }}>{"*****".split("").map((_s,i)=><span key={i} style={{ color:"#fbbf24", fontSize:11 }}>&#9733;</span>)}</div>
        <p style={{ fontSize:10, color:"rgba(255,255,255,0.85)", fontStyle:"italic", lineHeight:1.45, margin:0 }}>"Passed first try — questions felt exactly like the real exam!"</p>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:"auto" }}>
          <div style={{ width:24,height:24,borderRadius:"50%",background:"#fbbf24",display:"flex",alignItems:"center",justifyContent:"center",color:"#1e293b",fontWeight:900,fontSize:10,flexShrink:0 }}>A</div>
          <div><p style={{ fontSize:10,fontWeight:800,color:"white",margin:0 }}>Aisha R.</p><p style={{ fontSize:9,color:"#86efac",fontWeight:700,margin:0 }}>ATI TEAS</p></div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gridTemplateRows:"auto auto", gap:14, flex:1 }}>
      <div style={{ ...card, gridRow:"1/3", padding:"20px 18px", display:"flex", flexDirection:"column", gap:12, opacity:animated?1:0, transform:animated?"translateY(0)":"translateY(12px)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ background:"rgba(255,255,255,0.2)", color:"white", fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:20, letterSpacing:0.8, textTransform:"uppercase" }}>Science Q6</span>
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.65)", fontWeight:600 }}>6/50</span>
        </div>
        <p style={{ fontSize:13, fontWeight:600, color:"white", lineHeight:1.55, margin:0 }}>Which chamber pumps oxygenated blood to the body?</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8, flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:10, border:"1.5px solid rgba(239,68,68,0.6)", background:"rgba(239,68,68,0.15)" }}>
            <div style={{ width:18,height:18,borderRadius:"50%",background:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}><svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 2l6 6M8 2L2 8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg></div>
            <span style={{ fontSize:12, color:"#fca5a5", fontWeight:600 }}>Right ventricle</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:10, border:"1.5px solid rgba(34,197,94,0.7)", background:"rgba(34,197,94,0.15)" }}>
            <div style={{ width:18,height:18,borderRadius:"50%",background:"#22c55e",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}><svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg></div>
            <span style={{ fontSize:12, color:"#86efac", fontWeight:700 }}>Left ventricle</span>
          </div>
          {["Left atrium","Right atrium"].map(opt=>(
            <div key={opt} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:10, border:"1.5px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.06)" }}>
              <div style={{ width:18,height:18,borderRadius:"50%",border:"1.5px solid rgba(255,255,255,0.3)",flexShrink:0 }}/>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>{opt}</span>
            </div>
          ))}
        </div>
        <div style={{ background:"rgba(34,197,94,0.15)", borderLeft:"3px solid #22c55e", borderRadius:"0 8px 8px 0", padding:"10px 12px" }}>
          <p style={{ fontSize:11, color:"#86efac", fontWeight:600, margin:0, lineHeight:1.5 }}>The left ventricle sends oxygen-rich blood into the aorta and out to the body.</p>
        </div>
      </div>
      <div style={{ ...card, padding:"16px 14px", display:"flex", flexDirection:"column", alignItems:"center", gap:8, opacity:animated?1:0, transform:animated?"translateY(0)":"translateY(12px)", transitionDelay:"0.2s" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, alignSelf:"flex-start" }}>
          <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 6px #22c55e" }}/>
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:600 }}>Your progress</span>
        </div>
        <svg width="100" height="100" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r="35" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8"/>
          <circle cx="55" cy="55" r="35" fill="none" stroke="#fbbf24" strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dash} transform="rotate(-90 55 55)" style={{ transition:"stroke-dashoffset 0.05s" }}/>
          <text x="55" y="49" textAnchor="middle" fontSize="20" fontWeight="800" fill="white" fontFamily="Montserrat,sans-serif">{scoreVal}%</text>
          <text x="55" y="65" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.6)" fontFamily="Montserrat,sans-serif">Score</text>
        </svg>
        <svg width="80" height="72" viewBox="0 0 80 72">
          <text x="40" y="69" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.5)" fontFamily="Montserrat,sans-serif">Wk 1 2 3</text>
          <rect x="4" y={72-bars[0]-14} width="18" height={bars[0]} rx="4" fill="rgba(255,255,255,0.25)"/>
          <rect x="31" y={72-bars[1]-14} width="18" height={bars[1]} rx="4" fill="rgba(251,191,36,0.6)"/>
          <rect x="58" y={72-bars[2]-14} width="18" height={bars[2]} rx="4" fill="#fbbf24"/>
        </svg>
        <p style={{ fontSize:11, color:"#86efac", fontWeight:800, margin:0 }}>+22pts this week</p>
      </div>
      <div style={{ ...card, padding:"16px", display:"flex", flexDirection:"column", gap:10, opacity:animated?1:0, transform:animated?"translateY(0)":"translateY(12px)", transitionDelay:"0.4s" }}>
        <div style={{ display:"flex", gap:2 }}>{[1,2,3,4,5].map(i=><span key={i} style={{ color:"#fbbf24", fontSize:13 }}>&#9733;</span>)}</div>
        <p style={{ fontSize:12, color:"rgba(255,255,255,0.85)", fontStyle:"italic", lineHeight:1.55, margin:0 }}>"The questions felt exactly like the real exam. I passed first try!"</p>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:"auto" }}>
          <div style={{ width:34,height:34,borderRadius:"50%",background:"#fbbf24",display:"flex",alignItems:"center",justifyContent:"center",color:"#1e293b",fontWeight:900,fontSize:13,flexShrink:0 }}>A</div>
          <div><p style={{ fontSize:12,fontWeight:800,color:"white",margin:0 }}>Aisha R.</p><p style={{ fontSize:11,color:"#86efac",fontWeight:700,margin:0 }}>ATI TEAS — First attempt</p></div>
        </div>
      </div>
    </div>
  );
}

/* ─── SAMPLE TEST ─── */
function SampleTest({ onGetAccess }: { onGetAccess: () => void }) {
  const [answers, setAnswers] = useState<(number|null)[]>(new Array(10).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const w = useWidth();
  const isMobile = w < 640;

  const answered = answers.filter(a=>a!==null).length;
  const correctCount = submitted ? answers.filter((a,i)=>a===QUESTIONS[i].ans).length : 0;
  const pct = submitted ? Math.round((correctCount/10)*100) : 0;
  const scoreColor = pct>=70?"#16a34a":pct>=50?"#d97706":"#dc2626";
  const scoreMsg = pct>=70?"Great score! You're on the right track.":pct>=50?"Good effort — targeted practice will lift your score significantly.":"Don't worry — this is exactly why practice matters!";
  const sections = ["Reading","Math","Science","English"];
  const secScores = sections.map(s=>{ const qs=QUESTIONS.filter(q=>q.section===s); const c=qs.filter(q=>answers[QUESTIONS.indexOf(q)]===q.ans).length; return { s,c,total:qs.length }; });

  const pick=(qi: number,oi: number)=>{ if(submitted)return; const n=[...answers]; n[qi]=oi; setAnswers(n); };
  const submit=()=>{ if(answered<10)return; setSubmitted(true); setTimeout(()=>document.getElementById("quiz-results")?.scrollIntoView({behavior:"smooth",block:"start"}),100); };

  const px = isMobile ? "16px" : "40px";

  if (!showTest) return (
    <section style={{ background:"#fffbeb", padding:isMobile?"48px 20px":"60px 40px", textAlign:"center", borderTop:"3px dashed #f59e0b" }}>
      <div style={{ maxWidth:600, margin:"0 auto" }}>
        <span style={{ fontSize:40 }}>🎁</span>
        <h2 style={{ fontWeight:900, fontSize:"clamp(20px,2.5vw,32px)", color:"#111827", marginTop:12, marginBottom:12 }}>FREE Sample Test — 10 Questions</h2>
        <p style={{ fontSize:15, color:"#374151", fontWeight:500, lineHeight:1.7, marginBottom:24 }}>Try before you buy — real exam-level questions covering Reading, Math, Science and English.</p>
        <button onClick={()=>setShowTest(true)} style={{ background:"#d97706", color:"white", border:"none", padding:"16px 36px", borderRadius:12, fontSize:16, fontWeight:800, cursor:"pointer", width:isMobile?"100%":"auto" }}>
          Start the Free Sample Test
        </button>
      </div>
    </section>
  );

  return (
    <section style={{ background:"#f8fafc", padding:`40px ${px}` }}>
      <div style={{ maxWidth:760, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <span style={{ fontSize:36 }}>📝</span>
          <h2 style={{ fontWeight:900, fontSize:"clamp(20px,2.5vw,32px)", color:"#111827", marginTop:10, marginBottom:8 }}>Free Sample Test</h2>
          <p style={{ fontSize:14, color:"#6b7280", fontWeight:500 }}>10 questions · Reading, Math, Science, English</p>
        </div>
        {!submitted && (
          <div style={{ marginBottom:28 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:8 }}>
              <span>{answered} of 10 answered</span><span>{10-answered} remaining</span>
            </div>
            <div style={{ height:8, background:"#e2e8f0", borderRadius:99, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${(answered/10)*100}%`, background:"#2563eb", borderRadius:99, transition:"width .3s" }}/>
            </div>
            <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
              {answers.map((a,i)=><div key={i} style={{ width:12,height:12,borderRadius:"50%",background:a!==null?"#2563eb":"#e2e8f0",border:`1.5px solid ${a!==null?"#2563eb":"#cbd5e1"}`,transition:"background .2s" }}/>)}
            </div>
          </div>
        )}
        {QUESTIONS.map((q,qi)=>(
          <div key={qi} style={{ background:"white", border:"1.5px solid #e2e8f0", borderRadius:16, padding:isMobile?"18px 16px":"24px 28px", marginBottom:16, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, flexWrap:"wrap" }}>
              <span style={{ display:"inline-block", background:q.sectionBg, color:q.sectionColor, border:`1px solid ${q.sectionColor}33`, borderRadius:20, padding:"3px 12px", fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:0.8 }}>{q.section}</span>
              <span style={{ fontSize:12, color:"#9ca3af", fontWeight:600 }}>Question {qi+1} of 10</span>
            </div>
            <p style={{ fontSize:isMobile?14:15, color:"#1e293b", fontWeight:600, lineHeight:1.65, marginBottom:16 }}>{q.q}</p>
            {q.opts.map((opt,oi)=>{
              const isSel=answers[qi]===oi, isCorr=submitted&&oi===q.ans, isWrong=submitted&&isSel&&oi!==q.ans;
              let bg="white",border="#e2e8f0",tc="#374151";
              if(isCorr){bg="#f0fdf4";border="#22c55e";tc="#15803d";}
              else if(isWrong){bg="#fef2f2";border="#ef4444";tc="#991b1b";}
              else if(isSel&&!submitted){bg="#eff6ff";border="#2563eb";tc="#1d4ed8";}
              return (
                <div key={oi} onClick={()=>pick(qi,oi)} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:isMobile?"10px 12px":"12px 16px", borderRadius:10, border:`1.5px solid ${border}`, background:bg, marginBottom:10, cursor:submitted?"default":"pointer", transition:"all .15s" }}>
                  {submitted?(isCorr?<CheckIcon color="#22c55e"/>:isWrong?<XIcon/>:<div style={{ width:20,height:20,borderRadius:"50%",border:"1.5px solid #d1d5db",flexShrink:0 }}/>):(
                    <div style={{ width:20,height:20,borderRadius:"50%",flexShrink:0,marginTop:1,border:`2px solid ${isSel?"#2563eb":"#d1d5db"}`,background:isSel?"#2563eb":"white",display:"flex",alignItems:"center",justifyContent:"center" }}>
                      {isSel&&<div style={{ width:7,height:7,borderRadius:"50%",background:"white" }}/>}
                    </div>
                  )}
                  <span style={{ fontSize:isMobile?13:14, color:tc, fontWeight:isCorr||isWrong?700:500, lineHeight:1.55 }}>{opt}{isCorr&&submitted&&" ✓"}</span>
                </div>
              );
            })}
            {submitted&&(
              <div style={{ marginTop:14, padding:"14px 18px", borderRadius:10, background:answers[qi]===q.ans?"#f0fdf4":"#fef2f2", borderLeft:`4px solid ${answers[qi]===q.ans?"#22c55e":"#ef4444"}` }}>
                <p style={{ fontSize:13, color:answers[qi]===q.ans?"#15803d":"#991b1b", fontWeight:600, lineHeight:1.6 }}>
                  <strong>{answers[qi]===q.ans?"Correct! ":"Incorrect. "}</strong>{q.rationale}
                </p>
              </div>
            )}
          </div>
        ))}
        {!submitted&&(
          <div style={{ textAlign:"center", marginTop:12 }}>
            {answered<10&&<p style={{ fontSize:13, color:"#9ca3af", fontWeight:600, marginBottom:14 }}>Answer all 10 questions to submit</p>}
            <button onClick={submit} disabled={answered<10} style={{ background:answered<10?"#93c5fd":"#2563eb", color:"white", border:"none", padding:"16px 48px", borderRadius:12, fontSize:16, fontWeight:800, cursor:answered<10?"not-allowed":"pointer", width:isMobile?"100%":"auto" }}>
              Submit My Answers
            </button>
          </div>
        )}
        {submitted&&(
          <div id="quiz-results" style={{ background:"white", border:"2px solid #e2e8f0", borderRadius:20, padding:isMobile?"28px 20px":"40px 36px", marginTop:24, textAlign:"center", boxShadow:"0 8px 32px rgba(0,0,0,0.08)" }}>
            <div style={{ width:110, height:110, borderRadius:"50%", border:`5px solid ${scoreColor}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
              <span style={{ fontSize:30, fontWeight:900, color:scoreColor, lineHeight:1 }}>{correctCount}/10</span>
              <span style={{ fontSize:13, color:"#6b7280", fontWeight:600 }}>{pct}%</span>
            </div>
            <h3 style={{ fontWeight:900, fontSize:22, color:"#111827", marginBottom:8 }}>Your Results</h3>
            <p style={{ fontSize:isMobile?14:15, color:"#374151", fontWeight:600, marginBottom:28, lineHeight:1.6 }}>{scoreMsg}</p>
            <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)", gap:12, marginBottom:28 }}>
              {secScores.map(({s,c,total})=>{ const sp=Math.round((c/total)*100), sc2=sp===100?"#16a34a":sp>=50?"#d97706":"#dc2626"; return (
                <div key={s} style={{ background:"#f8fafc", borderRadius:12, padding:"16px 10px", border:"1px solid #e2e8f0" }}>
                  <p style={{ fontWeight:900, fontSize:22, color:sc2, marginBottom:4 }}>{c}/{total}</p>
                  <p style={{ fontSize:12, color:"#6b7280", fontWeight:700 }}>{s}</p>
                </div>
              );} )}
            </div>
            <div style={{ background:"#eff6ff", border:"2px solid #bfdbfe", borderRadius:14, padding:"20px 24px", marginBottom:24 }}>
              <p style={{ fontSize:isMobile?14:15, color:"#1d4ed8", fontWeight:800, marginBottom:4 }}>Ready for the full 1,000+ question bank?</p>
              <p style={{ fontSize:13, color:"#3b82f6", fontWeight:500 }}>The full NurseBrace plan covers every topic in detail — with the same quality rationales you just experienced.</p>
            </div>
            <button onClick={onGetAccess} style={{ background:"#2563eb", color:"white", border:"none", padding:"16px 40px", borderRadius:12, fontSize:16, fontWeight:800, cursor:"pointer", marginBottom:12, width:isMobile?"100%":"auto" }}>
              Get Full Access — Instant
            </button>
            <br/>
            <button onClick={()=>{ setAnswers(new Array(10).fill(null)); setSubmitted(false); }} style={{ background:"none", border:"none", color:"#6b7280", fontSize:13, cursor:"pointer", fontWeight:600, marginTop:8 }}>
              Retake the test
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── SAMPLE QUESTIONS PAGE ─── */
function SampleQuestionsPage({ isMobile, px, onHome, onPricing }: { isMobile: boolean; px: string; onHome: () => void; onPricing: () => void }) {
  const [answers, setAnswers] = useState<Record<number,number>>({});
  const [revealed, setRevealed] = useState<Record<number,boolean>>({});
  const [filter, setFilter] = useState("All");

  const sections = ["All","Reading","Math","Science","English"];
  const visible = filter === "All" ? QUESTIONS : QUESTIONS.filter(q=>q.section===filter);

  const pick = (qi: number, oi: number) => { if (revealed[qi]) return; setAnswers(p=>({...p,[qi]:oi})); };
  const reveal = (qi: number) => { if (answers[qi] === undefined) return; setRevealed(p=>({...p,[qi]:true})); };
  const revealAll = () => {
    const newR: Record<number,boolean> = {};
    visible.forEach((_,i)=>{ const gi = QUESTIONS.indexOf(visible[i]); if(answers[gi]!==undefined) newR[gi]=true; });
    setRevealed(p=>({...p,...newR}));
  };

  const totalAnswered = Object.keys(answers).length;
  const totalCorrect = Object.entries(answers).filter(([qi,oi])=>QUESTIONS[+qi].ans===oi).length;

  const sectionColors: Record<string,string> = { Reading:"#2563eb", Math:"#7c3aed", Science:"#047857", English:"#b45309" };
  const sectionBgs: Record<string,string>   = { Reading:"#eff6ff", Math:"#f5f3ff", Science:"#f0fdf4", English:"#fffbeb" };

  return (
    <div style={{ background:"#f8fafc", minHeight:"100vh" }}>
      <div style={{ background:"linear-gradient(135deg,#1d4ed8,#2563eb)", padding:isMobile?`40px ${px}`:`56px ${px}`, textAlign:"center", color:"white" }}>
        <div style={{ maxWidth:760, margin:"0 auto" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:700, letterSpacing:0.8, textTransform:"uppercase", marginBottom:16 }}>
            📝 Free Practice
          </div>
          <h1 style={{ fontWeight:900, fontSize:`clamp(24px,${isMobile?"5vw":"3vw"},42px)`, lineHeight:1.15, marginBottom:14 }}>
            Sample Exam Questions
          </h1>
          <p style={{ fontSize:isMobile?14:16, opacity:0.9, lineHeight:1.7, fontWeight:500, maxWidth:560, margin:"0 auto 28px" }}>
            10 real exam-level questions across all four sections — Reading, Math, Science, and English. Select an answer, then reveal the rationale.
          </p>
          {totalAnswered > 0 && (
            <div style={{ display:"inline-flex", gap:20, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:40, padding:"10px 24px", fontSize:14, fontWeight:700 }}>
              <span>{totalAnswered} answered</span>
              <span style={{ opacity:0.4 }}>|</span>
              <span style={{ color:"#86efac" }}>{totalCorrect} correct</span>
              <span style={{ opacity:0.4 }}>|</span>
              <span style={{ color:"#fbbf24" }}>{totalAnswered>0?Math.round((totalCorrect/totalAnswered)*100):0}%</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ background:"white", borderBottom:"1.5px solid #e2e8f0", padding:`0 ${px}`, position:"sticky", top:64, zIndex:50 }}>
        <div style={{ maxWidth:900, margin:"0 auto", display:"flex", gap:4, overflowX:"auto", padding:"12px 0" }}>
          {sections.map(s=>(
            <button key={s} onClick={()=>setFilter(s)} style={{
              padding:"7px 18px", borderRadius:20, border:"1.5px solid", cursor:"pointer", fontSize:13, fontWeight:700, whiteSpace:"nowrap", transition:"all .15s",
              background: filter===s ? (s==="All"?"#1e293b":sectionBgs[s]||"#1e293b") : "white",
              color: filter===s ? (s==="All"?"white":sectionColors[s]||"white") : "#6b7280",
              borderColor: filter===s ? (s==="All"?"#1e293b":sectionColors[s]||"#1e293b") : "#e2e8f0",
            }}>
              {s === "All" ? "All Questions" : s}
            </button>
          ))}
          <button onClick={revealAll} style={{ marginLeft:"auto", padding:"7px 18px", borderRadius:20, border:"1.5px solid #e2e8f0", cursor:"pointer", fontSize:13, fontWeight:700, background:"white", color:"#6b7280", whiteSpace:"nowrap", flexShrink:0 }}>
            Reveal All
          </button>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding:`32px ${px}` }}>
        {visible.map((q, vi) => {
          const qi = QUESTIONS.indexOf(q);
          const isSel = answers[qi] !== undefined;
          const isRev = revealed[qi];
          const sel = answers[qi];
          return (
            <div key={qi} style={{ background:"white", border:"1.5px solid #e2e8f0", borderRadius:20, padding:isMobile?"20px 16px":"28px 32px", marginBottom:20, boxShadow:"0 2px 12px rgba(0,0,0,0.04)", transition:"box-shadow .2s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, flexWrap:"wrap" }}>
                <span style={{ background:sectionBgs[q.section]||"#f0f0f0", color:sectionColors[q.section]||"#333", border:`1px solid ${sectionColors[q.section]||"#ccc"}33`, borderRadius:20, padding:"3px 14px", fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:0.8 }}>
                  {q.section}
                </span>
                <span style={{ fontSize:12, color:"#9ca3af", fontWeight:600 }}>Question {vi+1}{filter!=="All"?` of ${visible.length}`:` of ${QUESTIONS.length}`}</span>
                {isRev && (
                  <span style={{ marginLeft:"auto", fontSize:12, fontWeight:800, color: sel===q.ans?"#15803d":"#991b1b", background:sel===q.ans?"#f0fdf4":"#fef2f2", padding:"3px 12px", borderRadius:20 }}>
                    {sel===q.ans?"✓ Correct":"✗ Incorrect"}
                  </span>
                )}
              </div>

              <p style={{ fontSize:isMobile?14:15, color:"#1e293b", fontWeight:600, lineHeight:1.7, marginBottom:18 }}>{q.q}</p>

              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
                {q.opts.map((opt, oi) => {
                  const isSelected = sel === oi;
                  const isCorrect = isRev && oi === q.ans;
                  const isWrong = isRev && isSelected && oi !== q.ans;
                  let bg="white", border="#e2e8f0", tc="#374151";
                  if (isCorrect){bg="#f0fdf4";border="#22c55e";tc="#15803d";}
                  else if (isWrong){bg="#fef2f2";border="#ef4444";tc="#991b1b";}
                  else if (isSelected&&!isRev){bg="#eff6ff";border="#2563eb";tc="#1d4ed8";}
                  return (
                    <div key={oi} onClick={()=>pick(qi,oi)} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:isMobile?"11px 14px":"13px 18px", borderRadius:12, border:`1.5px solid ${border}`, background:bg, cursor:isRev?"default":"pointer", transition:"all .15s" }}>
                      {isRev ? (
                        isCorrect ? <CheckIcon color="#22c55e"/> : isWrong ? <XIcon/> : <div style={{ width:20,height:20,borderRadius:"50%",border:"1.5px solid #d1d5db",flexShrink:0 }}/>
                      ) : (
                        <div style={{ width:20,height:20,borderRadius:"50%",flexShrink:0,marginTop:1,border:`2px solid ${isSelected?"#2563eb":"#d1d5db"}`,background:isSelected?"#2563eb":"white",display:"flex",alignItems:"center",justifyContent:"center" }}>
                          {isSelected&&<div style={{ width:7,height:7,borderRadius:"50%",background:"white" }}/>}
                        </div>
                      )}
                      <span style={{ fontSize:isMobile?13:14, color:tc, fontWeight:isCorrect||isWrong?700:500, lineHeight:1.55 }}>
                        {opt}{isCorrect&&isRev&&" ✓"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {!isRev ? (
                <button onClick={()=>reveal(qi)} disabled={!isSel} style={{ padding:"10px 22px", borderRadius:10, border:"1.5px solid", cursor:isSel?"pointer":"not-allowed", fontSize:13, fontWeight:700, transition:"all .15s",
                  background:isSel?"#2563eb":"white", color:isSel?"white":"#9ca3af", borderColor:isSel?"#2563eb":"#e2e8f0" }}>
                  {isSel ? "Reveal Answer & Rationale" : "Select an answer first"}
                </button>
              ) : (
                <div style={{ padding:"14px 18px", borderRadius:12, background:sel===q.ans?"#f0fdf4":"#fef2f2", borderLeft:`4px solid ${sel===q.ans?"#22c55e":"#ef4444"}` }}>
                  <p style={{ fontSize:13, color:sel===q.ans?"#15803d":"#991b1b", fontWeight:600, lineHeight:1.65, margin:0 }}>
                    <strong>{sel===q.ans?"✅ Correct! ":"❌ Incorrect. "}</strong>{q.rationale}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        <div style={{ background:"linear-gradient(135deg,#1d4ed8,#2563eb)", borderRadius:20, padding:isMobile?"32px 24px":"40px 48px", textAlign:"center", color:"white", marginTop:12 }}>
          <h3 style={{ fontWeight:900, fontSize:isMobile?22:28, marginBottom:12 }}>Ready for 1,000+ More Questions?</h3>
          <p style={{ fontSize:isMobile?14:15, opacity:0.9, lineHeight:1.7, marginBottom:28, maxWidth:500, margin:"0 auto 28px" }}>
            These 10 questions are just a taste. The full NurseBrace question bank covers every topic tested on TEAS and HESI — with the same detailed rationales.
          </p>
          <div style={{ display:"flex", flexDirection:isMobile?"column":"row", gap:12, justifyContent:"center" }}>
            <button onClick={onPricing} style={{ background:"#fbbf24", color:"#1e293b", border:"none", padding:"15px 32px", borderRadius:12, fontSize:15, fontWeight:800, cursor:"pointer" }}>
              👉 See Pricing Plans
            </button>
            <button onClick={onHome} style={{ background:"rgba(255,255,255,0.12)", color:"white", border:"2px solid rgba(255,255,255,0.4)", padding:"15px 32px", borderRadius:12, fontSize:15, fontWeight:800, cursor:"pointer" }}>
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function NurseBrace() {
  const [, navigate] = useLocation();
  const [timeLeft, setTimeLeft] = useState({ h:1,m:47,s:33 });
  const [showExit, setShowExit] = useState(false);
  const [exitDismissed, setExitDismissed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState("home");
  const w = useWidth();
  const isMobile = w < 768;
  const isTablet = w >= 768 && w < 1024;
  const isNarrow = w < 480;

  useEffect(()=>{ const t=setInterval(()=>setTimeLeft(p=>{let{h,m,s}=p;s--;if(s<0){s=59;m--;}if(m<0){m=59;h--;}if(h<0){h=1;m=59;s=59;}return{h,m,s};}),1000);return()=>clearInterval(t); },[]);
  useEffect(()=>{ if(exitDismissed||isMobile)return; const fn=(e: MouseEvent)=>{if(e.clientY<10)setShowExit(true);}; document.addEventListener("mouseleave",fn);return()=>document.removeEventListener("mouseleave",fn); },[exitDismissed,isMobile]);

  const pad=(n: number)=>String(n).padStart(2,"0");
  const px = isMobile?"16px":isTablet?"28px":"40px";
  const spy = isMobile?"56px":"80px";

  const goSignup = () => navigate("/signup");
  const goLogin = () => navigate("/login");
  const goMonthly = () => navigate("/checkout?plan=monthly");
  const goWeekly = () => navigate("/checkout?plan=weekly");
  const goExams = () => navigate("/exams");

  const scrollToSampleTest = () => document.getElementById("sample-test-top")?.scrollIntoView({behavior:"smooth"});
  const scrollToPricing = () => {
    setPage("home");
    setTimeout(()=>document.getElementById("pricing")?.scrollIntoView({behavior:"smooth"}),80);
  };

  return (
    <div style={{ fontFamily:"'Montserrat',sans-serif", margin:0, padding:0, color:"#1a1a2e", background:"white", paddingBottom:isMobile?88:70 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;font-family:'Montserrat',sans-serif;}
        .nl{color:#333;text-decoration:none;font-size:14px;font-weight:600;transition:color .2s;} .nl:hover{color:#2563eb;}
        .bno{background:transparent;color:#2563eb;border:2px solid #2563eb;padding:9px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;} .bno:hover{background:#eff6ff;}
        .bn{background:#2563eb;color:white;border:none;padding:9px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;} .bn:hover{background:#1d4ed8;transform:translateY(-1px);}
        .hbw{display:inline-block;border-radius:50px;padding:5px;border:2px dashed rgba(255,255,255,0.65);}
        .hbp{background:#2563eb;color:white;border:2px solid rgba(255,255,255,0.3);padding:13px 24px;border-radius:50px;font-size:14px;font-weight:800;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:8px;} .hbp:hover{background:#1d4ed8;transform:translateY(-2px);}
        .hbo{background:white;color:#1d4ed8;border:2px solid rgba(255,255,255,0.3);padding:13px 24px;border-radius:50px;font-size:14px;font-weight:800;cursor:pointer;transition:all .2s;} .hbo:hover{background:#f0f4ff;transform:translateY(-2px);}
        .cta{background:#2563eb;color:white;border:none;padding:17px 36px;border-radius:12px;font-size:16px;font-weight:800;cursor:pointer;transition:all .2s;display:inline-block;} .cta:hover{background:#1d4ed8;transform:translateY(-3px);box-shadow:0 12px 32px rgba(37,99,235,0.4);}
        .ctag{background:#16a34a;color:white;border:none;padding:17px 36px;border-radius:12px;font-size:16px;font-weight:800;cursor:pointer;transition:all .2s;display:inline-block;} .ctag:hover{background:#15803d;transform:translateY(-3px);}
        .pi{display:flex;align-items:center;gap:16px;padding:20px 22px;background:white;border-radius:14px;border:1px solid #e5e7eb;box-shadow:0 2px 10px rgba(0,0,0,0.05);margin-bottom:14px;}
        .si{display:flex;align-items:center;gap:16px;padding:20px 22px;background:white;border-radius:14px;border:1px solid #e5e7eb;box-shadow:0 2px 10px rgba(0,0,0,0.05);margin-bottom:14px;}
        .wi{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid #f1f5f9;font-size:15px;font-weight:600;color:#1e293b;}
        .db{display:flex;align-items:flex-start;gap:12px;padding:14px 18px;background:#fef2f2;border-radius:10px;margin-bottom:10px;font-size:14px;color:#7f1d1d;font-weight:600;}
        .dg{display:flex;align-items:flex-start;gap:12px;padding:14px 18px;background:#f0fdf4;border-radius:10px;margin-bottom:10px;font-size:14px;color:#14532d;font-weight:600;}
        .tc{background:white;border-radius:16px;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,0.08);border:1px solid #e2e8f0;flex:1;min-width:260px;transition:transform .2s;} .tc:hover{transform:translateY(-4px);}
        .pc{background:white;border-radius:20px;padding:36px 28px;box-shadow:0 2px 16px rgba(0,0,0,0.08);border:2px solid #e5e7eb;flex:1;transition:transform .2s;} .pc:hover{transform:translateY(-4px);}
        .pc.pop{border-color:#2563eb;box-shadow:0 8px 40px rgba(37,99,235,0.18);}
        .sb{width:100%;background:#2563eb;color:white;border:none;padding:14px;border-radius:10px;font-size:14px;font-weight:800;cursor:pointer;margin-top:20px;} .sb:hover{background:#1d4ed8;}
        .sbo{width:100%;background:transparent;color:#2563eb;border:2px solid #2563eb;padding:14px;border-radius:10px;font-size:14px;font-weight:800;cursor:pointer;margin-top:20px;} .sbo:hover{background:#eff6ff;}
        .ci{display:flex;align-items:center;gap:10px;margin-bottom:12px;font-size:14px;color:#374151;font-weight:500;}
        .fl{color:#2563eb;text-decoration:none;font-size:13px;display:block;margin-bottom:10px;font-weight:500;} .fl:hover{color:#1d4ed8;text-decoration:underline;}
        .sbar{position:fixed;bottom:0;left:0;right:0;background:#1d4ed8;color:white;display:flex;align-items:center;justify-content:center;gap:20px;padding:13px 24px;z-index:999;box-shadow:0 -4px 20px rgba(0,0,0,0.2);}
        .mmenu{position:fixed;inset:0;background:white;z-index:200;display:flex;flex-direction:column;padding:88px 28px 40px;gap:0;}
        .mml{color:#1e293b;text-decoration:none;font-size:20px;font-weight:800;padding:18px 0;border-bottom:1px solid #f1f5f9;display:block;}
        @media(max-width:768px){
          .tc{min-width:100%;}
          .pc{max-width:100%!important;min-width:100%!important;}
          .wi{font-size:14px;}
          .sbar{gap:10px;padding:10px 16px;}
          .db,.dg{font-size:13px;padding:12px 14px;}
          .cta,.ctag{padding:14px 28px;font-size:14px;}
          .hbp,.hbo{font-size:13px;padding:11px 18px;}
        }
        @media(max-width:480px){
          .hbw{display:block;width:100%;}
          .hbp,.hbo{width:100%;justify-content:center;text-align:center;display:flex;}
          .cta,.ctag{width:100%;text-align:center;display:block;}
        }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:`0 ${px}`, height:64, background:"white", borderBottom:"3px solid #2563eb", position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        <span style={{ fontWeight:900, fontSize:isMobile?18:22, color:"#2563eb", letterSpacing:"-0.5px", cursor:"pointer" }} onClick={()=>{setPage("home");window.scrollTo({top:0,behavior:"smooth"});}}>NurseBrace</span>
        {!isMobile ? (
          <>
            <div style={{ display:"flex", gap:32, alignItems:"center" }}>
              <a href="#" className="nl" onClick={e=>{e.preventDefault();goExams();}}>Exams</a>
              <a href="#pricing" className="nl" onClick={e=>{e.preventDefault();scrollToPricing();}}>Pricing</a>
              <a href="#" className="nl" onClick={e=>{e.preventDefault();setPage("questions");window.scrollTo({top:0,behavior:"smooth"});}}>Sample Questions</a>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button className="bno" onClick={goLogin}>Sign In</button>
              <button className="bn" onClick={goSignup}>Get Started</button>
            </div>
          </>
        ) : (
          <button onClick={()=>setMenuOpen(!menuOpen)} style={{ background:"none", border:"none", cursor:"pointer", padding:8, display:"flex", flexDirection:"column", gap:5 }}>
            {menuOpen
              ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round"/></svg>
              : <><span style={{ display:"block",width:24,height:2.5,background:"#2563eb",borderRadius:2 }}/><span style={{ display:"block",width:24,height:2.5,background:"#2563eb",borderRadius:2 }}/><span style={{ display:"block",width:18,height:2.5,background:"#2563eb",borderRadius:2 }}/></>
            }
          </button>
        )}
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && isMobile && (
        <div className="mmenu">
          <button onClick={()=>setMenuOpen(false)} style={{ position:"absolute",top:16,right:16,background:"none",border:"none",cursor:"pointer",padding:8 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round"/></svg>
          </button>
          <span style={{ fontWeight:900, fontSize:22, color:"#2563eb", marginBottom:16 }}>NurseBrace</span>
          {["Exams","Pricing","Sample Questions"].map(l=>(
            <a key={l} href="#" className="mml" onClick={e=>{
              e.preventDefault();
              setMenuOpen(false);
              if(l==="Sample Questions"){setPage("questions");window.scrollTo({top:0,behavior:"smooth"});}
              else if(l==="Exams"){goExams();}
              else if(l==="Pricing"){scrollToPricing();}
            }}>{l}</a>
          ))}
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginTop:28 }}>
            <button className="bno" style={{ padding:"14px",fontSize:15 }} onClick={goLogin}>Sign In</button>
            <button className="bn" style={{ padding:"14px",fontSize:15 }} onClick={goSignup}>Get Started</button>
          </div>
        </div>
      )}

      {page === "questions" ? (
        <SampleQuestionsPage
          isMobile={isMobile}
          px={px}
          onHome={()=>{setPage("home");window.scrollTo({top:0,behavior:"smooth"});}}
          onPricing={scrollToPricing}
        />
      ) : <>

      {/* HERO */}
      <section style={{ background:"linear-gradient(135deg,#1d4ed8 0%,#2563eb 60%,#3b82f6 100%)", padding:isMobile?`48px ${px}`:`64px ${px}`, display:"flex", alignItems:"center" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", width:"100%", display:"flex", flexDirection:isMobile?"column":"row", alignItems:isMobile?"flex-start":"center", gap:isMobile?32:60 }}>
          <div style={{ flex:"0 0 52%", color:"white", width:"100%" }}>
            <div style={{ display:"inline-block", background:"rgba(255,255,255,0.18)", border:"1px solid rgba(255,255,255,0.35)", borderRadius:20, padding:"6px 16px", fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:20, textTransform:"uppercase" }}>
              For Students Testing in the Next 2-4 Weeks
            </div>
            <h1 style={{ fontWeight:900, fontSize:`clamp(22px,${isMobile?"5.5vw":"3.5vw"},46px)`, lineHeight:1.15, marginBottom:18 }}>
              Pass Your TEAS/HESI/NCLEX Exam on Your First Try —{" "}
              <span style={{ color:"#fbbf24" }}>Without Wasting Time on the Wrong Materials</span>
            </h1>
            <p style={{ fontSize:isMobile?14:15, lineHeight:1.75, opacity:0.93, marginBottom:28, maxWidth:480, fontWeight:500 }}>
              Get access to high-yield, exam-level practice questions with detailed rationales — designed for students testing in the next 2-4 weeks.
            </p>
            <div style={{ display:"flex", flexDirection:isNarrow?"column":"row", gap:12, flexWrap:"wrap", marginBottom:28, alignItems:isNarrow?"stretch":"center" }}>
              <div className="hbw"><button className="hbp" onClick={goSignup}>Start Practicing Now</button></div>
              <div className="hbw"><button className="hbo" onClick={scrollToSampleTest}>Try a Free Sample Test</button></div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {["No credit card required","Cancel anytime","30-question free trial"].map(t=>(
                <div key={t} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"rgba(255,255,255,0.9)", fontWeight:600 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex:1, width:"100%", minWidth:0 }}>
            <HeroVisuals isMobile={isMobile}/>
          </div>
        </div>
      </section>

      {/* PAIN POINT */}
      <section style={{ background:"#fff7f7", padding:`${spy} ${px}` }}>
        <div style={{ maxWidth:780, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <span style={{ fontSize:36 }}>😬</span>
            <h2 style={{ fontWeight:900, fontSize:"clamp(20px,3vw,36px)", color:"#111827", marginTop:12 }}>Tired of Studying and Still Not Passing?</h2>
          </div>
          {[
            { label:"The Study Trap", labelColor:"#e11d48", icon:"😤", iconBg:"#fff1f2", text:"You've been reading and watching videos — but questions still feel unfamiliar on exam day." },
            { label:"Running Out of Time", labelColor:"#d97706", icon:"⏰", iconBg:"#fffbeb", text:"Your test is coming fast — and the pressure keeps mounting with every passing day." },
            { label:"Fear of Failing Again", labelColor:"#2563eb", icon:"🚫", iconBg:"#eff6ff", text:"You may have failed before — and you absolutely cannot go through that again." },
          ].map((item,i)=>(
            <div key={i} className="pi">
              <div style={{ flexShrink:0, width:52, height:52, borderRadius:12, background:item.iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>{item.icon}</div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:11, fontWeight:800, letterSpacing:"0.08em", textTransform:"uppercase", color:item.labelColor, marginBottom:4 }}>{item.label}</p>
                <p style={{ fontSize:isMobile?14:15, color:"#374151", fontWeight:500, lineHeight:1.6, margin:0 }}>{item.text}</p>
              </div>
              <span style={{ flexShrink:0, color:"#d1d5db", fontSize:18, fontWeight:300 }}>›</span>
            </div>
          ))}
          <div style={{ background:"#1e293b", color:"white", borderRadius:14, padding:isMobile?"20px 20px":"24px 28px", marginTop:28, textAlign:"center" }}>
            <p style={{ fontSize:isMobile?14:17, fontWeight:800, lineHeight:1.65 }}>Most students fail because they <span style={{ color:"#fbbf24" }}>study the wrong way.</span><br/><span style={{ fontWeight:500, fontSize:13, opacity:0.8 }}>Not because they're not smart enough.</span></p>
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section style={{ background:"#f0fdf4", padding:`${spy} ${px}` }}>
        <div style={{ maxWidth:780, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <span style={{ fontSize:36 }}>💡</span>
            <h2 style={{ fontWeight:900, fontSize:"clamp(20px,3vw,36px)", color:"#111827", marginTop:12 }}>This Is What Actually Works</h2>
          </div>
          {[
            { icon:<BookOpen size={22} color="#16a34a"/>, text:"Focus on high-yield topics that repeatedly appear on real exams" },
            { icon:<Timer size={22} color="#16a34a"/>, text:"Match the exact difficulty and style of real TEAS/HESI questions" },
            { icon:<Brain size={22} color="#16a34a"/>, text:"Train you to think the way the exam wants you to think" },
          ].map((item,i)=>(
            <div key={i} className="si">
              <div style={{ flexShrink:0, width:52, height:52, borderRadius:12, background:"#f0fdf4", border:"1px solid #bbf7d0", display:"flex", alignItems:"center", justifyContent:"center" }}>{item.icon}</div>
              <p style={{ fontSize:isMobile?14:15, color:"#1e293b", fontWeight:500, lineHeight:1.6, margin:0 }}>{item.text}</p>
            </div>
          ))}
          <div style={{ background:"#2563eb", color:"white", borderRadius:14, padding:"22px 28px", marginTop:28, textAlign:"center" }}>
            <p style={{ fontSize:isMobile?14:17, fontWeight:800 }}>So when you sit for your test… <span style={{ color:"#fbbf24" }}>nothing feels new.</span></p>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section style={{ background:"white", padding:`${spy} ${px}` }}>
        <div style={{ maxWidth:780, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <span style={{ fontSize:36 }}>📊</span>
            <h2 style={{ fontWeight:900, fontSize:"clamp(20px,3vw,36px)", color:"#111827", marginTop:12 }}>What You'll Get Inside</h2>
          </div>
          <div style={{ background:"#f8fafc", borderRadius:20, padding:isMobile?"20px 16px":"32px 36px", border:"2px solid #e2e8f0" }}>
            {["1,000+ exam-level practice questions","Detailed rationales — not just answers, but WHY","Coverage of ALL key sections: Reading, Math, Science, A&P","Real exam patterns and commonly tested topics","Instant access — start practicing in minutes"].map((item,i)=>(
              <div key={i} className="wi"><CheckIcon color="#22c55e"/><span>{item}</span></div>
            ))}
          </div>
          <div style={{ textAlign:"center", marginTop:36 }}>
            <button className="cta" onClick={goSignup}>Start Practicing Now — Instant Access</button>
          </div>
        </div>
      </section>

      {/* DIFFERENTIATION */}
      <section style={{ background:"#f8fafc", padding:`${spy} ${px}` }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <span style={{ fontSize:36 }}>🧠</span>
            <h2 style={{ fontWeight:900, fontSize:"clamp(20px,3vw,36px)", color:"#111827", marginTop:12 }}>Why This Works Better Than Free Practice Tests</h2>
          </div>
          <div style={{ display:"flex", flexDirection:isMobile?"column":"row", gap:24 }}>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:800, fontSize:14, color:"#ef4444", marginBottom:14, textTransform:"uppercase", letterSpacing:0.5 }}>Free Tests</p>
              {["Too easy or completely outdated","Don't reflect real exam difficulty","No proper explanations — just answer keys","Waste your precious study time"].map((t,i)=>(
                <div key={i} className="db"><XIcon/><span>{t}</span></div>
              ))}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:800, fontSize:14, color:"#22c55e", marginBottom:14, textTransform:"uppercase", letterSpacing:0.5 }}>NurseBrace</p>
              {["Focuses only on what's actually tested","Questions match real exam difficulty","Deep rationales so you understand — not memorize","Built for students testing THIS month"].map((t,i)=>(
                <div key={i} className="dg"><CheckIcon color="#22c55e"/><span>{t}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section style={{ background:"white", padding:`${spy} ${px}` }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <span style={{ fontSize:36 }}>🏆</span>
            <h2 style={{ fontWeight:900, fontSize:"clamp(20px,3vw,36px)", color:"#111827", marginTop:12 }}>Real Students. Real Results.</h2>
            <div style={{ display:"flex", justifyContent:"center", gap:3, marginTop:10, alignItems:"center", flexWrap:"wrap" }}>
              {[1,2,3,4,5].map(i=><span key={i} style={{ color:"#f59e0b", fontSize:22 }}>&#9733;</span>)}
              <span style={{ color:"#6b7280", fontSize:14, fontWeight:600, marginLeft:8 }}>4.9/5 — 10,000+ Students</span>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:isMobile?"column":"row", gap:24, flexWrap:isMobile?"nowrap":"wrap" }}>
            {[
              { quote:"I failed my first attempt… used NurseBrace and passed on my second try! The questions were so much like the real thing.", name:"Maria T.", tag:"TEAS — Second attempt" },
              { quote:"The questions were VERY similar to my actual exam. I felt prepared in a way I never had before. Worth every penny.", name:"James K.", tag:"HESI A2 — First attempt" },
              { quote:"The rationales helped me understand topics I always struggled with. This is NOT like the free stuff you find online.", name:"Aisha R.", tag:"ATI TEAS — First attempt" },
            ].map((t,i)=>(
              <div key={i} className="tc">
                <div style={{ display:"flex", gap:2, marginBottom:14 }}>{[1,2,3,4,5].map(j=><span key={j} style={{ color:"#f59e0b", fontSize:18 }}>&#9733;</span>)}</div>
                <p style={{ fontSize:14, color:"#374151", lineHeight:1.75, fontStyle:"italic", fontWeight:500, marginBottom:18 }}>"{t.quote}"</p>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:40,height:40,borderRadius:"50%",background:"#2563eb",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:15,flexShrink:0 }}>{t.name[0]}</div>
                  <div><p style={{ fontWeight:800,fontSize:13,color:"#111827" }}>{t.name}</p><p style={{ fontSize:12,color:"#22c55e",fontWeight:700 }}>{t.tag}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background:"#1e293b", padding:`${isMobile?"48px":"60px"} ${px}` }}>
        <div style={{ maxWidth:1000, margin:"0 auto", display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)", gap:16 }}>
          {[{ value:"95%",label:"Pass Rate",sub:"Students improved their scores" },{ value:"10,000+",label:"Students Helped",sub:"Across the country" },{ value:"4.9/5",label:"Student Rating",sub:"Based on verified reviews" },{ value:"1,000+",label:"Practice Questions",sub:"High-yield, exam-level" }].map((s,i)=>(
            <div key={i} style={{ textAlign:"center", padding:isMobile?"18px 12px":"24px 20px", background:"rgba(255,255,255,0.06)", borderRadius:16, border:"1px solid rgba(255,255,255,0.1)" }}>
              <p style={{ fontWeight:900, fontSize:isMobile?26:34, color:"#fbbf24", marginBottom:4 }}>{s.value}</p>
              <p style={{ fontWeight:800, fontSize:13, color:"white", marginBottom:4 }}>{s.label}</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.55)", fontWeight:500 }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* URGENCY */}
      <section style={{ background:"#fff7ed", padding:`${spy} ${px}`, textAlign:"center" }}>
        <div style={{ maxWidth:680, margin:"0 auto" }}>
          <span style={{ fontSize:40 }}>⏳</span>
          <h2 style={{ fontWeight:900, fontSize:"clamp(20px,3vw,36px)", color:"#111827", marginTop:12, marginBottom:14 }}>Taking Your Exam Soon?</h2>
          <p style={{ fontSize:isMobile?14:16, color:"#374151", fontWeight:600, lineHeight:1.7, marginBottom:28 }}>
            NurseBrace is designed specifically for students testing in the <span style={{ color:"#ea580c", fontWeight:800 }}>next 2-4 weeks.</span><br/>
            Don't waste time on random materials — focus on what actually matters.
          </p>
          <div style={{ background:"#ea580c", color:"white", borderRadius:14, padding:isMobile?"18px 20px":"20px 28px", marginBottom:28, display:"inline-block" }}>
            <p style={{ fontWeight:700, fontSize:13, marginBottom:10, opacity:0.9 }}>LIMITED OFFER — ENDS IN:</p>
            <div style={{ display:"flex", gap:isMobile?10:14, justifyContent:"center" }}>
              {([["h",timeLeft.h],["m",timeLeft.m],["s",timeLeft.s]] as [string,number][]).map(([label,val])=>(
                <div key={label} style={{ textAlign:"center" }}>
                  <div style={{ background:"rgba(0,0,0,0.25)", borderRadius:8, padding:isMobile?"8px 12px":"8px 16px", fontWeight:900, fontSize:isMobile?22:28, minWidth:isMobile?44:56 }}>{pad(val)}</div>
                  <div style={{ fontSize:11, marginTop:4, opacity:0.85, fontWeight:700, textTransform:"uppercase" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          <br/>
          <p style={{ fontSize:13, color:"#9ca3af", fontWeight:600, marginBottom:24 }}>Only for students testing this month</p>
          <button className="cta" onClick={goSignup}>Start Practicing Now — Don't Wait</button>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ background:"#f8fafc", padding:`${spy} ${px}` }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <span style={{ fontSize:36 }}>💰</span>
            <h2 style={{ fontWeight:900, fontSize:"clamp(20px,3vw,36px)", color:"#111827", marginTop:12 }}>Get Instant Access Today</h2>
            <p style={{ fontSize:15, color:"#6b7280", marginTop:10, fontWeight:500 }}>One subscription gives you access to all exams. No hidden fees, no surprises.</p>
          </div>
          <div style={{ display:"flex", flexDirection:isMobile?"column":"row", gap:24, flexWrap:"wrap", justifyContent:"center" }}>
            {[
              { title:"Free Trial", price:"$0", period:"", sub:"No credit card required", feats:["30 practice questions","All question categories","Detailed explanations"], btn:"Try a Free Sample Test", outline:true, onClick:scrollToSampleTest },
              { title:"Monthly Plan", price:"$49.99", period:"/mo", sub:"Full access — cancel anytime", feats:["Unlimited practice sessions","50 questions per session","All features included","Regular content updates"], btn:"Get Instant Access Now", popular:true, onClick:goMonthly },
              { title:"Weekly Plan", price:"$19.99", period:"/wk", sub:"Perfect for last-minute prep", feats:["Unlimited practice sessions","50 questions per session","All features included"], btn:"Subscribe", outline:true, onClick:goWeekly },
            ].map((p,i)=>(
              <div key={i} className={`pc${p.popular?" pop":""}`} style={{ position:"relative", maxWidth:isMobile?"100%":320, minWidth:isMobile?"100%":240 }}>
                {p.popular&&<div style={{ position:"absolute", top:-14, left:24, background:"#2563eb", color:"white", borderRadius:20, padding:"5px 16px", fontSize:12, fontWeight:800 }}>Most Popular</div>}
                <h3 style={{ fontWeight:800, fontSize:22, color:"#111827", marginBottom:4 }}>{p.title}</h3>
                <p style={{ fontWeight:900, fontSize:32, color:"#2563eb", marginBottom:p.period?2:6 }}>{p.price}<span style={{ fontSize:15, fontWeight:600 }}>{p.period}</span></p>
                <p style={{ fontSize:13, color:"#9ca3af", marginBottom:22, fontWeight:500 }}>{p.sub}</p>
                {p.feats.map(f=><div key={f} className="ci"><CheckIcon/>{f}</div>)}
                <button className={p.outline?"sbo":"sb"} onClick={p.onClick}>{p.btn}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RISK REVERSAL */}
      <section style={{ background:"white", padding:`${spy} ${px}`, textAlign:"center" }}>
        <div style={{ maxWidth:600, margin:"0 auto" }}>
          <span style={{ fontSize:48 }}>🛡️</span>
          <h2 style={{ fontWeight:900, fontSize:"clamp(20px,3vw,36px)", color:"#111827", marginTop:16, marginBottom:16 }}>Try It Risk-Free</h2>
          <p style={{ fontSize:isMobile?14:16, color:"#374151", lineHeight:1.75, fontWeight:500, marginBottom:28 }}>
            If you don't find NurseBrace helpful, you're fully covered by our <strong>money-back guarantee.</strong><br/>No questions asked.
          </p>
          <div style={{ background:"#f0fdf4", border:"2px solid #22c55e", borderRadius:14, padding:"20px 28px", marginBottom:32 }}>
            <p style={{ fontWeight:800, fontSize:16, color:"#15803d" }}>No risk. Just results.</p>
          </div>
          <button className="ctag" onClick={goMonthly}>Get Instant Access — Risk Free</button>
        </div>
      </section>

      {/* SAMPLE TEST */}
      <div id="sample-test-top"><SampleTest onGetAccess={goMonthly}/></div>

      {/* FINAL CTA */}
      <section style={{ background:"linear-gradient(135deg,#1d4ed8,#2563eb)", padding:`${spy} ${px}`, textAlign:"center", color:"white" }}>
        <div style={{ maxWidth:660, margin:"0 auto" }}>
          <span style={{ fontSize:40 }}>🎯</span>
          <h2 style={{ fontWeight:900, fontSize:`clamp(24px,${isMobile?"6vw":"3.5vw"},44px)`, marginTop:16, marginBottom:16, lineHeight:1.2 }}>
            Your Exam Is Coming.<br/><span style={{ color:"#fbbf24" }}>Be Ready.</span>
          </h2>
          <p style={{ fontSize:isMobile?14:16, opacity:0.92, lineHeight:1.75, fontWeight:500, marginBottom:36 }}>
            Every day you wait is a missed opportunity to improve your score.<br/>
            Start practicing now and walk into your exam with full confidence.
          </p>
          <div style={{ display:"flex", flexDirection:isMobile?"column":"row", gap:16, justifyContent:"center" }}>
            <button className="cta" style={{ background:"white", color:"#1d4ed8", fontSize:16 }} onClick={goSignup}>Get Instant Access</button>
            <button className="cta" style={{ background:"rgba(255,255,255,0.12)", border:"2px solid rgba(255,255,255,0.5)", fontSize:16 }} onClick={scrollToSampleTest}>
              Try Free Sample
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />

      </> /* end home page */}

      {/* STICKY BAR */}
      <div className="sbar" style={{ flexDirection:isMobile?"column":"row", gap:isMobile?8:20, padding:isMobile?"10px 16px":"13px 24px" }}>
        <p style={{ fontWeight:600, fontSize:isMobile?12:14, textAlign:"center" }}>
          <strong>Only for students testing this month</strong> — Don't leave without starting your free trial
        </p>
        <button className="cta" style={{ padding:isMobile?"10px 20px":"11px 28px", fontSize:isMobile?13:14, whiteSpace:"nowrap", background:"#fbbf24", color:"#1e293b", flexShrink:0 }}
          onClick={scrollToSampleTest}>
          Start Now — Free
        </button>
      </div>

      {/* EXIT POPUP */}
      {showExit&&!exitDismissed&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center" }}
          onClick={()=>{ setShowExit(false); setExitDismissed(true); }}>
          <div style={{ background:"white",borderRadius:20,padding:isMobile?"32px 24px":"48px 40px",maxWidth:480,width:"90%",textAlign:"center" }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:48,marginBottom:12 }}>⏸️</div>
            <h3 style={{ fontWeight:900,fontSize:isMobile?20:24,color:"#111827",marginBottom:12 }}>Wait! Don't Leave Empty-Handed</h3>
            <p style={{ fontSize:15,color:"#6b7280",lineHeight:1.7,marginBottom:24,fontWeight:500 }}>Get a <strong>FREE sample test</strong> before you go — see the quality yourself with zero commitment.</p>
            <button className="cta" style={{ width:"100%",marginBottom:12 }}
              onClick={()=>{ setShowExit(false); setExitDismissed(true); scrollToSampleTest(); }}>
              Yes, Give Me the Free Test
            </button>
            <button onClick={()=>{ setShowExit(false); setExitDismissed(true); }} style={{ background:"none",border:"none",color:"#9ca3af",fontSize:13,cursor:"pointer",fontWeight:600 }}>
              No thanks, I don't want to prepare
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
