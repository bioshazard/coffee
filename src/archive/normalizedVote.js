// Archived normalized voting algorithm

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
