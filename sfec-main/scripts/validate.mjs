import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const required=[
  'src/index.js','src/auth.js','src/public.js','src/admin.js','src/me.js','src/utils.js','src/email.js','src/permissions.js',
  'public/index.html','public/app.js','public/styles.css','public/sw.js','public/manifest.webmanifest',
  'migrations/0001_schema.sql','migrations/0002_seed.sql','migrations/0004_ui_portal_polish.sql','migrations/0011_email_automation_center.sql','wrangler.jsonc','docs/EMAIL_EVENT_MAP.md'
];
let ok=true;
for(const f of required){if(!fs.existsSync(path.join(root,f))){console.error('MISSING',f);ok=false;}}
for(const f of [...fs.readdirSync(path.join(root,'src')).filter(x=>x.endsWith('.js')).map(x=>'src/'+x),'public/app.js','public/sw.js']){
  const r=spawnSync(process.execPath,['--check',path.join(root,f)],{encoding:'utf8'});
  if(r.status!==0){console.error('JS SYNTAX FAIL',f,r.stderr);ok=false;}
}
const publicText=['public/index.html','public/app.js','public/styles.css'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
for(const bad of ['Enhanced V2','bản xem trước','mô phỏng Dashboard','test password']){
  if(publicText.toLowerCase().includes(bad.toLowerCase())){console.error('PUBLIC PREVIEW TEXT FOUND:',bad);ok=false;}
}
const adminSource=fs.readFileSync(path.join(root,'src/admin.js'),'utf8');
const publicSource=fs.readFileSync(path.join(root,'src/public.js'),'utf8');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const requiredChecks=[
  [adminSource.includes('if(p==="/api/admin/certificates"&&request.method==="POST")')&&adminSource.includes('return json({error:"ISSUANCE_NOT_AUTHORIZED"'),'SFEC certificate creation must be blocked'],
  [adminSource.includes('SFEC chỉ được tra cứu thông tin GCN'),'SFEC certificate mutation must be blocked'],
  [publicSource.includes('https://ctt.skyfirst.io.vn/api/lookup/certificate?code='),'Public lookup must query authoritative CTT registry'],
  [!html.includes('>Quản trị</button>'),'Public header must not expose a Quản trị menu item'],
  [!publicText.includes('Tải GCN')&&!publicText.includes('Tải xuống GCN'),'Public UI must not offer GCN download'],
  [!(/\b(prompt|confirm|alert)\s*\(/.test(publicText)),'Public/admin UI must not use native browser prompt/confirm/alert'],
  [fs.readFileSync(path.join(root,'public/app.js'),'utf8').includes('sfec-cms-draft:'),'CMS local draft recovery must exist'],
  [fs.readFileSync(path.join(root,'public/app.js'),'utf8').includes('cms-fullscreen-mode'),'CMS fullscreen mode must exist']
];
for(const [pass,message] of requiredChecks){if(!pass){console.error('REQUIREMENT CHECK FAILED:',message);ok=false;}}
const firstPath=path.join(root,'FIRST_LOGIN_SUPER_ADMIN.txt');
if(fs.existsSync(firstPath)){
  const first=fs.readFileSync(firstPath,'utf8');
  if(publicText.includes(first.match(/Temporary password: (.+)/)?.[1]||'__never__')){console.error('TEMP PASSWORD LEAKED INTO PUBLIC');ok=false;}
}
const wr=fs.readFileSync(path.join(root,'wrangler.jsonc'),'utf8');
if(wr.includes('REPLACE_WITH_YOUR_D1_DATABASE_ID')) console.warn('NOTE: Điền D1 database_id trước khi deploy.');
if(ok){console.log('SFEC Production Master validation: OK');process.exit(0)}
process.exit(1);
