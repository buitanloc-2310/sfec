
const app=document.getElementById("app");
const modalRoot=document.getElementById("modalRoot");
const accountBtn=document.getElementById("accountBtn");
const themeBtn=document.getElementById("themeBtn");
const navMenu=document.querySelector(".nav");
const mobileMenu=document.getElementById("mobileMenu");

const state={
  config:null,user:null,portal:null,forms:{},admin:{},
  currentForm:null,turnstileToken:"",formBuilder:null
};

const E=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
const J=x=>{try{return typeof x==="string"?JSON.parse(x):x}catch{return {}}};
const fmt=d=>d?new Date(d).toLocaleString("vi-VN"):"—";
const rolesOf=u=>(u?.roles||[]).map(r=>r.role_id);
const isAdmin=u=>(u?.roles||[]).some(r=>Number(r.level)>=40||["super_admin","system_admin","club_secretary","office","hr","communications","external_events","unit_admin","handler"].includes(r.role_id));
const isSFNGovernanceAdmin=u=>(u?.roles||[]).some(r=>["super_admin","system_admin"].includes(r.role_id));
const isMember=u=>(u?.roles||[]).some(r=>["member","volunteer","handler","unit_admin","communications","external_events","hr","office","club_secretary","system_admin","super_admin"].includes(r.role_id));

async function api(path,options={}){
  const o={credentials:"same-origin",...options,headers:{...(options.headers||{})}};
  if(o.body&&!(o.body instanceof FormData)&&typeof o.body!=="string"){
    o.headers["content-type"]="application/json";o.body=JSON.stringify(o.body);
  }
  const r=await fetch(path,o);
  const ct=r.headers.get("content-type")||"";
  const data=ct.includes("application/json")?await r.json():await r.text();
  if(!r.ok){const err=new Error(data?.error||data?.message||`HTTP ${r.status}`);err.data=data;err.status=r.status;throw err}
  return data;
}

function toast(msg,type="good"){
  const el=document.createElement("div");
  el.className=`notice ${type}`;
  el.style.cssText="position:fixed;right:18px;bottom:18px;z-index:200;max-width:420px;box-shadow:0 15px 50px #0003";
  el.innerHTML=E(msg);document.body.appendChild(el);setTimeout(()=>el.remove(),4200);
}
function modal(html){
  modalRoot.innerHTML=`<div class="modal-bg" id="modalBg"><div class="modal">${html}</div></div>`;
  document.getElementById("modalBg").addEventListener("click",e=>{if(e.target.id==="modalBg")closeModal()});
}
function closeModal(){modalRoot.innerHTML=""}
window.closeModal=closeModal;
function askText(title,initial="",multiline=false){
  return new Promise(resolve=>{
    let settled=false;const finish=value=>{if(settled)return;settled=true;modalRoot.innerHTML="";resolve(value)};
    modalRoot.innerHTML=`<div class="modal-bg" id="askBg"><div class="modal ask-modal" role="dialog" aria-modal="true" aria-labelledby="askTitle"><h2 id="askTitle">${E(title)}</h2><form id="askForm"><div class="field">${multiline?`<textarea id="askValue" rows="5">${E(initial)}</textarea>`:`<input id="askValue" value="${E(initial)}" autocomplete="off">`}</div><div class="actions"><button class="primary" type="submit">Xác nhận</button><button class="secondary" type="button" id="askCancel">Hủy</button></div></form></div></div>`;
    const bg=document.getElementById('askBg'),form=document.getElementById('askForm'),input=document.getElementById('askValue');
    form.addEventListener('submit',e=>{e.preventDefault();finish(input.value)});document.getElementById('askCancel').onclick=()=>finish(null);bg.addEventListener('click',e=>{if(e.target===bg)finish(null)});input.focus();input.select?.();
  });
}
function askConfirm(message){
  return new Promise(resolve=>{
    let settled=false;const finish=value=>{if(settled)return;settled=true;modalRoot.innerHTML="";resolve(value)};
    modalRoot.innerHTML=`<div class="modal-bg" id="confirmBg"><div class="modal" role="alertdialog" aria-modal="true"><h2>Xác nhận thao tác</h2><p>${E(message)}</p><div class="actions"><button class="danger" id="confirmYes" type="button">Tiếp tục</button><button class="secondary" id="confirmNo" type="button">Hủy</button></div></div></div>`;
    document.getElementById('confirmYes').onclick=()=>finish(true);document.getElementById('confirmNo').onclick=()=>finish(false);document.getElementById('confirmBg').addEventListener('click',e=>{if(e.target.id==='confirmBg')finish(false)});
  });
}

async function loadConfig(){
  state.config=await api("/api/config");
}
async function loadMe(){
  try{state.user=(await api("/api/auth/me")).user}catch{state.user=null}
  accountBtn.textContent=state.user?(state.user.full_name||"Tài khoản"):"Đăng nhập";
}
function moduleEnabled(key){
  const m=(state.config?.modules||[]).find(x=>x.key===key);
  return !m||!!m.enabled;
}
function setTheme(t){
  document.body.classList.toggle("dark",t==="dark");localStorage.setItem("sfec_theme",t);
}
themeBtn.onclick=()=>setTheme(document.body.classList.contains("dark")?"light":"dark");
if(mobileMenu&&navMenu){
  mobileMenu.addEventListener("click",()=>{
    const open=navMenu.classList.toggle("is-open");
    mobileMenu.setAttribute("aria-expanded",String(open));
    mobileMenu.setAttribute("aria-label",open?"Đóng menu":"Mở menu");
  });
  navMenu.addEventListener("click",e=>{
    if(e.target.closest("a")){navMenu.classList.remove("is-open");mobileMenu.setAttribute("aria-expanded","false");}
  });
}
setTheme(localStorage.getItem("sfec_theme")||"light");
accountBtn.onclick=()=>{if(state.user&&isAdmin(state.user)) location.hash="admin/dashboard"; else location.hash="login"};

function hero(){
  const legacy=/the sky first english club|câu lạc bộ tiếng anh|học tiếng anh\. kết nối cộng đồng/i;
  const rawTitle=String(state.config?.hero_title||"");
  const rawText=String(state.config?.hero_text||"");
  const title=E(!rawTitle||legacy.test(rawTitle)?"Học tập. Khám phá. Phát triển.":rawTitle);
  const text=E(!rawText||legacy.test(rawText)?"Một không gian giáo dục số kết nối người học với lớp học, chương trình và hoạt động phát triển năng lực được triển khai theo định hướng của Sky First Network.":rawText);
  return `<section class="hero hero-official"><div class="hero-grid"><div class="hero-copy"><span class="eyebrow"><span class="eyebrow-spark">✦</span> SKY FIRST EDUCATION CLUB <i></i> SKY FIRST NETWORK</span><div class="hero-org">SFEC <span> / </span> EDUCATION & DEVELOPMENT</div><h1>${title}</h1><p class="hero-lead">${text}</p><p class="hero-owner"><b>SFEC là mô hình giáo dục trực thuộc Sky First Network</b>, tập trung vào lớp học, chương trình và hoạt động giáo dục theo định hướng, phân công và phê duyệt của SFN.</p><div class="hero-slogan"><span class="slogan-line"></span><b>${E(state.config?.slogan||"LEARN · CONNECT · GROW")}</b></div><div class="actions hero-actions"><a class="primary" href="#classes">Khám phá chương trình <span aria-hidden="true">↗</span></a><a class="secondary" href="#lookup">Tra cứu GCN</a><a class="hero-link" href="https://skyfirst.io.vn" target="_blank" rel="noopener">Khám phá Sky First Network ↗</a></div><div class="hero-trust"><span><i></i> GIÁO DỤC CÓ ĐỊNH HƯỚNG</span><span>THUỘC HỆ SINH THÁI SFN</span></div></div><div class="hero-visual" aria-hidden="true"><div class="visual-grid"></div><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="orbit orbit-three"></div><div class="orbit-node node-one"></div><div class="orbit-node node-two"></div><div class="hero-logo-stage"><span class="stage-topline">SFEC / LEARNING EXPERIENCE</span><img src="/assets/sfec-wordmark.png" alt=""><span class="stage-rule"></span><span class="stage-caption">A SPACE TO LEARN, CREATE & GROW</span></div><div class="float-card float-card-a"><span class="float-index">01 / LEARN</span><b>Khám phá tri thức</b><i>◈</i></div><div class="float-card float-card-b"><span class="float-index">02 / CONNECT</span><b>Kết nối cơ hội</b><i>↗</i></div><div class="float-card float-card-c"><span class="float-index">03 / GROW</span><b>Phát triển năng lực</b><i>✦</i></div><div class="visual-coordinate">10°46' N <span>•</span> SKY FIRST DIGITAL</div></div></div><div class="hero-bottom"><span><span class="hero-bottom-mark">✳</span> AN EDUCATION EXPERIENCE BY SKY FIRST NETWORK</span><a href="#explore">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a></div></section>`;
}
async function renderHome(){
  let customBody="";
  try{
    const custom=await api("/api/public/pages/home");
    if(custom?.item?.body_html){const x=custom.item;if(x.seo_title)document.title=x.seo_title;customBody=`<section class="cms-public-body">${x.body_html}</section>`;}
  }catch{}
  app.innerHTML=hero()+`<section class="experience-intro" id="explore"><div class="intro-heading"><div class="section-kicker">NOT JUST A WEBSITE · A LEARNING SPACE</div><h2 class="section-title">Công nghệ là cách mở ra<br><span>những trải nghiệm học tập mới.</span></h2></div><p>SFEC tập trung vào giá trị giáo dục thật: chương trình rõ ràng, hoạt động có mục tiêu và thông tin có thể kiểm chứng. Trải nghiệm số giúp mọi thứ trực quan hơn, không thay thế nội dung và con người.</p><div class="intro-index">SFEC <span>—</span> EXPERIENCE / 01</div></section>${customBody}<div class="section-kicker public-kicker">KHÁM PHÁ SFEC</div><h2 class="section-title public-section-title">Chọn điểm bắt đầu của bạn.</h2><div class="grid3 public-feature-grid">
  ${quickCard("↗","Chương trình giáo dục","Khám phá lớp học và chương trình được công bố theo kế hoạch triển khai thực tế.","#classes")}
  ${quickCard("✦","Hoạt động & trải nghiệm","Workshop, tọa đàm và hoạt động phát triển kỹ năng khi được tổ chức.","#events")}
  ${quickCard("⌗","Xác minh GCN","Tra cứu mã giấy chứng nhận hoặc quét QR để kiểm tra thông tin phát hành.","#lookup")}
  </div><section class="experience-journey"><div class="journey-head"><div><div class="section-kicker">THE SFEC JOURNEY</div><h2 class="section-title">Từ khám phá đến ghi nhận.</h2></div><a class="hero-link dark-link" href="#about">Về mô hình SFEC ↗</a></div><div class="journey-track"><article><span>01</span><div class="journey-symbol">⌕</div><h3>Khám phá</h3><p>Tìm hiểu chương trình, lớp học và hoạt động đang được công bố.</p></article><div class="journey-connector"></div><article><span>02</span><div class="journey-symbol">✳</div><h3>Trải nghiệm</h3><p>Tham gia các hoạt động giáo dục theo hướng dẫn và điều kiện từng chương trình.</p></article><div class="journey-connector"></div><article><span>03</span><div class="journey-symbol">✓</div><h3>Ghi nhận</h3><p>Tra cứu GCN đã phát hành bằng mã hoặc QR trên hệ thống.</p></article></div></section><section class="network-bridge"><div class="network-bridge-mark">SFN <span>↗</span></div><div><div class="section-kicker">GOVERNED BY SKY FIRST NETWORK</div><h2>SFEC tập trung vào giáo dục.<br>SFN điều phối hệ thống.</h2><p>Những công việc về quản trị, nhân sự, phân quyền và phối hợp liên đơn vị được xử lý thông qua Sky First Network.</p></div><a class="primary" href="https://skyfirst.io.vn" target="_blank" rel="noopener">Đến Sky First Network ↗</a></section><section class="home-news-section"><div class="news-section-head"><div><div class="section-kicker">STORIES & UPDATES</div><h2 class="section-title">Bản tin SFEC</h2></div><a class="secondary" href="#news">Xem toàn bộ bản tin →</a></div><div class="grid" id="homeNews"></div></section>`;
  try{const d=await api("/api/public/news");document.getElementById("homeNews").innerHTML=(d.items||[]).slice(0,3).map(newsCard).join("")||`<div class="card muted">Chưa có bản tin.</div>`}catch{}
}
function quickCard(icon,title,desc,href){return `<div class="card feature-card"><div class="feature-icon" aria-hidden="true">${icon}</div><h3>${E(title)}</h3><p class="muted">${E(desc)}</p><a class="secondary" href="${href}">Xem chi tiết →</a></div>`}
function newsExcerpt(body,max=210){const t=String(body||"").replace(/\s+/g," ").trim();return t.length>max?t.slice(0,max).trim()+"…":t}
function newsBody(body){return E(body||"").replace(/\r?\n/g,"<br>")}
function newsCard(n){return `<article class="card news-card"><span class="pill">${E((n.published_at||"").slice(0,10))}</span><h3>${E(n.title)}</h3><p class="muted news-excerpt">${E(newsExcerpt(n.body))}</p><a class="secondary" href="#news/${encodeURIComponent(n.id)}">Đọc bản tin →</a></article>`}
async function renderInfoPage(kind){
  const pages={
    about:{k:"GIỚI THIỆU SFEC",t:"Một không gian dành cho việc học và sử dụng Tiếng Anh",b:`<div class="article-lead"><p><b>Sky First Education Club (SFEC)</b> là đơn vị thuộc hệ sinh thái <b>Sky First Network (SFN)</b>, hướng đến phát triển môi trường học tập, chương trình giáo dục, kỹ năng và hoạt động chia sẻ tri thức.</p></div><h2>SFEC tập trung vào điều gì?</h2><p>SFEC hướng đến các hoạt động có mục tiêu rõ ràng, phù hợp với người học và tạo cơ hội phát triển kiến thức, kỹ năng, năng lực cá nhân. Các lĩnh vực có thể bao gồm lớp học, đào tạo, kỹ năng, workshop, tọa đàm, hoạt động học thuật và chương trình tiếng Anh.</p><h2>Mô hình tinh gọn</h2><p>SFEC không duy trì cơ cấu Phòng/Ban nội bộ và không vận hành như một tổ chức độc lập. Các công tác hành chính, nhân sự, truyền thông, đối ngoại, công nghệ và hỗ trợ vận hành khi phát sinh được phối hợp thông qua cơ cấu chung của Sky First Network theo phân công.</p><h2>Website SFEC</h2><p>Website này là kênh công khai thông tin chương trình, hoạt động, bản tin và tra cứu Giấy chứng nhận. Website không phải cổng học viên và không cung cấp tài khoản học viên/thành viên. Khu vực đăng nhập chỉ dành cho người được cấp quyền quản trị hệ thống.</p><h2>Nguyên tắc công bố thông tin</h2><p>Nội dung trên website cần phản ánh thông tin đã được cung cấp và phê duyệt trong quy trình vận hành. Khi chưa có lịch, lớp học, hoạt động hoặc kết quả cụ thể được xác nhận, website không tự tạo số liệu, danh sách người tham gia hay thành tích minh họa. Người xem nên kiểm tra trạng thái và thời điểm công bố của từng nội dung, đồng thời liên hệ kênh chính thức nếu cần làm rõ điều kiện tham gia.</p><h2>Quan hệ với Sky First Network</h2><p>Mạng lưới Giáo dục &amp; Phát triển Cộng đồng Sky First (Sky First Network – SFN) là hệ thống chủ quản. SFEC tập trung vào nội dung chuyên môn giáo dục trong phạm vi được phân công; các quyết định về quản trị chung, nhân sự, quyền hạn và phối hợp liên đơn vị được xử lý theo cơ chế của SFN. Đối với Giấy chứng nhận, SFEC không phải đơn vị tự cấp. Việc xác minh phải dựa trên nguồn của tổ chức phát hành có thẩm quyền, không dựa riêng vào giao diện hiển thị trên website.</p><h2>Liên hệ và hỗ trợ</h2><p>Người quan tâm có thể sử dụng mục Liên hệ để tìm email và các kênh cộng đồng được công bố. Khi gửi câu hỏi, nên nêu rõ chương trình hoặc nội dung cần hỗ trợ và tránh gửi dữ liệu cá nhân không cần thiết. SFEC hướng đến việc cung cấp thông tin dễ hiểu, có thể kiểm tra và cập nhật theo dữ liệu thực tế.</p>`},
    journey:{k:"HÀNH TRÌNH SFEC",t:"Từ một câu lạc bộ đến mô hình chuyên môn tinh gọn",b:`<p>SFEC được định hướng là không gian giáo dục đa lĩnh vực, kết nối người học với các chương trình, hoạt động và cơ hội phát triển phù hợp theo từng giai đoạn. Hành trình của mô hình được thể hiện qua việc xác định rõ trọng tâm chuyên môn, cải thiện cách công bố thông tin và duy trì sự phối hợp với hệ thống chủ quản.</p><h2>Giai đoạn hiện tại</h2><p>SFEC phát triển các chương trình giáo dục đa lĩnh vực, đồng thời phối hợp với Sky First Network trong những hoạt động hỗ trợ và vận hành theo phân công. Các nội dung công khai trên website được cập nhật theo thông tin thực tế; khi chưa có dữ liệu xác nhận, trang sẽ thông báo chưa có chương trình hoặc hoạt động được công bố thay vì đưa ra thông tin giả định.</p><h2>Phát triển theo nhu cầu thực tế</h2><p>Việc mở lớp, tổ chức workshop, tọa đàm hoặc hoạt động trải nghiệm phụ thuộc vào kế hoạch được duyệt, người phụ trách, điều kiện triển khai và khả năng hỗ trợ. Website là nơi giới thiệu thông tin đã sẵn sàng công bố, không phải cam kết rằng một hoạt động cụ thể luôn diễn ra. Người quan tâm nên xem thông tin chi tiết của từng đợt và liên hệ qua kênh chính thức nếu cần xác nhận thời gian, đối tượng phù hợp hoặc yêu cầu tham gia.</p><h2>Hệ thống phối hợp</h2><p>SFEC không tự xây dựng một bộ máy quản trị độc lập. Những nhiệm vụ về nhân sự, quản trị tài khoản, phân quyền, bảo vệ dữ liệu và phối hợp giữa các đơn vị được điều phối qua SFN theo trách nhiệm được giao. Cách làm này giúp tập trung nguồn lực vào chất lượng giáo dục, đồng thời tránh việc nhiều đơn vị cùng xử lý một nghiệp vụ mà không rõ thẩm quyền.</p><h2>Minh bạch trong ghi nhận</h2><p>Thông tin xác minh Giấy chứng nhận cần lấy từ nguồn phát hành có thẩm quyền. Website SFEC chỉ hỗ trợ tra cứu và giải thích trạng thái nhận được; không tự tạo mã, thay đổi trạng thái hay thay thế hồ sơ gốc. Các bước phát triển tiếp theo cần ưu tiên tính chính xác, khả năng truy cập và trải nghiệm thuận tiện trên cả máy tính lẫn điện thoại.</p>`},
    values:{k:"ĐỊNH HƯỚNG",t:"Học thật · Thực hành thật · Vận hành tinh gọn",b:`<h2>Chuyên môn là trọng tâm</h2><p>Mỗi chương trình của SFEC cần hướng đến giá trị học tập hoặc phát triển năng lực cụ thể, có nội dung phù hợp và thông tin rõ ràng. Mục tiêu, phạm vi, đối tượng và điều kiện tham gia nên được trình bày dễ hiểu để người học tự đánh giá sự phù hợp trước khi đăng ký.</p><h2>Tinh gọn và phối hợp</h2><p>SFEC không tạo thêm bộ máy nội bộ khi các chức năng đó đã có thể được hỗ trợ bởi Sky First Network. Việc phối hợp được thực hiện theo nhu cầu thực tế của từng chương trình. Mỗi nghiệp vụ cần có người chịu trách nhiệm và giới hạn quyền hạn rõ ràng; quyền truy cập hệ thống không tự động đồng nghĩa với thẩm quyền phê duyệt hay phát hành tài liệu.</p><h2>Thông tin có thể kiểm chứng</h2><p>Các thông tin công khai, chương trình và Giấy chứng nhận cần được ghi nhận rõ ràng trên hệ thống để thuận tiện cho việc tra cứu và xác minh. Trạng thái không xác định hoặc lỗi kết nối phải được hiển thị trung thực, không biến thành thông báo thành công. Đối với GCN, kết quả hợp lệ phải đến từ nguồn phát hành có thẩm quyền và không được suy diễn từ một bản ghi nội bộ chưa xác minh.</p><h2>Tôn trọng dữ liệu cá nhân</h2><p>Thông tin chỉ nên được thu thập khi cần cho mục đích giáo dục đã thông báo. Giao diện công khai không hiển thị dữ liệu riêng tư như email cá nhân, ảnh chân dung hoặc ghi chú nội bộ trong kết quả tra cứu GCN. Quyền truy cập và xử lý dữ liệu cần tuân theo vai trò được cấp và quy trình chung của SFN.</p><h2>Trải nghiệm có khả năng tiếp cận</h2><p>Trang web cần hoạt động ổn định trên màn hình nhỏ, có độ tương phản đủ rõ, điều khiển có nhãn và trạng thái dễ hiểu. Hiệu ứng chuyển động không được cản trở thao tác; biểu mẫu phải báo lỗi gần vị trí cần sửa. Tốc độ và khả năng sử dụng quan trọng hơn những yếu tố trang trí không giúp người dùng hoàn thành công việc.</p>`},
    organization:{k:"SFEC & SKY FIRST NETWORK",t:"Một đơn vị chuyên môn trong hệ thống Sky First Network",b:`<p><b>SFEC thuộc hệ sinh thái Mạng lưới Giáo dục &amp; Phát triển Cộng đồng Sky First (Sky First Network – SFN)</b> và phát triển các chương trình giáo dục đa lĩnh vực trong phạm vi được giao.</p><div class="simple-note"><b>SFEC không duy trì cơ cấu Phòng/Ban nội bộ.</b><p>Các nhu cầu về hành chính, nhân sự, truyền thông, đối ngoại, công nghệ và vận hành được phối hợp với các đơn vị chức năng của Sky First Network theo phân công.</p></div><h2>Phạm vi trách nhiệm</h2><p>SFEC tập trung giới thiệu chương trình giáo dục, cung cấp thông tin hoạt động đã được công bố, tiếp nhận những đăng ký phù hợp với chương trình đang triển khai và hỗ trợ người dùng tra cứu thông tin. SFEC không hoạt động như một tổ chức độc lập có bộ máy nhân sự riêng và không tự quyết định các vấn đề thuộc quyền điều phối chung của SFN.</p><h2>Quản trị và phân quyền</h2><p>Tài khoản quản trị được cấp theo nhu cầu công việc. Mỗi vai trò chỉ nên truy cập các chức năng cần thiết cho nhiệm vụ được giao; việc có quyền xem một hồ sơ không mặc nhiên cho phép sửa dữ liệu, phê duyệt yêu cầu hoặc thực hiện hành động có tính pháp lý. Những thay đổi nhạy cảm cần có nhật ký, kiểm soát quyền và quy trình phê duyệt phù hợp. Các tài khoản, vai trò, dữ liệu và lịch sử hiện có phải được bảo toàn trong quá trình nâng cấp hệ thống.</p><h2>Thẩm quyền đối với GCN/GXN</h2><p>SFEC không có thẩm quyền tự tạo, chỉnh sửa, phát hành hoặc thu hồi Giấy chứng nhận/Giấy xác nhận. Việc tra cứu công khai phải dựa trên dữ liệu từ hệ thống của đơn vị phát hành có thẩm quyền hoặc đơn vị được ủy quyền. Nếu nguồn xác minh không phản hồi, kết quả cần ghi rõ chưa xác minh được. Không nên tải, in hoặc chia sẻ dữ liệu riêng tư thông qua trang tra cứu công khai.</p><h2>Phối hợp và liên hệ</h2><p>Những công việc liên quan đến quản trị hệ thống, nhân sự, phân quyền, bảo vệ dữ liệu và phối hợp liên đơn vị được xử lý thông qua SFN. Người dùng có thể liên hệ SFEC về thông tin chương trình và hoạt động; các đề nghị vượt ngoài phạm vi chuyên môn sẽ được hướng dẫn đến kênh phù hợp khi có thông tin xác nhận.</p>`}
  };
  const x=pages[kind]||pages.about;
  app.innerHTML=`<article class="info-page longform"><div class="section-kicker">${x.k}</div><h1>${x.t}</h1><div class="info-copy">${x.b}</div><div class="article-cta"><div><b>Khám phá SFEC</b><p class="muted">Xem chương trình, hoạt động hoặc xác minh Giấy chứng nhận.</p></div><div class="actions"><a class="primary" href="#classes">Chương trình</a><a class="secondary" href="#lookup">Tra cứu GCN</a></div></div></article>`;
}
async function renderForms(){
  const forms=state.config?.forms||[];
  app.innerHTML=`<div class="section-kicker">ĐĂNG KÝ CHƯƠNG TRÌNH GIÁO DỤC</div><h1>Biểu mẫu theo từng lớp học.</h1><p class="muted">SFEC chỉ tiếp nhận đăng ký phục vụ lớp học hoặc hoạt động giáo dục đang được triển khai. Các yêu cầu về nhân sự, tổ chức và phối hợp khác được điều phối thông qua Sky First Network.</p><div class="grid">${forms.map(f=>`<div class="card"><span class="pill">${E(f.prefix)}</span><h3>${E(f.name)}</h3><p class="muted">${E(f.description)}</p><p class="small">${f.min_age?`Điều kiện độ tuổi: từ đủ ${f.min_age} tuổi`:"Theo điều kiện của lớp/chương trình"}</p><a class="primary" href="#form/${encodeURIComponent(f.id)}">Mở đăng ký</a></div>`).join("")||`<div class="card empty-state"><div class="empty-symbol">✦</div><h2>Chưa mở đợt đăng ký</h2><p class="muted">Khi có lớp học hoặc hoạt động nhận đăng ký, thông tin sẽ được công bố tại đây.</p><a class="primary" href="https://skyfirst.io.vn" target="_blank" rel="noopener">Liên hệ Sky First Network ↗</a></div>`}</div>`;
}
function conditionOk(cond,answers){
  if(!cond)return true;if("equals" in cond)return answers[cond.key]===cond.equals;if("not_equals" in cond)return answers[cond.key]!==cond.not_equals;return true;
}
function fieldHtml(f){
  const req=f.required?" *":"",attrs=`data-key="${E(f.key)}" ${f.required?"required":""}`;
  if(f.type==="textarea")return `<div class="field"><label>${E(f.label)}${req}</label><textarea ${attrs}></textarea></div>`;
  if(f.type==="select")return `<div class="field"><label>${E(f.label)}${req}</label><select ${attrs}><option value="">-- Chọn --</option>${(f.options||[]).map(x=>`<option>${E(x)}</option>`).join("")}</select></div>`;
  if(f.type==="checkbox")return `<div class="check"><input type="checkbox" ${attrs}><label>${E(f.label)}${req}</label></div>`;
  if(f.type==="file")return `<div class="field file-field"><label>${E(f.label)}${req}</label><label class="upload-zone"><span class="upload-icon">⬆</span><b>Chọn tệp để tải lên</b><small>${(f.accept||[]).some(x=>String(x).startsWith("image/"))?"JPG, PNG hoặc WEBP · ảnh rõ mặt, đủ sáng":"Tệp được lưu bảo mật trong hệ thống"}</small><input type="file" ${attrs} ${f.accept?`accept="${E(f.accept.join(","))}"`:""}></label><div class="image-preview" data-preview-for="${E(f.key)}"></div></div>`;
  return `<div class="field"><label>${E(f.label)}${req}</label><input type="${E(f.type||"text")}" ${attrs}></div>`;
}
function collectFormValues(formEl,config,validate=true){
  const answers={},files={};let firstBad=null;
  for(const section of config.sections||[]){
    if(!conditionOk(section.condition,answers)) continue;
    for(const f of section.fields||[]){
      if(!conditionOk(f.condition,answers))continue;
      const el=formEl.querySelector(`[data-key="${CSS.escape(f.key)}"]`);if(!el)continue;
      let val=el.type==="checkbox"?el.checked:el.type==="file"?"":el.value.trim();
      if(el.type==="file"&&el.files?.[0])files[f.key]=el.files[0];
      answers[f.key]=val;
      if(validate&&f.required&&((el.type==="checkbox"&&!val)||(el.type!=="checkbox"&&el.type!=="file"&&!val)||(el.type==="file"&&!files[f.key]))&&!firstBad)firstBad={el,label:f.label};
    }
  }
  return {answers,files,firstBad};
}
function applyConditions(config){
  const form=document.getElementById("dynamicForm");if(!form)return;
  const {answers}=collectFormValues(form,config,false);
  [...form.querySelectorAll("[data-section]")].forEach((sec,i)=>{
    const s=config.sections[i];sec.classList.toggle("hidden",!conditionOk(s.condition,answers));
  });
  for(const f of config.sections.flatMap(s=>s.fields||[])){
    const wrap=form.querySelector(`[data-field-wrap="${CSS.escape(f.key)}"]`);if(wrap)wrap.classList.toggle("hidden",!conditionOk(f.condition,answers));
  }
}
async function renderForm(idForm){
  app.innerHTML=`<div class="loading">Đang tải biểu mẫu…</div>`;
  try{
    const d=await api(`/api/forms/${encodeURIComponent(idForm)}`);state.currentForm=d;
    const c=d.form.config;
    app.innerHTML=`<div class="form-wrap"><a class="ghost" href="#forms">← Quay lại</a><div class="form-hero"><span class="form-icon">✦</span><div><span class="pill">${E(d.form.prefix)}</span><h1>${E(d.form.name)}</h1><p>${E(d.form.description)}</p><div class="form-assurance"><span>🔒 Dữ liệu được lưu bảo mật</span><span>✉️ Email xác nhận từ sfec@skyfirst.io.vn</span><span>🏢 Tiếp nhận theo quy trình của SFN</span></div></div></div><div class="card form-card">
      ${(d.terms||[]).map(t=>`<details class="term"><summary>${E(t.code)} — ${E(t.name)} (${E(t.version)})</summary><pre>${E(t.body)}</pre></details>`).join("")}
      <form id="dynamicForm">${(c.sections||[]).map((s,i)=>`<section data-section="${i}"><h2>${E(s.title)}</h2>${(s.fields||[]).map(f=>`<div data-field-wrap="${E(f.key)}">${fieldHtml(f)}</div>`).join("")}</section>`).join("")}
      <div id="turnstileSlot"></div><div class="actions"><button class="primary" type="submit">Gửi hồ sơ</button><a class="secondary" href="#forms">Hủy</a></div></form>
    </div></div>`;
    const form=document.getElementById("dynamicForm");
    form.addEventListener("change",e=>{applyConditions(c);const el=e.target;if(el?.type==="file"&&el.files?.[0]){const box=form.querySelector(`[data-preview-for="${CSS.escape(el.dataset.key||"")}"]`);if(box&&String(el.files[0].type||"").startsWith("image/")){const url=URL.createObjectURL(el.files[0]);box.innerHTML=`<img src="${url}" alt="Xem trước ảnh"><span>${E(el.files[0].name)}</span>`;}}});applyConditions(c);
    if(state.config.turnstile_site_key) await mountTurnstile();
    form.addEventListener("submit",async e=>{
      e.preventDefault();const {answers,files,firstBad}=collectFormValues(form,c,true);
      if(firstBad){toast("Vui lòng hoàn thành: "+firstBad.label,"bad");firstBad.el.focus();return}
      const fd=new FormData();fd.append("payload",JSON.stringify({answers,turnstile_token:state.turnstileToken}));
      for(const [k,f] of Object.entries(files))fd.append(`file:${k}`,f);
      const btn=form.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent="Đang gửi…";
      try{
        const r=await api(`/api/forms/${encodeURIComponent(idForm)}/submit`,{method:"POST",body:fd});
        form.innerHTML=`<div class="notice good"><h2>Hồ sơ đã được tiếp nhận</h2><p><b>Mã hồ sơ: ${E(r.code)}</b></p><p>Hãy lưu mã này để tra cứu. ${r.email_sent?`<b>Email xác nhận đã được gửi đến địa chỉ email bạn đăng ký từ sfec@skyfirst.io.vn.</b>`:`<b>Hồ sơ đã lưu thành công.</b> Email xác nhận chưa gửi được; Văn phòng SFEC vẫn đã nhận hồ sơ trên hệ thống.`}</p><div class="actions"><a class="primary" href="#lookup">Tra cứu hồ sơ</a><a class="secondary" href="#home">Trang chủ</a></div></div>`;
      }catch(err){toast(errorText(err),"bad");btn.disabled=false;btn.textContent="Gửi hồ sơ"}
    });
  }catch(err){app.innerHTML=`<div class="notice bad">${E(errorText(err))}</div>`}
}
async function mountTurnstile(){
  if(!window.turnstile){
    await new Promise((resolve,reject)=>{const s=document.createElement("script");s.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  }
  window.turnstile.render("#turnstileSlot",{sitekey:state.config.turnstile_site_key,callback:t=>state.turnstileToken=t});
}

async function renderClasses(){
  const d=await api("/api/public/classes");app.innerHTML=`<article class="info-page longform"><div class="section-kicker">CHƯƠNG TRÌNH GIÁO DỤC</div><h1>Chương trình & Lớp học SFEC</h1><p class="article-lead">Trang này hiển thị những lớp học và chương trình giáo dục đã được công bố trong hệ thống SFEC. Danh sách không phải cam kết mở lớp liên tục; tình trạng hiển thị phụ thuộc dữ liệu quản lý hiện có.</p><div class="grid">${(d.items||[]).map(c=>`<div class="card"><span class="pill">${E(c.level||"SFEC")}</span><h3>${E(c.title)}</h3><p class="muted">${E(c.unit_code||"SFEC – Sky First Education Club")}</p><span class="status">${E(c.status)}</span></div>`).join("")||"<div class='card'>Chưa có chương trình được công bố.</div>"}</div><div class="info-copy"><h2>Cách xem thông tin lớp học</h2><p>Trước khi đăng ký, người học nên đọc tên chương trình, cấp độ hoặc lĩnh vực, trạng thái và các thông tin chi tiết được đính kèm trong thông báo chính thức. Nếu chưa thấy lịch học, điều kiện tham gia hoặc thông tin liên hệ, không nên tự suy đoán rằng một lớp đã mở đăng ký. Hãy theo dõi bản tin hoặc liên hệ SFEC để hỏi về kế hoạch đã được xác nhận.</p><h2>Nguyên tắc tổ chức chương trình</h2><p>Chương trình giáo dục cần có mục tiêu rõ ràng, nội dung phù hợp với đối tượng học, phương thức tham gia dễ hiểu và thông tin về thời gian được cập nhật khi có quyết định triển khai. Các dữ liệu trên trang này được lấy từ hệ thống; nếu danh sách trống, điều đó chỉ có nghĩa hiện chưa có chương trình được công bố qua nguồn dữ liệu này, không phải bằng chứng rằng SFEC không có định hướng giáo dục.</p><h2>Đơn vị chủ quản</h2><p>SFEC là mô hình giáo dục trực thuộc Mạng lưới Giáo dục &amp; Phát triển Cộng đồng Sky First (Sky First Network – SFN). Những nội dung liên quan đến quản trị, nhân sự và phân quyền được điều phối thông qua SFN. Website không tự tạo lớp học, lịch học, giảng viên hoặc kết quả để làm đầy danh sách. Khi có dữ liệu được phê duyệt, thông tin tương ứng sẽ được hiển thị cùng trạng thái thực tế.</p><p>Đối với câu hỏi về biểu mẫu đăng ký, người dùng có thể mở mục Biểu mẫu từ menu Hoạt động. Chỉ gửi dữ liệu cần thiết cho mục đích đăng ký và đọc kỹ thông báo quyền riêng tư trước khi gửi.</p></div></article>`;
}
async function renderEvents(){
  const d=await api("/api/public/events");app.innerHTML=`<article class="info-page longform"><div class="section-kicker">HOẠT ĐỘNG SFEC</div><h1>Hoạt động giáo dục SFEC</h1><p class="article-lead">Các hoạt động, workshop, chuyên đề và trải nghiệm học tập chỉ được liệt kê khi có dữ liệu công bố thực tế. Trang này không hiển thị sự kiện minh họa hoặc số liệu chưa xác nhận.</p><div class="grid">${(d.items||[]).map(x=>`<div class="card"><span class="pill">SFEC</span><h3>${E(x.title)}</h3><p class="muted">${fmt(x.start_at)}</p><span class="status">${E(x.status)}</span></div>`).join("")||"<div class='card'>Chưa có hoạt động được công bố.</div>"}</div><div class="info-copy"><h2>Những loại hình hoạt động</h2><p>Trong phạm vi giáo dục, hoạt động có thể bao gồm workshop, tọa đàm, chuyên đề học thuật, thực hành kỹ năng hoặc trải nghiệm cộng đồng. Việc liệt kê các loại hình này nhằm mô tả phạm vi chuyên môn, không khẳng định rằng một sự kiện cụ thể đã được lên lịch. Thông tin về địa điểm, thời gian, điều kiện tham gia và đơn vị phối hợp cần được công bố rõ ràng khi đã được xác nhận.</p><h2>Theo dõi trạng thái</h2><p>Trạng thái hoạt động trên thẻ được lấy từ dữ liệu của hệ thống. Người dùng nên đọc trạng thái cùng với thời gian và thông tin chi tiết được công bố, thay vì chỉ dựa vào tiêu đề. Nếu trang thông báo chưa có hoạt động, vui lòng quay lại sau hoặc theo dõi bản tin chính thức. SFEC không tự tạo tên sự kiện, diễn giả, số người tham gia hoặc kết quả để thay thế dữ liệu còn thiếu.</p><h2>Phối hợp trong hệ sinh thái SFN</h2><p>SFEC triển khai hoạt động giáo dục theo định hướng và phân công của Mạng lưới Giáo dục &amp; Phát triển Cộng đồng Sky First (Sky First Network – SFN). Các vấn đề về quản trị, nhân sự, quan hệ đối tác và phân quyền thuộc cơ chế điều phối chung. Khi một hoạt động yêu cầu đăng ký, người dùng chỉ nên cung cấp thông tin qua biểu mẫu hoặc kênh được công bố chính thức.</p><h2>Liên hệ</h2><p>Nếu cần xác nhận một hoạt động, hãy gửi câu hỏi đến email SFEC hoặc dùng các kênh liên hệ ở cuối trang. Nêu rõ tên hoạt động hoặc đường dẫn đang xem sẽ giúp việc hỗ trợ chính xác hơn. Không gửi mật khẩu, mã xác thực hoặc giấy tờ nhạy cảm qua bình luận công khai.</p></div></article>`;
}
async function renderNews(id=null){
  const d=await api("/api/public/news");
  if(id){const n=(d.items||[]).find(x=>String(x.id)===String(id));if(!n){app.innerHTML=`<div class="notice bad">Không tìm thấy bản tin.</div>`;return}app.innerHTML=`<article class="news-detail"><a class="ghost" href="#news">← Bản tin SFEC</a><div class="section-kicker">BẢN TIN SFEC</div><h1>${E(n.title)}</h1><div class="news-meta">${E((n.published_at||"").slice(0,10))}</div><div class="news-content">${newsBody(n.body)}</div></article>`;return}
  app.innerHTML=`<article class="info-page longform"><div class="section-kicker">TIN TỨC & CẬP NHẬT</div><h1>Bản tin SFEC</h1><p class="article-lead">Bản tin tập hợp nội dung được công bố từ hệ thống SFEC, giúp người đọc theo dõi thông báo và cập nhật liên quan đến giáo dục.</p><div class="grid news-grid">${(d.items||[]).map(newsCard).join("")||"<div class='card'>Chưa có tin.</div>"}</div><div class="info-copy"><h2>Thông tin được công bố như thế nào?</h2><p>Bản tin chỉ hiển thị các nội dung đã được lưu và đặt ở trạng thái công khai trong hệ thống. Danh sách trống không có nghĩa một thông báo cụ thể đã bị hủy; nó chỉ phản ánh hiện chưa có bài viết công khai được trả về. Người đọc nên kiểm tra ngày đăng và nội dung bài viết để hiểu bối cảnh, đồng thời sử dụng kênh liên hệ chính thức nếu cần xác nhận một chi tiết quan trọng.</p><h2>Thông báo chương trình và hoạt động</h2><p>Các thông tin về lớp học, hoạt động, biểu mẫu hoặc thay đổi vận hành cần được trình bày theo dữ liệu thực tế. Bản tin không thay thế điều khoản đăng ký hoặc hướng dẫn riêng của từng chương trình. Nếu bài viết dẫn đến biểu mẫu, vui lòng đọc kỹ điều kiện và thông báo quyền riêng tư trước khi gửi thông tin.</p><h2>Trách nhiệm thông tin</h2><p>SFEC là mô hình giáo dục trực thuộc Mạng lưới Giáo dục &amp; Phát triển Cộng đồng Sky First (Sky First Network – SFN). Những nội dung thuộc quản trị chung, nhân sự, phân quyền hoặc phối hợp liên đơn vị được điều phối thông qua SFN. Website không công bố kết quả, danh sách người tham gia hoặc số liệu chưa có nguồn xác nhận. Nội dung cũ có thể được cập nhật khi có thông tin mới; người dùng nên căn cứ phiên bản công khai mới nhất.</p><h2>Phản hồi và hỗ trợ</h2><p>Nếu phát hiện thông tin không chính xác hoặc liên kết không hoạt động, người đọc có thể liên hệ qua email SFEC. Khi phản hồi, hãy cung cấp đường dẫn bài viết và mô tả ngắn gọn vấn đề, không đính kèm dữ liệu cá nhân của người khác nếu không cần thiết.</p></div></article>`;
}
function renderLookup(){
  app.innerHTML=`<section class="verify-hero"><div><div class="section-kicker">DIGITAL CREDENTIALS / VERIFICATION</div><h1>Xác minh tri thức.<br><span>Ghi nhận minh bạch.</span></h1><p>Tra cứu thông tin Giấy chứng nhận đã được cấp bởi đơn vị có thẩm quyền. Kết quả hiển thị theo dữ liệu xác minh thực tế.</p><div class="verify-benefits"><span>◈ <b>Tra cứu mã cũ và mới</b></span><span>▣ <b>Dữ liệu có kiểm chứng</b></span><span>⌗ <b>Hỗ trợ quét QR</b></span></div></div><div class="verify-art" aria-hidden="true"><div class="verify-orbit orbit-a"></div><div class="verify-orbit orbit-b"></div><div class="cert-sheet"><span class="cert-mini-brand">SFEC</span><strong>CERTIFICATE</strong><div></div><div></div><div></div><b>✓</b><small>DIGITALLY VERIFIED</small></div><div class="magnifier"></div></div></section><section class="verify-panel"><aside><div class="verify-tab active"><b>▤</b><span><strong>Tra cứu bằng mã</strong><small>Nhập mã GCN đã cấp</small></span></div><div class="verify-tab qr-tab"><b>⌗</b><span><strong>Quét mã QR</strong><small>Dùng camera hoặc ảnh QR</small></span></div><div class="verify-help"><b>Không có số GCN?</b><p>Vui lòng nhập mã GCN của bạn tại đây. Nếu không có số mà chỉ có QR, vui lòng vào mục Quét QR.</p></div></aside><div class="verify-main"><div class="lookup-label">CERTIFICATE LOOKUP</div><h2>Tra cứu thông tin GCN</h2><p class="muted">Vui lòng nhập mã GCN của bạn tại đây. Nếu không có số mà chỉ có QR, vui lòng vào mục Quét QR.</p><form id="lookupCert" class="verify-form"><div class="verify-input"><span>▤</span><input name="code" autocomplete="off" required placeholder="XXXXXXXX/GCN-SFEC/XX26" aria-label="Mã Giấy chứng nhận"></div><button class="primary" type="submit">Xác minh <span aria-hidden="true">→</span></button></form><div class="verify-format">Mã GCN mới hoặc mã cũ đều có thể tra cứu nếu tồn tại trong nguồn xác minh</div><div class="qr-actions"><button id="startQrScan" type="button" class="secondary">⌗ Quét QR bằng camera</button><label class="secondary qr-upload-label">Tải ảnh QR lên <input id="qrImageUpload" type="file" accept="image/*" hidden></label></div><div id="qrScanner" class="qr-scanner" hidden><div class="scanner-frame"><video id="qrVideo" autoplay muted playsinline></video><span class="scanner-corner corner-a"></span><span class="scanner-corner corner-b"></span><span class="scanner-corner corner-c"></span><span class="scanner-corner corner-d"></span></div><div class="scanner-controls"><p id="qrScanStatus" aria-live="polite">Đang chuẩn bị camera…</p><button id="stopQrScan" type="button" class="ghost">Dừng quét</button></div></div><div class="verify-trust">Mã và QR chỉ dùng để tra cứu thông tin GCN công khai; QR không chứa dữ liệu hồ sơ riêng tư.</div><div id="certResult" aria-live="polite"></div></div></section>`;
  const lookupForm=document.getElementById("lookupCert");
  const codeInput=lookupForm.querySelector('[name="code"]');
  const qrScanner=document.getElementById("qrScanner"),qrVideo=document.getElementById("qrVideo"),qrStatus=document.getElementById("qrScanStatus");
  let qrStream=null,scanFrame=0,scanActive=false,detector=null;
  const stopScan=()=>{scanActive=false;if(scanFrame)cancelAnimationFrame(scanFrame);if(qrStream){qrStream.getTracks().forEach(track=>track.stop());qrStream=null;}qrScanner.hidden=true;qrVideo.srcObject=null;};
  const codeFromQr=raw=>{
    const value=String(raw||"").trim();if(!value)return "";
    try{const u=new URL(value,location.origin);const fromUrl=u.searchParams.get("cert_lookup")||u.searchParams.get("code")||u.searchParams.get("certificate");if(fromUrl)return fromUrl.trim();}
    catch{}
    const decoded=value.replace(/^.*#(?:lookup\?|lookup&)/i,"");
    const query=decoded.startsWith("?")?decoded.slice(1):decoded;
    const param=new URLSearchParams(query).get("cert_lookup")||new URLSearchParams(query).get("code");
    if(param)return param.trim();
    const match=value.match(/([A-Z0-9]{8}\/(?:GCN|GXN)-SFEC\/XX\d{2}|\d+\/(?:GCN|GXN)-SFEC\/\d{4})/i);
    return match?match[1]:"";
  };
  const lookupCode=code=>{stopScan();const cleaned=String(code||"").trim();if(!cleaned){qrStatus.textContent="Không đọc được mã GCN trong QR. Vui lòng thử lại hoặc nhập mã thủ công.";qrScanner.hidden=false;return;}codeInput.value=cleaned;lookupForm.requestSubmit();};
  lookupForm.onsubmit=async e=>{
    e.preventDefault();const code=String(new FormData(e.target).get("code")||"").trim();if(!code)return;
    const result=document.getElementById("certResult");
    result.innerHTML=`<div class="lookup-result pending"><div class="verify-head"><span class="verify-dot pending-dot"></span><div><small>TRẠNG THÁI XÁC MINH</small><strong>Đang tra cứu…</strong></div></div></div>`;
    try{
      const d=await api(`/api/lookup/certificate?code=${encodeURIComponent(code)}`),c=d.item||{},m=J(c.metadata_json)||{};
      const valid=["issued","reissued"].includes(String(c.status||"").toLowerCase());
      const statusLabel=valid?"Giấy chứng nhận hợp lệ":c.status==="revoked"?"Giấy chứng nhận đã thu hồi":"Chưa xác minh được";
      result.innerHTML=`<div class="lookup-result ${valid?'valid':c.status==='revoked'?'revoked':'pending'}"><div class="verify-head"><span class="verify-dot ${valid?'':'pending-dot'}"></span><div><small>TRẠNG THÁI XÁC MINH</small><strong>${E(statusLabel)}</strong></div></div><dl><div><dt>Mã Giấy chứng nhận</dt><dd>${E(c.code||'—')}</dd></div><div><dt>Họ và tên</dt><dd>${E(c.full_name||'—')}</dd></div><div><dt>Nội dung ghi nhận</dt><dd>${E(c.content||'—')}</dd></div><div><dt>Đơn vị cấp</dt><dd>${E(m.issuer_name||m.unit_name||'Theo dữ liệu nguồn xác minh')}</dd></div><div><dt>Đơn vị chủ quản</dt><dd>${E(m.owner_name||'Mạng lưới Giáo dục & Phát triển Cộng đồng Sky First (Sky First Network – SFN)')}</dd></div><div><dt>Ngày cấp</dt><dd>${E(fmt(c.issued_at))}</dd></div>${m.registry_no?`<div><dt>Số vào sổ</dt><dd>${E(m.registry_no)}</dd></div>`:''}<div><dt>Trạng thái nguồn</dt><dd>${E(c.status||'Không rõ')}</dd></div></dl><p class="muted">Kết quả tra cứu không thay thế bản xác minh gốc của đơn vị cấp.</p></div>`;
    }catch(err){
      result.innerHTML=err?.status===404?"<div class='notice warn'>Không tìm thấy GCN với mã này. Vui lòng kiểm tra mã và thử lại.</div>":"<div class='notice warn'>Chưa xác minh được do kết nối hoặc dịch vụ tra cứu đang gặp lỗi. Vui lòng thử lại sau.</div>";
    }
  };
  document.getElementById("startQrScan").onclick=async()=>{
    if(!("BarcodeDetector" in window)){qrScanner.hidden=false;qrStatus.textContent="Trình duyệt này chưa hỗ trợ đọc QR tích hợp. Hãy dùng camera QR của điện thoại để mở liên kết, hoặc nhập mã GCN vào ô tra cứu.";return;}
    try{
      detector=new BarcodeDetector({formats:["qr_code"]});
      if(!navigator.mediaDevices?.getUserMedia)throw new Error("CAMERA_UNAVAILABLE");
      qrScanner.hidden=false;qrStatus.textContent="Hãy đưa mã QR vào khung quét.";
      qrStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
      qrVideo.srcObject=qrStream;await qrVideo.play();scanActive=true;
      const frame=async()=>{if(!scanActive)return;try{const found=await detector.detect(qrVideo);if(found?.length){const code=codeFromQr(found[0].rawValue);if(code){lookupCode(code);return;}qrStatus.textContent="Đã đọc QR nhưng không tìm thấy mã GCN. Hãy thử QR trên giấy chứng nhận.";}}catch{}scanFrame=requestAnimationFrame(frame)};
      scanFrame=requestAnimationFrame(frame);
    }catch(err){stopScan();qrScanner.hidden=false;qrStatus.textContent=err?.name==="NotAllowedError"?"Camera chưa được cấp quyền. Hãy cho phép truy cập camera trong trình duyệt rồi thử lại.":"Không mở được camera. Hãy kiểm tra quyền camera hoặc nhập mã GCN thủ công.";}
  };
  document.getElementById("stopQrScan").onclick=stopScan;
  document.getElementById("qrImageUpload").onchange=async e=>{
    const file=e.target.files?.[0];if(!file)return;
    if(!("BarcodeDetector" in window)){qrScanner.hidden=false;qrStatus.textContent="Trình duyệt này chưa hỗ trợ đọc QR từ ảnh. Vui lòng nhập mã hoặc mở liên kết trong QR bằng camera điện thoại.";return;}
    try{detector ||= new BarcodeDetector({formats:["qr_code"]});const bitmap=await createImageBitmap(file);const found=await detector.detect(bitmap);bitmap.close?.();const code=found?.length?codeFromQr(found[0].rawValue):"";if(code)lookupCode(code);else{qrScanner.hidden=false;qrStatus.textContent="Không đọc được mã GCN từ ảnh này. Hãy chọn ảnh QR rõ nét hơn.";}}catch{qrScanner.hidden=false;qrStatus.textContent="Không thể đọc ảnh QR này. Hãy thử ảnh PNG/JPG rõ nét hơn.";}e.target.value="";
  };
  const auto=new URLSearchParams(location.search).get("cert_lookup");if(auto){codeInput.value=auto;lookupForm.requestSubmit();}
}
function renderContact(){app.innerHTML=`<article class="info-page"><div class="section-kicker">LIÊN HỆ</div><h1>Kết nối với SFEC</h1><p class="muted">Liên hệ về lớp học, chương trình và hoạt động giáo dục đang được SFEC công bố.</p><div class="grid2"><div class="card"><h3>SFEC — Sky First Education Club</h3><p>SFEC là mô hình giáo dục trực thuộc Sky First Network; các hoạt động được triển khai theo định hướng và phân công của SFN.</p><p><b>Website:</b> www.sfec.skyfirst.io.vn<br><b>Email:</b> sfec@skyfirst.io.vn<br><b>Hotline/Zalo:</b> 0924 910 210</p><p><b>FanPage:</b> <a href="https://fb.com/skyfirst.sfec" target="_blank" rel="noopener">fb.com/skyfirst.sfec</a><br><b>Group cộng đồng:</b> <a href="https://fb.com/groups/sfn.network" target="_blank" rel="noopener">fb.com/groups/sfn.network</a></p><h3>Liên hệ khi nào?</h3><p>Người dùng có thể liên hệ SFEC để hỏi về thông tin chương trình giáo dục đã công bố, trạng thái đăng ký, nội dung bản tin hoặc cách sử dụng chức năng tra cứu. Khi gửi yêu cầu, vui lòng ghi rõ nội dung cần hỗ trợ và đường dẫn trang liên quan. Không gửi mật khẩu, mã xác thực đăng nhập hoặc dữ liệu nhạy cảm qua kênh công khai.</p></div><div class="card"><h3>Phối hợp cùng Sky First Network</h3><p>Các vấn đề quản trị hệ thống, nhân sự, phân quyền, tuyển chọn và phối hợp liên đơn vị do Sky First Network điều phối.</p><p><b>Website:</b> www.skyfirst.io.vn<br><b>Email:</b> lienhe@skyfirst.io.vn<br><b>Email hỗ trợ:</b> support@skyfirst.io.vn</p><a class="primary" href="https://skyfirst.io.vn" target="_blank" rel="noopener">Đến Sky First Network ↗</a><h3>Phạm vi xử lý</h3><p>Các vấn đề về quản trị hệ thống, nhân sự, phân quyền, tuyển chọn và phối hợp liên đơn vị do Sky First Network điều phối. SFEC không hoạt động như một tổ chức độc lập có thẩm quyền riêng về nhân sự hoặc phát hành Giấy chứng nhận. Nếu yêu cầu liên quan đến xác minh GCN/GXN, cần dùng dữ liệu từ nguồn phát hành có thẩm quyền; SFEC chỉ hỗ trợ tra cứu khi nguồn đó sẵn sàng.</p><p>Thông tin liên hệ được cung cấp để giúp người dùng chọn đúng kênh. Việc gửi email không tự động đồng nghĩa yêu cầu đã được phê duyệt; hãy chờ phản hồi qua kênh chính thức khi cần xác nhận kết quả xử lý.</p></div></div></article>`;}

function renderLogin(){
  app.innerHTML=`<div class="admin-login-public"><div class="section-kicker">SFEC SYSTEM</div><h1>Đăng nhập Quản trị</h1><p class="muted">Khu vực dành riêng cho tài khoản được cấp quyền quản trị hệ thống SFEC.</p><div id="loginPanel" style="max-width:650px;margin:18px auto"></div></div>`;
  showLogin('admin');
}
window.showLogin=function(portal){
  state.portal=portal;
  const title="Quản trị viên";
  const reg="";
  document.getElementById("loginPanel").innerHTML=`<div class="card"><h2>Đăng nhập ${title}</h2>
   <form id="loginForm"><div class="field"><label>Email</label><input name="email" type="email" required></div><div class="field"><label>Mật khẩu</label><input name="password" type="password" required></div>
   <button class="primary">Đăng nhập</button></form>
   ${state.config.google_oauth?`<div class="actions"><button class="secondary" onclick="googleLogin('${portal}')">Tiếp tục với Google</button></div>`:""}
   <div class="actions">${reg}<button class="ghost" onclick="showForgot()">Quên mật khẩu?</button></div></div>`;
  document.getElementById("loginForm").onsubmit=async e=>{
    e.preventDefault();const f=new FormData(e.target);
    try{
      const d=await api("/api/auth/login",{method:"POST",body:{email:f.get("email"),password:f.get("password"),portal}});
      if(d.needs_2fa)return show2FA(d.challenge);
      state.user=d.user;accountBtn.textContent=state.user.full_name||state.user.email;
      if(d.must_change_password)return forcePasswordChange(f.get("password"));
      location.hash=portal==="admin"?"admin/dashboard":"portal";
    }catch(err){toast(errorText(err),"bad")}
  };
}
window.googleLogin=portal=>location.href=`/api/auth/google/start?portal=${encodeURIComponent(portal)}`;
window.showRegister=function(){
  modal(`<button class="ghost" onclick="closeModal()">✕ Đóng</button><h2>Tạo tài khoản Học sinh/Học viên</h2>
  <p class="muted">Tài khoản tự tạo chỉ có quyền người học. Quyền Thành viên SFEC phải được SFEC cấp sau khi duyệt.</p>
  <form id="registerForm"><div class="field"><label>Họ và tên</label><input name="full_name" required></div><div class="field"><label>Email</label><input name="email" type="email" required></div><div class="field"><label>Mật khẩu (ít nhất 10 ký tự)</label><input name="password" type="password" minlength="10" required></div><button class="primary">Tạo tài khoản</button></form>`);
  document.getElementById("registerForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{await api("/api/auth/register",{method:"POST",body:Object.fromEntries(f)});closeModal();toast("Đã tạo tài khoản. Kiểm tra email để xác minh.")}catch(err){toast(errorText(err),"bad")}};
}
window.showForgot=function(){
  modal(`<button class="ghost" onclick="closeModal()">✕ Đóng</button><h2>Quên mật khẩu</h2><form id="forgotForm"><div class="field"><label>Email</label><input name="email" type="email" required></div><button class="primary">Gửi liên kết đặt lại</button></form>`);
  document.getElementById("forgotForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);await api("/api/auth/forgot",{method:"POST",body:{email:f.get("email")}}).catch(()=>{});closeModal();toast("Nếu email tồn tại, hệ thống đã gửi hướng dẫn.")};
}
function show2FA(challenge){
  modal(`<h2>Xác minh 2 bước</h2><form id="twofaForm"><div class="field"><label>Mã 6 số từ ứng dụng xác thực</label><input name="code" inputmode="numeric" maxlength="6" required></div><button class="primary">Xác minh</button></form>`);
  document.getElementById("twofaForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{const d=await api("/api/auth/login-2fa",{method:"POST",body:{challenge,code:f.get("code")}});closeModal();state.user=d.user;if(d.must_change_password)return forcePasswordChange("");location.hash=isAdmin(state.user)?"admin/dashboard":"portal"}catch(err){toast(errorText(err),"bad")}};
}
function forcePasswordChange(currentPassword=""){
  modal(`<h2>Đổi mật khẩu lần đầu</h2><div class="notice warn">Tài khoản này phải đổi mật khẩu trước khi tiếp tục.</div>
  <form id="changeFirst"><div class="field"><label>Mật khẩu hiện tại</label><input name="current_password" type="password" value="${E(currentPassword)}" required></div><div class="field"><label>Mật khẩu mới (ít nhất 10 ký tự)</label><input name="new_password" type="password" minlength="10" required></div><button class="primary">Đổi mật khẩu</button></form>`);
  document.getElementById("changeFirst").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{await api("/api/auth/change-password",{method:"POST",body:Object.fromEntries(f)});closeModal();toast("Đã đổi mật khẩu.");location.hash=isAdmin(state.user)?"admin/dashboard":"portal"}catch(err){toast(errorText(err),"bad")}};
}
async function logout(){await api("/api/auth/logout",{method:"POST"}).catch(()=>{});state.user=null;accountBtn.textContent="Đăng nhập";location.hash="home"}
window.logout=logout;

async function renderPortal(){
  if(!state.user){location.hash="login";return}
  const d=await api("/api/me/portal");
  const member=isMember(state.user);
  const menu=[
    ["overview","🏠 Tổng quan"],["records","📥 Hồ sơ đăng ký"],["classes","Lớp học"],["events","Sự kiện"],["certs","GCN/GXN"],["notifications","Thông báo"],
    ...(member?[["profile","Hồ sơ thành viên"],["requests","Yêu cầu nội bộ"],["privacy","🛡️ Quyền riêng tư"]]:[]),
    ["security","Bảo mật tài khoản"]
  ];
  const route=(location.hash.split("/")[1]||"overview");
  app.innerHTML=`<div class="dashboard"><aside class="sidebar">${menu.map(m=>`<button class="${route===m[0]?"active":""}" onclick="location.hash='portal/${m[0]}'">${m[1]}</button>`).join("")}<button onclick="logout()">↩ Đăng xuất</button></aside><div id="portalMain"></div></div>`;
  const main=document.getElementById("portalMain");
  if(route==="overview")main.innerHTML=`<h1>Hồ sơ của tôi</h1><div class="kpis"><div class="kpi"><b>${d.records.length}</b>Hồ sơ</div><div class="kpi"><b>${d.classes.length}</b>Lớp học</div><div class="kpi"><b>${d.certificates.length}</b>GCN/GXN</div><div class="kpi"><b>${d.notifications.filter(n=>!n.read_at).length}</b>Thông báo mới</div></div>${d.person?`<div class="card" style="margin-top:14px"><h3>${E(d.person.full_name)}</h3><p>${E(d.person.position||"")} • ${E(d.person.unit_code||"SFEC")}</p><span class="status">${E(d.person.status)}</span></div>`:""}`;
  if(route==="records")main.innerHTML=listCards("📥 Hồ sơ đăng ký",d.records,r=>`<b>${E(r.code)}</b> — ${E(r.form_id)} <span class="status">${E(r.status)}</span><br><span class="small muted">${fmt(r.created_at)}</span>`);
  if(route==="classes")main.innerHTML=listCards("Lớp học của tôi",d.classes,r=>`<b>${E(r.title)}</b> — ${E(r.status)}<br><span class="small muted">${E(r.class_status)}</span>`);
  if(route==="events")main.innerHTML=listCards("Sự kiện của tôi",d.events,r=>`<b>${E(r.title)}</b> — ${E(r.status)}<br><span class="small muted">${fmt(r.start_at)}</span>`);
  if(route==="certs")main.innerHTML=listCards("GCN/GXN của tôi",d.certificates,r=>`<b>${E(r.code||"Đang chờ cấp số")}</b> — ${E(r.cert_type)}<br>${E(r.content)}<br><span class="status">${E(r.status)}</span>`);
  if(route==="notifications"){main.innerHTML=listCards("Thông báo",d.notifications,r=>`<b>${E(r.title)}</b><br>${E(r.body||"")}<br><span class="small muted">${fmt(r.created_at)}</span>`)+`<button class="secondary" onclick="markAllRead()">Đánh dấu tất cả đã đọc</button>`}
  if(route==="profile")main.innerHTML=`<h1>Hồ sơ thành viên</h1>${d.person?`<div class="card"><h2>${E(d.person.full_name)}</h2><p>Email: ${E(d.person.email||state.user.email)}</p><p>Đơn vị: ${E(d.person.unit_code||"SFEC")}</p><p>Chức danh/Vai trò: ${E(d.person.position||"")}</p><p>Ngày gia nhập: ${E(d.person.joined_at||"")}</p><span class="status">${E(d.person.status)}</span></div>`:`<div class="notice warn">Tài khoản đã đăng nhập nhưng chưa có hồ sơ nhân sự điện tử liên kết.</div>`}`;
  if(route==="requests")main.innerHTML=`<h1>Yêu cầu & Thủ tục nội bộ</h1><div class="grid">${["Cập nhật thông tin nhân sự","Điều chuyển vị trí/đơn vị","Tạm ngừng hoạt động","Thôi nhiệm vụ/rút khỏi SFEC","Đề nghị xác nhận quá trình tham gia","Đề nghị GCN/GXN","Bàn giao nhiệm vụ"].map(x=>`<button class="role-card" onclick="internalRequest('${E(x)}')"><b>${E(x)}</b></button>`).join("")}</div><h2 class="section-title">Lịch sử yêu cầu</h2>${listCards("",d.internal_requests,r=>`<b>${E(r.code)}</b> — ${E(r.request_type)} <span class="status">${E(r.status)}</span>`)}`;
  if(route==="privacy")main.innerHTML=`<h1>Trung tâm Quyền riêng tư</h1><div class="card"><p>Bạn có thể yêu cầu cập nhật, đính chính, xuất hoặc xem xét xóa dữ liệu cá nhân.</p><div class="actions">${["Cập nhật dữ liệu","Đính chính dữ liệu","Yêu cầu xuất dữ liệu cá nhân","Yêu cầu xem xét xóa dữ liệu"].map(x=>`<button class="secondary" onclick="privacyRequest('${E(x)}')">${E(x)}</button>`).join("")}</div></div>`;
  if(route==="security")renderSecurity(main);
}
function listCards(title,items,renderer){return `${title?`<h1>${E(title)}</h1>`:""}${items?.length?items.map(x=>`<div class="card" style="margin:9px 0">${renderer(x)}</div>`).join(""):`<div class="notice">Chưa có dữ liệu.</div>`}`}
window.markAllRead=async()=>{await api("/api/me/notifications/read",{method:"POST",body:{}});toast("Đã đánh dấu đã đọc.");renderPortal()}
window.internalRequest=type=>{modal(`<h2>${E(type)}</h2><form id="reqForm"><div class="field"><label>Nội dung</label><textarea name="content" required></textarea></div><button class="primary">Gửi yêu cầu</button></form>`);document.getElementById("reqForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{const d=await api("/api/me/internal-requests",{method:"POST",body:{request_type:type,content:f.get("content")}});closeModal();toast("Đã gửi: "+d.code);location.hash="portal/requests";renderPortal()}catch(err){toast(errorText(err),"bad")}}}
window.privacyRequest=async type=>{const note=await askText("Ghi chú thêm (không bắt buộc)","",true);if(note===null)return;api("/api/me/data-requests",{method:"POST",body:{request_type:type,note}}).then(()=>toast("Đã tiếp nhận yêu cầu.")).catch(e=>toast(errorText(e),"bad"))}
async function renderSecurity(main){
  let sessions=[];try{sessions=(await api("/api/me/sessions")).sessions||[]}catch{}
  main.innerHTML=`<h1>Bảo mật tài khoản</h1><div class="grid2">
  <div class="card"><h2>Đổi mật khẩu</h2><form id="changePw"><div class="field"><label>Mật khẩu hiện tại</label><input name="current_password" type="password" required></div><div class="field"><label>Mật khẩu mới</label><input name="new_password" type="password" minlength="10" required></div><button class="primary">Đổi mật khẩu</button></form></div>
  <div class="card"><h2>Xác minh 2 bước (2FA)</h2><p>Trạng thái: <b>${state.user.totp_enabled?"Đang bật":"Chưa bật"}</b></p>${state.user.totp_enabled?`<button class="danger" onclick="disable2fa()">Tắt 2FA</button>`:`<button class="primary" onclick="setup2fa()">Thiết lập 2FA</button>`}</div></div>
  <h2 class="section-title">Phiên đăng nhập</h2><div class="card">${sessions.map(s=>`<p><b>${E((s.user_agent||"Thiết bị").slice(0,120))}</b><br><span class="small muted">Hoạt động: ${fmt(s.last_seen_at)} • Hết hạn: ${fmt(s.expires_at)}</span></p>`).join("")}<button class="danger" onclick="revokeAllSessions()">Đăng xuất tất cả thiết bị</button></div>`;
  document.getElementById("changePw").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{await api("/api/auth/change-password",{method:"POST",body:Object.fromEntries(f)});toast("Đã đổi mật khẩu.")}catch(err){toast(errorText(err),"bad")}};
}
window.setup2fa=async()=>{try{const d=await api("/api/me/2fa/setup",{method:"POST"});modal(`<h2>Thiết lập 2FA</h2><p>Thêm tài khoản trong ứng dụng xác thực bằng secret:</p><pre class="card">${E(d.secret)}</pre><p class="small muted">URI: ${E(d.otpauth_uri)}</p><form id="enable2fa"><div class="field"><label>Nhập mã 6 số hiện tại</label><input name="code" required maxlength="6"></div><button class="primary">Bật 2FA</button></form>`);document.getElementById("enable2fa").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{await api("/api/me/2fa/enable",{method:"POST",body:{code:f.get("code")}});closeModal();await loadMe();toast("Đã bật 2FA.");renderPortal()}catch(err){toast(errorText(err),"bad")}}}catch(err){toast(errorText(err),"bad")}}
window.disable2fa=async()=>{const pw=await askText("Nhập mật khẩu để tắt xác thực hai bước");if(!pw)return;api("/api/me/2fa/disable",{method:"POST",body:{password:pw}}).then(async()=>{await loadMe();toast("Đã tắt 2FA.");renderPortal()}).catch(e=>toast(errorText(e),"bad"))}
window.revokeAllSessions=()=>api("/api/me/sessions/revoke-all",{method:"POST"}).then(()=>{state.user=null;location.hash="login"}).catch(e=>toast(errorText(e),"bad"));

const adminMenu=[
 {group:"",items:[["dashboard","🏠 Tổng quan"]]},
 {group:"VẬN HÀNH",items:[["approvals","✅ Trung tâm phê duyệt"],["submissions","📥 Hồ sơ đăng ký"],["classes","🎓 Lớp học & Điểm danh"],["events","🎉 Sự kiện & Check-in"],["tasks","📌 Nhiệm vụ"]]},
 {group:"QUẢN TRỊ TỪ SFN",items:[["users","🔐 Tài khoản & Phân quyền"]]},
 {group:"NỘI DUNG & WEBSITE",items:[["studio","✨ Website Studio"],["media","🖼️ Thư viện Media"],["news","📰 Bản tin & CMS"],["forms","🧩 Form Builder"],["documents","📚 Kho văn bản"],["files","📎 File & Minh chứng"]]},
 {group:"XÁC MINH & HỖ TRỢ",items:[["certificates","🏅 GCN & GXN"],["tickets","🎫 Hỗ trợ & Ticket"],["email","✉️ Email"]]},
 {group:"HỆ THỐNG",items:[["terms","📜 Điều khoản & Chính sách"],["privacy","🛡️ Quyền riêng tư"],["modules","🧱 Modules"],["settings","⚙️ Cài đặt"],["search","🔎 Tìm kiếm"],["audit","🧾 Audit Log"],["backup","💾 Sao lưu & Phục hồi"]]}
]
async function renderAdmin(){
  if(!state.user||!isAdmin(state.user)){location.hash="login";return}
  const section=location.hash.split("/")[1]||"dashboard";
  if(["people","recruitment","teaching"].includes(section)){location.hash="admin/dashboard";toast("Các nghiệp vụ nhân sự được điều phối qua Sky First Network.","bad");return}
  app.innerHTML=`<div class="dashboard"><aside class="sidebar"><div class="admin-brand"><b>SFEC</b><span>HỆ THỐNG QUẢN TRỊ</span></div>${adminMenu.map(g=>`${g.group?`<div class="admin-group-title">${g.group}</div>`:""}${g.items.map(m=>`<button class="${section===m[0]?"active":""}" onclick="location.hash='admin/${m[0]}'">${m[1]}</button>`).join("")}`).join("")}<button class="admin-logout" onclick="logout()">Đăng xuất</button></aside><section id="adminMain"><div class="loading">Đang tải…</div></section></div>`;
  const main=document.getElementById("adminMain");
  try{
    if(section==="dashboard")await adminDashboard(main);
    else if(section==="approvals")await adminApprovals(main);
    else if(section==="submissions")await adminSubmissions(main);
    else if(section==="users")await adminUsers(main);
    else if(section==="people")await adminPeople(main);
    else if(section==="recruitment")await adminRecruitment(main);
    else if(section==="forms")await adminForms(main);
    else if(section==="terms")await adminTerms(main);
    else if(section==="teaching")await adminTeaching(main);
    else if(section==="classes")await adminGeneric(main,"classes","Lớp học",["unit_code","title","level","status","capacity"]);
    else if(section==="events")await adminGeneric(main,"events","Sự kiện",["unit_code","title","start_at","end_at","status","capacity"]);
    else if(section==="documents")await adminGeneric(main,"documents","📚 Kho văn bản",["code","doc_type","title","visibility","status","issued_at"]);
    else if(section==="studio")await adminStudio(main);
    else if(section==="media")await adminMedia(main);
    else if(section==="news")await adminNews(main);
    else if(section==="tasks")await adminGeneric(main,"tasks","Nhiệm vụ & Bàn giao",["title","description","assigned_to","unit_code","status","priority","due_at"]);
    else if(section==="certificates")await adminCertificates(main);
    else if(section==="tickets")await adminTickets(main);
    else if(section==="privacy")await adminPrivacy(main);
    else if(section==="files")await adminFiles(main);
    else if(section==="email")await adminEmail(main);
    else if(section==="modules")await adminModules(main);
    else if(section==="settings")await adminSettings(main);
    else if(section==="search")await adminSearch(main);
    else if(section==="audit")await adminAudit(main);
    else if(section==="backup")await adminBackup(main);
    else main.innerHTML='<div class="notice bad">Không tìm thấy mục quản trị này.</div>';
  }catch(err){
    console.error('Admin section load failed:',section,err);
    main.innerHTML=`<div class="notice bad"><b>Không thể tải mục này.</b><br>${E(errorText(err))}<div class="small muted" style="margin-top:8px">Nếu vừa cập nhật hệ thống, hãy chạy migration D1 rồi tải lại trang.</div></div>`;
  }
}
async function adminDashboard(main){
  const d=await api("/api/admin/dashboard");const c=d.counts;
  main.innerHTML=`<div class="admin-hero-pro"><div><span class="pill">SFEC CONTROL CENTER</span><h1>Quản trị SFEC</h1><p>Không gian vận hành website giáo dục, chương trình, hoạt động, hồ sơ đăng ký và hệ thống dùng chung theo cơ chế quản trị của Sky First Network.</p></div><div class="admin-live"><i></i><span>Hệ thống đang hoạt động</span></div></div><div class="kpis"><div class="kpi"><b>${c.submissions}</b>Hồ sơ</div><div class="kpi"><b>${c.pending}</b>Cần xử lý</div><div class="kpi"><b>${c.certificates}</b>GCN/GXN đã cấp</div><div class="kpi"><b>${c.approvals}</b>Chờ phê duyệt</div><div class="kpi"><b>${c.tickets}</b>Ticket mở</div><div class="kpi"><b>${c.tasks}</b>Nhiệm vụ</div></div>
  <h2 class="section-title">Thao tác nhanh</h2><div class="admin-quick-grid"><button onclick="location.hash='admin/studio'"><b>✨ Website Studio</b><span>Sửa các trang, SEO, cover và xuất bản.</span></button><button onclick="location.hash='admin/media'"><b>🖼️ Media Library</b><span>Upload và quản lý ảnh trên R2.</span></button><button onclick="location.hash='admin/news'"><b>📰 Bản tin</b><span>Đăng và chỉnh sửa nội dung truyền thông.</span></button><button onclick="location.hash='admin/forms'"><b>🧩 Form Builder</b><span>Tạo và quản lý biểu mẫu đăng ký.</span></button><button onclick="location.hash='admin/search'"><b>⌕ Tìm kiếm</b><span>Tìm hồ sơ, người, GCN và dữ liệu hệ thống.</span></button><button onclick="location.hash='admin/backup'"><b>🛡️ Backup</b><span>Sao lưu và phục hồi dữ liệu nghiệp vụ.</span></button></div>
  <div class="card" style="margin-top:18px"><h2>Quản trị theo mô hình SFN</h2><p>SFEC là mô hình giáo dục trực thuộc Sky First Network. Tài khoản, phân quyền và các nghiệp vụ nhân sự được quản lý theo cơ chế chung của SFN; không hình thành bộ máy quản trị nhân sự độc lập tại SFEC.</p></div>`;
}
async function adminSubmissions(main){
  const d=await api("/api/admin/submissions");state.admin.submissions=d.items||[];
  main.innerHTML=`<div class="toolbar"><h1 style="margin-right:auto">Hồ sơ đăng ký</h1><button class="secondary" onclick="location.href='/api/admin/export/submissions.csv'">Xuất CSV</button></div>
  <div class="card table-scroll"><table><thead><tr><th>Mã</th><th>Loại</th><th>Người gửi</th><th>Trạng thái</th><th>Cập nhật</th><th></th></tr></thead><tbody>${state.admin.submissions.map(r=>`<tr><td><b>${E(r.code)}</b></td><td>${E(r.form_id)}</td><td>${E(r.full_name)}<br><span class="small">${E(r.email)}</span></td><td><span class="status">${E(r.status)}</span></td><td>${fmt(r.updated_at)}</td><td><button class="secondary" onclick="viewSubmission('${E(r.code)}')">Xử lý</button></td></tr>`).join("")}</tbody></table></div>`;
}
window.viewSubmission=async code=>{
  try{
    const d=await api(`/api/admin/submissions/${encodeURIComponent(code)}`),r=d.item;
    modal(`<button class="ghost" onclick="closeModal()">✕ Đóng</button><h2>${E(r.code)}</h2><p>${E(r.full_name)} • ${E(r.email)}</p>
    <div class="field"><label>Trạng thái</label><select id="subStatus">${["Đã tiếp nhận","Đang xem xét","Cần bổ sung","Mời phỏng vấn","Đang đánh giá","Đã duyệt","Không phù hợp","Hoàn tất"].map(s=>`<option ${s===r.status?"selected":""}>${E(s)}</option>`).join("")}</select></div>
    <div class="field"><label>Điểm tổng hợp</label><input id="subScore" type="number" step="0.1" value="${E(r.score??"")}"></div>
    <div class="field"><label>Ghi chú nội bộ</label><textarea id="subNote">${E(r.internal_note||"")}</textarea></div>
    <h3>Câu trả lời</h3>${Object.entries(r.answers||{}).map(([k,v])=>`<div class="card" style="margin:6px 0"><b>${E(k)}</b><br>${E(typeof v==="object"?JSON.stringify(v):v)}</div>`).join("")}
    <h3>Tệp</h3>${(d.files||[]).map(f=>`<p><a href="/api/files/${encodeURIComponent(f.id)}" target="_blank">${E(f.filename)}</a> (${Math.round((f.size||0)/1024)} KB)</p>`).join("")||"<p>Không có.</p>"}
    <div class="actions"><button class="primary" onclick="saveSubmission('${E(r.code)}')">Lưu xử lý</button>${isSFNGovernanceAdmin(state.user)?`<button class="secondary" onclick="scheduleInterview('${E(r.code)}')">Lịch làm việc (SFN)</button><button class="secondary" onclick="addEvaluation('${E(r.code)}')">Đánh giá (SFN)</button>`:""}<button class="secondary" onclick="requestGenericApproval('submission','${E(r.code)}')">Gửi phê duyệt</button>${isSFNGovernanceAdmin(state.user)&&["member","core","volunteer"].includes(r.form_id)&&r.status==="Đã duyệt"?`<button class="secondary" onclick="convertPerson('${E(r.code)}')">Chuyển xử lý qua SFN</button>`:""}</div>`);
  }catch(err){toast(errorText(err),"bad")}
}
window.saveSubmission=async code=>{try{await api(`/api/admin/submissions/${encodeURIComponent(code)}`,{method:"PATCH",body:{status:document.getElementById("subStatus").value,score:Number(document.getElementById("subScore").value)||null,internal_note:document.getElementById("subNote").value}});closeModal();toast("Đã lưu.");adminSubmissions(document.getElementById("adminMain"))}catch(e){toast(errorText(e),"bad")}}
window.convertPerson=code=>api(`/api/admin/submissions/${encodeURIComponent(code)}/convert-person`,{method:"POST"}).then(d=>toast("Đã tạo hồ sơ nhân sự #"+d.person_id)).catch(e=>toast(errorText(e),"bad"));
window.scheduleInterview=async code=>{const at=await askText("Thời gian phỏng vấn (YYYY-MM-DDTHH:MM)");if(!at)return;const url=await askText("Link Meet/Zoom (không bắt buộc)");if(url===null)return;api("/api/admin/interviews",{method:"POST",body:{submission_code:code,scheduled_at:at,meeting_url:url}}).then(()=>toast("Đã tạo lịch phỏng vấn.")).catch(e=>toast(errorText(e),"bad"))}
window.addEvaluation=async code=>{const score=await askText("Điểm tổng hợp (0–100)");if(score===null)return;if(score.trim()===""||!Number.isFinite(Number(score))||Number(score)<0||Number(score)>100){toast("Điểm phải nằm trong khoảng 0–100.","bad");return}const rec=await askText("Khuyến nghị");if(rec===null)return;const note=await askText("Ghi chú","",true);if(note===null)return;api("/api/admin/evaluations",{method:"POST",body:{submission_code:code,score:{total:Number(score)},recommendation:rec,note}}).then(()=>toast("Đã lưu đánh giá.")).catch(e=>toast(errorText(e),"bad"))}

async function adminApprovals(main){
  const d=await api("/api/admin/approvals");
  main.innerHTML=`<h1>Trung tâm phê duyệt</h1><div class="card table-scroll"><table><thead><tr><th>Loại</th><th>Hành động</th><th>Trạng thái</th><th>Hạn</th><th></th></tr></thead><tbody>${(d.items||[]).map(a=>`<tr><td>${E(a.entity_type)}<br><span class="small">${E(a.entity_id)}</span></td><td>${E(a.action)}</td><td><span class="status">${E(a.status)}</span></td><td>${fmt(a.due_at)}</td><td>${a.status==="pending"?`<button class="primary" onclick="decideApproval('${E(a.id)}','approved')">Phê duyệt</button> <button class="danger" onclick="decideApproval('${E(a.id)}','rejected')">Từ chối</button>`:""}</td></tr>`).join("")}</tbody></table></div>`;
}
window.decideApproval=async(id,status)=>{const note=await askText("Ghi chú quyết định (không bắt buộc)","",true);if(note===null)return;api(`/api/admin/approvals/${encodeURIComponent(id)}`,{method:"PATCH",body:{status,note}}).then(()=>{toast("Đã cập nhật phê duyệt.");adminApprovals(document.getElementById("adminMain"))}).catch(e=>toast(errorText(e),"bad"))}

async function adminUsers(main){
  const d=await api("/api/admin/users");state.admin.users=d.items||[];
  main.innerHTML=`<div class="toolbar"><h1 style="margin-right:auto">Tài khoản & Phân quyền</h1><button class="primary" onclick="inviteUser()">+ Cấp tài khoản</button></div>
  <div class="card table-scroll"><table><thead><tr><th>Người dùng</th><th>Vai trò</th><th>Xác minh</th><th>2FA</th><th>Trạng thái</th><th></th></tr></thead><tbody>${state.admin.users.map(u=>`<tr><td><b>${E(u.full_name||"")}</b><br>${E(u.email)}</td><td>${(u.roles||[]).map(r=>`<span class="badge-role">${E(r.role_id)}${r.scope_unit_code?` @ ${E(r.scope_unit_code)}`:""}</span>`).join("")}</td><td>${u.email_verified?"✓":"—"}</td><td>${u.totp_enabled?"✓":"—"}</td><td>${E(u.status)}</td><td><button class="secondary" onclick="editRoles(${u.id})">Quyền</button> <button class="ghost" onclick="resetUserPassword(${u.id},'${E(u.email)}')">Đặt lại MK</button> <button class="ghost" onclick="toggleUser(${u.id},'${E(u.status)}')">${u.status==="active"?"Khóa":"Mở khóa"}</button></td></tr>`).join("")}</tbody></table></div>`;
}
window.inviteUser=()=>{
  modal(`<button class="ghost" onclick="closeModal()">✕ Đóng</button><h2>Cấp tài khoản</h2><form id="inviteForm"><div class="field"><label>Họ và tên</label><input name="full_name" required></div><div class="field"><label>Email</label><input name="email" type="email" required></div><div class="field"><label>Vai trò ban đầu</label><select name="role"><option>student</option><option>member</option><option>volunteer</option><option>handler</option><option>unit_admin</option><option>communications</option><option>external_events</option><option>hr</option><option>office</option><option>club_secretary</option><option>system_admin</option><option>super_admin</option></select></div><div class="field"><label>Phạm vi đơn vị (nếu có)</label><input name="scope_unit_code" placeholder="Ví dụ: SFEC"></div><button class="primary">Cấp tài khoản</button></form>`);
  document.getElementById("inviteForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{const d=await api("/api/admin/users",{method:"POST",body:{full_name:f.get("full_name"),email:f.get("email"),roles:[f.get("role")],scope_unit_code:f.get("scope_unit_code")}});closeModal();modal(`<h2>Đã cấp tài khoản</h2><div class="notice warn">Mật khẩu tạm thời chỉ hiển thị lần này.</div><p><b>${E(f.get("email"))}</b></p><pre class="card">${E(d.temp_password)}</pre><button class="primary" onclick="closeModal()">Đã lưu</button>`)}catch(err){toast(errorText(err),"bad")}};
}
window.editRoles=idUser=>{
  const u=state.admin.users.find(x=>x.id===idUser);if(!u)return;
  const all=["student","member","volunteer","handler","unit_admin","communications","external_events","hr","office","club_secretary","system_admin","super_admin"];
  modal(`<button class="ghost" onclick="closeModal()">✕ Đóng</button><h2>Phân quyền — ${E(u.full_name||u.email)}</h2><div id="roleChecks">${all.map(r=>`<div class="check"><input type="checkbox" data-role="${r}" ${(u.roles||[]).some(x=>x.role_id===r)?"checked":""}><label>${r}</label></div>`).join("")}</div><div class="field"><label>Phạm vi đơn vị áp dụng cho vai trò mới</label><input id="roleScope" placeholder="SFEC hoặc để trống"></div><button class="primary" onclick="saveRoles(${idUser})">Lưu quyền</button>`);
}
window.saveRoles=async idUser=>{const roles=[...document.querySelectorAll("#roleChecks [data-role]:checked")].map(x=>({role_id:x.dataset.role,scope_unit_code:document.getElementById("roleScope").value.trim()}));try{await api(`/api/admin/users/${idUser}/roles`,{method:"PUT",body:{roles}});closeModal();toast("Đã cập nhật quyền.");adminUsers(document.getElementById("adminMain"))}catch(e){toast(errorText(e),"bad")}}
window.resetUserPassword=async(idUser,email)=>{if(!await askConfirm(`Tạo mật khẩu tạm thời mới cho ${email}? Tất cả phiên đăng nhập hiện tại sẽ bị thu hồi.`))return;try{const d=await api(`/api/admin/users/${idUser}/reset-password`,{method:"POST"});modal(`<h2>Mật khẩu tạm thời mới</h2><p>${E(email)}</p><pre class="card">${E(d.temp_password)}</pre><div class="notice warn">Mật khẩu này chỉ hiển thị lần này. Người dùng sẽ buộc đổi sau khi đăng nhập.</div><button class="primary" onclick="closeModal()">Đã lưu</button>`)}catch(e){toast(errorText(e),"bad")}}
window.toggleUser=async(idUser,status)=>{try{await api(`/api/admin/users/${idUser}/status`,{method:"PATCH",body:{status:status==="active"?"locked":"active"}});toast("Đã cập nhật.");adminUsers(document.getElementById("adminMain"))}catch(e){toast(errorText(e),"bad")}}

async function adminPeople(main){
  const d=await api("/api/admin/people");main.innerHTML=`<h1>Hồ sơ nhân sự điện tử</h1><div class="card table-scroll"><table><thead><tr><th>Họ tên</th><th>Email</th><th>Đơn vị</th><th>Chức danh/Vai trò</th><th>Trạng thái</th><th>Gia nhập</th></tr></thead><tbody>${(d.items||[]).map(p=>`<tr><td><b>${E(p.full_name)}</b></td><td>${E(p.email||"")}</td><td>${E(p.unit_code||"")}</td><td>${E(p.position||"")}</td><td><span class="status">${E(p.status)}</span></td><td>${E(p.joined_at||"")}</td></tr>`).join("")}</tbody></table></div>`;
}
async function adminRecruitment(main){
  main.innerHTML=`<h1>Tuyển dụng & Đánh giá</h1><div class="grid"><div class="card"><h3>Quy trình Core Team</h3><p>Tiếp nhận → Sàng lọc → Phỏng vấn → Đánh giá bổ sung → Thông báo → Tiếp nhận.</p><a class="primary" href="#admin/submissions">Mở hồ sơ</a></div><div class="card"><h3>TNV Dạy học</h3><p>Đánh giá đúng phạm vi Lớp 9/10/11/12/A1–A2/B1–B2/Giao tiếp/Từ vựng; có thể dạy thử trước khi phân lớp.</p><a class="primary" href="#admin/submissions">Mở hồ sơ TNV</a></div><div class="card"><h3>Chấm điểm & Phỏng vấn</h3><p>Mở một hồ sơ và dùng nút Lịch phỏng vấn / Chấm đánh giá.</p></div></div>`;
}


window.requestGenericApproval=async(entity_type,entity_id)=>{const action=await askText("Nội dung cần phê duyệt","Phê duyệt hồ sơ/đề xuất");if(!action)return;const role=await askText("Vai trò được giao phê duyệt","club_secretary");if(!role)return;api("/api/admin/approvals",{method:"POST",body:{entity_type,entity_id,action,assigned_role:role}}).then(()=>toast("Đã chuyển vào Trung tâm phê duyệt.")).catch(e=>toast(errorText(e),"bad"))}

async function adminTerms(main){
  const d=await api("/api/admin/terms");state.admin.terms=d.items||[];
  main.innerHTML=`<h1>Điều khoản & Chính sách</h1><p class="muted">Hệ thống lưu phiên bản điều khoản mà từng người đã xác nhận.</p>${state.admin.terms.map(t=>`<div class="card" style="margin:10px 0"><div class="toolbar"><div><b>${E(t.code)} — ${E(t.name)}</b><br><span class="small muted">Phiên bản ${E(t.version)} • ${E(t.status)}</span></div><button class="secondary" onclick="editTerm('${encodeURIComponent(t.code)}')">Sửa</button></div><pre style="white-space:pre-wrap;max-height:180px;overflow:auto">${E(t.body)}</pre></div>`).join("")}`;
}
window.editTerm=encoded=>{const code=decodeURIComponent(encoded),t=state.admin.terms.find(x=>x.code===code);if(!t)return;modal(`<h2>${E(code)}</h2><div class="field"><label>Tên</label><input id="termName" value="${E(t.name)}"></div><div class="field"><label>Phiên bản</label><input id="termVersion" value="${E(t.version)}"></div><div class="field"><label>Phạm vi</label><input id="termScope" value="${E(t.scope||"")}"></div><div class="field"><label>Nội dung</label><textarea id="termBody" style="min-height:360px">${E(t.body)}</textarea></div><button class="primary" onclick="saveTerm('${encodeURIComponent(code)}')">Lưu phiên bản</button>`)}
window.saveTerm=encoded=>{const code=decodeURIComponent(encoded);api(`/api/admin/terms/${encodeURIComponent(code)}`,{method:"PUT",body:{name:document.getElementById("termName").value,version:document.getElementById("termVersion").value,scope:document.getElementById("termScope").value,body:document.getElementById("termBody").value,status:"published"}}).then(()=>{closeModal();toast("Đã cập nhật điều khoản.");adminTerms(document.getElementById("adminMain"))}).catch(e=>toast(errorText(e),"bad"))}

async function adminTeaching(main){
  const [ppl,ts]=await Promise.all([api("/api/admin/people"),api("/api/admin/teaching-scopes")]);state.admin.people=ppl.items||[];state.admin.teaching=ts.items||[];
  main.innerHTML=`<div class="toolbar"><h1 style="margin-right:auto">Phạm vi TNV Dạy học</h1><button class="primary" onclick="addTeachingScope()">+ Thêm phạm vi</button></div><div class="notice">Các phạm vi chuẩn: Lớp 9, Lớp 10, Lớp 11, Lớp 12, A1–A2, B1–B2, Tiếng Anh Giao tiếp, Từ vựng. Được nhận làm TNV không đồng nghĩa được phép dạy tất cả phạm vi.</div><div class="card table-scroll"><table><thead><tr><th>Nhân sự</th><th>Phạm vi</th><th>Trạng thái</th><th>Ghi chú đánh giá</th><th></th></tr></thead><tbody>${state.admin.teaching.map(x=>`<tr><td>${E(x.full_name)}<br><span class="small">${E(x.email||"")}</span></td><td><b>${E(x.scope)}</b></td><td><span class="status">${E(x.status)}</span></td><td>${E(x.assessment_note||"")}</td><td><button class="secondary" onclick="editTeachingScope('${E(x.id)}')">Đánh giá</button></td></tr>`).join("")}</tbody></table></div>`;
}
window.addTeachingScope=async()=>{const person=await askText("ID hồ sơ nhân sự");if(!person)return;const scope=await askText("Phạm vi giảng dạy (Lớp 9/10/11/12/A1–A2/B1–B2/Giao tiếp/Từ vựng)");if(!scope)return;api("/api/admin/teaching-scopes",{method:"POST",body:{person_id:Number(person),scope,status:"Đang đánh giá"}}).then(()=>{toast("Đã thêm phạm vi.");adminTeaching(document.getElementById("adminMain"))}).catch(e=>toast(errorText(e),"bad"))}
window.editTeachingScope=idt=>{const x=state.admin.teaching.find(i=>i.id===idt);if(!x)return;modal(`<h2>${E(x.full_name)} — ${E(x.scope)}</h2><div class="field"><label>Trạng thái</label><select id="teachStatus">${["Đang đánh giá","Được mời dạy thử","Đã duyệt","Chưa được duyệt","Tạm dừng"].map(v=>`<option ${v===x.status?"selected":""}>${E(v)}</option>`).join("")}</select></div><div class="field"><label>Ghi chú đánh giá</label><textarea id="teachNote">${E(x.assessment_note||"")}</textarea></div><button class="primary" onclick="saveTeachingScope('${E(idt)}')">Lưu</button>`)}
window.saveTeachingScope=idt=>api(`/api/admin/teaching-scopes/${encodeURIComponent(idt)}`,{method:"PATCH",body:{status:document.getElementById("teachStatus").value,assessment_note:document.getElementById("teachNote").value}}).then(()=>{closeModal();toast("Đã cập nhật phạm vi.");adminTeaching(document.getElementById("adminMain"))}).catch(e=>toast(errorText(e),"bad"))

async function adminPrivacy(main){
  const d=await api("/api/admin/data-requests");state.admin.dataRequests=d.items||[];
  main.innerHTML=`<h1>Trung tâm Quyền riêng tư</h1><div class="card table-scroll"><table><thead><tr><th>Email</th><th>Yêu cầu</th><th>Trạng thái</th><th>Ngày gửi</th><th></th></tr></thead><tbody>${state.admin.dataRequests.map(x=>`<tr><td>${E(x.email)}</td><td>${E(x.request_type)}<br><span class="small">${E(x.note||"")}</span></td><td><span class="status">${E(x.status)}</span></td><td>${fmt(x.created_at)}</td><td><button class="secondary" onclick="processPrivacy('${E(x.id)}')">Xử lý</button></td></tr>`).join("")}</tbody></table></div>`;
}
window.processPrivacy=async idr=>{const status=await askText("Trạng thái xử lý","Đang xử lý");if(!status)return;const note=await askText("Ghi chú xử lý","",true);if(note===null)return;api(`/api/admin/data-requests/${encodeURIComponent(idr)}`,{method:"PATCH",body:{status,note}}).then(()=>{toast("Đã cập nhật.");adminPrivacy(document.getElementById("adminMain"))}).catch(e=>toast(errorText(e),"bad"))}

async function adminForms(main){
  const d=await api("/api/admin/forms");state.admin.forms=d.items||[];
  main.innerHTML=`<div class="toolbar"><h1 style="margin-right:auto">Form Builder</h1><button class="primary" onclick="createForm()">+ Tạo biểu mẫu</button></div><div class="grid">${state.admin.forms.map(f=>`<div class="card"><span class="pill">${E(f.prefix)}</span><h3>${E(f.name)}</h3><p class="muted">${E(f.description)}</p><p>Phiên bản: ${f.version} • ${f.enabled?"Đang bật":"Đang tắt"}</p><button class="secondary" onclick="editForm('${E(f.id)}')">Chỉnh biểu mẫu</button></div>`).join("")}</div>`;
}
window.editForm=idForm=>{
  const f=state.admin.forms.find(x=>x.id===idForm);if(!f)return;state.formBuilder=JSON.parse(JSON.stringify(f));
  renderFormBuilder();
}
function renderFormBuilder(){
  const f=state.formBuilder,c=f.config;
  modal(`<button class="ghost" onclick="closeModal()">✕ Đóng</button><h2>Chỉnh biểu mẫu — ${E(f.name)}</h2>
   <div class="row2"><div class="field"><label>Tên biểu mẫu</label><input id="fbName" value="${E(f.name)}"></div><div class="field"><label>Mã tiền tố</label><input id="fbPrefix" value="${E(f.prefix)}"></div></div>
   <div class="field"><label>Mô tả</label><textarea id="fbDesc">${E(f.description||"")}</textarea></div>
   <div id="builderSections">${(c.sections||[]).map((s,si)=>`<div class="builder-section"><div class="toolbar"><b>${E(s.title)}</b><button class="secondary" onclick="addBuilderField(${si})">+ Câu hỏi</button><button class="danger" onclick="deleteBuilderSection(${si})">Xóa phần</button></div>${(s.fields||[]).map((x,fi)=>`<div class="builder-field"><span><b>${E(x.label)}</b><br><span class="small muted">${E(x.key)}</span></span><span>${E(x.type)}</span><span>${x.required?"Bắt buộc":""}</span><span><button class="ghost" onclick="moveField(${si},${fi},-1)">↑</button><button class="ghost" onclick="moveField(${si},${fi},1)">↓</button><button class="danger" onclick="deleteBuilderField(${si},${fi})">×</button></span></div>`).join("")}</div>`).join("")}</div>
   <div class="actions"><button class="secondary" onclick="addBuilderSection()">+ Thêm phần</button><button class="primary" onclick="saveFormBuilder()">Lưu phiên bản mới</button></div>`);
}
window.addBuilderSection=async()=>{const title=await askText("Tên phần biểu mẫu");if(!title)return;state.formBuilder.config.sections.push({title,fields:[]});renderFormBuilder()}
window.deleteBuilderSection=async i=>{if(await askConfirm("Xóa phần này và các trường bên trong?")){state.formBuilder.config.sections.splice(i,1);renderFormBuilder()}}
window.addBuilderField=async si=>{const label=await askText("Nhãn câu hỏi");if(!label)return;const keyInput=await askText("Mã kỹ thuật (không dấu, không khoảng trắng)",label.toLowerCase().replace(/\s+/g,"_").replace(/[^\w]/g,""));if(keyInput===null)return;const key=(keyInput||label.toLowerCase().replace(/\s+/g,"_").replace(/[^\w]/g,"")).slice(0,50);const typeInput=await askText("Loại trường: text / email / date / textarea / select / checkbox / file","text");if(typeInput===null)return;const type=(typeInput||"text").trim().toLowerCase();if(!["text","email","date","textarea","select","checkbox","file"].includes(type)){toast("Loại trường không hợp lệ.","bad");return}const req=await askConfirm("Bắt buộc trả lời trường này?");let options=[];if(type==="select"){const raw=await askText("Các lựa chọn, cách nhau bằng dấu |","");if(raw===null)return;options=raw.split("|").map(x=>x.trim()).filter(Boolean)}state.formBuilder.config.sections[si].fields.push({key,label,type,required:req,options});renderFormBuilder()}
window.deleteBuilderField=(si,fi)=>{state.formBuilder.config.sections[si].fields.splice(fi,1);renderFormBuilder()}
window.moveField=(si,fi,dir)=>{const a=state.formBuilder.config.sections[si].fields,j=fi+dir;if(j<0||j>=a.length)return;[a[fi],a[j]]=[a[j],a[fi]];renderFormBuilder()}
window.saveFormBuilder=async()=>{state.formBuilder.name=document.getElementById("fbName").value;state.formBuilder.prefix=document.getElementById("fbPrefix").value;state.formBuilder.description=document.getElementById("fbDesc").value;try{await api(`/api/admin/forms/${encodeURIComponent(state.formBuilder.id)}`,{method:"PUT",body:{name:state.formBuilder.name,prefix:state.formBuilder.prefix,description:state.formBuilder.description,audience:state.formBuilder.audience,min_age:state.formBuilder.min_age,enabled:!!state.formBuilder.enabled,recipient_email:state.formBuilder.recipient_email,config:state.formBuilder.config}});closeModal();toast("Đã lưu phiên bản biểu mẫu.");adminForms(document.getElementById("adminMain"))}catch(e){toast(errorText(e),"bad")}}
window.createForm=async()=>{const name=await askText("Tên biểu mẫu");if(!name)return;const idForm=await askText("ID biểu mẫu (ví dụ: scholarship)");if(!idForm)return;if(!/^[a-z0-9_-]{2,60}$/i.test(idForm)){toast("ID chỉ gồm chữ, số, gạch ngang hoặc gạch dưới.","bad");return}const prefix=await askText("Tiền tố mã hồ sơ (ví dụ: SFEC-HB)","SFEC-FORM");if(!prefix)return;const cfg={id:idForm,name,prefix,description:"",audience:"public",term_codes:["PRIVACY/SFEC"],sections:[{title:"Thông tin",fields:[{key:"full_name",label:"Họ và tên",type:"text",required:true},{key:"email",label:"✉️ Email",type:"email",required:true}]}]};api("/api/admin/forms",{method:"POST",body:{id:idForm,name,prefix,description:"",audience:"public",config:cfg}}).then(()=>{toast("Đã tạo biểu mẫu.");adminForms(document.getElementById("adminMain"))}).catch(e=>toast(errorText(e),"bad"))}

async function adminNews(main){
  const d=await api("/api/admin/content/news");state.admin.news=d.items||[];
  main.innerHTML=`<div class="toolbar"><div style="margin-right:auto"><div class="section-kicker">NỘI DUNG</div><h1 style="margin:4px 0">Bản tin & CMS</h1><p class="muted">Soạn bài theo đoạn; hệ thống giữ nguyên xuống dòng khi xuất bản.</p></div><button class="primary" onclick="newsEditor()">Tạo bản tin</button></div><div class="card table-scroll"><table><thead><tr><th>Tiêu đề</th><th>Slug</th><th>Trạng thái</th><th>Ngày xuất bản</th><th></th></tr></thead><tbody>${state.admin.news.map(n=>`<tr><td><b>${E(n.title)}</b><br><span class="small muted">${E(newsExcerpt(n.body,90))}</span></td><td>${E(n.slug||"")}</td><td><span class="status">${E(n.status||"")}</span></td><td>${fmt(n.published_at)}</td><td><button class="secondary" onclick="newsEditor('${E(n.id)}')">Sửa</button> <button class="danger" onclick="deleteGeneric('news','${E(n.id)}')">Xóa</button></td></tr>`).join("")}</tbody></table></div>`;
}
window.newsEditor=id=>{const n=(state.admin.news||[]).find(x=>String(x.id)===String(id))||{};modal(`<button class="ghost" onclick="closeModal()">Đóng</button><div class="section-kicker">BẢN TIN & CMS</div><h2>${id?'Chỉnh sửa bản tin':'Tạo bản tin'}</h2><form id="newsEditorForm"><div class="field"><label>Tiêu đề</label><input name="title" required value="${E(n.title||'')}"></div><div class="field"><label>Slug</label><input name="slug" value="${E(n.slug||'')}"></div><div class="field"><label>Nội dung</label><textarea name="body" class="news-editor" required placeholder="Viết nội dung tại đây. Nhấn Enter để xuống dòng; cách một dòng để tạo đoạn mới.">${E(n.body||'')}</textarea><div class="small muted">Xuống dòng và khoảng cách giữa các đoạn sẽ được giữ khi đăng.</div></div><div class="row2"><div class="field"><label>Trạng thái</label><select name="status"><option value="draft">Bản nháp</option><option value="published">Đã xuất bản</option><option value="hidden">Ẩn</option></select></div><div class="field"><label>Ngày xuất bản</label><input name="published_at" type="datetime-local" value="${n.published_at?String(n.published_at).slice(0,16):''}"></div></div><div class="actions"><button class="primary">${id?'Lưu thay đổi':'Tạo bản tin'}</button><button type="button" class="secondary" onclick="previewNewsEditor()">Xem trước</button></div><div id="newsPreview"></div></form>`);document.querySelector('#newsEditorForm [name="status"]').value=n.status||'draft';document.getElementById('newsEditorForm').onsubmit=async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(e.target).entries());try{await api(id?`/api/admin/content/news/${encodeURIComponent(id)}`:'/api/admin/content/news',{method:id?'PUT':'POST',body:b});closeModal();toast(id?'Đã cập nhật bản tin.':'Đã tạo bản tin.');adminNews(document.getElementById('adminMain'))}catch(er){toast(errorText(er),'bad')}}}
window.previewNewsEditor=()=>{const f=document.getElementById('newsEditorForm'),box=document.getElementById('newsPreview');box.innerHTML=`<article class="news-detail preview"><h2>${E(f.title.value||'Tiêu đề bản tin')}</h2><div class="news-content">${newsBody(f.body.value)}</div></article>`}

async function adminGeneric(main,type,title,fields){
  const d=await api(`/api/admin/content/${type}`);state.admin[type]=d.items||[];
  main.innerHTML=`<div class="toolbar"><h1 style="margin-right:auto">${E(title)}</h1><button class="primary" onclick="createGeneric('${type}')">+ Thêm</button></div><div class="card table-scroll"><table><thead><tr>${fields.map(f=>`<th>${E(f)}</th>`).join("")}<th></th></tr></thead><tbody>${state.admin[type].map(x=>`<tr>${fields.map(f=>`<td>${E(String(x[f]??"").slice(0,220))}</td>`).join("")}<td><button class="secondary" onclick="editGeneric('${type}','${E(x.id||x.code)}')">Sửa</button> <button class="danger" onclick="deleteGeneric('${type}','${E(x.id||x.code)}')">Xóa</button></td></tr>`).join("")}</tbody></table></div>${type==="classes"?`<div class="card" style="margin-top:14px"><h2>Điểm danh</h2><p>Mở danh sách học viên theo lớp và ghi nhận Có mặt/Vắng/Có phép qua chức năng quản trị lớp.</p><button class="secondary" onclick="attendanceTool()">Mở công cụ điểm danh</button></div>`:""}${type==="events"?`<div class="card" style="margin-top:14px"><h2>Check-in</h2><button class="secondary" onclick="checkinTool()">Nhập mã check-in</button></div>`:""}`;
}
const genericFields={
 news:["title","slug","body","status","published_at"],
 classes:["unit_code","title","level","status","capacity","schedule_json","data_json"],
 events:["unit_code","title","start_at","end_at","status","capacity","data_json"],
 units:["code","name","unit_type","manager_name","email","status","data_json"],
 documents:["code","doc_type","title","visibility","status","file_id","issued_at","metadata_json"],
 tasks:["title","description","assigned_to","unit_code","status","priority","due_at"]
};
window.createGeneric=async type=>{const body={};for(const f of genericFields[type]||[]){const v=await askText(f,f.endsWith("_json")?"{}":"",f.endsWith("_json"));if(v===null)return;body[f]=v;if(["capacity","assigned_to"].includes(f)&&v!==""){body[f]=Number(v);if(!Number.isFinite(body[f])){toast(`${f} phải là số hợp lệ.`,"bad");return}}}if(type!=="units")body.id=body.id||undefined;api(`/api/admin/content/${type}`,{method:"POST",body}).then(()=>{toast("Đã thêm.");adminGeneric(document.getElementById("adminMain"),type,adminTitle(type),displayFields(type))}).catch(e=>toast(errorText(e),"bad"))}
window.editGeneric=async(type,idv)=>{const x=(state.admin[type]||[]).find(o=>String(o.id||o.code)===String(idv));if(!x)return;const body={};for(const f of genericFields[type]||[]){const v=await askText(f,String(x[f]??""),f.endsWith("_json"));if(v===null)return;body[f]=v;if(["capacity","assigned_to"].includes(f)&&v!==""){body[f]=Number(v);if(!Number.isFinite(body[f])){toast(`${f} phải là số hợp lệ.`,"bad");return}}}api(`/api/admin/content/${type}/${encodeURIComponent(idv)}`,{method:"PUT",body}).then(()=>{toast("Đã cập nhật.");adminGeneric(document.getElementById("adminMain"),type,adminTitle(type),displayFields(type))}).catch(e=>toast(errorText(e),"bad"))}
window.deleteGeneric=async(type,idv)=>{if(!await askConfirm("Xóa mục này? Thao tác có thể ảnh hưởng nội dung đang sử dụng."))return;api(`/api/admin/content/${type}/${encodeURIComponent(idv)}`,{method:"DELETE"}).then(()=>{toast("Đã xóa.");adminGeneric(document.getElementById("adminMain"),type,adminTitle(type),displayFields(type))}).catch(e=>toast(errorText(e),"bad"))}
function adminTitle(t){return {news:"Tin tức & CMS",classes:"Lớp học",events:"Sự kiện",documents:"📚 Kho văn bản",tasks:"📌 Nhiệm vụ"}[t]||t}
function displayFields(t){return {news:["title","slug","status","published_at"],classes:["unit_code","title","level","status","capacity"],events:["unit_code","title","start_at","status"],units:["code","name","unit_type","manager_name","status"],documents:["code","doc_type","title","visibility","status"],tasks:["title","assigned_to","unit_code","status","priority","due_at"]}[t]||[]}
window.attendanceTool=async()=>{const classId=await askText("ID lớp (ví dụ SFEC-L9)");if(!classId)return;try{const d=await api(`/api/admin/class-enrollments?class_id=${encodeURIComponent(classId)}`);modal(`<h2>Điểm danh ${E(classId)}</h2>${(d.items||[]).map(x=>`<div class="card"><b>${E(x.full_name)}</b> — ${E(x.email||"")}<div class="actions"><button class="secondary" onclick="markAttendance('${E(classId)}',${x.id},'Có mặt')">Có mặt</button><button class="secondary" onclick="markAttendance('${E(classId)}',${x.id},'Có phép')">Có phép</button><button class="danger" onclick="markAttendance('${E(classId)}',${x.id},'Vắng')">Vắng</button></div></div>`).join("")||"<p>Chưa có học viên.</p>"}`)}catch(e){toast(errorText(e),"bad")}}
window.markAttendance=(classId,enrollmentId,status)=>api("/api/admin/attendance",{method:"POST",body:{class_id:classId,enrollment_id:enrollmentId,session_date:new Date().toISOString().slice(0,10),status}}).then(()=>toast("Đã điểm danh.")).catch(e=>toast(errorText(e),"bad"))
window.checkinTool=async()=>{const code=await askText("Mã check-in");if(!code)return;api("/api/admin/event-checkin",{method:"POST",body:{checkin_code:code}}).then(()=>toast("Check-in thành công.")).catch(e=>toast(errorText(e),"bad"))}

async function adminCertificates(main){
  const d=await api("/api/admin/certificates");state.admin.certificates=d.items||[];
  main.innerHTML=`<div class="toolbar"><h1 style="margin-right:auto">Tra cứu & hồ sơ GCN/GXN</h1></div>
  <div class="notice"><b>Giới hạn thẩm quyền:</b> SFEC không tạo, chỉnh sửa, phát hành hoặc thu hồi GCN/GXN. Khu vực này chỉ hiển thị hồ sơ lịch sử hiện có; việc xác minh phải dựa trên nguồn phát hành có thẩm quyền của Sky First Network hoặc đơn vị được ủy quyền.</div>
  <div class="card table-scroll"><table><thead><tr><th>Mã GCN/GXN</th><th>Người được ghi nhận</th><th>Nội dung</th><th>Trạng thái lưu trữ</th></tr></thead><tbody>${state.admin.certificates.map(c=>`<tr><td><b>${E(c.code||"Chưa có mã nguồn")}</b></td><td>${E(c.full_name||"—")}<br>${E(c.email||"")}</td><td>${E(c.content||"—")}</td><td><span class="status">${E(c.status||"Chưa xác minh")}</span></td></tr>`).join("")||'<tr><td colspan="4">Không có hồ sơ lưu trữ.</td></tr>'}</tbody></table></div>
  <p class="muted small">Không có thao tác phát hành/thu hồi hoặc tải GCN trong SFEC. Không coi trạng thái lưu trữ tại đây là xác minh chính thức.</p>`;
}
window.requestCertificate=()=>toast("SFEC không có thẩm quyền tạo hoặc phát hành GCN/GXN. Hãy dùng hệ thống của đơn vị phát hành được ủy quyền.","bad");
window.issueCert=()=>toast("Thao tác phát hành bị khóa theo thẩm quyền SFEC.","bad");
window.showCertQR=()=>toast("Hãy xác minh mã qua nguồn phát hành có thẩm quyền.","bad");
window.revokeCert=()=>toast("SFEC không có thẩm quyền thu hồi GCN/GXN.","bad");


async function adminTickets(main){
  const d=await api("/api/admin/tickets");state.admin.tickets=d.items||[];
  main.innerHTML=`<h1>Hỗ trợ & Ticket</h1><div class="card table-scroll"><table><thead><tr><th>Mã</th><th>Người gửi</th><th>Loại</th><th>Ưu tiên</th><th>Trạng thái</th><th></th></tr></thead><tbody>${state.admin.tickets.map(t=>`<tr><td><b>${E(t.code)}</b></td><td>${E(t.submitter_name||"")}<br>${E(t.email||"")}</td><td>${E(t.ticket_type||"")}</td><td>${E(t.priority)}</td><td>${E(t.status)}</td><td><button class="secondary" onclick="editTicket('${E(t.id)}')">Xử lý</button></td></tr>`).join("")}</tbody></table></div>`;
}
window.editTicket=idt=>{const t=state.admin.tickets.find(x=>x.id===idt);if(!t)return;modal(`<h2>${E(t.code)}</h2><div class="field"><label>Ưu tiên</label><select id="tPriority">${["Thấp","Bình thường","Cao","Khẩn"].map(x=>`<option ${x===t.priority?"selected":""}>${x}</option>`)}</select></div><div class="field"><label>Trạng thái</label><select id="tStatus">${["Mới","Đang xử lý","Chờ phản hồi","Đã giải quyết","Đã đóng"].map(x=>`<option ${x===t.status?"selected":""}>${x}</option>`)}</select></div><div class="field"><label>Phản hồi nội bộ</label><textarea id="tMessage"></textarea></div><button class="primary" onclick="saveTicket('${E(idt)}')">Lưu</button>`)}
window.saveTicket=idt=>api(`/api/admin/tickets/${encodeURIComponent(idt)}`,{method:"PATCH",body:{priority:document.getElementById("tPriority").value,status:document.getElementById("tStatus").value,message:document.getElementById("tMessage").value}}).then(()=>{closeModal();toast("Đã cập nhật ticket.");adminTickets(document.getElementById("adminMain"))}).catch(e=>toast(errorText(e),"bad"))

async function adminStudio(main){
  const d=await api("/api/admin/site-pages");
  state.admin.sitePages=d.items||[];
  const names={home:"Trang chủ",about:"Giới thiệu",journey:"Hành trình",values:"Định hướng & Giá trị",organization:"Mô hình trực thuộc SFN"};
  main.innerHTML=`<div class="admin-hero-pro"><div><span class="pill">SFEC WEBSITE STUDIO</span><h1>Điều khiển website như một CMS thật</h1><p>Chỉnh nội dung, SEO, ảnh bìa, xuất bản/nháp và khôi phục phiên bản cũ ngay trong trang quản trị.</p></div><div class="actions"><button class="primary" onclick="openSitePage('home')">Sửa Trang chủ</button><button class="secondary" onclick="location.hash='admin/media'">Mở Media</button></div></div>
  <div class="studio-grid">${state.admin.sitePages.map(x=>`<button class="studio-page-card" onclick="openSitePage('${E(x.slug)}')"><span class="studio-status ${E(x.status)}">${E(x.status)}</span><b>${E(names[x.slug]||x.title)}</b><small>${E(x.title)}</small><em>Cập nhật: ${fmt(x.updated_at)}</em></button>`).join("")}</div>
  <div class="card pro-tip"><b>⚡ Workflow nhanh</b><span>Upload ảnh → chọn ảnh trong Media → chèn vào nội dung → xem Preview → Publish. Mỗi lần lưu hệ thống tự tạo phiên bản để có thể khôi phục.</span></div>`;
}
window.openSitePage=async slug=>{
  try{
    const d=await api(`/api/admin/site-pages/${encodeURIComponent(slug)}`),x=d.item;
    state.admin.currentSitePage=x;state.admin.currentSiteRevisions=d.revisions||[];
    const media=await api("/api/admin/media").catch(()=>({items:[]}));state.admin.media=media.items||[];
    mainSiteEditor(slug,x,d.revisions||[]);
  }catch(e){toast(errorText(e),"bad")}
}
function mainSiteEditor(slug,x,revisions){
  const main=document.getElementById("adminMain");
  main.innerHTML=`<div class="toolbar"><button class="ghost" onclick="adminStudio(document.getElementById('adminMain'))">← Website Studio</button><div style="margin-left:auto" class="actions"><button class="secondary" onclick="toggleCmsFullscreen()">⛶ Toàn màn hình</button><button class="secondary" onclick="restoreCmsDraft('${E(slug)}')">Khôi phục nháp</button><button class="secondary" onclick="previewSitePage()">Preview</button><button class="primary" onclick="saveSitePage('${E(slug)}')">Lưu thay đổi</button></div></div>
  <div class="cms-editor-shell" id="cmsEditorShell"><section class="cms-editor-main"><div class="card"><div class="editor-head"><div><span class="pill">${E(slug)}</span><h1>${E(x.title)}</h1></div><select id="cmsStatus"><option value="inherit" ${x.status==='inherit'?'selected':''}>Dùng nội dung mặc định</option><option value="draft" ${x.status==='draft'?'selected':''}>Bản nháp</option><option value="published" ${x.status==='published'?'selected':''}>Đã xuất bản</option></select></div>
  <div class="grid2"><div class="field"><label>Tiêu đề trang</label><input id="cmsTitle" value="${E(x.title)}"></div><div class="field"><label>Kicker / nhãn trên tiêu đề</label><input id="cmsKicker" value="${E(x.kicker||'')}"></div></div>
  <div class="editor-toolbar"><button onclick="cmsWrap('<h2>','</h2>')">H2</button><button onclick="cmsWrap('<h3>','</h3>')">H3</button><button onclick="cmsWrap('<b>','</b>')"><b>B</b></button><button onclick="cmsWrap('<p>','</p>')">P</button><button onclick="cmsWrap('<blockquote>','</blockquote>')">Quote</button><button onclick="insertCmsLink()">Link</button><button onclick="pickCmsImage()">+ Ảnh</button></div>
  <div class="field"><label>Nội dung HTML</label><textarea id="cmsBody" class="cms-code" oninput="cmsLivePreview()">${E(x.body_html||'')}</textarea><div class="small muted">Bạn có thể dùng HTML cơ bản. Ảnh được lưu trên R2 và chèn bằng đường dẫn /api/files/...</div></div></div>
  <div class="card"><h2>SEO & chia sẻ</h2><div class="field"><label>SEO title</label><input id="cmsSeoTitle" value="${E(x.seo_title||'')}"></div><div class="field"><label>SEO description</label><textarea id="cmsSeoDesc">${E(x.seo_description||'')}</textarea></div><div class="field"><label>Ảnh bìa / Cover file ID</label><div class="toolbar"><input id="cmsCover" value="${E(x.cover_file_id||'')}" placeholder="media_..."><button class="secondary" onclick="pickCoverImage()">Chọn ảnh</button></div></div></div>
  <div class="card"><h2>Lịch sử phiên bản</h2>${revisions.length?revisions.map(r=>`<div class="revision-row"><div><b>#${r.id} · ${E(r.title)}</b><small>${fmt(r.created_at)} · ${E(r.status)}</small></div><button class="ghost" onclick="restoreSiteRevision('${E(slug)}',${r.id})">Khôi phục</button></div>`).join(''):'<p class="muted">Chưa có phiên bản cũ.</p>'}</div></section>
  <aside class="cms-preview-side"><div class="preview-sticky"><div class="preview-label">LIVE PREVIEW</div><div id="cmsPreview" class="cms-preview"></div></div></aside></div>`;
  const draftKey=`sfec-cms-draft:${slug}`;
  const draftStatus=document.createElement('p');draftStatus.id='cmsDraftStatus';draftStatus.className='small muted';draftStatus.textContent='Nháp tự động được lưu trên trình duyệt này.';
  const editor=document.getElementById('cmsBody');editor.closest('.field').appendChild(draftStatus);
  const saveDraft=()=>{try{const draft={title:document.getElementById('cmsTitle').value,kicker:document.getElementById('cmsKicker').value,body_html:editor.value,status:document.getElementById('cmsStatus').value,seo_title:document.getElementById('cmsSeoTitle').value,seo_description:document.getElementById('cmsSeoDesc').value,cover_file_id:document.getElementById('cmsCover').value,updated_at:new Date().toISOString()};localStorage.setItem(draftKey,JSON.stringify(draft));draftStatus.textContent='Đã lưu nháp trên thiết bị lúc '+new Date().toLocaleTimeString('vi-VN');}catch{draftStatus.textContent='Không thể lưu nháp trên trình duyệt này.'}};
  ['cmsTitle','cmsKicker','cmsBody','cmsStatus','cmsSeoTitle','cmsSeoDesc','cmsCover'].forEach(id=>document.getElementById(id)?.addEventListener('input',()=>{cmsLivePreview();saveDraft()}));
  cmsLivePreview();
}
window.toggleCmsFullscreen=()=>document.getElementById('cmsEditorShell')?.classList.toggle('cms-fullscreen-mode');
window.restoreCmsDraft=slug=>{try{const raw=localStorage.getItem(`sfec-cms-draft:${slug}`);if(!raw){toast('Không tìm thấy nháp trên thiết bị này.','bad');return}const d=JSON.parse(raw);for(const [k,id] of Object.entries({title:'cmsTitle',kicker:'cmsKicker',body_html:'cmsBody',status:'cmsStatus',seo_title:'cmsSeoTitle',seo_description:'cmsSeoDesc',cover_file_id:'cmsCover'})){const el=document.getElementById(id);if(el&&d[k]!==undefined)el.value=d[k]}cmsLivePreview();toast('Đã khôi phục nháp cục bộ.');}catch{toast('Không đọc được nháp.','bad')}};
window.cmsWrap=(a,b)=>{const t=document.getElementById('cmsBody');const s=t.selectionStart,e=t.selectionEnd,v=t.value;t.value=v.slice(0,s)+a+v.slice(s,e)+b+v.slice(e);t.focus();t.selectionStart=s+a.length;t.selectionEnd=e+a.length+(e-s);cmsLivePreview()}
window.insertCmsLink=async()=>{const url=await askText('URL liên kết','https://');if(!url)return;try{const u=new URL(url);if(!['https:','http:'].includes(u.protocol))throw new Error();cmsWrap(`<a href="${E(u.href)}" target="_blank" rel="noopener">`,'</a>')}catch{toast('URL không hợp lệ. Chỉ dùng liên kết HTTP hoặc HTTPS.','bad')}}
window.cmsLivePreview=()=>{const p=document.getElementById('cmsPreview'),b=document.getElementById('cmsBody');if(p&&b)p.innerHTML=`<div class="section-kicker">${E(document.getElementById('cmsKicker')?.value||'')}</div><h1>${E(document.getElementById('cmsTitle')?.value||'')}</h1><div class="info-copy">${b.value||'<p class="muted">Chưa có nội dung tùy chỉnh.</p>'}</div>`}
window.previewSitePage=()=>{const html=document.getElementById('cmsPreview')?.innerHTML||'';modal(`<div class="cms-full-preview"><button class="ghost" onclick="closeModal()">✕ Đóng</button>${html}</div>`)}
window.saveSitePage=slug=>api(`/api/admin/site-pages/${encodeURIComponent(slug)}`,{method:'PUT',body:{title:document.getElementById('cmsTitle').value,kicker:document.getElementById('cmsKicker').value,body_html:document.getElementById('cmsBody').value,status:document.getElementById('cmsStatus').value,seo_title:document.getElementById('cmsSeoTitle').value,seo_description:document.getElementById('cmsSeoDesc').value,cover_file_id:document.getElementById('cmsCover').value||null}}).then(()=>{try{localStorage.removeItem(`sfec-cms-draft:${slug}`)}catch{}toast('Đã lưu trang và tạo revision.');openSitePage(slug)}).catch(e=>toast(errorText(e),'bad'))
window.restoreSiteRevision=async(slug,id)=>{if(!await askConfirm('Khôi phục phiên bản này? Nội dung hiện tại sẽ được thay thế.'))return;api(`/api/admin/site-pages/${encodeURIComponent(slug)}/revisions/${id}/restore`,{method:'POST'}).then(()=>{toast('Đã khôi phục phiên bản.');openSitePage(slug)}).catch(e=>toast(errorText(e),'bad'))}
function mediaPicker(mode='insert'){
  const items=state.admin.media||[];
  modal(`<h2>Chọn ảnh từ Media</h2><div class="media-picker">${items.map(m=>`<button onclick="selectCmsMedia('${E(m.id)}','${E(m.url)}','${mode}')"><img src="${E(m.url)}" alt=""><span>${E(m.filename)}</span></button>`).join('')||'<p class="muted">Chưa có ảnh. Hãy upload trong Thư viện Media.</p>'}</div>`)
}
window.pickCmsImage=()=>mediaPicker('insert');window.pickCoverImage=()=>mediaPicker('cover');
window.selectCmsMedia=async(id,url,mode)=>{closeModal();if(mode==='cover'){document.getElementById('cmsCover').value=id;return}const alt=await askText('Mô tả ảnh thay thế (alt)','');if(alt===null)return;const t=document.getElementById('cmsBody');const snippet=`\n<figure class="cms-figure"><img src="${url}" alt="${E(alt)}" loading="lazy"><figcaption>${E(alt)}</figcaption></figure>\n`;const pos=t.selectionStart||t.value.length;t.value=t.value.slice(0,pos)+snippet+t.value.slice(pos);cmsLivePreview()}

async function adminMedia(main){
  const d=await api('/api/admin/media');state.admin.media=d.items||[];
  main.innerHTML=`<div class="admin-hero-pro compact"><div><span class="pill">MEDIA LIBRARY</span><h1>Ảnh của website</h1><p>Upload JPG, PNG, WEBP, GIF lên R2; ảnh công khai có URL ổn định để dùng cho trang, bản tin và hero.</p></div><button class="primary" onclick="uploadSiteMedia()">+ Tải ảnh lên</button></div><div class="media-grid">${state.admin.media.map(m=>`<article class="media-card"><img src="${E(m.url)}" alt=""><div><b>${E(m.filename)}</b><small>${Math.round((m.size||0)/1024)} KB · ${fmt(m.created_at)}</small><div class="actions"><button class="ghost" onclick="copyMediaUrl('${E(m.url)}')">Copy URL</button><button class="danger" onclick="deleteMedia('${E(m.id)}')">Xóa</button></div></div></article>`).join('')||'<div class="notice">Chưa có ảnh nào.</div>'}</div>`;
}
window.uploadSiteMedia=()=>{modal(`<h2>Tải ảnh lên website</h2><form id="mediaUpload"><div class="drop-upload"><input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required><b>Chọn ảnh</b><span>JPG, PNG, WEBP hoặc GIF</span></div><button class="primary">Upload lên R2</button></form>`);document.getElementById('mediaUpload').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target);try{await api('/api/admin/media',{method:'POST',body:fd});closeModal();toast('Đã upload ảnh.');adminMedia(document.getElementById('adminMain'))}catch(err){toast(errorText(err),'bad')}}}
window.copyMediaUrl=async url=>{await navigator.clipboard.writeText(location.origin+url);toast('Đã copy URL ảnh.')}
window.deleteMedia=async id=>{if(!await askConfirm('Xóa ảnh này khỏi R2? Các trang đang dùng ảnh có thể bị mất ảnh.'))return;api(`/api/admin/files/${encodeURIComponent(id)}`,{method:'DELETE'}).then(()=>{toast('Đã xóa ảnh.');adminMedia(document.getElementById('adminMain'))}).catch(e=>toast(errorText(e),'bad'))}

async function adminFiles(main){
  const d=await api("/api/admin/files");main.innerHTML=`<div class="toolbar"><h1 style="margin-right:auto">File & Minh chứng</h1><button class="primary" onclick="uploadAdminFile()">+ Upload</button></div><div class="card table-scroll"><table><thead><tr><th>Tệp</th><th>Loại</th><th>Dung lượng</th><th>Quyền</th><th></th></tr></thead><tbody>${(d.items||[]).map(f=>`<tr><td><a href="/api/files/${E(f.id)}" target="_blank">${E(f.filename)}</a></td><td>${E(f.mime)}</td><td>${Math.round((f.size||0)/1024)} KB</td><td>${E(f.visibility)}</td><td><button class="danger" onclick="deleteFile('${E(f.id)}')">Xóa</button></td></tr>`).join("")}</tbody></table></div>`;
}
window.uploadAdminFile=()=>{modal(`<h2>Upload file</h2><form id="upFile"><div class="field"><input name="file" type="file" required></div><div class="check"><input name="public" type="checkbox"><label>Cho phép công khai</label></div><button class="primary">Upload</button></form>`);document.getElementById("upFile").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),fd=new FormData();fd.append("file",f.get("file"));fd.append("visibility",f.get("public")?"public":"private");try{await api("/api/admin/upload",{method:"POST",body:fd});closeModal();toast("Đã upload.");adminFiles(document.getElementById("adminMain"))}catch(err){toast(errorText(err),"bad")}}}
window.deleteFile=async idf=>{if(!await askConfirm("Xóa file này?"))return;api(`/api/admin/files/${encodeURIComponent(idf)}`,{method:"DELETE"}).then(()=>{toast("Đã xóa.");adminFiles(document.getElementById("adminMain"))}).catch(e=>toast(errorText(e),"bad"))}

async function adminEmail(main){
  const [t,l,provider]=await Promise.all([api("/api/admin/email-templates"),api("/api/admin/email-logs"),api("/api/admin/email-settings")]);state.admin.emailTemplates=t.items||[];
  const p=provider||{};
  main.innerHTML=`<div class="admin-hero-pro compact"><div><span class="pill">SFEC · EMAIL AUTOMATION</span><h1>Email tự động</h1><p>Một trung tâm quản lý mẫu, gửi thử, nhật ký và lỗi cho các module SFEC.</p></div><span class="pill ${p.configured?'success':'warning'}">${E(p.provider||'Chưa cấu hình')}</span></div><div class="card" style="margin:12px 0"><h2>Kiểm tra gửi email</h2><p class="muted">Nguồn gửi: ${E(p.from||'sfec@skyfirst.io.vn')}. Khóa nhà cung cấp chỉ cấu hình bằng secret ở Cloudflare, không nhập tại đây.</p><div class="field"><label>Email nhận thử</label><input id="emailTestTo" type="email" placeholder="email-kiem-thu@example.com" autocomplete="email"></div><div class="field"><label>Mẫu thử</label><select id="emailTestKey">${state.admin.emailTemplates.map(x=>`<option value="${E(x.key)}">${E(x.key)} — ${E(x.subject_template)}</option>`).join('')}</select></div><button class="primary" onclick="sendEmailTest()">Gửi thử</button></div><h2>Mẫu email (${state.admin.emailTemplates.length})</h2><div class="grid-cards">${state.admin.emailTemplates.map(x=>`<article class="card" style="margin:8px 0"><b>${E(x.key)}</b><p>${E(x.subject_template)}</p><span class="pill ${x.enabled?'success':'warning'}">${x.enabled?'Đang bật':'Đã tắt'}</span><button class="secondary" onclick="editEmailTemplate('${E(x.key)}')">Sửa mẫu</button></article>`).join('')}</div><h2 class="section-title">Nhật ký email</h2><div class="card table-scroll"><table><thead><tr><th>Đến</th><th>Mẫu</th><th>Trạng thái</th><th>Thời gian</th><th>Lỗi</th><th>Thao tác</th></tr></thead><tbody>${(l.items||[]).slice(0,300).map(x=>`<tr><td>${E(x.to_email)}</td><td>${E(x.template_key)}</td><td>${E(x.status)}</td><td>${fmt(x.created_at)}</td><td>${E(x.error||'')}</td><td>${x.retryable&&['failed','pending'].includes(x.status)?`<button class="secondary" onclick="retryEmail('${x.id}')">Thử gửi lại (${Number(x.retry_count||0)}/3)</button>`:'—'}</td></tr>`).join('')||'<tr><td colspan="6">Chưa có nhật ký email.</td></tr>'}</tbody></table></div>`;
}
window.sendEmailTest=async()=>{const to=document.getElementById('emailTestTo').value.trim(),key=document.getElementById('emailTestKey').value;if(!to){toast('Nhập email nhận thử trước.','bad');return}try{const r=await api('/api/admin/email-test',{method:'POST',body:{to,template_key:key}});toast(r.ok?'Email thử đã được gửi.':'Email chưa gửi được.',r.ok?'good':'bad');await adminEmail(document.getElementById('adminMain'))}catch(e){toast(errorText(e),'bad');await adminEmail(document.getElementById('adminMain'))}};
window.retryEmail=async id=>{if(!await askConfirm('Thử gửi lại email này? Chỉ thực hiện tối đa 3 lần.'))return;try{const r=await api(`/api/admin/email-logs/${encodeURIComponent(id)}/retry`,{method:'POST',body:{}});toast(r.ok?'Đã gửi lại email.':'Chưa gửi lại được: '+(r.error||''),r.ok?'good':'bad');await adminEmail(document.getElementById('adminMain'))}catch(e){toast(errorText(e),'bad');await adminEmail(document.getElementById('adminMain'))}};
window.editEmailTemplate=key=>{const x=state.admin.emailTemplates.find(t=>t.key===key);if(!x)return;modal(`<h2>Sửa mẫu email: ${E(key)}</h2><div class="field"><label>Tiêu đề</label><input id="etSubject" value="${E(x.subject_template)}"></div><div class="field"><label>Nội dung HTML (Times New Roman)</label><textarea id="etHtml" style="min-height:280px;font-family:ui-monospace,monospace">${E(x.html_template)}</textarea></div><div class="field"><label>Nội dung văn bản</label><textarea id="etText" style="min-height:140px">${E(x.text_template||'')}</textarea></div><div class="check"><input id="etEnabled" type="checkbox" ${x.enabled?'checked':''}><label>Bật mẫu này</label></div><div class="field"><label>Nhóm sự kiện</label><select id="etGroup"><option ${x.event_group==='Tài khoản'?'selected':''}>Tài khoản</option><option ${x.event_group==='Hồ sơ'?'selected':''}>Hồ sơ</option><option ${x.event_group==='Lớp học'?'selected':''}>Lớp học</option><option ${x.event_group==='Hoạt động'?'selected':''}>Hoạt động</option><option ${x.event_group==='Hỗ trợ'?'selected':''}>Hỗ trợ</option><option ${x.event_group==='Tin tức'?'selected':''}>Tin tức</option><option ${x.event_group==='Phê duyệt'?'selected':''}>Phê duyệt</option><option ${x.event_group==='Quyền riêng tư'?'selected':''}>Quyền riêng tư</option><option ${x.event_group==='Vận hành'?'selected':''}>Vận hành</option><option ${x.event_group==='general'?'selected':''}>general</option></select></div><div class="field"><label>Người nhận</label><select id="etRecipientMode"><option value="user" ${x.recipient_mode==='user'?'selected':''}>Người dùng / người nhận từ nghiệp vụ</option><option value="internal" ${x.recipient_mode==='internal'?'selected':''}>Hộp thư nội bộ</option><option value="override" ${x.recipient_mode==='override'?'selected':''}>Địa chỉ cố định</option></select></div><div class="field"><label>Email cố định (chỉ dùng khi chọn địa chỉ cố định)</label><input id="etRecipientOverride" type="email" value="${E(x.recipient_override||'')}"></div><button class="secondary" onclick="closeModal()">Hủy</button> <button class="primary" onclick="saveEmailTemplate('${E(key)}')">Lưu mẫu</button>`)};
window.saveEmailTemplate=key=>api(`/api/admin/email-templates/${encodeURIComponent(key)}`,{method:'PUT',body:{subject_template:document.getElementById('etSubject').value,html_template:document.getElementById('etHtml').value,text_template:document.getElementById('etText').value,enabled:document.getElementById('etEnabled').checked,event_group:document.getElementById('etGroup').value,recipient_mode:document.getElementById('etRecipientMode').value,recipient_override:document.getElementById('etRecipientOverride').value}}).then(()=>{closeModal();toast('Đã lưu mẫu email.');adminEmail(document.getElementById('adminMain'))}).catch(e=>toast(errorText(e),'bad'));

async function adminModules(main){
  const d=await api("/api/admin/modules");state.admin.modules=d.items||[];
  main.innerHTML=`<h1>Quản lý Modules</h1><p class="muted">Bật/tắt chức năng theo nhu cầu mà không phải tạo lại ZIP.</p><div class="card">${state.admin.modules.map(m=>`<div class="check"><input type="checkbox" data-module="${E(m.key)}" ${m.enabled?"checked":""}><label><b>${E(m.name)}</b> — ${E(m.description||"")} <span class="small muted">(${E(m.category)})</span></label></div>`).join("")}<button class="primary" onclick="saveModules()">Lưu Modules</button></div>`;
}
window.saveModules=()=>{const items=state.admin.modules.map(m=>({key:m.key,enabled:document.querySelector(`[data-module="${CSS.escape(m.key)}"]`).checked}));api("/api/admin/modules",{method:"PUT",body:{items}}).then(async()=>{toast("Đã cập nhật Modules.");await loadConfig()}).catch(e=>toast(errorText(e),"bad"))}

async function adminSettings(main){
  const [d,mail]=await Promise.all([api("/api/admin/settings"),api("/api/admin/email-settings").catch(()=>({configured:false,provider:"none",providerPreference:"auto",senderName:"Câu lạc bộ Giáo dục Sky First (SFEC)",replyTo:"sfec@skyfirst.io.vn",internalRecipient:"sfec@skyfirst.io.vn"}))]);
  const map=Object.fromEntries((d.items||[]).map(x=>[x.key,x.value]));state.admin.settings=map;
  main.innerHTML=`<h1>Cài đặt hệ thống</h1><div class="card"><div class="field"><label>Tên hệ thống</label><input id="sAppName" value="${E(map.app_name||"")}"></div><div class="field"><label>Email nhận toàn bộ đăng ký</label><input id="sReceiver" type="email" value="${E(map.receiver_email||"sfec@skyfirst.io.vn")}"></div><div class="field"><label>Hotline/Zalo</label><input id="sHotline" value="${E(map.hotline||"0924 910 210")}"></div><div class="field"><label>Website</label><input id="sWebsite" value="${E(map.website||"")}"></div><div class="field"><label>Châm ngôn</label><input id="sSlogan" value="${E(map.brand_slogan||"")}"></div><div class="field"><label>Tiêu đề Hero</label><input id="sHeroTitle" value="${E(map.hero_title||"Kết nối giáo dục. Khơi mở tiềm năng. Phát triển cùng SFEC.")}"></div><div class="field"><label>Mô tả Hero</label><textarea id="sHeroText">${E(map.hero_text||"Cổng học tập và hoạt động dành riêng cho Câu lạc bộ Giáo dục Sky First.")}</textarea></div><div class="field"><label>Ảnh bìa Hero (URL hoặc /api/files/...)</label><input id="sHeroCover" value="${E(map.hero_cover_url||"/assets/sfec-cover.png")}"></div><div class="field"><label>Thời hạn lưu hồ sơ không phù hợp (ngày)</label><input id="sRetention" type="number" value="${E(map.rejected_application_retention_days||365)}"></div><div class="check"><input id="sMaintenance" type="checkbox" ${map.maintenance_mode?"checked":""}><label>Bật chế độ bảo trì trang công khai</label></div><button class="primary" onclick="saveSettings()">Lưu cài đặt hệ thống</button></div>
  <h2 class="section-title">Cài đặt email chung</h2><div class="card"><p><b>Trạng thái:</b> ${mail.configured?"Đã nhận diện nhà cung cấp gửi":"Chưa cấu hình nhà cung cấp gửi"}. <b>Hiện chọn:</b> ${E(mail.provider||"none")}. Không nhập API key tại đây; secrets chỉ cấu hình trong Cloudflare.</p>
  <div class="field"><label for="emailSenderName">Tên người gửi hiển thị</label><input id="emailSenderName" maxlength="120" value="${E(mail.senderName||"")}"></div>
  <div class="field"><label for="emailReplyTo">Địa chỉ trả lời</label><input id="emailReplyTo" type="email" value="${E(mail.replyTo||"")}"></div>
  <div class="field"><label for="emailInternalRecipient">Hộp thư nhận cảnh báo nội bộ</label><input id="emailInternalRecipient" type="email" value="${E(mail.internalRecipient||"")}"></div>
  <div class="field"><label for="emailProviderPreference">Nhà cung cấp ưu tiên</label><select id="emailProviderPreference"><option value="auto" ${(mail.providerPreference||"auto")==="auto"?"selected":""}>Tự chọn nhà cung cấp đã cấu hình</option><option value="resend" ${mail.providerPreference==="resend"?"selected":""}>Resend (cần RESEND_API_KEY)</option><option value="cloudflare" ${mail.providerPreference==="cloudflare"?"selected":""}>Cloudflare Email Service (cần binding EMAIL + domain xác minh)</option></select></div>
  <p class="small muted">Mọi email tự động dùng Times New Roman với font dự phòng; cài đặt này áp dụng chung với mục Email tự động.</p><button class="primary" onclick="saveEmailSettings()">Lưu cài đặt email</button> <button class="secondary" onclick="location.hash='admin/email'">Mở Email tự động</button></div>`;
}
window.saveEmailSettings=async()=>{const body={sender_name:document.getElementById("emailSenderName").value,reply_to:document.getElementById("emailReplyTo").value,internal_recipient:document.getElementById("emailInternalRecipient").value,provider_preference:document.getElementById("emailProviderPreference").value};try{await api("/api/admin/email-settings",{method:"PUT",body});toast("Đã lưu cài đặt email.");await adminSettings(document.getElementById("adminMain"))}catch(e){toast(errorText(e),"bad")}};

window.saveSettings=()=>api("/api/admin/settings",{method:"PUT",body:{items:{app_name:document.getElementById("sAppName").value,receiver_email:document.getElementById("sReceiver").value,hotline:document.getElementById("sHotline").value,website:document.getElementById("sWebsite").value,brand_slogan:document.getElementById("sSlogan").value,hero_title:document.getElementById("sHeroTitle").value,hero_text:document.getElementById("sHeroText").value,hero_cover_url:document.getElementById("sHeroCover").value,rejected_application_retention_days:Number(document.getElementById("sRetention").value)||365,maintenance_mode:document.getElementById("sMaintenance").checked}}}).then(async()=>{toast("Đã lưu cài đặt.");await loadConfig()}).catch(e=>toast(errorText(e),"bad"))

async function adminSearch(main){
  main.innerHTML=`<h1>Tìm kiếm toàn hệ thống</h1><div class="card"><div class="field"><label>Từ khóa</label><input id="globalSearch" placeholder="Mã hồ sơ, họ tên, GCN, văn bản, ticket…"></div><button class="primary" onclick="runSearch()">Tìm</button><div id="searchResults" class="search-results"></div></div>`;
}
window.runSearch=async()=>{const q=document.getElementById("globalSearch").value.trim();if(q.length<2)return;try{const d=await api(`/api/admin/search?q=${encodeURIComponent(q)}`);document.getElementById("searchResults").innerHTML=(d.items||[]).map(x=>`<div class="card"><span class="pill">${E(x.kind)}</span><b>${E(x.ref)}</b> — ${E(x.title)}<br><span class="muted">${E(x.detail||"")}</span></div>`).join("")||"<div class='notice'>Không có kết quả.</div>"}catch(e){toast(errorText(e),"bad")}}
async function adminAudit(main){
  const d=await api("/api/admin/audit");main.innerHTML=`<h1>Audit Log</h1><div class="card table-scroll"><table><thead><tr><th>Thời gian</th><th>Tài khoản</th><th>Hành động</th><th>Đối tượng</th></tr></thead><tbody>${(d.items||[]).map(x=>`<tr><td>${fmt(x.created_at)}</td><td>${E(x.actor_email||"Hệ thống")}</td><td>${E(x.action)}</td><td>${E(x.entity_type||"")} ${E(x.entity_id||"")}</td></tr>`).join("")}</tbody></table></div>`;
}
async function adminBackup(main){
  const d=await api("/api/admin/backups");main.innerHTML=`<div class="toolbar"><h1 style="margin-right:auto">Sao lưu</h1><button class="primary" onclick="createBackup()">Tạo backup ngay</button></div><div class="notice">Hệ thống còn có lịch cleanup hằng ngày và backup cấu hình/nghiệp vụ tự động vào Chủ nhật khi cron được bật.</div><div class="card">${(d.items||[]).map(x=>`<p><b>${E(x.id)}</b> — ${Math.round((x.size||0)/1024)} KB — ${fmt(x.created_at)} <button class="danger" onclick="restoreBackup('${E(x.id)}')">Phục hồi</button></p>`).join("")||"<p>Chưa có backup.</p>"}</div>`;
}
window.restoreBackup=async idb=>{if(!await askConfirm("Phục hồi sẽ ghi đè các bảng nghiệp vụ trong backup. Chỉ Super Admin được thực hiện. Tiếp tục?"))return;api(`/api/admin/backups/${encodeURIComponent(idb)}/restore`,{method:"POST"}).then(()=>{toast("Đã phục hồi backup.");adminBackup(document.getElementById("adminMain"))}).catch(e=>toast(errorText(e),"bad"))}
window.createBackup=()=>api("/api/admin/backup",{method:"POST"}).then(()=>{toast("Đã tạo backup.");adminBackup(document.getElementById("adminMain"))}).catch(e=>toast(errorText(e),"bad"))

function errorText(err){
  const code=err?.data?.error||err?.message||"Có lỗi xảy ra.";
  const map={
    INVALID_CREDENTIALS:"Email hoặc mật khẩu không đúng.",
    EMAIL_NOT_VERIFIED:"Email chưa được xác minh.",
    MEMBER_ACCESS_NOT_GRANTED:"Tài khoản này chưa được SFEC cấp quyền Thành viên.",
    ADMIN_ACCESS_NOT_GRANTED:"Tài khoản này chưa được cấp quyền Quản trị viên.",
    PASSWORD_TOO_SHORT:"Mật khẩu cần ít nhất 10 ký tự.",
    CURRENT_PASSWORD_INVALID:"Mật khẩu hiện tại không đúng.",
    RATE_LIMIT:"Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.",
    FORBIDDEN:"Bạn không có quyền thực hiện thao tác này.",
    PROTECTED_SUPER_ADMIN:"Tài khoản Super Admin gốc được bảo vệ.",
    ROOT_SUPER_ADMIN_CANNOT_BE_REMOVED:"Không thể gỡ quyền Super Admin gốc.",
    EMAIL_PROVIDER_NOT_CONFIGURED:"Dịch vụ email chưa được cấu hình.",
    GOOGLE_OAUTH_NOT_CONFIGURED:"Đăng nhập Google chưa được cấu hình."
  };
  return map[code]||code;
}

async function handleQueryActions(){
  const q=new URLSearchParams(location.search);
  if(q.get("verify")){
    try{await api("/api/auth/verify-email",{method:"POST",body:{token:q.get("verify")}});history.replaceState({},document.title,location.pathname+location.hash);toast("Email đã được xác minh.")}catch(e){toast(errorText(e),"bad")}
  }
  if(q.get("reset")){
    const token=q.get("reset");
    history.replaceState({},document.title,location.pathname+location.hash);
    modal(`<h2>Đặt lại mật khẩu</h2><form id="resetPw"><div class="field"><label>Mật khẩu mới</label><input name="new_password" type="password" minlength="10" required></div><button class="primary">Đặt lại</button></form>`);
    document.getElementById("resetPw").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{await api("/api/auth/reset",{method:"POST",body:{token,new_password:f.get("new_password")}});closeModal();toast("Đã đặt lại mật khẩu.");location.hash="login"}catch(err){toast(errorText(err),"bad")}};
  }
  if(q.get("auth_error"))toast(errorText({message:q.get("auth_error")}),"bad");
}
async function router(){
  const hash=(location.hash||"#home").slice(1),parts=hash.split("/"),[route,param]=parts;
  try{
    if(route==="home")return renderHome();
    if(["about","journey","values","organization"].includes(route))return renderInfoPage(route);
    if(route==="forms")return renderForms();
    if(route==="form")return renderForm(decodeURIComponent(param||""));
    if(route==="classes")return renderClasses();
    if(route==="events")return renderEvents();
    if(route==="units")return renderHome();
    if(route==="news")return renderNews(parts[1]||null);
    if(route==="lookup")return renderLookup();
    if(route==="contact")return renderContact();
    if(route==="terms")return renderPolicyPage("terms");
    if(route==="privacy")return renderPolicyPage("privacy-public");
    if(route==="login")return renderLogin();
    if(route==="portal")return renderPortal();
    if(route==="admin")return renderAdmin();
    location.hash="home";
  }catch(err){app.innerHTML=`<div class="notice bad">${E(errorText(err))}</div>`}
}

window.addEventListener("hashchange",router);
(async()=>{
  await loadConfig();await loadMe();await handleQueryActions();
  if(state.config.maintenance_mode&&!state.user&&!location.hash.startsWith("#login")){app.innerHTML=`<div class="form-wrap"><div class="card"><img src="/assets/sfec-logo.png" style="width:90px"><h1>SFEC đang bảo trì</h1><p class="muted">Hệ thống tạm thời bảo trì. Quản trị viên vẫn có thể đăng nhập.</p><a class="primary" href="#login">Đăng nhập Quản trị</a></div></div>`;return}
  await router();
  if("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{});
})();
