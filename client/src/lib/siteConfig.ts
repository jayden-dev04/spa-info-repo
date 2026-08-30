import { supabase } from '@/lib/supabase'
import type { PopupConfig } from '@/components/PromoPopup'
import { DEFAULT_POPUP_CONFIG } from '@/components/PromoPopup'

/**
 * Cấu hình popup + coupon — nguồn sự thật: BẢNG public.popup_configs (Supabase).
 * localStorage 'eva_spa_popup_config' chỉ còn là CACHE offline (đọc ngay khi
 * mở tab, ghi đè sau khi fetch DB xong) — mọi tab (App banner, PromoPopup,
 * Checkout coupon, admin PopupTab) đều dùng chung helper này.
 */

export const POPUP_CACHE_KEY = '***'

let memory: PopupConfig | null = null

export function getCachedPopupConfig(): PopupConfig {
  if (memory) return memory
  try {
    const saved = localStorage.getItem(POPUP_CACHE_KEY)
    const cfg = saved ? { ...DEFAULT_POPUP_CONFIG, ...JSON.parse(saved) } : DEFAULT_POPUP_CONFIG
    memory = cfg
    return cfg
  } catch {
    return DEFAULT_POPUP_CONFIG
  }
}

/** Fetch từ Supabase; nếu DB lỗi/không có dòng → giữ cache/local. */
export async function fetchPopupConfig(): Promise<PopupConfig> {
  try {
    const { data, error } = await supabase
      .from('popup_configs')
      .select('config')
      .eq('key', 'default')
      .maybeSingle()
    if (!error && data?.config) {
      const cfg = { ...DEFAULT_POPUP_CONFIG, ...(data.config as object) } as PopupConfig
      memory = cfg
      localStorage.setItem(POPUP_CACHE_KEY, JSON.stringify(cfg))
      return cfg
    }
  } catch (e) {
    console.warn('popup_configs unreadable, dùng cache local:', e)
  }
  return getCachedPopupConfig()
}

/** Admin lưu: upsert vào Supabase + cập nhật cache. */
export async function savePopupConfig(config: PopupConfig): Promise<boolean> {
  const { error } = await supabase
    .from('popup_configs')
    .upsert({ key: 'default', config, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) {
    console.error('Không thể lưu popup_configs:', error)
    return false
  }
  memory = config
  localStorage.setItem(POPUP_CACHE_KEY, JSON.stringify(config))
  return true
}
