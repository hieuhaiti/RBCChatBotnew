require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const { swaggerUi, swaggerSpec } = require('./swagger');
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const combinedLogPath = path.join(logDir, 'combined.log');
const errorLogPath = path.join(logDir, 'error.log');
const successLogPath = path.join(logDir, 'success.log');


try {
  if (fs.existsSync(combinedLogPath)) fs.unlinkSync(combinedLogPath);
  if (fs.existsSync(errorLogPath)) fs.unlinkSync(errorLogPath);
  if (fs.existsSync(successLogPath)) fs.unlinkSync(successLogPath);

  // Tạo file rỗng nếu cần
  fs.writeFileSync(combinedLogPath, '');
  fs.writeFileSync(errorLogPath, '');
  fs.writeFileSync(successLogPath, '');
} catch (err) {
  console.error("Lỗi khi xử lý file log:", err.message);
}

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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', primaryRoute);

app.use('/', (req, res) => {
  res.send('Welcome to the API');
});
// Middleware xử lý lỗi
// app.use(notFoundHandler);
// app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

