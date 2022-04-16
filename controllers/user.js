const {
  validateEmail,
  validateLength,
  validateUsername,
} = require('../helpers/validation');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const { generateToken } = require('../helpers/tokens');
const { sendVerificationEmail } = require('../helpers/mailer');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const {
    body: {
      first_name,
      last_name,
      username,
      email,
      password,
      gender,
      bYear,
      bMonth,
      bDay,
    },
  } = req;

  try {
    if (!validateEmail(email))
      return res.status(400).json({ message: 'Invalid Email Address' });

    if (!validateLength(first_name, 3, 30))
      return res
        .status(400)
        .json({ message: 'firstname must be between 3 and 30' });

    if (!validateLength(last_name, 3, 30))
      return res
        .status(400)
        .json({ message: 'lastname must be between 3 and 30' });

    const check = await User.findOne({ email });
    if (check)
      return res.status(400).json({
        message: 'This Email already is taken.Please choose another email',
      });

    const hashedPassword = await bcrypt.hash(password, 12);
    const tempUsername = first_name + last_name;
    const newUsername = await validateUsername(tempUsername);
    const user = await new User({
      first_name,
      last_name,
      username: newUsername,
      email,
      password: hashedPassword,
      gender,
      bYear,
      bMonth,
      bDay,
    }).save();
    const emailVerification = generateToken({ id: user._id.toString() }, '30m');
    const url = `${process.env.BASE_URL}/activate/${emailVerification}`;
    sendVerificationEmail(user.email, user.first_name, url);
    const token = generateToken({ id: user._id.toString() }, '7d');
    res.send({
      id: user._id,
      username: user.username,
      picture: user.picture,
      first_name: user.first_name,
      last_name: user.last_name,
      token,
      verified: user.verified,
      message:
        'Register Success! Please see your email inbox and activate your account!',
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.activate = async (req, res) => {
  const {
    body: { token },
  } = req;
  const user = jwt.verify(token, process.env.JWT_SECRET);
  try {
    const check = await User.findById(user.id);
    if (check.verified == true) {
      return res
        .status(400)
        .json({ message: 'This email already is activated!' });
    } else {
      await User.findByIdAndUpdate(user.id, { verified: true });
      return res.status(200).json({
        message:
          'Congratulation! Your account has been activated successfully.',
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const {
    body: { email, password },
  } = req;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({
        message:
          'This email does not exist.Please register or try another email!',
      });
    if (!user.verified)
      return res.status(400).json({
        message: 'Please verified your account',
      });
    const check = await bcrypt.compare(password, user.password);
    if (!check)
      return res.status(400).json({
        message: 'Invalid Credentials.Please try again',
      });

    const token = generateToken({ id: user._id.toString() }, '7d');
    res.send({
      id: user._id,
      username: user.username,
      picture: user.picture,
      first_name: user.first_name,
      last_name: user.last_name,
      token,
      verified: user.verified,
      message:
        'Register Success! Please see your email inbox and activate your account!',
    });
  } catch (err) {}
};
