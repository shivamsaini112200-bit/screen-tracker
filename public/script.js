let currentUser = "";

// REGISTER
function register() {
  fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: document.getElementById("rname").value,
      password: document.getElementById("rpass").value,
      parentPhone: document.getElementById("parent").value
    })
  })
    .then(res => res.text())
    .then(data => alert(data))
    .catch(err => console.log(err));
}


// LOGIN
function login() {
  let name = document.getElementById("lname").value;
  let password = document.getElementById("lpass").value;

  fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: name,
      password: password
    })
  })
    .then(res => {
      if (!res.ok) throw new Error("Login failed");
      return res.json();
    })
    .then(data => {
      // 🔥 IMPORTANT FIX
      currentUser = data.user.name;

      localStorage.setItem("user", currentUser);

      window.location = "dashboard.html";
    })
    .catch(err => alert(err.message));
}


// ADD TIME
function addTime() {
  let user = localStorage.getItem("user");
  let time = document.getElementById("time").value;

  fetch("/add-time", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: user,
      time: time
    })
  })
    .then(res => res.text())
    .then(data => alert(data))
    .catch(err => console.log(err));
}


// LOGOUT
function logout() {
  let user = localStorage.getItem("user");

  fetch("/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name: user })
  })
    .then(() => {
      localStorage.removeItem("user");
      window.location = "index.html";
    })
    .catch(err => console.log(err));
}