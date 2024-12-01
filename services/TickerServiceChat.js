
const DynamoDBServiceChat = require('./DynamoDBServiceChat');

const TickerServiceChat = {
    chatChange: async (message, user) => {
        await DynamoDBServiceChat.chatChange(message, user);
    },
    getChats: () => {
        return DynamoDBServiceChat.getChats();
    }
};

module.exports = TickerServiceChat;
