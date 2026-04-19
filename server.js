const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const cron = require("node-cron");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.json());

// ===== MONGODB CONNECT =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ===== USER SCHEMA =====
const userSchema = new mongoose.Schema({
  name: String,
  password: String,
  parentEmail: String,
  usage: { type: Number, default: 0 },
  dailyLimit: { type: Number, default: 180 }
});

const User = mongoose.model("User", userSchema);

// ===== EMAIL SETUP =====
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ===== REGISTER =====
app.post("/register", async (req, res) => {
  const { name, password, parentEmail } = req.body;

  const existing = await User.findOne({ name });
  if (existing) return res.send("User already exists");

  const user = new User({ name, password, parentEmail });
  await user.save();

  res.send("Registered successfully");
});

// ===== LOGIN =====
app.post("/login", async (req, res) => {
  const { name, password } = req.body;

  const user = await User.findOne({ name, password });

  if (user) {
    res.json(user);
  } else {
    res.status(401).send("Invalid credentials");
  }
});

// ===== ADD TIME =====
app.post("/add-time", async (req, res) => {
  const { name, time } = req.body;

  const user = await User.findOne({ name });
  if (!user) return res.send("User not found");

  user.usage += parseInt(time);
  await user.save();

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.parentEmail,
      subject: "Screen Time Update",
      text: `Your child's screen time today is ${user.usage} minutes.`
    });

    if (user.usage > user.dailyLimit) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.parentEmail,
        subject: "⚠️ Limit Exceeded",
        text: `Your child exceeded the daily limit of ${user.dailyLimit} minutes.`
      });
    }

    res.send("Time added & Email sent ✅");

  } catch (err) {
    console.log(err);
    res.send("Time added but Email failed ❌");
  }
});

// ===== DAILY REPORT (9 PM) =====
cron.schedule("0 21 * * *", async () => {
  console.log("Sending daily reports...");

  const users = await User.find();

  for (let user of users) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.parentEmail,
        subject: "📊 Daily Report",
        text: `Today's total screen time: ${user.usage} minutes.`
      });

      user.usage = 0;
      await user.save();

    } catch (err) {
      console.log(err);
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running..."));