const Post = require('../models/Post');
const User = require('../models/User');

exports.createPost = async (req, res) => {
  try {
    const { body } = req;
    const newPost = await new Post(body).save();
    await newPost.populate(
      'user',
      'first_name last_name cover picture username'
    );
    return res.json(newPost);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const {
      user: { id },
    } = req;

    const followingTmp = await User.findById(id).select('following');
    const following = followingTmp.following;
    const promises = following.map((user) => {
      return Post.find({ user })
        .populate('user', 'first_name last_name picture username')
        .populate('comments.commentBy', 'first_name last_name picture username')
        .sort('-createdAt');
      // .limit(10);
    });
    const followingPosts = (await Promise.all(promises)).flat(); // flat() => convert [[{},{},...]] into [{}, {},...]
    const userPosts = await Post.find({ user: id })
      .populate('user', 'first_name last_name picture username cover')
      .populate(
        'comments.commentBy',
        'first_name last_name picture username cover'
      )
      .sort('-createdAt');
    // .limit(10);
    followingPosts.push(...[...userPosts]);
    followingPosts.sort((a, b) => {
      return b.createdAt - a.createdAt;
    });
    res.json(followingPosts);
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
    await post.updateOne({ $pull: { comments: { _id: commentId } } });
    res.json({ post, message: 'Delete Successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};
