# Hindi Item Locator Alexa Skill

This package contains a complete Hindi language Alexa skill for remembering and retrieving the locations of items.

## How to Import this Skill

1. Go to the [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)
2. Click "Create Skill"
3. Enter "Hindi Item Locator" for the skill name
4. Select "Hindi (IN)" as the primary language
5. Choose "Custom" model
6. Select "Alexa-Hosted (Node.js)" for hosting
7. Click "Import skill" instead of choosing a template
8. Upload the .zip file that contains this directory structure
9. Wait for the import process to complete

## Key Features

- Natural Hindi language support
- Multiple conversation flows (direct statements, guided dialogues)
- Persistence using S3 or DynamoDB (automatically set up with Alexa-hosted skills)
- Handles spelling and phrasing variations in Hindi
- Comprehensive error handling

## Testing the Skill

In the Alexa Developer Console:
1. Once imported, navigate to the "Test" tab
2. Enable testing in "Development" mode
3. Try the following Hindi commands:
   - "याद रखना" (to start storage flow)
   - "मैंने चाबी मेज पर रखी है" (direct storage)
   - "तुम्हें याद है" (to start retrieval flow)
   - "चाबी कहां है" (direct retrieval)

## File Structure

- `/lambda` - Contains the Node.js code for the skill
- `/skill-package` - Contains the skill manifest and interaction models
