export const login = (req, res) => {
  const { email, password } = req.body;
  res.json({ message: "Login success", email });
};

export const register = (req, res) => {
  const { email, password } = req.body;
  res.json({ message: "User registered", email });
};
