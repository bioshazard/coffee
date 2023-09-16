import { useParams } from "react-router-dom";
import { Store } from "../hooks/useStore";
import { useEffect, useState } from "react";
import { supabase } from "../hooks/useSupabase";

export default function Board(props) {
  const { id } = useParams()
  const [board, setBoard] = useState()

  useEffect( () => {

    async function getBoard() {
      const { data } = await supabase.from("boards")
        .select().eq('id', id).single();
      setBoard(data)
    }
    getBoard()

    // TODO: postgres sub
    // return () => { }
  }, [])

  if(!board) return 'loading...'

  return (
    <div>
      <h2 className="text-2xl">{board.title}</h2>

    </div>
  )
}