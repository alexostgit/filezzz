
const DynamoDBService = require('./DynamoDBService');

const TickerService = {
    logChange: async (message, action, user) => {
        await DynamoDBService.logChange(message, action, user);
    },
    getLogs: () => {
        return DynamoDBService.getLogs();
    }
};

module.exports = TickerService;
