(function () {
  API.requireAuth();

  const msg = document.getElementById("msg");
  const recipientEmail = document.getElementById("recipientEmail");
  const sendAmount = document.getElementById("sendAmount");
  const availableBalanceEl = document.getElementById("availableBalance");
  const maxBtn = document.getElementById("maxBtn");
  const sendBtn = document.getElementById("sendBtn");

  let balanceCents = 0;

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

  async function loadBalance() {
    const data = await API.request("/api/wallet/balance");
    balanceCents = Number(data.balance_cents || 0);
    if (availableBalanceEl) availableBalanceEl.textContent = php(balanceCents);
  }

  if (maxBtn) {
    maxBtn.addEventListener("click", () => {
      sendAmount.value = (balanceCents / 100).toFixed(2);
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", async () => {
      const email = recipientEmail.value.trim();
      const cents = parseToCents(sendAmount.value);

      if (!email) return showMessage("Please enter recipient email.");
      if (!cents) return showMessage("Please enter a valid amount.");
      if (cents > balanceCents) return showMessage("Insufficient balance.");

      sendBtn.disabled = true;

      try {
        const res = await API.request("/api/wallet/send", {
          method: "POST",
          body: { recipient_email: email, amount_cents: cents }
        });

        showMessage("Transfer successful. Reference: " + res.ref, "success");
        setTimeout(() => (window.location.href = "/history.html"), 900);
      } catch (e) {
        showMessage(e.message || "Transfer failed.");
      } finally {
        sendBtn.disabled = false;
      }
    });
  }

  // Logout
  document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("simpay_token");
    localStorage.removeItem("cart");
    window.location.href = "/login.html";
  });

  loadBalance().catch((e) => showMessage(e.message || "Failed to load balance."));
})();