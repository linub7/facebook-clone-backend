const React = require('../models/React');
const mongoose = require('mongoose');
const {
  Types: { ObjectId },
} = mongoose;
exports.reactPost = async (req, res) => {
  try {
    const {
      body: { postId, react },
    } = req;
    const userId = req.user.id;

    const check = await React.findOne({
      postRef: postId,
      reactBy: ObjectId(userId), // userId is string => reactBy defines as Ref => we have to convert string to ObjectId
    });
    if (check == null) {
      const newReact = new React({
        react,
        postRef: postId,
        reactBy: userId,
      });
      await newReact.save();
      res.end();
    } else {
      if (check.react == react) {
        await React.findByIdAndRemove(check._id);
        res.end();
      } else {
        await React.findByIdAndUpdate(check._id, { react });
        res.end();
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getReacts = async (req, res) => {
  try {
    const {
      params: { postId },
    } = req;
    const userId = req.user.id;

    const reacts = await React.find({ postRef: postId });
    const total = reacts.length;

    const newReacts = reacts.reduce((group, react) => {
      let key = react['react'];
      group[key] = group[key] || [];
      group[key].push(react);
      return group;
    }, {});

    const finalArray = [
      {
        react: 'like',
        count: newReacts.like ? newReacts.like.length : 0,
      },
      {
        react: 'love',
        count: newReacts.love ? newReacts.love.length : 0,
      },
      {
        react: 'haha',
        count: newReacts.haha ? newReacts.haha.length : 0,
      },
      {
        react: 'wow',
        count: newReacts.wow ? newReacts.wow.length : 0,
      },
      {
        react: 'sad',
        count: newReacts.sad ? newReacts.sad.length : 0,
      },
      {
        react: 'angry',
        count: newReacts.angry ? newReacts.angry.length : 0,
      },
    ];

    finalArray.sort((a, b) => {
      return b.count - a.count;
    });

    console.log(finalArray);

    const check = await React.findOne({ postRef: postId, reactBy: userId });
    // check & check1 do the same operation
    // const check1 = reacts.find(
    //   (react) => react.reactBy.toString() === userId
    // )?.react;
    // console.log(check1);

    res.json({ reacts: finalArray, check: check?.react, total }); // maybe check doesn't exist
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};
