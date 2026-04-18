const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.json());

// 📩 Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Fake DB
let users = [];

// ===== REGISTER =====
app.post("/register", (req, res) => {
  const { name, password, parentEmail } = req.body;

  users.push({
    name,
    password,
    parentEmail,
    usage: 0
  });

  res.send("Registered successfully");
});

// ===== LOGIN =====
app.post("/login", (req, res) => {
  const { name, password } = req.body;

  const user = users.find(
    u => u.name === name && u.password === password
  );

  if (user) {
    res.json(user);
  } else {
    res.status(401).send("Invalid credentials");
  }
});

// ===== ADD TIME (EMAIL SEND) =====
app.post("/add-time", async (req, res) => {
  const { name, time } = req.body;

  const user = users.find(u => u.name === name);

  if (!user) {
    return res.send("User not found");
  }

  user.usage += parseInt(time);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.parentEmail,
      subject: "Screen Time Alert",
      text: `Aaj aapke bacche ka screen time ${user.usage} minutes hai`
    });

    res.send("Time added & Email sent ✅");

  } catch (err) {
    console.log(err);
    res.send("Time added but Email failed ❌");
  }
});

// ===== LOGOUT =====
app.post("/logout", (req, res) => {
  res.send("Logged out");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running...");
});