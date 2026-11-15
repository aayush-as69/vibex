"use client";
import {useState} from "react";
import {ShieldCheck,Link2,MessageSquareWarning,Code2,ArrowRight,Activity,LockKeyhole,Zap} from "lucide-react";

const tools=[
 {id:"url",icon:Link2,title:"Link Scanner",desc:"Inspect suspicious URLs before you open them."},
 {id:"message",icon:MessageSquareWarning,title:"Scam Message Check",desc:"Analyze SMS, WhatsApp and payment messages."},
 {id:"code",icon:Code2,title:"Code Guard",desc:"Find exposed secrets and risky patterns before deployment."}
];

function verdict(text,type){
 const t=text.toLowerCase();
 const signals=[];
 if(/bit\.ly|tinyurl|\.tk|\.xyz|\.top/.test(t))signals.push("Suspicious or commonly abused link pattern");
 if(/urgent|immediately|verify|blocked|kyc|refund|prize|winner|otp|upi|payment/.test(t))signals.push("Pressure or financial/social-engineering language");
 if(/password|api[_-]?key|secret|token|private[_-]?key/.test(t))signals.push("Credential or secret exposure");
 if(/eval\(|exec\(|child_process|shell=True|rm -rf|document\.cookie/.test(t))signals.push("Potentially dangerous code behavior");
 const score=Math.min(96,18+signals.length*24+(type==="url"&&/https?:\/\//.test(t)?8:0));
 return {score,signals,level:score>=65?"HIGH":score>=40?"MEDIUM":"LOW"};
}
export default function Home(){
 const [tool,setTool]=useState(null),[input,setInput]=useState(""),[result,setResult]=useState(null);
 const analyze=()=>{if(input.trim())setResult(verdict(input,tool))};
 return <main>
  <header className="nav"><div className="brand"><span className="mark"><ShieldCheck size={20}/></span><span>VibeX <b>Shield</b></span></div><span className="status"><i/> Protection engine online</span></header>
  <section className="hero">
   <div className="eyebrow"><ShieldCheck size={16}/> CYBER SAFETY / VIBEX CODES</div>
   <h1>Pause. Check. <span>Stay safe.</span></h1>
   <p>One simple shield for suspicious links, scam messages and risky code.</p>
   <div className="stats"><div><b>3</b><small>security checks</small></div><div><b>1</b><small>unified risk score</small></div><div><b>0</b><small>expert knowledge needed</small></div></div>
  </section>
  <section className="grid">{tools.map(t=><button className={"card "+(tool===t.id?"active":"")} onClick={()=>{setTool(t.id);setResult(null);setInput("")}} key={t.id}><div className="icon"><t.icon size={22}/></div><h2>{t.title}</h2><p>{t.desc}</p><ArrowRight size={18}/></button>)}</section>
  {tool&&<section className="workspace">
    <div className="workhead"><div><span className="eyebrow">LIVE ANALYSIS</span><h2>{tools.find(x=>x.id===tool).title}</h2></div><span className="pill"><Activity size={14}/> Instant</span></div>
    <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder={tool==="url"?"Paste a suspicious URL…":tool==="code"?"Paste a code snippet or config…":"Paste the suspicious message or payment request…"}/>
    <button className="analyze" onClick={analyze}>Analyze risk <ArrowRight size={18}/></button>
    {result&&<div className="result"><div className="score"><span>Risk score</span><b className={result.level.toLowerCase()}>{result.score}</b><strong>{result.level} RISK</strong></div><div className="signals"><h3>Signals detected</h3>{result.signals.length?result.signals.map((s,i)=><p key={i}>⚠ {s}</p>):<p>✓ No obvious high-risk pattern detected.</p>}<small>Prototype analysis is advisory. Verify important transactions through trusted channels.</small></div></div>}
  </section>}
  <footer><span>VibeX Shield · Track 3</span><span><LockKeyhole size={14}/> Built for real-world cyber safety</span></footer>
 </main>}