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

// ADD TIME
function addTime() {
  let user = localStorage.getItem("user");
  let time = document.getElementById("time").value;

  fetch("/add-time", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: user, time: time })
  })
    .then(res => res.text())
    .then(msg => {
      document.getElementById("msg").innerText = msg;
      document.getElementById("time").value = "";
      loadGraph(); // 🔥 refresh graph
    });
}

// GRAPH
async function loadGraph() {
  let user = localStorage.getItem("user");

  const res = await fetch(`/history/${user}`);
  const data = await res.json();

  const labels = data.map(d => d.date);
  const values = data.map(d => d.usage);

  const ctx = document.getElementById("usageChart");

  if (!ctx) return;

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Daily Screen Time (min)",
        data: values,
        borderWidth: 2,
        tension: 0.3
      }]
    }
  });
}

// LOAD
window.onload = () => {
  loadGraph();

  let user = localStorage.getItem("user");
  if (user) {
    document.getElementById("welcome").innerText =
      "Welcome, " + user;
  }
};