const schemaFields = [
    { name: "name", type: "String", required: true },
    { name: "phone", type: "String", required: false },
    { name: "threadId", type: "String", required: false },
    { name: "lastInteraction", type: "String", required: true },
    { name: "style", type: "String", required: false },
    { name: "budget", type: "Number", required: false },
];

module.exports = schemaFields;