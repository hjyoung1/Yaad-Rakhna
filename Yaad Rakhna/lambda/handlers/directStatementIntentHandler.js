const Alexa = require('ask-sdk-core');
const itemStorage = require('../utils/itemStorage');

/**
 * Handler for the DirectStoreIntent
 * Triggered when the user says something like "Alexa maine [item] [location] me rakha hai yaad rakhna"
 */
const DirectStoreIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DirectStoreIntent';
    },
    async handle(handlerInput) {
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        
        let itemName, itemLocation;
        
        // Extract item name and location from slots
        if (slots.ItemName && slots.ItemName.value) {
            itemName = slots.ItemName.value;
        } else {
            // Default if we couldn't understand the item name
            itemName = 'कुछ'; // "something"
        }
        
        if (slots.ItemLocation && slots.ItemLocation.value) {
            itemLocation = slots.ItemLocation.value;
        } else {
            // Default if we couldn't understand the location
            itemLocation = 'कहीं'; // "somewhere"
        }
        
        // Log for debugging
        console.log(`DirectStoreIntent: Storing item "${itemName}" at location "${itemLocation}"`);
        
        // Store the item and its location (in both session and persistent storage)
        await itemStorage.storeItem(handlerInput, itemName, itemLocation);
        
        // Get the appropriate response based on gender/form of the item (common in Hindi)
        // For example, "चाबी रखी है" vs "चश्मा रखा है" (different verb forms)
        let verbForm = "रखा है";
        if (itemName.match(/(चाबी|किताब|कॉपी|घड़ी|दवाई|खारी)/i)) {
            verbForm = "रखी है";
        }
        
        const speakOutput = `ठीक है, मैंने याद कर लिया है कि ${itemName} ${itemLocation} में ${verbForm}।`; // "Okay, I've remembered that [item] is in [location]."
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

/**
 * Handler for the DirectRetrieveIntent
 * Triggered when the user says something like "Alexa maine [item] kaha rakha tha"
 */
const DirectRetrieveIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DirectRetrieveIntent';
    },
    async handle(handlerInput) {
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        
        let itemName;
        
        // Extract item name from slots
        if (slots.ItemName && slots.ItemName.value) {
            itemName = slots.ItemName.value;
            
            // Log for debugging
            console.log(`DirectRetrieveIntent: Looking for item "${itemName}"`);
        } else {
            // Default response if we couldn't understand the item name
            console.log('DirectRetrieveIntent: No item name provided');
            return handlerInput.responseBuilder
                .speak('क्षमा करें, मुझे समझ नहीं आया कि आप किस वस्तु के बारे में पूछ रहे हैं।') // "Sorry, I didn't understand which item you're asking about."
                .reprompt('आप क्या खोज रहे हैं?') // "What are you looking for?"
                .getResponse();
        }
        
        // Special case for testing with "khari" (खारी)
        if (itemName.toLowerCase() === 'खारी' || itemName.toLowerCase() === 'khari') {
            console.log('DirectRetrieveIntent: Processing special case for "khari"');
            
            // Get any possible location from session storage
            const { attributesManager } = handlerInput;
            const sessionAttributes = attributesManager.getSessionAttributes();
            
            // Check if we have a location for "khari" in session storage
            if (sessionAttributes.items && sessionAttributes.items['खारी']) {
                const location = sessionAttributes.items['खारी'];
                return handlerInput.responseBuilder
                    .speak(`आपने खारी ${location} में रखी है।`)
                    .getResponse();
            }
        }
        
        // Look up the item location in both session and persistent storage
        const itemLocation = await itemStorage.getItemLocation(handlerInput, itemName);
        
        // Log the result
        console.log(`DirectRetrieveIntent: Item location result: ${itemLocation || 'not found'}`);
        
        let speakOutput;
        if (itemLocation) {
            // Get the appropriate response based on gender/form of the item (common in Hindi)
            let verbForm = "रखा था";
            if (itemName.match(/(चाबी|किताब|कॉपी|घड़ी|दवाई|खारी)/i)) {
                verbForm = "रखी थी";
            }
            
            speakOutput = `आपने ${itemName} ${itemLocation} में ${verbForm}।`; // "You put [item] in [location]."
        } else {
            speakOutput = `मुझे याद नहीं है कि आपने ${itemName} कहां रखा था। क्या आप मुझे बताना चाहेंगे?`; // "I don't remember where you put [item]. Would you like to tell me?"
        }
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

module.exports = {
    DirectStoreIntentHandler,
    DirectRetrieveIntentHandler
};
