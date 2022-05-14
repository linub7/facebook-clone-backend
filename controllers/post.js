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

exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find({}).populate('user').sort('-createdAt');
    res.json(posts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.comment = async (req, res) => {
  try {
    const {
      body: { postId, comment, image },
      user: { id },
    } = req;
    const newComment = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { comments: { comment, image, commentBy: id } },
      },
      { new: true, runValidators: true }
    )
      .populate('comments.commentBy', 'picture first_name last_name username')
      .sort('-comments.commentAt');
    res.json(newComment.comments);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};
