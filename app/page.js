"use client";

import { useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileUp,
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
    label: "UPI collect scam",
    type: "message",
    input: "Approve this UPI collect request and enter your PIN to receive a ₹50,000 refund.",
  },
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

function redactSensitiveText(value) {
  return String(value || "")
    .replace(/((?:api[_-]?key|client[_-]?secret|access[_-]?token|password|secret|authorization)\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, "$1[REDACTED]")
    .replace(/([?&](?:token|access_token|api_key|secret|password|otp|pin|cvv|auth|code)=)[^&#\s"'()]+/gi, "$1[REDACTED]")
    .replace(/\b(otp|one[- ]time password|cvv|pin|mpin)\s*(?:is|[:=#-])?\s*\d{3,8}\b/gi, "$1 [REDACTED]")
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|sk_(?:live|test)_[A-Za-z0-9]{8,}|AKIA[0-9A-Z]{16})\b/g, "[REDACTED]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]{12,}/gi, "Bearer [REDACTED]")
    .replace(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gi, "[PRIVATE KEY REDACTED]");
}

function safeQueryString(searchParams) {
  return [...searchParams.entries()].map(([key, value]) => {
    const safeValue = /(?:token|secret|password|otp|pin|cvv|api[_-]?key|auth|code)/i.test(key) ? "[REDACTED]" : value;
    return key + "=" + safeValue;
  }).join("&");
}

function findingForRow(type, label, value, findings) {
  const text = String(value || "").toLowerCase();
  const find = (signal) => findings.find((finding) => finding.signal === signal) || null;

  if (type === "message") {
    const signals = {
      "URGENT / PRESSURE": "Urgency pressure",
      "MONEY / PAYMENT": "Financial action",
      "OTP / CREDENTIAL": "Sensitive verification data",
      ACTION: "Action request",
      AUTHORITY: "Authority/account impersonation",
      "EMBEDDED LINK": "Embedded suspicious link",
    };
    return find(signals[label]);
  }

  if (type === "code") {
    if (/api[_-]?key|client[_-]?secret|access[_-]?token|password|secret|authorization|-----begin/i.test(text)) return find("Credential exposure");
    if (/eval\s*\(|new\s+function|child_process|\bexec(?:sync)?\s*\(|\bspawn(?:sync)?\s*\(|os\.system|subprocess\.|rm\s+-rf|document\.cookie|innerhtml|pickle\.loads|yaml\.load/i.test(text)) return find("Dangerous execution pattern");
    if (/http:\/\//i.test(text)) return find("Insecure HTTP");
    if (/rejectunauthorized|verify\s*[:=]\s*false|node_tls_reject/i.test(text)) return find("TLS verification disabled");
    if (/https?:\/\//i.test(text) && /token|key|secret|password/i.test(text)) return find("Secret in remote request");
    return null;
  }

  if (label === "PROTOCOL" && text !== "https") return find("No HTTPS");
  if (label === "INPUT") return find("Malformed URL");
  if (label === "HOST") {
    if (/xn--/.test(text)) return find("Punycode domain");
    if (/[^\x00-\x7f]/i.test(text)) return find("Unicode hostname");
    if (/\.(xyz|top|tk|ml|ga|cf|gq|click|support)$/.test(text)) return find("Suspicious domain suffix");
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(text)) return find("Local or private destination");
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(text) || text.startsWith("[")) return find("IP address destination");
    if (text.split(".").length > 4) return find("Deeply nested hostname");
    return find("Brand impersonation") || find("URL shortener");
  }
  if (label === "PATH" || label === "QUERY") {
    if (/login|verify|secure|wallet|payment|kyc|bank|password|otp/i.test(text)) return find("Credential/payment lure");
    if (/xn--|@/.test(text)) return find("Obfuscated destination");
    if (/token|password|otp|pin|cvv/i.test(text)) return find("Credential/payment lure");
  }
  return null;
}

function inspectInput(input, type, findings) {
  const text = String(input || "");
  if (type === "url") {
    try {
      const candidate = /^https?:\/\//i.test(text) ? text : "https://" + text;
      const url = new URL(candidate);
      return [
        ["PROTOCOL", url.protocol.replace(":", ""), url.protocol === "https:" ? "ok" : "warn"],
        ["HOST", url.hostname, /xn--|\.xyz$|\.top$|\.tk$|\.ml$|\.ga$|\.cf$|\.gq$/i.test(url.hostname) ? "danger" : "ok"],
        ["PATH", url.pathname || "/", /login|verify|account|secure|payment|otp|password/i.test(url.pathname) ? "warn" : "ok"],
        ["QUERY", url.search ? safeQueryString(url.searchParams) : "—", /otp|cvv|pin|password|token|verify|secret|key/i.test(url.search) ? "danger" : "ok"],
      ];
    } catch {
      return [["INPUT", redactSensitiveText(text), "danger"]];
    }
  }
  if (type === "code") {
    const safeText = redactSensitiveText(text);
    return safeText.split("\n").map((line, index) => {
      const danger = Boolean(findingForRow("code", String(index + 1), line, findings));
      return [String(index + 1).padStart(2, "0"), line || " ", danger ? "danger" : "neutral"];
    });
  }
  const terms = [
    ["URGENT / PRESSURE", /urgent|immediately|within \d+|act now|expires/i],
    ["MONEY / PAYMENT", /money|payment|upi|bank|refund|transfer|cashback/i],
    ["OTP / CREDENTIAL", /otp|cvv|pin|mpin|password|passcode/i],
    ["ACTION", /click|tap|open|download|install|scan/i],
    ["AUTHORITY", /police|customs|income tax|kyc|parcel|electricity|sim|account/i],
  ];
  const rows = terms.filter(([, pattern]) => pattern.test(text)).map(([label, pattern]) => [label, text.match(pattern)?.[0] || "", "danger"]);
  const links = text.match(/(?:https?:\/\/|www\.)[^\s<>"']+/gi) || [];
  if (links.length) rows.push(["EMBEDDED LINK", redactSensitiveText(links[0]), "danger"]);
  return rows;
}

function InspectionView({ input, type, findings, selectedFinding, onSelect }) {
  const rows = inspectInput(input, type, findings);
  const renderRow = (row, className, contentTag) => {
    const [label, value, tone] = row;
    const finding = findingForRow(type, label, value, findings);
    const selected = finding && selectedFinding?.signal === finding.signal && selectedFinding?.evidence === finding.evidence;
    return (
      <button
        type="button"
        className={className + " " + tone + (selected ? " selected" : "")}
        key={label}
        onClick={() => finding && onSelect(finding)}
        disabled={!finding}
        aria-pressed={Boolean(selected)}
      >
        <span>{label}</span>
        {contentTag === "code" ? <code>{value}</code> : <b>{value}</b>}
      </button>
    );
  };
  if (type === "code") return <div className="inspection code-inspection">{rows.map((row) => renderRow(row, "code-row", "code"))}</div>;
  if (type === "url") return <div className="inspection url-inspection">{rows.map((row) => renderRow(row, "url-part", "bold"))}</div>;
  return <div className="inspection message-inspection">{rows.length ? rows.map((row) => renderRow(row, "highlight-chip", "bold")) : <div className="highlight-clean">No recognized high-risk phrase was isolated.</div>}</div>;
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
    "Financial fraud": ["Financial action","UPI collect/payment request"],
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
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef(null);

  const active = useMemo(() => tools.find((item) => item.id === tool), [tool]);

  const analyze = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await new Promise((resolve) => setTimeout(resolve, 180));
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
          preview: redactSensitiveText(input).slice(0, 72),
          input,
          result: data.result,
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
    setNotice("");
    setSelectedFinding(null);
  };

  const loadSample = () => {
    setInput(active.sample);
    setResult(null);
    setError("");
    setNotice("");
    setSelectedFinding(null);
  };

  const loadCase = (item) => {
    setTool(item.type);
    setInput(item.input);
    setResult(null);
    setError("");
    setNotice("");
    setSelectedFinding(null);
    window.scrollTo({ top: document.querySelector(".workspace")?.offsetTop || 0, behavior: "smooth" });
  };

  const handleFileImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const allowed = ["txt", "md", "csv", "json", "js", "jsx", "mjs", "cjs", "py", "html", "css", "log", "yaml", "yml", "env", "sh", "eml"];
    if (!allowed.includes(extension)) {
      setError("Choose a supported text file.");
      event.target.value = "";
      return;
    }
    if (file.size > 20000) {
      setError("The selected file is larger than 20 KB.");
      event.target.value = "";
      return;
    }
    try {
      const text = await file.text();
      if (text.length > 5000) throw new Error("This file contains more than 5,000 characters.");
      const codeExtensions = ["json", "js", "jsx", "mjs", "cjs", "py", "html", "css", "yaml", "yml", "env", "sh"];
      setTool(codeExtensions.includes(extension) ? "code" : tool);
      setInput(text);
      setResult(null);
      setSelectedFinding(null);
      setError("");
      setNotice(file.name + " read in this browser. Its text is sent only to this app when you analyze; the app does not save it.");
    } catch (importError) {
      setError(importError.message || "Unable to read this text file.");
    } finally {
      event.target.value = "";
    }
  };

  const reset = () => {
    setInput("");
    setResult(null);
    setError("");
    setNotice("");
    setSelectedFinding(null);
  };

  const copyResult = async () => {
    if (!result) return;
    const text = [
      "VibeX Shield — " + result.level + " risk (" + result.score + "/100)",
      ...result.findings.map((f) => "• " + f.signal + ": " + f.evidence),
      "",
      ...result.recommendations.map((r) => "→ " + r),
    ].join("\n");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable in this browser.");
      await navigator.clipboard.writeText(text);
      setNotice("Analysis summary copied to clipboard.");
    } catch (copyError) {
      setError(copyError.message || "Unable to copy this report.");
    }
  };

  const downloadReport = () => {
    if (!result) return;
    const report = [
      "VibeX Shield — Security Analysis Report",
      "======================================",
      "Checked: " + new Date(result.checkedAt).toLocaleString(),
      "Input type: " + (tools.find((item) => item.id === tool)?.title || tool),
      "Risk: " + result.level + " (" + result.score + "/100)",
      "Engine: " + result.engine,
      "",
      "SUMMARY",
      result.summary,
      "",
      "FINDINGS",
      ...(result.findings.length ? result.findings.map((finding, index) => (index + 1) + ". " + finding.signal + " [+" + finding.weight + "]\n   " + finding.evidence) : ["No known warning patterns were matched."]),
      "",
      "RECOMMENDATIONS",
      ...result.recommendations.map((item, index) => (index + 1) + ". " + item),
      "",
      "Limitations: Rules-based advisory only. This is not a guarantee of safety.",
    ].join("\n");
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "vibex-shield-report-" + new Date().toISOString().slice(0, 10) + ".txt";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setNotice("Report generated without including the submitted payload.");
  };

  const restoreHistory = (item) => {
    setTool(item.type);
    setInput(item.input || item.preview || "");
    setResult(item.result || null);
    setSelectedFinding(item.result?.findings?.[0] || null);
    setError("");
    setNotice("Restored a previous check from this browser session.");
    document.querySelector(".workspace")?.scrollIntoView({ behavior: "smooth" });
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
          <span className="secure"><LockKeyhole size={13} /> No third-party APIs</span>
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
            <span><Zap size={14} /> No account · No third-party APIs · No saved input</span>
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
        <div className="engine"><i /> <span>Rules engine v3 · deterministic · explainable</span></div>
      </section>

      <section className="auto-suite">
        <div className="section-title">
          <div><span className="eyebrow">AUTOMATIC PROTECTION</span><h2>Protection beyond the dashboard.</h2></div>
          <span className="section-note">Installable and CI-integrated modules</span>
        </div>
        <div className="auto-grid">
          <a className="auto-card" href="https://github.com/aayush-as69/vibex/tree/main/browser-extension" target="_blank" rel="noreferrer">
            <span className="auto-index">01 / BROWSER</span><b>Link Guard</b>
            <p>Highlights risky links and interrupts high-risk clicks before navigation in Chrome and Edge.</p>
            <span className="auto-state">LOCAL EXTENSION <ArrowRight size={14}/></span>
          </a>
          <a className="auto-card" href="https://github.com/aayush-as69/vibex/blob/main/.github/workflows/ci.yml" target="_blank" rel="noreferrer">
            <span className="auto-index">02 / DEVELOPER</span><b>Code Guard</b>
            <p>Scans source and configuration files for exposed credentials and fails CI on high-confidence matches.</p>
            <code>npm run guard</code>
          </a>
          <a className="auto-card" href="https://github.com/aayush-as69/vibex/blob/main/docs/AUTOMATIC_PROTECTION.md" target="_blank" rel="noreferrer">
            <span className="auto-index">03 / FACTORY</span><b>Sensor Agent</b>
            <p>Accepts authenticated sensor telemetry and raises alerts for unsafe ranges or sudden changes.</p>
            <code>npm run sensor:agent</code>
          </a>
        </div>
        <p className="auto-note">Voice-clone verification and direct UPI-app interception require native call/audio or payment-app integration. VibeX flags UPI scam wording but does not claim to authenticate a caller&apos;s voice.</p>
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
          <input ref={fileInputRef} className="visually-hidden" type="file" accept=".txt,.md,.csv,.json,.js,.jsx,.mjs,.cjs,.py,.html,.css,.log,.yaml,.yml,.env,.sh,.eml" onChange={handleFileImport} aria-label="Import a text file" />
          <textarea
            maxLength={5000}
            value={input}
            onChange={(e) => { setInput(e.target.value); setResult(null); setSelectedFinding(null); setError(""); setNotice(""); }}
            placeholder={active.placeholder}
          />
          <div className="composer-foot">
            <div className="composer-left">
              <button type="button" className="sample" onClick={loadSample}>Load example</button>
              <button type="button" className="sample" onClick={() => fileInputRef.current?.click()}><FileUp size={13} /> Import text file</button>
            </div>
            <div className="composer-right">
              {input && <button type="button" className="reset" onClick={reset}>Clear</button>}
              <button type="button" className="analyze" disabled={loading || !input.trim()} onClick={analyze}>
                {loading ? <><span className="scan-spinner" /> {scanStep || "Running checks…"}</> : <>Analyze threat <ArrowRight size={17} /></>}
              </button>
            </div>
          </div>
        </div>
        {notice && <div className="notice" role="status">{notice}</div>}

        {error && <div className="error"><AlertTriangle size={17} /><span>{error}</span></div>}

        {result && (
          <><div className="analysis-overview">
            <div className="overview-main">
              <div className="verdict-line">
                <span className={`risk-badge ${levelTone(result.level)}`}>{result.level} RISK</span>
                <span className="confidence"><Activity size={12}/> {result.findings.length} evidence signals</span>
              </div>
              <h3>{result.summary || "Analysis complete."}</h3>
              <p>Detected {result.findings.length} signal{result.findings.length === 1 ? "" : "s"} across {result.categories?.length || 0} security {result.categories?.length === 1 ? "category" : "categories"}.</p>
            </div>
            <div className={`overview-score ${levelTone(result.level)}`}><b>{result.score}</b><span>/100</span></div>
          </div>
          <div className="signal-map">
            {["Social engineering","Financial fraud","Credential theft","Impersonation","Link obfuscation","Transport security","Secret exposure","Code execution"].map((category) => {
              const count = signalCount(result, category);
              return <div className={`signal-meter ${count ? "hit" : ""}`} key={category}><span>{category}</span><i><b style={{ width: `${Math.min(100, count * 34)}%` }} /></i><em>{count}</em></div>;
            })}
          </div>
          <div className="inspection-section"><div className="panel-heading"><div><span className="eyebrow">INPUT FORENSICS</span><h3>What the engine noticed</h3></div><span>Signal-level inspection</span></div><InspectionView input={input} type={tool} findings={result.findings} selectedFinding={selectedFinding} onSelect={setSelectedFinding} /></div>
          <div className="result-panel">
            <div className="verdict">
              <div className="verdict-head">
                <span className="eyebrow">ANALYSIS COMPLETE</span>
                <div className="report-actions">
                  <button type="button" className="icon-btn" onClick={copyResult} title="Copy summary" aria-label="Copy summary"><Copy size={15} /></button>
                  <button type="button" className="icon-btn" onClick={downloadReport} title="Download report" aria-label="Download report"><Download size={15} /></button>
                </div>
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
              <div className="panel-heading"><div><span className="eyebrow">EVIDENCE TRACE</span><h3>Why this was flagged</h3></div><span>{result.findings.length} signal{result.findings.length === 1 ? "" : "s"} · {result.categories?.length || 0} categories</span></div>
              {result.findings.length ? result.findings.map((f, index) => (
                <button type="button" className={`evidence-card ${selectedFinding?.signal === f.signal && selectedFinding?.evidence === f.evidence ? "active" : ""}`} key={f.signal + f.evidence} onClick={() => setSelectedFinding(f)} aria-pressed={selectedFinding?.signal === f.signal && selectedFinding?.evidence === f.evidence}>
                  <div className={`evidence-number ${levelTone(result.level)}`}>{String(index + 1).padStart(2, "0")}</div>
                  <div><b>{f.signal}</b><p>{f.evidence}</p></div>
                  <span className="weight">+{f.weight}</span>
                </button>
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
              <button type="button" className="history-item" key={item.id} onClick={() => restoreHistory(item)}>
                <span className={`history-score ${levelTone(item.level)}`}>{item.score}</span>
                <span><b>{tools.find((x) => x.id === item.type)?.title}</b><small>{item.preview}</small></span>
                <time>{formatTime(item.time)}</time>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="trust-strip">
        <div><ShieldCheck size={20} /><div><b>Defensive by design</b><span>Analysis runs through this app’s own deterministic API. Inputs are not forwarded to AI or threat-intelligence providers, the app does not persist submissions, and submitted code is never executed.</span></div></div>
        <div><ExternalLink size={16} /><span>Never treat a green result as proof that something is safe.</span></div>
      </section>

      <footer><span>VibeX Shield · Cyber Safety Track</span><span>Pause before you click, pay, share or run.</span></footer>
    </main>
  );
}
