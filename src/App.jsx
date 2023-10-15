import { Outlet, Link } from "react-router-dom";
import { Store } from './hooks/useStore';
import { useState } from "react";
import { useEffect } from "react";
import { supabase } from "./hooks/useSupabase";
import usePsuedonym from "./hooks/usePsuedonym";

export default function App() {
  const [store, setStore] = useState()

  useEffect( () => {

    // Initialize with permitted boards list
    // TODO: subscribe?
    async function getBoards() {
      const { data } = await supabase.from("boards").select();
      setStore(store => ({...store, boards: data}))
    }
    getBoards()

    // Auto instantiate psuedonym
    async function init() {

      // TODO: Cache authorized JWT in local storage to skip init auth

      // RPC before
      // console.log("PREJWT:", await supabase.rpc('get_jwt'))

      // Acquire signed psuedonym token
      const psuedonym = usePsuedonym()
      const psuedonymRequest = await supabase.functions.invoke('psuedon', { body: { psuedonym } })
      // console.log(`Psuedonym Token Acquired: |${psuedonymRequest.data.jwt}|`)
      
      // Apply token as auth
      supabase.functions.setAuth(psuedonymRequest.data.jwt)
      supabase.realtime.setAuth(psuedonymRequest.data.jwt)
      supabase.rest.headers.Authorization = `Bearer ${psuedonymRequest.data.jwt}`
      // console.log("POSTJWT:", await supabase.rpc('get_jwt'))

      // Ensure psuedonym record in DB
      const extant = await supabase.from("psuedonyms").select();
      const account = extant.data.length != 0
        ? extant
        : await supabase.from("psuedonyms").insert({ psuedonym }).select()
      
      // console.log("ACCOUNT", account)

      // Get boards list, and sub
      const boardsSelect = await supabase.from("boards").select();

      // Save to store
      setStore({
        getBoards, // pass fn for home to reload
        boards: boardsSelect.data,
        psuedonym: account.data[0]
      })
    }
    init()
  }, [])

  // !store?.boards || 
  if(!store?.psuedonym) {
    return (
      <div className="text-center pt-32">Initializing...</div>
    )
  }

  // h-screen on top div sets 100%, flex for children keeps it right-sized
  // https://www.reddit.com/r/css/comments/m2dq6t/comment/gqisj9m/?utm_source=reddit&utm_medium=web2x&context=3
  // Top Level: h-screen flex flex-col
  // Sub pages: h1.flex, div.flex,flex-1,overflow-auto
  return (
    <div className="h-screen flex flex-col">
      <Store.Provider value={store}>
        <Outlet />
      </Store.Provider>
    </div>
  )
}
