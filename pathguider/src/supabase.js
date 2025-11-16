import { createClient } from '@supabase/supabase-js'

// Temporarily hardcode to test
const supabaseUrl = 'https://yknttcicdhzoyfnivpwl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbnR0Y2ljZGh6b3lmbml2cHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMjA0ODIsImV4cCI6MjA3NTc5NjQ4Mn0.UwwKXY01iaIOuei7-N8Bk5JvITKU92XuTSZs1vpnreI';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase initialized:', !!supabaseUrl && !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const auth = supabase.auth


