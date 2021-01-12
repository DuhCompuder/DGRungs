/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const prompt = require('./speakUtil.js');
////////////////////////////////////////////////////////////////////////////////
//
//      Import State
//
////////////////////////////////////////////////////////////////////////////////
const state = require('./persistenceStateStructure.js');
const debug = true; 
// debug?console.log();

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome, welcome to dungeon rungs? Where do you want to go? Solo Play, Muliplayer, Leaderboard or Premium?';
        setLobbyState("Lobby", handlerInput);
        returnSessionAttributes(handlerInput); //change to final sessions structure
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const returnToLobbyHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Main_ReturnToLobbyIntent'; //create the intent in console
    },
    handle(handlerInput) {
        const speakOutput = 'Are you sure you want to leave and return to the lobby?';
        //Modify the yes handler to handle this scenario
        //If yes, response is "Ok, taking you back to the lobby"
        // resolve setLobbyState("Lobby", handlerInput); on a "yes handled"
        returnToLobby = true;
        // remove after installing yes handler:
        // setLobbyState("Lobby", handlerInput); // remove after yes handler
        returnSessionAttributes(handlerInput); //change to final sessions structure
        
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
let returnToLobby = false;
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
    //debug?console.log(`Final StateVUI: ${JSON.stringify(stateVUI)}`):debug;
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
function loadSessionAttributes(handlerInput){
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes() || {};
    //let game = in_progress.hasOwnProperty('gameInfo'); //Modify for complex structure
    return sessionAttributes;
}
// save session attributes --- //only if saved structure exists already
function saveSessionAttributes(handlerInput){ 
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes() || {};
    sessionAttributes.GAMENAV = stateVUI;
}
// Load persistence attributes --- function must call on await
// function loadFromPersistance(handlerInput){
//     const { attributesManager } = handlerInput;
//     let inProgress = attributesManager.getPersistentAttributes() || {}; 
//     return inProgress;
// }
// Save persistence attributes --- function must call on await
function saveToPersistance(handlerInput, saveAttributes){
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes() || {};
    attributesManager.setPersistentAttributes(saveAttributes);
    attributesManager.savePersistentAttributes();
}
function returnSessionAttributes(handlerInput){ 
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes() || {};
    if (sessionAttributes.NEWSESSION === false) {
        //console.log("load old: ",JSON.stringify(sessionAttributes)); //debugger
        return sessionAttributes;
    }
    sessionAttributes.NEWSESSION = false;
    sessionAttributes.GAMENAV = stateVUI;
    debug ? console.log("load new: ",JSON.stringify(sessionAttributes)): debug; //debugger
    return sessionAttributes;
}

//////////////////////////////////////////////////////////////////////////////////////////
//  Tasks: 
//      - Set a state attribute that identifies location as Lobby in order to user these
//      - Modify to set stateVUI object using setLobbyState() function
//
const SoloPlayIntentHandler = {
    canHandle(handlerInput) {
        const canUse = returnSessionAttributes(handlerInput);
        console.log("canUse: ", canUse.GAMENAV["Lobby"])
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
        const canUse = returnSessionAttributes(handlerInput);
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
        const canUse = returnSessionAttributes(handlerInput);
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
        const canUse = returnSessionAttributes(handlerInput);
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
        const canUse = returnSessionAttributes(handlerInput);
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
        const canUse = returnSessionAttributes(handlerInput);
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
        const canUse = returnSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Turn_MoveIntent'
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true);
    },
    handle(handlerInput) {
        const speakOutput = 'Move Turn!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};

const AttackTurnIntentHandler = {
    canHandle(handlerInput) {
        const canUse = returnSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Turn_AttackIntent'
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true);
    },
    handle(handlerInput) {
        const speakOutput = 'Attack Turn!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};

const BlockAttackIntentHandler = {
    canHandle(handlerInput) {
        const canUse = returnSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Turn_BlockIntent'
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true);
    },
    handle(handlerInput) {
        const speakOutput = 'Block Turn!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};

const EscapeTurnIntentHandler = {
    canHandle(handlerInput) {
        const canUse = returnSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Turn_EscapeIntent'
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true);
    },
    handle(handlerInput) {
        const speakOutput = 'Escape Turn!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('continue?')
            .getResponse();
    }
};

const HealIntentHandler = {
    canHandle(handlerInput) {
        const canUse = returnSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Turn_HealIntent'
            && (canUse.GAMENAV["Soloplay"] === true || canUse.GAMENAV["Multiplay"] === true);
    },
    handle(handlerInput) {
        const speakOutput = 'Heal Turn!';

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
        const canUse = returnSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent'
            && canUse.GAMENAV["Lobby"] === false
            && returnToLobby === true;
    },
    handle(handlerInput) {
        setLobbyState("Lobby", handlerInput);
        let speakOutput = "Ok, taking you back to the lobby";
        returnToLobby = false;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(prompt.LOBBYSPEAK)
            .getResponse();
    }
};

const NoIntent_ReturnLobbyHandler = {
    canHandle(handlerInput) {
        const canUse = returnSessionAttributes(handlerInput);
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent'
            && canUse.GAMENAV["Lobby"] === false
            && returnToLobby === true;
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
        returnToLobby = false;
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
        returnToLobbyHandler,
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
        /// Default Utility
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();