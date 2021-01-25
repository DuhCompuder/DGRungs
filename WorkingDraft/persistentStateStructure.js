//////////////////////////////////////////////////////////////////
//     Modularized State Components
//////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////
// 
//      With this type of structure it is easy to export and import into saving multiple games
//      It is also easy for using in high scores or leaderboards hmm..
//
const dataSoloplay = {
    //////////////////////////////////////////////////////////////////
    //     Session State
    //////////////////////////////////////////////////////////////////
    "SESSION_HEADER": { //Session Navigation
        "NAME": "REPLACE_WITH_NAME",
        "TIME:": "REPLACE_WITH_TIME"
    },
    "SESSION_NAV": { //Session Navigation
    },
    "GAME_LEVEL_SET": {
        "LEVEL_ONE": true,
        "LEVEL_TWO": false,
        "LEVEL_THREE": false
    },
    "USER_SESSION_INFO": { //For Solo
        position: 0,
        userStats: {
            hitpoints: 10,
            attack: 1,
            defense: 0
        },
        numberOfMoves: 0,
        stage: 1,
        levelnum: 1,
        levelRung: {
            first: true,
            second: false,
            third: false,
            fourth: false,
        },
        inBattle: false,
        coinPouch: 0,
        equipted: {
            sword: false,
            armor: false,
            shield: false
        },
        inventory: [],
        ongoingBattle: { //BossBattle
            battleSequenceComplete: false,
            opponentStats: null,
            userStats: null
        },
        healingCost: 0
    }
}
const dataMultiplay = {
    SESSION_HEADER: { //Session Navigation
        "NAME": "REPLACE_WITH_NAME",
        "TIME:": "REPLACE_WITH_TIME",
        "NUM_PLAYERS": 2
    },
    SESSION_NAV: { //Session Navigation
    },
    GAME_LEVEL_SET: {
        "LEVEL_ONE": true,
        "LEVEL_TWO": false,
        "LEVEL_THREE": false
    },
    SESSION_INFO: {
        PLAYER_ONE: {
            USER_HEADER: {
                "NAME": "REPLACE_WITH_NAME",
                "ID:": "REPLACE_WITH_ID"
            },
            USER_SESSION_INFO: {
                position: 0,
                userStats: {
                    hitpoints: 10,
                    attack: 1,
                    defense: 0
                },
                numberOfMoves: 0,
                stage: 1,
                levelnum: 1,
                levelRung: {
                    first: true,
                    second: false,
                    third: false,
                    fourth: false,
                },
                inBattle: false,
                coinPouch: 0,
                equipted: {
                    sword: false,
                    armor: false,
                    shield: false
                },
                inventory: [],
                ongoingBattle: { //BossBattle
                    battleSequenceComplete: false,
                    opponentStats: null,
                    userStats: null
                },
                healingCost: 0
            }
        },
        PLAYER_TWO: {
            USER_HEADER: {
                "NAME": "REPLACE_WITH_NAME",
                "ID:": "REPLACE_WITH_ID"
            },
            USER_SESSION_INFO: { 
                position: 0,
                userStats: {
                    hitpoints: 10,
                    attack: 1,
                    defense: 0
                },
                numberOfMoves: 0,
                stage: 0,
                levelRung: {
                    first: true,
                    second: false,
                    third: false,
                    fourth: false,
                },
                inBattle: false,
                coinPouch: 0,
                equipted: {
                    sword: false,
                    armor: false,
                    shield: false
                },
                inventory: [],
                ongoingBattle: { //BossBattle?
                    battleSequenceComplete: false,
                    opponentStats: null,
                    userStats: null //no concluded stats?
                },
                healingCost: 0
            }
        }
    }
}
const dataLeaderboard = {
    
}
const dataTutorial = {
    
}
const dataPremium = {
    
}
const dataPersistenceSolo = {
    
}
const dataPersistenceMulti = {
    
}
const dataPersistenceFinal = {
    
}
module.exports = {
    dataSoloplay,
    dataMultiplay,
    dataLeaderboard,
    dataTutorial,
    dataPremium,
    dataPersistenceSolo,
    dataPersistenceMulti,
    dataPersistenceFinal
}