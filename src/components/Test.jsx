import { useEffect } from "react"
import { supabase, persistanon } from "../hooks/useSupabase"

export default function Test(props) {
  
  useEffect( () => {
    // const sub = supabase.channel('changes')
    //   .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' })

    async function doAuth() {
      // supabase.headers["Authorization"] = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJwc3VlZG9ueW0iOiJmYWtlbmFtZSJ9.4jvmauUJvYVoG6FZ9qQy91exrXp3yP17qSO4xKSuGVY'
      

      // OVERRIDE TESTS
      // const tokenTemp = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJwc3VlZG9ueW0iOiJmYWtlbmFtZSJ9.4jvmauUJvYVoG6FZ9qQy91exrXp3yP17qSO4xKSuGVY'

      

      const out = await supabase.rpc('get_jwt')
      console.log(out)

      const psuedonym = persistanon
      const psuedotoken = await supabase.functions.invoke('psuedon', { body: { psuedonym } })
      supabase.functions.setAuth(psuedotoken.jwt)
      supabase.realtime.setAuth(psuedotoken.jwt)
      supabase.rest.headers.Authorization = `Bearer ${psuedotoken.jwt}`
    }
    doAuth()

  })

  return (
    <div>
      TEST
    </div>
  )
}