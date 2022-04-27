const Post = require('../models/Post');

exports.createPost = async (req, res) => {
  try {
    const { body } = req;
    const newPost = await new Post(body).save();
    return res.json(newPost);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};
