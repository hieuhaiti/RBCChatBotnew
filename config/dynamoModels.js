const { CreateTableCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const dbConnection = require("./db");
const logger = require("../service/utils/Logger");

const dynamoDB = DynamoDBDocumentClient.from(dbConnection);

// Hàm tạo các bảng
async function setupTables() {
    const tables = [
        {
            TableName: "UsersRBC",
            KeySchema: [
                { AttributeName: "userID", KeyType: "HASH" },
            ],
            AttributeDefinitions: [
                { AttributeName: "userID", AttributeType: "S" },
                { AttributeName: "email", AttributeType: "S" },
                { AttributeName: "subscriptionID", AttributeType: "S" },
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
            },
            GlobalSecondaryIndexes: [
                {
                    IndexName: "EmailIndex",
                    KeySchema: [
                        { AttributeName: "email", KeyType: "HASH" },
                    ],
                    Projection: { ProjectionType: "ALL" },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5,
                    },
                },
                {
                    IndexName: "SubscriptionIndex",
                    KeySchema: [
                        { AttributeName: "subscriptionID", KeyType: "HASH" },
                    ],
                    Projection: { ProjectionType: "ALL" },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5,
                    },
                },
            ],
        },
        {
            TableName: "CustomersRBC",
            KeySchema: [
                { AttributeName: "customerID", KeyType: "HASH" },
                { AttributeName: "pageID", KeyType: "RANGE" },
            ],
            AttributeDefinitions: [
                { AttributeName: "customerID", AttributeType: "S" },
                { AttributeName: "pageID", AttributeType: "S" },
                { AttributeName: "senderID", AttributeType: "S" },
                { AttributeName: "lastInteraction", AttributeType: "S" },
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
            },
            GlobalSecondaryIndexes: [
                {
                    IndexName: "SenderIndex",
                    KeySchema: [
                        { AttributeName: "senderID", KeyType: "HASH" },
                        { AttributeName: "pageID", KeyType: "RANGE" },
                    ],
                    Projection: { ProjectionType: "ALL" },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5,
                    },
                },
                {
                    IndexName: "PageInteractionIndex",
                    KeySchema: [
                        { AttributeName: "pageID", KeyType: "HASH" },
                        { AttributeName: "lastInteraction", KeyType: "RANGE" },
                    ],
                    Projection: { ProjectionType: "ALL" },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5,
                    },
                },
            ],
        },
        {
            TableName: "SubscriptionsRBC",
            KeySchema: [
                { AttributeName: "subscriptionID", KeyType: "HASH" },
            ],
            AttributeDefinitions: [
                { AttributeName: "subscriptionID", AttributeType: "S" },
                { AttributeName: "userID", AttributeType: "S" },
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
            },
            GlobalSecondaryIndexes: [
                {
                    IndexName: "UserIndex",
                    KeySchema: [
                        { AttributeName: "userID", KeyType: "HASH" },
                    ],
                    Projection: { ProjectionType: "ALL" },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5,
                    },
                },

            ],
        },
        {
            TableName: "PagesRBC",
            KeySchema: [
                { AttributeName: "pageID", KeyType: "HASH" },
                { AttributeName: "userID", KeyType: "RANGE" },
            ],
            AttributeDefinitions: [
                { AttributeName: "pageID", AttributeType: "S" },
                { AttributeName: "userID", AttributeType: "S" },

            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
            },
            GlobalSecondaryIndexes: [
                {
                    IndexName: "UserIndex",
                    KeySchema: [
                        { AttributeName: "userID", KeyType: "HASH" },
                    ],
                    Projection: { ProjectionType: "ALL" },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5,
                    },
                }
            ],
        },
        {
            TableName: "AssistantsRBC",
            KeySchema: [
                { AttributeName: "assistantID", KeyType: "HASH" },
                { AttributeName: "userID", KeyType: "RANGE" },
            ],
            AttributeDefinitions: [
                { AttributeName: "assistantID", AttributeType: "S" },
                { AttributeName: "userID", AttributeType: "S" },
                { AttributeName: "pageID", AttributeType: "S" },
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
            },
            GlobalSecondaryIndexes: [
                {
                    IndexName: "UserIndex",
                    KeySchema: [
                        { AttributeName: "userID", KeyType: "HASH" },
                    ],
                    Projection: { ProjectionType: "ALL" },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5,
                    },
                },
                {
                    IndexName: "PageIndex",
                    KeySchema: [
                        { AttributeName: "pageID", KeyType: "HASH" },
                    ],
                    Projection: { ProjectionType: "ALL" },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5,
                    },
                },
            ],
        },

        {
            TableName: "TokenUsageRBC",
            KeySchema: [
                { AttributeName: "usageID", KeyType: "HASH" },
                { AttributeName: "userID", KeyType: "RANGE" },
            ],
            AttributeDefinitions: [
                { AttributeName: "usageID", AttributeType: "S" },
                { AttributeName: "userID", AttributeType: "S" },
                { AttributeName: "subscriptionID", AttributeType: "S" },
                { AttributeName: "timestamp", AttributeType: "S" },
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
            },
            GlobalSecondaryIndexes: [
                {
                    IndexName: "UserTimestampIndex",
                    KeySchema: [
                        { AttributeName: "userID", KeyType: "HASH" },
                        { AttributeName: "timestamp", KeyType: "RANGE" },
                    ],
                    Projection: { ProjectionType: "ALL" },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5,
                    },
                },
                {
                    IndexName: "SubscriptionIndex",
                    KeySchema: [
                        { AttributeName: "subscriptionID", KeyType: "HASH" },
                    ],
                    Projection: { ProjectionType: "ALL" },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5,
                    },
                },
            ],
        },
        {
            TableName: "FAQsRBC",
            KeySchema: [
                { AttributeName: "faqID", KeyType: "HASH" },
                { AttributeName: "assistantID", KeyType: "RANGE" },
            ],
            AttributeDefinitions: [
                { AttributeName: "faqID", AttributeType: "S" },
                { AttributeName: "assistantID", AttributeType: "S" },
                { AttributeName: "pageID", AttributeType: "S" },
                { AttributeName: "priority", AttributeType: "N" },
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
            },
            GlobalSecondaryIndexes: [
                {
                    IndexName: "AssistantPriorityIndex",
                    KeySchema: [
                        { AttributeName: "assistantID", KeyType: "HASH" },
                        { AttributeName: "priority", KeyType: "RANGE" },
                    ],
                    Projection: { ProjectionType: "ALL" },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5,
                    },
                },
                {
                    IndexName: "PageIndex",
                    KeySchema: [
                        { AttributeName: "pageID", KeyType: "HASH" },
                    ],
                    Projection: { ProjectionType: "ALL" },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5,
                    },
                },
            ],
        },
    ];

    for (const table of tables) {
        try {
            await dynamoDB.send(new CreateTableCommand(table));
            logger.info(`Table ${table.TableName} created successfully`);
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds for table to be ready
        } catch (error) {
            if (error.name === "ResourceInUseException") {
                logger.info(`Table ${table.TableName} already exists, skipping creation`);
            } else {
                logger.error(`Error creating table ${table.TableName}: ${error.message}`, {
                    stack: error.stack,
                });
                throw error;
            }
        }
    }
}

// Gọi setupTables ngay khi module được import
setupTables().catch((err) => {
    logger.error("Error initializing tables:", { stack: err.stack });
});

module.exports = {
    dynamoDB,
};