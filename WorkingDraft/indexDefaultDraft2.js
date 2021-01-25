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
const STATE = require('./persistenceStateStructure');
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');

const stateVUI = {
    "Lobby": true,
    "Soloplay": false,
    "Multiplay": false,
    "Leaderboard": false,
    "Premium": false,
    "Tutorial": false
};

const yesNoModifiers = {
    returnToLobby: false,
    startNewGame: false,
    escapeBattle: false
}

function setLobbyState(lobbyState, handlerInput) {
    const { attributesManager } = handlerInput;
    let session = getProfile(handlerInput);
        console.log(`Lobbystate is: ${lobbyState}.`, `Initial StateVUI: ${JSON.stringify(stateVUI)}`); // uncomment for debugging
    session.GAMENAV[lobbyState] = true;
    for (const state in session.GAMENAV) {
        if(state !== lobbyState){
            session.GAMENAV[state] = false;
        }
    }
    attributesManager.setSessionAttributes(session);
        console.log(`Final StateVUI: ${JSON.stringify(stateVUI)}`); // uncomment for debugging
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const speakOutput = 'Welcome, welcome to dungeon rungs? Where do you want to go? Solo Play, Muliplayer, Leaderboard or Premium?';
        let session = getProfile(handlerInput);
        //reset nav each launch;
        session.GAMENAV = stateVUI;
        
        attributesManager.setSessionAttributes(session);
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
        const { attributesManager } = handlerInput;
        let session = getProfile(handlerInput);
        const speakOutput = 'Are you sure you want to leave and return to the lobby?';
        //Modify the yes handler to handle this scenario
        //If yes, response is "Ok, taking you back to the lobby"
        // resolve setLobbyState("Lobby", handlerInput); on a "yes handled"
        session.MODIFIERS.returnToLobby = true;
        // remove after installing yes handler:
        // setLobbyState("Lobby", handlerInput); // remove after yes handler
        // getProfile(handlerInput); //change to final sessions structure
        attributesManager.setSessionAttributes(session);
        //Saves what ever session the current user is in now.
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
////// REWORK THIS ENTIRE HANDLER TO SWITCH BETWEEN SOLO AND MULTI DEPENDING ON WHERE PLAYER IS //////
const StartNewGameHandler = {
    canHandle(handlerInput) {
        const canUse = getProfile(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Main_ReturnToLobbyIntent' 
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true);
    },
    handle(handlerInput) {
        const { attributesManager } = handlerInput;
        let session = getProfile(handlerInput);
        const speakOutput = 'Are you sure you want start a new game? Your old unsaved data will be overwritten.';
        //Modify the yes handler to handle this scenario
        //If yes, response is "Ok, taking you back to the lobby"
        // resolve setLobbyState("Lobby", handlerInput); on a "yes handled"
        session.MODIFIERS.startNewGame = true;
        // remove after installing yes handler:
        // setLobbyState("Lobby", handlerInput); // remove after yes handler
        // fetchSessionAttributes(handlerInput); //change to final sessions structure
        attributesManager.setSessionAttributes(session);
        
        //Saves what ever session the current user is in now.
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

///////////////////////////////////////////////////////////
//                                      //
//      MAIN Play VUI Navigators        //
//                                      //
///////////////////////////////////////////////////////////

const SoloPlayIntentHandler = {
    canHandle(handlerInput) {
        const canUse = getProfile(handlerInput);
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
        const canUse = getProfile(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Main_PlayMulti'
            && canUse.GAMENAV["Lobby"] === true;
    },
    handle(handlerInput) {
        const speakOutput = "multiplayer is in the works, you can still play single player for the time being. Please say play single player to start a game."
        //const speakOutput = 'You are playing multiplayer mode, you dont have a game going so starting new game.';
        //Set state to play solo in attributes
        //setLobbyState("Multiplay", handlerInput) // enable once Multiplayer is activated
        let reprompt = 'Say play single player.';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(reprompt)
            .getResponse();
    }
};

const LeaderboardIntentHandler = {
    canHandle(handlerInput) {
        const canUse = getProfile(handlerInput);
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
        const canUse = getProfile(handlerInput);
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
        const canUse = getProfile(handlerInput);
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
        const canUse = getProfile(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Main_PlaySolo'
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true);
    },
    handle(handlerInput) {
        let speakOutput = 'Welcome, looks like you have a session in Stage One. Would you like to continue?';
        //speakOutput = 'Begining Stage One of Dungeon Rung.';
        //speakOutput = `Which stage do you want to play a game in ${availableGameStages}?`;
        //speakOutput = `Ok, starting a new game in ${chosen stage} for you.`;

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

//original [functional version] for debug
// function moveUpdater(_session, gameMode){
//     //cannot move forward if in a battle
//     let packet;
//     let session = _session;
//     let speakOutput;
//     let moveCount = GAME.dice();
//     let {inBattle} = _session[gameMode].USER_SESSION_INFO;
//     if (inBattle === true) {
//         console.log("inBattle is true") //debug
//         speakOutput = "Sorry you cannot move forward until you resolve your current battle. However, you can attempt to escape by saying escape.";
//     } else {
//         console.log("inBattle is true") //debug
//         session[gameMode].USER_SESSION_INFO.position += moveCount; 
//         session[gameMode].USER_SESSION_INFO.numberOfMoves++;
//         speakOutput = `You rolled a ${moveCount}. You moved to step ${session[gameMode].USER_SESSION_INFO.position}.`; //add sound effect?
//         const onRung = GAME.checkRungOn(session[gameMode].USER_SESSION_INFO.position);
//         const mobPickStatus = COMBAT.actOnPosition(onRung, 'stage1'); //actOnPosition(rung, stage) //modify stage to variable
//         if (mobPickStatus.name === "Clear Path") {
//             console.log("mobPickStatus resolved with clear path") //debug
//             //Change the speak outputs into variables in /speakUtil.js
//             speakOutput = 'You encountered a clear path to move forward. What do you like to do next?!';
//         } else {
//             console.log("mobPickStatus resolved with a mob") //debug
//             //function to update in combat details should session close in midbattle?
//             session[gameMode].USER_SESSION_INFO.inBattle = true;
//             session[gameMode].USER_SESSION_INFO.ongoingBattle.opponentStats = mobPickStatus.encounter;
//             speakOutput += mobPickStatus.speakOutput; //`You encountered a ${mobPickStatus.name}. How do you want to engage in this battle?`;
//         }
//     }
//     packet = {
//         session,
//         speakOutput
//     }
//     return packet;
// }
const MoveTurnIntentHandler = {
    canHandle(handlerInput) {
        const canUse = getProfile(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Turn_MoveIntent'
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true);
    },
    async handle(handlerInput) {
        const { attributesManager } = handlerInput;
        
        let speakOutput;
        //console.log("Inside move handler") //debug
        let session = getProfile(handlerInput);
        console.log("session is: ",JSON.stringify(session))
        console.log("gameMode is: ");
        let gameMode = returnGameMode(session); //get Solo play or Multiplay to update session[gameMode] data i.e. SOLO_PLAY etc.
        console.log(gameMode);
        console.log("session resolves with: ");
        console.log(session)
        //let moveDetails = moveUpdater(session, gameMode);
        let moveDetails = COMBAT.moveUpdater(session, gameMode);
        speakOutput = moveDetails.speakOutput;
            // let moveCount = GAME.dice();
            // // console.log("Move count is: ")
            // // console.log(moveCount)
            // //add moveCount to user position
            // // console.log("user position is: ")
            // // console.log(session[gameMode].USER_SESSION_INFO.position);
            // session[gameMode].USER_SESSION_INFO.position += moveCount; //update move function?
            // // console.log("updated session with move count to position: ")
            // // console.log(session);
            // //tell user of roll and move in position
            // speakOutput = `You rolled a ${moveCount}. You moved to step ${session[gameMode].USER_SESSION_INFO.position}.`; //add sound effect?
            // //increase number of total moves by player
            // session[gameMode].USER_SESSION_INFO.numberOfMoves++;
            // //console.log("USER_SESSION_INFO: ", session[gameMode].USER_SESSION_INFO.numberOfMoves) //debug
            // //check status of user position on whether up a rung or below a rung (if finished the game call the return function)
            // const onRung = GAME.checkRungOn(session[gameMode].USER_SESSION_INFO.position);
            //     //create seperate onRung session object?
            //     //when lower rung and past the step, say welcome to new rung and update the rung so concordant with step?
            // //console.log("onRung: ", onRung)
            //     //check the level of difficulty in rung and execute continuation
            //     //initiate Encounter function to determine battle or no battle
            // const mobPickStatus = COMBAT.actOnPosition(onRung, 'stage1'); //actOnPosition(rung, stage) //modify stage to variable
            // //console.log("mobPickStatus: ", mobPickStatus) //debug
            // //save to sessionAttributes
            // //save to persistence? //already set to regular save
            // if (mobPickStatus.name === "Clear Path") {
            //     //console.log("mobPickStatus resolved with clear path") //debug
            //     //Change the speak outputs into variables in /speakUtil.js
            //     speakOutput = 'You encountered a clear path to move forward. What do you like to do next?!';
            // } else {
            //     //console.log("mobPickStatus resolved with a mob") //debug
            //     //function to update in combat details should session close in midbattle?
            //     session[gameMode].USER_SESSION_INFO.inbattle = true;
            //     session[gameMode].USER_SESSION_INFO.ongoingBattle.opponentStats = mobPickStatus.encounter;
            //     speakOutput += mobPickStatus.speakOutput; //`You encountered a ${mobPickStatus.name}. How do you want to engage in this battle?`;
            // }
        session = moveDetails.session;
        attributesManager.setSessionAttributes(session);
        
        //if inside a battle set user to inside an ongoing battle and cannot get out until battle is complete

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};

const AttackTurnIntentHandler = {
    canHandle(handlerInput) {
        const canUse = getProfile(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Turn_AttackIntent'
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true);
    },
    handle(handlerInput) {
        let speakOutput = 'Attack Turn!';
        //*Retrieve sessionAttributes data
        let session = getProfile(handlerInput);
        let gameMode = returnGameMode(session); //create a function for this to detect 
        //*Tell player they are not in a battle if they are not and to ask them what do they want to do next
        if (session[gameMode].USER_SESSION_INFO.inBattle === false) {
            console.log("inside AttackTurnIntentHandler: inBattle === false")
            speakOutput = 'You cannot use the attack move while not in a battle.';
            return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
        }
        
        console.log("inside AttackTurnIntentHandler: inBattle === true")
        //*If in a battle, begin attack squence:
        //*Bring up stats of user and opponent
            //also not needed anymore after attack function completion
            //let opponentStats = session[returnGameMode].USER_SESSION_INFO.ongoingBattle.opponentStats;
        //*use updated equipment details and stats to determine next choice of attack
            //use a function to determin this
        //*Having a sword, shield or armor changes attack vectors
        //*Roll dice for attack
            //not needed external dice anymore after updating combat function
        //*Calculate Damage results against enemy
        let attackReport = COMBAT.attackResult(session, gameMode);
        //*Report result
        speakOutput = attackReport.speakOutput;
        //update session info after attack finality
        session = attackReport.session;
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
        const canUse = getProfile(handlerInput);
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
        const canUse = getProfile(handlerInput);
        let session = getProfile(handlerInput);
        let gameMode = returnGameMode(session);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Turn_EscapeIntent'
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true)
            && canUse[gameMode].USER_SESSION_INFO.inBattle === true;
    },
    handle(handlerInput) {
        const { attributesManager } = handlerInput;
        let session = getProfile(handlerInput);
        let gameMode = returnGameMode(session);
        let speakOutput = 'Escaping counts as a turn, you are also knocked back based on your next roll, are you sure you want to flee from this battle?';
        session.MODIFIERS.escapeBattle = true;
        // // EXPORTED TO YES HANDLER // //
        // let roll = GAME.dice();
        // speakOutput += `You rolled a dice. You escaped falling ${roll} steps behind.`;
        // //update move count
        // session[gameMode].USER_SESSION_INFO.numberOfMoves++;
        // //update position
        // session[gameMode].USER_SESSION_INFO.position -= roll;
        // speakOutput += ` Your current position is now ${session[gameMode].USER_SESSION_INFO.position}. What is your next move?`
        //update session
        attributesManager.setSessionAttributes(session);
        
        
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
        const canUse = getProfile(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Turn_HealIntent'
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true);
    },
    handle(handlerInput) {
        const {attributesManager} = handlerInput;
        let speakOutput;
        let session = getProfile(handlerInput);
        let gameMode = returnGameMode(session);
        let {healCount} = session[gameMode].USER_SESSION_INFO;
        session[gameMode].USER_SESSION_INFO.healCount++;
        let costToHeal; //if not in battle but cost to heal in battle doubles the heal count
        if (session[gameMode].USER_SESSION_INFO.inBattle === false){
            costToHeal = 7 + healCount;
            speakOutput = `The cost to heal outside of a battle is ${costToHeal} coins. Do you want to spend your coins to heal?`;
            //update move count
            session[gameMode].USER_SESSION_INFO.numberOfMoves++;
        } else {
            costToHeal = 7 + (2*healCount);
            speakOutput = `The cost to heal inside a battle is ${costToHeal} coins. Do you want to spend your coins to heal?`; //add what is your next move to yes/no handle after this
            //update move count
            session[gameMode].USER_SESSION_INFO.numberOfMoves++;
        }
        //update session
        attributesManager.setSessionAttributes(session);
        
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
        let session = getProfile(handlerInput);
        let gameMode = returnGameMode(session);
        let pos = session[gameMode].USER_SESSION_INFO.position;
        let speakOutput = `Your current position is at step ${pos}. What do you want to do next?`;

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
        let speakOutput;
        let session = getProfile(handlerInput);
        let gameMode = returnGameMode(session);
        let coins = session[gameMode].USER_SESSION_INFO.coinPouch;
        speakOutput = `You have ${coins} coins in your coin pouch. What is your next move?`;

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
        let session = getProfile(handlerInput);
        let gameMode = returnGameMode(session);
        let hp = session[gameMode].USER_SESSION_INFO.userStats.hitpoints;
        let speakOutput = `Your current health level is at ${hp}. What do you want to do next?`;

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
        let session = getProfile(handlerInput);
        let gameMode = returnGameMode(session);
        let numMove = session[gameMode].USER_SESSION_INFO.numberOfMoves;
        let speakOutput = `You took a total of ${numMove} moves so far. What do you want to do next?`;

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
        const canUse = getProfile(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent'
            && canUse.GAMENAV["Lobby"] === false
            && canUse.MODIFIERS.returnToLobby === true;
    },
    handle(handlerInput) {
        const { attributesManager } = handlerInput;
        let session = getProfile(handlerInput);
        let speakOutput = "Ok, taking you back to the lobby";
        
        setLobbyState("Lobby", handlerInput);
        session.MODIFIERS.returnToLobby = false;
        attributesManager.setSessionAttributes(session);
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(PROMPT.LOBBYSPEAK)
            .getResponse();
    }
};

const NoIntent_ReturnLobbyHandler = {
    canHandle(handlerInput) {
        const canUse = getProfile(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent'
            && canUse.GAMENAV["Lobby"] === false
            && canUse.MODIFIERS.returnToLobby === true;
    },
    handle(handlerInput) {
        const { attributesManager } = handlerInput;
        let session = getProfile(handlerInput);
        let speakOutput = "OK, please say continue";

        const state = Object.keys(session.GAMENAV);
        console.log("state: ", JSON.stringify(state));
        let active = state.filter(function(id) {
            if (session.GAMENAV[id] === true) {
                console.log(id, session.GAMENAV[id]);
                return session.GAMENAV[id]
            }
            console.log(id, "false")
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
        session.MODIFIERS.returnToLobby = false;
        attributesManager.setSessionAttributes(session);
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("Say continue.")
            .getResponse();
    }
};
//START NEW GAME
const YesIntent_StartNewGameHandler = {
    canHandle(handlerInput) {
        const canUse = getProfile(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent'
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true)
            && canUse.MODIFIERS.startNewGame === true;
    },
    handle(handlerInput) {
        const { attributesManager } = handlerInput;
        let session = getProfile;
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
              
                session.GAMENAV = stateVUI;
                session.MODIFIERS = yesNoModifiers;
                session.SOLO_PLAY = GAME.startDefault(); // session.SOLO_PLAY = STATE.Soloplay;
                attributesManager.setSessionAttributes(session); //refresh sessionNav to beggining
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
        const canUse = getProfile(handlerInput);
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

// Yes escape battle

const YesIntent_EscapeBattleHandler = {
    canHandle(handlerInput) {
        const canUse = getProfile(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent'
            && canUse.GAMENAV["Lobby"] === false
            && canUse.MODIFIERS.escapeBattle === true;
    },
    handle(handlerInput) {
        const { attributesManager } = handlerInput;
        let session = getProfile(handlerInput);
        let gameMode = returnGameMode(session);
        let speakOutput;
        
        let roll = GAME.dice();
        speakOutput = `You rolled a dice. You escaped falling ${roll} steps behind.`;
        //update move count
        session[gameMode].USER_SESSION_INFO.numberOfMoves++;
        //update position
        session[gameMode].USER_SESSION_INFO.position -= roll;
        let newPosition = session[gameMode].USER_SESSION_INFO.position;
        //update levelnum
        let newRung =  GAME.checkRungOn(newPosition);
        session[gameMode].USER_SESSION_INFO.levelnum = newRung;
        
        
        speakOutput += ` Your current position is now ${session[gameMode].USER_SESSION_INFO.position}. What is your next move?`
        
        session[gameMode].USER_SESSION_INFO.inBattle = false;
        session.MODIFIERS.escapeBattle = false;
        attributesManager.setSessionAttributes(session);
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(PROMPT.LOBBYSPEAK)
            .getResponse();
    }
};

// DEFAULT NO INTENT MODIFIER HANDLER //
const NoIntent_DefaultModifierHandler = {
    canHandle(handlerInput) {
        const canUse = getProfile(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent'
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true);
    },
    handle(handlerInput) {
        let speakOutput = "OK, please say continue";
        const { attributesManager } = handlerInput
        let session = getProfile(handlerInput);
        const state = Object.keys(session.GAMENAV);
        const active = state.filter(function(id) {
            if(session.GAMENAV[id] === true){
                return session.GAMENAV[id];
            }
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
        session.MODIFIERS = yesNoModifiers;
        attributesManager.setSessionAttributes(session);
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("Say continue.")
            .getResponse();
    }
};

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
        let session = getProfile(handlerInput);
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
                if ((session.GAMENAV.Soloplay === true) || (session.GAMENAV.Multiplay === true)) {
                    speakOutput = 'You cannot use the escape battle command outside of a battle. Please continue moving forward.';
                } else {
                    speakOutput = 'You cannot use the escape battle command outside of a game session. Please go to Single Player or MultiPlayer mode.';
                }
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
        let session = getProfile(handlerInput);
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
                if ((session.GAMENAV.Soloplay === true) || (session.GAMENAV.Multiplay === true)) {
                    speakOutput = 'You cannot use the escape battle command outside of a battle. Please continue moving forward.';
                } else {
                    speakOutput = 'You cannot use the escape battle command outside of a game session. Please go to Single Player or MultiPlayer mode.';
                }
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

const getProfile = function (handlerInput) {
    return handlerInput.attributesManager.getSessionAttributes();
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

const LoadProfileRequestInterceptor = {
    async process(handlerInput) {
        console.log("WHOLE REQUEST: " + JSON.stringify(handlerInput.requestEnvelope));
        const attributesManager = handlerInput.attributesManager;
        
        let attributes = await attributesManager.getPersistentAttributes();
        //let gameMode = returnGameMode(attributes);
        //let profile = attributes[gameMode].USER_SESSION_INFO;
        console.log("hasOwnProperty?: ", attributes.hasOwnProperty("SOLO_PLAY"))
        // If no profile initiate a new one - first interaction with skill
        //let gameMode = returnGameMode();
        if(!attributes.hasOwnProperty("SOLO_PLAY")) {
            console.log("setting default profile...")
            attributes.SOLO_PLAY = STATE.dataSoloplay;
            attributes.GAMENAV = stateVUI;
            attributes.MODIFIERS = yesNoModifiers;
            //attributes.MULTI_PLAY = STATE.MULTI_PLAY; //Not Complete yet
        } 
        
        // if(!attributes.hasOwnProperty("MULTI_PLAY")) {
        //     console.log("setting default profile...")
        //     attributes.MULTI_PLAY = STATE.dataSoloplay;
        //     attributes.GAMENAV = stateVUI;
        //     attributes.MODIFIERS = yesNoModifiers;
        //     //attributes.MULTI_PLAY = STATE.MULTI_PLAY; //Not Complete yet
        // } 
        
        attributesManager.setSessionAttributes(attributes);
        console.log("LoadProfileRequestInterceptor", JSON.stringify(attributesManager.getSessionAttributes()));
    }
}

const UpdateLatestInteractionResponseInterceptor = {
    process(handlerInput) {
        const profile = getProfile(handlerInput);
        
        //console.log("UpdateLatestInteractionResponseInterceptor", JSON.stringify(profile))
        handlerInput.attributesManager.setPersistentAttributes(profile);
        handlerInput.attributesManager.savePersistentAttributes();
    }
}

const LogResponseJsonResponseInterceptor = {
    process(handlerInput) {
        //TODO figure out why this response is empty on the LaunchRequest response.
        console.log("Response JSON:", JSON.stringify(handlerInput.responseBuilder.getResponse()));
    }
};

///////////////////////////////////////////////////////////////////////////////
// Functions
///////////////////////////////////////////////////////////////////////////////
function returnGameMode(sessionAttributes) {
    console.log("sessionAttributes in returnGameMode: ", JSON.stringify(sessionAttributes))
    const state = Object.keys(sessionAttributes.GAMENAV);
    console.log("state: ", JSON.stringify(state));
    let active = state.filter(function(id) {
        if (sessionAttributes.GAMENAV[id] === true) {
            console.log(id, sessionAttributes.GAMENAV[id]);
            return sessionAttributes.GAMENAV[id]
        }
        console.log(id, "false")
    })
    let gameMode;
    console.log("logging active: ", JSON.stringify(active));
    switch (active[0]) {
        case "Lobby":
            gameMode = "LOBBY";
            break;
        case "Soloplay":
            gameMode = "SOLO_PLAY";
            break;
        case "Multiplay":
            gameMode = "MULTI_PLAY";
            break;
        case "Leaderboard":
            gameMode = "LEADERBOARD";
            break;
        case "Tutorial":
            gameMode = "TUTORIAL";
            break;
        case "Premium":
            gameMode = "PREMIUM";
            break;
    }
    return gameMode;
}
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
        YesIntent_StartNewGameHandler,
        NoIntent_StartNewGameHandler,
        YesIntent_EscapeBattleHandler,
        NoIntent_DefaultModifierHandler,
        /// Default Utility
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addRequestInterceptors(
        LoadProfileRequestInterceptor
    )
    .addResponseInterceptors(
        UpdateLatestInteractionResponseInterceptor,
        LogResponseJsonResponseInterceptor
    )
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