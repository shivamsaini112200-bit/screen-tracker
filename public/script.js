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

// UPDATE TOTAL
function updateTotal(time) {
  let total = localStorage.getItem("total") || 0;
  total = parseInt(total) + parseInt(time);
  localStorage.setItem("total", total);

  document.getElementById("total").innerText =
    "Total: " + total + " mins";
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