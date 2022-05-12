const express = require('express');
const { reactPost, getReacts } = require('../controllers/react');

const { authUser } = require('../middlewares/auth');

const router = express.Router();
router.put('/react-post', authUser, reactPost);
router.get('/get-reacts/:postId', authUser, getReacts);

module.exports = router;
