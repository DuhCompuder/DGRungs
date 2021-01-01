//////////////////////////////////////////////////////////////////
//
//      State Structure
//
//////////////////////////////////////////////////////////////////
const saveState = {
    LEADERBOARD: {
        SOLO_SCORE: {
            MAX: 6,
            LEVEL_ONE: [
                //example
                {
                    Name: "Max",
                    numberOfMoves: 34,
                    //other params
                }
            ], //set max to 6
            LEVEL_TWO: [],
            LEVEL_THREE: []
        },
        MULTIPLAYER_SCORE: {
            MAX: 6, //max list on leaderboard
            LEVEL_ONE: [], //set max to 10
            LEVEL_TWO: [],
            LEVEL_THREE: []
        }
    },
    //////////////////////////////////////////////////////////////////
    //
    //      Permissioned Access Based on Purchase
    //
    //////////////////////////////////////////////////////////////////
    LEVEL_ACCESSABLE: {
        LEVEL_ONE: "true",
        LEVEL_TWO: "false", //purchaseable access
        LEVEL_THREE: "false",
    },
    //////////////////////////////////////////////////////////////////
    //
    //      Page Map and Location within game Lobby Structure
    //
    //////////////////////////////////////////////////////////////////
    UI_MAP: {
        MAIN_LOBBY: "true",
        LEVEL_ONE: "false",
        LEVEL_TWO: "false", //purchaseable access
        LEVEL_THREE: "false",
        TUTORIAL: "false",
        LEADERBOARD: "false",
        BADGES: "false"

    },
    //////////////////////////////////////////////////////////////////
    //
    //      Current Session State *(Contains a Solo and Muliplayer Data)
    //
    //////////////////////////////////////////////////////////////////
    CURRENT_SESSION: {
        //////////////////////////////////////////////////////////////////
        //
        //      Solo Player
        //
        //////////////////////////////////////////////////////////////////
        SOLO: {
            SESSION_HEADER: {
                //Examples of headers
                NameOfSession: "First Playthrough",
                TimeOfSave: "10-23-2020" 
            },
            //////////////////////////////////////////////////////////////////
            //     Session State
            //////////////////////////////////////////////////////////////////
            SESSION_NAV: { //Session Navigation
                GAME_LEVEL_SET: "LEVEL_ONE",
                GAME_SESSION_DETAILS: {
                    STATEMACHINE: {
                        InterfaceLocation: "Lobby",
                        UserStats: {
                            Users: [
                                {
                                    User0: {
                                        Name: "Max"
                                    }
                                },
                                {
                                    User1: {
                                        Name: "Smith"
                                    }
                                }
                            ]
                        }
                    }
                }
            },
            USER_SESSION_INFO: { //For Solo
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
                ongoingBattle: { //BossBattle
                    battleSequenceComplete: false,
                    opponentStats: null,
                    userStats: null
                },
                healingCost: 0
            }
        },
        //////////////////////////////////////////////////////////////////
        //
        //      Muliplayer
        //
        //////////////////////////////////////////////////////////////////
        MUTIPLAYER: {
            SESSION_HEADER: {
                //Examples of headers
                NameOfSession: "First Playthrough",
                TimeOfSave: "10-23-2020" 
            },
            //////////////////////////////////////////////////////////////////
            //     Session State
            //////////////////////////////////////////////////////////////////
            SESSION_NAV: { //Session Navigation
                GAME_LEVEL_SET: "LEVEL_ONE",
                NUM_PLAYERS: 0,
                WHOS_TURN: 0,
                PLAYER_PROFILES: {},  
                GAME_SESSION_DETAILS: {
                    STATEMACHINE: {
                        InterfaceLocation: "Lobby",
                        UserStats: {
                            Users: [
                                {
                                    User0: {
                                        Name: "Max"
                                    }
                                },
                                {
                                    User1: {
                                        Name: "Smith"
                                    }
                                }
                            ]
                        }
                    }
                }
            },
            SELECTED_USER_SESSION_INFO: [ 
                {
                    PLAYER_NAME: "Max",
                    USER_SESSION_INFO: { //For Multi
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
                        ongoingBattle: { //BossBattle
                            battleSequenceComplete: false,
                            opponentStats: null,
                            userStats: null
                        },
                        healingCost: 0
                    }
                }
            ]
        }
    },
    //////////////////////////////////////////////////////////////////
    //
    //      Long Term Database Save State
    //
    //////////////////////////////////////////////////////////////////
    SAVED_SESSIONS: { //Have not identified how to structure this yet.
        /* Most-likely an entire copy of a current session.
            Structure:
                "Name of Save": {
                    //entire CURRENT_SESSION or...
                    CURRENT_SESSION.SOLO
                    CURRENT_SESSION.MULTIPLAYER
                }
         */
    },
}


