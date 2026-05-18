(function () {
  const form = document.getElementById("loginForm") || document.querySelector("form");
  const msg = document.getElementById("msg");
  const btn = document.getElementById("loginBtn");

  function showMessage(text, type = "error") {
    if (!msg) return alert(text);
    msg.classList.remove("hidden");
    msg.textContent = text;
    msg.className =
      type === "success"
        ? "mb-6 text-sm font-medium rounded-xl p-3 bg-green-50 text-green-700 border border-green-200"
        : "mb-6 text-sm font-medium rounded-xl p-3 bg-red-50 text-red-700 border border-red-200";
  }

  // password toggle
  const togglePw = document.getElementById("togglePw");
  if (togglePw) {
    togglePw.addEventListener("click", () => {
      const pw = document.getElementById("password");
      if (pw) pw.type = pw.type === "password" ? "text" : "password";
    });
  }

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (btn) btn.disabled = true;

    const email = document.getElementById("email")?.value?.trim();
    const password = document.getElementById("password")?.value;

    if (!email || !password) {
      showMessage("Please enter email and password.");
      if (btn) btn.disabled = false;
      return;
    }

    try {
      const data = await API.request("/api/auth/login", {
        method: "POST",
        body: { email, password }
      });

      localStorage.setItem("simpay_token", data.token);
      showMessage("Login successful. Redirecting...", "success");
      setTimeout(() => (window.location.href = "/dashboard.html"), 600);
    } catch (err) {
      showMessage(err.message || "Login failed.");
    } finally {
      if (btn) btn.disabled = false;
    }
  });
})();