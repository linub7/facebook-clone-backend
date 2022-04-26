const express = require('express');
const {
  register,
  activate,
  login,
  sendVerification,
  findUser,
  sendResetPasswordCode,
  validateResetCode,
  changePassword,
} = require('../controllers/user');
const { authUser } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', register);
router.post('/activate', authUser, activate);
router.post('/login', login);
router.post('/find-user', findUser);
router.post('/send-verification', authUser, sendVerification);
router.post('/send-reset-code', sendResetPasswordCode);
router.post('/validate-reset-code', validateResetCode);
router.post('/change-password', changePassword);

module.exports = router;
