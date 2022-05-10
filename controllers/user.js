const {
  validateEmail,
  validateLength,
  validateUsername,
} = require('../helpers/validation');
const User = require('../models/User');
const Code = require('../models/Code');
const Post = require('../models/Post');
const bcrypt = require('bcrypt');
const { generateToken } = require('../helpers/tokens');
const { sendVerificationEmail, sendResetCode } = require('../helpers/mailer');
const jwt = require('jsonwebtoken');
const generateCode = require('../helpers/generateCode');

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
  try {
    const {
      body: { token },
    } = req;
    const validUser = req.user.id;

    const user = jwt.verify(token, process.env.JWT_SECRET);

    if (validUser !== user.id)
      return res.status(400).json({
        message:
          'You do not have the authorization to complete this operation.!',
      });
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
    // if (!user.verified)
    //   return res.status(400).json({
    //     message: 'Please verified your account',
    //   });
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
      details: user.details,
      message:
        'Register Success! Please see your email inbox and activate your account!',
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.sendVerification = async (req, res) => {
  try {
    const id = req.user.id;
    const user = await User.findById(id);
    if (!user) return res.status(400).json({ message: 'User not found!' });
    if (user.verified === true)
      return res.status(400).json({ message: 'Account already activated' });

    const emailVerification = generateToken({ id: user._id.toString() }, '30m');
    const url = `${process.env.BASE_URL}/activate/${emailVerification}`;
    sendVerificationEmail(user.email, user.first_name, url);

    return res
      .status(200)
      .json({ message: 'Email verification has been sent to your email' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.findUser = async (req, res) => {
  try {
    const {
      body: { email },
    } = req;
    const user = await User.findOne({ email }).select('-password');
    if (!user)
      return res.status(400).json({ message: 'Account does not exist' });
    return res.status(200).json({ email: user.email, picture: user.picture });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.sendResetPasswordCode = async (req, res) => {
  try {
    const {
      body: { email },
    } = req;
    const user = await User.findOne({ email }).select('-password');
    if (!user) return res.status(400).json({ message: 'User not found' });
    await Code.findOneAndRemove({ user: user._id });
    const code = generateCode(5);
    const savedCode = await new Code({
      code,
      user: user._id,
    }).save();
    sendResetCode(user.email, user.first_name, code);
    return res
      .status(200)
      .json({ message: 'Email reset code has been sent to your email' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.validateResetCode = async (req, res) => {
  try {
    const {
      body: { email, code },
    } = req;

    const user = await User.findOne({ email }).select('-password');
    if (!user) return res.status(400).json({ message: 'User not found' });
    const dbCode = await Code.findOne({ user: user._id });
    console.log('CODE', code);
    console.log('DB_CODE', dbCode.code);
    if (!dbCode) return res.status(400).json({ message: 'Code not found' });
    if (dbCode.code !== code)
      return res.status(400).json({ message: 'Verification code is wrong' });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const {
      body: { email, password, code },
    } = req;
    const tempUser = await User.findOne({ email }).select('-password');
    const dbCode = await Code.findOne({ user: tempUser._id });
    if (dbCode.code !== code)
      return res.status(400).json({
        message:
          'OOPS!Wrong credentials!Authorized failed! you cannot change password',
      });
    const hashedPassword = await bcrypt.hash(password, 12);

    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { runValidators: true, new: true }
    );
    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const {
      params: { username },
    } = req;
    const user = await User.findOne({ username }).select('-password');
    if (!user) return res.status(400).json({ message: 'User not found' });
    const posts = await Post.find({ user: user._id })
      .populate('user')
      .sort('-createdAt');
    return res.status(200).json({ ...user.toObject(), posts, ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfilePicture = async (req, res) => {
  try {
    const {
      body: { url },
    } = req;
    const userId = req.user.id;
    await User.findByIdAndUpdate(
      userId,
      { picture: url },
      { new: true, runValidators: true }
    );

    res.send(url);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCoverPicture = async (req, res) => {
  try {
    const {
      body: { url },
    } = req;
    const userId = req.user.id;
    await User.findByIdAndUpdate(
      userId,
      { cover: url },
      { new: true, runValidators: true }
    );

    res.send(url);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateDetails = async (req, res) => {
  try {
    const {
      body: { infos },
    } = req;
    const userId = req.user.id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { details: infos },
      { new: true, runValidators: true }
    );

    res.json(updatedUser.details);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addFriend = async (req, res) => {
  try {
    const {
      params: { id },
    } = req;
    if (id === req.user.id) {
      return res
        .status(400)
        .json({ message: 'You can not send request for yourself' });
    }

    const sender = await User.findById(req.user.id);
    const receiver = await User.findById(id);

    if (
      !receiver.requests.includes(sender._id) &&
      !receiver.friends.includes(sender._id)
    ) {
      await receiver.updateOne({ $push: { requests: sender._id } });
      await receiver.updateOne({ $push: { followers: sender._id } });
      await sender.updateOne({ $push: { following: receiver._id } });
      res.json({ message: 'Friend request has been sent' });
    } else {
      return res.status(400).json({ message: 'Already sent' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const {
      params: { id },
    } = req;
    if (id === req.user.id) {
      return res
        .status(400)
        .json({ message: 'You can not accept request for yourself' });
    }

    const sender = await User.findById(req.user.id);
    const receiver = await User.findById(id);

    if (receiver.requests.includes(sender._id)) {
      await receiver.update({
        $addToSet: { friends: sender._id, following: sender._id },
      });

      await receiver.updateOne({
        $pull: { request: sender._id },
      });
      await sender.update({
        $addToSet: { friends: receiver._id, followers: receiver._id },
      });

      res.json({ message: 'You successfully Accepted request' });
    } else {
      return res.status(400).json({ message: 'Already Accepted' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelRequest = async (req, res) => {
  try {
    const {
      params: { id },
    } = req;
    if (id === req.user.id) {
      return res
        .status(400)
        .json({ message: 'You can not cancel request for yourself' });
    }

    const sender = await User.findById(req.user.id);
    const receiver = await User.findById(id);

    if (
      receiver.requests.includes(sender._id) &&
      !receiver.friends.includes(sender._id)
    ) {
      await receiver.updateOne({ $pull: { requests: sender._id } });
      await receiver.updateOne({ $pull: { followers: sender._id } });
      await sender.updateOne({ $pull: { following: receiver._id } });
      res.json({ message: 'You successfully canceled request' });
    } else {
      return res.status(400).json({ message: 'Already Canceled' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.follow = async (req, res) => {
  try {
    const {
      params: { id },
    } = req;
    if (id === req.user.id) {
      return res.status(400).json({ message: 'You can not follow yourself' });
    }

    const sender = await User.findById(req.user.id);
    const receiver = await User.findById(id);

    if (
      !receiver.followers.includes(sender._id) &&
      !sender.followings.includes(receiver._id)
    ) {
      await receiver.updateOne({ $addToSet: { followers: sender._id } });
      await sender.updateOne({ $addToSet: { following: receiver._id } });
      res.json({ message: 'Friend followed successfully' });
    } else {
      return res.status(400).json({ message: 'Already followed' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.unfollow = async (req, res) => {
  try {
    const {
      params: { id },
    } = req;
    if (id === req.user.id) {
      return res.status(400).json({ message: 'You can not unfollow yourself' });
    }

    const sender = await User.findById(req.user.id);
    const receiver = await User.findById(id);

    if (
      receiver.followers.includes(sender._id) &&
      sender.following.includes(receiver._id)
    ) {
      await receiver.updateOne({ $pull: { followers: sender._id } });
      await sender.updateOne({ $pull: { following: receiver._id } });
      res.json({ message: 'Friend un-followed successfully' });
    } else {
      return res.status(400).json({ message: 'Already un-followed' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
