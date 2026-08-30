#!/usr/bin/env node
/**
 * Sinh SQL seed 14 bài blog SEO (bảng public.blog_posts) từ BLOG_SEEDS
 * dùng chung với admin BlogTab — MỘT nguồn dữ liệu duy nhất.
 *
 *   node scripts/seed-blog-posts.mjs            # in SQL
 *   node scripts/seed-blog-posts.mjs --write    # ghi client/supabase/seeders/seed_blog_posts.sql
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BLOG_SEEDS } from '../src/lib/blogSeeds.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const out = path.resolve(__dirname, '../supabase/seeders/seed_blog_posts.sql')
const esc = (s) => String(s).replace(/'/g, "''")

const rows = BLOG_SEEDS.map((p) => `  ('${esc(p.seoData.slug)}', '${esc(p.title)}', '${esc(p.excerpt)}', '${esc(p.content)}', ${p.status === 'published'}, now())`)

const sql = `-- ============================================================
-- SEED: public.blog_posts — ${rows.length} bài blog SEO
-- (tự sinh bởi client/scripts/seed-blog-posts.mjs từ
-- src/lib/blogSeeds.ts — nguồn dùng chung với admin BlogTab)
-- Chạy SAU 20260831100000_data_on_supabase.sql
-- ============================================================

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS category        TEXT,
  ADD COLUMN IF NOT EXISTS excerpt         TEXT,
  ADD COLUMN IF NOT EXISTS image_url       TEXT,
  ADD COLUMN IF NOT EXISTS views           INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS read_time       TEXT,
  ADD COLUMN IF NOT EXISTS date_label      TEXT,
  ADD COLUMN IF NOT EXISTS author          TEXT,
  ADD COLUMN IF NOT EXISTS meta_title      TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS focus_keyword   TEXT;

INSERT INTO public.blog_posts (slug, title, category, excerpt, content, image_url, views, read_time, date_label, author, meta_title, meta_description, focus_keyword, published_at)
VALUES
${BLOG_SEEDS.map((p) => `  (
    '${esc(p.seoData.slug)}',
    '${esc(p.title)}',
    '${esc(p.category)}',
    '${esc(p.excerpt)}',
    '${esc(p.content)}',
    '${esc(p.featuredImage)}',
    ${p.views},
    '${esc(p.readTime)}',
    '${esc(p.date)}',
    '${esc(p.author)}',
    '${esc(p.seoData.metaTitle)}',
    '${esc(p.seoData.metaDescription)}',
    '${esc(p.seoData.focusKeyword)}',
    CASE WHEN '${p.status}' = 'published' THEN now() ELSE NULL END
  )`).join(',\n')}
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  image_url = EXCLUDED.image_url,
  updated_at = now();

NOTIFY pgrst, 'reload schema';
`

if (process.argv.includes('--write')) {
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, sql, 'utf8')
  console.log(`Đã ghi ${out} (${rows.length} bài)`)
} else {
  console.log(sql)
}
