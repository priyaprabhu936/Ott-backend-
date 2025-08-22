export const getMovies = (req, res) => {
  res.json([
    { id: 1, title: "Movie One" },
    { id: 2, title: "Movie Two" }
  ]);
};
