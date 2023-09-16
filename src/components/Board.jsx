import { useParams } from "react-router-dom";
import { Store } from "../hooks/useStore";
import { useContext, useEffect, useState } from "react";
import { supabase } from "../hooks/useSupabase";

export default function Board(props) {
  const { user } = useContext(Store)
  const owner = user // TODO: clean this up
  const { id: boardid } = useParams()
  const [board, setBoard] = useState()
  const [cards, setCards] = useState()
  const [votes, setVotes] = useState()
  const columns = ['Topics', 'Discussing', 'Done'] // type: lean

  useEffect( () => {

    async function getBoard() {
      const { data } = await supabase.from("boards")
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
      .channel('any')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cards', filter: `boardid=eq.${boardid}` }, handleSubChange)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cards', filter: `boardid=eq.${boardid}` }, handleSubChange)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'cards', filter: `boardid=eq.${boardid}` }, handleSubChange)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes', filter: `boardid=eq.${boardid}` }, handleSubChange)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'votes', filter: `boardid=eq.${boardid}` }, handleSubChange)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'votes', filter: `boardid=eq.${boardid}` }, handleSubChange)
      .subscribe()
  
    // TODO: postgres sub
    return () => { allSub.unsubscribe() }
  }, [])

  const cardNewSubmit = async (event) => {
    event.preventDefault()
    const insert = { 
      boardid,
      col: parseInt(event.target.col.value),
      content: event.target.text.value,
    }

    // supabase create card
    const { error } = await supabase
      .from('cards')
      .insert(insert)
    
    // Reset input form
    event.target.reset()
  }

  const cardDelete = async (cardid) => {
    const { error: errorVotes } = await supabase
      .from('votes').delete().eq('cardid', cardid)
    const { error: errorCard } = await supabase
      .from('cards').delete().eq('id', cardid)
  }

  const voteAdd = async (cardid) => {
    const current = votes.mine()
    if(!current) {
      const { data, error } = await supabase
        .from('votes').insert({ boardid, cardid, count: 1, owner })
    } else {
      const { error } = await supabase
        .from('votes').update({ boardid, cardid, count: current + 1, owner })
        .eq('cardid', cardid).eq('owner', owner)
    }
  }

  const voteRemove = async (cardid) => {
    const current = votes.mine()
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

  const [editing, setEditing] = useState([])

  // Toggle by either adding the id if not there, or returning the array without it if present
  const cardEditToggle = (id) => {
    console.log(id)
    console.log(editing)
    setEditing( state => !state.includes(id)
      ? [...state, id] 
      : state.filter(item => item != id) )
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

  if(!board || !cards || !votes) return 'loading...'

  const voteTotals = calculateVotes()

  return (
    <div className="">
      <h2 className="text-2xl">{board.title}</h2>
      {JSON.stringify(voteTotals)}
      {JSON.stringify(editing)}
      <ul className="flex flex-row gap-x-4 overflow-x-scroll">
      {columns.map( (column, index) => (
        <li key={index}>
          <div className="w-64">
            <h2 className="text-xl">{column}</h2>
            <ul className="flex flex-col gap-y-4">
              <li>
                <form onSubmit={cardNewSubmit}>
                  <input type="hidden" name="col" value={index} />
                  <input className="border w-full px-1" name="text" placeholder="New Card" />
                </form>
              </li>
              {cards.filter(card => card.col === index).map( card => (
              <li key={card.id}>
                <div className="border">
                  {editing.includes(card.id) ? (
                    <div>
                      <form onSubmit={editSubmit}>
                        <div className="flex flex-col gap-2">
                          {/* https://primitives.solidjs.community/package/autofocus */}
                          <input type="hidden" defaultValue={card.id} name="id"/>
                          <textarea className="py-1 px-2 border" rows={card.content.split('\n').length + 4} defaultValue={card.content} name="content"/>
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
                    <div>
                      {card.content.split('\n')[0]}
                      <ul>
                        <li>Calc: {voteTotals.calculated[card.id] && (voteTotals.calculated[card.id]).toFixed(2) || 0}</li>
                        <li>Mine: {voteTotals.mine[card.id] && voteTotals.mine[card.id] || 0}</li>
                        <li><button onClick={() => cardEditToggle(card.id)}>Edit</button></li>
                      </ul>
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