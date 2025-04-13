// Main entry point for the skill
// This file will be used when deploying to AWS Lambda

// Import the required modules from the Alexa Skills Kit SDK
const Alexa = require('ask-sdk-core');
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');

// Import the handlers
const defaultHandlers = require('./handlers/defaultHandlers');
const storeItemIntentHandler = require('./handlers/storeItemIntentHandler');
const retrieveItemIntentHandler = require('./handlers/retrieveItemIntentHandler');
const directStatementIntentHandler = require('./handlers/directStatementIntentHandler');

// Define persistence adapter
// For Alexa-hosted skills, this will use the built-in S3 bucket
// When deployed to Alexa-hosted environment, these values will be automatically set
const tableName = process.env.DYNAMODB_PERSISTENCE_TABLE_NAME;
const s3BucketName = process.env.S3_PERSISTENCE_BUCKET;

// Function to determine the appropriate persistence adapter based on environment
function getPersistenceAdapter() {
    // First, try to use DynamoDB (preferred for production)
    if (tableName) {
        // If we have a table name, we're in an Alexa-hosted environment with DynamoDB
        console.log('Using DynamoDB persistence with table:', tableName);
        return new persistenceAdapter.DynamoDbPersistenceAdapter({
            tableName: tableName,
            createTable: true
        });
    }
    
    // Next, try to use S3 if available (also for Alexa-hosted skills)
    if (s3BucketName) {
        console.log('Using S3 persistence with bucket:', s3BucketName);
        return new persistenceAdapter.S3PersistenceAdapter({
            bucketName: s3BucketName
        });
    }
    
    // If neither is available, log a warning and return null (will use in-memory only)
    console.warn('No persistence adapter configuration found. Only session persistence will be used.');
    return undefined;
}

// Create the skill's handler function
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        defaultHandlers.LaunchRequestHandler,
        storeItemIntentHandler.StoreItemIntentHandler,
        storeItemIntentHandler.GetItemNameHandler,
        storeItemIntentHandler.GetItemLocationHandler,
        retrieveItemIntentHandler.RetrieveItemIntentHandler,
        retrieveItemIntentHandler.GetItemToRetrieveHandler,
        directStatementIntentHandler.DirectStoreIntentHandler,
        directStatementIntentHandler.DirectRetrieveIntentHandler,
        defaultHandlers.HelpIntentHandler,
        defaultHandlers.CancelAndStopIntentHandler,
        defaultHandlers.FallbackIntentHandler,
        defaultHandlers.SessionEndedRequestHandler,
        defaultHandlers.IntentReflectorHandler
    )
    .addErrorHandlers(
        defaultHandlers.ErrorHandler
    )
    .withPersistenceAdapter(getPersistenceAdapter())
    .withApiClient(new Alexa.DefaultApiClient())
    .withCustomUserAgent('hindi-item-locator/v1.0')
    .lambda();