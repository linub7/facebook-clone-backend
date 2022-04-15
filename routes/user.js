const express = require('express');

const router = express.Router();

router.get('/user', (req, res) => {
  res.json({
    user: 'welcome',
  });
});

module.exports = router;
