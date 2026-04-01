import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

/* ─── QUESTIONS DATA ─── */
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

/* ─── ICONS ─── */
const CheckIcon = ({ color = "#22c55e", size = 20 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="10" cy="10" r="9" fill={color} />
    <path d="M6 10l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const XIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="10" cy="10" r="9" fill="#ef4444" />
    <path d="M7 7l6 6M13 7l-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/* ─── WIDTH HOOK ─── */
function useWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

/* ─── PAGE ─── */
export default function SampleQuestions() {
  const [, navigate] = useLocation();
  const w = useWidth();
  const isMobile = w < 768;
  const px = isMobile ? "16px" : "40px";

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [filter, setFilter] = useState("All");

  const sections = ["All", "Reading", "Math", "Science", "English"];
  const visible = filter === "All" ? QUESTIONS : QUESTIONS.filter(q => q.section === filter);

  const pick = (qi: number, oi: number) => { if (revealed[qi]) return; setAnswers(p => ({ ...p, [qi]: oi })); };
  const reveal = (qi: number) => { if (answers[qi] === undefined) return; setRevealed(p => ({ ...p, [qi]: true })); };
  const revealAll = () => {
    const newR: Record<number, boolean> = {};
    visible.forEach((_, i) => { const gi = QUESTIONS.indexOf(visible[i]); if (answers[gi] !== undefined) newR[gi] = true; });
    setRevealed(p => ({ ...p, ...newR }));
  };

  const totalAnswered = Object.keys(answers).length;
  const totalCorrect = Object.entries(answers).filter(([qi, oi]) => QUESTIONS[+qi].ans === oi).length;

  const sectionColors: Record<string, string> = { Reading: "#2563eb", Math: "#7c3aed", Science: "#047857", English: "#b45309" };
  const sectionBgs: Record<string, string>   = { Reading: "#eff6ff", Math: "#f5f3ff", Science: "#f0fdf4", English: "#fffbeb" };

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", padding: isMobile ? `40px ${px}` : `56px ${px}`, textAlign: "center", color: "white" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 16 }}>
              📝 Free Practice
            </div>
            <h1 style={{ fontWeight: 900, fontSize: `clamp(24px,${isMobile ? "5vw" : "3vw"},42px)`, lineHeight: 1.15, marginBottom: 14 }}>
              Sample Exam Questions
            </h1>
            <p style={{ fontSize: isMobile ? 14 : 16, opacity: 0.9, lineHeight: 1.7, fontWeight: 500, maxWidth: 560, margin: "0 auto 28px" }}>
              10 real exam-level questions across all four sections — Reading, Math, Science, and English. Select an answer, then reveal the rationale.
            </p>
            {totalAnswered > 0 && (
              <div style={{ display: "inline-flex", gap: 20, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 40, padding: "10px 24px", fontSize: 14, fontWeight: 700 }}>
                <span>{totalAnswered} answered</span>
                <span style={{ opacity: 0.4 }}>|</span>
                <span style={{ color: "#86efac" }}>{totalCorrect} correct</span>
                <span style={{ opacity: 0.4 }}>|</span>
                <span style={{ color: "#fbbf24" }}>{totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Section filter bar */}
        <div style={{ background: "white", borderBottom: "1.5px solid #e2e8f0", padding: `0 ${px}`, position: "sticky", top: 64, zIndex: 50 }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 4, overflowX: "auto", padding: "12px 0" }}>
            {sections.map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{
                padding: "7px 18px", borderRadius: 20, border: "1.5px solid", cursor: "pointer", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", transition: "all .15s",
                background: filter === s ? (s === "All" ? "#1e293b" : sectionBgs[s] || "#1e293b") : "white",
                color: filter === s ? (s === "All" ? "white" : sectionColors[s] || "white") : "#6b7280",
                borderColor: filter === s ? (s === "All" ? "#1e293b" : sectionColors[s] || "#1e293b") : "#e2e8f0",
              }}>
                {s === "All" ? "All Questions" : s}
              </button>
            ))}
            <button onClick={revealAll} style={{ marginLeft: "auto", padding: "7px 18px", borderRadius: 20, border: "1.5px solid #e2e8f0", cursor: "pointer", fontSize: 13, fontWeight: 700, background: "white", color: "#6b7280", whiteSpace: "nowrap", flexShrink: 0 }}>
              Reveal All
            </button>
          </div>
        </div>

        {/* Questions */}
        <div style={{ maxWidth: 900, margin: "0 auto", padding: `32px ${px}` }}>
          {visible.map((q, vi) => {
            const qi = QUESTIONS.indexOf(q);
            const isSel = answers[qi] !== undefined;
            const isRev = revealed[qi];
            const sel = answers[qi];
            return (
              <div key={qi} style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 20, padding: isMobile ? "20px 16px" : "28px 32px", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                  <span style={{ background: sectionBgs[q.section] || "#f0f0f0", color: sectionColors[q.section] || "#333", border: `1px solid ${sectionColors[q.section] || "#ccc"}33`, borderRadius: 20, padding: "3px 14px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8 }}>
                    {q.section}
                  </span>
                  <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>
                    Question {vi + 1}{filter !== "All" ? ` of ${visible.length}` : ` of ${QUESTIONS.length}`}
                  </span>
                  {isRev && (
                    <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 800, color: sel === q.ans ? "#15803d" : "#991b1b", background: sel === q.ans ? "#f0fdf4" : "#fef2f2", padding: "3px 12px", borderRadius: 20 }}>
                      {sel === q.ans ? "✓ Correct" : "✗ Incorrect"}
                    </span>
                  )}
                </div>

                <p style={{ fontSize: isMobile ? 14 : 15, color: "#1e293b", fontWeight: 600, lineHeight: 1.7, marginBottom: 18 }}>{q.q}</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {q.opts.map((opt, oi) => {
                    const isSelected = sel === oi;
                    const isCorrect = isRev && oi === q.ans;
                    const isWrong = isRev && isSelected && oi !== q.ans;
                    let bg = "white", border = "#e2e8f0", tc = "#374151";
                    if (isCorrect) { bg = "#f0fdf4"; border = "#22c55e"; tc = "#15803d"; }
                    else if (isWrong) { bg = "#fef2f2"; border = "#ef4444"; tc = "#991b1b"; }
                    else if (isSelected && !isRev) { bg = "#eff6ff"; border = "#2563eb"; tc = "#1d4ed8"; }
                    return (
                      <div key={oi} onClick={() => pick(qi, oi)} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: isMobile ? "11px 14px" : "13px 18px", borderRadius: 12, border: `1.5px solid ${border}`, background: bg, cursor: isRev ? "default" : "pointer", transition: "all .15s" }}>
                        {isRev ? (
                          isCorrect ? <CheckIcon color="#22c55e" /> : isWrong ? <XIcon /> : <div style={{ width: 20, height: 20, borderRadius: "50%", border: "1.5px solid #d1d5db", flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1, border: `2px solid ${isSelected ? "#2563eb" : "#d1d5db"}`, background: isSelected ? "#2563eb" : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {isSelected && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "white" }} />}
                          </div>
                        )}
                        <span style={{ fontSize: isMobile ? 13 : 14, color: tc, fontWeight: isCorrect || isWrong ? 700 : 500, lineHeight: 1.55 }}>
                          {opt}{isCorrect && isRev && " ✓"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {!isRev ? (
                  <button onClick={() => reveal(qi)} disabled={!isSel} style={{ padding: "10px 22px", borderRadius: 10, border: "1.5px solid", cursor: isSel ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 700, transition: "all .15s", background: isSel ? "#2563eb" : "white", color: isSel ? "white" : "#9ca3af", borderColor: isSel ? "#2563eb" : "#e2e8f0" }}>
                    {isSel ? "Reveal Answer & Rationale" : "Select an answer first"}
                  </button>
                ) : (
                  <div style={{ padding: "14px 18px", borderRadius: 12, background: sel === q.ans ? "#f0fdf4" : "#fef2f2", borderLeft: `4px solid ${sel === q.ans ? "#22c55e" : "#ef4444"}` }}>
                    <p style={{ fontSize: 13, color: sel === q.ans ? "#15803d" : "#991b1b", fontWeight: 600, lineHeight: 1.65, margin: 0 }}>
                      <strong>{sel === q.ans ? "✅ Correct! " : "❌ Incorrect. "}</strong>{q.rationale}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* CTA */}
          <div style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", borderRadius: 20, padding: isMobile ? "32px 24px" : "40px 48px", textAlign: "center", color: "white", marginTop: 12 }}>
            <h3 style={{ fontWeight: 900, fontSize: isMobile ? 22 : 28, marginBottom: 12 }}>Ready for 1,000+ More Questions?</h3>
            <p style={{ fontSize: isMobile ? 14 : 15, opacity: 0.9, lineHeight: 1.7, marginBottom: 28, maxWidth: 500, margin: "0 auto 28px" }}>
              These 10 questions are just a taste. The full NurseBrace question bank covers every topic tested on TEAS and HESI — with the same detailed rationales.
            </p>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, justifyContent: "center" }}>
              <button onClick={() => navigate("/pricing")} style={{ background: "#fbbf24", color: "#1e293b", border: "none", padding: "15px 32px", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
                👉 See Pricing Plans
              </button>
              <button onClick={() => navigate("/")} style={{ background: "rgba(255,255,255,0.12)", color: "white", border: "2px solid rgba(255,255,255,0.4)", padding: "15px 32px", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
