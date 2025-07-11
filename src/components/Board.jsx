import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Store } from "../hooks/useStore";
import { useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../hooks/useSupabase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight, faBomb, faCancel, faDumpsterFire, faEraser, faFloppyDisk, faMinus, faNoteSticky, faPencil, faPlay, faPlus, faRotateLeft, faSort, faStop, faStopwatch, faThumbTack, faTrash, faBars, faVoteYea, faCoffee } from "@fortawesome/free-solid-svg-icons";
import ReactModal from "react-modal";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import GitHubButton from "react-github-btn";
// import Timer from "./Timer";

ReactModal.setAppElement('#root');

// const ran = false
const ItemTypes = { CARD: 'card' }

function DraggableCard({ card, children }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.CARD,
    item: { id: card.id, col: card.col },
    collect: monitor => ({ isDragging: monitor.isDragging() })
  }), [card])

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {children}
    </div>
  )
}

function DropColumn({ colIndex, onDrop, children }) {
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.CARD,
    drop: (item) => {
      console.log("drop",{item})
      onDrop(item.id, colIndex)
    }
  }), [colIndex, onDrop])

  return (
    <ul ref={drop} className="flex-1 flex flex-col gap-y-4">
      {children}
    </ul>
  )
}
export default function Board(props) {
  
  const navigate = useNavigate()
  const { board_id } = useParams()

  localStorage.setItem("lastBoard", board_id);

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
  if( ! boards.some( obj => obj.id === board_id ) ) { // Line 160
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
        <h2>This board is not pinned in your list. Proceed to pin it.</h2>
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

  const [voteSort, setVoteSort] = useState(
    () => localStorage.getItem('voteSort') || 'updated'
  )

  useEffect(() => {
    localStorage.setItem('voteSort', voteSort)
  }, [voteSort])

  const [timeFilter, setTimeFilter] = useState('all')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const getBoard = useCallback(async () => {
    const { error, data } = await supabase.from("boards")
      .select().eq('id', board_id).single();
    setBoard(data)
  }, [board_id])

  const getCards = useCallback(async () => {
    const { data } = await supabase.from("cards")
      .select().eq('board_id', board_id);
    setCards(data)
  }, [board_id])

  const getVotes = useCallback(async () => {
    const { data } = await supabase.from("votes")
      .select().eq('board_id', board_id);
    setVotes(data)
  }, [board_id])

  const handleSubChange = useCallback( (change) => {
    console.log("SUB CHANGE", {change})
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
        setCards( cards => cards.filter( card => card.id !== change.old.id ) ) // Line 246
        return
      }
    }
    // TODO: Surgical change: Separate fetch from calc. Modify state and then re-calc.
    if(change["table"] === "votes") { getVotes() }
  }, [getVotes])

  useEffect( () => {

    getBoard()
    getCards()
    getVotes()
  
    // https://supabase.com/docs/reference/javascript/subscribe
    const allSub = supabase
      .channel('dbchanges')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'boards', filter: `id=eq.${board_id}` }, handleSubChange)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cards', filter: `board_id=eq.${board_id}` }, handleSubChange)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cards', filter: `board_id=eq.${board_id}` }, handleSubChange)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'cards', filter: `board_id=eq.${board_id}` }, handleSubChange)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes', filter: `board_id=eq.${board_id}` }, handleSubChange)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'votes', filter: `board_id=eq.${board_id}` }, handleSubChange)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'votes' }, handleSubChange) // no other way to detect...
      .subscribe()
    
    return () => { allSub.unsubscribe() }
  }, [board_id, getBoard, getCards, getVotes, handleSubChange])

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

    // Clear share info so subsequent cards are blank
    setShareText('')
    setSearchParams({})

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
    // Limit to eight votes per participant
    const myTotal = votes.reduce(
      (acc, v) => v.owner_id === psuedonym.id ? acc + v.count : acc,
      0
    )
    if(myTotal >= 8) {
      return
    }
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
        vote.card_id === card_id && vote.owner_id === psuedonym.id // Line 299
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

    // // DELETE doesnt trigger!
    // getVotes()
  }
  const votesClearMine = async () => {
    const { error } = await supabase.from('votes')
      .delete().eq('board_id', board_id).eq('owner_id', psuedonym.id)
    
    // // DELETE doesnt trigger!
    // getVotes()
  }

  const cardsClearAll = async () => {
    await votesClearAll() // TODO: Should really rather use delete cascase on votes...
    const { error } = await supabase.from('cards')
      .delete().eq('board_id', board_id)
    setVoteClearModalOpen(false)
  }





  const cardColumnSet = async (card_id, col) => {
    const update = { col, updated: new Date().toISOString() }
    const { error } = await supabase.from('cards').update(update).eq('id', card_id)
  }

  const [editing, setEditing] = useState([])
  const [cardNewForm, setCardNewForm] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  const shareParam = searchParams.get('share')
  const formatAsBlockquote = (text) => {
    if (!text) return '';
    return text.split('\n').map(line => `> ${line}`).join('\n');
  };

  const [shareText, setShareText] = useState(
    shareParam ? decodeURIComponent(shareParam) : ''
  )

  useEffect(() => {
    if(shareParam && !cardNewForm.includes(0)) {
      setCardNewForm([0])
    }
    setShareText(shareParam ? formatAsBlockquote(decodeURIComponent(shareParam)) : '')
  }, [shareParam])

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
    const update = { content, updated: new Date().toISOString() }
    const { error } = await supabase
      .from('cards').update(update).eq('id', card_id)
    cardEditToggle(card_id)
  }

  
  const calculateVotes = () => {
    // Sum up votes per card and track my totals
    const myVotes = {}
    const cardVotes = {}
    let myVoteTotal = 0

    votes.forEach( vote => {
      const { card_id, owner_id, count } = vote

      if(!cardVotes.hasOwnProperty(card_id)) {
        cardVotes[card_id] = 0
      }
      cardVotes[card_id] += count

      if(owner_id === psuedonym.id) {
        myVotes[card_id] = count
        myVoteTotal += count
      }
    })

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
      <a className="text-blue-500 hover:underline" target="_blank" rel="noreferrer" href={href}> {/* Line 374 */}
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

  if(!board || !cards || !votes) { // Line 559
    return (
      <div className="text-center pt-32">Loading board...</div>
    )
  }

  const voteTotals = calculateVotes()
  const cardSortFn = (a, b) => {

    if(voteSort === "updated") {
      return new Date(a.updated).getTime() - new Date(b.updated).getTime()
    }

    // else sort by vote calculation
    const aVal =  voteTotals.calculated[a.id] ? voteTotals.calculated[a.id] : 0
    const bVal =  voteTotals.calculated[b.id] ? voteTotals.calculated[b.id] : 0
    return aVal - bVal
  }

  const withinFilter = (card) => {
    if(timeFilter === 'all') return true

    const updatedDate = new Date(card.updated)
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setHours(0, 0, 0, 0)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const startOfLastWeek = new Date(startOfWeek)
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

    if(timeFilter === 'this') {
      return updatedDate >= startOfWeek
    }
    if(timeFilter === 'last') {
      return updatedDate >= startOfLastWeek && updatedDate < startOfWeek
    }
    return true
  }

  const timerSubmitStart = async event => {
    event.preventDefault()
    // split and reverse lets us read seconds if exists, then mm, hh if exists...
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
          <div className="flex gap-2 justify-center items-center">
            <FontAwesomeIcon icon={faStopwatch} />
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
            <input name="duration" type="text" className="text-center bg-transparent font-mono px-1" size={5} defaultValue={"05:00"} />
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
  // Voting was previously disabled once any vote was present in a non-To-Do column.
  // This logic has been turned off by forcing votingDisabled to false.
  // const votingDisabled = cards.some( card => card.col != 0 && voteTotals.calculated[card.id])
  // const votingDisabled = false
  const votingDisabled = false
  
  //   console.log(card, card.col, card.col != 0, card.id, voteTotals, voteTotals.calculated[card.id])

  // } )
  // console.log(votingDisabled)


  const ownsBoard = board.owner_id == psuedonym.id

  return (
    <DndProvider backend={HTML5Backend}>
    <>
      <ReactModal
        isOpen={voteClearModalOpen}
        onRequestClose={() => setVoteClearModalOpen(false)}
      >
        <div className="text-center space-y-12">
          <h2 className="text-2xl">Confirm Board Clear</h2>
          {/* <div>
            <button className="p-2 rounded bg-red-800 text-white font-medium" onClick={votesClearAll}>
            <FontAwesomeIcon icon={faDumpsterFire} /> Clear ALL Votes NOW
            </button>
          </div> */}
          <div>
            <button className="p-2 rounded bg-red-800 text-white font-medium" onClick={cardsClearAll}>
            <FontAwesomeIcon icon={faDumpsterFire} /> Clear ALL Cards NOW
            </button>
          </div>
          <div>
            <button className="p-2 rounded bg-gray-400 text-white font-medium" onClick={() => setVoteClearModalOpen(false)}>
              <FontAwesomeIcon icon={faCancel} /> Cancel
            </button>
          </div>
        </div>
      </ReactModal>
      <div className="p-4 flex flex-col gap-4 h-full">

        {/* <pre>
        {JSON.stringify(board, undefined, 2)}
        {JSON.stringify(cards, undefined, 2)}
        {JSON.stringify(voteTotals, undefined, 2)}
        </pre> */}

        {/* `whitespace-nowrap` in this div class gets me the nowrap effect I want but how to I scroll it? float right likely preventing that */}
        <header className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center">
            <button className="mr-2" onClick={() => setSidebarOpen(true)}>
              <FontAwesomeIcon icon={faBars} />
            </button>
          </div>
          <div className="text-center">
            <form className="inline" onSubmit={boardTitleUpdate}>
              <h1 className="text-2xl font-semibold">
                <Link to="/"><FontAwesomeIcon icon={faCoffee} /></Link> / <input name="title" type="text" defaultValue={board.title} size={board.title.length} className="w-fit inline bg-transparent" />
              </h1>
            </form>
          </div>
          <div className="gap-4">
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <Timer timer={board.timer}/>
              </div>
              <button type="button" className="hidden sm:block px-2 py-1 border rounded" onClick={() => setVoteSort(state => state === 'updated' ? 'votes' : 'updated')}>
                <FontAwesomeIcon icon={faSort} /> Sort: {voteSort}
              </button>
              <div className="font-mono text-gray-500 border rounded px-2 py-1">
                <FontAwesomeIcon icon={faVoteYea} /> {voteTotals.mineTotal}/8
              </div>
            </div>
          </div>

        </header>

        <div className="flex gap-6 flex-1 overflow-hidden h-full">
          {/* <div className="flex-1 overflow-x-auto h-full"> */}
          <div className="flex-1 overflow-auto h-full">
            {/* {JSON.stringify(voteTotals)}
            {JSON.stringify(editing)} */}
            <ul className="flex flex-row gap-x-4 h-full pb-4">
            {columns.map( (column, colIndex) => (
              <li key={colIndex} className="h-full">
                <div className="w-80 h-full flex flex-col">
                  <h2 className="text-xl pb-2">{column}</h2>
                  <DropColumn colIndex={colIndex} onDrop={cardColumnSet}>
                    {colIndex == 0 && ( // only display "New Card" on first column (for now?)
                      <li>
                        {cardNewForm.includes(colIndex) ? (
                          <form onSubmit={cardNewSubmit} className="flex flex-col gap-y-2">
                            <input type="hidden" name="col" value={colIndex} />
                            <textarea autoFocus className="border rounded w-full px-2 py-1" name="text" placeholder="New Card" rows={5} defaultValue={shareText} />
                            <button name="addCardBtn" className="text-center bg-green-500 p-2 text-white font-medium disabled:opacity-25">
                              <FontAwesomeIcon icon={faNoteSticky} /> Add Card
                            </button>
                            <button className="text-center bg-gray-400 p-2 text-white font-medium" onClick={() => cardNewFormToggle(colIndex)} type="button">
                              <FontAwesomeIcon icon={faCancel} /> Cancel
                            </button>
                          </form>
                        ) : (
                          <input onClick={() => cardNewFormToggle(colIndex)} onBlur={() => cardNewFormToggle(colIndex)} autoComplete="off" className="disabled border rounded w-full px-2 py-1" name="text" placeholder="New Card" />
                        )}
                      </li>
                    )}
                    {cards.filter(card => card.col === colIndex && withinFilter(card)).toSorted(cardSortFn).reverse().map( card => (
                    <li key={card.id}>
                      <DraggableCard card={card}>
                        <div className="border rounded p-3 bg-white group">
                          {editing.includes(card.id) ? (
                            <div>
                              <form onSubmit={editSubmit}>
                                <div className="flex flex-col gap-2">
                                  {/* https://primitives.solidjs.community/package/autofocus */}
                                  <input type="hidden" defaultValue={card.id} name="id"/>
                                  <textarea className="py-1 px-2 border rounded" rows={card.content.split('\n').length + 4} defaultValue={card.content} name="content"/> {/* Line 663 */}
                                  {/* <select className="border py-1 px-2">
                                    <option>Columns Choice</option>
                                  </select> */}
                                  {/* <input className="py-1 px-2 bg-green-500 text-white font-medium" type="submit" value="Save" /> */}
                                  <button className="py-1 px-2 bg-green-500 text-white font-medium">
                                    <FontAwesomeIcon icon={faFloppyDisk} /> Save
                                  </button>
                                  <button className="py-1 px-2 bg-gray-400 text-white font-medium" type="button" onClick={() => cardEditToggle(card.id)}>
                                    <FontAwesomeIcon icon={faCancel} /> Cancel
                                  </button>
                                  <button className="mt-6 py-1 px-2 bg-red-800 text-white font-medium" type="button" onClick={() => cardDelete(card.id)}>
                                    <FontAwesomeIcon icon={faTrash} /> Delete
                                  </button>
                                </div>
                              </form>
                            </div>
                          ) : (
                            // https://tailwindcss.com/docs/hover-focus-and-other-states#styling-based-on-parent-state
                            <div className="space-y-1">
                              <div className="text-xs flex flex-row justify-between items-center">
                                <div className="space-x-2">
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
                                {/* <div className="space-x-2 font-mono" title={votingDisabled ? "Voting is disabled after discussion begins" : "Add your votes!"}> */}
                                <div className="space-x-2 font-mono flex flex-row">
                                  <div className="text-center text-xs font-mono">
                                    {"\u2022".repeat(voteTotals.mine[card.id] || 0)}
                                  </div>
                                  <button className="disabled:opacity-25"
                                      disabled={!voteTotals.mine[card.id] || votingDisabled}
                                      onClick={() => voteRemove(card.id, voteTotals.mine[card.id])}>
                                    <FontAwesomeIcon icon={faMinus} />
                                  </button>
                                  <span className="font-bold">
                                    {voteTotals.calculated[card.id] || 0}
                                  </span>
                                  <button disabled={voteTotals.mineTotal >= 8} className="disabled:opacity-25" onClick={() => voteAdd(card.id, voteTotals.mine[card.id])}><FontAwesomeIcon icon={faPlus} /></button>
                                </div>
                              </div>

                              <ReactMarkdown children={card.content} components={components} remarkPlugins={[remarkGfm]} />

                              <div className="flex flex-row justify-between text-xs text-gray-500">
                                <div className="text-left ">
                                  <em>{new Date(card.updated).toLocaleDateString()} {/*{new Date(card.updated).toLocaleTimeString()}*/}</em>
                                </div>
                                <button className={`bg-white rounded ${true && "invisible group-hover:visible"}`} onClick={() => cardEditToggle(card.id)}><FontAwesomeIcon icon={faPencil} /></button>
                              </div>
                            </div>
                          )}
                        </div>
                      </DraggableCard>
                    </li>
                    ))}
                  </DropColumn>
                </div>
              </li>
            ))}
            </ul>
          </div>
        </div>

        {sidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/30 z-10" onClick={() => setSidebarOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-screen sm:w-80 p-4 bg-white z-20 overflow-y-auto flex flex-col gap-3">
              <button className="self-end" onClick={() => setSidebarOpen(false)}>
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <div className="text-center">
                <Timer timer={board.timer}/>
              </div>
              <button type="button" className="px-2 py-1 border rounded" onClick={() => setVoteSort(state => state === 'updated' ? 'votes' : 'updated')}>
                <FontAwesomeIcon icon={faSort} /> Sort: {voteSort}
              </button>
              <select className="px-2 text-center bg-transparent py-1.5 border rounded" value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
                <option value="this">Updated This Week</option>
                <option value="last">Updated Last Week</option>
                <option value="all">All</option>
              </select>
              <button type="button" className="px-2 py-1 border rounded" onClick={votesClearMine}>
                <FontAwesomeIcon icon={faRotateLeft} /> Return My Votes ({voteTotals.mineTotal}/8)
              </button>
              <div className="flex-1" />
              <h2 className="text-red-500 font-bold text-center">Danger Zone</h2>
              <button type="button" className="px-2 py-1 border rounded border-red-500" onClick={votesClearAll}>
                <FontAwesomeIcon icon={faEraser} /> Clear ALL Votes
              </button>
              <button type="button" className="px-2 py-1 border rounded border-red-500 bg-red-200" onClick={() => setVoteClearModalOpen(true)}>
                <FontAwesomeIcon icon={faBomb} /> Clear ALL Cards
              </button>
              <button type="button" className={"px-2 py-1 border rounded disabled:opacity-25"} disabled={ownsBoard}
                title={ownsBoard ? "Can't unpin a board you own"  : "Remove board from my list"}
                onClick={unsubBoard}>
                <FontAwesomeIcon icon={faThumbTack} /> Unpin Board
              </button>
              <div className="text-center">
                <GitHubButton href="https://github.com/bioshazard/coffee/issues" data-size="large" data-show-count="true" aria-label="Issue bioshazard/coffee on GitHub">Issues</GitHubButton>
              </div>
            </div>
          </>
        )}

      </div>
    </>
    </DndProvider>
  )
}
