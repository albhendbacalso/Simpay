(function () {
  // Redirect to login if not authenticated
  API.requireAuth();

  function formatPHPFromCents(cents) {
    return "₱ " + (Number(cents || 0) / 100).toFixed(2);
  }

  async function loadBalance() {
    try {
      const data = await API.request("/api/wallet/balance");
      const el = document.getElementById("balanceAmount");
      if (el) el.textContent = formatPHPFromCents(data.balance_cents);
    } catch (err) {
      console.error("Failed to load balance:", err);
    }
  }

  function bindActions() {
    const cashInBtn = document.getElementById("cashInBtn");
    const sendMoneyBtn = document.getElementById("sendMoneyBtn");

    if (cashInBtn) cashInBtn.addEventListener("click", () => (window.location.href = "/cashin.html"));
    if (sendMoneyBtn) sendMoneyBtn.addEventListener("click", () => (window.location.href = "/sendmoney.html"));
  }

  function bindLogout() {
    const doLogout = () => {
      localStorage.removeItem("simpay_token");
      localStorage.removeItem("cart");
      window.location.href = "/login.html";
    };

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", (e) => { e.preventDefault(); doLogout(); });
  }

  bindActions();
  bindLogout();
  loadBalance();
})();