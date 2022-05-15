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
    const posts = await Post.find({})
      .populate('user')
      .populate('comments.commentBy', 'picture first_name last_name username')
      .sort('-createdAt');
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
        $push: {
          comments: { comment, image, commentBy: id, commentAt: new Date() },
        },
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

exports.deleteComment = async (req, res) => {
  try {
    const {
      params: { postId, commentId },
      user: { id },
    } = req;

    const post = await Post.findById(postId)
      .populate('user', 'first_name last_name username')
      .populate('comments.commentBy', 'first_name last_name username');
    const comment = post.comments?.find(
      (cm) => cm._id.toString() === commentId.toString()
    );

    console.log(comment.commentBy._id.toString());
    console.log('me', id.toString());
    if (id.toString() !== comment.commentBy._id.toString())
      return res.status(400).json({
        message: 'Authorized failed! You can only delete your own comments',
      });
    await post.update({ $pull: { comments: { _id: commentId } } });
    res.json({ post, message: 'Delete Successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};
