/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');

////////////////////////////////////////////////////////////////////////////////
//
//      Import State
//
////////////////////////////////////////////////////////////////////////////////
const state = require('./persistenceStateStructure.js');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome, welcome to dungeon rungs? Where do you want to go? Solo Play, Muliplayer, Leaderboard or Premium?';

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
const stateVUI = {
    "Soloplay": false,
    "Multiplay": false,
    "Leaderboard": false,
    "Premium": false,
    "Tutorial": false
};
// This attribute needs to be true whenever user want to leave a session to return to lobby.
// If User wants to access any of the other VUI states, a prompt will be asked to them if they are
// sure to exit the current VUI state an return to the lobby. (Test if needed at all or not)
const returnToLobby = false
/////////////////////////////////////////////////////////////////////////////////////////
// 
//   VUI State Functions:
//
//      - Makes sure only one of the stateLobby Variable is set to true for 
//        double checking and making sure there are no bugs.
//      - Passes one state to be true and set others all false.
//
function setLobbyState(lobbyState) {
    stateVUI[lobbyState] = true;
    for (const state in stateVUI) {
        if(state != lobbyState){
            Object(state) = false;
        }
    }
}
function readGameState(sessionAttributes) {
    //Returns the game state
}
// Load persistence attributes
function loadFromPersistance(handlerInput){
    //Returns persistence attributes
}

//////////////////////////////////////////////////////////////////////////////////////////
//  Tasks: 
//      - Set a state attribute that identifies location as Lobby in order to user these
//      - Modify to set stateVUI object using setLobbyState() function
//
const SoloPlayIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MainPlaySolo';
    },
    handle(handlerInput) {
        const speakOutput = 'You are playing solo player mode, you dont have a game going so starting new game.';
        //Set state to play solo in attributes
        setLobbyState("Soloplay")

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const MultiPlayIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MainPlayMulti';
    },
    handle(handlerInput) {
        const speakOutput = 'You are playing multiplayer mode, you dont have a game going so starting new game.';
        //Set state to play solo in attributes
        setLobbyState("Multiplay")

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const LeaderboardIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MainLeaderboard';
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome to the Leaderboards. You can check out your high scores here.';
        //Set state to play solo in attributes
        setLobbyState("Leaderboard")

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const PremiumIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MainPremium';
    },
    handle(handlerInput) {
        const speakOutput = 'This is the premium area. Check out what premium purchases you can add to your account.';
        //Set state to play solo in attributes
        setLobbyState("Premium")

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const TutorialIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MainTutorial';
    },
    handle(handlerInput) {
        const speakOutput = 'Here we are going to take you through a tutorial of the game. Solo or Multiplayer?';
        //Set state to play solo in attributes
        setLobbyState("Tutorial")

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};


///////////////////////////////////////////////////////////
//                                      //
//      Solo Play VUI Navigators        //
//                                      //
///////////////////////////////////////////////////////////

const NavigateSoloPlayIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlaySolo';
            //&& getSlotValue(State.playSolo);
    },
    handle(handlerInput) {
        const speakOutput = 'Hello World!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
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
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
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
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

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
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
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

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        //VUI Navigators
        SoloPlayIntentHandler,
        MultiPlayIntentHandler,
        LeaderboardIntentHandler,
        PremiumIntentHandler,
        TutorialIntentHandler,
        //Moveset Navigators
        MoveTurnIntentHandler,
        EquipItemIntentHandler,
        RequestPositionIntentHandler,
        CheckCoinsIntentHandler,
        CheckLeaderboardIntentHandler,
        InitiateEncounterHandler,
        InBattleMoveTurnIntentHandler,
        AttackTurnIntentHandler,
        //Game Utilitiy Handlers
        EscapeBattleIntentHandler,
        HealIntentHandler,
        BlockAttackIntentHandler,
        CheckInventoryIntentHandler,
        CheckHealthIntentHandler,
        //Default Utility
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();