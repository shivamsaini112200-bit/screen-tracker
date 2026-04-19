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

  // 🔥 NEW: last 7 days history
  dailyHistory: [
    {
      date: String,     // e.g. "2026-04-19"
      usage: Number
    }
  ],

  alertSent: { type: Boolean, default: false },
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

    const todayStr = new Date().toISOString().slice(0, 10);
    const lastStr = new Date(user.lastReset).toISOString().slice(0, 10);

    // 🔄 New day → push yesterday to history
    if (todayStr !== lastStr) {
      user.dailyHistory.push({
        date: lastStr,
        usage: user.usage
      });

      // keep only last 7 days
      if (user.dailyHistory.length > 7) {
        user.dailyHistory.shift();
      }

      user.usage = 0;
      user.alertSent = false;
      user.lastReset = new Date();
    }

    // ➕ Add time
    user.usage += parseInt(time);

    // update today's entry in history (live)
    let todayEntry = user.dailyHistory.find(d => d.date === todayStr);
    if (todayEntry) {
      todayEntry.usage = user.usage;
    } else {
      user.dailyHistory.push({ date: todayStr, usage: user.usage });
    }

    await user.save();

    // 📧 normal email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.parentEmail,
      subject: "Screen Time Update",
      text: `Today's screen time: ${user.usage} minutes`
    });

    // 🚨 alert (once/day, >240)
    if (user.usage > 240 && !user.alertSent) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.parentEmail,
        subject: "⚠ Screen Time Limit Exceeded",
        text: `Alert: Usage is ${user.usage} minutes (limit 240)`
      });

      user.alertSent = true;
      await user.save();
    }

    res.send("Time added & Email sent");

  } catch (err) {
    console.log(err);
    res.send("Error");
  }
});

// ===== GET HISTORY (last 7 days) =====
app.get("/history/:name", async (req, res) => {
  try {
    const user = await User.findOne({ name });
    if (!user) return res.json([]);

    res.json(user.dailyHistory);
  } catch (err) {
    console.log(err);
    res.json([]);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running..."));