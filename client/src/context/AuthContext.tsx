import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { API_BASE } from '@/lib/api'
import { consumeOAuthError } from '@/lib/oauth-error'

export interface UserProfile {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'staff' | 'user' | 'guest'
  avatarUrl?: string
}

interface AuthContextType {
  user: UserProfile | null
  logout: () => void
  isAuthModalOpen: boolean
  setIsAuthModalOpen: (open: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = 'eva_spa_current_user'

function readStoredUser(): UserProfile | null {
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY)
    return saved ? (JSON.parse(saved) as UserProfile) : null
  } catch {
    return null
  }
}

/** equal → giữ nguyên tham chiếu cũ để consumer không re-render/re-fetch. */
function sameProfile(a: UserProfile | null, b: UserProfile | null): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return (
    a.id === b.id &&
    a.email === b.email &&
    a.fullName === b.fullName &&
    a.role === b.role &&
    (a.avatarUrl ?? '') === (b.avatarUrl ?? '')
  )
}

/**
 * Đổi access_token (vừa đăng nhập Google xong) lấy profile + role.
 * Role do BACKEND quyết định (server/app/Http/Controllers/AuthController.php).
 */
async function fetchProfileFromBackend(): Promise<UserProfile | null> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return null

  const res = await fetch(`${API_BASE}/api/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ access_token: token }),
  })

  if (!res.ok) return null

  const json = await res.json()
  if (!json?.success || !json.user) return null

  const profile: UserProfile = {
    id: json.user.id,
    email: json.user.email,
    fullName: json.user.fullName,
    role: json.user.role,
    avatarUrl: json.user.avatarUrl || undefined,
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile))
  return profile
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(readStoredUser)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Lắng nghe Supabase auth: sau khi Google redirect về, đổi code lấy session
  // rồi hỏi backend xem tài khoản này là role gì.
  useEffect(() => {
    // Supabase trả lỗi OAuth (?error=...) về đúng trang đang mở, không qua
    // /auth/callback → đọc và toast ở đây ngay khi app mount.
    consumeOAuthError()

    let cancelled = false
    let inflight: Promise<void> | null = null

    const syncProfile = () => {
      // supabase-js bắn INITIAL_SESSION + USER_UPDATED/SIGNED_IN gần nhau;
      // gộp lại thành một lần gọi backend.
      if (inflight) return inflight
      inflight = (async () => {
        try {
          const profile = await fetchProfileFromBackend()
          if (cancelled) return
          if (profile) {
            // chỉ set khi thật sự khác → tránh đổi tham chiếu gây reload UI dây chuyền
            setUser((prev) => (sameProfile(prev, profile) ? prev : profile))
          }
        } catch {
          // Backend offline / lỗi mạng: giữ profile đã lưu, không tự bịa role
        } finally {
          inflight = null
        }
      })()
      return inflight
    }

    // 1. ?code=... (Google callback) → supabase-js tự đổi code,
    //    rồi session về qua getSession()/listener → gọi backend lấy role.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) syncProfile()
    })

    // 2. Mọi thay đổi phiên đăng nhập đều xác thực role lại từ backend.
    //    INITIAL_SESSION không có session (khách vãng lai / DevTools clear storage)
    //    KHÔNG được xóa profile đang có — chỉ SIGNED_OUT mới xóa.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (session?.user) {
        syncProfile()
      } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        setUser(null)
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch {}
    setUser(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }, [])
  const value = useMemo(
    () => ({ user, logout, isAuthModalOpen, setIsAuthModalOpen }),
    [user, logout, isAuthModalOpen],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider')
  }
  return context
}
