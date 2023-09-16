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
  const editSubmit = async (event) => {
    event.preventDefault()
    const cardid = event.target.cardid.value
    const content = event.target.content.value
    const update = { content }
    const { error } = await supabase
      .from('cards').update(update).eq('id', cardid)
    // setEditing(false)
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
    // setVotesCalculate(cardVotes)
    // setVotesMine(myVotes)
    return {
      calculated: cardVotes,
      mine: myVotes
    }
  }

  // const getVotes = async () => {

  //   // Set Votes Data
  //   // NOTE: Probably not useful in raw format...
  //   const { data } = await supabase.from("votes").select().eq('boardid', boardid);
  //   // setVotes(data) // do I even use this??

  //   // # Calculate normalized infiniVote weights

  //   // I asked ChatGPT how to group the vote objects by owner
  //   // Then asked "more concise" until this popped out lol
  //   const groupedByOwner = data.reduce( (result, { owner, ...rest }) => ({ 
  //     ...result,
  //     [owner]: [...(result[owner] || []), rest] 
  //   }), {});

  //   // Per owner, calculate the normalized vote weight to add per card
  //   const myVotes = {}
  //   const cardVotes = {}
  //   for(const ownerIndex in groupedByOwner) {
  //     const ownerVotes = groupedByOwner[ownerIndex]
  //     const total = ownerVotes.reduce( (acc, cur) => acc + cur.count, 0)
  //     ownerVotes.forEach( ownerVote => {
  //       const cardId = ownerVote["cardid"]
  //       // Initialize
  //       if(!cardVotes.hasOwnProperty(cardId)) {
  //         cardVotes[cardId] = 0
  //         myVotes[cardId] = 0
  //     }
  //       cardVotes[cardId] += ownerVote["count"] / total
  //       if(ownerIndex === owner) {
  //         myVotes[cardId] += ownerVote["count"]
  //       }
  //     })
  //   }
  //   setVotesCalculate(cardVotes)
  //   setVotesMine(myVotes)
  // }
  // getVotes()

  if(!board || !cards || !votes) return 'loading...'

  const voteTotals = calculateVotes()

  return (
    <div>
      <h2 className="text-2xl">{board.title}</h2>
      {JSON.stringify(voteTotals)}
      <ul>
      {columns.map( (column, index) => (
        <li key={index}>
          <h2 className="text-xl">{column}</h2>
          <ul>
            <li>
              <form onSubmit={cardNewSubmit}>
                <input type="hidden" name="col" value={index} />
                <input className="border w-full px-1" name="text" placeholder="New Card" />
              </form>
            </li>
            {cards.filter(card => card.col === index).map( card => (
            <li key={card.id}>
              {card.content.split('\n')[0]}
            </li>
            ))}
          </ul>
        </li>
      ))}
      </ul>

    </div>
  )
}