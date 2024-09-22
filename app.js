const express = require('express');
const connectDB = require('./config/connectDB');
const userRoutes = require('./routes/userRoutes');
const authMiddleware = require('./middleware/authMiddleware');
require('dotenv').config(); // Nạp biến môi trường từ .env

const app = express();

// Kết nối đến MongoDB
connectDB();


// Middleware cho việc parse JSON
app.use(express.json());

// Định nghĩa các route
app.use('/api/users', userRoutes);


// Middleware để chặn các request đã đăng nhập
app.get('/api/protected-route', authMiddleware, (req, res) => {
  res.json({ message: 'Bạn đã truy cập vào route bảo vệ', user: req.user });
});

// Khởi động server
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

module.exports = app;