import { Outlet, Link } from "react-router-dom";
import { Store } from './hooks/useStore';
import { useState } from "react";
import { useEffect } from "react";
import { supabase } from "./hooks/useSupabase";
import usePsuedonym from "./hooks/usePsuedonym";

export default function App() {
  const [store, setStore] = useState()

  let ranLoad = false
  useEffect( () => {

    // Auto instantiate psuedonym
    async function init() {

      // RPC before
      console.log("PREJWT:", await supabase.rpc('get_jwt'))

      // Acquire signed psuedonym token
      const psuedonym = usePsuedonym()
      const psuedonymRequest = await supabase.functions.invoke('psuedon', { body: { psuedonym } })
      // console.log(`Psuedonym Token Acquired: |${psuedonymRequest.data.jwt}|`)
      
      // Apply token as auth
      supabase.functions.setAuth(psuedonymRequest.data.jwt)
      supabase.realtime.setAuth(psuedonymRequest.data.jwt)
      supabase.rest.headers.Authorization = `Bearer ${psuedonymRequest.data.jwt}`
      console.log("POSTJWT:", await supabase.rpc('get_jwt'))

      // Ensure psuedonym record in DB
      const extant = await supabase.from("psuedonyms").select();
      const account = extant.data.length != 0
        ? extant
        : await supabase.from("psuedonyms").insert({ psuedonym }).select()
      
      console.log("ACCOUNT", account)

      // Get boards list, and sub
      const boardsSelect = await supabase.from("boards").select();

      // Save to store
      setStore({
        boards: boardsSelect.data,
        psuedonym: account.data[0]
      })
    }
    init()

    // // Auto insatiate profile on visit
    // async function loadProfile() {
    //   if(ranLoad) return
    //   ranLoad = true // Prevent double-run in strict
    //   const extant = await supabase.from("profiles").select();
    //   const profile = extant.data.length != 0 
    //     ? extant // Create if not exists
    //     : await supabase.from("profiles").insert({ persistanon }).select();
    //   setStore(store => ({...store, profile: profile.data[0] }))
    // }
    // loadProfile()

    // Initialize with permitted boards list
    // TODO: subscribe?
    async function getBoards() {
      const { data } = await supabase.from("boards").select();
      setStore(store => ({...store, boards: data}))
    }
    getBoards()

    // Sub board list
    const handleSubChange = (change) => {
      // TODO: filter by this board id
      console.log("BOARD LIST CHANGE", change)
  
      // if(change["table"] === "cards") {
      //   // getCards(); // replaced by in-place update below
        
      //   // Surgical state update
      //   if(change.eventType === "UPDATE") {
      //     setCards( cards =>            // Given the current card state
      //       cards.map( card =>          // Take each of the cards
      //         card.id === change.old.id // And if the id matches the change
      //           ? change.new : card     // Return the change, else no change
      //       )
      //     )
      //     return
      //   }
      //   if(change.eventType === "INSERT") {
      //     setCards( cards => [...cards, change.new] )
      //     return
      //   }
      //   if(change.eventType === "DELETE") {
      //     setCards( cards => cards.filter( card => card.id != change.old.id ) )
      //     return
      //   }
      // }
      // // TODO: Surgical change: Separate fetch from calc. Modify state and then re-calc.
      // if(change["table"] === "votes") { getVotes() }
    }
  
    // https://supabase.com/docs/reference/javascript/subscribe
    // const boardSubSub = supabase
    //   .channel('any')
    //   .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'board_subs' }, handleSubChange)
    //   .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'board_subs' }, handleSubChange)
    //   .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'board_subs' }, handleSubChange)
    //   .subscribe()
    
    // return () => { boardSubSub.unsubscribe() }
    
    // const subtest = supabase.channel('realtime')
    //   .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cards' }, (...args) => console.log(args) )
    //   .subscribe()
    
    // return () => { subtest.unsubscribe() }
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
