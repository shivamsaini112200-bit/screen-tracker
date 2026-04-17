const express = require("express");

const app = express();

// ===== MIDDLEWARE =====
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== TEMP DATA =====
let users = [];

// ===== REGISTER =====
app.post("/register", (req, res) => {
  try {
    const { name, password, parentPhone } = req.body;

    if (!name || !password) {
      return res.status(400).send("Missing fields");
    }

    const existing = users.find(u => u.name === name);
    if (existing) {
      return res.status(400).send("User already exists");
    }

    users.push({
      name,
      password,
      parentPhone,
      usage: 0
    });

    res.send("Registered successfully");
  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.status(500).send("Server error");
  }
});

// ===== LOGIN =====
app.post("/login", (req, res) => {
  try {
    const { name, password } = req.body;

    const user = users.find(
      u => u.name === name && u.password === password
    );

    if (user) {
      res.json(user);
    } else {
      res.status(401).send("Invalid credentials");
    }
  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).send("Server error");
  }
});

// ===== ADD TIME =====
app.post("/add-time", (req, res) => {
  try {
    console.log("BODY:", req.body); // debug

    const { name, time } = req.body;

    if (!name || !time) {
      return res.status(400).send("Missing data");
    }

    const user = users.find(u => u.name === name);

    if (!user) {
      return res.status(404).send("User not found");
    }

    user.usage += Number(time);

    res.send("Time added successfully");
  } catch (err) {
    console.log("ADD TIME ERROR:", err);
    res.status(500).send("Server error");
  }
});

// ===== LOGOUT =====
app.post("/logout", (req, res) => {
  try {
    const { name } = req.body;

    const user = users.find(u => u.name === name);

    if (user) {
      res.send("Logged out");
    } else {
      res.status(404).send("User not found");
    }
  } catch (err) {
    console.log("LOGOUT ERROR:", err);
    res.status(500).send("Server error");
  }
});

// ===== SERVER START =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running...");
});