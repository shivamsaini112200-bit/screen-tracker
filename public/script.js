let currentUser = "";

// ===== REGISTER =====
function register() {
  fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("rname").value,
      password: document.getElementById("rpass").value,
      parentPhone: document.getElementById("parent").value
    })
  })
    .then(res => res.text())
    .then(msg => alert(msg))
    .catch(err => alert(err.message));
}

// ===== LOGIN =====
function login() {
  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("lname").value,
      password: document.getElementById("lpass").value
    })
  })
    .then(res => res.text())   
    .then(text => {
      try {
        const data = JSON.parse(text);

        if (!data || !data.name) {
          throw new Error("Login failed");
        }

        currentUser = data.name;
        localStorage.setItem("user", currentUser);

        window.location = "dashboard.html";
      } catch (e) {
        
        alert(text);
      }
    })
    .catch(err => alert(err.message));
}

// ===== ADD TIME =====
function addTime() {
  let user = localStorage.getItem("user");

  if (!user) {
    alert("Login first");
    return;
  }

  fetch("/add-time", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: user,
      time: document.getElementById("time").value
    })
  })
    .then(res => res.text())
    .then(msg => alert(msg))
    .catch(err => alert(err.message));
}

// ===== LOGOUT =====
function logout() {
  let user = localStorage.getItem("user");

  fetch("/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: user })
  }).then(() => {
    localStorage.removeItem("user");
    window.location = "index.html";
  });
}