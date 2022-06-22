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
  getProfile,
  updateProfilePicture,
  updateCoverPicture,
  updateDetails,
  addFriend,
  cancelRequest,
  follow,
  unfollow,
  acceptRequest,
  unFriend,
  deleteRequest,
  search,
  addToSearchHistory,
  getSearchHistory,
  deleteSearchHistory,
  getFriendsPageInfos,
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
router.get('/get-profile/:username', authUser, getProfile);
router.put('/update-profile-picture', authUser, updateProfilePicture);
router.put('/update-cover-picture', authUser, updateCoverPicture);
router.put('/update-details', authUser, updateDetails);
router.put('/add-friend/:id', authUser, addFriend);
router.put('/un-friend/:id', authUser, unFriend);
router.put('/cancel-request/:id', authUser, cancelRequest);
router.put('/follow/:id', authUser, follow);
router.put('/unfollow/:id', authUser, unfollow);
router.put('/accept-request/:id', authUser, acceptRequest);
router.put('/delete-request/:id', authUser, deleteRequest);
router.post('/search/:searchTerm', authUser, search);
router.put('/addToSearchHistory', authUser, addToSearchHistory);
router.get('/get-search-history', authUser, getSearchHistory);
router.put('/delete-search-history', authUser, deleteSearchHistory);
getFriendsPageInfos;
router.get('/get-friends-page-infos', authUser, getFriendsPageInfos);

module.exports = router;
