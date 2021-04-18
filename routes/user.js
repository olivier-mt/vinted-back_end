const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const cloudinary = require("cloudinary").v2;

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  console.log(req.fields);

  const { email, username, phone, password } = req.fields;

  console.log(email, username, phone, password);
  let salt = uid2(16);
  let hash = SHA256(salt + password).toString(encBase64);
  let token = uid2(64);

  try {
    const existingUser = await User.findOne({ email: email });

    if (!username) {
      res.status(400).json("The username is not provided ");
    } else if (existingUser) {
      res.status(400).json("This user already exists");
    } else {
      let newUser = new User({
        email: email,
        account: {
          username: username,
          phone: phone,
          avatar: {},
        },
        token: token,
        hash: hash,
        salt: salt,
      });

      if (req.files.picture) {
        let newPicture = await cloudinary.uploader.upload(
          req.files.picture.path,
          {
            folder: `vinted/users/${newUser._id}`,
            public_id: "preview",
          }
        );

        console.log("profile-picture");
        newUser.account.avatar.secure_url = newPicture.secure_url;
      }

      console.log(newUser);
      await newUser.save();

      res.status(200).json({
        id: newUser.id,
        token: newUser.token,
        account: {
          username: newUser.account.username,
          phone: newUser.account.phone,
        },
      });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json("a probleme occured");
  }
});

router.post("/user/login", async (req, res) => {
  //console.log(req.fields);

  try {
    const { email, password } = req.fields;

    // console.log(email, password);

    const userDB = await User.findOne({ email: email });

    const { token, salt, hash, id, account } = userDB;

    console.log(id);

    let newHash = SHA256(salt + password).toString(encBase64);

    if (newHash === hash) {
      res.status(200).json({
        _id: id,
        token: token,
        account: {
          username: account.username,
          phone: account.phone,
        },
      });
    } else {
      res.status(400).json("Wrong password !");
    }

    res.json("body receveided");
  } catch (error) {
    res.status(400).json("a problem occured");
  }
});

module.exports = router;
