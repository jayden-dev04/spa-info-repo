import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'
import OverviewTab from './components/OverviewTab'
import AppointmentsTab from './components/AppointmentsTab'
import OrdersTab from './components/OrdersTab'
import ProductsTab from './components/ProductsTab'
import BlogTab from './components/BlogTab'
import PopupTab from './components/PopupTab'
import ServicesTab from './components/ServicesTab'
import StaffTab from './components/StaffTab'

export default function AdminDashboard() {
  const [currentTab, setCurrentTab] = useState('overview')
  const [appointments, setAppointments] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    appointments: 0,
    orders: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    totalRevenue: 0,
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch appointments (with fallback to joined users if client_id exists)
      const { data: aptData, error: aptError } = await supabase
        .from('appointments')
        .select('*, users(full_name, phone, email)')
        .order('created_at', { ascending: false })

      if (aptError) {
        // Retry simple select if relation doesn't exist
        const { data: simpleApt } = await supabase
          .from('appointments')
          .select('*')
          .order('created_at', { ascending: false })
        if (simpleApt) setAppointments(simpleApt)
      } else if (aptData) {
        const normalized = aptData.map((a: any) => ({
          ...a,
          customer_name: a.customer_name || a.users?.full_name || 'Khách đặt lịch',
          customer_phone: a.customer_phone || a.users?.phone || '',
          customer_email: a.customer_email || a.users?.email || '',
        }))
        setAppointments(normalized)
      }

      // 2. Fetch orders with order_items
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name, image_url))')
        .order('created_at', { ascending: false })

      if (orderError) console.error("Lỗi tải đơn hàng:", orderError)
      if (orderData) setOrders(orderData)

      // 3. Fetch products
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (prodError) console.error("Lỗi tải sản phẩm:", prodError)
      if (prodData) setProducts(prodData)

      // 4. Stats calculation
      const pendingApts = aptData?.filter(a => a.status === 'pending').length || 0
      const confirmedApts = aptData?.filter(a => a.status === 'confirmed').length || 0
      const revenue = orderData?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0

      setStats({
        appointments: aptData?.length || 0,
        orders: orderData?.length || 0,
        pendingAppointments: pendingApts,
        confirmedAppointments: confirmedApts,
        totalRevenue: revenue,
      })
    } catch (err) {
      console.error("Lỗi kết nối Supabase:", err)
      toast.error("Không thể kết nối cơ sở dữ liệu Supabase")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Real-time status update for Appointment
  const handleUpdateAppointmentStatus = async (id: string | number, newStatus: string) => {
    // Optimistic Update
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
    
    try {
      let apiSuccess = false
      try {
        const res = await fetch(`http://localhost:8000/api/appointments/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
        if (res.ok) apiSuccess = true
      } catch {}

      if (!apiSuccess) {
        const { error } = await supabase
          .from('appointments')
          .update({ status: newStatus })
          .eq('id', id)

        if (error) throw error
      }

      toast.success(`Cập nhật lịch hẹn #${id} thành công!`, {
        description: `Trạng thái mới: ${newStatus === 'confirmed' ? 'Đã duyệt' : newStatus === 'completed' ? 'Hoàn tất' : 'Đã hủy'}`
      })
      fetchData()
    } catch (err: any) {
      toast.error("Lỗi cập nhật lịch hẹn", { description: err.message })
      fetchData()
    }
  }

  // Real-time status update for Order
  const handleUpdateOrderStatus = async (id: string | number, newStatus: string) => {
    // Optimistic Update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))

    try {
      let apiSuccess = false
      try {
        const res = await fetch(`http://localhost:8000/api/orders/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
        if (res.ok) apiSuccess = true
      } catch {}

      if (!apiSuccess) {
        const { error } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', id)

        if (error) throw error
      }

      toast.success(`Cập nhật đơn hàng #${id} thành công!`, {
        description: `Trạng thái mới: ${newStatus === 'shipped' ? 'Đang giao hàng' : newStatus === 'completed' ? 'Đã giao thành công' : newStatus}`
      })
      fetchData()
    } catch (err: any) {
      toast.error("Lỗi cập nhật đơn hàng", { description: err.message })
      fetchData()
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f5f8f6] text-foreground font-sans">
      {/* Fixed Pro Sidebar Navigation */}
      <AdminSidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        pendingCount={stats.pendingAppointments}
        ordersCount={stats.orders}
      />

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AdminHeader
          currentTab={currentTab}
          onRefresh={fetchData}
          loading={loading}
        />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {currentTab === 'overview' && (
            <OverviewTab
              stats={stats}
              recentAppointments={appointments}
              recentOrders={orders}
              onSelectTab={setCurrentTab}
              onUpdateStatus={handleUpdateAppointmentStatus}
            />
          )}

          {currentTab === 'appointments' && (
            <AppointmentsTab
              appointments={appointments}
              loading={loading}
              onUpdateStatus={handleUpdateAppointmentStatus}
            />
          )}

          {currentTab === 'orders' && (
            <OrdersTab
              orders={orders}
              loading={loading}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

          {currentTab === 'products' && (
            <ProductsTab
              products={products}
              loading={loading}
              onRefresh={fetchData}
            />
          )}

          {currentTab === 'blog' && <BlogTab />}

          {currentTab === 'popup' && <PopupTab />}

          {currentTab === 'services' && <ServicesTab />}

          {currentTab === 'staff' && <StaffTab />}
        </main>
      </div>
    </div>
  )
}
