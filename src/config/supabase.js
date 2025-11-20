import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vosvnqnlosvjsividxqm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvc3ZucW5sb3N2anNpdmlkeHFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NzE0MjIsImV4cCI6MjA3OTE0NzQyMn0.pFv3PazYg0Zh6u44GVx7vfIt_OIajm1Q_EYb0eDm7Zs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);