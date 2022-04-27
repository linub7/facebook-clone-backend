const fs = require('fs');
module.exports = async function (req, res, next) {
  try {
    if (!req.files || Object.values(req.files).flat().length === 0) {
      return res.status(400).json({ message: 'No files selected' });
    }
    let receiveFiles = Object.values(req.files).flat();
    receiveFiles.forEach((file) => {
      if (
        file.mimetype !== 'image/jpeg' &&
        file.mimetype !== 'image/jpg' &&
        file.mimetype !== 'image/png' &&
        file.mimetype !== 'image/gif' &&
        file.mimetype !== 'image/webp'
      ) {
        removeTmp(file.tempFilePath);
        return res.status(400).json({ message: 'Unsupported format' });
      }

      // 1024 * 1024 = 1 meg
      if (file.size > 1024 * 1024 * 5) {
        removeTmp(file.tempFilePath);
        return res.status(400).json({
          message: 'file size is too large, maximum file size is 5meg',
        });
      }
    });
    next();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const removeTmp = (path) => {
  fs.unlink(path, (err) => {
    if (err) throw err;
  });
};
