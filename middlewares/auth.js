const jwt = require('jsonwebtoken');
exports.authUser = async (req, res, next) => {
  try {
    let tmp = req.header('Authentication');

    const token = tmp ? tmp.slice(7, tmp.length) : ''; // Authentication: Bearer cmalmcalmclamca
    if (!token)
      return res.status(500).json({ message: 'Invalid Authentication' });
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (!user)
      return res.status(500).json({ message: 'Invalid Authentication' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
