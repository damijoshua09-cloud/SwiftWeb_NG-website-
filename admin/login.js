(function () {
  "use strict";

  // The admin panel is always served BY the backend itself (see server.js:
  // app.use("/admin", ...)), so API calls can use relative paths and stay
  // same-origin — no CORS configuration needed for the admin panel itself.

  var form = document.getElementById("loginForm");
  var errorEl = document.getElementById("loginError");
  var btn = document.getElementById("loginBtn");

  // If already logged in, skip straight to the dashboard.
  fetch("/api/admin/me", { credentials: "include" }).then(function (res) {
    if (res.ok) window.location.href = "index.html";
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorEl.textContent = "";
    btn.disabled = true;
    btn.textContent = "Logging in...";

    var email = document.getElementById("email").value.trim();
    var password = document.getElementById("password").value;

    fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: email, password: password })
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok && result.data.success) {
          window.location.href = "index.html";
        } else {
          errorEl.textContent = (result.data && result.data.message) || "Login failed.";
        }
      })
      .catch(function () {
        errorEl.textContent = "Could not reach the server. Please try again.";
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = "Log In";
      });
  });
})();
