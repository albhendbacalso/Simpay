(function () {
  API.requireAuth();

  const msg = document.getElementById("msg");
  const emailText = document.getElementById("emailText");
  const balanceText = document.getElementById("balanceText");
  const logoutBtn = document.getElementById("logoutBtn");

  function showMessage(text, type = "error") {
    if (!msg) return;
    msg.classList.remove("hidden");
    msg.textContent = text;
    msg.className =
      type === "success"
        ? "mb-6 text-sm font-medium rounded-xl p-3 bg-green-50 text-green-700 border border-green-200"
        : "mb-6 text-sm font-medium rounded-xl p-3 bg-red-50 text-red-700 border border-red-200";
  }

  function php(cents) {
    return "₱ " + (Number(cents || 0) / 100).toFixed(2);
  }

  function decodeEmailFromToken() {
    try {
      const token = localStorage.getItem("simpay_token");
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.email || "SimPay User";
    } catch {
      return "SimPay User";
    }
  }

  async function load() {
    if (emailText) emailText.textContent = decodeEmailFromToken();

    try {
      const bal = await API.request("/api/wallet/balance");
      if (balanceText) balanceText.textContent = php(bal.balance_cents);
    } catch (e) {
      showMessage(e.message || "Failed to load balance.");
    }
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("simpay_token");
      localStorage.removeItem("cart");
      window.location.href = "/login.html";
    });
  }

  load();
})();