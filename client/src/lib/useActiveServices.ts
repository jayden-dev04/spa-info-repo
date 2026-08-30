import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type ServiceRow = {
  id: number
  name: string
  price: number
  duration_minutes: number | null
}

type Raw = { id?: unknown; name?: unknown; price?: unknown; duration_minutes?: unknown }

const isServiceRow = (v: unknown): v is ServiceRow => {
  if (!v || typeof v !== 'object') return false
  const r = v as Raw
  return typeof r.id === 'number' && typeof r.name === 'string' && typeof r.price === 'number'
}

/**
 * Nguồn thật: bảng public.services (Supabase PostgREST).
 * Mảng `fallback` (khớp seed_services.sql) giữ giao diện ổn định khi
 * Supabase trả về rỗng/lỗi.
 */
export function useActiveServices(fallback: ServiceRow[]) {
  const [services, setServices] = useState<ServiceRow[]>(fallback)
  useEffect(() => {
    let cancelled = false
    supabase
      .from('services')
      .select('id, name, price, duration_minutes')
      .eq('is_active', true)
      .order('id', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled || error || !Array.isArray(data) || data.length === 0) return
        setServices(data.filter(isServiceRow))
      })
    return () => { cancelled = true }
  }, [])
  return services
}
