const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    poster: { type: String },       // image URL
    year: { type: String },
    genre: { type: String },
    description: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);
