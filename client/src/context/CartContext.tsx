import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface CartItem {
  id: string | number
  name: string
  price: number
  imageUrl: string
  category?: string
  quantity: number
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: { id: string | number; name: string; price: number; imageUrl: string; category?: string }, quantity?: number) => void
  removeFromCart: (id: string | number) => void
  updateQuantity: (id: string | number, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalAmount: number
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// Cache offline (giữ UX tức thì) — NGUỒN SỰ THẬT là bảng public.cart_items
const CART_STORAGE_KEY = '***'
const CART_SESSION_KEY = '***'

function getCartSessionKey(): string {
  try {
    let k = localStorage.getItem(CART_SESSION_KEY)
    if (!k) {
      k = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(36).slice(2)
      localStorage.setItem(CART_SESSION_KEY, k)
    }
    return k
  } catch {
    return 'no-storage'
  }
}

function rowToItem(r: any): CartItem {
  return {
    id: r.product_id,
    name: r.product_name,
    price: Number(r.price),
    imageUrl: r.image_url || '',
    quantity: r.quantity,
  }
}

/** Chủ giỏ: user đăng nhập -> 'u:<uid>' (đồng bộ đa máy), khách -> session_key máy.
 *  DB unique theo (session_key, product_id); user_id vẫn lưu để truy vết. */
async function ownerKey(): Promise<string> {
  const uid = await currentUserId()
  return uid ? 'u:' + uid : getCartSessionKey()
}

async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.user?.id ?? null
  } catch {
    return null
  }
}

/** Ghi bảng cart_items (Supabase) — fire-and-forget, local không phụ thuộc mạng.
 *  Các builder PostgREST thenable-but-not-Promise → await trong async wrapper. */
async function dbWrite(fn: () => unknown) {
  try { await fn() } catch (e) { console.warn('cart_items sync lỗi (giữ local):', e) }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isCartOpen, setIsCartOpen] = useState(false)
  const hydrated = useRef(false)

  // 1) hydrate từ Supabase cart_items (theo user_id nếu đã đăng nhập,
  //    nếu không theo session_key của khách)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const uid = await currentUserId()
      const owner = await ownerKey()
      const q = supabase
        .from('cart_items')
        .select('product_id, product_name, price, image_url, quantity')
      const res = await q.eq('session_key', owner).order('updated_at', { ascending: true })
      if (cancelled || res.error) {
        if (res.error) console.warn('cart_items unreadable, giữ local:', res.error.message)
        return
      }
      const rows = (res.data || []).map(rowToItem)
      if (rows.length > 0) {
        setCart(rows)
        if (!uid) {
          // khách đổi máy khác: session_key mới trống → nhận local cũ lên DB
          for (const localItem of JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]')) {
            dbWrite(() =>
              supabase.from('cart_items').upsert(
                { session_key: owner, user_id: null, product_id: String(localItem.id), product_name: localItem.name, price: localItem.price, image_url: localItem.imageUrl, quantity: localItem.quantity },
                { onConflict: 'session_key,product_id' },
              ),
            )
          }
        }
      } else {
        // DB trống (bảng vừa tạo): đẩy local hiện có lên DB
        const local: CartItem[] = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]')
        for (const it of local) {
          dbWrite(() =>
            supabase.from('cart_items').upsert(
              { session_key: owner, user_id: uid, product_id: String(it.id), product_name: it.name, price: it.price, image_url: it.imageUrl, quantity: it.quantity },
              { onConflict: 'session_key,product_id' },
            ),
          )
        }
      }
      hydrated.current = true
    })()
    return () => { cancelled = true }
  }, [])


  // 1b) vừa đăng nhập: giỏ khách (session_key máy) thuộc về 'u:<uid>' → đổi chủ
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'SIGNED_IN' || !session?.user) return
      const uid = session.user.id
      const sk = getCartSessionKey()
      dbWrite(() =>
        supabase.from('cart_items').update({ session_key: 'u:' + uid, user_id: uid }).eq('session_key', sk),
      )
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // 2) phản chiếu mọi thay đổi local -> DB + cache localStorage
  const syncRow = useCallback((item: CartItem) => {
    ownerKey().then((sk) =>
      dbWrite(() =>
        supabase.from('cart_items').upsert(
          { session_key: sk, product_id: String(item.id), product_name: item.name, price: item.price, image_url: item.imageUrl, quantity: item.quantity, updated_at: new Date().toISOString() },
          { onConflict: 'session_key,product_id' },
        ),
      ),
    )
  }, [])

  const deleteRow = useCallback((productId: string | number) => {
    ownerKey().then((sk) =>
      dbWrite(() =>
        supabase
          .from('cart_items')
          .delete()
          .eq('session_key', sk)
          .eq('product_id', String(productId)),
      ),
    )
  }, [])

  const wipeRows = useCallback(() => {
    ownerKey().then((sk) => {
      dbWrite(() => supabase.from('cart_items').delete().eq('session_key', sk))
    })
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    } catch (e) {
      console.error('Không thể cache giỏ hàng:', e)
    }
  }, [cart])

  const addToCart = (
    product: { id: string | number; name: string; price: number; imageUrl: string; category?: string },
    quantity = 1
  ) => {
    let merged: CartItem | null = null
    setCart((prev) => {
      const existing = prev.find((item) => String(item.id) === String(product.id))
      if (existing) {
        merged = { ...existing, quantity: existing.quantity + quantity }
        return prev.map((item) =>
          String(item.id) === String(product.id) ? merged! : item
        )
      }
      merged = {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.category,
        quantity,
      }
      return [...prev, merged]
    })
    setIsCartOpen(true)
    // merged được gán đồng bộ trong updater → đồng bộ DB
    queueMicrotask(() => merged && syncRow(merged))
  }

  const removeFromCart = (id: string | number) => {
    setCart((prev) => prev.filter((item) => String(item.id) !== String(id)))
    deleteRow(id)
  }

  const updateQuantity = (id: string | number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    setCart((prev) => {
      const item = prev.find((i) => String(i.id) === String(id))
      if (item) syncRow({ ...item, quantity })
      return prev.map((item) =>
        String(item.id) === String(id) ? { ...item, quantity } : item
      )
    })
  }

  const clearCart = () => {
    setCart([])
    try {
      localStorage.removeItem(CART_STORAGE_KEY)
    } catch {}
    wipeRows()
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart phải được sử dụng bên trong CartProvider')
  }
  return context
}
