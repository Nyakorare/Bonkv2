import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bqkwoinphwfxinmsyfnw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa3dvaW5waHdmeGlubXN5Zm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMDIzOTYsImV4cCI6MjA1OTg3ODM5Nn0.wXsaIBPQFz0hcoavMNpkhFj8hXr_Z7pRdstgnbsPdLE'

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
