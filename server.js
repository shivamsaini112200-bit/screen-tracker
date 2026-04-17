const express = require("express");
const bodyParser = require("body-parser");

const app = express();

// Middleware
app.use(express.static("public"));
app.use(bodyParser.json());

// Temporary storage (server restart पर data reset होगा)
let users = [];

// ================= REGISTER =================
app.post("/register", (req, res) => {
  try {
    const { name, password, parentPhone } = req.body;

    // check if user already exists
    const existingUser = users.find(u => u.name === name);
    if (existingUser) {
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
    console.log(err);
    res.status(500).send("Server error");
  }
});

// ================= LOGIN =================
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
    console.log(err);
    res.status(500).send("Server error");
  }
});

// ================= ADD TIME =================
app.post("/add-time", (req, res) => {
  try {
    const { name, time } = req.body;

    const user = users.find(u => u.name === name);

    if (!user) {
      return res.status(404).send("User not found");
    }

    user.usage += Number(time);

    res.send("Time added successfully");
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});

// ================= LOGOUT =================
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
    console.log(err);
    res.status(500).send("Server error");
  }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running...");
});