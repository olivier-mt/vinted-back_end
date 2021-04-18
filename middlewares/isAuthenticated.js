const User = require("../models/User");

const isAutenticated = async (req, res, next) => {
  console.log("on rentre dans le middleware ");

  try {
    const token = await req.headers.authorization.replace("Bearer ", "");

    // Find token hodler

    const user = await User.findOne({ token: token });

    console.log(user);

    if (!user) {
      res.status(400).json({ message: "User does not exists" });
    } else {
      if (user.token === token) {
        req.user = user;
        next();
      } else {
        res.status(400).json({ message: "Access Denied" });
      }
    }
  } catch (error) {
    console.log({ error: error.message });
    res.status(400).json("an error occured");
  }
};

module.exports = isAutenticated;
