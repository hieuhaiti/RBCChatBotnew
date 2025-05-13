const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');

// Import Routes
const primaryRoute = require('./router/index.js');

// Create App
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(bodyParser.json());

// Routes
app.use('/api', primaryRoute);

// Middleware xử lý lỗi
// app.use(notFoundHandler);
// app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

