"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  ExternalLink,
  Fingerprint,
  History,
  Link2,
  LockKeyhole,
  MessageSquareWarning,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";

const tools = [
  {
    id: "message",
    icon: MessageSquareWarning,
    eyebrow: "SOCIAL ENGINEERING",
    title: "Scam Message",
    desc: "Detect urgency, payment pressure, credential requests and impersonation.",
    placeholder: "Paste an SMS, WhatsApp message, email or payment request…",
    sample:
      "URGENT: Your bank account is blocked. Share OTP now to receive refund. Click here within 10 minutes.",
  },
  {
    id: "url",
    icon: Link2,
    eyebrow: "LINK INTELLIGENCE",
    title: "Link Scanner",
    desc: "Inspect destinations for obfuscation, risky domains and credential lures.",
    placeholder: "Paste a suspicious URL…",
    sample: "http://secure-login.xyz/verify-account?otp=required",
  },
  {
    id: "code",
    icon: Code2,
    eyebrow: "DEVELOPER SECURITY",
    title: "Code Guard",
    desc: "Spot exposed secrets, unsafe execution and insecure transport patterns.",
    placeholder: "Paste a code snippet, config or request…",
    sample: "const API_KEY = 'sk_live_123'; eval(userInput); fetch('http://api.example.com');",
  },
];

const demoCases = [
  {
    label: "Fake bank alert",
    type: "message",
    input:
      "URGENT: Your bank account is blocked. Share OTP now to receive refund. Click here within 10 minutes.",
  },
  {
    label: "Suspicious login",
    type: "url",
    input: "http://secure-login.xyz/verify-account?otp=required",
  },
  {
    label: "Leaked secret",
    type: "code",
    input: "const API_KEY = 'sk_live_123'; eval(userInput); fetch('http://api.example.com');",
  },
];

function inspectInput(input, type, findings) {
  const text = String(input || "");
  if (type === "url") {
    try {
      const u = new URL(text);
      return [
        ["PROTOCOL", u.protocol.replace(":", ""), u.protocol === "https:" ? "ok" : "warn"],
        ["HOST", u.hostname, /xn--|\.xyz$|\.top$|\.tk$|\.ml$|\.ga$|\.cf$|\.gq$/i.test(u.hostname) ? "danger" : "ok"],
        ["PATH", u.pathname || "/", /login|verify|account|secure|payment|otp|password/i.test(u.pathname) ? "warn" : "ok"],
        ["QUERY", u.search ? u.search.slice(1) : "—", /otp|cvv|pin|password|token|verify/i.test(u.search) ? "danger" : "ok"],
      ];
    } catch {
      return [["INPUT", text, "danger"]];
    }
  }
  if (type === "code") {
    return text.split("\n").map((line, i) => [String(i + 1).padStart(2, "0"), line || " ", findings.some((f) => /dangerous|credential|secret|http/i.test(f.signal) && /eval|exec|key|token|secret|password|http:\/\//.test(line)) ? "danger" : "neutral"]);
  }
  const terms = [
    ["URGENT / PRESSURE", /urgent|immediately|within \d+|act now|expires/i],
    ["MONEY / PAYMENT", /money|payment|upi|bank|refund|transfer|cashback/i],
    ["OTP / CREDENTIAL", /otp|cvv|pin|mpin|password|passcode/i],
    ["ACTION", /click|tap|open|download|install|scan/i],
    ["AUTHORITY", /police|customs|income tax|kyc|parcel|electricity|sim|account/i],
  ];
  return terms.filter(([,re]) => re.test(text)).map(([label,re]) => [label, text.match(re)?.[0] || "", "danger"]);
}

function InspectionView({ input, type, findings, selectedFinding, onSelect }) {
  const rows = inspectInput(input, type, findings);
  const selectedText = String(selectedFinding?.evidence || "").toLowerCase();
  const isSelected = (value) => selectedText && String(value).toLowerCase().includes(selectedText);
  if (type === "code") return <div className="inspection code-inspection">{rows.map(([label, value, tone]) => <button className={`code-row ${tone} ${isSelected(value) ? "selected" : ""}`} key={label} onClick={() => onSelect(selectedFinding)}><span>{label}</span><code>{value}</code></button>)}</div>;
  if (type === "url") return <div className="inspection url-inspection">{rows.map(([label, value, tone]) => <button className={`url-part ${tone} ${isSelected(value) ? "selected" : ""}`} key={label} onClick={() => onSelect(selectedFinding)}><span>{label}</span><b>{value}</b></button>)}</div>;
  return <div className="inspection message-inspection">{rows.length ? rows.map(([label, value]) => <button className={`highlight-chip ${isSelected(value) ? "selected" : ""}`} key={label} onClick={() => onSelect(selectedFinding)}><span>{label}</span><b>{value}</b></button>) : <div className="highlight-clean">No recognized high-risk phrase was isolated.</div>}</div>;
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function levelTone(level) {
  return String(level || "LOW").toLowerCase();
}

function signalCount(result, category) {
  const groups = {
    "Social engineering": ["Urgency pressure","Action request","Reward lure"],
    "Credential theft": ["Sensitive verification data","Credential/payment lure"],
    "Impersonation": ["Authority/account impersonation","Brand impersonation"],
    "Link obfuscation": ["URL shortener","Punycode domain","Obfuscated destination","Deeply nested hostname","Malformed URL","Bidirectional text obfuscation"],
    "Transport security": ["No HTTPS","Insecure HTTP","TLS verification disabled"],
    "Secret exposure": ["Credential exposure","Secret in remote request"],
    "Code execution": ["Dangerous execution pattern"],
  };
  return result?.findings?.filter((f) => groups[category]?.includes(f.signal)).length || 0;
}

export default function Home() {
  const [tool, setTool] = useState("message");
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [scanStep, setScanStep] = useState("");

  const active = useMemo(() => tools.find((item) => item.id === tool), [tool]);

  const analyze = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      await new Promise((resolve) => setTimeout(resolve, 260));
      setScanStep("Running threat rules");
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: tool, input }),
      });
      const data = await res.json();
      setScanStep("Building evidence trace");
      if (!res.ok || !data.ok) throw new Error(data.error || "Analysis failed.");

      setResult(data.result);
      setSelectedFinding(data.result.findings?.[0] || null);
      setHistory((items) => [
        {
          id: crypto.randomUUID(),
          type: tool,
          score: data.result.score,
          level: data.result.level,
          time: data.result.checkedAt,
          preview: input.slice(0, 72),
        },
        ...items,
      ].slice(0, 6));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectTool = (id) => {
    setTool(id);
    setInput("");
    setResult(null);
    setError("");
  };

  const loadSample = () => {
    setInput(active.sample);
    setResult(null);
    setError("");
  };

  const loadCase = (item) => {
    setTool(item.type);
    setInput(item.input);
    setResult(null);
    setError("");
    window.scrollTo({ top: document.querySelector(".workspace")?.offsetTop || 0, behavior: "smooth" });
  };

  const reset = () => {
    setInput("");
    setResult(null);
    setError("");
  };

  const copyResult = async () => {
    if (!result) return;
    const text = [
      `VibeX Shield — ${result.level} risk (${result.score}/100)`,
      ...result.findings.map((f) => `• ${f.signal}: ${f.evidence}`),
      "",
      ...result.recommendations.map((r) => `→ ${r}`),
    ].join("\n");
    await navigator.clipboard?.writeText(text);
  };

  return (
    <main>
      <header className="nav">
        <a className="brand" href="#" aria-label="VibeX Shield home">
          <span className="mark"><ShieldCheck size={19} /></span>
          <span>VibeX <b>Shield</b></span>
        </a>
        <div className="nav-right">
          <span className="status"><i /> Threat engine online</span>
          <span className="secure"><LockKeyhole size={13} /> Local-first</span>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> VIBEX CODES · CYBER SAFETY</div>
          <h1>Don&apos;t trust it.<br /><span>Check it first.</span></h1>
          <p>
            A fast defensive workspace for suspicious links, scam messages and risky code.
            Get a human-readable risk signal before you click, pay, share or run.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-ghost" onClick={() => document.querySelector(".workspace")?.scrollIntoView({ behavior: "smooth" })}>
              Start a security check <ArrowRight size={16} />
            </button>
            <span><Zap size={14} /> No account · No upload · No stored input</span>
          </div>
        </div>

        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit orbit-a" />
          <div className="orbit orbit-b" />
          <div className="core">
            <ShieldCheck size={32} />
            <b>SAFE</b>
            <span>BY DEFAULT</span>
          </div>
          <div className="orbit-chip chip-a">URL</div>
          <div className="orbit-chip chip-b">MSG</div>
          <div className="orbit-chip chip-c">CODE</div>
        </div>
      </section>

      <section className="metrics">
        <div><span className="metric-icon"><Fingerprint size={15} /></span><div><b>3</b><small>attack surfaces</small></div></div>
        <div><span className="metric-icon"><Activity size={15} /></span><div><b>100</b><small>risk points</small></div></div>
        <div><span className="metric-icon"><LockKeyhole size={15} /></span><div><b>0</b><small>stored submissions</small></div></div>
        <div className="engine"><i /> <span>Rules engine v1 · deterministic · explainable</span></div>
      </section>

      <section className="tool-section">
        <div className="section-title">
          <div><span className="eyebrow">SECURITY WORKSPACE</span><h2>Choose what you want to inspect.</h2></div>
          <span className="section-note">Built for citizens, developers & teams</span>
        </div>

        <div className="tool-grid">
          {tools.map((item) => {
            const Icon = item.icon;
            return (
              <button type="button" aria-pressed={tool === item.id} className={`tool-card ${tool === item.id ? "selected" : ""}`} onClick={() => selectTool(item.id)} key={item.id}>
                <div className="tool-top"><span className="tool-icon"><Icon size={19} /></span><ChevronRight size={17} /></div>
                <span className="tool-eyebrow">{item.eyebrow}</span>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                <span className="tool-link">Open scanner <ArrowRight size={14} /></span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="workspace">
        <div className="workspace-bar">
          <div className="workspace-title">
            <div className="live-dot"><i /></div>
            <div><span className="eyebrow">ACTIVE CHECK</span><h2>{active.title}</h2></div>
          </div>
          <div className="workspace-meta"><span className={loading ? "analysis-live" : ""}><Activity size={13} /> {loading ? scanStep || "Analyzing" : "Ready"}</span><span>Max 5,000 chars</span></div>
        </div>

        <div className="scenario-row">
          <span>Quick demo</span>
          {demoCases.map((item) => (
            <button key={item.label} onClick={() => loadCase(item)}>{item.label}</button>
          ))}
        </div>

        <div className="composer">
          <div className="composer-label"><Terminal size={14} /> INPUT PAYLOAD <span>{input.length}/5,000</span></div>
          <textarea
            maxLength={5000}
            value={input}
            onChange={(e) => { setInput(e.target.value); setResult(null); }}
            placeholder={active.placeholder}
          />
          <div className="composer-foot">
            <button className="sample" onClick={loadSample}>Load example</button>
            <div className="composer-right">
              {input && <button type="button" className="reset" onClick={reset}>Clear</button>}
              <button type="button" className="analyze" disabled={loading || !input.trim()} onClick={analyze}>
                {loading ? <><span className="scan-spinner" /> {scanStep || "Running checks…"}</> : <>Analyze threat <ArrowRight size={17} /></>}
              </button>
            </div>
          </div>
        </div>

        {error && <div className="error"><AlertTriangle size={17} /><span>{error}</span></div>}

        {result && (
          <><div className="analysis-overview">
            <div className="overview-main">
              <div className="verdict-line">
                <span className={`risk-badge ${levelTone(result.level)}`}>{result.level} RISK</span>
                <span className="confidence"><Activity size={12}/> {result.confidence || 0}% confidence</span>
              </div>
              <h3>{result.summary || "Analysis complete."}</h3>
              <p>Detected {result.findings.length} signal{result.findings.length === 1 ? "" : "s"} across {result.categories?.length || 0} security {result.categories?.length === 1 ? "category" : "categories"}.</p>
            </div>
            <div className={`overview-score ${levelTone(result.level)}`}><b>{result.score}</b><span>/100</span></div>
          </div>
          <div className="signal-map">
            {["Social engineering","Credential theft","Impersonation","Link obfuscation","Transport security","Secret exposure","Code execution"].map((category) => {
              const count = signalCount(result, category);
              return <div className={`signal-meter ${count ? "hit" : ""}`} key={category}><span>{category}</span><i><b style={{ width: `${Math.min(100, count * 34)}%` }} /></i><em>{count}</em></div>;
            })}
          </div>
          <div className="inspection-section"><div className="panel-heading"><div><span className="eyebrow">INPUT FORENSICS</span><h3>What the engine noticed</h3></div><span>Signal-level inspection</span></div><InspectionView input={input} type={tool} findings={result.findings} selectedFinding={selectedFinding} onSelect={setSelectedFinding} /></div>
          <div className="result-panel">
            <div className="verdict">
              <div className="verdict-head">
                <span className="eyebrow">ANALYSIS COMPLETE</span>
                <button className="icon-btn" onClick={copyResult} title="Copy result"><Copy size={15} /></button>
              </div>
              <div className="score-ring-wrap">
                <div className={`score-ring ${levelTone(result.level)}`}>
                  <div><b>{result.score}</b><span>/100</span></div>
                </div>
                <div>
                  <span className={`risk-badge ${levelTone(result.level)}`}>{result.level} RISK</span>
                  <h3>{result.level === "HIGH" ? "Stop before you act." : result.level === "MEDIUM" ? "Pause and verify." : "No obvious red flags."}</h3>
                  <p>Assessment from {result.engine}. The score is a defensive signal, not a guarantee of safety.</p>
                </div>
              </div>
              <div className="score-scale"><span>LOW</span><i /><span>MEDIUM</span><i /><span>HIGH</span></div>
            </div>

            <div className="evidence">
              <div className="panel-heading"><div><span className="eyebrow">EVIDENCE TRACE</span><h3>Why this was flagged</h3></div><span>{result.findings.length} signal{result.findings.length === 1 ? "" : "s"} · {result.confidence || 0}% confidence</span></div>
              {result.findings.length ? result.findings.map((f, index) => (
                <div className="evidence-card" key={f.signal}>
                  <div className={`evidence-number ${levelTone(result.level)}`}>{String(index + 1).padStart(2, "0")}</div>
                  <div><b>{f.signal}</b><p>{f.evidence}</p></div>
                  <span className="weight">+{f.weight}</span>
                </div>
              )) : (
                <div className="clean-state"><CheckCircle2 size={20} /><div><b>No obvious high-risk pattern detected</b><p>The current rules did not match a known warning signal.</p></div></div>
              )}

              <div className="decision-line"><span>Recommended decision</span><b>{result.level === "HIGH" ? "DO NOT PROCEED" : result.level === "MEDIUM" ? "VERIFY FIRST" : "PROCEED WITH CAUTION"}</b></div>{selectedFinding && <div className="finding-detail"><div><span className="eyebrow">SELECTED SIGNAL</span><h3>{selectedFinding.signal}</h3></div><span className="finding-weight">+{selectedFinding.weight} risk</span><p>{selectedFinding.evidence}</p><div className="detail-grid"><div><span>WHY IT MATTERS</span><b>{selectedFinding.weight >= 25 ? "High-impact indicator" : selectedFinding.weight >= 15 ? "Meaningful warning" : "Supporting signal"}</b></div><div><span>ACTION</span><b>Verify independently before proceeding.</b></div></div></div>}<div className="next-steps">
                <div className="next-icon"><ShieldCheck size={17} /></div>
                <div><span className="eyebrow">WHAT TO DO NEXT</span>{result.recommendations.map((item, index) => <p key={index}><span>{index + 1}</span>{item}</p>)}</div>
              </div>

              <div className="result-foot"><span>Checked {formatTime(result.checkedAt)}</span><span>Advisory only · verify through a trusted channel</span></div>
            </div>
          </div>
          </>
        )}
      </section>

      {history.length > 0 && (
        <section className="history">
          <div className="section-title compact">
            <div><span className="eyebrow"><History size={13} /> SESSION MEMORY</span><h2>Recent checks</h2></div>
            <button className="clear-history" onClick={() => setHistory([])}><RotateCcw size={13} /> Clear</button>
          </div>
          <div className="history-grid">
            {history.map((item) => (
              <button className="history-item" key={item.id} onClick={() => { setTool(item.type); setInput(item.preview); setResult(null); }}>
                <span className={`history-score ${levelTone(item.level)}`}>{item.score}</span>
                <span><b>{tools.find((x) => x.id === item.type)?.title}</b><small>{item.preview}</small></span>
                <time>{formatTime(item.time)}</time>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="trust-strip">
        <div><ShieldCheck size={20} /><div><b>Defensive by design</b><span>VibeX Shield analyzes text locally through deterministic rules and does not execute submitted code.</span></div></div>
        <div><ExternalLink size={16} /><span>Never treat a green result as proof that something is safe.</span></div>
      </section>

      <footer><span>VibeX Shield · Cyber Safety Track</span><span>Pause before you click, pay, share or run.</span></footer>
    </main>
  );
}
