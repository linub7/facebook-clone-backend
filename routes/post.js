const express = require('express');

const { createPost, getPosts } = require('../controllers/post');
const { authUser } = require('../middlewares/auth');

const router = express.Router();

router.post('/create-post', authUser, createPost);
router.get('/get-posts', authUser, getPosts);

module.exports = router;
