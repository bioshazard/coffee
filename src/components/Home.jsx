import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../hooks/useSupabase";

export default function Home(props) {

  const [boards, setBoards] = useState()

  useEffect( () => {
    
    async function getBoards() {
      const { data } = await supabase.from("boards").select();
      setBoards(data)
    }
    getBoards()

    // TODO: postgres sub
    // return () => { }
  }, [])

  if(!boards) return 'loading...'

  return (
    <div>
      <h1 className='text-2xl'>
        <Link to="/">☕ Coffee</Link>
      </h1>
      <ul>
      {boards.map( board => (
        <li key={board.id}><Link to={`/board/${board.id}`}>{board.title}</Link></li>
      ))}
      </ul>
      <p>coffee how-to</p>
    </div>
  )
}