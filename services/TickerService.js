
const DynamoDBService = require('./DynamoDBService');

const TickerService = {
    logChange: async (message) => {
        await DynamoDBService.logChange(message);
    },
    getLogs: () => {
        return DynamoDBService.getLogs();
    }
};

module.exports = TickerService;
