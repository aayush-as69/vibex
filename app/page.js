"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Link2, MessageSquareWarning, Code2, CheckCircle2 } from "lucide-react";

const features = [
  { icon: MessageSquareWarning, title: "Scam Message", text: "Spot urgency, payment pressure, credential requests, and impersonation patterns." },
  { icon: Link2, title: "Link Scanner", text: "Inspect URLs for obfuscation, suspicious domains, unsafe transport, and credential lures." },
  { icon: Code2, title: "Code Guard", text: "Identify exposed secrets, dangerous execution patterns, and insecure code." }
];

const protection = [
  ["Browser Link Guard", "Warns about suspicious links before high-risk navigation."],
  ["Code Guard", "Scans source and configuration files for high-confidence secrets."],
  ["Factory Sensor Agent", "Checks authenticated sensor readings against configured safety rules."]
];

export default function LandingPage() {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link href="/" className="brand">
          <span className="mark"><ShieldCheck size={20} /></span>
          <span>VibeX <b>Shield</b></span>
        </Link>
        <div className="landing-links">
          <a href="#features">Features</a>
          <a href="#protection">Protection</a>
          <Link href="/shield" className="nav-cta">Open Shield <ArrowRight size={16} /></Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-copy">
          <div className="eyebrow"><span /> CYBER SAFETY WORKSPACE</div>
          <h1>Pause before<br /><span>you trust.</span></h1>
          <p>VibeX Shield helps you inspect suspicious links, scam messages, and risky code before they turn into a costly mistake.</p>
          <div className="hero-actions">
            <Link href="/shield" className="landing-primary">Open VibeX Shield <ArrowRight size={18} /></Link>
            <a href="#features" className="landing-secondary">Explore features</a>
          </div>
          <div className="trust-line"><CheckCircle2 size={15} /> Local-first · Explainable · Defensive by design</div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="shield-core"><ShieldCheck size={82} strokeWidth={1.2} /></div>
          <div className="signal signal-one">LINK <b>HIGH RISK</b></div>
          <div className="signal signal-two">MESSAGE <b>MEDIUM</b></div>
          <div className="signal signal-three">CODE <b>SAFE TO REVIEW</b></div>
        </div>
      </section>

      <section className="landing-stats">
        <div><b>3</b><span>Core scanners</span></div>
        <div><b>0–100</b><span>Explainable risk score</span></div>
        <div><b>Local</b><span>Core analysis engine</span></div>
        <div><b>Safe</b><span>No code execution</span></div>
      </section>

      <section id="features" className="landing-section">
        <div className="section-heading">
          <div><span className="eyebrow">WHAT YOU CAN CHECK</span><h2>One workspace.<br />Three safety tools.</h2></div>
          <p>Get a clear signal, the evidence behind it, and practical next steps without turning a simple check into a security investigation.</p>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, text }, index) => (
            <article className="feature-card" key={title}>
              <span className="feature-icon"><Icon size={22} /></span>
              <span className="feature-number">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <Link href="/shield" className="feature-link">Try it <ArrowRight size={15} /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-explain">
        <div className="explain-panel">
          <div className="eyebrow">HOW IT WORKS</div>
          <h2>Signal → Risk → Safer action.</h2>
          <p>VibeX evaluates explicit risk patterns, turns them into findings, and presents the reasoning instead of hiding the result behind a black box.</p>
          <div className="steps">
            <div><b>01</b><span>Inspect the content</span></div>
            <div><b>02</b><span>Understand the signals</span></div>
            <div><b>03</b><span>Choose the safer next step</span></div>
          </div>
        </div>
        <div className="explain-code">
          <div className="code-head"><span /> ANALYSIS ENGINE <span>LIVE</span></div>
          <pre>{`INPUT
  ↓
VALIDATION
  ↓
RISK RULES
  ↓
FINDINGS
  ↓
0–100 SCORE
  ↓
RECOMMENDATION`}</pre>
        </div>
      </section>

      <section id="protection" className="landing-section protection-section">
        <div className="section-heading">
          <div><span className="eyebrow">AUTOMATIC PROTECTION</span><h2>Safety beyond the dashboard.</h2></div>
          <p>Deployable defensive modules extend VibeX from analysis into practical protection.</p>
        </div>
        <div className="protection-grid">
          {protection.map(([title, text], i) => (
            <article key={title}><span>0{i + 1}</span><h3>{title}</h3><p>{text}</p></article>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <div><div className="eyebrow">READY TO CHECK?</div><h2>Don&apos;t guess. Inspect first.</h2><p>Open the Shield workspace and run your first analysis.</p></div>
        <Link href="/shield" className="landing-primary">Open Shield <ArrowRight size={18} /></Link>
      </section>

      <footer className="landing-footer">
        <span>VibeX Shield</span><span>Inspect. Understand. Decide.</span>
      </footer>
    </main>
  );
}
