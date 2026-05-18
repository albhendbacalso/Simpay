(function () {
  const form = document.getElementById("registerForm") || document.querySelector("form");
  const msg = document.getElementById("msg");
  const btn = document.getElementById("registerBtn");

  function showMessage(text, type = "error") {
    if (!msg) return alert(text);
    msg.classList.remove("hidden");
    msg.textContent = text;
    msg.className =
      type === "success"
        ? "mb-5 text-sm font-medium rounded-lg p-3 bg-green-50 text-green-700 border border-green-200"
        : "mb-5 text-sm font-medium rounded-lg p-3 bg-red-50 text-red-700 border border-red-200";
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

    const username = document.getElementById("username")?.value?.trim();
    const email = document.getElementById("email")?.value?.trim();
    const password = document.getElementById("password")?.value;

    if (!username || !email || !password) {
      showMessage("Please complete all fields.");
      if (btn) btn.disabled = false;
      return;
    }

    try {
      await API.request("/api/auth/register", {
        method: "POST",
        body: { username, email, password }
      });

      showMessage("Registration successful. Redirecting to login...", "success");
      setTimeout(() => (window.location.href = "/login.html"), 800);
    } catch (err) {
      showMessage(err.message || "Registration failed.");
    } finally {
      if (btn) btn.disabled = false;
    }
  });
})();