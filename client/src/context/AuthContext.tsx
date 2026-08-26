import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface UserProfile {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'staff' | 'user' | 'guest'
  avatarUrl?: string
}

interface AuthContextType {
  user: UserProfile | null
  login: (email: string, role?: 'admin' | 'staff' | 'user', fullName?: string) => void
  logout: () => void
  isAuthModalOpen: boolean
  setIsAuthModalOpen: (open: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = 'eva_spa_current_user'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Listen to Supabase auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const profile: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Khách Hàng',
          role: (session.user.user_metadata?.role as any) || 'user',
        }
        setUser(profile)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile))
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const profile: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Khách Hàng',
          role: (session.user.user_metadata?.role as any) || 'user',
        }
        setUser(profile)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile))
      } else {
        // Only clear if logged out via supabase
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = (email: string, role: 'admin' | 'staff' | 'user' = 'user', fullName?: string) => {
    const profile: UserProfile = {
      id: 'usr-' + Date.now(),
      email,
      fullName: fullName || email.split('@')[0],
      role,
    }
    setUser(profile)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile))
    setIsAuthModalOpen(false)
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch {}
    setUser(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
      }}
    >
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
