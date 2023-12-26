const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

app.get('/players/', async (request, response) => {
  const query = `
    SELECT
      *
    FROM
      player_details`
  const res = await db.all(query)
  const ans = res => {
    return {
      playerId: res.player_id,
      playerName: res.player_name,
    }
  }
  response.send(res.map(eachPlayer => ans(eachPlayer)))
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params

  const addQuery = `select * from player_details where player_id=${playerId}`
  const res = await db.get(addQuery)
  const ans = {
    playerId: res.player_id,
    playerName: res.player_name,
  }
  response.send(ans)
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails
  const addQuery = `update   player_details
    set 
    player_name='${playerName}'
    where player_id= ${playerId};`
  await db.run(addQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params

  const addQuery = `select * from match_details where match_id=${matchId}`
  const res = await db.get(addQuery)
  const ans = {
    matchId: res.match_id,
    match: res.match,
    year: res.year,
  }
  response.send(ans)
})

app.get('/players/:playerId/matches/', async (request, response) => {
  const {playerId} = request.params

  const addQuery = `select * from player_match_score natural join match_details where player_id=${playerId}`
  const res = await db.all(addQuery)
  const ans = res => {
    return {
      matchId: res.match_id,
      match: res.match,
      year: res.year,
    }
  }
  response.send(res.map(eachPlayer => ans(eachPlayer)))
})

app.get('/matches/:matchId/players/', async (request, response) => {
  const {matchId} = request.params
  const getMatchPlayersQuery = `
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`

  const res = await db.all(getMatchPlayersQuery)

  response.send(res)
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params

  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `
  const ans = await db.get(getPlayerScored)
  response.send(ans)
})

module.exports = app
