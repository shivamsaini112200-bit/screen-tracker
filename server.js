const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.json());

// ✅ Twilio config (Render se aayega)
const client = new twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const twilioNumber = process.env.TWILIO_PHONE;

// 📩 SMS FUNCTION
function sendSMS(to, message) {
  return client.messages.create({
    body: message,
    from: twilioNumber,
    to: to
  });
}

let users = [];

// ===== REGISTER =====
app.post("/register", (req, res) => {
  const { name, password, parentPhone } = req.body;

  users.push({
    name,
    password,
    parentPhone,
    usage: 0
  });

  res.send("Registered successfully");
});

// ===== LOGIN =====
app.post("/login", (req, res) => {
  const { name, password } = req.body;

  const user = users.find(
    (u) => u.name === name && u.password === password
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

  const user = users.find((u) => u.name === name);

  if (!user) {
    return res.status(404).send("User not found");
  }

  user.usage += parseInt(time);

  try {
    // 🔥 SMS SEND HERE
    await sendSMS(
      user.parentPhone,
      `Your child used ${user.usage} minutes today.`
    );

    res.send("Time added & SMS sent ✅");
  } catch (err) {
    console.log(err.message);
    res.send("Time added but SMS failed ❌");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running...");
});