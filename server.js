const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.json());

// Twilio Config
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = "8476941429";

const client = new twilio(accountSid, authToken);

// SMS Function
function sendSMS(to, message) {
    client.messages.create({
        body: message,
        from: twilioNumber,
        to: to
    })
    .then(msg => console.log("SMS Sent:", msg.sid))
    .catch(err => console.log(err.message));
}

let users = [];

// Register
app.post("/register", (req, res) => {
    const { name, password, parentPhone } = req.body;
    users.push({ name, password, parentPhone, usage: 0 });
    res.send("Registered successfully");
});

// Login
app.post("/login", (req, res) => {
    const { name, password } = req.body;
    const user = users.find(u => u.name === name && u.password === password);

    if (user) res.json(user);
    else res.status(401).send("Invalid credentials");
});

// Add Screen Time
app.post("/add-time", (req, res) => {
    const { name, time } = req.body;
    const user = users.find(u => u.name === name);

    if (user) {
        user.usage += parseInt(time);
        sendSMS(user.parentPhone, `Your child used ${user.usage} minutes today.`);
        res.send("Time added & SMS sent");
    } else {
        res.status(404).send("User not found");
    }
});

// Logout
app.post("/logout", (req, res) => {
    const { name } = req.body;
    const user = users.find(u => u.name === name);

    if (user) {
        sendSMS(user.parentPhone, "Alert! Your child logged out.");
        res.send("Logout alert sent");
    } else {
        res.status(404).send("User not found");
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running...");
});