(function () {
  API.requireAuth();

  const errEl = document.getElementById("err");
  const itemsList = document.getElementById("itemsList");
  const receiptCodeEl = document.getElementById("receiptCode");
  const dateTimeEl = document.getElementById("dateTime");
  const totalAmountEl = document.getElementById("totalAmount");
  const customerEmailEl = document.getElementById("customerEmail");

  function showError(msg) {
    if (!errEl) return alert(msg);
    errEl.classList.remove("hidden");
    errEl.textContent = msg;
  }

  function php(cents) {
    return "₱ " + (Number(cents || 0) / 100).toFixed(2);
  }

  function formatDateTime(s) {
    try {
      // sqlite: "YYYY-MM-DD HH:MM:SS"
      const iso = String(s).replace(" ", "T") + "Z";
      const d = new Date(iso);
      if (isNaN(d.getTime())) return String(s);
      return d.toLocaleString();
    } catch {
      return String(s || "");
    }
  }

  function getReceiptId() {
    const u = new URL(window.location.href);
    return u.searchParams.get("id");
  }

  async function load() {
    const id = getReceiptId();
    if (!id) {
      showError("Missing receipt id.");
      return;
    }

    try {
      const data = await API.request(`/api/receipts/${encodeURIComponent(id)}`);

      const { receipt, items } = data;

      if (receiptCodeEl) receiptCodeEl.textContent = receipt.receipt_code || "—";
      if (dateTimeEl) dateTimeEl.textContent = formatDateTime(receipt.created_at);
      if (totalAmountEl) totalAmountEl.textContent = php(receipt.amount_cents);

      // customer = email from token payload isn't stored in UI; simplest: show logged-in email in localStorage token is JWT
      // We can display the email from token by decoding base64 payload (no verification needed for display)
      try {
        const token = localStorage.getItem("simpay_token");
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (customerEmailEl) customerEmailEl.textContent = payload.email || "SimPay User";
      } catch {
        if (customerEmailEl) customerEmailEl.textContent = "SimPay User";
      }

      if (itemsList) {
        if (!items || items.length === 0) {
          itemsList.innerHTML = `<p class="text-sm text-slate-500">No items found for this receipt.</p>`;
        } else {
          itemsList.innerHTML = items
            .map(
              (it) => `
            <div class="flex justify-between items-center text-sm">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <span class="material-symbols-outlined text-lg">receipt_long</span>
                </div>
                <div>
                  <span class="text-slate-700 font-semibold">${it.name}</span>
                  <div class="text-[11px] text-slate-400">Qty: ${it.quantity} • ${php(it.price_cents)} each</div>
                </div>
              </div>
              <span class="text-slate-900 font-bold">${php(it.subtotal_cents)}</span>
            </div>
          `
            )
            .join("");
        }
      }

      // Buttons
      document.getElementById("backBtn")?.addEventListener("click", () => (window.location.href = "/dashboard.html"));
      document.getElementById("printBtn")?.addEventListener("click", () => window.print());

      document.getElementById("downloadBtn")?.addEventListener("click", () => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `simpay-receipt-${receipt.receipt_code || id}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
    } catch (e) {
      showError(e.message || "Failed to load receipt.");
    }
  }

  load();
})();