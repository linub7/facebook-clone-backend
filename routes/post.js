const express = require('express');

const {
  createPost,
  getPosts,
  comment,
  deleteComment,
} = require('../controllers/post');
const { authUser } = require('../middlewares/auth');

const router = express.Router();

router.post('/create-post', authUser, createPost);
router.get('/get-posts', authUser, getPosts);
router.put('/comment', authUser, comment);
router.put('/delete-comment/:postId/:commentId', authUser, deleteComment);

module.exports = router;
