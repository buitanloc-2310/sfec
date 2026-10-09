PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS site_pages (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  kicker TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'inherit',
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  cover_file_id TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER
);
CREATE TABLE IF NOT EXISTS site_page_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  kicker TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  cover_file_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER
);
CREATE INDEX IF NOT EXISTS idx_site_page_revisions_slug ON site_page_revisions(page_slug, id DESC);
INSERT OR IGNORE INTO site_pages(slug,title,kicker,status) VALUES
  ('home','Trang chủ','WEBSITE CHÍNH THỨC CỦA SFEC','inherit'),
  ('about','Giới thiệu SFEC','GIỚI THIỆU SFEC','inherit'),
  ('journey','Hành trình phát triển','HÀNH TRÌNH PHÁT TRIỂN','inherit'),
  ('values','Định hướng & Giá trị','ĐỊNH HƯỚNG & GIÁ TRỊ','inherit'),
  ('organization','Mô hình trực thuộc Sky First Network','MÔ HÌNH SFEC / SFN','inherit');

INSERT INTO settings(key,value_json) VALUES
  ('app_name','"SFEC — Sky First Education Club"'),
  ('app_short_name','"SFEC"'),
  ('app_url','"https://sfec.skyfirst.io.vn"'),
  ('website','"https://sfec.skyfirst.io.vn"'),
  ('receiver_email','"sfec@skyfirst.io.vn"'),
  ('support_email','"sfec@skyfirst.io.vn"'),
  ('hotline','"0924 910 210"'),
  ('brand_slogan','"Learn · Connect · Grow"'),
  ('hero_title','"Học tập. Khám phá. Phát triển."'),
  ('hero_text','"Một không gian giáo dục số kết nối người học với lớp học, chương trình và hoạt động giáo dục theo định hướng của Sky First Network."')
ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json, updated_at=CURRENT_TIMESTAMP;

UPDATE units
SET name='Sky First Education Club (SFEC)',
    email='sfec@skyfirst.io.vn',
    updated_at=CURRENT_TIMESTAMP
WHERE code='SFEC';

UPDATE modules SET enabled=0, description='Nghiệp vụ tổ chức/nhân sự do Sky First Network quản trị; không vận hành như bộ máy độc lập tại SFEC.'
WHERE key IN ('recruitment','people','volunteer_teaching');

-- Keep role IDs and permission assignments stable while updating labels to reflect centralized SFN governance.
UPDATE roles SET name='Người phê duyệt theo phân công SFN', description='Phê duyệt nghiệp vụ theo thẩm quyền và phân công của Sky First Network.' WHERE id='club_secretary';
UPDATE roles SET name='Điều phối hồ sơ theo phân công SFN', description='Điều phối văn thư, hồ sơ và thủ tục theo phạm vi do Sky First Network phân công.' WHERE id='office';
UPDATE roles SET name='Nhân sự do SFN quản trị', description='Nghiệp vụ nhân sự được quản trị tập trung thông qua Sky First Network.' WHERE id='hr';
UPDATE roles SET name='Truyền thông theo phân công SFN', description='Quản lý nội dung/truyền thông theo phân công và quyền được Sky First Network cấp.' WHERE id='communications';
UPDATE roles SET name='Điều phối sự kiện theo phân công SFN', description='Phối hợp sự kiện theo phạm vi được Sky First Network phê duyệt.' WHERE id='external_events';
UPDATE roles SET name='Quản trị phạm vi do SFN phân quyền', description='Quản trị trong phạm vi được Sky First Network chính thức phân quyền.' WHERE id='unit_admin';


UPDATE forms SET enabled=0, updated_at=CURRENT_TIMESTAMP
WHERE id NOT IN ('student','class','event');

UPDATE forms
SET recipient_email='sfec@skyfirst.io.vn',
    config_json=replace(replace(replace(replace(config_json,'The Sky First English Club','Sky First Education Club'),'THE SKY FIRST ENGLISH CLUB','SKY FIRST EDUCATION CLUB'),'sfec.englishclub@gmail.com','sfec@skyfirst.io.vn'),'sfec.vanphong@gmail.com','sfec@skyfirst.io.vn'),
    updated_at=CURRENT_TIMESTAMP;

UPDATE email_templates SET
 subject_template=replace(replace(replace(subject_template,'The Sky First English Club','Sky First Education Club'),'THE SKY FIRST ENGLISH CLUB','SKY FIRST EDUCATION CLUB'),'[The Sky First English Club]','[SFEC]'),
 html_template=replace(replace(replace(replace(replace(html_template,'The Sky First English Club','Sky First Education Club'),'THE SKY FIRST ENGLISH CLUB','SKY FIRST EDUCATION CLUB'),'sfec.englishclub@gmail.com','sfec@skyfirst.io.vn'),'sfec.vanphong@gmail.com','sfec@skyfirst.io.vn'),'0988 504 210','0924 910 210'),
 text_template=replace(replace(replace(replace(text_template,'The Sky First English Club','Sky First Education Club'),'THE SKY FIRST ENGLISH CLUB','SKY FIRST EDUCATION CLUB'),'sfec.englishclub@gmail.com','sfec@skyfirst.io.vn'),'sfec.vanphong@gmail.com','sfec@skyfirst.io.vn'),
 updated_at=CURRENT_TIMESTAMP;


UPDATE news
SET title='Chào mừng đến với SFEC — Sky First Education Club',
    slug='chao-mung-sfec',
    body='SFEC là mô hình giáo dục trực thuộc Sky First Network, tập trung vào lớp học, chương trình và hoạt động giáo dục được triển khai theo định hướng của SFN.',
    updated_at=CURRENT_TIMESTAMP
WHERE id='NEWS-WELCOME';

UPDATE news
SET title='SFEC — Không gian học tập và phát triển',
    slug='sfec-learning-experience',
    body='Khám phá lớp học, chương trình và hoạt động giáo dục của SFEC. Các công tác quản trị, nhân sự và phối hợp liên đơn vị được điều phối thông qua Sky First Network.',
    updated_at=CURRENT_TIMESTAMP
WHERE id='NEWS-SFEC-ECOSYSTEM';

UPDATE site_pages
SET title=replace(replace(title,'The Sky First English Club','Sky First Education Club'),'THE SKY FIRST ENGLISH CLUB','SKY FIRST EDUCATION CLUB'),
    kicker=replace(replace(kicker,'The Sky First English Club','Sky First Education Club'),'THE SKY FIRST ENGLISH CLUB','SKY FIRST EDUCATION CLUB'),
    body_html=replace(replace(replace(replace(body_html,'The Sky First English Club','Sky First Education Club'),'THE SKY FIRST ENGLISH CLUB','SKY FIRST EDUCATION CLUB'),'sfec.englishclub@gmail.com','sfec@skyfirst.io.vn'),'sfec.vanphong@gmail.com','sfec@skyfirst.io.vn'),
    seo_title=replace(replace(seo_title,'The Sky First English Club','Sky First Education Club'),'THE SKY FIRST ENGLISH CLUB','SKY FIRST EDUCATION CLUB'),
    seo_description=replace(replace(seo_description,'The Sky First English Club','Sky First Education Club'),'THE SKY FIRST ENGLISH CLUB','SKY FIRST EDUCATION CLUB'),
    updated_at=CURRENT_TIMESTAMP;

UPDATE site_pages
SET title='Mô hình trực thuộc Sky First Network',
    kicker='MÔ HÌNH SFEC / SFN',
    body_html=replace(replace(replace(body_html,'The Sky First English Club','Sky First Education Club'),'THE SKY FIRST ENGLISH CLUB','SKY FIRST EDUCATION CLUB'),'Cơ cấu & Hệ sinh thái','Mô hình trực thuộc Sky First Network'),
    seo_title='SFEC trực thuộc Sky First Network',
    seo_description='Mô hình giáo dục Sky First Education Club trực thuộc Sky First Network, tập trung vào lớp học, chương trình và hoạt động giáo dục.',
    updated_at=CURRENT_TIMESTAMP
WHERE slug='organization';
