/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const AWS = require('aws-sdk');
const PROMPT = require('./speakUtil');
const COMBAT = require('./combatUtil');
const GAME = require('./gameModUtil');
////////////////////////////////////////////////////////////////////////////////
//
//      Import State
//
////////////////////////////////////////////////////////////////////////////////
const STATE = require('./persistenceStateStructure');
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');
const debug = true; 
// debug?console.log();

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        const speakOutput = 'Welcome, welcome to dungeon rungs? Where do you want to go? Solo Play, Muliplayer, Leaderboard or Premium?';
        await loadFromPersistance(handlerInput);
        fetchSessionAttributes(handlerInput); //change to final sessions structure
        setLobbyState("Lobby", handlerInput);
        console.log("first correct")
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const ReturnToLobbyHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Main_ReturnToLobbyIntent'; //create the intent in console
    },
    handle(handlerInput) {
        const speakOutput = 'Are you sure you want to leave and return to the lobby?';
        //Modify the yes handler to handle this scenario
        //If yes, response is "Ok, taking you back to the lobby"
        // resolve setLobbyState("Lobby", handlerInput); on a "yes handled"
        yesNoModifiers.returnToLobby = true;
        // remove after installing yes handler:
        // setLobbyState("Lobby", handlerInput); // remove after yes handler
        fetchSessionAttributes(handlerInput); //change to final sessions structure
        
        //Saves what ever session the current user is in now.
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const StartNewGameHandler = {
    canHandle(handlerInput) {
        const canUse = fetchSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Main_ReturnToLobbyIntent' 
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true);
    },
    handle(handlerInput) {
        const speakOutput = 'Are you sure you want start a new game? Your old unsaved data will be overwritten.';
        //Modify the yes handler to handle this scenario
        //If yes, response is "Ok, taking you back to the lobby"
        // resolve setLobbyState("Lobby", handlerInput); on a "yes handled"
        yesNoModifiers.startNewGame = true;
        // remove after installing yes handler:
        // setLobbyState("Lobby", handlerInput); // remove after yes handler
        fetchSessionAttributes(handlerInput); //change to final sessions structure
        
        //Saves what ever session the current user is in now.
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/////////////////////////////////////////////////////////////////////////////////
//                                                                             //
//      Main VUI Setters (5: Solo, Multi, Leaderboard, Premium, Tutorial)      //
//                                                                             //
/////////////////////////////////////////////////////////////////////////////////
// Does not persist, only active in session attributes
const stateVUI = {
    "Lobby": true,
    "Soloplay": false,
    "Multiplay": false,
    "Leaderboard": false,
    "Premium": false,
    "Tutorial": false
};
// This attribute needs to be true whenever user want to leave a session to return to lobby.
// If User wants to access any of the other VUI states, a prompt will be asked to them if they are
// sure to exit the current VUI state an return to the lobby. (Test if needed at all or not)
const yesNoModifiers = {
    returnToLobby: false,
    startNewGame: false
}
/////////////////////////////////////////////////////////////////////////////////////////
// 
//   VUI State Functions:
//
//      - Makes sure only one of the stateLobby Variable is set to true for 
//        double checking and making sure there are no bugs.
//      - Passes one state to be true and set others all false.
//
function setLobbyState(lobbyState, handlerInput) {
    // uncomment for debugging
    console.log(`Lobbystate is: ${lobbyState}.`, `Initial StateVUI: ${JSON.stringify(stateVUI)}`);
    stateVUI[lobbyState] = true;
    for (const state in stateVUI) {
        if(state !== lobbyState){
            stateVUI[state] = false;
        }
    }
    //save state
    saveSessionAttributes(handlerInput);
    // uncomment for debugging
    debug?console.log(`Final StateVUI: ${JSON.stringify(stateVUI)}`):debug;
}
// internal handler save state modifier --read
function readGameState(handlerInput, sessionAttributes) {
    //Checks stateVUI
    //Switches to set State Navigators and Data
    //Returns the game state
}
// internal handler save state modifier --write
function writeGameState(handlerInput, sessionAttributes) {
    //Checks stateVUI
    //Modify save sate
    //save partial game state to whole game state
    //Returns the game state?
}
function switchGameStateNavigationLocale() {
    //Switches to set State Navigators and Data
    //Returns partial game state
}
// // create session attributes
// function newSessionAttributes(handlerInput, newSessionAttributes){
//     const { attributesManager } = handlerInput;
//     let sessionAttributes = attributesManager.getSessionAttributes() || {};
//     sessionAttributes = newSessionAttributes;
// }
// load session attributes
async function loadSessionAttributes(handlerInput){
    const { attributesManager } = handlerInput;
    const sessionAttributes = await attributesManager.getSessionAttributes() || {};
    //let game = in_progress.hasOwnProperty('gameInfo'); //Modify for complex structure
    attributesManager.setSessionAttributes(sessionAttributes);
    return sessionAttributes;
}
//***************************************************************
//      SAVE SESSION STRUCTURE (IMPORTANT)
//***************************************************************
// save session attributes --- //only if saved structure exists already //--arguement priority based on write frequency
function saveSessionAttributes(handlerInput, _userInfo, _sessionNav, _gameLevelSet, _sessionHeader){ 
    console.log("saveSessionAttributes testing"); //debugger
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes() || {};
    sessionAttributes.GAMENAV = stateVUI;
    sessionAttributes.SOLO_PLAY = STATE.dataSoloplay; //starting new session
    _sessionHeader?sessionAttributes.SOLO_PLAY.SESSION_HEADER = _sessionHeader:_sessionHeader;
    // { //Session Navigation
    //     "NAME": "REPLACE_WITH_NAME",
    //     "TIME:": "REPLACE_WITH_TIME"
    // },
    _sessionNav?sessionAttributes.SOLO_PLAY.SESSION_NAV = _sessionNav:_sessionNav;
    // { //Session Navigation
    // },
    _gameLevelSet?sessionAttributes.SOLO_PLAY.GAME_LEVEL_SET = _gameLevelSet:_gameLevelSet;
    // {
    //     "LEVEL_ONE": true,
    //     "LEVEL_TWO": false,
    //     "LEVEL_THREE": false
    // },
    _userInfo?sessionAttributes.SOLO_PLAY.USER_SESSION_INFO = _userInfo:_userInfo;
    attributesManager.setSessionAttributes(sessionAttributes);
    saveToPersistance(handlerInput,sessionAttributes);
}
// Load persistence attributes --- function must call on await
function loadFromPersistance(handlerInput){
    const { attributesManager } = handlerInput;
    let inProgress = attributesManager.getPersistentAttributes() || {}; 
    return inProgress;
}
// Save persistence attributes --- function must call on await
function saveToPersistance(handlerInput, saveAttributes){
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes() || {};
    attributesManager.setPersistentAttributes(saveAttributes);
    attributesManager.savePersistentAttributes();
}
function fetchSessionAttributes(handlerInput){ 
    //console.log("fetchSessionAttributes testing"); //debugger

    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes() || {};
    //uncomment to renew saved Session Attributes
    if (sessionAttributes.NEWSESSION === false) {
        // console.log("session attributes NEWSESSION is false ");//debugger
        // console.log("load old: ",JSON.stringify(sessionAttributes)); //debugger
        return sessionAttributes;
    }
    console.log("session attributes NEWSESSION is true ")
    sessionAttributes.NEWSESSION = false;
    sessionAttributes.GAMENAV = stateVUI;
    sessionAttributes.SOLO_PLAY = STATE.dataSoloplay;

    //debug ? console.log("load new: ",JSON.stringify(sessionAttributes)): debug; //debugger
    return sessionAttributes;
}

//////////////////////////////////////////////////////////////////////////////////////////
//  Tasks: 
//      - Set a state attribute that identifies location as Lobby in order to user these
//      - Modify to set stateVUI object using setLobbyState() function
//
const SoloPlayIntentHandler = {
    canHandle(handlerInput) {
        const canUse = fetchSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Main_PlaySolo'
            && canUse.GAMENAV["Lobby"] === true;
    },
    handle(handlerInput) {
        const speakOutput = 'You are playing solo player mode, you dont have a game going so starting new game.';
        //take user to solo play navigators
        //Set state to play solo in attributes
        setLobbyState("Soloplay", handlerInput);
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};

const MultiPlayIntentHandler = {
    canHandle(handlerInput) {
        const canUse = fetchSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Main_PlayMulti'
            && canUse.GAMENAV["Lobby"] === true;
    },
    handle(handlerInput) {
        const speakOutput = 'You are playing multiplayer mode, you dont have a game going so starting new game.';
        //Set state to play solo in attributes
        setLobbyState("Multiplay", handlerInput)

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};

const LeaderboardIntentHandler = {
    canHandle(handlerInput) {
        const canUse = fetchSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Main_Leaderboard'
            && canUse.GAMENAV["Lobby"] === true;
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome to the Leaderboards. You can check out your high scores here.';
        //Set state to play solo in attributes
        setLobbyState("Leaderboard", handlerInput)

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};

const PremiumIntentHandler = {
    canHandle(handlerInput) {
        const canUse = fetchSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Main_Premium'
            && canUse.GAMENAV["Lobby"] === true;
    },
    handle(handlerInput) {
        const speakOutput = 'This is the premium area. Check out what premium purchases you can add to your account.';
        //Set state to play solo in attributes
        setLobbyState("Premium", handlerInput)

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};

const TutorialIntentHandler = {
    canHandle(handlerInput) {
        const canUse = fetchSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Main_Tutorial'
            && canUse.GAMENAV["Lobby"] === true;
    },
    handle(handlerInput) {
        const speakOutput = 'Here we are going to take you through a tutorial of the game. Solo or Multiplayer?';
        //Set state to play solo in attributes
        setLobbyState("Tutorial", handlerInput)

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};


///////////////////////////////////////////////////////////
//                                      //
//      Solo Play VUI Navigators        //
//                                      //
///////////////////////////////////////////////////////////
//
//      Users access available stages in game //if completed level one
const NavigateSoloPlayIntentHandler = {
    canHandle(handlerInput) {
        const canUse = fetchSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Main_PlaySolo'
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true);
    },
    handle(handlerInput) {
        const speakOutput = 'Hello World!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};

///////////////////////////////////////////////////////////
//                                      //
//      Multi Play VUI Navigators       //
//                                      //
///////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////
//                                      //
//      Leaderboard VUI Navigators      //
//                                      //
///////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////
//                                      //
//      Premium VUI Navigators          //
//                                      //
///////////////////////////////////////////////////////////

// Import Random ask upsale functions //

// Create Check Purchased function

///////////////////////////////////////////////////////////
//                                      //
//      Tutorial VUI Navigators         //
//                                      //
///////////////////////////////////////////////////////////


//////////////////
//// Template ////
//////////////////
const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello World!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};

/////////////////////////////////////////////////////////////////////////////////
//                                                                             //
//      Moveset Navigators 
            // 1 MoveTurnIntentHandler,
            // 2 AttackTurnIntentHandler,
            // 3 BlockAttackIntentHandler,
            // 4 EscapeBattleIntentHandler,
            // 5 HealIntentHandler
//                                                                             //
/////////////////////////////////////////////////////////////////////////////////

const MoveTurnIntentHandler = {
    canHandle(handlerInput) {
        const canUse = fetchSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Turn_MoveIntent'
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true);
    },
    async handle(handlerInput) {
        let speakOutput = 'Move Turn!';
        let returnMode = 'SOLO_PLAY'; //get Solo play or Multiplay to update session[returnMode] data i.e. SOLO_PLAY etc.
        console.log("Inside move handler") //debug
        let session = fetchSessionAttributes(handlerInput);
        console.log("session resolves with: ");
        console.log(session)
        let moveCount = GAME.dice();
        console.log("Move count is: ")
        console.log(moveCount)
        //add moveCount to user position
        console.log("user position is: ")
        console.log(session[returnMode].USER_SESSION_INFO.position);
        session[returnMode].USER_SESSION_INFO.position += moveCount; //update move function?
        console.log("updated session with move count to position: ")
        console.log(session);
        //tell user of roll and move in position
        speakOutput = `You rolled a ${moveCount}.`; //add sound effect?
        //increase number of total moves by player
        session[returnMode].USER_SESSION_INFO.numberOfMoves++;
        console.log("USER_SESSION_INFO: ", session[returnMode].USER_SESSION_INFO.numberOfMoves) //debug
        //check status of user position on whether up a rung or below a rung (if finished the game call the return function)
        const onRung = GAME.checkRungOn(session[returnMode].USER_SESSION_INFO.position);
        console.log("onRung: ", onRung)
            //check the level of difficulty in rung and execute continuation
            //initiate Encounter function to determine battle or no battle
        const mobPickStatus = COMBAT.actOnPosition(onRung, 'stage1'); //actOnPosition(rung, stage) //modify stage to variable
        console.log("mobPickStatus: ", mobPickStatus) //debug
        //save to sessionAttributes
        //save to persistence? //already set to regular save
        if (mobPickStatus.name === "Clear Path") {
            console.log("mobPickStatus resolved with clear path") //debug
            //Change the speak outputs into variables in /speakUtil.js
            speakOutput = 'You encountered a clear path to move forward. What do you like to do next?!';
        } else {
            console.log("mobPickStatus resolved with a mob") //debug
            //function to update in combat details should session close in midbattle?
            session[returnMode].USER_SESSION_INFO.inbattle = true;
            session[returnMode].USER_SESSION_INFO.ongoingBattle.opponentStats = mobPickStatus.encounterDetails;
            speakOutput = mobPickStatus.speakOutput; //`You encountered a ${mobPickStatus.name}. How do you want to engage in this battle?`;
        }
        
        saveSessionAttributes(handlerInput, session[returnMode].USER_SESSION_INFO);
        
        //if inside a battle set user to inside an ongoing battle and cannot get out until battle is complete

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};

const AttackTurnIntentHandler = {
    canHandle(handlerInput) {
        const canUse = fetchSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Turn_AttackIntent'
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true);
    },
    handle(handlerInput) {
        let speakOutput = 'Attack Turn!';
        //*Retrieve sessionAttributes data
        let returnMode = 'SOLO_PLAY';
        let session = fetchSessionAttributes(handlerInput);
        //*Tell player they are not in a battle if they are not and to ask them what do they want to do next
        if (session[returnMode].USER_SESSION_INFO.inbattle === false) {
            speakOutput = 'You cannot use the attack move while not in a battle.';
            return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
        }
        //*If in a battle, begin attack squence:
        //*Bring up stats of user and opponent
        let opponentStats = session[returnMode].USER_SESSION_INFO.ongoingBattle.opponentStats;
        //*use updated equipment details and stats to determine next choice of attack
            //use a function to determin this
        //*Having a sword, shield or armor changes attack vectors
        //*Roll dice for attack
        //*Calculate Damage results against enemy
        //*Report result
            //function determine response by equipment attack 
            //update health
            //*If opponent is still alive, it can attack back
            //*If opponent is dead, collect loot and prompt for next move
        //*Calculate Damage results from enemy attack
        //*Report result
            //function determine response by equipment defense
            //update health
            //*If user still alive, prompt for next move
            //*If user dead, reset health and user position refected on level
                //create function to update position based on knockback
                
        //*Save sessionAttributes after final changes to state

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};

const BlockAttackIntentHandler = {
    canHandle(handlerInput) {
        const canUse = fetchSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Turn_BlockIntent'
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true);
    },
    handle(handlerInput) {
        const speakOutput = 'Block Turn!';
        //*Retrieve sessionAttributes data
        //*Tell player they are not in a battle if they are not and to ask them what do they want to do next
        //*If in a battle, begin defense squence:
        //*Bring up stats of user and opponent
        //*use updated equipment details and stats to determine next choice of defense types
            //use a function to determine this
        //*Having a sword, shield or armor changes defense vectors
        //*Roll dice for defense?
        //*Calculate Damage results from enemy attack
        //*Report result
            //function determine response by equipment defense
            //update health
            //*If still alive, prompt for next move
            //*If dead, reset health and user position reflected on level
                //create function to update position based on knockback
        //*Calculate Damage results from counter attack
        //*Create complex counter acttack function mechanism
        //*Report result
            //function determine response by equipment defense
            //update health
            //*If enemy still alive, prompt for next move
            //*If enemy dead, collect loot and prompt for next move
            
        //*Save sessionAttributes after final changes to state

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};

const EscapeTurnIntentHandler = {
    canHandle(handlerInput) {
        const canUse = fetchSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Turn_EscapeIntent'
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true);
    },
    handle(handlerInput) {
        const speakOutput = 'Escape Turn!';
        //*Retrieve sessionAttributes data
        //*Tell player they are not in a battle if they are not and to ask them what do they want to do next
            //Explain fleeing counts as a turn but they are not in a battle?
        //*If in a battle, begin escape squence:
        //*Bring up stats of user and opponent
        
        //*use updated equipment details and stats to determine next choice of defense types
            //use a function to determine this
        //*Having special items boost escape stats
        
        //*Determine possiblility of enemy preventing escape
            //If not enemy attacks
        //*No possiblility of counter attacks
            //*Calculate Damage results from enemy attack
            //*Report result
                //function determine response by equipment defense
                //update health
                //*If still alive, prompt for next move
                //*If dead, reset health and user position reflected on level
                    //create function to update position based on knockback
        
        //*Explain fleeing counts as a turn and ask to confirm
        //*If yes - count add to turn
            //*Roll dice to determine flee back distance
        //*If no ask what user what to do next against enemy in current battle session
            
        //*Save sessionAttributes after final changes to state
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};


const HealIntentHandler = {
    canHandle(handlerInput) {
        const canUse = fetchSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Turn_HealIntent'
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true);
    },
    handle(handlerInput) {
        const speakOutput = 'Heal Turn!';
        
        //*Retrieve sessionAttributes data
        //*Tell player they are not in a battle if they are not and to ask them what do they want to do next
            //Explain healing counts as a turn but they are not in a battle?
        //*If in a battle, begin heal squence:
        //*Bring up stats of user and opponent
        
        //Report heal cost to user and acknowledgement that it counts as a turn and current coin cost for healing as a yes or no response
        //*If yes - count add to turn and update coins in wallet
            //if not sufficient coins, report it and ask what to do next in battle sequence since can't heal
            //*call on heal function to heal and increase cost of healing
                //heal can only up to max health
        //*If no ask what user what to do next against enemy in current battle session
        
        //***In old heal handler, user cannot heal during combat...
            //Updated: healing cost less coins out of combat / healing cost more in combat and does not count as a turn?...yes... might be better for strategizing
                //however, cost of healing needs to have a muliple in this case to determine heal count and price
                    //Heal count as a base measure
                    //Heal outside/inside battle adds 1 to heal count
                    //Heal cost outside battle = base heal cost + heal count
                    //Heal cost inside battle =  base heal cost + 2 times (heal count)
            
        //*Save sessionAttributes after final changes to state

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};

/////////////////////////////////////////////////////////////////////////////////
//                                                                             //
//      Game Utility Handlers
            // 1 EquipItemIntentHandler,
            // 2 RequestPositionIntentHandler,
            // 3 CheckCoinsIntentHandler,
            // 4 CheckInventoryIntentHandler,
            // 5 CheckHealthIntentHandler,
            // 6 CheckScoreIntentHandler, //---------Use only to check current scoreboard
            // InitiateEncounterHandler, //--------don't think I am using this
            // InBattleMoveTurnIntentHandler, //--------don't think I am using this either
            
//                                                                             //
/////////////////////////////////////////////////////////////////////////////////

const EquipItemIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Util_EquipItemIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Equip Item!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};

const RequestPositionIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Util_RequestPositionIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Request Position!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};

const CheckCoinsIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Util_CheckCoinsIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Check Coins!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};

const CheckInventoryIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Util_CheckInventoryIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Check Inventory!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};

const CheckHealthIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Util_CheckHealthIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Check Health!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};

const CheckScoreIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Util_CheckScoreIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Check Score!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};


///////////////////////////////////////////////////////////
//                                              //
//      Complex Yes/No Handlers                 //
//                                              //
///////////////////////////////////////////////////////////

/// Build Yes and No intents for several scenarios

const YesIntent_ReturnLobbyHandler = {
    canHandle(handlerInput) {
        const canUse = fetchSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent'
            && canUse.GAMENAV["Lobby"] === false
            && yesNoModifiers.returnToLobby === true;
    },
    handle(handlerInput) {
        setLobbyState("Lobby", handlerInput);
        let speakOutput = "Ok, taking you back to the lobby";
        yesNoModifiers.returnToLobby = false;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(PROMPT.LOBBYSPEAK)
            .getResponse();
    }
};

const NoIntent_ReturnLobbyHandler = {
    canHandle(handlerInput) {
        const canUse = fetchSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent'
            && canUse.GAMENAV["Lobby"] === false
            && yesNoModifiers.returnToLobby === true;
    },
    handle(handlerInput) {
        let speakOutput = "OK, please say continue";
        const state = Object.keys(stateVUI);
        const active = state.filter(function(id) {
            return stateVUI[id]
        })
        // Three options for switch statements
        // 1) Speak response to continue current vui state
        // 2) Redirect to continue handler for current vui state
        // 3) Speak response to similar first accessing current vui state
        switch (active[0]) {
            case "Lobby":
                speakOutput = "OK, please say continue";
                break;
            case "Soloplay":
                speakOutput = "OK, please say continue game"; 
                break;
            case "Multiplay":
                speakOutput = "OK, please say continue game";
                break;
            case "Leaderboard":
                speakOutput = "OK, please say continue";
                break;
            case "Tutorial":
                speakOutput = "OK, please say continue";
                break;
        }
        yesNoModifiers.returnToLobby = false;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("Say continue.")
            .getResponse();
    }
};
//START NEW GAME
const YesIntent_StartNewGameHandler = {
    canHandle(handlerInput) {
        const canUse = fetchSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent'
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true)
            && yesNoModifiers.startNewGame === true;
    },
    handle(handlerInput) {
        //startDefault for game
        //KeepLobbyState the same depending on either solo or Multiplay
        //switch scenario for solo vs Multiplay
        const state = Object.keys(stateVUI);
        const active = state.filter(function(id) {
            return stateVUI[id]
        })
        switch (active[0]) {
            case "Soloplay":
                speakOutput = "OK, starting a new single player gaming.";
                // if(LEVEL_TWO === "AVAILABLE"){
                //     speakOutput += ` Which level do you want to play in ${availableLevels}`;
                //     //return responseBuilder to Soloplay sessionNav Handler
                // } else {
                //     speakOutput += ` Welcome to stage one`;
                //     //return responseBuilder to Soloplay sessionNav Handler
                // }
                //ask for which stage if there are multiple stages
                //saveSessionAttributes(handlerInput, _userInfo, _sessionNav, _gameLevelSet, _sessionHeader)
                let defaultStart = GAME.startDefault();
                saveSessionAttributes(handlerInput, defaultStart) //refresh sessionNav to beggining
                break;
            case "Multiplay":
                speakOutput = "OK, starting a new Multiplayer game.";
                break;
        }
        let speakOutput = "Ok, startNewGame";
        yesNoModifiers.startNewGame = false;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(PROMPT.LOBBYSPEAK)
            .getResponse();
    }
};
// Consider a unversal No handler
const NoIntent_StartNewGameHandler = {
    canHandle(handlerInput) {
        const canUse = fetchSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent'
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true)
            && yesNoModifiers.startNewGame === true;
    },
    handle(handlerInput) {
        let speakOutput = "OK, please say continue";
        const state = Object.keys(stateVUI);
        const active = state.filter(function(id) {
            return stateVUI[id]
        })
        // Three options for switch statements
        // 1) Speak response to continue current vui state
        // 2) Redirect to continue handler for current vui state
        // 3) Speak response to similar first accessing current vui state
        switch (active[0]) {
            case "Lobby":
                speakOutput = "OK, please say continue";
                break;
            case "Soloplay":
                speakOutput = "OK, please say continue game"; 
                break;
            case "Multiplay":
                speakOutput = "OK, please say continue game";
                break;
            case "Leaderboard":
                speakOutput = "OK, please say continue";
                break;
            case "Tutorial":
                speakOutput = "OK, please say continue";
                break;
        }
        yesNoModifiers.startNewGame = false;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("Say continue.")
            .getResponse();
    }
};

// const HasCactusYesIntentHandler = {
//     canHandle(handlerInput) {
//         return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
//             && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent'
//             && getProfile(handlerInput).cactus;
//     },
//     handle(handlerInput) {
//         handlerInput.responseBuilder.speak('You already have a cactus.')
//         if(isHTMLCapableFireTV(handlerInput)) {
//             return handlerInput.responseBuilder.getResponse();
//         }

//         return handlerInput.responseBuilder
//             .reprompt('You already have a cactus.')
//             .getResponse();
//     }
// };

// const YesIntentHandler = {
//     canHandle(handlerInput) {
//         return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' 
//             && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent';
//     },
//     handle(handlerInput) {
//         return LaunchRequestHandler.handle(handlerInput);
//     }
// };


// const DeadCactusNoIntentHandler = {
//     canHandle(handlerInput) {
//         return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
//             && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent'
//             && !getProfile(handlerInput).cactus;
//     },
//     handle(handlerInput) {
//         let speakOutput = "Ok. I'll give you time to grieve. I have lots "; 
//         speakOutput += "more cacti in need of homes when you decide you're "; 
//         speakOutput += "ready to try again. Goodbye";

//         return handlerInput.responseBuilder
//             .speak(speakOutput)
//             .getResponse();
//     }
// };

// // TODO: Ask Alison for a better response.
// const HasCactusNoIntentHandler = {
//     canHandle(handlerInput) {
//         return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
//             && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent'
//             && getProfile(handlerInput).cactus;
//     },
//     handle(handlerInput) {
//         handlerInput.responseBuilder.speak("You already have a cactus that's alive and well. You water the water the cactus, or open and close the blinds. Which will it be?")
            
//         if(isHTMLCapableFireTV(handlerInput)) {
//             return handlerInput.responseBuilder.getResponse();
//         }

//         return handlerInput.responseBuilder
//             .reprompt("You already have a cactus that's alive and well. You water the water the cactus, or open and close the blinds. Which will it be?")
//             .getResponse();
//     }
// };

///////////////////////////////////////////////////////////
//                                      //
//      Default Handlers                //
//                                      //
///////////////////////////////////////////////////////////

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        console.log("In FallbackIntentHandler")
        let speakOutput;
        let intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        //All handler names
        switch(intentName) {
            //Main VUI state intents
            case "Main_PlaySolo":
            speakOutput = 'Please return to the main lobby before accessing Single Player. Just say return to the lobby.';
                break;
            case "Main_PlayMulti":
            speakOutput = 'Please return to the main lobby before accessing Muliplayer. Just say return to the lobby.';
                break;
            case "Main_Leaderboard":
            speakOutput = 'Please return to the main lobby before accessing the Leaderboard. Just say return to the lobby.';
                break;
            case "Main_Premium":
            speakOutput = 'Please return to the main lobby before accessing Premium purchasable content. Just say return to the lobby.';
                break;
            case "Main_Tutorial":
            speakOutput = 'Please return to the main lobby before accessing the Tutorial. Just say return to the lobby.';
                break;
            // May not need
            // case "Main_ReturnToLobbyIntent":
            // speakOutput = 'This is the Lobby.';
            //     break;
            //Single Player Nav intents redirect
            case "Turn_AttackIntent":
            speakOutput = 'You cannot use the attack command outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            case "Turn_BlockIntent":
            speakOutput = 'You cannot use the block command outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            case "Turn_HealIntent":
            speakOutput = 'You cannot use the heal command outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            case "Turn_EscapeIntent":
            speakOutput = 'You cannot use the escape battle command outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            case "Turn_MoveIntent":
            speakOutput = 'You cannot use the move forward command outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            case "Util_CheckScoreIntent": //debating to use or not
            speakOutput = 'You cannot check your current score outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            case "Util_CheckHealthIntent":
            speakOutput = 'You cannot check your health outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            case "Util_CheckInventoryIntent":
            speakOutput = 'You cannot check your inventory outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            case "Util_CheckCoinsIntent":
            speakOutput = 'You cannot check your coin pouch outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            case "Util_EquipItemIntent":
            speakOutput = 'You cannot equip an item outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            case "Util_RequestPositionIntent":
            speakOutput = 'You cannot request your position in game outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            default:
            speakOutput = 'Sorry, I don\'t know about that. Please try again.';
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        console.log("In IntentReflectorHandler") //debug
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        let speakOutput;
        switch(intentName) {
            //Main VUI state intents
            case "Main_PlaySolo":
            speakOutput = 'Please return to the main lobby before accessing Single Player. Just say return to the lobby.';
                break;
            case "Main_PlayMulti":
            speakOutput = 'Please return to the main lobby before accessing Muliplayer. Just say return to the lobby.';
                break;
            case "Main_Leaderboard":
            speakOutput = 'Please return to the main lobby before accessing the Leaderboard. Just say return to the lobby.';
                break;
            case "Main_Premium":
            speakOutput = 'Please return to the main lobby before accessing Premium purchasable content. Just say return to the lobby.';
                break;
            case "Main_Tutorial":
            speakOutput = 'Please return to the main lobby before accessing the Tutorial. Just say return to the lobby.';
                break;
            // May not need
            // case "Main_ReturnToLobbyIntent":
            // speakOutput = 'This is the Lobby.';
            //     break;
            //Single Player Nav intents redirect
            //Single Player Nav intents redirect
            case "Turn_AttackIntent":
            speakOutput = 'You cannot use the attack command outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            case "Turn_BlockIntent":
            speakOutput = 'You cannot use the block command outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            case "Turn_HealIntent":
            speakOutput = 'You cannot use the heal command outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            case "Turn_EscapeIntent":
            speakOutput = 'You cannot use the escape battle command outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            case "Turn_MoveIntent":
            speakOutput = 'You cannot use the move forward command outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            case "Util_CheckScoreIntent": //debating to use or not
            speakOutput = 'You cannot check your current score outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            case "Util_CheckHealthIntent":
            speakOutput = 'You cannot check your health outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            case "Util_CheckInventoryIntent":
            speakOutput = 'You cannot check your inventory outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            case "Util_CheckCoinsIntent":
            speakOutput = 'You cannot check your coin pouch outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            case "Util_EquipItemIntent":
            speakOutput = 'You cannot equip an item outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            case "Util_RequestPositionIntent":
            speakOutput = 'You cannot request your position in game outside of a game session. Please go to Single Player or MultiPlayer mode.';
                break;
            //MultiPlayer Nav intents redirect
            //Leaderboard Nav intents redirect
            //Premium Nav intents redirect
            //Tutorial Nav intents redirect
            default:
            speakOutput = `You just triggered ${intentName}` //----Change this during production //'Sorry, I don\'t know about that. Please try again.';
        }
    
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Continue?')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// interceptors

// const NewSessionRequestInterceptor = {
//   async process(handlerInput) {
//     console.log('NewSessionRequestInterceptor:', JSON.stringify(handlerInput.requestEnvelope.request));
    
//     const profile = getProfile(handlerInput);

//     if (handlerInput.requestEnvelope.session.new && profile.cactus) {
        
//         const currentDateTime = moment.tz(profile.timeZone);
//         const latestInteraction = moment(profile.latestInteraction).tz(profile.timeZone);
        
//         console.log("current date:", currentDateTime.dayOfYear(), "latestInteraction:", latestInteraction.dayOfYear());
        
//         if (currentDateTime.dayOfYear() !== latestInteraction.dayOfYear()) {
//             profile.timesChecked = 0;
//         }
//         profile.timesChecked += 1;
        
//         handlerInput.attributesManager.setPersistentAttributes(profile);
//         handlerInput.attributesManager.savePersistentAttributes();
//     }
//   }
// };

// const LoadProfileRequestInterceptor = {
//     async process(handlerInput) {
//         console.log("WHOLE REQUEST: " + JSON.stringify(handlerInput.requestEnvelope));
//         const attributesManager = handlerInput.attributesManager;
        
//         let profile = await attributesManager.getPersistentAttributes();

//         const deviceId = Alexa.getDeviceId(handlerInput.requestEnvelope);
//         const timeZone = await util.getTimeZone(handlerInput, deviceId);
//         console.log("LoadProfileRequestInterceptor - timezone", timeZone);
        
//         // If no profile initiate a new one - first interaction with skill
//         if(!profile.hasOwnProperty("lifeTime")) {
//             profile = profileUtil.defaultProfile()
//         } else if (profile.cactus) { // Check if there is a cactus before compute status
//             profile.cactus = statusUtil.computeStatus(profile, moment(), timeZone);
//             badgeUtil.evaluate(profile, moment());
//         }
        
//         profile.timeZone = timeZone;
        
//         attributesManager.setSessionAttributes(profile);
//         console.log("LoadProfileRequestInterceptor", JSON.stringify(attributesManager.getSessionAttributes()));
//     }
// }

// const UpdateLatestInteractionResponseInterceptor = {
//     process(handlerInput) {
//         const profile = getProfile(handlerInput);
        
//         //console.log("UpdateLatestInteractionResponseInterceptor", JSON.stringify(profile))
        
//         profile.latestInteraction = moment.now();
        
//         handlerInput.attributesManager.setPersistentAttributes(profile);
//         handlerInput.attributesManager.savePersistentAttributes();
//     }
// }

// const LogResponseJsonResponseInterceptor = {
//     process(handlerInput) {
//         //TODO figure out why this response is empty on the LaunchRequest response.
//         console.log("Response JSON:", JSON.stringify(handlerInput.responseBuilder.getResponse()));
//     }
// };

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        ReturnToLobbyHandler,
        StartNewGameHandler,
        /// VUI Navigators
        SoloPlayIntentHandler,
        MultiPlayIntentHandler,
        LeaderboardIntentHandler,
        PremiumIntentHandler,
        TutorialIntentHandler,
        /// Moveset Navigators
        MoveTurnIntentHandler,
        AttackTurnIntentHandler,
        BlockAttackIntentHandler,
        EscapeTurnIntentHandler,
        HealIntentHandler,
        /// Game Utilitiy Handlers
        EquipItemIntentHandler,
        RequestPositionIntentHandler,
        CheckCoinsIntentHandler,
        CheckScoreIntentHandler, 
        //InitiateEncounterHandler,
        //InBattleMoveTurnIntentHandler,
        CheckInventoryIntentHandler,
        CheckHealthIntentHandler,
        ///Yes/No handlers
        YesIntent_ReturnLobbyHandler,
        NoIntent_ReturnLobbyHandler,
        /// Default Utility
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withPersistenceAdapter(
        new persistenceAdapter.S3PersistenceAdapter({
            bucketName: process.env.S3_PERSISTENCE_BUCKET,
            s3Client: new AWS.S3({apiVersion: 'latest', region: process.env.S3_PERSISTENCE_REGION})
        })
    )
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();