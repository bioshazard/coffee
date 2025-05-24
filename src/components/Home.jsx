import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../hooks/useSupabase";
import { Store } from "../hooks/useStore";
import { v4 as uuidv4 } from 'uuid';
import GitHubButton from "react-github-btn";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoffee } from "@fortawesome/free-solid-svg-icons";


export default function Home(props) {
  const navigate = useNavigate()
  
  const store = useContext(Store)
  // const [boards, setBoards] = useState()
  const boards = store.boards
  // console.log(boards)

  useEffect( () => {
    // https://supabase.com/docs/reference/javascript/subscribe
    // const boardSubSub = supabase
    //   .channel('any')
    //   .on('postgres_changes', { event: '*', schema: 'public', table: 'boards' }, (...args) => console.log(args) )
    //   .subscribe()
    
    // return () => { boardSubSub.unsubscribe() }
  })

  async function getSubs() {
    const { data } = await supabase.from("board_subs").select();
    // console.log("GET subs", data)
  }

  async function addSub() {
    const { data } = await supabase.from("board_subs")
      .insert({
        boardid: '0c6553e2-523a-49bf-9a30-ee63ea14354a',
        profileid: store.profile.id,
        // profileid: "faa06cce-2588-4621-9b15-89445940a8ff",
      })
    // console.log("GET PROFILE", data)
  }

  const boardNew = async () => {
    // RLS prevents select, so we must provide our own ID to re-use with board_subs
    const boardId = uuidv4();
    await supabase.from('boards').insert({
      id: boardId,
      owner_id: store.psuedonym.id,
      title: 'Lean Coffee',
      kind: 'lean'
    })
    await supabase.from('board_subs').insert({
      board_id: boardId,
      owner_id: store.psuedonym.id
    })
    store.getBoards()
    // navigate(`/board/${boardId}`)
  }

  
  if(!boards) {
    return (
      <div className="text-center pt-32">Loading boards...</div>
    )
  }

  return (

    <>
      <header className="border-b px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-semibold"><FontAwesomeIcon icon={faCoffee} /> Clean Coffee</Link>
        <GitHubButton href="https://github.com/bioshazard/coffee/issues" data-size="large" data-show-count="true" aria-label="Issue bioshazard/coffee on GitHub">Feedback & Ideas</GitHubButton>
      </header>
      <div className="flex flex-1 overflow-auto flex-row">
        <div className="w-60 border-r p-4 space-y-4">
          <button className="w-full bg-black text-white px-3 py-2 rounded" onClick={boardNew}>Create New</button>
          <ul className="space-y-2">
          {boards.map( board => (
            <li key={board.id}><Link className="hover:underline" to={`/board/${board.id}`}>{board.title}</Link></li>
          ))}
          </ul>
        </div>
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          <h2 className="text-xl font-medium">Lets get you some coffee!</h2>

          <h3 className="text-lg font-medium">How to run a lean coffee</h3>
          <ul className="list-disc list-inside">
            <li>Create a board</li>
            <li>Share the board link</li>
            <li>Set timer for 5m to add cards and votes</li>
            <li>Discuss one card at a time for 5m each (reset timer if everyone still wants to talk about it)</li>
          </ul>

          <h3 className="text-lg font-medium">Voting</h3>
          <p>Everyone gets eight votes.</p>
          <p>Votes on each card are summed up and displayed.</p>
          <ul className="list-disc list-inside">
            <li>Client side limits each participant to 8 total votes.</li>
            <li>The highest voted cards rise to the top when sorting by votes.</li>
          </ul>

          <h3 className="text-lg font-medium">Authentication</h3>
          <p>No need to log in!</p>
          <p>A secret was generated in your browser storage to identify you to keep track of your boards.</p>
          
          {/* <p>coffee how-to</p>
          <ul>
            <li>{store.profile.id}</li>
            <li>{persistanon}</li>
            <li><button onClick={getSubs}>List sub</button></li>
            <li><button onClick={addSub}>Add sub</button></li>
          </ul> */}
        </div>
      </div>
      
    </>
  )
}