import { Link, useNavigate, useParams } from "react-router-dom";
import { Store } from "../hooks/useStore";
import { useContext, useEffect, useState } from "react";
import { supabase } from "../hooks/useSupabase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowLeft, faArrowRight, faArrowUp, faMinus, faPencil, faPlay, faPlus, faStar } from "@fortawesome/free-solid-svg-icons";
import ReactModal from "react-modal";
// import Timer from "./Timer";

ReactModal.setAppElement('#root');


let ran = false
export default function Board(props) {
  const { profile, boards } = useContext(Store)
  const owner = profile.persistanon // TODO: clean this up

  const { id: boardid } = useParams()
  const navigate = useNavigate()

  async function addToBoardSubs(id) {
    // Prevent double load
    // if(ran) return
    // ran = true

    const result = await supabase.from("board_subs")
      .insert({ boardid: id, profileid: profile.id })
      .select()
    return result
  }

  // Cut early to manage board sub
  const [notice, setNotice] = useState()
  if( ! boards.some( obj => obj.id === boardid ) ) {
    // return (
    //   <div>
    //     <h2>This board is not in your</h2>
    //   </div>
    // )

    // Automatically add this board to the subs...
    // TODO: Auto-reload, probably just need to sub to the board_subs table at the app level to auto-refresh
    // addToBoardSubs(boardid).then( result => {
    //   console.log("ADD BOARD", result)
    //   navigate(0) // reload page
    // })

    const addBoardToList = async () => {
      const newSub = await addToBoardSubs(boardid)
      console.log(newSub)
      if(newSub.data) {
        navigate(0) // reload page
      } else {
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
        .select().eq('id', boardid).single();
      setBoard(data)
    }

    const getCards = async () => {
      const { data } = await supabase.from("cards")
        .select().eq('boardid', boardid);
      setCards(data)
    }
    
    const getVotes = async () => {
      const { data } = await supabase.from("votes")
        .select().eq('boardid', boardid);
      setVotes(data)
    }

    getBoard()
    getCards()
    getVotes()

    const handleSubChange = (change) => {
      // TODO: filter by this board id
      console.log(change)
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
      // .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'boards', filter: `id=eq.${boardid}` }, handleSubChange)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cards', filter: `boardid=eq.${boardid}` }, handleSubChange)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cards', filter: `boardid=eq.${boardid}` }, handleSubChange)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'cards', filter: `boardid=eq.${boardid}` }, handleSubChange)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes', filter: `boardid=eq.${boardid}` }, handleSubChange)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'votes', filter: `boardid=eq.${boardid}` }, handleSubChange)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'votes', filter: `boardid=eq.${boardid}` }, handleSubChange)
      .subscribe()
    
    return () => { allSub.unsubscribe() }
  }, [])

  const cardNewSubmit = async (event) => {
    event.preventDefault()
    const col = parseInt(event.target.col.value)
    const insert = { 
      boardid,
      col,
      content: event.target.text.value,
    }

    // supabase create card
    const { error } = await supabase
      .from('cards')
      .insert(insert)
    
    // Reset input form
    event.target.reset()

    // Re-focus textarea
    event.target.text.focus()
  }

  const cardDelete = async (cardid) => {
    const { error: errorVotes } = await supabase
      .from('votes').delete().eq('cardid', cardid)
    const { error: errorCard } = await supabase
      .from('cards').delete().eq('id', cardid)
  }

  const voteAdd = async (cardid, current) => {
    if(!current) {
      const { data, error } = await supabase
        .from('votes').insert({ boardid, cardid, count: 1, owner })
    } else {
      const { error } = await supabase
        .from('votes').update({ boardid, cardid, count: current + 1, owner })
        .eq('cardid', cardid).eq('owner', owner)
    }
  }

  const voteRemove = async (cardid, current) => {
    if(!current) {
      console.error("No votes to remove! How did you even trigger this?!")
    } else if(current === 1) {
      const { data, error } = await supabase
        .from('votes').delete().eq('cardid', cardid).eq('owner', owner)
    } else if(current > 1) {
      const { error } = await supabase
        .from('votes').update({ boardid, cardid, count: current - 1, owner })
        .eq('cardid', cardid).eq('owner', owner)
    }
  }

  const [voteClearModalOpen, setVoteClearModalOpen] = useState(false)

  const votesClearAll = async () => {
    const { error } = await supabase.from('votes')
      .delete().eq('boardid', boardid)
    setVoteClearModalOpen(false)
  }
  const votesClearMine = async () => {
    const { error } = await supabase.from('votes')
      .delete().eq('boardid', boardid).eq('owner', owner)
  }





  const cardColumnSet = async (cardid, col) => {
    const { error } = await supabase.from('cards').update({col}).eq('id', cardid)
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
    const cardid = event.target.id.value
    const content = event.target.content.value
    const update = { content }
    const { error } = await supabase
      .from('cards').update(update).eq('id', cardid)
    cardEditToggle(cardid)
  }

  

  const calculateVotes = () => {
    
    // TODO: Account for pending load?
    // if(!votes) return [[], []]

    // I asked ChatGPT how to group the vote objects by owner
    // Then asked "more concise" until this popped out lol
    const groupedByOwner = votes.reduce( (result, { owner, ...rest }) => ({ 
      ...result,
      [owner]: [...(result[owner] || []), rest] 
    }), {});

    // Per owner, calculate the normalized vote weight to add per card
    const myVotes = {}
    const cardVotes = {}
    for(const ownerIndex in groupedByOwner) {
      const ownerVotes = groupedByOwner[ownerIndex]
      const total = ownerVotes.reduce( (acc, cur) => acc + cur.count, 0)
      ownerVotes.forEach( ownerVote => {
        const cardId = ownerVote["cardid"]
        // Initialize
        if(!cardVotes.hasOwnProperty(cardId)) {
          cardVotes[cardId] = 0
          myVotes[cardId] = 0
      }
        cardVotes[cardId] += ownerVote["count"] / total
        if(ownerIndex === owner) {
          myVotes[cardId] += ownerVote["count"]
        }
      })
    }
    return {
      calculated: cardVotes,
      mine: myVotes
    }
  }

  // Define custom components for ReactMarkdown
  const components = {
    // Map HTML tags to custom React components with Tailwind CSS classes
    p: ({ children }) => <p className="pb-2">{children}</p>,
    h1: ({ children }) => <h1 className="text-3xl font-bold my-4">{children}</h1>,
    h2: ({ children }) => <h2 className="text-2xl font-bold my-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-bold my-2">{children}</h3>,
    h4: ({ children }) => <h4 className="text-lg font-bold my-2">{children}</h4>,
    h5: ({ children }) => <h5 className="text-base font-bold my-2">{children}</h5>,
    h6: ({ children }) => <h6 className="text-sm font-bold my-2">{children}</h6>,
    ul: ({ children }) => <ul className="list-disc ml-6 mb-4">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal ml-6 mb-4">{children}</ol>,
    li: ({ children }) => <li className="mb-2">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-400 pl-4 italic my-4">{children}</blockquote>
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
      .eq('boardid', boardid)
      .eq('profileid', profile.id)
    navigate(0) // reload page
  }

  if(!board || !cards || !votes) {
    return (
      <div className="text-center pt-32">Loading board...</div>
    )
  }

  const voteTotals = calculateVotes()

  // const timerSet = (event) => {
  //   // console.log(event.target.newtime.value)
  // }
  // const timerProps = {
  //   timerEnd: board.timerend,
  //   // timerSet
  // }

  const cardSortFn = (a, b) => {
    if(voteSort === "created") {
      return new Date(a.created).getTime() - new Date(b.created).getTime()
    }

    // else sort by vote calculation
    return voteTotals.calculated[b.id] - voteTotals.calculated[a.id]
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
      .update({ timer }).eq('id', boardid).select().single()
    
    // console.log(data)
    
    // console.log([ss, mm, hh])
    // const durationSeconds = ss ? parseInt(ss) : 0 + mm ? parseInt(mm)*60 : 0 + hh ? parseInt(hh)*60*60 : 0
    // console.log(ss ? ss : 0)
    // console.log(mm ? mm : 0)
    // console.log(hh ? hh : 0)
    console.log(durationSeconds)
  }

  const Timer = (props) => {

    const [remainingSeconds, setRemainingSeconds] = useState(-1)

    // // Manage realtime timer progression
    // useEffect( () => {

    //   const timerInterval = setInterval( () => {
    //     clearInterval(timerInterval)
    //   }, 1000)

    //   return () => clearInterval(timerInterval)
    // }, [board])

    return (
      <div>
        {props.timer}
        {remainingSeconds > 0 ? (
          <div>{remainingSeconds}</div>
        ) : (
          <form onSubmit={timerSubmitStart}>
            <input name="duration" type="text" className="text-center font-mono px-1" size={5} defaultValue={"5:00"} />
            <button><FontAwesomeIcon icon={faPlay} /></button>
          </form>
        )}
      </div>
    )
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
      {JSON.stringify(board)}
      <div>
        <div className="float-right flex space-x-4 pb-2">
          <div className="px-2 border">
            {/* <span className="font-mono px-1">5:00</span>
            <FontAwesomeIcon icon={faPlay} /> */}
            {/* <Timer {...timerProps} /> */}
            <Timer timer={board.timer}/>
          </div>
          <button className="px-2 border" onClick={() => setVoteSort(state => state === "created" ? 'votes' : 'created')}>Sort: {voteSort}</button>
          <button className="px-2 border" onClick={votesClearMine}>Clear My Votes</button>
          <button className="px-2 border" onClick={() => setVoteClearModalOpen(true)}>Clear All Votes</button>
        </div>
        <h1 className='text-2xl'>
          <Link to="/">☕</Link> / {board.title} <button title="Unsubscribe from board" onClick={unsubBoard}><FontAwesomeIcon className="text-yellow-400" icon={faStar} /></button>
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
                    <input className="text-center bg-green-500 p-2 rounded text-white font-medium" type="submit" value="Add Card" />
                    <button className="text-center bg-red-500 p-2 rounded text-white font-medium" onClick={() => cardNewFormToggle(colIndex)} type="button">Cancel</button>
                  </form>
                ) : (
                  <input onClick={() => cardNewFormToggle(colIndex)} onBlur={() => cardNewFormToggle(colIndex)} autoComplete="off" className="disabled border w-full px-1" name="text" placeholder="New Card" />
                )}
                {/* {JSON.stringify(cardNewForm)} */}

              </li>
              {cards.filter(card => card.col === colIndex).toSorted(cardSortFn).map( card => (
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
                              disabled={!voteTotals.mine[card.id]} 
                              onClick={() => voteRemove(card.id, voteTotals.mine[card.id])}>
                            <FontAwesomeIcon icon={faMinus} />
                          </button>
                          <span className="bg-gray-300 px-1 rounded">{voteTotals.mine[card.id] && voteTotals.mine[card.id] || 0}</span>
                          <button onClick={() => voteAdd(card.id, voteTotals.mine[card.id])}><FontAwesomeIcon icon={faPlus} /></button>
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