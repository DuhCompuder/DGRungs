/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const game = require('gameMechanics.js');
const AWS = require('aws-sdk');
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');

// var persistenceAdapter = getPersistenceAdapter();

// function getPersistenceAdapter(tableName) {
//     // This function is an indirect way to detect if this is part of an Alexa-Hosted skill
//     function isAlexaHosted() {
//         return process.env.S3_PERSISTENCE_BUCKET;
//     }
//     if (isAlexaHosted()) {
//         const {S3PersistenceAdapter} = require('ask-sdk-s3-persistence-adapter');
//         return new S3PersistenceAdapter({
//             bucketName: process.env.S3_PERSISTENCE_BUCKET
//         });
//     } else {
//         // IMPORTANT: don't forget to give DynamoDB access to the role you're using to run this lambda (via IAM policy)
//         const {DynamoDbPersistenceAdapter} = require('ask-sdk-dynamodb-persistence-adapter');
//         return new DynamoDbPersistenceAdapter({
//             tableName: tableName || 'battle_rungs',
//             createTable: true
//         });
//     }
// }
function startDefault() {
    return {
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
        healingCost: 0
    }
}

///*** Lobby ***///
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

/// PURCHASE FUNCTIONS ///
/*
    Function to demonstrate how to filter inSkillProduct list to get list of
    all entitled products to render Skill CX accordingly
*/
function getAllEntitledProducts(inSkillProductList) {
  const entitledProductList = inSkillProductList.filter(record => record.entitled === 'ENTITLED');
  return entitledProductList;
}

/*
    Helper function that returns a speakable list of product names from a list of
    entitled products.
*/
function getSpeakableListOfProducts(entitleProductsList) {
  const productNameList = entitleProductsList.map(item => item.name);
  let productListSpeech = productNameList.join(', '); // Generate a single string with comma separated product names
  productListSpeech = productListSpeech.replace(/_([^_]*)$/, 'and $1'); // Replace last comma with an 'and '
  return productListSpeech;
}

/*
/// PURCHASE HANDLER ///
/*
  Request handler. This handler is used when the user starts the skill without
  specifying a specific intent.
*/
const ISP_PurchaseRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'ISP_PurchaseRequest';
  },
  handle(handlerInput) {

    const locale = handlerInput.requestEnvelope.request.locale;
    const ms = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return ms.getInSkillProducts(locale).then(
      function reportPurchasedProducts(result) {
        const entitledProducts = getAllEntitledProducts(result.inSkillProducts);
        if (entitledProducts && entitledProducts.length > 0) {
          // Customer owns one or more products

          return handlerInput.responseBuilder
            .speak(`Welcome to ${skillName}. You currently own ${getSpeakableListOfProducts(entitledProducts)}` +
              ' products. To hear a random fact, you could say, \'Tell me a fact\' or you can ask' +
              ' for a specific category you have purchased, for example, say \'Tell me a science fact\'. ' +
              ' To know what else you can buy, say, \'What can i buy?\'. So, what can I help you' +
              ' with?')
            .reprompt('I didn\'t catch that. What can I help you with?')
            .getResponse();
        }

        // Not entitled to anything yet.
        console.log('No entitledProducts');
        return handlerInput.responseBuilder
          .speak(`Welcome to ${skillName}. To hear a random fact you can say 'Tell me a fact',` +
            ' or to hear about the premium categories for purchase, say \'What can I buy\'. ' +
            ' For help, say , \'Help me\'... So, What can I help you with?')
          .reprompt('I didn\'t catch that. What can I help you with?')
          .getResponse();
      },
      function reportPurchasedProductsError(err) {
        console.log(`Error calling InSkillProducts API: ${err}`);

        return handlerInput.responseBuilder
          .speak('Something went wrong in loading your purchase history')
          .getResponse();
      },
    );
  },
}; // End LaunchRequestHandler   

////*** END Lobby ***////
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        
        let in_progress = await attributesManager.getPersistentAttributes() || {};
        let game = in_progress.hasOwnProperty('gameInfo');

        console.log('Saved Attributes is: ', in_progress);
        console.log("sessionAttributes: ", sessionAttributes);
        
        let speakOutput = 'Welcome to Dungeon Rungs.';
        console.log("speakOutput: ", speakOutput);
        
        let hasGame = in_progress.hasOwnProperty("gameInfo");
        console.log("has game?: ", hasGame);
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
// TASKS
// (done) 1) make contiunue game intitnet that updates the location and status before contiuing and sends to make move handler to reesolve.
// (done) 2) also when start new game make sure to have intent confirmation saying they will lose all exisitng data.
const NewGameIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StartNewGameIntent';
    },
    handle(handlerInput) {
        
        let speakOutput;
        // added first run through completion to saved attributes
        // speakOutput = `Looks like you completed the first stage of the game. Would you like to purchase the premium version of the game to unlock the next stage and future stages?`;
        speakOutput = `Starting a new game for you. Welcome to Battle Rungs. 
        Here you have to discover your way through battle, and win with as few steps as possible at the top of the Rungs. 
        Each turn, you will get a chance encounter of battle. You can choose to attack, block, run away and heal. Each of these turns cost you a move. Winning a battle gives you coins that you can used to buy items in the shop. You can start by saying move forward. For more information, say help.`; //maybe say tutorial?
        
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        // const {in_progress} = sessionAttributes;
        // sessionAttributes.in_progress = false;
        
        sessionAttributes.gameInfo = {
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
            ongoingBattle: {
                battleSequenceComplete: false,
                opponentStats: null,
                userStats: null
            },
            healingCost: 0
        };

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('A new game has started, What would you like to do.')
            .getResponse();
    }
};
// New start new game version with new stages //
const NewGameTwoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StartNewGameIntent';
            // Check if player has completed at least one game
    },
    handle(handlerInput) {
        
        let speakOutput;
        //*** added first run through completion to saved attributes 
        speakOutput = `Looks like you completed the first stage of the game. Would you like to purchase the premium version of the game to unlock the next stage and future upcoming stages?`;
        //*** if no take the user to original start new game handler else continue
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        // const {in_progress} = sessionAttributes;
        // sessionAttributes.in_progress = false;
        
        //*** if user purchased premium start this
        sessionAttributes.gameInfo = {
            position: 0,
            userStats: {
                hitpoints: 10,
                attack: 1,
                defense: 0
            },
            numberOfMoves: 0,
            stage: 1,
            levelRung: {
                first: true,
                second: false,
                third: false,
                fourth: false,
            },
            inBattle: false,
            // coinPouch: 0,
            // equipted: {
            //     sword: false,
            //     armor: false,
            //     shield: false
            // },
            // inventory: [],
            ongoingBattle: {
                battleSequenceComplete: false,
                opponentStats: null,
                userStats: null
            },
            healingCost: 0
        };
        speakOutput = `Welcome to the second stage. As with the first stage, there are four rungs and a total of 100 steps. Your goal is to complete this stage as little moves as possible.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('A new game has started, What would you like to do.')
            .getResponse();
    }
};

const ContinueIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ContinueIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const { position } = sessionAttributes.gameInfo;
        const { gameInfo } = sessionAttributes;
        
        const speakOutput = `Welcome back to the Dungeon. Your current position is at step ${position.toString()}. You have made a total of ${gameInfo.numberOfMoves} moves. Your health is currently at ${gameInfo.userStats.hitpoints} points. What would you like to do?`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('What would you like to do?') // (add this) "at any time you can say help"
            .getResponse();
    }
};
//// ////////////// //////////
//      Move Navigators
//// ////////////// //////////
const MoveTurnIntentHandler = {
    canHandle(handlerInput) {
        const { attributesManager } = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const { inBattle } = sessionAttributes.gameInfo;
        let notInBattle = true;
        if (inBattle) {
            notInBattle = false;
        }
        return notInBattle &&
        Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MoveTurnIntent';
    },
    async handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        
        let moveForward = game.dice();
        sessionAttributes.gameInfo.position += moveForward;
        
        let { position } = sessionAttributes.gameInfo;
        let speakOutput = `You rolled a dice and moved ${moveForward.toString()} steps forward.`;
        
        sessionAttributes.gameInfo.numberOfMoves += 1;
        
        console.log('sessionAttributes logged: ', sessionAttributes);
        
        if (position >= 25 && sessionAttributes.gameInfo.levelRung.second === false) {
            sessionAttributes.gameInfo.levelRung.second = true;
            speakOutput += " Congratulations, you made it past the first Rung. The difficulty level is increased.";
        } else if (position >= 50 && sessionAttributes.gameInfo.levelRung.third === false) {
            sessionAttributes.gameInfo.levelRung.third = true;
            speakOutput += " Congratulations, you made it past the second Rung. Here, the difficulty level is increased.";
        } else if (position >= 75 && sessionAttributes.gameInfo.levelRung.fourth === false) {
            sessionAttributes.gameInfo.levelRung.fourth = true;
            speakOutput += " Congratulations, you made it past the third Rung. Here, the difficulty level is increased.";
        } else if (position >= 100) {
            speakOutput = `Congratulations you win!. You beat all four rungs. It took about ${sessionAttributes.gameInfo.numberOfMoves} number of moves. You can now start a new game if you wish. Just say start a new game. If not say exit.`;
            if (sessionAttributes.leaderboard) {
                sessionAttributes.leaderboard > sessionAttributes.gameInfo.numberOfMoves? sessionAttributes.leaderboard = sessionAttributes.gameInfo.numberOfMoves: sessionAttributes.leaderboard;
            } else {
                sessionAttributes.leaderboard = sessionAttributes.gameInfo.numberOfMoves;
            }
            
            attributesManager.setPersistentAttributes(sessionAttributes);
            await attributesManager.savePersistentAttributes();
            return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('What would you like to do next?')
            .getResponse();
        }
        speakOutput += ` Currently, you stand at position step ${position.toString()}.`;
        //game.initiateEncounter(sessionAttributes)
        // add a directive to send it to the staging area where battle intent system occurs. Keep it as a seperate system.
        ///***
        
        console.log("debugging");
        let { gameInfo } = sessionAttributes;
        let level;
        for (const [key, value] of Object.entries(gameInfo.levelRung)) {
            if (value) level = key
            console.log("debugging key and value", key, value);
        }
        const encounterResult = game.initiateEncounter(level);
        
        if (encounterResult.name === "Clear Path") {
            console.log("encounterResult: ", encounterResult);
            speakOutput += ` On your way, you encountered a ${encounterResult.name}. You are free to advance. What would you like to do?`;
        } else {
            speakOutput += ` On your way, you encountered a ${encounterResult.name}. What would you like to do?`;
            
            sessionAttributes.gameInfo.inBattle = true;
            sessionAttributes.gameInfo.ongoingBattle = {
                battleSequenceComplete: false,
                opponentStats: encounterResult,
                userStats: gameInfo.userStats
            }
        }
        
        attributesManager.setPersistentAttributes(sessionAttributes);
        await attributesManager.savePersistentAttributes();
        
        ///***
        return handlerInput.responseBuilder
            .speak(speakOutput)
            // .addDelegateDirective({
            //     name: 'EncounterIntent',
            //     confirmationStatus: 'NONE',
            //     slots: {}
            // })
            .reprompt('What would you like to do next? Say help for a list of options.')
            .getResponse();
    }
};

const InitiateEncounterHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'EncounterIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const { gameInfo } = sessionAttributes;
        
        let level;
        for (const [key, value] of Object.entries(gameInfo.levelRung)) {
            if (value) level = key
        }
        const encounterResult = game.initiateEncounter(level);
        //if no encounter direct to move again otherwise stay in encounter.
        
        
        let speakOutput = `On your way, you encountered a ${encounterResult.name}. What would you like to do?`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('What would you like to do?') // (add this) "at any time you can say help"
            .getResponse();
    }
};

const InBattleMoveTurnIntentHandler = {
    canHandle(handlerInput) {
        const { attributesManager } = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const { inBattle } = sessionAttributes.gameInfo;

        return inBattle
            && Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MoveTurnIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        
        let opponent = sessionAttributes.gameInfo.ongoingBattle.opponentStats;
        
        const speakOutput = `You are in a battle. Looks like the ${opponent.name} is getting ready to attack. You can fight it or flee. Taking flight will result in any damage made by the opponent. What do you want to do?`;
        //return MoveTurnIntentHandler.handle(handlerInput);
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const AttackTurnIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AttackIntent';
    },
    async handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const { gameInfo } = sessionAttributes;
        
        let speakOutput = '';
        if (gameInfo.inBattle) {
            let opponent = sessionAttributes.gameInfo.ongoingBattle.opponentStats;
            if (opponent.hitpoints < 1){
                sessionAttributes.gameInfo.inBattle = false;
                sessionAttributes.gameInfo.ongoingBattle.battleSequenceComplete = true;
                speakOutput = 'The creature is defeated. You are free to move.'
            } else {
                let hasSword = gameInfo.equipted.sword === false? false: true;
                let hasArmor = gameInfo.equipted.armor === false? false: true;
                
                let attackBonus = gameInfo.equipted.sword.damage; 
                let blocked = gameInfo.equipted.armor.block; 
                
                let strike = game.dice();
                speakOutput += `You rolled a dice for a ${strike} `;
                opponent.hitpoints -= strike;
                
                if (hasSword) {
                    speakOutput += ` plus ${attackBonus} bonus`;
                    opponent.hitpoints -= attackBonus;
                } 
                speakOutput += ` damage hit.`;
                
                sessionAttributes.gameInfo.ongoingBattle.opponentStats = opponent;
                if (opponent.hitpoints > 0) {
                    speakOutput += ` The ${opponent.name} is still alive with ${opponent.hitpoints} health left.`;
                    let attacked = opponent.attack[Math.floor(Math.random()* (opponent.attack).length)];
                
                    let hpLeft = sessionAttributes.gameInfo.userStats.hitpoints;
                    if (hpLeft < 1) {
                        sessionAttributes.gameInfo.inBattle = false;
                        sessionAttributes.gameInfo.ongoingBattle.battleSequenceComplete = true;
                        sessionAttributes.gameInfo.userStats.hitpoints = 10;
                        speakOutput += ` The ${opponent.name} came back with an attack for ${attacked} damage. Oh no, it looks like you been knocked out.`;
                        
                        let moves = gameInfo.position;
                        switch (game.checkRungOn(moves)) {
                            case "first":
                                sessionAttributes.gameInfo.position = 0;
                                speakOutput += " You are back at the beginning of the first rung.";
                                break;
                            case "second":
                                sessionAttributes.gameInfo.position = 25;
                                speakOutput += " You are back at the beginning of the second rung.";
                                break;
                            case "third":
                                sessionAttributes.gameInfo.position = 50;
                                speakOutput += " You are back at the beginning of the third rung.";
                                break;
                            case "fourth":
                                sessionAttributes.gameInfo.position = 75;
                                speakOutput += " You are back at the beginning of the fourth rung.";
                                break;
                        }
                        speakOutput += " What is your next move?";
                    } else {
                        speakOutput += ` The ${opponent.name} came back with an attack for ${attacked} damage.`;
                     //What is your next move?
                        //Test here//
                        if (hasArmor) {
                            console.log('has armor on')
                            let damageAfterArmor = blocked - attacked;
                            if(blocked >= attacked) {
                                speakOutput += ` Your armor is tough and blocks all incoming damage.`;
                            } else {
                                //blocked completely
                                speakOutput += ` Your armor blocks ${blocked} damage of incoming attack.`;
                                attacked = Math.abs(damageAfterArmor);
                                sessionAttributes.gameInfo.userStats.hitpoints -= attacked;
                                speakOutput += ` The ${opponent.name} only manage to deal ${attacked} damage.`;
                            }
                        } else {
                            sessionAttributes.gameInfo.userStats.hitpoints -= attacked;
                        }
                        // Test Ends //
                        hpLeft = sessionAttributes.gameInfo.userStats.hitpoints;
                        if (hpLeft < 1) {
                            speakOutput += ` Looks like you are knocked out.`;
                            sessionAttributes.gameInfo.inBattle = false;
                            sessionAttributes.gameInfo.ongoingBattle.battleSequenceComplete = true;
                            sessionAttributes.gameInfo.userStats.hitpoints = 10;

                            let moves = gameInfo.position;
                            switch (game.checkRungOn(moves)) {
                                case "first":
                                    sessionAttributes.gameInfo.position = 0;
                                    speakOutput += " You are back at the beginning of the first rung.";
                                    break;
                                case "second":
                                    sessionAttributes.gameInfo.position = 25;
                                    speakOutput += " You are back at the beginning of the second rung.";
                                    break;
                                case "third":
                                    sessionAttributes.gameInfo.position = 50;
                                    speakOutput += " You are back at the beginning of the third rung.";
                                    break;
                                case "fourth":
                                    sessionAttributes.gameInfo.position = 75;
                                    speakOutput += " You are back at the beginning of the fourth rung.";
                                    break;
                            }
                            speakOutput += " What is your next move?";
                            return handlerInput.responseBuilder
                            .speak(speakOutput)
                            .reprompt('What do you want to do next?')
                            .getResponse();
                            
                        } else {
                            hpLeft = sessionAttributes.gameInfo.userStats.hitpoints;
                            speakOutput += ` You now have ${hpLeft} health left. What is your next move?`;
                        }
                    }
                } else {
                    speakOutput += ` You defeated the ${opponent.name} and`;
                    sessionAttributes.gameInfo.inBattle = false;
                    sessionAttributes.gameInfo.ongoingBattle.battleSequenceComplete = true;
                    let drop = opponent.loot[Math.floor(Math.random()* opponent.loot.length)];
                    sessionAttributes.gameInfo.coinPouch += drop;
                    speakOutput += ` found ${drop} coins. You now have a total of ${sessionAttributes.gameInfo.coinPouch} coins in your pouch. What is your next move?`;
                }
            }
            attributesManager.setPersistentAttributes(sessionAttributes);
            await attributesManager.savePersistentAttributes();
        } else {
            speakOutput = 'There is nothing to attack currently. Say what can I do, for a list of things you are able to do right now.';
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('What do you want to do next?')
            .getResponse();
    }
};

const EscapeBattleIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'EscapeIntent';
    },
    async handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const { gameInfo } = sessionAttributes;
        
        let speakOutput = "Fleeing counts as a turn. It looks like you are not in a battle currently. There's no reason for an escape.";
        let { inBattle } = gameInfo;
        if (inBattle) {
            let roll = game.dice();
            sessionAttributes.gameInfo.inBattle = false;
            sessionAttributes.gameInfo.numberOfMoves += 1;
            sessionAttributes.gameInfo.position -= roll;
            sessionAttributes.gameInfo.ongoingBattle = {
                battleSequenceComplete: false,
                opponentStats: null,
                userStats: null
            }
            //double check this code.
            sessionAttributes.gameInfo.position < 0? sessionAttributes.gameInfo.position = 0: sessionAttributes.gameInfo.position;
            speakOutput = `You fled. Dice rolls, you fall back ${roll} steps.`;
        }
        attributesManager.setPersistentAttributes(sessionAttributes);
        await attributesManager.savePersistentAttributes();
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('What do you want to do next?')
            .getResponse();
    }
}

const HealIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HealIntent';
    },
    async handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const { gameInfo } = sessionAttributes;
        let inBattle = gameInfo.inBattle;
        let healCost = sessionAttributes.gameInfo.healingCost;
        let speakOutput = `Healing counts as a turn when used. The cost increases by one after each use. 
        Currently, it costs ${healCost} coins. You dont seem to have enough coins to heal.`;
        
        let enoughCoins = gameInfo.coinPouch >= healCost;
        if (enoughCoins && inBattle === false){
            sessionAttributes.gameInfo.userStats.hitpoints += 5;
            sessionAttributes.gameInfo.healingCost += 1;
            sessionAttributes.gameInfo.coinPouch -= healCost;
            if (sessionAttributes.gameInfo.userStats.hitpoints > 10) {
                sessionAttributes.gameInfo.userStats.hitpoints = 10;
                sessionAttributes.gameInfo.numberOfMoves += 1;
                let coinsleft = sessionAttributes.gameInfo.coinPouch;
                speakOutput = `You stopped to put on some banadages. Your health is now maxed to 10 health. You now have ${coinsleft.toString()} coins left.`;
                attributesManager.setPersistentAttributes(sessionAttributes);
                await attributesManager.savePersistentAttributes();
            } else {
                sessionAttributes.gameInfo.userStats.hitpoints += 5;
                sessionAttributes.gameInfo.healingCost += 1;
                let hp = sessionAttributes.gameInfo.userStats.hitpoints;
                let coinsleft = sessionAttributes.gameInfo.coinPouch;
                sessionAttributes.gameInfo.numberOfMoves += 1;
                speakOutput = `You stopped to put on some banadages and gained 5 health points. Your health is now at ${hp.toString()} points. You now have ${coinsleft.toString()} coins left.`;
                attributesManager.setPersistentAttributes(sessionAttributes);
                await attributesManager.savePersistentAttributes();
            }
        } else if (inBattle === true) {
            speakOutput = "You cannot heal yourself while in the middle of combat.";
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('What is your next move?')
            .getResponse();
    }
}

const BlockAttackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'BlockIntent';
    },
    async handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const { gameInfo } = sessionAttributes;
        
        console.log("inside BlockIntent")//debug//
        let speakOutput = '';
        let resultingDamage = 0;
        if (gameInfo.inBattle) {
            console.log("inBattle is true")//debug//
            let opponent = sessionAttributes.gameInfo.ongoingBattle.opponentStats;
            if (opponent.hitpoints < 1){
                console.log("enemy dead")//debug//
                sessionAttributes.gameInfo.inBattle = false;
                sessionAttributes.gameInfo.ongoingBattle.battleSequenceComplete = true;
                speakOutput = 'The creature is defeated. You are free to move.'
            } else {
                console.log("enemy alive")//debug//
                let hasShield = gameInfo.equipted.shield === false? false: true;
                let hasSword = gameInfo.equipted.sword === false? false: true;
                let hasArmor = gameInfo.equipted.armor === false? false: true;
                
                let counterAttack = gameInfo.equipted.sword.damage; //gameInfo.userStats.attack //not used
                let blocked = gameInfo.equipted.shield.block; //gameInfo.userStats.defense //not used - only when multiple items + boosts
                let armorBlock = gameInfo.equipted.armor.block;
                let canBlock = game.dice();
                let canCounter = game.dice();
                
                //add armor defense
                sessionAttributes.gameInfo.ongoingBattle.opponentStats = opponent; //attribute
                if (opponent.hitpoints > 0) {
                    console.log("enemu health greater than 0")//debug//
                    //Can be Attacked
                    let attacked = opponent.attack[Math.floor(Math.random()* (opponent.attack).length)];
                    console.log('attacked: ', attacked);
                    speakOutput += `The ${opponent.name} is still alive with ${opponent.hitpoints} health points. The ${opponent.name} came with an attack for ${attacked} damage.`;
                    //speakOutput += `The ${opponent.name} is still alive with health points. The ${opponent.name} came with an attack for damage.`;

                    console.log(speakOutput)//debug//
                    
                    let defensePoints = 0;
                    hasArmor? defensePoints += armorBlock: defensePoints;
                    if (hasArmor) speakOutput += ` Your armor reduces the attack by ${armorBlock} damage.`;
                    
                    console.log('resultingDamage pre calculation: ',resultingDamage);
                    console.log('attacked: ', attacked);
                    console.log('defensePoints: ', defensePoints);
                    
                    resultingDamage = attacked - defensePoints;
                    
                    console.log('resultingDamage: ',resultingDamage);
                    
                    if (!hasShield && !hasSword) {
                        console.log("no shield and no sword")//debug//
                        speakOutput += ` Oh no, you don't have a shield! You put up your hands to block an attack anyway `
                        if(canBlock>3) {
                            speakOutput += `but was not successful.`;
                        } else {
                            speakOutput += `and managed to reduced the incoming attack by an additional one point.`;
                            resultingDamage -= 1;
                        }
                    } else if (!hasShield && hasSword) {
                        console.log("no shield with sword")//debug//
                        speakOutput += ` Oh no, you don't have a shield! You put up your hands to block an attack `
                        if(canBlock>3) {
                            speakOutput += `but was not successful.`;
                        } else {
                            speakOutput += `and still managed to reduced the incoming damage by an additional one point.`;
                            resultingDamage -= 1;
                        } 
                        if (canCounter > 3) {
                            speakOutput += ` You countered the attack with a ${counterAttack.toString()} damage hit.`;
                            opponent.hitpoints -= counterAttack;// only if has sword.
                            if (opponent.hitpoints < 1) {
                                speakOutput += ` You defeated the ${opponent.name} and`;
                                sessionAttributes.gameInfo.inBattle = false;
                                sessionAttributes.gameInfo.ongoingBattle.battleSequenceComplete = true;
                                let drop = opponent.loot[Math.floor(Math.random()* opponent.loot.length)];
                                sessionAttributes.gameInfo.coinPouch += drop;
                                speakOutput += ` found ${drop} coins. You now have a total of ${sessionAttributes.gameInfo.coinPouch} coins in your pouch.`;
                            }
                        }
                        
                    } else if (hasShield && hasSword) {
                        console.log("shield and sword")//debug//
                        speakOutput += ` You put up your shield for a block and reduced the incoming attack by ${blocked.toString()} points.`;
                        resultingDamage -= blocked;
                        if (canCounter > 3) {
                            speakOutput += ` And countered with a ${counterAttack.toString()} damage strike.`;
                            opponent.hitpoints -= counterAttack;// only if has sword.
                            if (opponent.hitpoints < 1) {
                                speakOutput += ` You defeated the ${opponent.name} and`;
                                sessionAttributes.gameInfo.inBattle = false;
                                sessionAttributes.gameInfo.ongoingBattle.battleSequenceComplete = true;
                                let drop = opponent.loot[Math.floor(Math.random()* opponent.loot.length)];
                                sessionAttributes.gameInfo.coinPouch += drop;
                                speakOutput += ` found ${drop} coins. You now have a total of ${sessionAttributes.gameInfo.coinPouch} coins in your pouch.`;
                            }
                        } 
                    } else if (hasShield && !hasSword) {
                        console.log("shield and no sword")//debug//
                        speakOutput += ` You put up your shield for a block and reduced the incoming attack by ${blocked.toString()} points.`;
                        resultingDamage -= blocked;
                    } else {
                        console.log("Debugging: Should never arrive here. hasShield value and hasSword value logged: ", hasShield, hasSword);
                    }

                    let hpLeft = sessionAttributes.gameInfo.userStats.hitpoints;
                    if (hpLeft < 1) {
                        console.log("player hp 0")//debug//
                        sessionAttributes.gameInfo.inBattle = false;
                        sessionAttributes.gameInfo.ongoingBattle.battleSequenceComplete = true;
                        sessionAttributes.gameInfo.userStats.hitpoints = 10;
                        speakOutput += ` The ${opponent.name} came back with an attack for ${attacked} damage. Oh no, it looks like you been knocked out.`;
                        
                        let moves = gameInfo.position;
                        switch (game.checkRungOn(moves)) {
                            case "first":
                                sessionAttributes.gameInfo.position = 0;
                                speakOutput += " You are back at the beginning of the first rung.";
                                break;
                            case "second":
                                sessionAttributes.gameInfo.position = 25;
                                speakOutput += " You are back at the beginning of the second rung.";
                                break;
                            case "third":
                                sessionAttributes.gameInfo.position = 50;
                                speakOutput += " You are back at the beginning of the third rung.";
                                break;
                            case "fourth":
                                sessionAttributes.gameInfo.position = 75;
                                speakOutput += " You are back at the beginning of the fourth rung.";
                                break;
                        }
                        
                        speakOutput += " What is your next move?";
                    } else {
                        console.log("player hp not 0")//debug//
                        //able to block
                        ///////////////
                        console.log(resultingDamage);
                        resultingDamage < 1? resultingDamage = 0: resultingDamage;
                        sessionAttributes.gameInfo.userStats.hitpoints -= resultingDamage;
                        hpLeft = sessionAttributes.gameInfo.userStats.hitpoints < 1? 0: sessionAttributes.gameInfo.userStats.hitpoints;
                        console.log(resultingDamage);
                        
                        if (resultingDamage === 0) {
                            speakOutput += " Your defense is tough No damage taken.";
                        } else if (resultingDamage !== 0 && hpLeft > 0) {
                            speakOutput += ` You took a total of ${resultingDamage} damage. You now have ${hpLeft.toString()} health points left. What is your next move?`;
                            console.log(resultingDamage);
                        } else {
                            speakOutput += ` You took a total of ${resultingDamage} damage. Looks like you got knocked out.` /////add more
                            console.log(resultingDamage);
                            console.log("player hp 0")//debug//
                            sessionAttributes.gameInfo.inBattle = false;
                            sessionAttributes.gameInfo.ongoingBattle.battleSequenceComplete = true;
                            sessionAttributes.gameInfo.userStats.hitpoints = 10;

                            let moves = gameInfo.position;
                            switch (game.checkRungOn(moves)) {
                                case "first":
                                    sessionAttributes.gameInfo.position = 0;
                                    speakOutput += " You are back at the beginning of the first rung.";
                                    break;
                                case "second":
                                    sessionAttributes.gameInfo.position = 25;
                                    speakOutput += " You are back at the beginning of the second rung.";
                                    break;
                                case "third":
                                    sessionAttributes.gameInfo.position = 50;
                                    speakOutput += " You are back at the beginning of the third rung.";
                                    break;
                                case "fourth":
                                    sessionAttributes.gameInfo.position = 75;
                                    speakOutput += " You are back at the beginning of the fourth rung.";
                                    break;
                            }
                            speakOutput += " What is your next move?";
                        }
                     //What is your next move?
                     speakOutput += " What is your next move?";
                    }
                } else {
                    console.log("opponent hitpoint 0")//debug//
                    speakOutput += ` You defeated the ${opponent.name} and`;
                    sessionAttributes.gameInfo.inBattle = false;
                    sessionAttributes.gameInfo.ongoingBattle.battleSequenceComplete = true;
                    let drop = opponent.loot[Math.floor(Math.random()* opponent.loot.length)];
                    sessionAttributes.gameInfo.coinPouch += drop;
                    speakOutput += ` found ${drop} coins. You now have a total of ${sessionAttributes.gameInfo.coinPouch} coins in your pouch. What is your next move?`;
                }
            }
            attributesManager.setPersistentAttributes(sessionAttributes);
            await attributesManager.savePersistentAttributes();
        } else {
            speakOutput = 'There is nothing to defend against currently. You can trying saying move forward to keep going.';
        }
        attributesManager.setPersistentAttributes(sessionAttributes);
        await attributesManager.savePersistentAttributes();
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('What do you want to do next?')
            .getResponse();
    }
};

const CheckHealthIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'checkHealthIntent';
    },
    handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const { gameInfo } = sessionAttributes;
        let health = gameInfo.userStats.hitpoints.toString();
        let speakOutput =`You have ${health} health points remaining.`;
        if (gameInfo.inBattle) {
            speakOutput += `Your opponent has ${gameInfo.ongoingBattle.opponentStats.hitpoints} health remaining.`;
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('What do you want to do next?')
            .getResponse();
    }
}
const ShopRedirectIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ShopRedirectIntent';
    },
    handle(handlerInput) {
        let speakOutput = "You have not open the dungeon shop option yet, Please say open the dungeon shop to buy items, check item prices, details, and say exit the shop to return to the dungeon once finished with shopping.";
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('What do you want to do next?')
            .getResponse();
    }
}
const CheckInventoryIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CheckInventoryIntent';
    },
    handle(handlerInput) {
    //checks inventory
    //push 3 random items to inventory Array
    //speak: 3 items in inventory.
    // just a test
    // 
    const { attributesManager } = handlerInput;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const { gameInfo } = sessionAttributes;
    
    let speakOutput;
    // let mockInventory = [
    //     {
    //         "name": "Stone Shield",
    //         "type": "shield",
    //         "grade": "stone",
    //         "SSET": "stone-shield",
    //         "itemInfo": " Adds additional two points in defense when blocking an attack",
    //         "cost": "five coins",
    //         "value": 5,
    //         "damage": 0,
    //         "block":2
    //     },
    //     {
    //         "name": "Iron Sword",
    //         "type": "sword",
    //         "grade": "iron",
    //         "SSET": "iron-sword",
    //         "itemInfo": " Adds additional three damage per attack.",
    //         "cost": "five coins",
    //         "value": 12,
    //         "damage": 2,
    //         "block":0
    //     }
    // ]
    // mockInventory.forEach(item => gameInfo.inventory.push(item));
    if (gameInfo.inventory.length < 1) {
        console.log(gameInfo.inventory.length);
        speakOutput = `There are no items in your inventory currently`;
    } else if (gameInfo.inventory.length === 1){
        speakOutput = `You have one item in your inventory, the ${gameInfo.inventory[0].name}`;
    } else {
        let speakItems = gameInfo.inventory.map(item => item.name);
        speakOutput = `You have `;
        for (let i=0; i < speakItems.length-1; i++) {
            speakOutput += ` ${speakItems[i]}, `;
        }
        speakOutput += ` and ${speakItems[speakItems.length-1]} in your inventory.`;
    }
    return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('What would you like to do next?')
            .getResponse();
    
    //after test this actually sends to AXC?
    //Adds value to stats
    //sends list to AXC as a slot of list
    }
}

const EquipItemIntentHandler = {
    //Adds value to stats
    //sends list to AXC as a slot of list
    //No need but just for the API handler?
    //or just regular intent handler
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'EquipItemIntent';
    },
    async handle(handlerInput) {
        //can only equip while out of combat
        const { attributesManager } = handlerInput;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const { gameInfo } = sessionAttributes;
        const { slots } = handlerInput.requestEnvelope.request.intent;
        const { inBattle } = gameInfo;
        console.log(`Inside equip Handler `);
        
        let speakOutput;
        if ( inBattle ) {
            console.log(`in a battle so exit.`);
            speakOutput = `You cannot equip items while in the middle of a battle.`;
            return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("To continue your battle you can say continue or any of the combat commands.")
            .getResponse();
        }
        
        let itemToEquip;
        //get item resolved slot values
        console.log(slots);
        let grade = resolveEntity(slots, "grade");
        let type = resolveEntity(slots, "type");
        console.log(`grade and type: `, grade, " and ", type);
        //match the slot values to corresponding of item contained in inventory
        let locateItem = `${grade}-${type}`;
        let located = gameInfo.inventory.findIndex(item => item.SSET === locateItem);
        console.log('logging located', located);
        //for no items in slot prior to equip
        if (located >= 0){
        //check if there is already item in inventory, if not skip and let it equip
            console.log('logging located inventory SSET', gameInfo.inventory[located].SSET);
            itemToEquip = gameInfo.inventory[located];
            console.log(`item found at index: `, located, `item: `, gameInfo.inventory[located])
            // equip item (check slot to equip)
            let { equipted } = gameInfo;
            let equipmentSlots = Object.keys(equipted);
            //console.log('equipmentSlots: ', equipmentSlots);
            let equipmentSlotIndex = equipmentSlots.findIndex(slot => slot === itemToEquip.type);
            let slotToEquip = equipmentSlots[equipmentSlotIndex];
            let currentEquipped = gameInfo.equipted[slotToEquip];
            
            console.log(`The slot to equip to is: `, slotToEquip);
            if (currentEquipped === false) {
                sessionAttributes.gameInfo.equipted[slotToEquip] = itemToEquip;
                //pop item from inventory
                console.log("removing item: ", sessionAttributes.gameInfo.inventory.splice(equipmentSlotIndex,1))
                sessionAttributes.gameInfo.inventory.splice(equipmentSlotIndex,1)
                speakOutput = `You put on the ${grade} ${type}.`;
            } else {
                sessionAttributes.gameInfo.inventory.push(currentEquipped);
                sessionAttributes.gameInfo.equipted[slotToEquip] = itemToEquip;
                //pop item from inventory
                console.log("removing item: ", sessionAttributes.gameInfo.inventory.splice(equipmentSlotIndex,1))
                sessionAttributes.gameInfo.inventory.splice(equipmentSlotIndex,1)
                speakOutput = `You switched out the ${currentEquipped.name} for the ${grade} ${type}.`;
            }
        } else {
            console.log(`item is not found and index is: `, located);
            speakOutput = `Sorry, it looks like the ${grade} ${type} is not in your inventory.`;
        }
        //if not in inventory return not in inventory
        //else move item from inventory to equipted slot of game user with the correstponding type name e.g. sword to sword, shield to shield
        //if item already occupies equipped, moved item from equipped to inventory and replace it with said item from inventory to equipped
        
        //save sessionAttributes to persistentAttributes
        attributesManager.setPersistentAttributes(sessionAttributes);
        await attributesManager.savePersistentAttributes();
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("to check your inventory, just say check inventory")
            .getResponse();
    }
}

const EquipItemAPIHandler = {
    
}

const RequestPositionIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RequestPositionIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const { position } = sessionAttributes.gameInfo;
        
        const speakOutput = `Your current position is at step ${position.toString()}.`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('What do you want to do next? You can say advance forward, go to shop or continue')
            .getResponse();
    }
};

const CheckCoinsIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CheckCoinsIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const { coinPouch } = sessionAttributes.gameInfo;
        
        const speakOutput = `You have ${coinPouch.toString()} coins.`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('What do you want to do next? You can say advance forward, go to shop or continue')
            .getResponse();
    }
};

const CheckLeaderboardIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LeaderboardIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let currentScore = sessionAttributes.gameInfo.numberOfMoves;
     
        let speakOutput = `So far you made a total of ${currentScore} moves in the game. `
        if (sessionAttributes.leaderboard) {
            speakOutput += ` Your best play through was completing the game in ${sessionAttributes.leaderboard} moves.`;
        } 
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('What move do you want to make next?.')
            .getResponse();
    }
};

///////////////////////////
// Dungeon Shop Handlers //
///////////////////////////

const data = require('./resources/shopItems.json');

const ShopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'OpenShopIntent';
    },
    handle(handlerInput) {

        return handlerInput.responseBuilder
            .addDirective({
                        type: 'Dialog.DelegateRequest',
                        target: 'AMAZON.Conversations',
                        period: {
                            until: 'EXPLICIT_RETURN' 
                        },
                        updatedRequest: {
                            type: 'Dialog.InputRequest',
                            input: {
                                name: 'welcome'
                            }
                        }
                    })
            .getResponse();
    }
};

const resolveEntity = function(resolvedEntity, slot) {

    //This is built in functionality with SDK Using Alexa's ER
    let erAuthorityResolution = resolvedEntity[slot].resolutions
        .resolutionsPerAuthority[0];
    let value = null;

    if (erAuthorityResolution.status.code === 'ER_SUCCESS_MATCH') {
        value = erAuthorityResolution.values[0].value.name;
    }
    console.log('Logging value inside resolveEntity function: ', value);
    return value;
};

const BuyAPIHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Dialog.API.Invoked'
            && handlerInput.requestEnvelope.request.apiRequest.name === 'API_BuyItem';
    },
    handle(handlerInput) {
        console.log("Inside the buyItem API handler.... ")
        const { attributesManager } = handlerInput;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const { gameInfo } = sessionAttributes;
        console.log("Inside the buyItem API handler.... ")
        const apiRequest = handlerInput.requestEnvelope.request.apiRequest;
        console.log("Inside the buyItem API handler.... ");
        
        let grade = resolveEntity(apiRequest.slots, "grade");
        console.log("grade is: ", grade);
        let type = resolveEntity(apiRequest.slots, "type");
        console.log("type is: ", type);
        
        let buyItem;

        const descriptionEntity = {};
        if (grade !== null && type !== null) {
            const key = `${grade}-${type}`;
            console.log("logging key for database: ", key);
            const databaseResponse = data[key];

            console.log("Response from mock database ", databaseResponse);
            
            descriptionEntity.buyItemResult = " is already bought. Find it in your inventory, you can access it when you leave the shop.";
            //descriptionEntity.value = databaseResponse.value;
            descriptionEntity.type = apiRequest.arguments.type;
            descriptionEntity.grade = apiRequest.arguments.grade;
            
            buyItem = databaseResponse;
        }
        //check if already in user inventory
        let purchased = gameInfo.inventory.some(obj => obj.SSET === buyItem.SSET)
        console.log("is item already purchased? :", purchased);
        if(purchased === false) { 
            if(buyItem && buyItem.value > gameInfo.coinPouch){
                console.log("not enough coins to buy. coin in pouch: ", gameInfo.coinPouch)
                descriptionEntity.buyItemResult = "cannot be bought. Not enough coins";
            } else if (buyItem && buyItem.value <= gameInfo.coinPouch) {
                console.log("Coin in pouch before purchase: ", gameInfo.coinPouch)
                sessionAttributes.gameInfo.coinPouch -= buyItem.value;
                console.log("You bought the item. coin in pouch after purchase: ", gameInfo.coinPouch)
                descriptionEntity.purchased = "Bought the item";
                sessionAttributes.gameInfo.inventory.push(buyItem);
                descriptionEntity.buyItemResult = " is now in your inventory, you can access it when you leave the shop.";
                
                //UNCHECK after confirming functionality
                // attributesManager.setPersistentAttributes(sessionAttributes);
                // await attributesManager.savePersistentAttributes();
            }
        } else {
            console.log("This item has already been purchased. Purchasing item: ", buyItem);
            descriptionEntity.purchased = "Item is already in your inventory.";
        }

        const response = buildSuccessApiResponse(descriptionEntity);
        console.log('GetRecommendationAPIHandler', JSON.stringify(response));

        return response;
    }
};

const ExitShopAPIHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Dialog.API.Invoked'
            && handlerInput.requestEnvelope.request.apiRequest.name === 'API_exitShop';
    },
    handle(handlerInput) {

        return {
            directives : [{
                type: 'Dialog.DelegateRequest',
                target: 'skill',
                period: {
                    until: 'EXPLICIT_RETURN'
                },
                updatedRequest: {
                    type: 'IntentRequest',
                    intent: {
                        name: 'ContinueIntent',
                    }
                }}],
                apiResponse :{}
        }
    }
};

const CanIBuyAPIHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Dialog.API.Invoked'
            && handlerInput.requestEnvelope.request.apiRequest.name === 'API_getCheckCoins';
    },
    handle(handlerInput) {
        const apiRequest = handlerInput.requestEnvelope.request.apiRequest;
        console.log("Inside the CanIBuyAPI handler.... ");
        
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const { gameInfo } = sessionAttributes;
        
        console.log(gameInfo);
        // let cost = resolveEntity(apiRequest.slots, "cost");
        // console.log("cost is: ", cost);
        let output;
        let coins = gameInfo.coinPouch;
        console.log("_coins: ", coins)
        // if (coins >= cost) {
           if (coins === 1) {
               console.log("1coins: ", coins)
                output = `You have ${coins.toString()} coin`;
           } else {
           console.log("2coins: ", coins)
           output = `You have ${coins.toString()} coins`;
           }
        // }
        const response = buildSuccessApiResponse(output);
        return response;
    }
}

const GetBuyItemDescriptionAPIHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Dialog.API.Invoked'
            && handlerInput.requestEnvelope.request.apiRequest.name === 'API_getShopItemInfo';
    },
    handle(handlerInput) {
        const apiRequest = handlerInput.requestEnvelope.request.apiRequest;
        console.log("Inside the getBuyItemDescription handler.... ");
        
        let grade = resolveEntity(apiRequest.slots, "grade");
        console.log("grade is: ", grade);
        let type = resolveEntity(apiRequest.slots, "type");
        console.log("type is: ", type);

        const descriptionEntity = {};
        if (grade !== null && type !== null) {
            const key = `${grade}-${type}`;
            console.log("logging key for database: ", key);
            const databaseResponse = data[key];

            console.log("Response from mock database ", databaseResponse);

            descriptionEntity.itemInfo = databaseResponse.itemInfo;
            descriptionEntity.type = apiRequest.arguments.type;
            descriptionEntity.grade = apiRequest.arguments.grade;
        }

        const response = buildSuccessApiResponse(descriptionEntity);
        console.log('GetRecommendationAPIHandler', JSON.stringify(response));

        return response;
    }
};
const buildSuccessApiResponse = (returnEntity) => {
    return { apiResponse: returnEntity };
};
const GetBuyItemPriceAPIHandler = {

    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Dialog.API.Invoked'
            && handlerInput.requestEnvelope.request.apiRequest.name === 'API_getItemPrice';
    },
    handle(handlerInput) {
        const apiRequest = handlerInput.requestEnvelope.request.apiRequest;
        console.log("Inside the getBuyItemDescription handler.... ");
        
        let grade = resolveEntity(apiRequest.slots, "grade");
        console.log("grade is: ", grade);
        let type = resolveEntity(apiRequest.slots, "type");
        console.log("type is: ", type);

        const descriptionEntity = {};
        if (grade !== null && type !== null) {
            const key = `${grade}-${type}`;
            console.log("logging key for database: ", key);
            const databaseResponse = data[key];

            console.log("Response from mock database ", databaseResponse);

            descriptionEntity.cost = databaseResponse.cost;
            descriptionEntity.type = apiRequest.arguments.type;
            descriptionEntity.grade = apiRequest.arguments.grade;
        }

        const response = buildSuccessApiResponse(descriptionEntity);
        console.log('GetRecommendationAPIHandler', JSON.stringify(response));

        return response;
    }
};


/////////////////////////////
// Default Helper Handlers //
/////////////////////////////

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say move forward. You can check you position by saying, where am I in the game? You can also check the shop to buy items. Say, go to shop. You can gain health by saying heal. Combat, healing and fleeing all cost a turn. Use these commands strategically.';

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
        const reason = handlerInput.requestEnvelope.request.reason;
        console.log("==== SESSION ENDED WITH REASON ======");
        console.log(reason); 
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
        const reason = handlerInput.requestEnvelope.request.reason;
        console.log("==== SESSION ENDED WITH REASON ======");
        console.log(reason); 

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * Interceptors
 * */
// const LoadAttributesRequestInterceptor = {
//     async process(handlerInput) {
//         const {attributesManager, requestEnvelope} = handlerInput;
//         if (Alexa.isNewSession(requestEnvelope)){ //is this a new session? this check is not enough if using auto-delegate (more on next module)
//             const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
//             console.log('Loading from persistent storage: ' + JSON.stringify(persistentAttributes));
//             //copy persistent attribute to session attributes
//             attributesManager.setSessionAttributes(persistentAttributes); // ALL persistent attributtes are now session attributes
//         }
//     }
// };

// // If you disable the skill and reenable it the userId might change and you loose the persistent attributes saved below as userId is the primary key
// const SaveAttributesResponseInterceptor = {
//     async process(handlerInput, response) {
//         if (!response) return; // avoid intercepting calls that have no outgoing response due to errors
//         const {attributesManager, requestEnvelope} = handlerInput;
//         const sessionAttributes = attributesManager.getSessionAttributes();
//         const shouldEndSession = (typeof response.shouldEndSession === "undefined" ? true : response.shouldEndSession); //is this a session end?
//         if (shouldEndSession || Alexa.getRequestType(requestEnvelope) === 'SessionEndedRequest') { // skill was stopped or timed out
//             // we increment a persistent session counter here
//             sessionAttributes['sessionCounter'] = sessionAttributes['sessionCounter'] ? sessionAttributes['sessionCounter'] + 1 : 1;
//             // we make ALL session attributes persistent
//             console.log('Saving to persistent storage:' + JSON.stringify(sessionAttributes));
//             attributesManager.setPersistentAttributes(sessionAttributes);
//             await attributesManager.savePersistentAttributes();
//         }
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
        NewGameIntentHandler,
        ContinueIntentHandler,
        //Move Navigators
        MoveTurnIntentHandler,
        EquipItemIntentHandler,
        RequestPositionIntentHandler,
        CheckCoinsIntentHandler,
        CheckLeaderboardIntentHandler,
        InitiateEncounterHandler,
        InBattleMoveTurnIntentHandler,
        AttackTurnIntentHandler,
        //Utilitiy Handlers,
        EscapeBattleIntentHandler,
        HealIntentHandler,
        BlockAttackIntentHandler,
        CheckInventoryIntentHandler,
        CheckHealthIntentHandler,
        //Shop Handlers
        BuyAPIHandler,
        CanIBuyAPIHandler,
        ShopIntentHandler,
        GetBuyItemDescriptionAPIHandler,
        GetBuyItemPriceAPIHandler,
        ExitShopAPIHandler,
        //Default Handlers
        ShopRedirectIntentHandler,
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
    .lambda();