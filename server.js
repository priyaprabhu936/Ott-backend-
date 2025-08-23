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

// MongoDB connect
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Movie schema
const movieSchema = new mongoose.Schema({
  title: String,
  description: String,
  poster: String,
});

const Movie = mongoose.model("Movie", movieSchema);

// Routes
app.get("/", (req, res) => {
  res.send("🚀 Backend running successfully!");
});

app.get("/api/movies", async (req, res) => {
  const movies = await Movie.find();
  res.json(movies);
});

app.post("/api/movies", async (req, res) => {
  const movie = new Movie(req.body);
  await movie.save();
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
