import { Outlet, Link } from "react-router-dom";
import { Store } from './hooks/useStore';
import { useState } from "react";
import { useEffect } from "react";
import { supabase } from "./hooks/useSupabase";
import usePersistAnon from "./hooks/useAnonUser";

export default function App() {
  const [store, setStore] = useState()

  // const store = {
  //   user: 'tempuser'
  // }
  const user = usePersistAnon()

  useEffect( () => {
    setStore({
      user,
    })
  }, [])

  if(!store) return 'loading...'

  return (
    <div className="p-2">
      <h1 className='text-2xl'>
        <Link to="/">Coffee</Link>
      </h1>
      <p>{store.user}</p>
      <Store.Provider value={store}>
        <Outlet />
      </Store.Provider>
    </div>
  )
}
