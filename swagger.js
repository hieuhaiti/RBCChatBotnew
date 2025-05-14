const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'RBC ChatBot API',
            version: '1.0.0',
            description: 'API documentation for RBC ChatBot',
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT}/api`,
            },
        ],
    },
    apis: ['./router/*.js'], // chỉ định các file chứa doc comment (đổi theo cấu trúc dự án)
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerUi, swaggerSpec };
