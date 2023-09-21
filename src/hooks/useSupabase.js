import { createClient } from "@supabase/supabase-js";
import usePersistAnon from "./useAnonUser";
const dbCreds = {
  local: [
    'http://localhost:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  ],
  dev: [
    'https://egwyahahiyjfwqswsanw.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnd3lhaGFoaXlqZndxc3dzYW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTQwMzcxNjYsImV4cCI6MjAwOTYxMzE2Nn0.-8TSIQZa6cJILq0z7d-Hn6LbHwUwKagwop7fJuULItM',
  ],
}
export const persistanon = usePersistAnon()
export const supabase = createClient(
  // 'http://localhost:54321',
  // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  // 'https://egwyahahiyjfwqswsanw.supabase.co',
  // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnd3lhaGFoaXlqZndxc3dzYW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTQwMzcxNjYsImV4cCI6MjAwOTYxMzE2Nn0.-8TSIQZa6cJILq0z7d-Hn6LbHwUwKagwop7fJuULItM',
  ...dbCreds.local,
  // { "global": { "headers": { persistanon } } }
  // {
  //   "headers": {
  //     "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJwc3VlZG9ueW0iOiJmYWtlbmFtZSJ9.4jvmauUJvYVoG6FZ9qQy91exrXp3yP17qSO4xKSuGVY"
  //   }
  // }
);

// import { createClient } from '@supabase/supabase-js'
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
// export const supabase = createClient(supabaseUrl, supabaseAnonKey)