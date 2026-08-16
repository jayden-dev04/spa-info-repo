import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'
import OverviewTab from './components/OverviewTab'
import AppointmentsTab from './components/AppointmentsTab'
import OrdersTab from './components/OrdersTab'
import ServicesTab from './components/ServicesTab'
import StaffTab from './components/StaffTab'

export default function AdminDashboard() {
  const [currentTab, setCurrentTab] = useState('overview')
  const [appointments, setAppointments] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
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
      // 1. Fetch appointments
      const { data: aptData, error: aptError } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })

      if (aptError) console.error("Lỗi tải lịch hẹn:", aptError)
      if (aptData) setAppointments(aptData)

      // 2. Fetch orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (orderError) console.error("Lỗi tải đơn hàng:", orderError)
      if (orderData) setOrders(orderData)

      // 3. Compute stats
      const aptList = aptData || []
      const ordList = orderData || []

      const pending = aptList.filter(a => (a.status || 'pending') === 'pending').length
      const confirmed = aptList.filter(a => a.status === 'confirmed').length
      const revenue = ordList.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)

      setStats({
        appointments: aptList.length,
        orders: ordList.length,
        pendingAppointments: pending,
        confirmedAppointments: confirmed,
        totalRevenue: revenue,
      })
    } catch (err: any) {
      console.error("Lỗi kết nối Supabase:", err)
      toast.error("Lỗi tải dữ liệu", { description: "Không thể kết nối đến máy chủ." })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Update appointment status
  const handleUpdateAppointmentStatus = async (id: string, newStatus: string) => {
    try {
      // Optimistic update
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))

      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      const statusLabels: Record<string, string> = {
        confirmed: 'Đã xác nhận lịch hẹn',
        completed: 'Đã hoàn tất lịch hẹn',
        cancelled: 'Đã hủy lịch hẹn',
        pending: 'Đã chuyển về chờ duyệt'
      }

      toast.success(statusLabels[newStatus] || "Cập nhật thành công")
      fetchData()
    } catch (err: any) {
      toast.error("Lỗi cập nhật", { description: err.message })
      fetchData()
    }
  }

  // Update order status
  const handleUpdateOrderStatus = async (id: string, newStatus: string) => {
    try {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      toast.success("Đã cập nhật trạng thái đơn hàng")
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

          {currentTab === 'services' && <ServicesTab />}

          {currentTab === 'staff' && <StaffTab />}
        </main>
      </div>
    </div>
  )
}
