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
                { AttributeName: "subscriptionID", AttributeType: "S" },
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
            },
            GlobalSecondaryIndexes: [
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
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
            },
            GlobalSecondaryIndexes: [
                {
                    IndexName: "SenderIndex",
                    KeySchema: [
                        { AttributeName: "customerID", KeyType: "HASH" },
                        { AttributeName: "pageID", KeyType: "RANGE" },
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
            TableName: "TokenUsageRBC",
            KeySchema: [
                { AttributeName: "usageID", KeyType: "HASH" }, // UUID, khóa phân vùng
                { AttributeName: "timestamp", KeyType: "RANGE" }, // Sắp xếp theo thời gian
            ],
            AttributeDefinitions: [
                { AttributeName: "usageID", AttributeType: "S" }, // UUID
                { AttributeName: "timestamp", AttributeType: "S" }, // ISO 8601, ví dụ: "2025-05-27T10:00:00Z"
                { AttributeName: "customerID", AttributeType: "S" },
                { AttributeName: "pageID", AttributeType: "S" },
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
            },
            GlobalSecondaryIndexes: [
                {
                    IndexName: "CustomerPageIndex",
                    KeySchema: [
                        { AttributeName: "customerID", KeyType: "HASH" },
                        { AttributeName: "pageID", KeyType: "RANGE" },
                    ],
                    Projection: {
                        ProjectionType: "INCLUDE",
                        NonKeyAttributes: ["prompt_tokens", "completion_tokens", "timestamp"]
                    },
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