import { Link, useNavigate, useParams } from "react-router-dom";
import { Store } from "../hooks/useStore";
import { useContext, useEffect, useState } from "react";
import { supabase } from "../hooks/useSupabase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowLeft, faArrowRight, faArrowUp, faBomb, faBroom, faEraser, faHourglass, faMinus, faPencil, faPlay, faPlus, faSort, faStar, faStop, faStopwatch } from "@fortawesome/free-solid-svg-icons";
import ReactModal from "react-modal";
// import Timer from "./Timer";

ReactModal.setAppElement('#root');

let ran = false
export default function Board(props) {
  
  const navigate = useNavigate()
  const { board_id } = useParams()

  const { psuedonym, boards } = useContext(Store)
  // const psuedonym.psuedonym = psuedonym.psuedonym // TODO: clean this up


  // async function addToBoardSubs(id) {
  //   // Prevent double load
  //   // if(ran) return
  //   // ran = true

  //   const result = await supabase.from("board_subs")
  //     .insert({ board_id: id, profileid: profile.id })
  //     .select()
  //   return result
  // }

  // Cut early to manage board sub
  const [notice, setNotice] = useState()
  if( ! boards.some( obj => obj.id === board_id ) ) {
    // return (
    //   <div>
    //     <h2>This board is not in your</h2>
    //   </div>
    // )

    // Automatically add this board to the subs...
    // TODO: Auto-reload, probably just need to sub to the board_subs table at the app level to auto-refresh
    // addToBoardSubs(board_id).then( result => {
    //   console.log("ADD BOARD", result)
    //   navigate(0) // reload page
    // })

    const addBoardToList = async () => {
      // const newSub = await addToBoardSubs(board_id)
      
      // Add this board to my board_subs
      const newSub = await supabase.from("board_subs")
        .insert({ board_id, owner_id: psuedonym.id })
        .select()
      // console.log(newSub)

      if(newSub.data) {
        navigate(0) // reload page
        return
      }

      // failure!
      if(newSub.error.code === "23503") {
        setNotice((
          <div>
            <span className="border-2 border-rose-500 p-2 bg-red-200">
              Error {newSub.error.code}: This probably isn't a valid board URL...
            </span>
          </div>
        ))
      }
    }

    return (
      // <div className="text-center pt-32">Adding you to the board...</div>
      <div className="text-center pt-32 space-y-8">
        <h2>This board is not in your list. Proceed to add it.</h2>
        <button onClick={addBoardToList} className="p-2 border font-medium">Proceed to Board</button>
        <div>
          <Link to='/' className="p-3 border font-medium">Return to Home</Link>
        </div>
        <div>{notice}</div>
      </div>
    )
  }





  const [board, setBoard] = useState()
  const [cards, setCards] = useState()
  const [votes, setVotes] = useState()
  const columns = ['Topics', 'Discussing', 'Done'] // type: lean

  const [voteSort, setVoteSort] = useState('created') // TODO: localStorage

  useEffect( () => {

    async function getBoard() {
      const { error, data } = await supabase.from("boards")
        .select().eq('id', board_id).single();
      setBoard(data)
    }

    const getCards = async () => {
      const { data } = await supabase.from("cards")
        .select().eq('board_id', board_id);
      setCards(data)
    }
    
    const getVotes = async () => {
      const { data } = await supabase.from("votes")
        .select().eq('board_id', board_id);
      setVotes(data)
    }

    getBoard()
    getCards()
    getVotes()

    const handleSubChange = (change) => {
      // TODO: filter by this board id
      // console.log(change)
      if(change["table"] === "boards") {
        setBoard(change.new)
        return
      }
  
      if(change["table"] === "cards") {
        // getCards(); // replaced by in-place update below
        
        // Surgical state update
        if(change.eventType === "UPDATE") {
          setCards( cards =>            // Given the current card state
            cards.map( card =>          // Take each of the cards
              card.id === change.old.id // And if the id matches the change
                ? change.new : card     // Return the change, else no change
            )
          )
          return
        }
        if(change.eventType === "INSERT") {
          setCards( cards => [...cards, change.new] )
          return
        }
        if(change.eventType === "DELETE") {
          setCards( cards => cards.filter( card => card.id != change.old.id ) )
          return
        }
      }
      // TODO: Surgical change: Separate fetch from calc. Modify state and then re-calc.
      if(change["table"] === "votes") { getVotes() }
    }
  
    // https://supabase.com/docs/reference/javascript/subscribe
    const allSub = supabase
      .channel('dbchanges')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'boards', filter: `id=eq.${board_id}` }, handleSubChange)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cards', filter: `board_id=eq.${board_id}` }, handleSubChange)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cards', filter: `board_id=eq.${board_id}` }, handleSubChange)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'cards', filter: `board_id=eq.${board_id}` }, handleSubChange)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes', filter: `board_id=eq.${board_id}` }, handleSubChange)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'votes', filter: `board_id=eq.${board_id}` }, handleSubChange)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'votes', filter: `board_id=eq.${board_id}` }, handleSubChange)
      .subscribe()
    
    return () => { allSub.unsubscribe() }
  }, [])

  const cardNewSubmit = async (event) => {
    event.preventDefault()
    const col = parseInt(event.target.col.value)
    const content = event.target.text.value
    if( ! content ) { return } // TODO: Disable the Add button during submit or if textarea empty
    event.target.text.disabled = true
    event.target.addCardBtn.disabled = true
    const insert = { 
      board_id,
      col,
      content,
    }

    // // Fake delay
    // await new Promise(resolve => setTimeout(resolve, 5000))

    // supabase create card
    const { error } = await supabase
      .from('cards')
      .insert(insert)
    
    // Reset input form
    event.target.reset()
    event.target.text.disabled = false
    event.target.addCardBtn.disabled = false

    // Re-focus textarea
    event.target.text.focus()
  }

  const cardDelete = async (card_id) => {
    const { error: errorVotes } = await supabase
      .from('votes').delete().eq('card_id', card_id)
    const { error: errorCard } = await supabase
      .from('cards').delete().eq('id', card_id)
  }

  const voteAdd = async (card_id, current) => {
    // current = voteTotals.mine[card_id]
    const beforeVoteCount = !current ? 0 : current
    await supabase.from('votes').upsert({
      board_id,
      card_id,
      owner_id: psuedonym.id,
      count: beforeVoteCount + 1,
    }, {
      onConflict: 'card_id,owner_id',
      ignoreDuplicates: false,
    })
    // Vote display will update by the realtime subscription
    // console.log("AFTER")
    // Took a second to reload locally so maybe I can do optimistic update...
    // console.log(votes)
    setVotes( votes => 
      votes.map( vote => 
        vote.card_id == card_id && vote.owner_id == psuedonym.id
        ? { ...vote, count: beforeVoteCount + 1 }
        : vote
    ))
  }

  const voteRemove = async (card_id, current) => {
    if(!current) {
      console.error("No votes to remove! How did you even trigger this?!")
    } else if(current === 1) {
      const { data, error } = await supabase
        .from('votes').delete().eq('card_id', card_id).eq('owner_id', psuedonym.id)
    } else if(current > 1) {
      const { error } = await supabase
        .from('votes').update({ board_id, card_id, count: current - 1, owner_id: psuedonym.id })
        .eq('card_id', card_id).eq('owner_id', psuedonym.id)
    }
  }

  const [voteClearModalOpen, setVoteClearModalOpen] = useState(false)

  const votesClearAll = async () => {
    const { error } = await supabase.from('votes')
      .delete().eq('board_id', board_id)
    setVoteClearModalOpen(false)
  }
  const votesClearMine = async () => {
    const { error } = await supabase.from('votes')
      .delete().eq('board_id', board_id).eq('owner_id', psuedonym.id)
  }





  const cardColumnSet = async (card_id, col) => {
    const { error } = await supabase.from('cards').update({col}).eq('id', card_id)
  }

  const [editing, setEditing] = useState([])
  const [cardNewForm, setCardNewForm] = useState([])

  // Toggle by either adding the id if not there, or returning the array without it if present
  const cardEditToggle = (id) => {
    setEditing( state => !state.includes(id)
      ? [...state, id] 
      : state.filter(item => item != id) )
  }
  const cardNewFormToggle = (colId) => {
    setCardNewForm( state => !state.includes(colId)
      ? [...state, colId] 
      : state.filter(item => item != colId) )
  }
  const editSubmit = async (event) => {
    event.preventDefault()
    const card_id = event.target.id.value
    const content = event.target.content.value
    const update = { content }
    const { error } = await supabase
      .from('cards').update(update).eq('id', card_id)
    cardEditToggle(card_id)
  }

  
  const calculateVotes = () => {
    // console.log(votes)
    
    // TODO: Account for pending load?
    // if(!votes) return [[], []]

    // I asked ChatGPT how to group the vote objects by owner
    // Then asked "more concise" until this popped out lol
    const groupedByOwner = votes.reduce( (result, { owner_id, ...rest }) => ({ 
      ...result,
      [owner_id]: [...(result[owner_id] || []), rest] 
    }), {});

    // console.log(groupedByOwner)

    // Per owner, calculate the normalized vote weight to add per card
    const myVotes = {}
    const cardVotes = {}
    let myVoteTotal = 0
    for(const ownerIndex in groupedByOwner) {
      const ownerVotes = groupedByOwner[ownerIndex]
      const total = ownerVotes.reduce( (acc, cur) => acc + cur.count, 0)
      ownerVotes.forEach( ownerVote => {
        const card_id = ownerVote["card_id"]
        // Initialize
        if(!cardVotes.hasOwnProperty(card_id)) {
          cardVotes[card_id] = 0
          myVotes[card_id] = 0
      }
        cardVotes[card_id] += ownerVote["count"] / total
        if(ownerIndex === psuedonym.id) {
          myVotes[card_id] += ownerVote["count"]
          myVoteTotal += ownerVote["count"]
        }
      })
    }

    return {
      calculated: cardVotes,
      mine: myVotes,
      mineTotal: myVoteTotal
    }
  }

  // Define custom components for ReactMarkdown
  const components = {
    // Map HTML tags to custom React components with Tailwind CSS classes
    p: ({ children }) => <p>{children}</p>,
    h1: ({ children }) => <h1 className="text-3xl font-bold my-2">{children}</h1>,
    h2: ({ children }) => <h2 className="text-2xl font-bold my-2">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-bold my-2">{children}</h3>,
    h4: ({ children }) => <h4 className="text-lg font-bold my-2">{children}</h4>,
    h5: ({ children }) => <h5 className="text-base font-bold my-2">{children}</h5>,
    h6: ({ children }) => <h6 className="text-sm font-bold my-2">{children}</h6>,
    ul: ({ children }) => <ul className="list-disc ml-6 mb-4">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal ml-6 mb-4">{children}</ol>,
    li: ({ children }) => <li className="mb-2">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-400 pl-2 italic">{children}</blockquote>
    ),
    // code: ({ children }) => <code className="bg-gray-200 rounded px-2 py-1">{children}</code>,
    code: ({inline, children}) => inline
      ? <code className="bg-gray-200 rounded px-2 py-1">{children}</code>
      // : <code className="bg-gray-200 rounded px-2 py-1">{args.children}</code>,
      : <div className="bg-gray-900 text-white p-2 rounded-lg shadow-lg">
          <pre className="font-mono text-sm leading-relaxed overflow-x-scroll">
            <code>
              {children}
            </code>
          </pre>
        </div>,
    
    // inlineCode: ({ children }) => <code className="bg-gray-200 rounded px-1">INLINE {children}</code>,
    a: ({ children, href }) => (
      <a className="text-blue-500 hover:underline" target="_blank" href={href}>
        {children}
      </a>
    ),
  };

  // console.log(board)

  const unsubBoard = async () => {
    const result = await supabase.from("board_subs")
      .delete()
      .eq('board_id', board_id)
      .eq('profileid', profile.id)
    navigate(0) // reload page
  }

  if(!board || !cards || !votes) {
    return (
      <div className="text-center pt-32">Loading board...</div>
    )
  }

  const voteTotals = calculateVotes()
  const cardSortFn = (a, b) => {

    if(voteSort === "created") {
      return new Date(a.created).getTime() - new Date(b.created).getTime()
    }

    // else sort by vote calculation
    const aVal =  voteTotals.calculated[a.id] ? voteTotals.calculated[a.id] : 0
    const bVal =  voteTotals.calculated[b.id] ? voteTotals.calculated[b.id] : 0
    return aVal - bVal
  }

  const timerSubmitStart = async event => {
    event.preventDefault()
    // split and reverse lets us read seconds if exists, then mm if exists...
    const [ss, mm, hh] = event.target.duration.value.split(':').reverse()
    let durationSeconds = 0
    if(!(ss === undefined)) durationSeconds += parseInt(ss) 
    if(!(mm === undefined)) durationSeconds += parseInt(mm) * 60
    if(!(hh === undefined)) durationSeconds += parseInt(hh) * 60 * 60

    // https://futurestud.io/tutorials/add-seconds-to-a-date-in-node-js-and-javascript
    const timer = new Date()
    timer.setSeconds( timer.getSeconds() + durationSeconds )

    const { data, error } = await supabase.from('boards')
      .update({ timer }).eq('id', board_id).select().single()
  }

  const boardTitleUpdate = async (event) => {
    event.preventDefault()
    const newTitle = event.target.title.value
    await supabase.from('boards')
      .update({ title: newTitle })
      .eq('id', board_id)
    event.target.title.blur()
      // Let the realtime sub pick up the change...
  }

  const timerStop = async () => {
    const { data, error } = await supabase.from('boards')
      .update({ timer: new Date() }).eq('id', board_id)
  }

  const Timer = (props) => {

    const getTimerDiff = () => new Date(props.timer).getTime() - new Date().getTime()
    const [remainingMilliseconds, setRemainingMilliseconds] = useState( getTimerDiff() )

    const mmss = () => {
      return [
        `${Math.floor(remainingMilliseconds / 1000 / 60)}`.padStart(2, "0"),
        `${Math.floor(remainingMilliseconds / 1000 % 60)}`.padStart(2, "0"),
      ].join(":")
    }

    useEffect( () => {
      // If board time remaining is positive, init remaining state and interval countdown
      const diff = getTimerDiff()
      // console.log("DIFF", diff)
      if(diff < 0) return
      setRemainingMilliseconds(diff)

      // setRemainingSeconds()
      const countdownInterval = setInterval( () => {
        const diff = getTimerDiff()
        if(diff < 0) { clearInterval(countdownInterval) }
        // console.log("REMAINING", diff)
        setRemainingMilliseconds(diff)
      }, 1000)
      
      return () => clearInterval(countdownInterval)
    }, [])

    return (
      <div>
        {/* {props.timer} */}
        {remainingMilliseconds > 0 ? (
          <div className="flex space-x-2">
            <div className="font-mono">
              {mmss()}
            </div>
            <div>
              <button onClick={timerStop}><FontAwesomeIcon icon={faStop} /></button>
            </div>
          </div>
        ) : (
          <form onSubmit={timerSubmitStart}>
            <FontAwesomeIcon icon={faStopwatch} />
            <input name="duration" type="text" className="text-center font-mono px-1" size={5} defaultValue={"05:00"} />
            <button><FontAwesomeIcon icon={faPlay} /></button>
          </form>
        )}
      </div>
    )
  }

  // True if any weight is past the first column
  // const votingDisabled = voteTotals.calculated[]
  // console.log(votingDisabled)

  // cards.filter( card => card.col != 0 && voteTotals.calculated[card.id])
  //   .some( card => )

  // Loop through each card that has votes
  // If any voted card is past first column, voting is disabled.
  // const votingDisabled = Object.keys(voteTotals).some( cardId => cards.some( card => ) )
  const votingDisabled = cards.some( card => card.col != 0 && voteTotals.calculated[card.id])
  //   console.log(card, card.col, card.col != 0, card.id, voteTotals, voteTotals.calculated[card.id])

  // } )
  // console.log(votingDisabled)

  // trick to get tailwind to include these...
  const hueClasses = [
    "bg-blue-100",
    "bg-blue-200",
    "bg-blue-300",
    "bg-blue-400",
    "bg-blue-500",
    "bg-blue-600",
    "bg-blue-700",
    "bg-blue-800",
    "bg-blue-900",
  ]

  const getMyVoteHue = (cardId) => {
    // Print hue by weight first decimal
    const myVoteWeight = (voteTotals.mine[cardId] / voteTotals.mineTotal).toFixed(2)
    
    // TODO: Normalize for 100 - 900 range??
    const tailwindHue = Math.floor(myVoteWeight * 10) * 100 

    console.log(cardId, myVoteWeight, tailwindHue)
    return `bg-blue-${tailwindHue} ${tailwindHue > 300 ? "text-white" : "text-black"}`
  }

  return (
    <div className="p-2">
      <ReactModal
        isOpen={voteClearModalOpen}
        onRequestClose={() => setVoteClearModalOpen(false)}
      >
        <div className="text-center space-y-12">
          <h2 className="text-2xl">Confirm Clear ALL Votes</h2>
          <div>
            <button className="p-2 rounded bg-red-800 text-white font-medium" onClick={votesClearAll}>DELETE ALL VOTES NOW</button>
          </div>
          <div>
            <button className="p-2 rounded bg-red-500 text-white font-medium" onClick={() => setVoteClearModalOpen(false)}>Cancel</button>
          </div>
        </div>
      </ReactModal>

      {/* <pre>
      {JSON.stringify(board, undefined, 2)}
      {JSON.stringify(cards, undefined, 2)}
      {JSON.stringify(voteTotals, undefined, 2)}
      </pre> */}

      <div>
        <div className="float-right flex space-x-4 pb-2">
          <div className="px-2 border">
            {/* <span className="font-mono px-1">5:00</span>
            <FontAwesomeIcon icon={faPlay} /> */}
            {/* <Timer {...timerProps} /> */}
            <Timer timer={board.timer}/>
          </div>
          <button className="px-2 border" onClick={() => setVoteSort(state => state === "created" ? 'votes' : 'created')}>
            <FontAwesomeIcon icon={faSort} /> Sort: {voteSort}
          </button>
          <button className="px-2 border" onClick={votesClearMine}>
            <FontAwesomeIcon icon={faEraser} /> Clear My Votes ({voteTotals.mineTotal})
          </button>
          <button className="px-2 border" onClick={() => setVoteClearModalOpen(true)}>
            <FontAwesomeIcon icon={faBomb} /> Clear All Votes
          </button>
          <button className="px-2 border" title="Unsubscribe from board" onClick={unsubBoard}>
            <FontAwesomeIcon className="text-yellow-400" icon={faStar} /> Unsub
          </button>
        </div>
        <h1 className='text-2xl'>
          <Link to="/">☕</Link> / <form className="inline" onSubmit={boardTitleUpdate}>
            <input name="title" type="text" defaultValue={board.title} size={board.title.length} className="w-fit inline" />
          </form>
        </h1>
        <div className="clear-both"></div>
      </div>
      {/* {JSON.stringify(voteTotals)}
      {JSON.stringify(editing)} */}
      <ul className="flex flex-row gap-x-4 overflow-x-scroll">
      {columns.map( (column, colIndex) => (
        <li key={colIndex}>
          <div className="w-80">
            <h2 className="text-xl pb-2">{column}</h2>
            <ul className="flex flex-col gap-y-4">
              <li>
                {cardNewForm.includes(colIndex) ? (
                  <form onSubmit={cardNewSubmit} className="flex flex-col gap-y-2">
                    <input type="hidden" name="col" value={colIndex} />
                    <textarea autoFocus className="border w-full px-1" name="text" placeholder="New Card" rows={5} />
                    <input className="text-center bg-green-500 p-2 rounded text-white font-medium disabled:opacity-25" type="submit" name="addCardBtn" value="Add Card" />
                    <button className="text-center bg-red-500 p-2 rounded text-white font-medium" onClick={() => cardNewFormToggle(colIndex)} type="button">Cancel</button>
                  </form>
                ) : (
                  <input onClick={() => cardNewFormToggle(colIndex)} onBlur={() => cardNewFormToggle(colIndex)} autoComplete="off" className="disabled border w-full px-1" name="text" placeholder="New Card" />
                )}
                {/* {JSON.stringify(cardNewForm)} */}

              </li>
              {cards.filter(card => card.col === colIndex).toSorted(cardSortFn).reverse().map( card => (
              <li key={card.id}>
                <div className="border p-2 group">
                  {editing.includes(card.id) ? (
                    <div>
                      <form onSubmit={editSubmit}>
                        <div className="flex flex-col gap-2">
                          {/* https://primitives.solidjs.community/package/autofocus */}
                          <input type="hidden" defaultValue={card.id} name="id"/>
                          <textarea autoFocus className="py-1 px-2 border" rows={card.content.split('\n').length + 4} defaultValue={card.content} name="content"/>
                          {/* <select className="border py-1 px-2">
                            <option>Columns Choice</option>
                          </select> */}
                          <input className="py-1 px-2 bg-green-500 text-white font-medium" type="submit" value="Save" />
                          <button className="py-1 px-2 bg-red-500 text-white font-medium" type="button" onClick={() => cardEditToggle(card.id)}>Cancel</button>
                          <button className="mt-6 py-1 px-2 bg-red-800 text-white font-medium" type="button" onClick={() => cardDelete(card.id)}>Delete</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    // https://tailwindcss.com/docs/hover-focus-and-other-states#styling-based-on-parent-state
                    <div className="">
                      <div className="text-xs">
                        <div className="float-left space-x-2">
                          <button 
                            className="disabled:opacity-25" disabled={card.col === 0}
                            onClick={() => cardColumnSet(card.id, Math.max(card.col - 1, 0))}>
                            <FontAwesomeIcon icon={faArrowLeft} />
                          </button>
                          <button
                              className="disabled:opacity-25" disabled={card.col === columns.length - 1}
                              onClick={() => cardColumnSet(card.id, Math.min(card.col + 1, columns.length - 1))}>
                            <FontAwesomeIcon icon={faArrowRight} />
                          </button>
                        </div>
                        <div className="float-right space-x-2 font-mono">
                          <button className="disabled:opacity-25"
                              disabled={!voteTotals.mine[card.id] || votingDisabled} 
                              onClick={() => voteRemove(card.id, voteTotals.mine[card.id])}>
                            <FontAwesomeIcon icon={faMinus} />
                          </button>
                          {/* TODO: Kinda gross to have double ternary... but its not THAT complicated... */}
                          <span title={votingDisabled ? "Voting is disabled after discussion begins" : "Add your votes!"}
                          className={[
                            "p-1 rounded",
                            !voteTotals.mine[card.id] ? "bg-gray-300" : ( [
                              !votingDisabled ? getMyVoteHue(card.id) : "bg-black"
                            ].join(" ")
                            )
                          ].join(" ")}>
                            {voteTotals.mine[card.id] && (
                              `${(voteTotals.mine[card.id] / voteTotals.mineTotal).toFixed(2)} (${voteTotals.mine[card.id]})`
                            ) || 0}
                          </span>
                          <button disabled={votingDisabled} className="disabled:opacity-25" onClick={() => voteAdd(card.id, voteTotals.mine[card.id])}><FontAwesomeIcon icon={faPlus} /></button>
                        </div>
                        <div className="flex justify-center space-x-2">
                          <span className="">Votes: {voteTotals.calculated[card.id] && (voteTotals.calculated[card.id]).toFixed(2) || 0}</span>
                        </div>
                      </div>

                      <div className="float-right py-2">
                        <button className="bg-white rounded invisible group-hover:visible" onClick={() => cardEditToggle(card.id)}><FontAwesomeIcon icon={faPencil} /></button>
                      </div>
                      <ReactMarkdown children={card.content} components={components} remarkPlugins={[remarkGfm]} />
                      {/* <div className="text-center text-xs">{new Date(card.created).toISOString()}</div> */}
                    </div>
                  )}
                </div>
              </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
      </ul>

    </div>
  )
}