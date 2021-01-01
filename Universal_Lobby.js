const Alexa = require('ask-sdk-core');
const game = require('gameMechanics.js');
const AWS = require('aws-sdk');
//const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');

/*
* Handler Design for accessing a lobby within this game.
*/

//Requires State Manager  
const saveState = require('./saveStatesTest')
const stateLobby = {
    "Soloplay": false,
    "Multiplay": false,
    "Leaderboard": false,
    "Premium": false,
    "Tutorial": false
}
// Makes sure only one of the stateLobby Variable is set to true for double checking and making sure there are no bugs
// Passes one state to be true and set others all false  
function setLobbyState(lobbyState) {
    stateLobby[lobbyState] = true;
    for (const state in stateLobby) {
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

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    }, 
    async handle(handlerInput) {
        /* ****************************************
        *   Loading each session upon handler call  
        */
        const { attributesManager } = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        
        let in_progress = await attributesManager.getPersistentAttributes() || {};
        let game = in_progress; // Seperate vaiable used to track the state may be useful to measure state changes

        // Uncomment below for debugging 
        // console.log('Saved Attributes is: ', in_progress);
        // console.log("sessionAttributes: ", sessionAttributes);
        
        let speakOutput = 'Welcome to Dungeon Rungs.';
        console.log("speakOutput: ", speakOutput);
        
        let hasGame = in_progress.hasOwnProperty("gameInfo");
        console.log("has game?: ", hasGame);
        //Call and print location left off
        // if (hasGame) {
        //     console.log("is in progress", game);
        //     sessionAttributes.gameInfo = in_progress.gameInfo;
  
        //     //Replace with a function:
        //     // if (sessionAttributes.gameInfo.position > 99) {
        //     //     speakOutput = `You won the last game with a total of ${sessionAttributes.gameInfo.numberOfMoves} moves. Try starting a new game by saying start a new game.`;
        //     // } else {
        //     //     speakOutput = 'Looks like you have a game already in session, would you like to continue or start a new game? To resume say continue, if not say start a new game.';
        //     // }
        //     return handlerInput.responseBuilder
        //         .speak(speakOutput)
        //         .reprompt(speakOutput)
        //         .getResponse();
        // }
        console.log("no game in progress", hasGame);
        speakOutput = 'Welcome to Dungeon Rungs. Here you have to discover your way through battle, and win in as few turns as possible at the top of the Rungs. When encountering a foe, You can attack, block or run away. Defeating a foe gives you coins to use for items in the shop. When ever you need help, just say help. To start and move forward, just say move forward.';
        //Begin with starter stats
        sessionAttributes.gameInfo = startDefault();
    
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("Say move forward to begin your journey.")
            .getResponse();
    }
};

const LobbyHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getRequestType(handlerInput.requestEnvelope) === 'LobbyRequest';
    },
    async handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        
        let in_progress = await attributesManager.getPersistentAttributes() || {};
        let game = in_progress.hasOwnProperty('gameInfo');

       sessionAttributes.gameInfo = startDefault();
    
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("Say move forward to begin your journey.")
            .getResponse();
    }
};

const LobbyHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getRequestType(handlerInput.requestEnvelope) === 'LobbyRequest';
    },
    async handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        
        let in_progress = await attributesManager.getPersistentAttributes() || {};
        let game = in_progress.hasOwnProperty('gameInfo');

        // console.log('Saved Attributes is: ', in_progress);
        // console.log("sessionAttributes: ", sessionAttributes);
        
        let speakOutput = 'Welcome to Dungeon Rungs. You have a few options. Start a new game, Open the tutorial or Check out premium options.';
        // console.log("speakOutput: ", speakOutput);
        
        let hasGame = in_progress.hasOwnProperty("gameInfo");
        // console.log("has game?: ", hasGame);
        if (hasGame) {
            console.log("is in progress", game);
            sessionAttributes.gameInfo = in_progress.gameInfo;
  
            if (sessionAttributes.gameInfo.position > 99) {
                speakOutput = `You won the last game with a total of ${sessionAttributes.gameInfo.numberOfMoves} moves. Try starting a new game by saying start a new game.`;
            } else {
                speakOutput = 'Looks like you have a game already in session, would you like to continue or start a new game? To resume say continue, if not say start a new game.';
            }
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(speakOutput)
                .getResponse();
        }
        console.log("no game in progress", hasGame);
        speakOutput = 'Welcome to Dungeon Rungs. Here you have to discover your way through battle, and win in as few turns as possible at the top of the Rungs. When encountering a foe, You can attack, block or run away. Defeating a foe gives you coins to use for items in the shop. When ever you need help, just say help. To start and move forward, just say move forward.';
        sessionAttributes.gameInfo = startDefault();
    
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("Say move forward to begin your journey.")
            .getResponse();
    }
};