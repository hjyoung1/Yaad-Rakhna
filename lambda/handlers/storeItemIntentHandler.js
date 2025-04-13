const Alexa = require('ask-sdk-core');
const itemStorage = require('../utils/itemStorage');

/**
 * Handler for the StoreItemIntent
 * Triggered when the user says "Alexa yaad rakhna"
 */
const StoreItemIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StoreItemIntent';
    },
    handle(handlerInput) {
        // Set the conversation state to collecting the item name
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.conversationState = 'COLLECTING_ITEM_NAME';
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        
        const speakOutput = 'क्या याद रखना है?'; // "What should I remember?"
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * Handler for collecting the item name
 * Triggered in response to the user providing an item name during the storage flow
 */
const GetItemNameHandler = {
    canHandle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'ItemNameIntent' 
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent')
            && sessionAttributes.conversationState === 'COLLECTING_ITEM_NAME';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let itemName;
        
        // Try to get the item name from the slot
        if (Alexa.getIntentName(handlerInput.requestEnvelope) === 'ItemNameIntent') {
            const slots = handlerInput.requestEnvelope.request.intent.slots;
            if (slots.ItemName && slots.ItemName.value) {
                itemName = slots.ItemName.value;
            } else {
                // If no item was provided through the slot, try to use the raw utterance
                itemName = handlerInput.requestEnvelope.request.intent.slots.ItemName.value || 
                           'चीज़'; // Default to "thing" if we couldn't understand
            }
        } else {
            // If fallback intent was triggered, use the raw utterance as the item name
            itemName = handlerInput.requestEnvelope.request.intent.slots?.rawValue || 
                       'चीज़'; // Default to "thing" if we couldn't understand
        }
        
        // Store the item name temporarily and update conversation state
        sessionAttributes.currentItemName = itemName;
        sessionAttributes.conversationState = 'COLLECTING_ITEM_LOCATION';
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        
        const speakOutput = `कहां रखा है ${itemName}?`; // "Where did you put the [item]?"
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * Handler for collecting the item location
 * Triggered in response to the user providing a location during the storage flow
 */
const GetItemLocationHandler = {
    canHandle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'ItemLocationIntent' 
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent')
            && sessionAttributes.conversationState === 'COLLECTING_ITEM_LOCATION';
    },
    async handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const itemName = sessionAttributes.currentItemName;
        let itemLocation;
        
        // Try to get the location from the slot
        if (Alexa.getIntentName(handlerInput.requestEnvelope) === 'ItemLocationIntent') {
            const slots = handlerInput.requestEnvelope.request.intent.slots;
            if (slots.ItemLocation && slots.ItemLocation.value) {
                itemLocation = slots.ItemLocation.value;
            } else {
                // If no location was provided through the slot, try to use the raw utterance
                itemLocation = handlerInput.requestEnvelope.request.intent.slots.ItemLocation.value || 
                               'कहीं'; // Default to "somewhere" if we couldn't understand
            }
        } else {
            // If fallback intent was triggered, use the raw utterance as the location
            itemLocation = handlerInput.requestEnvelope.request.intent.slots?.rawValue || 
                           'कहीं'; // Default to "somewhere" if we couldn't understand
        }
        
        // Store the item and its location (in both session and persistent storage)
        await itemStorage.storeItem(handlerInput, itemName, itemLocation);
        
        // Clear the temporary storage and conversation state
        delete sessionAttributes.currentItemName;
        delete sessionAttributes.conversationState;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        
        const speakOutput = `ठीक है, मैंने याद कर लिया है कि ${itemName} ${itemLocation} में रखा है।`; // "Okay, I've remembered that [item] is in [location]."
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

module.exports = {
    StoreItemIntentHandler,
    GetItemNameHandler,
    GetItemLocationHandler
};
