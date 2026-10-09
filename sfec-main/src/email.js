import {renderTemplate, escapeHtml} from "./utils.js";

const SENSITIVE_TEMPLATES = new Set(["account_invite", "verify_email", "password_reset"]);
const MAX_RETRY_BYTES = 24000;

function normalizeEmailHtml(html="") {
  const base = String(html || "");
  if (/<body\b[^>]*style=/i.test(base)) {
    return base.replace(/<body\b([^>]*)style=(['"])(.*?)\2([^>]*)>/i, (all, before, quote, style, after) => {
      const cleaned = style.replace(/font-family\s*:[^;]+;?/ig, "").trim().replace(/;?\s*$/, ";");
      return `<body${before}style=${quote}${cleaned}font-family:'Times New Roman',Times,serif;${quote}${after}>`;
    });
  }
  if (/<html\b/i.test(base)) {
    return base.replace(/<body\b([^>]*)>/i, `<body$1 style="font-family:'Times New Roman',Times,serif;">`)
      .replace(/<table\b/ig, `<table style="font-family:'Times New Roman',Times,serif;"`);
  }
  return `<div style="font-family:'Times New Roman',Times,serif;color:#102b52;line-height:1.65">${base}</div>`;
}

async function logEmail(env, to, templateKey, subject, status, messageId="", error="", retryPayload=null, retryCount=0) {
  try {
    const json = retryPayload ? JSON.stringify(retryPayload) : null;
    const inserted=await env.DB.prepare("INSERT INTO email_logs(to_email,template_key,subject,status,provider_message_id,error) VALUES(?,?,?,?,?,?)")
      .bind(to, templateKey||"", subject||"", status, messageId||"", String(error||"").slice(0,1500)).run();
    const logId=inserted?.meta?.last_row_id;
    if(logId && json && json.length <= MAX_RETRY_BYTES && ["failed","pending"].includes(status)) {
      await env.DB.prepare("INSERT INTO email_retry_payloads(email_log_id,payload_json,retry_count) VALUES(?,?,?) ON CONFLICT(email_log_id) DO UPDATE SET payload_json=excluded.payload_json,retry_count=excluded.retry_count")
        .bind(logId,json,Number(retryCount)||0).run();
    }
  } catch (err) {
    // Keep delivery result authoritative even if audit logging is temporarily unavailable.
    console.error("SFEC_EMAIL_LOG_FAILED", String(err?.message || err).slice(0,300));
  }
}

export async function sendEmail(env,{to,subject,html,text,templateKey="",retryCount=0,allowRetryPayload=true}) {
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(to))) return {ok:false,error:"INVALID_RECIPIENT"};
  const safeHtml = normalizeEmailHtml(html);
  const payload = (allowRetryPayload && !SENSITIVE_TEMPLATES.has(templateKey) && safeHtml.length + String(text||"").length <= MAX_RETRY_BYTES)
    ? {to:String(to),subject:String(subject||""),html:safeHtml,text:String(text||""),templateKey:String(templateKey||"")}
    : null;
  try {
    const preference=await readSetting(env,"email_provider_preference","auto");
    const replyTo=await readSetting(env,"email_reply_to","");
    const senderName=await readSetting(env,"email_sender_name","Câu lạc bộ Giáo dục Sky First (SFEC)");
    const configuredFrom=env.MAIL_FROM||"SFEC · Sky First Education Club <sfec@skyfirst.io.vn>";
    const addressMatch=configuredFrom.match(/<([^<>]+)>/);
    const from=`${senderName} <${addressMatch?addressMatch[1]:"sfec@skyfirst.io.vn"}>`;
    const useResend=!!env.RESEND_API_KEY && preference!=="cloudflare";
    const useCloudflare=!!env.EMAIL?.send && preference!=="resend";
    if (useResend) {
      const r = await fetch("https://api.resend.com/emails", {
        method:"POST",
        headers:{"content-type":"application/json","authorization":`Bearer ${env.RESEND_API_KEY}`},
        body:JSON.stringify({from,to:[to],subject,html:safeHtml,text,...(replyTo?{reply_to:replyTo}:{})})
      });
      const data = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data?.message||`Resend HTTP ${r.status}`);
      await logEmail(env,to,templateKey,subject,"sent",data?.id||"","",null,retryCount);
      return {ok:true,id:data?.id||""};
    }
    if (useCloudflare) {
      const result = await env.EMAIL.send({to,from,subject,html:safeHtml,text,...(replyTo?{replyTo}:{})});
      await logEmail(env,to,templateKey,subject,"sent",result?.messageId||"","",null,retryCount);
      return {ok:true,id:result?.messageId||""};
    }
    await logEmail(env,to,templateKey,subject,"pending","","Email provider chưa được cấu hình.",payload,retryCount);
    return {ok:false,pending:true,error:"EMAIL_PROVIDER_NOT_CONFIGURED"};
  } catch(err) {
    await logEmail(env,to,templateKey,subject,"failed","",err?.message||String(err),payload,retryCount);
    return {ok:false,error:err?.message||String(err)};
  }
}

export async function sendTemplatedEmail(env,key,to,vars={}) {
  const row=await env.DB.prepare("SELECT * FROM email_templates WHERE key=? AND enabled=1").bind(key).first();
  if(!row) return {ok:false,error:"TEMPLATE_NOT_FOUND"};
  try {
    const config=await env.DB.prepare("SELECT recipient_mode,recipient_override FROM email_template_config WHERE template_key=?").bind(key).first();
    if(config?.recipient_mode==="internal") to=await readSetting(env,"email_internal_alert_recipient","sfec@skyfirst.io.vn");
    if(config?.recipient_mode==="override" && config.recipient_override) to=config.recipient_override;
  } catch {}
  return sendEmail(env,{to,templateKey:key,subject:renderTemplate(row.subject_template,vars),html:renderTemplate(row.html_template,vars),text:renderTemplate(row.text_template||"",vars)});
}

async function readSetting(env,key,fallback="") {
  try { const row=await env.DB.prepare("SELECT value_json FROM settings WHERE key=?").bind(key).first(); return row?JSON.parse(row.value_json):fallback; } catch { return fallback; }
}

export async function getEmailProviderStatus(env) {
  const preference=await readSetting(env,"email_provider_preference","auto");
  const useResend=!!env.RESEND_API_KEY && preference!=="cloudflare";
  const useCloudflare=!!env.EMAIL?.send && preference!=="resend";
  const configured=useResend||useCloudflare;
  return {
    configured,
    provider:useResend?"Resend":useCloudflare?"Cloudflare Email Service":"Chưa cấu hình",
    providerPreference:preference,
    senderName:await readSetting(env,"email_sender_name","Câu lạc bộ Giáo dục Sky First (SFEC)"),
    replyTo:await readSetting(env,"email_reply_to","sfec@skyfirst.io.vn"),
    internalRecipient:await readSetting(env,"email_internal_alert_recipient","sfec@skyfirst.io.vn"),
    from:env.MAIL_FROM||"sfec@skyfirst.io.vn"
  };
}

export async function listEmailLogs(env,limit=300) {
  const safeLimit=Math.max(1,Math.min(1000,Number(limit)||300));
  const rs=await env.DB.prepare(`SELECT l.id,l.to_email,l.template_key,l.subject,l.status,l.provider_message_id,l.error,l.created_at,COALESCE(r.retry_count,0) AS retry_count,CASE WHEN r.payload_json IS NOT NULL THEN 1 ELSE 0 END AS retryable FROM email_logs l LEFT JOIN email_retry_payloads r ON r.email_log_id=l.id ORDER BY l.id DESC LIMIT ${safeLimit}`).all();
  return rs.results||[];
}

export async function sendTemplateTestEmail(env,{key,templateKey,to}) {
  key=key||templateKey;
  if(!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(to))) return {ok:false,error:"INVALID_RECIPIENT"};
  const row=await env.DB.prepare("SELECT * FROM email_templates WHERE key=?").bind(key).first();
  if(!row) return {ok:false,error:"TEMPLATE_NOT_FOUND"};
  const vars={full_name:"Người nhận thử nghiệm",email:to,code:"SFEC-TEST-0001",form_name:"Thông báo thử nghiệm",class_title:"Lớp học mẫu",event_title:"Hoạt động mẫu",event_time:"Thời gian thử nghiệm",status:"Thử nghiệm",ticket_code:"SFEC-TEST",submission_code:"SFEC-TEST-0001",scheduled_at:"Thời gian sẽ được cập nhật",meeting_url:"",notes:"Đây là email thử nghiệm; không phải thông báo nghiệp vụ thật.",message:"Đây là email thử nghiệm; không phải thông báo nghiệp vụ thật.",link:"https://sfec.skyfirst.io.vn/",note:"Đây là email thử nghiệm.",reference:"SFEC-TEST-0001",action:"Kiểm tra mẫu",alert_title:"Email thử nghiệm",occurred_at:new Date().toISOString(),answers_table:"",answers_text:"",note_block:""};
  const subject=`[THỬ EMAIL] ${renderTemplate(row.subject_template,vars)}`;
  const html=`<div style="font-family:'Times New Roman',Times,serif;background:#f1f6ff;padding:20px"><p style="color:#0879d9;font-weight:bold">EMAIL THỬ NGHIỆM SFEC</p>${renderTemplate(row.html_template,vars)}<p style="color:#526783;font-size:12px">Thư kiểm tra mẫu, không phải thông báo nghiệp vụ thật.</p></div>`;
  return sendEmail(env,{to,subject,html,text:`EMAIL THỬ NGHIỆM SFEC\n${renderTemplate(row.text_template||"",vars)}\nĐây là email thử nghiệm.`,templateKey:`test:${key}`});
}

export async function retryEmailLog(env,id) {
  const row=await env.DB.prepare("SELECT l.*,r.payload_json AS retry_payload_json,r.retry_count FROM email_logs l LEFT JOIN email_retry_payloads r ON r.email_log_id=l.id WHERE l.id=?").bind(Number(id)).first();
  if(!row) return {ok:false,error:"EMAIL_LOG_NOT_FOUND"};
  if(!["failed","pending"].includes(row.status)) return {ok:false,error:"EMAIL_LOG_NOT_RETRYABLE"};
  if(Number(row.retry_count||0)>=3) return {ok:false,status:"failed",error:"RETRY_LIMIT_REACHED"};
  if(!row.retry_payload_json) return {ok:false,status:"failed",error:"RETRY_PAYLOAD_NOT_AVAILABLE"};
  let payload;try{payload=JSON.parse(row.retry_payload_json)}catch{return {ok:false,status:"failed",error:"RETRY_PAYLOAD_INVALID"}}
  await env.DB.prepare("UPDATE email_retry_payloads SET retry_count=COALESCE(retry_count,0)+1 WHERE email_log_id=?").bind(Number(id)).run();
  const nextRetry=Number(row.retry_count||0)+1;
  const result=await sendEmail(env,{...payload,retryCount:nextRetry,allowRetryPayload:nextRetry<3});
  return {...result,status:result.ok?"sent":result.pending?"pending":"failed"};
}

export function answersToEmail(answers={}) {
  const rows=[],text=[];
  for(const [k,v] of Object.entries(answers)) {
    const value=Array.isArray(v)?v.join(", "):typeof v==="object"?JSON.stringify(v):String(v??"");
    rows.push(`<tr><td style="padding:7px;border:1px solid #d8e1ec"><b>${escapeHtml(k)}</b></td><td style="padding:7px;border:1px solid #d8e1ec">${escapeHtml(value)}</td></tr>`);
    text.push(`${k}: ${value}`);
  }
  return {answers_table:`<table style="border-collapse:collapse;width:100%;font-family:'Times New Roman',Times,serif">${rows.join("")}</table>`,answers_text:text.join("\n")};
}
