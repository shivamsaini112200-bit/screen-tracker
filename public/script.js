let chart;

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
      localStorage.setItem("user", data.name);
      window.location = "dashboard.html";
    })
    .catch(() => alert("Login failed"));
}

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

// ADD TIME
function addTime() {
  let user = localStorage.getItem("user");
  let time = document.getElementById("time").value;

  if (!time) return alert("Enter time");

  fetch("/add-time", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: user, time })
  })
    .then(res => res.text())
    .then(msg => {
      document.getElementById("msg").innerText = msg;
      document.getElementById("time").value = "";

      // 🔥 UPDATE UI
      loadTotal();
      loadGraph();
    })
    .catch(() => alert("Error"));
}

// 🔥 TOTAL FUNCTION
async function loadTotal() {
  let user = localStorage.getItem("user");

  const res = await fetch(`/history/${user}`);
  const data = await res.json();

  if (!data.length) {
    document.getElementById("total").innerText = "Total: 0 mins";
    return;
  }

  const last = data[data.length - 1];

  document.getElementById("total").innerText =
    "Total: " + last.usage + " mins";
}

// 🔥 GRAPH FUNCTION
async function loadGraph() {
  let user = localStorage.getItem("user");

  const res = await fetch(`/history/${user}`);
  const data = await res.json();

  const labels = data.map(d => d.date);
  const values = data.map(d => d.usage);

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("usageChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Daily Screen Time",
        data: values,
        borderWidth: 2,
        tension: 0.3
      }]
    }
  });
}

// LOAD
window.onload = () => {
  let user = localStorage.getItem("user");

  document.getElementById("welcome").innerText =
    "Welcome " + user;

  loadTotal();
  loadGraph();
};

// LOGOUT
function logout() {
  localStorage.removeItem("user");
  window.location = "index.html";
}