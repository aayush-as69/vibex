(() => {
  "use strict";
  const THRESHOLD = 35;
  const SHORTENERS = new Set(["bit.ly","tinyurl.com","t.co","is.gd","cutt.ly","rb.gy","shorturl.at","rebrand.ly","lnkd.in"]);
  const RISKY_TLDS = new Set(["xyz","top","tk","ml","ga","cf","gq","click","support"]);
  const BRANDS = {
    paypal:["paypal.com"], google:["google.com","google.co.in"],
    microsoft:["microsoft.com","live.com","office.com"], apple:["apple.com","icloud.com"],
    amazon:["amazon.com","amazon.in"], sbi:["sbi.co.in","onlinesbi.sbi"],
    hdfc:["hdfcbank.com"], icici:["icicibank.com"], axis:["axisbank.com"],
    flipkart:["flipkart.com"], whatsapp:["whatsapp.com"]
  };
  let warningOpen = false;

  function privateHost(host) {
    const value = String(host || "").toLowerCase().replace(/^\[|\]$/g,"");
    if (value === "localhost" || value.endsWith(".localhost") || value.endsWith(".local") || value === "::1" || value === "0.0.0.0") return true;
    const parts = value.split(".");
    if (parts.length !== 4 || !parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)) return false;
    const a = Number(parts[0]), b = Number(parts[1]);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }

  function inspect(raw) {
    let url;
    try { url = new URL(raw, location.href); } catch { return {score:0,level:"LOW",reasons:[],url:String(raw)}; }
    if (url.protocol !== "http:" && url.protocol !== "https:") return {score:0,level:"LOW",reasons:[],url:url.href};
    const host = url.hostname.toLowerCase().replace(/^www\./,"");
    const labels = host.split(".");
    const reasons = [];
    let score = 0;
    const add = (points,reason) => { score += points; reasons.push(reason); };
    if (url.protocol !== "https:") add(15,"This link does not use encrypted HTTPS.");
    if (SHORTENERS.has(host)) add(24,"A URL shortener hides the final destination.");
    if (RISKY_TLDS.has(labels[labels.length - 1])) add(24,"The domain uses a suffix that deserves extra verification.");
    if (url.username || url.password || /@/.test(url.host)) add(28,"The URL contains embedded credentials or an @ sign.");
    if (host.includes("xn--")) add(22,"The hostname uses punycode and may disguise lookalike characters.");
    else if (/[^\x00-\x7F]/.test(host)) add(20,"The hostname contains non-ASCII characters.");
    if (labels.length > 4) add(12,"The hostname has several nested subdomains.");
    if (privateHost(host)) add(30,"The destination is a local or private network address.");
    if (url.port && !["80","443"].includes(url.port)) add(10,"The link uses a non-standard web port.");
    if (/login|verify|secure|wallet|payment|kyc|bank|password|otp/i.test(url.pathname + url.search)) add(15,"The path suggests a login, verification, banking or payment action.");
    const brand = Object.keys(BRANDS).find((name) => new RegExp("(?:^|[.-])" + name + "(?:[.-]|$)").test(host));
    if (brand && !BRANDS[brand].some((domain) => host === domain || host.endsWith("." + domain))) add(28,"The hostname uses the name of " + brand + " but is not one of its known domains.");
    score = Math.min(100,score);
    return {score,level:score >= 70 ? "HIGH" : score >= THRESHOLD ? "MEDIUM" : "LOW",reasons:[...new Set(reasons)],url:url.href};
  }

  function element(tag,className,text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }

  function showWarning(result,newTab) {
    if (warningOpen) return;
    warningOpen = true;
    const host = document.createElement("div");
    host.id = "vibex-shield-warning-host";
    const shadow = host.attachShadow({mode:"open"});
    const style = element("style");
    style.textContent = ":host{all:initial}.overlay{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:20px;background:rgba(1,8,12,.8);backdrop-filter:blur(8px);font-family:Inter,system-ui,sans-serif;color:#e8f3f5}.dialog{width:min(520px,100%);background:#07151b;border:1px solid #81464b;border-radius:18px;padding:25px;box-shadow:0 28px 90px #000b}.top{color:#ff9a9a;font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.dialog h2{margin:16px 0 8px;font-size:23px;color:#f7ffff}.dialog p{color:#a5b8bd;font-size:14px;line-height:1.6}.score{display:inline-block;margin:10px 0;padding:7px 11px;border:1px solid #7a4449;border-radius:99px;background:#271418;color:#ffaaaa;font-size:12px;font-weight:900}.destination{overflow-wrap:anywhere;padding:11px;background:#040b0f;border:1px solid #233b42;border-radius:9px;color:#c4d6db;font-size:12px}.reasons{padding-left:20px;color:#d3e0e3;font-size:13px;line-height:1.6}.actions{display:flex;justify-content:flex-end;gap:9px;flex-wrap:wrap}.actions button{border-radius:10px;padding:11px 15px;font-size:13px;font-weight:900;cursor:pointer}.back{border:1px solid #35545c;background:#10232a;color:#dcebed}.continue{border:1px solid #9b5359;background:#351b20;color:#ffd9d9}.foot{font-size:11px!important;color:#70868d!important}.actions button:focus-visible{outline:2px solid #7cf0df;outline-offset:3px}@media(max-width:480px){.dialog{padding:19px}.actions{flex-direction:column-reverse}.actions button{width:100%}}";
    const overlay = element("div","overlay");
    const dialog = element("section","dialog");
    dialog.setAttribute("role","alertdialog");
    dialog.setAttribute("aria-modal","true");
    const heading = element("div","top","⚠ VibeX Shield · Automatic link guard");
    const title = element("h2","","Stop. This link may be unsafe.");
    const intro = element("p","","A local check found warning signs before opening this destination. Do not enter passwords, OTPs, UPI PINs or payment details.");
    const score = element("div","score",result.level + " RISK · " + result.score + "/100");
    const destination = element("div","destination",result.url);
    const list = element("ul","reasons");
    result.reasons.forEach((reason) => list.append(element("li","",reason)));
    const actions = element("div","actions");
    const back = element("button","back","Go back");
    const proceed = element("button","continue","Continue anyway");
    back.type = "button";
    proceed.type = "button";
    actions.append(back,proceed);
    const foot = element("p","foot","This check runs on your device. Browsing history is not sent to VibeX.");
    dialog.append(heading,title,intro,score,destination,list,actions,foot);
    overlay.append(dialog);
    shadow.append(style,overlay);
    (document.documentElement || document.body).append(host);
    const close = () => { host.remove(); warningOpen = false; };
    back.addEventListener("click",close);
    proceed.addEventListener("click",() => {
      close();
      if (newTab) window.open(result.url,"_blank","noopener,noreferrer");
      else window.location.assign(result.url);
    });
    overlay.addEventListener("keydown",(event) => { if (event.key === "Escape") close(); });
    back.focus();
  }

  function scanAnchor(anchor) {
    if (!(anchor instanceof HTMLAnchorElement)) return;
    const result = inspect(anchor.href);
    if (result.score >= THRESHOLD) {
      anchor.classList.add("vibex-shield-risk-link");
      anchor.dataset.vibexRisk = result.level.toLowerCase();
      anchor.title = "VibeX Shield warning: " + result.level + " risk. Click to review.";
    } else {
      anchor.classList.remove("vibex-shield-risk-link");
      delete anchor.dataset.vibexRisk;
    }
  }

  function scanNode(root) {
    if (!root || (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE)) return;
    if (root instanceof HTMLAnchorElement) scanAnchor(root);
    if (root.querySelectorAll) root.querySelectorAll("a[href]").forEach(scanAnchor);
  }

  function start() {
    if (!document.documentElement) return;
    scanNode(document.documentElement);
    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach(scanNode);
        if (record.type === "attributes" && record.target instanceof HTMLAnchorElement) scanAnchor(record.target);
      });
    });
    observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["href"]});
  }

  document.addEventListener("click",(event) => {
    if (!(event.target instanceof Element)) return;
    const anchor = event.target.closest("a[href]");
    if (!anchor || anchor.hasAttribute("download")) return;
    const result = inspect(anchor.href);
    if (result.score < THRESHOLD) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    showWarning(result,anchor.target === "_blank" || event.ctrlKey || event.metaKey || event.shiftKey);
  },true);

  if (document.documentElement) start();
  else document.addEventListener("DOMContentLoaded",start,{once:true});
})();