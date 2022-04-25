const express = require('express');
const {
  register,
  activate,
  login,
  sendVerification,
} = require('../controllers/user');
const { authUser } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', register);
router.post('/activate', authUser, activate);
router.post('/login', login);
router.post('/send-verification', authUser, sendVerification);

module.exports = router;
