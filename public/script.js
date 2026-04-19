let chart;

// REGISTER
function register() {
  const name = document.getElementById("rname").value;
  const password = document.getElementById("rpass").value;
  const parentEmail = document.getElementById("parent").value;

  fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, password, parentEmail })
  })
    .then(res => res.text())
    .then(msg => alert(msg))
    .catch(() => alert("Error"));
}

// LOGIN
function login() {
  const name = document.getElementById("lname").value;
  const password = document.getElementById("lpass").value;

  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, password })
  })
    .then(res => res.json())
    .then(data => {
      if (!data.name) {
        alert("Invalid login");
        return;
      }

      localStorage.setItem("user", data.name);
      window.location = "dashboard.html";
    })
    .catch(() => alert("Server error"));
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

      loadData();
    });
}

// LOAD DATA
async function loadData() {
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

// LOAD PAGE
window.onload = () => {
  if (document.getElementById("welcome")) {
    let user = localStorage.getItem("user");
    document.getElementById("welcome").innerText =
      "Welcome " + user;

    loadData();
  }
};

// LOGOUT
function logout() {
  localStorage.removeItem("user");
  window.location = "index.html";
}