(function () {
  API.requireAuth();

  const msg = document.getElementById("msg");
  const customAmount = document.getElementById("customAmount");
  const selectedAmountText = document.getElementById("selectedAmountText");
  const totalSettleText = document.getElementById("totalSettleText");
  const currentBalanceEl = document.getElementById("currentBalance");

  let selectedCents = 500000; // default = 5000.00

  function showMessage(text, type = "error") {
    if (!msg) return alert(text);
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

  function parseToCents(str) {
    const cleaned = String(str).replace(/,/g, "").trim();
    if (!cleaned) return null;
    const n = Number(cleaned);
    if (!isFinite(n) || n <= 0) return null;
    return Math.round(n * 100);
  }

  function updateSummary() {
    if (selectedAmountText) selectedAmountText.textContent = php(selectedCents);
    if (totalSettleText) totalSettleText.textContent = php(selectedCents);
  }

  async function loadBalance() {
    try {
      const data = await API.request("/api/wallet/balance");
      if (currentBalanceEl) currentBalanceEl.textContent = php(data.balance_cents);
    } catch {
      // ignore
    }
  }

  // Preset buttons
  document.querySelectorAll(".presetBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cents = Number(btn.getAttribute("data-preset"));
      if (!cents) return;
      selectedCents = cents;
      if (customAmount) customAmount.value = "";
      updateSummary();
    });
  });

  // Custom amount typing
  if (customAmount) {
    customAmount.addEventListener("input", () => {
      const cents = parseToCents(customAmount.value);
      if (cents) {
        selectedCents = cents;
        updateSummary();
      }
    });
  }

  // Cash in action
  document.getElementById("cashInBtn")?.addEventListener("click", async () => {
    if (!selectedCents || selectedCents < 1) {
      showMessage("Please enter a valid amount.");
      return;
    }

    try {
      const res = await API.request("/api/wallet/cash-in", {
        method: "POST",
        body: { amount_cents: selectedCents }
      });

      showMessage("Cash in successful. Reference: " + res.ref, "success");
      await loadBalance();

      setTimeout(() => (window.location.href = "/dashboard.html"), 900);
    } catch (e) {
      showMessage(e.message || "Cash in failed.");
    }
  });

  // Logout
  document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("simpay_token");
    localStorage.removeItem("cart");
    window.location.href = "/login.html";
  });

  updateSummary();
  loadBalance();
})();