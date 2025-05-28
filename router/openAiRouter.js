const express = require('express');
const router = express.Router();
const openAiController = require('../controller/openAiController');

/**
 * @swagger
 * tags:
 *   name: OpenAI
 *   description: API endpoints for interacting with OpenAI services
 */

/**
 * @swagger
 * /openai/threads:
 *   post:
 *     summary: Create a new thread
 *     tags: [OpenAI]
 *     responses:
 *       200:
 *         description: Thread created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 threadId:
 *                   type: string
 *                   description: The ID of the created thread
 *                   example: thread_abc123
 *       500:
 *         description: Error creating thread
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.post('/threads', openAiController.createdThread);

/**
 * @swagger
 * /openai/messages/{threadId}:
 *   get:
 *     summary: Get messages from a thread
 *     tags: [OpenAI]
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the thread to retrieve messages from
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: The ID of the message
 *                         example: msg_abc123
 *                       text:
 *                         type: string
 *                         description: The content of the message
 *                         example: "Hello, how can I help you?"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: The timestamp when the message was created
 *                         example: "2023-10-01T12:00:00Z"
 *       500:
 *         description: Error retrieving messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.get('/messages/:threadId', openAiController.getMessages);

/**
 * @swagger
 * /openai/assistants/{pageId}:
 *   get:
 *     summary: Get assistant by page ID
 *     tags: [OpenAI]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the page, e.g., 102602424668201
 *     responses:
 *       200:
 *         description: Assistant retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The ID of the assistant
 *                   example: asst_abc123
 *                 model:
 *                   type: string
 *                   example: gpt-4o
 *                 instructions:
 *                   type: string
 *                 description:
 *                   type: string
 *       500:
 *         description: Error getting assistant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.get('/assistants/:pageId', openAiController.getAssistant);

/**
 * @swagger
 * /openai/assistants:
 *   post:
 *     summary: Create a new assistant
 *     tags: [OpenAI]
 *     responses:
 *       200:
 *         description: Assistant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 assistantId:
 *                   type: string
 *                   description: The ID of the created assistant
 *                   example: asst_abc123
 *       500:
 *         description: Error creating assistant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.post('/assistants', openAiController.createdAssistant);

/**
 * @swagger
 * /openai/assistants/{assistantId}:
 *   patch:
 *     summary: Update an assistant's instructions
 *     tags: [OpenAI]
 *     parameters:
 *       - in: path
 *         name: assistantId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the assistant to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               instructions:
 *                 type: string
 *                 description: Updated instructions for the assistant
 *                 example: "Provide concise and accurate responses."
 *             required:
 *               - instructions
 *     responses:
 *       200:
 *         description: Assistant updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updatedId:
 *                   type: string
 *                   description: The ID of the updated assistant
 *                   example: asst_abc123
 *       500:
 *         description: Error updating assistant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.patch('/assistants/:assistantId', openAiController.updateAssistant);

/**
 * @swagger
 * /openai/assistants/{assistantId}/threads/{threadId}/reply:
 *   post:
 *     summary: Get a reply from an assistant
 *     tags: [OpenAI]
 *     parameters:
 *       - in: path
 *         name: assistantId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the assistant
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the thread
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: The message to send to the assistant
 *                 example: "Hello, how can you help me today?"
 *             required:
 *               - message
 *     responses:
 *       200:
 *         description: Reply retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 *                   description: The assistant's reply
 *                   example: "I'm here to help! What do you need?"
 *                 quick_replies:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Suggested quick replies
 *                   example: []
 *                 entities:
 *                   type: object
 *                   description: Extracted entities
 *                   example: {}
 *       500:
 *         description: Error getting assistant reply
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.post('/assistants/:assistantId/threads/:threadId/reply', openAiController.getAssistantReply);

module.exports = router;