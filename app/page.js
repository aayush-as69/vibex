"use client";
import {useState} from "react";
import {ShieldCheck,Link2,MessageSquareWarning,Code2,ArrowRight,Activity,LockKeyhole,CheckCircle2,AlertTriangle,RotateCcw} from "lucide-react";

const tools=[
 {id:"url",icon:Link2,title:"Link Scanner",desc:"Inspect suspicious URLs before you open them.",placeholder:"Paste a suspicious URL…",sample:"http://secure-login.xyz/verify"},
 {id:"message",icon:MessageSquareWarning,title:"Scam Message Check",desc:"Analyze SMS, WhatsApp and payment messages.",placeholder:"Paste the suspicious message or payment request…",sample:"URGENT: Your bank account is blocked. Share OTP now to receive refund."},
 {id:"code",icon:Code2,title:"Code Guard",desc:"Find exposed secrets and risky patterns before deployment.",placeholder:"Paste a code snippet or config…",sample:"const API_KEY = secret; eval(userInput);"}
];

export default function Home(){
 const [tool,setTool]=useState("message"),[input,setInput]=useState(""),[result,setResult]=useState(null),[loading,setLoading]=useState(false),[error,setError]=useState(""),[history,setHistory]=useState([]);
 const active=tools.find(x=>x.id===tool);
 const analyze=async()=>{
  if(!input.trim())return;
  setLoading(true);setError("");setResult(null);
  try{
   const res=await fetch("/api/analyze",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({type:tool,input})});
   const data=await res.json();
   if(!res.ok||!data.ok)throw new Error(data.error||"Analysis failed.");
   setResult(data.result);setHistory(h=>[{type:tool,score:data.result.score,level:data.result.level,time:new Date(),preview:input.slice(0,64)},...h].slice(0,5));
  }catch(e){setError(e.message);}finally{setLoading(false);}
 };
 const loadSample=()=>{setInput(active.sample);setResult(null);setError("");};
 return <main>
  <header className="nav">
   <div className="brand"><span className="mark"><ShieldCheck size={20}/></span><span>VibeX <b>Shield</b></span></div>
   <div className="nav-right"><span className="status"><i/> Rules engine online</span><span className="secure"><LockKeyhole size={13}/> Local-first MVP</span></div>
  </header>
  <section className="hero">
   <div className="eyebrow"><ShieldCheck size={15}/> VIBEX CODES / TRACK 3</div>
   <h1>Pause. Check. <span>Stay safe.</span></h1>
   <p>Understand suspicious links, scam messages and risky code before they become a problem.</p>
   <div className="stats"><div><b>3</b><small>security checks</small></div><div><b>100</b><small>risk score</small></div><div><b>0</b><small>data stored by MVP</small></div></div>
  </section>
  <section className="grid">{tools.map(t=><button className={"card "+(tool===t.id?"active":"")} onClick={()=>{setTool(t.id);setResult(null);setError("");setInput("")}} key={t.id}>
   <div className="icon"><t.icon size={21}/></div><h2>{t.title}</h2><p>{t.desc}</p><span className="card-arrow"><ArrowRight size={17}/></span>
  </button>)}</section>
  <section className="workspace">
   <div className="workhead"><div><span className="eyebrow">LIVE ANALYSIS</span><h2>{active.title}</h2></div><span className="pill"><Activity size={14}/> {loading?"Scanning":"Ready"}</span></div>
   <div className="sample-row"><button onClick={loadSample}>Load demo example</button><span>Try the built-in scenario for the fastest demo.</span></div>
   <textarea maxLength={5000} value={input} onChange={e=>setInput(e.target.value)} placeholder={active.placeholder}/>
   <div className="composer-foot"><span>{input.length}/5,000 characters</span><button className="analyze" disabled={loading||!input.trim()} onClick={analyze}>{loading?"Analyzing…":"Analyze risk"} <ArrowRight size={18}/></button></div>
   {error&&<div className="error"><AlertTriangle size={17}/><span>{error}</span></div>}
   {result&&<div className="result">
    <div className="score"><span>Risk score</span><b className={result.level.toLowerCase()}>{result.score}</b><strong>{result.level} RISK</strong><small>{result.engine}</small></div>
    <div className="signals"><h3>Why this was flagged</h3>{result.findings.length?result.findings.map((f,i)=><div className="finding" key={i}><AlertTriangle size={15}/><div><b>{f.signal}</b><p>{f.evidence}</p></div></div>):<div className="finding safe"><CheckCircle2 size={15}/><div><b>No obvious high-risk pattern</b><p>The rules engine did not detect a known warning signal.</p></div></div>}
     <div className="actions"><h4>Recommended next steps</h4>{result.recommendations.map((x,i)=><p key={i}>• {x}</p>)}</div>
     <small className="disclaimer">Advisory result. Verify important requests through a trusted channel before acting.</small>
    </div>
   </div>}
  </section>
  {history.length>0&&<section className="history"><div className="section-head"><div><span className="eyebrow">SESSION ACTIVITY</span><h2>Recent checks</h2></div><button onClick={()=>setHistory([])}><RotateCcw size={14}/> Clear</button></div><div className="history-list">{history.map((h,i)=><div className="history-item" key={i}><span className={"mini "+h.level.toLowerCase()}>{h.score}</span><div><b>{tools.find(t=>t.id===h.type)?.title}</b><p>{h.preview}{h.preview.length===64?"…":""}</p></div><time>{h.time.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</time></div>)}</div></section>}
  <footer><span>VibeX Shield · Defensive security tooling</span><span><LockKeyhole size={14}/> No submitted content is persisted by the MVP</span></footer>
 </main>
}