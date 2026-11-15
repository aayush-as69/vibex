const URL_SHORTENERS=["bit.ly","tinyurl.com","t.co","is.gd","cutt.ly","rb.gy","shorturl.at"];
const SUSPICIOUS_TLDS=[".xyz",".top",".tk",".ml",".ga",".cf",".gq"];
const TRUSTED_BRANDS=["paypal","google","microsoft","apple","amazon","sbi","hdfc","icici","axis","flipkart","amazon","whatsapp"];
const SHORTENER_PATTERN=/^(?:www\.)?(?:bit\.ly|tinyurl\.com|t\.co|is\.gd|cutt\.ly|rb\.gy|shorturl\.at)$/i;
const URGENCY=["urgent","immediately","within 24 hours","account will be blocked","act now","last warning"];
const PAYMENT=["upi","collect request","payment","refund","bank account","credit card","gift card","transfer","otp","cvv","pin"];
const CREDENTIALS=["password","api key","api_key","secret","access token","private key","authorization"];
const DANGEROUS_CODE=["eval(","exec(","child_process","shell=true","shell=True","os.system","subprocess.run","rm -rf","document.cookie","innerhtml"];
const add=(signal,evidence,weight)=>({signal,evidence,weight});
const unique=items=>[...new Map(items.map(x=>[x.signal,x])).values()];
const clamp=n=>Math.max(0,Math.min(100,Math.round(n)));
export function analyze(input,type){
 const text=String(input||"").trim();
 if(!text) throw new Error("Input is required.");
 if(text.length>5000) throw new Error("Input is limited to 5,000 characters.");
 const lower=text.toLowerCase(); let findings=[];
 if(type==="url"){
  if(SHORTENER_PATTERN.test(lower.replace(/^https?:\/\//,"").split("/")[0])) findings.push(add("URL shortener","Shortened links hide the final destination and deserve extra verification.",25));
  let parsed=null; try{parsed=new URL(text.startsWith("http")?text:"https://"+text);}catch{}
  if(!parsed) findings.push(add("Invalid URL","The supplied value could not be parsed as a normal web address.",35));
  if(parsed&&parsed.protocol!=="https:") findings.push(add("No HTTPS","The address does not use HTTPS.",22));
  if(parsed&&URL_SHORTENERS.some(x=>parsed.hostname===x||parsed.hostname.endsWith("."+x))) findings.push(add("URL shortener","Shortened links hide the final destination and deserve extra verification.",25));
  if(parsed&&/[\u0000-\u001f\s]/.test(text)) findings.push(add("Malformed URL","Whitespace or control characters make this address unusual and harder to verify.",22));
  if(parsed&&parsed.hostname.split(".").length>4) findings.push(add("Deeply nested hostname","The hostname uses many subdomains, which can obscure the actual registrable domain.",14));
  if(parsed&&/^(?:localhost|127\.0\.0\.1|0\.0\.0\.0|169\.254\./i.test(parsed.hostname)) findings.push(add("Local or link-local destination","The address points to a local or link-local host rather than a normal public destination.",30));
  if(parsed&&/[\u202E\u202D\u2066-\u2069]/.test(text)) findings.push(add("Bidirectional text obfuscation","The address contains Unicode direction-control characters that can disguise what is displayed.",32));
  if(parsed&&TRUSTED_BRANDS.some(b=>lower.includes(b))&&!TRUSTED_BRANDS.some(b=>parsed.hostname.replace(/^www\./,"").endsWith(b+".com"))) findings.push(add("Brand impersonation","A familiar brand name appears in the address without a matching trusted domain.",24));
  if(parsed&&SUSPICIOUS_TLDS.some(x=>parsed.hostname.endsWith(x))) findings.push(add("Suspicious domain suffix","The domain uses a TLD frequently seen in abuse reports.",24));
  if(parsed&&/@/.test(parsed.pathname)) findings.push(add("Obfuscated destination","The URL contains an @ character that can make a destination confusing.",28));
  if(parsed&&/xn--/.test(parsed.hostname)) findings.push(add("Punycode domain","The hostname contains internationalized encoding that can be used for lookalike domains.",25));
  if(parsed&&/login|verify|secure|wallet|payment|kyc|bank/i.test(parsed.pathname+parsed.search)) findings.push(add("Credential/payment lure","The URL path suggests a login, verification or payment action.",20));
 } else if(type==="message"){
  if(URGENCY.some(x=>lower.includes(x))) findings.push(add("Urgency pressure","The message tries to rush the recipient into acting before they can verify it.",20));
  if(PAYMENT.some(x=>lower.includes(x))) findings.push(add("Financial action","The message asks for or references money, UPI, banking or payment credentials.",22));
  if(/otp|cvv|pin|mpin/.test(lower)) findings.push(add("Sensitive verification data","Legitimate support should not ask you to disclose OTPs, PINs or CVVs.",30));
  if(/click|tap|open|download|install|scan/.test(lower)) findings.push(add("Action request","The recipient is pushed to click, download, install or scan something.",15));
  if(/winner|prize|lottery|cashback|reward|free gift/.test(lower)) findings.push(add("Reward lure","Unexpected rewards are a common social-engineering hook.",18));
  if(/police|customs|income tax|kyc|parcel|electricity|sim|account/.test(lower)) findings.push(add("Authority/account impersonation","The message invokes an authority, delivery or account problem to create pressure.",16));
 } else if(type==="code"){
  if(CREDENTIALS.some(x=>lower.includes(x))) findings.push(add("Credential exposure","The snippet appears to contain or reference a secret, credential or authorization value.",28));
  if(DANGEROUS_CODE.some(x=>lower.includes(x))) findings.push(add("Dangerous execution pattern","The code contains a pattern that can execute commands, scripts or browser data.",30));
  if(/https?:\/\/\S+/.test(text)&&/token|key|secret|password/i.test(text)) findings.push(add("Secret in remote request","A credential-like value appears alongside an outbound request.",24));
  if(/http:\/\//.test(lower)) findings.push(add("Insecure HTTP","The code contains a non-encrypted HTTP endpoint.",14));
  if(/disable.*ssl|verify=false|rejectunauthorized.*false/i.test(lower)) findings.push(add("TLS verification disabled","Certificate validation appears to be disabled.",25));
 } else throw new Error("Unsupported analysis type.");
 const deduped=unique(findings);
 const score=clamp(12+deduped.reduce((sum,x)=>sum+x.weight,0));
 const level=score>=70?"HIGH":score>=40?"MEDIUM":"LOW";
 const recommendations=level==="HIGH"?["Do not click, pay, execute or share credentials.","Verify the request using a trusted channel you opened yourself.","If money or credentials were exposed, contact the relevant provider immediately."]:level==="MEDIUM"?["Pause before acting and verify the sender or destination independently.","Do not share OTPs, PINs, CVVs or passwords.","Use an official app or website instead of a message link."]:["No obvious high-risk pattern was detected.","Still verify unexpected requests before sharing money or sensitive information."];
 const categoryMap={"Urgency pressure":"Social engineering","Financial action":"Financial fraud","Sensitive verification data":"Credential theft","Action request":"Social engineering","Reward lure":"Social engineering","Authority/account impersonation":"Impersonation","Credential/payment lure":"Credential theft","Brand impersonation":"Impersonation","URL shortener":"Link obfuscation","Suspicious domain suffix":"Domain reputation","Punycode domain":"Domain obfuscation","Obfuscated destination":"URL obfuscation","Deeply nested hostname":"URL obfuscation","Malformed URL":"URL obfuscation","Local or link-local destination":"Network targeting","Bidirectional text obfuscation":"URL obfuscation","No HTTPS":"Transport security","Insecure HTTP":"Transport security","Credential exposure":"Secret exposure","Dangerous execution pattern":"Code execution","Secret in remote request":"Secret exposure","TLS verification disabled":"Transport security","Invalid URL":"Input validation"};
const categories=[...new Set(deduped.map(f=>categoryMap[f.signal]||"Security signal"))];
const confidence=deduped.length===0?62:Math.min(99,58+deduped.length*8+deduped.filter(f=>f.weight>=25).length*5);
const summary=level==="HIGH"?"Multiple high-impact signals suggest you should stop and verify independently.":level==="MEDIUM"?"Several warning signals were detected. Pause and verify before taking action.":"No obvious high-risk pattern matched the current defensive rules.";
return {score,level,findings:deduped,recommendations,checkedAt:new Date().toISOString(),engine:"VibeX Rules Engine v1",confidence,categories,summary,inputType:type};
}