const { CreateTableCommand, ListTablesCommand } = require("@aws-sdk/client-dynamodb");
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
                    IndexName: "PageIndex",
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
                { AttributeName: "usageID", KeyType: "HASH" },
                { AttributeName: "timestamp", KeyType: "RANGE" },
            ],
            AttributeDefinitions: [
                { AttributeName: "usageID", AttributeType: "S" },
                { AttributeName: "timestamp", AttributeType: "S" },
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

    // Lấy danh sách tất cả bảng hiện có trong DynamoDB
    try {
        const listTables = await dbConnection.send(new ListTablesCommand({}));
        const existingTables = listTables.TableNames || [];

        // Tạo danh sách các bảng đã có sẵn và chưa có sẵn
        const tablesToCreate = tables.map(table => table.TableName);
        const alreadyExisting = tablesToCreate.filter(tableName => existingTables.includes(tableName));
        const notExisting = tablesToCreate.filter(tableName => !existingTables.includes(tableName));

        // Ghi log một lần duy nhất
        logger.info(`Existing tables: ${alreadyExisting.length > 0 ? alreadyExisting.join(', ') : 'None'}`);
        logger.info(`Tables to be created: ${notExisting.length > 0 ? notExisting.join(', ') : 'None'}`);

        // Tiến hành tạo bảng
        for (const table of tables) {
            try {
                await dynamoDB.send(new CreateTableCommand(table));
                logger.info(`Table ${table.TableName} created successfully`);
                await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds for table to be ready
            } catch (error) {
                if (error.name === "ResourceInUseException") {
                    // Bỏ qua vì đã ghi log trước đó
                } else {
                    logger.error(`Error creating table ${table.TableName}: ${error.message}`, {
                        stack: error.stack,
                    });
                    throw error;
                }
            }
        }
    } catch (error) {
        logger.error("Error listing tables or creating tables:", { stack: error.stack });
        throw error;
    }
}

// Gọi setupTables ngay khi module được import
setupTables().catch((err) => {
    logger.error("Error initializing tables:", { stack: err.stack });
});

module.exports = {
    dynamoDB,
};