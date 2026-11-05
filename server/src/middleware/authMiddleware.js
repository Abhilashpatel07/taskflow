const jwt = require("jsonwebtoken");
const User = require("../models/User");

// PROTECTED ROUTES: put this before any route that needs a logged-in user
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized. Please log in." });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Session expired or invalid. Please log in again." });
  }
}

module.exports = { protect }; 