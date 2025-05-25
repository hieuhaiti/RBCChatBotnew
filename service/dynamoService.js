const {
    ScanCommand,
    GetCommand,
    PutCommand,
    DeleteCommand,
    QueryCommand
} = require("@aws-sdk/lib-dynamodb");

const { dynamoDB } = require("../config/dynamoModels");

// const tableNames = [
//     "UsersRBC",
//     "SubscriptionsRBC",
//     "PagesRBC",
//     "AssistantsRBC",
//     "CustomersRBC",
//     "TokenUsageRBC",
//     "FAQsRBC",
//   ];


/**
 * Lấy một item theo khóa chính
 */
async function getItem(tableName, key) {
    const params = {
        TableName: tableName,
        Key: key,
    };
    const result = await dynamoDB.send(new GetCommand(params));
    return result.Item;
}

/**
 * Thêm hoặc cập nhật một item
 */
async function putItem(tableName, item) {
    const params = {
        TableName: tableName,
        Item: item,
    };
    await dynamoDB.send(new PutCommand(params));
    return item;
}

/**
 * Xóa một item theo khóa chính
 */
async function deleteItem(tableName, key) {
    const params = {
        TableName: tableName,
        Key: key,
    };
    await dynamoDB.send(new DeleteCommand(params));
}

/**
 * Lấy tất cả item trong bảng (cẩn thận với bảng lớn)
 */
async function scanTable(tableName) {
    const params = {
        TableName: tableName,
    };
    const result = await dynamoDB.send(new ScanCommand(params));
    return result.Items;
}

/**
 * Truy vấn theo Global Secondary Index
 */
async function queryByIndex(tableName, indexName, keyName, keyValue, rangeKeyName = null, rangeKeyValue = null) {
    const params = {
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: `${keyName} = :v1`,
        ExpressionAttributeValues: {
            ":v1": keyValue,
        },
    };

    if (rangeKeyName && rangeKeyValue) {
        params.KeyConditionExpression += ` AND ${rangeKeyName} = :v2`;
        params.ExpressionAttributeValues[":v2"] = rangeKeyValue;
    }

    const result = await dynamoDB.send(new QueryCommand(params));
    return result.Items;
}

module.exports = {
    getItem,
    putItem,
    deleteItem,
    scanTable,
    queryByIndex,
};
