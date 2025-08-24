import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mongo connect
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ===== Models =====
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // hashed
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const User = mongoose.model("User", userSchema);

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  poster: String,
  rating: { type: Number, min: 1, max: 5, default: 3 },
  category: { type: String, default: "General" },
});
const Movie = mongoose.model("Movie", movieSchema);

// ===== Helpers =====
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || "devsecret", { expiresIn: "7d" });

const auth = (req, res, next) => {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
    req.user = payload; // { id, isAdmin }
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
const adminOnly = (req, res, next) => {
  if (!req.user?.isAdmin) return res.status(403).json({ message: "Admin only" });
  next();
};

// ===== Routes =====
app.get("/", (req, res) => res.send("🚀 Backend running successfully!"));

// Auth
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const isFirstUser = (await User.countDocuments()) === 0; // first user => admin
    const user = await User.create({ name, email, password: hash, isAdmin: isFirstUser });

    const token = signToken({ id: user._id, isAdmin: user.isAdmin });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin },
    });
  } catch (e) {
    res.status(500).json({ message: "Register failed", error: e.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid email or password" });

    const token = signToken({ id: user._id, isAdmin: user.isAdmin });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin },
    });
  } catch (e) {
    res.status(500).json({ message: "Login failed", error: e.message });
  }
});

// Movies
app.get("/api/movies", async (_req, res) => {
  const movies = await Movie.find().sort({ _id: -1 });
  res.json(movies);
});
app.post("/api/movies", auth, adminOnly, async (req, res) => {
  const { title, description, poster, rating, category } = req.body;
  const movie = await Movie.create({
    title,
    description,
    poster,
    rating: Number(rating) || 3,
    category: category || "General",
  });
  res.json(movie);
});
app.put("/api/movies/:id", auth, adminOnly, async (req, res) => {
  const { title, description, poster, rating, category } = req.body;
  const movie = await Movie.findByIdAndUpdate(
    req.params.id,
    { title, description, poster, rating: Number(rating) || 3, category: category || "General" },
    { new: true }
  );
  res.json(movie);
});
app.delete("/api/movies/:id", auth, adminOnly, async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  res.json({ message: "Movie deleted" });
});

// Start
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
