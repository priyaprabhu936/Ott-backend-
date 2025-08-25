const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Sample movies data
let movies = [
  {
    id: 1,
    title: "Vikram",
    posterUrl: "https://m.media-amazon.com/images/I/81p+xe8cbnL._AC_SY679_.jpg"
  },
  {
    id: 2,
    title: "Leo",
    posterUrl: "https://m.media-amazon.com/images/I/91VYt6lI8nL._AC_SY741_.jpg"
  },
  {
    id: 3,
    title: "Jawan",
    posterUrl: "https://m.media-amazon.com/images/I/81m1s4wIPML._AC_SY679_.jpg"
  },
  {
    id: 4,
    title: "KGF 2",
    posterUrl: "https://m.media-amazon.com/images/I/91V6f+JQJ8L._AC_SY679_.jpg"
  }
];

// API route
app.get("/api/movies", (req, res) => {
  res.json(movies);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
