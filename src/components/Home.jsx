import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../hooks/useSupabase";
import { Store } from "../hooks/useStore";
import { v4 as uuidv4 } from 'uuid';
import GitHubButton from "react-github-btn";


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
      <h1 className='text-2xl p-2'>
        <div className="float-right">
          {/* <GitHubButton href="https://github.com/bioshazard/coffee" data-show-count="true" data-size="large" aria-label="Star bioshazard/coffee on GitHub">Star</GitHubButton> */}
          <GitHubButton href="https://github.com/bioshazard/coffee/issues" data-size="large" data-show-count="true" aria-label="Issue bioshazard/coffee on GitHub">Feedback & Ideas</GitHubButton>
        </div>
        <Link to="/">☕ Clean Coffee</Link>
      </h1>
      <div className="flex flex-1 overflow-auto flex-row">
        <div className="px-4 border-r">
          <button className="border p-2 mb-2" onClick={boardNew}>Create New</button>
          <ul className="space-y-2">
            {/* <li className="py-2 text-center">
              
            </li> */}
          {boards.map( board => (
            <li key={board.id}><Link to={`/board/${board.id}`}>{board.title}</Link></li>
          ))}
          </ul>
        </div>
        <div className="pt-2 px-8 space-y-4">
          <h2 className="text-xl font-medium">Lets get you some coffee!</h2>

          <h3 className="text-lg font-medium">How to run a lean coffee</h3>
          <ul className="list-disc list-inside">
            <li>Create a board</li>
            <li>Share the board link</li>
            <li>Set timer for 5m to add cards and votes</li>
            <li>Discuss one card at a time for 5m each (reset timer if everyone still wants to talk about it)</li>
          </ul>

          <h3 className="text-lg font-medium">Infinite Votes</h3>
          <p>This application uses Summerfieldian Infinite Voting (SIV).</p>
          <p>Rather than granting the traditional 6 votes, there is no limit.</p>
          <ul className="list-disc list-inside">
            <li>All users get 1.0 vote (notice the decimal!)</li>
            <li>Any number of votes can be given to each card which spreads the 1.0 out fractionally.</li>
            <li>One curious benefit is that the first vote delivers the full weight of the available voting power.</li>
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