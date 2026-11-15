const URL_SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "rb.gy", "shorturl.at",
  "rebrand.ly", "short.io", "lnkd.in", "buff.ly", "ow.ly",
]);

const SUSPICIOUS_TLDS = new Set(["xyz", "top", "tk", "ml", "ga", "cf", "gq", "click", "support"]);
const URGENCY = /\b(urgent|immediately|within\s+\d+\s+(?:minutes?|hours?)|act now|last warning|account will be blocked|expires today)\b/i;
const PAYMENT = /\b(upi|collect request|payment|refund|bank account|credit card|gift card|transfer|cashback|wire transfer)\b/i;
const SENSITIVE_DATA = /\b(otp|one[- ]time password|cvv|pin|mpin|passcode|password)\b/i;
const ACTION_REQUEST = /\b(click|tap|open|download|install|scan|enable macros|run this)\b/i;
const AUTHORITY = /\b(police|customs|income tax|tax department|kyc|parcel|electricity|sim card|bank account|government|support team)\b/i;
const REWARD_LURE = /\b(winner|prize|lottery|cashback|reward|free gift|claim now)\b/i;

const TRUSTED_BRANDS = {
  paypal: ["paypal.com"],
  google: ["google.com", "google.co.in"],
  microsoft: ["microsoft.com", "live.com", "office.com"],
  apple: ["apple.com", "icloud.com"],
  amazon: ["amazon.com", "amazon.in"],
  sbi: ["sbi.co.in", "onlinesbi.sbi"],
  hdfc: ["hdfcbank.com"],
  icici: ["icicibank.com"],
  axis: ["axisbank.com"],
  flipkart: ["flipkart.com"],
  whatsapp: ["whatsapp.com"],
};

const SECRET_PATTERNS = [
  { label: "API key", pattern: /\b(?:api[_-]?key)\b\s*[:=]\s*["'`]([^"'`\s]{8,})["'`]/i },
  { label: "client secret", pattern: /\bclient[_-]?secret\b\s*[:=]\s*["'`]([^"'`\s]{8,})["'`]/i },
  { label: "access token", pattern: /\baccess[_-]?token\b\s*[:=]\s*["'`]([^"'`\s]{8,})["'`]/i },
  { label: "password", pattern: /\bpassword\b\s*[:=]\s*["'`]([^"'`\s]{8,})["'`]/i },
  { label: "private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i },
  { label: "provider token", pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|sk_(?:live|test)_[A-Za-z0-9]{8,}|AKIA[0-9A-Z]{16})\b/ },
  { label: "bearer token", pattern: /\bBearer\s+[A-Za-z0-9._~+/-]{12,}/i },
];

const DANGEROUS_CODE = [
  { label: "dynamic eval", pattern: /\beval\s*\(/i },
  { label: "dynamic Function constructor", pattern: /\bnew\s+Function\s*\(/i },
  { label: "process execution", pattern: /\b(?:child_process|exec|execSync|spawn|spawnSync)\b/i },
  { label: "shell execution", pattern: /\b(?:os\.system|subprocess\.(?:run|Popen|call))\b|shell\s*[:=]\s*true/i },
  { label: "recursive deletion command", pattern: /\brm\s+-rf\b/i },
  { label: "browser cookie access", pattern: /\bdocument\.cookie\b/i },
  { label: "unsafe HTML injection", pattern: /\b(?:innerHTML|dangerouslySetInnerHTML)\b/i },
  { label: "unsafe deserialization", pattern: /\b(?:pickle\.loads|yaml\.load)\s*\(/i },
];

const CATEGORY_MAP = {
  "Urgency pressure": "Social engineering",
  "Financial action": "Financial fraud",
  "Sensitive verification data": "Credential theft",
  "Action request": "Social engineering",
  "Reward lure": "Social engineering",
  "Authority/account impersonation": "Impersonation",
  "Embedded suspicious link": "Link safety",
  "URL shortener": "Link obfuscation",
  "Suspicious domain suffix": "Domain reputation",
  "Punycode domain": "Domain obfuscation",
  "Unicode hostname": "Domain obfuscation",
  "Obfuscated destination": "URL obfuscation",
  "URL credentials": "URL obfuscation",
  "Deeply nested hostname": "URL obfuscation",
  "Malformed URL": "Input validation",
  "Local or private destination": "Network targeting",
  "IP address destination": "Network targeting",
  "Suspicious URL port": "Network targeting",
  "No HTTPS": "Transport security",
  "Credential/payment lure": "Credential theft",
  "Brand impersonation": "Impersonation",
  "Credential exposure": "Secret exposure",
  "Dangerous execution pattern": "Code execution",
  "Secret in remote request": "Secret exposure",
  "Insecure HTTP": "Transport security",
  "TLS verification disabled": "Transport security",
  "Sensitive data in message": "Data exposure",
};

function add(signal, evidence, weight) {
  return { signal, evidence, weight, category: CATEGORY_MAP[signal] || "Security signal" };
}

function uniqueFindings(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.signal + "::" + item.evidence;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isPrivateHost(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "::1" ||
    host === "0.0.0.0"
  ) return true;

  const parts = host.split(".");
  if (parts.length !== 4 || !parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)) return false;

  const [a, b] = parts.map(Number);
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

function parseUrl(value) {
  const raw = String(value || "").trim().replace(/[),.;!?\]}]+$/g, "");
  if (!raw || /[\u0000-\u001f\s]/.test(raw)) return null;

  let candidate = raw;
  if (!/^https?:\/\//i.test(candidate)) {
    if (!/^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\:\d+)?(?:[/?#]|$)/i.test(candidate)) return null;
    candidate = "https://" + candidate;
  }

  try {
    const parsed = new URL(candidate);
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) return null;
    return { parsed, raw };
  } catch {
    return null;
  }
}

function analyzeUrl(value, options = {}) {
  const findings = [];
  const parsedResult = parseUrl(value);
  const source = options.source || "URL";

  if (!parsedResult) {
    return [add("Malformed URL", source + " could not be parsed as a valid HTTP or HTTPS web address.", 28)];
  }

  const { parsed, raw } = parsedResult;
  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const labels = hostname.split(".");
  const rawHost = raw.replace(/^https?:\/\//i, "").split(/[/?#]/)[0].split("@").pop();

  if (parsed.protocol !== "https:") {
    findings.push(add("No HTTPS", source + " uses HTTP instead of encrypted HTTPS.", 18));
  }

  if (URL_SHORTENERS.has(hostname)) {
    findings.push(add("URL shortener", "Shortened destination (" + hostname + ") hides the final website address.", 22));
  }

  const tld = labels[labels.length - 1] || "";
  if (SUSPICIOUS_TLDS.has(tld)) {
    findings.push(add("Suspicious domain suffix", "The hostname ends in the ." + tld + " suffix, which warrants additional verification.", 18));
  }

  if (parsed.username || parsed.password || /@/.test(rawHost)) {
    findings.push(add("URL credentials", "The URL authority contains an @ or embedded login information, which can disguise the real destination.", 28));
  }

  if (hostname.includes("xn--")) {
    findings.push(add("Punycode domain", "The hostname contains punycode encoding; inspect it carefully for lookalike characters.", 22));
  } else if (/[^\x00-\x7F]/.test(rawHost)) {
    findings.push(add("Unicode hostname", "The hostname contains non-ASCII characters that may visually resemble another domain.", 20));
  }

  if (labels.length > 4) {
    findings.push(add("Deeply nested hostname", "The hostname has many subdomains, making the actual registered domain harder to notice.", 12));
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || /^\[[0-9a-f:]+\]$/i.test(hostname)) {
    findings.push(add("IP address destination", "The link points directly to an IP address instead of a recognizable domain.", 12));
  }

  if (isPrivateHost(hostname)) {
    findings.push(add("Local or private destination", "The destination resolves to a local, private or link-local address and should not be opened from an untrusted message.", 30));
  }

  if (parsed.port && !["80", "443"].includes(parsed.port)) {
    findings.push(add("Suspicious URL port", "The URL uses the non-standard web port " + parsed.port + ".", 10));
  }

  if (raw.length > 160) {
    findings.push(add("Obfuscated destination", "The URL is unusually long, which can make its true destination harder to inspect.", 10));
  }

  const brand = Object.keys(TRUSTED_BRANDS).find((name) => hostname.includes(name));
  if (brand) {
    const trusted = TRUSTED_BRANDS[brand].some((domain) => hostname === domain || hostname.endsWith("." + domain));
    if (!trusted) {
      findings.push(add("Brand impersonation", "The hostname contains the name of " + brand + " but is not one of its known domains.", 26));
    }
  }

  if (/@/.test(parsed.pathname)) {
    findings.push(add("Obfuscated destination", "The URL path contains an @ character that may confuse a quick visual inspection.", 14));
  }

  if (/login|verify|secure|wallet|payment|kyc|bank|password|otp/i.test(parsed.pathname + parsed.search)) {
    findings.push(add("Credential/payment lure", "The URL path or query suggests login, verification, banking or payment activity.", 14));
  }

  return findings;
}

function extractUrls(text) {
  const candidates = String(text || "").match(
    /(?:https?:\/\/|www\.)[^\s<>"']+|(?:[a-z0-9-]+\.)+(?:com|in|net|org|co|io|xyz|top|info|online|site|app|dev)(?:\/[^\s<>"']*)?/gi
  ) || [];
  return [...new Set(candidates.map((item) => item.replace(/[),.;!?\]}]+$/g, "")))].slice(0, 8);
}

function analyzeMessage(text) {
  const findings = [];
  if (URGENCY.test(text)) findings.push(add("Urgency pressure", "The message uses time pressure or a threat to rush the recipient into acting.", 18));
  if (PAYMENT.test(text)) findings.push(add("Financial action", "The message mentions a payment, refund, bank or money-transfer action.", 18));
  if (SENSITIVE_DATA.test(text)) findings.push(add("Sensitive verification data", "The message references OTPs, PINs, CVVs or passwords. Never disclose these to another person.", 28));
  if (ACTION_REQUEST.test(text)) findings.push(add("Action request", "The recipient is asked to click, open, download, install, scan or run something.", 12));
  if (REWARD_LURE.test(text)) findings.push(add("Reward lure", "The message uses an unexpected prize, reward or cashback to encourage a response.", 16));
  if (AUTHORITY.test(text)) findings.push(add("Authority/account impersonation", "The message invokes an authority, delivery, service or account problem to gain trust or create pressure.", 14));

  const urls = extractUrls(text);
  for (const url of urls) {
    const urlFindings = analyzeUrl(url, { source: "Embedded link" });
    for (const finding of urlFindings) {
      findings.push(add("Embedded suspicious link", url + " — " + finding.signal + ": " + finding.evidence, Math.min(24, finding.weight)));
    }
  }

  if (/\b(?:send|share|reply with|provide)\b.{0,35}\b(?:aadhaar|pan card|account number|ifsc|date of birth)\b/i.test(text)) {
    findings.push(add("Sensitive data in message", "The message asks for identity or banking details. Verify the recipient and purpose independently.", 22));
  }

  return findings;
}

function analyzeCode(text) {
  const findings = [];
  let secretDetected = false;

  for (const item of SECRET_PATTERNS) {
    if (item.pattern.test(text)) {
      secretDetected = true;
      findings.push(add("Credential exposure", "A hard-coded " + item.label + " appears in the snippet. The detected value is intentionally redacted.", 30));
    }
  }

  if (!secretDetected && /\b(?:password|secret|api[_-]?key|access[_-]?token|authorization)\b/i.test(text)) {
    findings.push(add("Credential exposure", "The snippet references credentials or secret configuration. Confirm that no live value is committed.", 18));
  }

  for (const item of DANGEROUS_CODE) {
    if (item.pattern.test(text)) {
      findings.push(add("Dangerous execution pattern", "Potentially unsafe " + item.label + " was detected. Review the execution path and validate untrusted input.", 22));
    }
  }

  if (/https?:\/\/\S+/i.test(text) && /token|key|secret|password/i.test(text)) {
    findings.push(add("Secret in remote request", "A credential-related identifier appears alongside a remote request. Ensure secrets are not embedded in URLs or client-side code.", 18));
  }

  if (/http:\/\//i.test(text)) {
    findings.push(add("Insecure HTTP", "The snippet contains a non-encrypted HTTP endpoint.", 14));
  }

  if (/rejectUnauthorized\s*:\s*false|verify\s*[:=]\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0/i.test(text)) {
    findings.push(add("TLS verification disabled", "TLS certificate verification appears to be disabled, exposing connections to interception.", 26));
  }

  return findings;
}

function recommendationsFor(level, findings) {
  const recommendations = [];
  if (level === "HIGH") {
    recommendations.push("Do not click, pay, execute or share credentials based on this content.");
    recommendations.push("Verify the sender and destination through an official app, saved contact or website you open yourself.");
  } else if (level === "MEDIUM") {
    recommendations.push("Pause and independently verify the request before taking action.");
    recommendations.push("Do not disclose OTPs, PINs, CVVs, passwords or recovery codes.");
  } else {
    recommendations.push("No strong warning pattern matched the current rules. This is not proof that the content is safe.");
  }

  if (findings.some((finding) => finding.signal === "Credential exposure")) {
    recommendations.push("Remove the exposed value, rotate the affected credential and review recent usage.");
  }
  if (findings.some((finding) => finding.signal === "Local or private destination")) {
    recommendations.push("Do not open internal or private network addresses from untrusted content.");
  }
  if (findings.some((finding) => finding.signal === "Embedded suspicious link" || finding.signal === "URL shortener" || finding.signal === "Brand impersonation")) {
    recommendations.push("Navigate to the organization by typing its known address rather than using the supplied link.");
  }
  if (findings.some((finding) => finding.signal === "Sensitive verification data")) {
    recommendations.push("Never share an OTP or PIN with a caller, message sender or support agent.");
  }

  return [...new Set(recommendations)];
}

export function analyze(input, type) {
  if (!["url", "message", "code"].includes(type)) {
    throw new Error("Unsupported analysis type. Choose url, message or code.");
  }

  if (typeof input !== "string") {
    throw new Error("Input must be plain text.");
  }

  const text = input.trim();
  if (!text) throw new Error("Input is required.");
  if (text.length > 5000) throw new Error("Input is limited to 5,000 characters.");

  let findings = [];
  if (type === "url") findings = analyzeUrl(text);
  if (type === "message") findings = analyzeMessage(text);
  if (type === "code") findings = analyzeCode(text);

  const deduped = uniqueFindings(findings);
  const score = Math.max(0, Math.min(100, Math.round(8 + deduped.reduce((sum, finding) => sum + finding.weight, 0))));
  const level = score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
  const categories = [...new Set(deduped.map((finding) => finding.category))];
  const summary = level === "HIGH"
    ? "Several high-impact warning signals were detected. Stop and verify before proceeding."
    : level === "MEDIUM"
      ? "Some suspicious patterns were detected. Pause and verify the content independently."
      : "No strong warning pattern matched the current rules. Continue to use normal caution.";

  return {
    score,
    level,
    findings: deduped,
    recommendations: recommendationsFor(level, deduped),
    checkedAt: new Date().toISOString(),
    engine: "VibeX Rules Engine v2",
    categories,
    summary,
    inputType: type,
    analyzedItems: type === "message" ? extractUrls(text).length : 1,
  };
}
