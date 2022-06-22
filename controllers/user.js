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
const mongoose = require('mongoose');
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
    const me = await User.findById(req.user.id);
    const user = await User.findOne({ username }).select('-password');
    let friendShip = {
      friends: false,
      following: false,
      reqSent: false,
      reqReceived: false,
    };
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (me.friends.includes(user._id) && user.friends.includes(me._id)) {
      friendShip.friends = true;
    }
    if (me.following.includes(user._id)) {
      friendShip.following = true;
    }
    if (me.requests.includes(user._id)) {
      friendShip.reqReceived = true;
    }
    if (user.requests.includes(me._id)) {
      friendShip.reqSent = true;
    }
    const posts = await Post.find({ user: user._id })
      .populate('user')
      .populate('comments.commentBy', 'picture first_name last_name username')
      .sort('-createdAt');
    await user.populate('friends', 'first_name last_name username picture');

    return res
      .status(200)
      .json({ ...user.toObject(), posts, ok: true, friendShip });
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
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);
      if (
        !receiver.requests.includes(sender._id) &&
        !receiver.friends.includes(sender._id)
      ) {
        await receiver.updateOne({
          $addToSet: { requests: sender._id },
        });
        await receiver.updateOne({
          $addToSet: { followers: sender._id },
        });
        await sender.updateOne({
          $addToSet: { following: receiver._id },
        });
        res.json({ message: 'friend request has been sent' });
      } else {
        return res.status(400).json({ message: 'Already sent' });
      }
    } else {
      return res
        .status(400)
        .json({ message: "You can't send a request to yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.cancelRequest = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);
      if (
        receiver.requests.includes(sender._id) &&
        !receiver.friends.includes(sender._id)
      ) {
        await receiver.updateOne({
          $pull: { requests: sender._id },
        });
        await receiver.updateOne({
          $pull: { followers: sender._id },
        });
        await sender.updateOne({
          $pull: { following: receiver._id },
        });
        res.json({ message: 'you successfully canceled request' });
      } else {
        return res.status(400).json({ message: 'Already Canceled' });
      }
    } else {
      return res
        .status(400)
        .json({ message: "You can't cancel a request to yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.follow = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);
      if (
        !receiver.followers.includes(sender._id) &&
        !sender.following.includes(receiver._id)
      ) {
        await receiver.updateOne({
          $addToSet: { followers: sender._id },
        });

        await sender.updateOne({
          $addToSet: { following: receiver._id },
        });
        res.json({ message: 'follow success' });
      } else {
        return res.status(400).json({ message: 'Already following' });
      }
    } else {
      return res.status(400).json({ message: "You can't follow yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.unfollow = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);
      if (
        receiver.followers.includes(sender._id) &&
        sender.following.includes(receiver._id)
      ) {
        await receiver.updateOne({
          $pull: { followers: sender._id },
        });

        await sender.updateOne({
          $pull: { following: receiver._id },
        });
        res.json({ message: 'unfollow success' });
      } else {
        return res.status(400).json({ message: 'Already not following' });
      }
    } else {
      return res.status(400).json({ message: "You can't unfollow yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const receiver = await User.findById(req.user.id);
      const sender = await User.findById(req.params.id);
      if (receiver.requests.includes(sender._id)) {
        await receiver.update({
          $addToSet: { friends: sender._id, following: sender._id },
        });
        await sender.update({
          $addToSet: { friends: receiver._id, followers: receiver._id },
        });
        await receiver.updateOne({
          $pull: { requests: sender._id },
        });
        res.json({ message: 'friend request accepted' });
      } else {
        return res.status(400).json({ message: 'Already friends' });
      }
    } else {
      return res
        .status(400)
        .json({ message: "You can't accept a request from  yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unFriend = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);
      if (
        receiver.friends.includes(sender._id) &&
        sender.friends.includes(receiver._id)
      ) {
        await receiver.update({
          $pull: {
            friends: sender._id,
            following: sender._id,
            followers: sender._id,
          },
        });
        await sender.update({
          $pull: {
            friends: receiver._id,
            following: receiver._id,
            followers: receiver._id,
          },
        });

        res.json({ message: 'unfriend request accepted' });
      } else {
        return res.status(400).json({ message: 'Already not friends' });
      }
    } else {
      return res.status(400).json({ message: "You can't unfriend yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const receiver = await User.findById(req.user.id);
      const sender = await User.findById(req.params.id);
      if (receiver.requests.includes(sender._id)) {
        await receiver.update({
          $pull: {
            requests: sender._id,
            followers: sender._id,
          },
        });
        await sender.update({
          $pull: {
            following: receiver._id,
          },
        });

        res.json({ message: 'delete request accepted' });
      } else {
        return res.status(400).json({ message: 'Already deleted' });
      }
    } else {
      return res.status(400).json({ message: "You can't delete yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.search = async (req, res) => {
  try {
    const {
      params: { searchTerm },
    } = req;
    const result = await User.find({ $text: { $search: searchTerm } })
      .select('first_name last_name username picture')
      .limit(5);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addToSearchHistory = async (req, res) => {
  try {
    const {
      body: { searchUser },
    } = req;
    const search = {
      user: searchUser,
      createdAt: new Date(),
    };
    const user = await User.findById(req.user.id);
    const check = user.search.find(
      (el) => el.user.toString() === searchUser.toString()
    );

    if (check) {
      await User.updateOne(
        { _id: req.user.id, 'search._id': check._id },
        { $set: { 'search.$.createdAt': new Date() } }
      );
    } else {
      await User.findByIdAndUpdate(req.user.id, { $push: { search } });
    }
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getSearchHistory = async (req, res) => {
  try {
    const {
      user: { id },
    } = req;

    const user = await User.findById(id)
      .select('search')
      .populate('search.user', 'first_name last_name username picture');

    if (!user) return res.status(404).json({ message: ' User not found' });

    res.json({ result: user.search });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteSearchHistory = async (req, res) => {
  try {
    const {
      body: { searchId },
      user: { id },
    } = req;

    const user = await User.findById(id)
      .select('search')
      .populate('search.user', 'first_name last_name');
    if (!user) return res.status(404).json({ message: ' User not found' });

    for (let index = 0; index < user.search?.length; index++) {
      const element = user.search?.[index];
      if (element._id.toString() === searchId.toString()) {
        await User.updateOne(
          { _id: id, 'search._id': element._id },
          { $pull: { search: { _id: element._id } } }
        );
      }
    }
    // or
    /**
     * await User.updateOne({
     *  _id: id,
     * }, {
     * $pull: {search: {_id: searchId}}}}})
     */
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getFriendsPageInfos = async (req, res) => {
  try {
    const {
      user: { id },
    } = req;
    const user = await User.findById(id)
      .select('friends requests')
      .populate('friends', 'first_name last_name picture username')
      .populate('requests', 'first_name last_name picture username');

    const sentRequests = await User.find({
      requests: mongoose.Types.ObjectId(id),
    }).select('first_name last_name picture username');

    res.json({
      friends: user.friends,
      requests: user.requests,
      sentRequests,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
