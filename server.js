const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.json());

// Twilio Config
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = "8476941429"; // your number

const client = new twilio(accountSid, authToken);

// SMS Function
function sendSMS(to, message) {
  if (!accountSid || !authToken) {
    console.log("Twilio not configured");
    return;
  }

  client.messages
    .create({
      body: message,
      from: twilioNumber,
      to: to,
    })
    .then((msg) => console.log("SMS Sent:", msg.sid))
    .catch((err) => console.log(err.message));
}

// Temporary storage (NOTE: reset on restart)
let users = [];

// REGISTER
app.post("/register", (req, res) => {
  const { name, password, parentPhone } = req.body;

  if (!name || !password || !parentPhone) {
    return res.status(400).send("Missing fields");
  }

  const existing = users.find((u) => u.name === name);
  if (existing) {
    return res.status(400).send("User already exists");
  }

  users.push({ name, password, parentPhone, usage: 0 });

  res.send("Registered successfully");
});

// LOGIN
app.post("/login", (req, res) => {
  const { name, password } = req.body;

  const user = users.find(
    (u) => u.name === name && u.password === password
  );

  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(401).send("Invalid credentials");
  }
});

// ADD SCREEN TIME
app.post("/add-time", (req, res) => {
  const { name, time } = req.body;

  const user = users.find((u) => u.name === name);

  if (user) {
    user.usage += parseInt(time);

    sendSMS(
      user.parentPhone,
      `Your child used ${user.usage} minutes today.`
    );

    res.send("Time added & SMS sent");
  } else {
    res.status(404).send("User not found");
  }
});

// LOGOUT
app.post("/logout", (req, res) => {
  const { name } = req.body;

  const user = users.find((u) => u.name === name);

  if (user) {
    sendSMS(
      user.parentPhone,
      "Alert! Your child logged out."
    );
    res.send("Logout alert sent");
  } else {
    res.status(404).send("User not found");
  }
});

// PORT FIX (important for Render)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running...");
});