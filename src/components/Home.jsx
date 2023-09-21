import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, persistanon } from "../hooks/useSupabase";
import { Store } from "../hooks/useStore";

export default function Home(props) {
  const store = useContext(Store)
  // const [boards, setBoards] = useState()
  const boards = store.boards
  console.log(boards)

  useEffect( () => {
    // https://supabase.com/docs/reference/javascript/subscribe
    // const boardSubSub = supabase
    //   .channel('any')
    //   .on('postgres_changes', { event: '*', schema: 'public', table: 'boards' }, (...args) => console.log(args) )
    //   .subscribe()
    
    // return () => { boardSubSub.unsubscribe() }
  })

  // useEffect( () => {
    
  //   async function getBoards() {
  //     const { data } = await supabase.from("boards").select();
  //     setBoards(data)
  //   }
  //   getBoards()

  //   // TODO: postgres sub
  //   // return () => { }
  // }, [])

  // async function getProfile() {
  //   const { data } = await supabase.from("profiles").select();
  //   console.log("GET PROFILE", data)
  // }

  // async function createProfile() {
  //   const { data } = await supabase.from("profiles")
  //     .insert({ persistanon })
  //   // console.log("GET PROFILE", data)
  // }

  async function getSubs() {
    const { data } = await supabase.from("board_subs").select();
    console.log("GET subs", data)
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

  
  if(!boards) {
    return (
      <div className="text-center pt-32">Loading boards...</div>
    )
  }

  return (

    <>
      <h1 className='text-2xl flex p-2'>
        <Link to="/">☕ Coffee</Link>
      </h1>
      <div className="flex flex-1 overflow-auto flex-row">
        <div className="px-2">
          <ul>
            <li className="py-2">
              <button className="border p-2">Create New (TODO)</button>
            </li>
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