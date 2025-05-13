const express = require('express');
const router = express.Router();
const dynamoRouter = require('./dynamoRouter');

router.get('/', (req, res) => {
    res.send('API Root');
});

router.use('/dynamo', dynamoRouter);

module.exports = router;
