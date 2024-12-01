
const AWS = require('aws-sdk');
const config = require('../config.json');

AWS.config.update({
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    sessionToken: config.AWS_SESSION_TOKEN,
    region: config.AWS_REGION
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = config.DYNAMODB_TABLE_NAME_CHAT;

const DynamoDBServiceChat = {
    chatChange: async (message, user) => {
        const params = {
            TableName: tableName,
            Item: {
                id: Date.now().toString(), // Unique ID
                message: message,
                user: user,
                timestamp: new Date().toISOString(), // ISO format for easy sorting
            }
        };
        return dynamoDB.put(params).promise();
    },
    getChats: async () => {
        const params = {
            TableName: tableName,
            // Limit: 100, // Limit to 10 items
            ScanIndexForward: false, // Retrieve in descending order (latest first)
        };

        const data = await dynamoDB.scan(params).promise();
        // Sort the items by timestamp descending, if not using a sort key
        return data.Items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
};

module.exports = DynamoDBServiceChat;