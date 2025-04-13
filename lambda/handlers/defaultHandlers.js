const Alexa = require('ask-sdk-core');

/**
 * Handler for launch requests
 */
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'नमस्ते! मैं आपकी चीज़ें खोजने में मदद कर सकता हूँ। आप मुझसे अपनी चीज़ों को याद रखने के लिए कह सकते हैं, या मुझसे पूछ सकते हैं कि आपने कोई चीज़ कहां रखी थी।';
        // Translation: "Hello! I can help you find your items. You can ask me to remember your items, or ask me where you put something."
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * Handler for help intent
 */
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'आप मुझसे अपनी चीज़ें याद रखने के लिए कह सकते हैं, जैसे "याद रखना", या आप पूछ सकते हैं "मेरी चाबी कहां है"। मैं आपको बताऊंगा कि आपने उन्हें कहां रखा था।';
        // Translation: "You can ask me to remember your items, like 'remember this', or you can ask 'where are my keys'. I'll tell you where you put them."

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * Handler for cancel and stop intents
 */
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'अलविदा!';
        // Translation: "Goodbye!"
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

/**
 * Handler for fallback intent
 */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'क्षमा करें, मुझे समझ नहीं आया। आप मुझसे अपनी चीज़ें याद रखने के लिए कह सकते हैं, या पूछ सकते हैं कि आपने कोई चीज़ कहां रखी थी।';
        // Translation: "Sorry, I didn't understand. You can ask me to remember your items, or ask where you put something."

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * Handler for session ended requests
 */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here
        return handlerInput.responseBuilder.getResponse();
    }
};

/**
 * Handler for reflecting intents (catch-all for unhandled intents)
 * This is useful for debugging
 */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `आपने ${intentName} इंटेंट ट्रिगर किया है`;
        // Translation: "You triggered the {intentName} intent"
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

/**
 * Generic error handling
 */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = 'क्षमा करें, कुछ गड़बड़ हो गई। कृपया बाद में पुनः प्रयास करें।';
        // Translation: "Sorry, something went wrong. Please try again later."
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

module.exports = {
    LaunchRequestHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler,
    ErrorHandler
};
