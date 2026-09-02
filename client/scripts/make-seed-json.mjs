/**
 * Sinh seed-products.json + seed-blogs.json từ NGUỒN DUY NHẤT trong repo
 * (server/database/seeders/seed_products.sql + src/lib/blogSeeds.ts).
 *   cd client && node --experimental-strip-types scripts/make-seed-json.mjs
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import { BLOG_SEEDS } from '../src/lib/blogSeeds.ts'

const un = (s) => s.replace(/''/g, "'")
const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'sp'

// products từ seed_products.sql (cùng parser với load-data-to-supabase.mjs)
const sql = readFileSync(path.resolve(import.meta.dirname, '../../server/database/seeders/seed_products.sql'), 'utf8')
const tupleRe = /\('((?:[^']|'')*)', '((?:[^']|'')*)', ([\d.]+), (\d+), '((?:[^']|'')*)', '((?:[^']|'')*)'\)/g
const products = [...sql.matchAll(tupleRe)].map((m) => ({
  name: un(m[1]),
  slug: slugify(un(m[1])),
  description: un(m[2]),
  price: Number(m[3]),
  category: un(m[5]),
  image_url: un(m[6]),
  is_active: true,
}))
const blogs = BLOG_SEEDS.map((p) => ({
  slug: p.seoData.slug,
  title: p.title,
  category: p.category,
  excerpt: p.excerpt,
  content: p.content,
  image_url: p.featuredImage,
  views: p.views ?? 0,
  read_time: p.readTime,
  date_label: p.date,
  author: p.author ?? 'Eva Spa',
  meta_title: p.seoData.metaTitle,
  meta_description: p.seoData.metaDescription,
  focus_keyword: p.seoData.focusKeyword,
}))

writeFileSync(path.resolve(import.meta.dirname, '../../server/seed-products.json'), JSON.stringify(products, null, 1))
writeFileSync(path.resolve(import.meta.dirname, '../../server/seed-blogs.json'), JSON.stringify(blogs, null, 1))
console.log(`products=${products.length} blogs=${blogs.length}`)
