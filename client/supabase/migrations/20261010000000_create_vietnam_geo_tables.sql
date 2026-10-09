-- ============================================================
-- Bảng địa danh Việt Nam (nguồn: provinces.open-api.vn/api/v2)
-- 34 tỉnh/thành sau sáp nhập 2025 + phường/xã mới theo quy hoạch
-- Bảng public, RLS: đọc công khai, ghi chỉ service_role
-- ============================================================

create table if not exists public.vietnam_provinces (
  code        int primary key,
  name        text not null,
  slug        text not null,
  division_type text not null default 'tỉnh',
  phone_code  int,
  created_at  timestamptz not null default now()
);

create table if not exists public.vietnam_wards (
  code          int primary key,
  province_code int not null references public.vietnam_provinces(code) on delete cascade,
  name          text not null,
  slug          text not null,
  division_type text not null default 'phường'
);

create index if not exists vietnam_wards_province_idx on public.vietnam_wards(province_code);

alter table public.vietnam_provinces enable row level security;
alter table public.vietnam_wards enable row level security;

drop policy if exists "public read provinces" on public.vietnam_provinces;
create policy "public read provinces" on public.vietnam_provinces for select using (true);

drop policy if exists "public read wards" on public.vietnam_wards;
create policy "public read wards" on public.vietnam_wards for select using (true);

-- Ghi chỉ qua secret/service key (seed từ API provinces.open-api.vn)
