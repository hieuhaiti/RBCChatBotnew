const {
    DynamoDBClient,
    CreateTableCommand,
} = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const dynamoDB = DynamoDBDocumentClient.from(client);

// Hàm tạo các bảng
async function setupTables() {
    const tables = [
        {
            TableName: "TokenUsage",
            KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
            AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
            ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
        {
            TableName: "Customers",
            KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
            AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
            ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
        {
            TableName: "Prompts",
            KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
            AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
            ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
        {
            TableName: "FAQs",
            KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
            AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
            ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
    ];

    for (const table of tables) {
        try {
            await client.send(new CreateTableCommand(table));
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Đợi 5 giây để bảng sẵn sàng
        } catch (error) {
            if (error.name === "ResourceInUseException") {
            } else {
                logger.error(
                    `Lỗi khi thiết lập bảng ${table.TableName}: ${error.message}`,
                    { stack: error.stack }
                );
                throw error;
            }
        }
    }
}

// Gọi setupTables ngay khi module được import
setupTables().catch((err) => {
    logger.error("Lỗi khởi tạo bảng:", { stack: err.stack });
});

module.exports = {
    dynamoDB,
};