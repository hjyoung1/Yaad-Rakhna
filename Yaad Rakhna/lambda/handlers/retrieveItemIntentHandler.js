const Alexa = require('ask-sdk-core');
const itemStorage = require('../utils/itemStorage');

/**
 * Handler for the RetrieveItemIntent
 * Triggered when the user asks something like "Alexa tujhe yaad hai kya"
 */
const RetrieveItemIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RetrieveItemIntent';
    },
    handle(handlerInput) {
        // Set the conversation state to collecting the item to retrieve
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.conversationState = 'COLLECTING_ITEM_TO_RETRIEVE';
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        
        const speakOutput = 'क्या याद है?'; // "What should I remember?"
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * Handler for collecting the item to retrieve
 * Triggered in response to the user providing an item name during the retrieval flow
 */
const GetItemToRetrieveHandler = {
    canHandle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'ItemNameIntent' 
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent')
            && sessionAttributes.conversationState === 'COLLECTING_ITEM_TO_RETRIEVE';
    },
    async handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let itemName;
        
        // Try to get the item name from the slot
        if (Alexa.getIntentName(handlerInput.requestEnvelope) === 'ItemNameIntent') {
            const slots = handlerInput.requestEnvelope.request.intent.slots;
            if (slots.ItemName && slots.ItemName.value) {
                itemName = slots.ItemName.value;
            } else {
                // Use the raw utterance if we can't extract from slots
                itemName = handlerInput.requestEnvelope.request.intent.slots.ItemName?.value || '';
            }
        } else {
            // If fallback intent was triggered, use the raw utterance as the item name
            itemName = handlerInput.requestEnvelope.request.intent.slots?.rawValue || '';
        }
        
        // Clear the conversation state
        delete sessionAttributes.conversationState;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        
        // Look up the item location in both session and persistent storage
        const itemLocation = await itemStorage.getItemLocation(handlerInput, itemName);
        
        let speakOutput;
        if (itemLocation) {
            speakOutput = `आपने ${itemName} ${itemLocation} में रखा था।`; // "You put [item] in [location]."
        } else {
            speakOutput = `मुझे याद नहीं है कि आपने ${itemName} कहां रखा था। क्या आप मुझे बताना चाहेंगे?`; // "I don't remember where you put [item]. Would you like to tell me?"
        }
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

module.exports = {
    RetrieveItemIntentHandler,
    GetItemToRetrieveHandler
};
