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
  alertSent: { type: Boolean, default: false }, // 🔥 daily alert control
  lastReset: { type: Date, default: Date.now }
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
  const { name, password, parentEmail } = req.body;

  try {
    const user = new User({ name, password, parentEmail });
    await user.save();
    res.send("Registered");
  } catch (err) {
    console.log(err);
    res.send("Error");
  }
});

// ===== LOGIN =====
app.post("/login", async (req, res) => {
  const { name, password } = req.body;

  try {
    const user = await User.findOne({ name, password });

    if (!user) return res.send("Invalid login");

    res.json(user);
  } catch (err) {
    console.log(err);
    res.send("Error");
  }
});

// ===== ADD TIME =====
app.post("/add-time", async (req, res) => {
  const { name, time } = req.body;

  try {
    const user = await User.findOne({ name });

    if (!user) return res.send("User not found");

    // ===== DAILY RESET CHECK =====
    const today = new Date().toDateString();
    const last = new Date(user.lastReset).toDateString();

    if (today !== last) {
      user.usage = 0;
      user.alertSent = false;
      user.lastReset = new Date();
    }

    // ===== ADD TIME =====
    user.usage += parseInt(time);
    await user.save();

    // ===== NORMAL EMAIL =====
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.parentEmail,
      subject: "Screen Time Update",
      text: `Today's screen time: ${user.usage} minutes`
    });

    // ===== 🚨 ALERT SYSTEM (240 min, only once per day) =====
    if (user.usage > 240 && !user.alertSent) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.parentEmail,
        subject: "⚠ Screen Time Limit Exceeded",
        text: `Alert: Your child has used ${user.usage} minutes today (limit 240 min).`
      });

      user.alertSent = true;
      await user.save();
    }

    res.send("Time added & Email sent");

  } catch (err) {
    console.log(err);
    res.send("Error sending email");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running..."));