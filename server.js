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

// ================== User Model (with hashing) ==================
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false }, // hidden by default
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hash password BEFORE save if modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to verify password
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

const User = mongoose.model("User", userSchema);

// ================== Movie Model ==================
const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  poster: String,
  rating: { type: Number, min: 1, max: 5, default: 3 },
  category: { type: String, default: "General" },
});
const Movie = mongoose.model("Movie", movieSchema);

// ================== Auth Helpers ==================
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || "devsecret", { expiresIn: "7d" });

const auth = (req, _res, next) => {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return next({ status: 401, message: "No token" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
    req.user = payload; // { id, isAdmin }
    next();
  } catch (e) {
    next({ status: 401, message: "Invalid token" });
  }
};

const adminOnly = (req, _res, next) => {
  if (!req.user?.isAdmin) return next({ status: 403, message: "Admin only" });
  next();
};

// ================== Routes ==================
app.get("/", (_req, res) => res.send("🚀 Backend running successfully!"));

// ---- Auth ----
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const isFirstUser = (await User.countDocuments()) === 0; // first user becomes admin
    const user = await User.create({ name, email, password, isAdmin: isFirstUser }); // pre('save') will hash

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
    const user = await User.findOne({ email }).select("+password"); // include password explicitly
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const ok = await user.comparePassword(password);
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

// ---- Movies ----
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

// ---- Error handler ----
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Server error" });
});

// Start
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
