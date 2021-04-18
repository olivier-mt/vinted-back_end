require("dotenv").config();

const express = require("express");
const app = express();
const formidable = require("express-formidable");

const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");

const cors = require("cors");

app.use(formidable());
app.use(cors());

app.use(userRoutes);
app.use(offerRoutes);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.all("*", (req, res) => {
  res.json("This route does not exists");
});

app.listen(process.env.PORT, (req, res) => {
  console.log("Server is started");
});
