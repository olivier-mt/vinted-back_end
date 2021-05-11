const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const isAutenticated = require("../middlewares/isAuthenticated");
const isOwner = require("../middlewares/isOwner");
const cloudinary = require("cloudinary").v2;
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

const Offer = require("../models/Offer");

const User = require("../models/User");

router.post("/offer/publish", isAutenticated, async (req, res) => {
  try {
    const { title, description, condition, city, brand, size, color, price } =
      req.fields;

    let newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: [
        {
          MARQUE: brand,
        },
        {
          TAILLE: size,
        },
        {
          ÉTAT: condition,
        },
        {
          COULEUR: color,
        },
        {
          EMPLACEMENT: city,
        },
      ],
      product_image: {},
      owner: req.user,
    });

    const pictureInDB = await cloudinary.uploader.upload(
      req.files.picture.path,
      { folder: `/vinted/offers/${newOffer._id}`, public_id: "preview" }
    );

    newOffer.product_image.secure_url = pictureInDB.secure_url;

    console.log(pictureInDB);

    await newOffer.save();

    let populatedOffer = newOffer.populate("owner", "account");
    res.status(200).json(populatedOffer);
  } catch (error) {
    console.log(error);
    res.status(400).json(`${error.message}`);
  }
});

router.get("/offers", async (req, res) => {
  try {
    const { page, title, priceMin, priceMax, sort } = req.query;

    let filter = {};
    let limit = 0;
    let skip = 0;
    let way = {};

    // Pagination
    if (page) {
      skip = (page - 1) * limit;
    }

    // Price Max & Price Min

    if (title) {
      filter.product_name = new RegExp(title, "i");
    }

    if (priceMax) {
      filter.product_price = { $lte: Number(priceMax) };
    }

    if (priceMin) {
      if (filter.product_price) {
        filter.product_price.$gte = priceMin;
      } else {
        filter.product_price = { $lte: Number(priceMin) };
      }
    }

    if (sort) {
      if (sort === "price-desc") {
        way = { product_price: "desc" };
      } else if (sort === "price-asc") {
        way = { product_price: "asc" };
      }
    }

    let offers = await Offer.find(filter)
      .limit(limit)
      .skip(skip)
      .sort(way)
      .populate("owner", "account");

    let count = offers.length;

    res.status(200).json({ count: count, offers });
  } catch (error) {
    console.log(error);
    res.json("an error occured");
  }
});
// HANDLE PAYMENT

router.post("/offer/pay", async (req, res) => {
  // get token from front

  try {
    const { stripeToken, amount, title } = req.fields;
    console.log("token==>", stripeToken);

    // SEND TOKEN & INFO TO STRIPE API

    const response = await stripe.charges.create({
      amount: amount * 100,
      currency: "eur",
      description: title,
      source: stripeToken,
    });

    console.log(response.status);
    // Save transaction in DB

    res.status(200).json(response.status);
  } catch (error) {
    console.log(error.message);
  }
});

// MODIFY OFFER
router.put("/offer/update/:id", isAutenticated, async (req, res) => {
  try {
    const { description, price, condition, city, brand, size, color, name } =
      req.fields;

    let offer = await Offer.findById(req.params.id);

    // Iterate over conditions
    if (description) {
      offer.product_description = description;
    }

    if (price) {
      offer.product_price = price;
    }

    let details = offer.product_details;

    for (let i = 0; i < details.length; i++) {
      if (details[i].MARQUE) {
        if (brand) {
          details[i].MARQUE = brand;
        }
      }

      if (details[i].ÉTAT) {
        if (condition) {
          details[i].ÉTAT = condition;
        }
      }

      if (details[i].EMPLACEMENT) {
        if (city) {
          details[i].EMPLACEMENT = city;
        }
      }

      if (details[i].TAILLE) {
        if (size) {
          details[i].TAILLE = size;
        }
      }

      if (details[i].COULEUR) {
        if (color) {
          details[i].COULEUR = color;
        }
      }
    }

    if (name) {
      offer.product_name = name;
    }

    //Modify picture
    if (req.files.picture) {
      let newPicture = await cloudinary.uploader.upload(
        req.files.picture.path,
        {
          folder: `/vinted/offers/${req.params.id}`,
          public_id: "preview",
        }
      );

      newPicture.secure_url = offer.product_image.secure_url;
    }

    await offer.save();

    res.status(200).json(offer);
  } catch (error) {
    res.json({ message: "an error occured" });
  }
});

router.delete("/offer/delete/:id", isAutenticated, async (req, res) => {
  try {
    let offer = await Offer.findById(req.params.id);

    // empty folder
    await cloudinary.api.delete_resources_by_prefix(
      `vinted/offers/${req.params.id}`
    );

    // canceled folder
    await cloudinary.api.delete_folder(`vinted/offers/${req.params.id}`);

    // canceled offer in DB
    await offer.delete();

    res.json("offer deleted succesfully");
  } catch (error) {
    res.json("offert not deleted");
  }
});

router.get("/offer/:id", async (req, res) => {
  console.log(req.params);

  try {
    const { id } = req.params;

    let offer = await Offer.findById(id).populate("owner", "account");

    if (offer) {
      res.status(200).json(offer);
    } else {
      res.json("this article doesn't exists");
    }
  } catch (error) {
    res.json({ message: "an error occured" });
  }
});

module.exports = router;
