import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Server, Database, Sparkles, RefreshCw, UserPlus, Users, ArrowRight, AlertCircle } from 'lucide-react'

interface UserItem {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

const LARAVEL_API_BASE = 'http://127.0.0.1:8000'

function App() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)

  // Form State
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('user')

  // Fetch Users from Laravel Backend API -> Supabase
  const fetchUsersFromBackend = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${LARAVEL_API_BASE}/api/users`)
      if (!response.ok) {
        throw new Error(`Laravel Server returned HTTP ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        setUsers(data.data || [])
        setBackendConnected(true)
      } else {
        throw new Error(data.error?.message || 'Failed to fetch users')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Cannot connect to Laravel Backend server')
      setBackendConnected(false)
    } finally {
      setLoading(false)
    }
  }

  // Create User via Laravel Backend API -> Supabase
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !fullName) return

    setCreating(true)
    setError(null)

    try {
      const response = await fetch(`${LARAVEL_API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          role: role
        })
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setFullName('')
        setEmail('')
        setRole('user')
        fetchUsersFromBackend() // Refresh user list
      } else {
        throw new Error(data.error?.message || 'Failed to create user')
      }
    } catch (err: any) {
      setError(err.message || 'Error creating user')
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    fetchUsersFromBackend()
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-6 md:p-12 relative overflow-x-hidden selection:bg-purple-500 selection:text-white">
      {/* Glow Effects */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-tr from-purple-600/20 via-indigo-600/15 to-emerald-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-5xl w-full z-10 space-y-8">
        
        {/* Architecture Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <Badge variant="default" className="gap-2 px-4 py-1.5 text-sm backdrop-blur-md shadow-lg border-purple-500/30">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Fullstack Architecture: React → Laravel → Supabase</span>
          </Badge>
          
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            User Management Dashboard
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl">
            React App queries <code className="text-purple-400 font-mono">Laravel API</code> backend, which processes requests and syncs directly with <code className="text-emerald-400 font-mono">Supabase PostgreSQL</code>.
          </p>
        </div>

        {/* Data Flow Diagram Card */}
        <Card className="bg-slate-900/60 border-slate-800 p-6 backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center">
            
            {/* React Frontend */}
            <div className="p-4 rounded-lg bg-purple-950/30 border border-purple-800/40 flex flex-col items-center space-y-2">
              <span className="text-xs uppercase font-bold text-purple-400 tracking-wider">Client</span>
              <h4 className="font-bold text-white text-lg">React + Vite</h4>
              <Badge variant="outline" className="text-xs border-purple-700/50 text-purple-300">Port 5173</Badge>
            </div>

            {/* Flow Arrow 1 */}
            <div className="hidden md:flex flex-col items-center justify-center text-slate-500 space-y-1">
              <span className="text-xs font-mono text-slate-400">REST API Request</span>
              <div className="flex items-center gap-1 text-purple-400 font-bold">
                <ArrowRight className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            {/* Laravel Backend */}
            <div className="p-4 rounded-lg bg-indigo-950/30 border border-indigo-800/40 flex flex-col items-center space-y-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">Backend Engine</span>
              </div>
              <h4 className="font-bold text-white text-lg">Laravel 12 API</h4>
              <Badge variant="outline" className="text-xs border-indigo-700/50 text-indigo-300">
                {backendConnected === true ? '● Online (Port 8000)' : backendConnected === false ? '○ Offline' : 'Checking...'}
              </Badge>
            </div>

            {/* Flow Arrow 2 */}
            <div className="hidden md:flex flex-col items-center justify-center text-slate-500 space-y-1 md:col-start-2 md:col-span-1">
              <span className="text-xs font-mono text-slate-400">PostgREST Client</span>
              <div className="flex items-center gap-1 text-emerald-400 font-bold">
                <ArrowRight className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            {/* Supabase DB */}
            <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-800/40 flex flex-col items-center space-y-2 md:col-start-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">Database</span>
              </div>
              <h4 className="font-bold text-white text-lg">Supabase Postgres</h4>
              <Badge variant="outline" className="text-xs border-emerald-700/50 text-emerald-300">Table: public.users</Badge>
            </div>

          </div>
        </Card>

        {/* Error Alert if Offline */}
        {error && (
          <div className="p-4 rounded-lg bg-red-950/60 border border-red-800/80 text-red-200 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-300">Connection Alert</p>
              <p className="text-red-300/80 mt-1">{error}</p>
              <p className="text-xs text-red-400 mt-2">
                Make sure Laravel backend server is running: <code className="bg-red-900/50 px-2 py-0.5 rounded font-mono">php artisan serve</code>
              </p>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Add User Form */}
          <Card className="md:col-span-1 bg-slate-900/60 border-slate-800">
            <CardHeader>
              <div className="flex items-center gap-2 text-purple-400">
                <UserPlus className="w-5 h-5" />
                <CardTitle>Add New User</CardTitle>
              </div>
              <CardDescription>Sends POST request to Laravel → Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Full Name</label>
                  <Input
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Email Address</label>
                  <Input
                    type="email"
                    placeholder="e.g. john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium"
                >
                  {creating ? 'Saving to Supabase...' : 'Create User via Laravel'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* User List Table */}
          <Card className="md:col-span-2 bg-slate-900/60 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Users className="w-5 h-5" />
                  <CardTitle>Supabase User Table</CardTitle>
                </div>
                <CardDescription>Fetched via Laravel Backend (<code className="text-slate-300 font-mono">GET /api/users</code>)</CardDescription>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsersFromBackend}
                disabled={loading}
                className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </CardHeader>

            <CardContent>
              {loading && users.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-400" />
                  <p className="text-sm">Fetching users from Laravel API...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-lg">
                  <Users className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-sm">No users found in Supabase table yet.</p>
                  <p className="text-xs text-slate-600">Use the form on the left to add your first user!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="text-xs uppercase bg-slate-800/50 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Full Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Created At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3.5 font-medium text-white flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center font-bold text-xs">
                              {u.full_name ? u.full_name[0].toUpperCase() : 'U'}
                            </div>
                            <span>{u.full_name || 'N/A'}</span>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{u.email}</td>
                          <td className="px-4 py-3.5">
                            <Badge
                              variant="outline"
                              className={
                                u.role === 'admin'
                                  ? 'bg-purple-950/40 text-purple-300 border-purple-700/50'
                                  : u.role === 'manager'
                                  ? 'bg-indigo-950/40 text-indigo-300 border-indigo-700/50'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }
                            >
                              {u.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500">
                            {new Date(u.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>
    </main>
  )
}

export default App
