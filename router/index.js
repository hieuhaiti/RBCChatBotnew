const express = require('express');
const router = express.Router();
const dynamoRouter = require('./dynamoRouter');
const facebookRouter = require('./facebookRouter');
const openAiRouter = require('./openAiRouter');

router.use('/dynamo', dynamoRouter);
router.use('/facebook', facebookRouter);
router.use('/openai', openAiRouter);

module.exports = router;
