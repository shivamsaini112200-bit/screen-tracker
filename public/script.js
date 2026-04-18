let currentUser = "";

// REGISTER
function register() {
  fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("rname").value,
      password: document.getElementById("rpass").value,
      parentEmail: document.getElementById("parent").value
    })
  })
    .then(res => res.text())
    .then(alert);
}

// LOGIN
function login() {
  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("lname").value,
      password: document.getElementById("lpass").value
    })
  })
    .then(res => res.json())
    .then(data => {
      currentUser = data.name;
      localStorage.setItem("user", currentUser);
      window.location = "dashboard.html";
    })
    .catch(() => alert("Login failed"));
}

// TOTAL
function updateTotal(time) {
  let total = localStorage.getItem("total") || 0;
  total = parseInt(total) + parseInt(time);
  localStorage.setItem("total", total);

  document.getElementById("total").innerText =
    "Total: " + total + " mins";
}

// GRAPH
let chart;

function loadChart() {
  const ctx = document.getElementById("chart");

  let data = JSON.parse(localStorage.getItem("history")) || [];

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map((_, i) => "Entry " + (i + 1)),
      datasets: [{
        label: "Screen Time",
        data: data,
        borderWidth: 2
      }]
    }
  });
}

function updateChart(time) {
  let history = JSON.parse(localStorage.getItem("history")) || [];

  history.push(parseInt(time));
  localStorage.setItem("history", JSON.stringify(history));

  chart.data.labels.push("Entry " + history.length);
  chart.data.datasets[0].data.push(time);
  chart.update();
}

// LIMIT WARNING
function checkLimit(time) {
  if (time > 300) {
    alert("⚠️ Screen time limit exceeded!");
  }
}

// ADD TIME
function addTime() {
  const btn = document.querySelector("button");
  btn.disabled = true;

  let user = localStorage.getItem("user");
  let time = document.getElementById("time").value;

  fetch("/add-time", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: user,
      time: time
    })
  })
    .then(res => res.text())
    .then(msg => {
      document.getElementById("msg").innerText = msg;

      updateTotal(time);
      updateChart(time);
      checkLimit(time);

      btn.disabled = false;
    })
    .catch(() => {
      btn.disabled = false;
    });
}

// LOGOUT
function logout() {
  localStorage.removeItem("user");
  window.location = "index.html";
}

// LOAD
window.onload = () => {
  if (document.getElementById("chart")) {
    loadChart();
  }
};