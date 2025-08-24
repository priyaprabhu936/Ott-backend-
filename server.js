import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mongo connect
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Movie schema (⭐ rating + 🎭 category added)
const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  poster: String,
  rating: { type: Number, min: 1, max: 5, default: 3 },
  category: { type: String, default: "General" },
});

const Movie = mongoose.model("Movie", movieSchema);

// Routes
app.get("/", (req, res) => {
  res.send("🚀 Backend running successfully!");
});

app.get("/api/movies", async (req, res) => {
  const movies = await Movie.find().sort({ _id: -1 });
  res.json(movies);
});

app.post("/api/movies", async (req, res) => {
  const { title, description, poster, rating, category } = req.body;
  const movie = new Movie({
    title,
    description,
    poster,
    rating: Number(rating) || 3,
    category: category || "General",
  });
  await movie.save();
  res.json(movie);
});

app.put("/api/movies/:id", async (req, res) => {
  const { title, description, poster, rating, category } = req.body;
  const movie = await Movie.findByIdAndUpdate(
    req.params.id,
    {
      title,
      description,
      poster,
      rating: Number(rating) || 3,
      category: category || "General",
    },
    { new: true }
  );
  res.json(movie);
});

app.delete("/api/movies/:id", async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  res.json({ message: "Movie deleted" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
