import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lydxhltbvsuyrbvulkwe.supabase.co'
const supabaseKey = 'sb_publishable_HKxhY-I6jzJSksJlSujaLQ_vgQW6UeL'

const supabase = createClient(supabaseUrl, supabaseKey)

const sampleUsers = [
  { full_name: 'Jane Smith', email: 'jane.smith@spa-info.com', role: 'admin' },
  { full_name: 'Alex Johnson', email: 'alex.johnson@spa-info.com', role: 'manager' },
  { full_name: 'Michael Brown', email: 'michael.brown@spa-info.com', role: 'user' }
]

async function seed() {
  console.log('🌱 Seeding sample users to Supabase table...')
  for (const u of sampleUsers) {
    const { data, error } = await supabase.from('users').insert([u]).select()
    if (error) {
      console.log(`⚠️ User ${u.email} might already exist or error:`, error.message)
    } else {
      console.log(`✅ Created user: ${u.full_name} (${u.email})`)
    }
  }

  // Fetch all users
  const { data: allUsers } = await supabase.from('users').select('*').order('created_at', { ascending: false })
  console.log('\n📊 Current users in Supabase database:')
  console.table(allUsers)
}

seed()
