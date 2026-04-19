const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.json());

// ===== MongoDB =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ===== Schema =====
const userSchema = new mongoose.Schema({
  name: String,
  password: String,
  parentEmail: String,
  usage: { type: Number, default: 0 },
  dailyHistory: [
    {
      date: String,
      usage: Number
    }
  ]
});

const User = mongoose.model("User", userSchema);

// ===== Email =====
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ===== REGISTER =====
app.post("/register", async (req, res) => {
  try {
    const { name, password, parentEmail } = req.body;

    const existing = await User.findOne({ name });
    if (existing) return res.send("User already exists");

    const user = new User({ name, password, parentEmail });
    await user.save();

    res.send("Registered Successfully");
  } catch (err) {
    console.log(err);
    res.send("Error in register");
  }
});

// ===== LOGIN =====
app.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;

    const user = await User.findOne({ name, password });

    if (!user) return res.json({ error: "Invalid" });

    res.json(user);
  } catch (err) {
    console.log(err);
    res.json({ error: "Server error" });
  }
});

// ===== ADD TIME =====
app.post("/add-time", async (req, res) => {
  try {
    const { name, time } = req.body;

    const user = await User.findOne({ name });
    if (!user) return res.send("User not found");

    const today = new Date().toISOString().slice(0, 10);

    user.usage += parseInt(time);

    let found = false;

    user.dailyHistory = user.dailyHistory.map(d => {
      if (d.date === today) {
        found = true;
        return { date: today, usage: user.usage };
      }
      return d;
    });

    if (!found) {
      user.dailyHistory.push({
        date: today,
        usage: user.usage
      });
    }

    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.parentEmail,
      subject: "Screen Time Update",
      text: `Today's screen time: ${user.usage} minutes`
    });

    res.send("Time added & Email sent");

  } catch (err) {
    console.log(err);
    res.send("Error");
  }
});

// ===== HISTORY =====
app.get("/history/:name", async (req, res) => {
  try {
    const user = await User.findOne({ name: req.params.name });
    if (!user) return res.json([]);

    res.json(user.dailyHistory);
  } catch {
    res.json([]);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running..."));