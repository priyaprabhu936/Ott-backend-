import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ Mongo Error:", err));

// ✅ Movie Schema & Model
const movieSchema = new mongoose.Schema({
  title: String,
  description: String,
  year: Number,
  poster: String,
});

const Movie = mongoose.model("Movie", movieSchema);

// ✅ API Routes
// Get all movies
app.get("/api/movies", async (req, res) => {
  const movies = await Movie.find();
  res.json(movies);
});

// Add a movie
app.post("/api/movies", async (req, res) => {
  const newMovie = new Movie(req.body);
  await newMovie.save();
  res.json(newMovie);
});

// Delete a movie
app.delete("/api/movies/:id", async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  res.json({ message: "Movie deleted" });
});

// ✅ Root Route (Important for Render)
app.get("/", (req, res) => {
  res.send("🎬 Backend is working! 🚀");
});

// ✅ Server Listen
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
