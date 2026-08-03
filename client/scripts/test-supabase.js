import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lydxhltbvsuyrbvulkwe.supabase.co'
const supabaseKey = 'sb_publishable_HKxhY-I6jzJSksJlSujaLQ_vgQW6UeL'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSupabase() {
  console.log('🔍 Testing connection to Supabase project...')
  console.log(`URL: ${supabaseUrl}`)

  try {
    // Attempt to query the users table
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('\n❌ Table "users" does NOT exist on Supabase yet.')
        console.log('💡 You need to execute the migration SQL in Supabase Dashboard -> SQL Editor.')
      } else {
        console.log('\n⚠️ Supabase API Response:', error.message, `(Code: ${error.code})`)
      }
    } else {
      console.log('\n✅ Connection successful!')
      console.log(`📊 Table "users" is LIVE on Supabase. Current row count: ${data ? data.length : 0}`)
      if (data && data.length > 0) {
        console.log('Sample data:', data.slice(0, 2))
      }
    }
  } catch (err) {
    console.error('❌ Connection error:', err)
  }
}

checkSupabase()
