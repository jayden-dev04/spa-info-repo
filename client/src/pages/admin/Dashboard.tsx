import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { supabase } from '@/lib/supabase'

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ appointments: 0, orders: 0 })

  useEffect(() => {
    async function fetchData() {
      // Fetch latest appointments
      const { data: aptData } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (aptData) setAppointments(aptData)

      // Fetch stats
      const { count: aptCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true })
      const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true })

      setStats({
        appointments: aptCount || 0,
        orders: orderCount || 0
      })
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div className="flex min-h-[calc(100vh-140px)]">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 p-6 hidden md:block">
        <h2 className="font-bold text-xl mb-6 text-primary">Admin Panel</h2>
        <nav className="space-y-2">
          <Button variant="ghost" className="w-full justify-start bg-muted">📊 Tổng quan</Button>
          <Button variant="ghost" className="w-full justify-start">📅 Quản lý Đặt lịch</Button>
          <Button variant="ghost" className="w-full justify-start">🛍️ Đơn hàng</Button>
          <Button variant="ghost" className="w-full justify-start">📝 Blog & SEO</Button>
          <Button variant="ghost" className="w-full justify-start text-destructive mt-8">🚪 Đăng xuất</Button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">Tổng quan hệ thống</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tổng Lịch hẹn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.appointments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tổng Đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.orders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tình trạng kết nối</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">Đã kết nối</div>
              <p className="text-xs text-muted-foreground mt-1">Supabase PostgreSQL</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lịch hẹn mới nhất</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Đang tải dữ liệu...</p>
            ) : appointments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>SĐT</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="font-medium">{apt.customer_name}</TableCell>
                      <TableCell>{apt.customer_phone}</TableCell>
                      <TableCell>{new Date(apt.appointment_date).toLocaleString('vi-VN')}</TableCell>
                      <TableCell>
                        <Badge variant={apt.status === 'pending' ? 'secondary' : 'default'}>
                          {apt.status === 'pending' ? 'Chờ xác nhận' : apt.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-sm text-muted-foreground py-8 text-center border-2 border-dashed rounded-md">
                Chưa có lịch hẹn nào.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
