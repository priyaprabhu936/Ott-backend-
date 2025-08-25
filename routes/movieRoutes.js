const router = require("express").Router();
const Movie = require("../models/Movie");
const auth = require("../middleware/auth");

// GET /api/movies
router.get("/", async (req, res) => {
  const list = await Movie.find().sort({ createdAt: -1 });
  return res.json(list);
});

// POST /api/movies  (protected)
router.post("/", auth, async (req, res) => {
  try {
    const { title, poster, year, genre, description } = req.body || {};
    if (!title) return res.status(400).json({ message: "Title required" });

    const movie = await Movie.create({ title, poster, year, genre, description });
    return res.status(201).json(movie);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Create failed" });
  }
});

// DELETE /api/movies/:id  (protected)
router.delete("/:id", auth, async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    return res.json({ message: "Movie deleted" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;
