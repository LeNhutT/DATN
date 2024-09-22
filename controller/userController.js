const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { handlebars } = require("hbs");
const jwt = require("jsonwebtoken");
const axios = require("axios");

// Đăng ký
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Kiểm tra nếu người dùng đã tồn tại
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo người dùng mới
    user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Gửi dữ liệu đến một API bên ngoài
    await axios.post('https://external-api.com/register', {
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "Đăng ký thành công!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Tìm người dùng theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email không tồn tại" });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu không chính xác" });
    }

    // Tạo JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Gửi thông tin đăng nhập đến một API bên ngoài
    await axios.post('https://external-api.com/login', {
      email,
      password,
      token, // Nếu cần gửi token
    });

    // Trả về thông tin người dùng
    res.json({
      message: "Đăng nhập thành công",
      user: {
        userId: user._id,
        username: user.username,
        email: user.email,
      },
      token, // Gửi token đến client
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Sửa thông tin người dùng (không cần xác thực)
exports.updateUser = async (req, res) => {
  const { userId, username, email, password } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "Cần cung cấp userId" });
  }

  // Kiểm tra tính hợp lệ của userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "userId không hợp lệ" });
  }

  // Kiểm tra tính hợp lệ của username và email
  if (!username || !email) {
    return res.status(400).json({ message: "Cần cung cấp username và email hợp lệ" });
  }

  try {
    // Tìm người dùng theo userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Nếu có mật khẩu mới, mã hóa và cập nhật
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    // Cập nhật thông tin người dùng
    user.username = username;
    user.email = email;
    
    const updatedUser = await user.save();

    res.json({ message: "Cập nhật thành công", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

