const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cron = require("node-cron");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.json());

// 📩 Email setup
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
    usage: 0,
    dailyLimit: 180   // default limit
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

// ===== ADD TIME =====
app.post("/add-time", async (req, res) => {
  const { name, time } = req.body;

  const user = users.find(u => u.name === name);

  if (!user) return res.send("User not found");

  user.usage += parseInt(time);

  try {
    // 📧 normal email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.parentEmail,
      subject: "Screen Time Update",
      text: `Your child's screen time today is ${user.usage} minutes.`
    });

    // 🚨 limit exceeded
    if (user.usage > user.dailyLimit) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.parentEmail,
        subject: "⚠️ Screen Time Limit Exceeded",
        text: `Alert: Your child exceeded the daily limit of ${user.dailyLimit} minutes.`
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

  for (let user of users) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.parentEmail,
        subject: "📊 Daily Screen Time Report",
        text: `Today's total screen time: ${user.usage} minutes.`
      });

      user.usage = 0; // reset after report

    } catch (err) {
      console.log(err);
    }
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