/**
 * Utility functions for storing and retrieving items
 * Supports both session-based storage and persistent storage via DynamoDB (when available)
 */

// In-memory storage for web testing (when persistence is unavailable)
const globalItemStorage = {
    items: {}
};

/**
 * Normalizes item names for consistent lookup
 * Handles common spelling variations and cleans the string
 * @param {string} itemName - The raw item name
 * @returns {string} The normalized item name
 */
const normalizeItemName = (itemName) => {
    if (!itemName) return '';
    
    let normalized = itemName.toLowerCase().trim();
    
    // Handle "khari"/"khaari" and similar variations
    if (normalized === 'khari' || 
        normalized === 'khadi' || 
        normalized === 'khaari' || 
        normalized === 'khaadi' ||
        normalized === 'खारी' || 
        normalized === 'खड़ी' || 
        normalized === 'खरी' || 
        normalized === 'खडी') {
        return 'खारी';
    }
    
    // Handle possessive prefixes
    normalized = normalized.replace(/^(मेरा|मेरी|अपना|अपनी|mera|meri|apna|apni)\s+/i, '');
    
    return normalized;
};

/**
 * Stores an item and its location in the session and optionally in persistent storage
 * @param {Object} handlerInput - The Alexa handler input object
 * @param {string} itemName - The name of the item to store
 * @param {string} itemLocation - The location where the item is stored
 * @returns {Promise<void>}
 */
const storeItem = async (handlerInput, itemName, itemLocation) => {
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    
    // Normalize item name and location for consistent lookup
    const normalizedItemName = normalizeItemName(itemName);
    const normalizedLocation = itemLocation.toLowerCase().trim();
    
    console.log(`Storing item "${normalizedItemName}" at location "${normalizedLocation}"`);
    
    // Ensure we have an items object
    if (!sessionAttributes.items) {
        sessionAttributes.items = {};
    }
    
    // Store the item in session
    sessionAttributes.items[normalizedItemName] = normalizedLocation;
    attributesManager.setSessionAttributes(sessionAttributes);
    
    // Also store in global storage for web testing
    globalItemStorage.items[normalizedItemName] = normalizedLocation;
    
    // Attempt to get the persistent attributes (if available)
    try {
        // Get the userId from the requestEnvelope
        const userId = handlerInput.requestEnvelope.session.user.userId;
        
        // Attempt to get persistent attributes
        const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
        
        // Ensure we have a users object
        if (!persistentAttributes.users) {
            persistentAttributes.users = {};
        }
        
        // Ensure we have a user entry
        if (!persistentAttributes.users[userId]) {
            persistentAttributes.users[userId] = { items: {} };
        }
        
        // Store the item in persistent storage
        persistentAttributes.users[userId].items[normalizedItemName] = normalizedLocation;
        
        // Save the persistent attributes
        attributesManager.setPersistentAttributes(persistentAttributes);
        await attributesManager.savePersistentAttributes();
    } catch (error) {
        // Silently fail if persistent storage is not available
        console.log('Warning: Could not save to persistent storage - ', error.message);
    }
};

/**
 * Retrieves the location of an item from storage
 * First checks session storage, then falls back to persistent storage if available
 * @param {Object} handlerInput - The Alexa handler input object
 * @param {string} itemName - The name of the item to retrieve
 * @returns {Promise<string|null>} The location of the item, or null if not found
 */
const getItemLocation = async (handlerInput, itemName) => {
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const normalizedItemName = normalizeItemName(itemName);
    
    console.log(`Looking for item "${normalizedItemName}" (original: "${itemName}")`);
    
    // First check session storage
    if (sessionAttributes.items && sessionAttributes.items[normalizedItemName]) {
        console.log(`Item found in session storage at "${sessionAttributes.items[normalizedItemName]}"`);
        return sessionAttributes.items[normalizedItemName];
    }
    
    // If not in session, check global memory storage (for web testing)
    if (globalItemStorage.items && globalItemStorage.items[normalizedItemName]) {
        const location = globalItemStorage.items[normalizedItemName];
        console.log(`Item found in global storage at "${location}"`);
        
        // Add to session for future lookups
        if (!sessionAttributes.items) {
            sessionAttributes.items = {};
        }
        sessionAttributes.items[normalizedItemName] = location;
        attributesManager.setSessionAttributes(sessionAttributes);
        
        return location;
    }
    
    // If not in memory, try persistent storage
    try {
        // Get the userId from the requestEnvelope
        const userId = handlerInput.requestEnvelope.session.user.userId;
        
        // Attempt to get persistent attributes
        const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
        
        // Check if we have this item in persistent storage
        if (persistentAttributes.users && 
            persistentAttributes.users[userId] && 
            persistentAttributes.users[userId].items && 
            persistentAttributes.users[userId].items[normalizedItemName]) {
            
            // Found in persistent storage, also add to session for faster future lookups
            if (!sessionAttributes.items) {
                sessionAttributes.items = {};
            }
            
            const location = persistentAttributes.users[userId].items[normalizedItemName];
            sessionAttributes.items[normalizedItemName] = location;
            attributesManager.setSessionAttributes(sessionAttributes);
            
            console.log(`Item found in persistent storage at "${location}"`);
            return location;
        }
    } catch (error) {
        // Silently fail if persistent storage is not available
        console.log('Warning: Could not retrieve from persistent storage - ', error.message);
    }
    
    // Item not found
    console.log(`Item "${normalizedItemName}" not found in any storage`);
    return null;
};

/**
 * Lists all stored items and their locations
 * Combines items from both session and persistent storage
 * @param {Object} handlerInput - The Alexa handler input object
 * @returns {Promise<Array>} An array of {item, location} objects
 */
const getAllItems = async (handlerInput) => {
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const result = [];
    
    // Get items from session
    if (sessionAttributes.items) {
        for (const [item, location] of Object.entries(sessionAttributes.items)) {
            result.push({ item, location });
        }
    }
    
    // Try to get items from persistent storage
    try {
        // Get the userId from the requestEnvelope
        const userId = handlerInput.requestEnvelope.session.user.userId;
        
        // Attempt to get persistent attributes
        const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
        
        // Add items from persistent storage (if not already in result)
        if (persistentAttributes.users && 
            persistentAttributes.users[userId] && 
            persistentAttributes.users[userId].items) {
            
            const persistentItems = persistentAttributes.users[userId].items;
            const existingItems = new Set(result.map(item => item.item));
            
            for (const [item, location] of Object.entries(persistentItems)) {
                // Only add if not already in the result
                if (!existingItems.has(item)) {
                    result.push({ item, location });
                }
            }
        }
    } catch (error) {
        // Silently fail if persistent storage is not available
        console.log('Warning: Could not retrieve all items from persistent storage - ', error.message);
    }
    
    return result;
};

/**
 * Clears all stored items for the current user
 * @param {Object} handlerInput - The Alexa handler input object
 * @returns {Promise<void>}
 */
const clearAllItems = async (handlerInput) => {
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    
    // Clear session items
    sessionAttributes.items = {};
    attributesManager.setSessionAttributes(sessionAttributes);
    
    // Try to clear persistent storage
    try {
        // Get the userId from the requestEnvelope
        const userId = handlerInput.requestEnvelope.session.user.userId;
        
        // Attempt to get persistent attributes
        const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
        
        // Remove the user's items
        if (persistentAttributes.users && persistentAttributes.users[userId]) {
            persistentAttributes.users[userId].items = {};
            
            // Save the changes
            attributesManager.setPersistentAttributes(persistentAttributes);
            await attributesManager.savePersistentAttributes();
        }
    } catch (error) {
        // Silently fail if persistent storage is not available
        console.log('Warning: Could not clear items in persistent storage - ', error.message);
    }
};

module.exports = {
    storeItem,
    getItemLocation,
    getAllItems,
    clearAllItems
};
