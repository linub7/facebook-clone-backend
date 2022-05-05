const express = require('express');

const { uploadImages, listImages } = require('../controllers/upload');
const { authUser } = require('../middlewares/auth');
const imageUpload = require('../middlewares/imageUpload');

const router = express.Router();

router.post('/upload-images', authUser, imageUpload, uploadImages);
router.post('/list-images', authUser, listImages);

module.exports = router;
