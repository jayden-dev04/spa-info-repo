import { useEffect, useState, useCallback } from 'react'
import { API_BASE } from '@/lib/api'

export interface GeoProvince {
  code: number
  name: string
  slug: string
  division_type: string
}

export interface GeoWard {
  code: number
  name: string
  slug: string
  division_type: string
}

/**
 * Dữ liệu địa danh VN — nguồn sự thật là Supabase (vietnam_provinces / vietnam_wards,
 * seed từ provinces.open-api.vn/api/v2), đọc qua backend /api/geo/*; nếu backend
 * offline thì fallback đọc thẳng Supabase (bảng public, RLS cho phép đọc).
 */
export function useVietnamGeo() {
  const [provinces, setProvinces] = useState<GeoProvince[]>([])
  const [provincesLoading, setProvincesLoading] = useState(false)

  const loadProvinces = useCallback(async () => {
    setProvincesLoading(true)
    try {
      // Ưu tiên backend Laravel
      try {
        const r = await fetch(`${API_BASE}/api/geo/provinces`)
        if (r.ok) {
          const j = await r.json()
          if (j.success && Array.isArray(j.data)) {
            setProvinces(j.data)
            return
          }
        }
      } catch { /* backend offline → fallback */ }

      // Fallback: đọc thẳng Supabase
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('vietnam_provinces')
        .select('code,name,slug,division_type')
        .order('name')
      if (!error && data) setProvinces(data as GeoProvince[])
    } finally {
      setProvincesLoading(false)
    }
  }, [])

  useEffect(() => { loadProvinces() }, [loadProvinces])

  return { provinces, provincesLoading, reloadProvinces: loadProvinces }
}

/** Load phường/xã theo province code (trả [] khi chưa chọn tỉnh). */
export function useWards(provinceCode: number | null) {
  const [wards, setWards] = useState<GeoWard[]>([])
  const [wardsLoading, setWardsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!provinceCode) { setWards([]); return }
    setWardsLoading(true)
    ;(async () => {
      try {
        try {
          const r = await fetch(`${API_BASE}/api/geo/wards?province=${provinceCode}`)
          if (r.ok) {
            const j = await r.json()
            if (j.success && Array.isArray(j.data)) {
              if (!cancelled) setWards(j.data)
              return
            }
          }
        } catch { /* fallback */ }
        const { supabase } = await import('@/lib/supabase')
        const { data, error } = await supabase
          .from('vietnam_wards')
          .select('code,name,slug,division_type')
          .eq('province_code', provinceCode)
          .order('name')
        if (!cancelled && !error && data) setWards(data as GeoWard[])
      } finally {
        if (!cancelled) setWardsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [provinceCode])

  return { wards, wardsLoading }
}
