let User = require("../models/User");
let Offer = require("../models/Offer");

const isOwner = async (req, res, next) => {
  try {
    console.log("on est dans le middle");

    const token = await req.headers.authorization.replace("Bearer ", "");

    // check object owner

    // check if object owner token = token
    // if yes ==> next / sinon erreur

    let offerId = req.fields.offerId;

    let offer = await Offer.findById(offerId);

    let owner = await User.findById(offer.owner);

    if (token === owner.token) {
      req.user = owner;
      req.offer = offer;
      console.log("good user"), next();
    } else {
      res
        .status(400)
        .json({ message: "you are not able to modify this offer " });
    }

    console.log(owner);
  } catch (error) {
    console.log({ error: error.message });
    res.json("a problem occured");
  }
};

module.exports = isOwner;
