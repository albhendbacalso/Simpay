(function () {
  API.requireAuth();

  const CART_KEY = "cart";

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function setCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function clearCart() {
    localStorage.removeItem(CART_KEY);
  }

  function php(cents) {
    return "₱ " + (Number(cents || 0) / 100).toFixed(2);
  }

  async function loadWalletBalance() {
    const el = document.getElementById("walletBalance");
    if (!el) return;

    try {
      const data = await API.request("/api/wallet/balance");
      el.textContent = php(data.balance_cents);
    } catch {
      el.textContent = "₱ 0.00";
    }
  }

  function renderCheckoutTable(lines) {
    const tbody = document.getElementById("checkoutTableBody");
    if (!tbody) return;

    tbody.innerHTML = lines
      .map(
        (l) => `
        <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1;">receipt_long</span>
              </div>
              <div>
                <div class="font-bold text-slate-900 dark:text-white">${l.name}</div>
                <div class="text-xs text-slate-500">${l.description || ""}</div>
                <div class="text-[11px] text-slate-400">Qty: ${l.quantity}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">—</td>
          <td class="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white">${php(l.lineTotal)}</td>
        </tr>
      `
      )
      .join("");
  }

  function renderSummary(subtotalCents) {
    const subtotalEl = document.getElementById("subtotalAmount");
    const totalEl = document.getElementById("totalAmount");
    const badge = document.getElementById("itemCountBadge");

    const cart = getCart();
    const itemCount = cart.reduce((sum, x) => sum + x.quantity, 0);

    if (badge) badge.textContent = `${itemCount} ITEM${itemCount === 1 ? "" : "S"}`;
    if (subtotalEl) subtotalEl.textContent = php(subtotalCents);
    if (totalEl) totalEl.textContent = php(subtotalCents); // no additional fees in SRS
  }

  async function loadCheckout() {
    const cart = getCart();
    if (cart.length === 0) {
      alert("Your cart is empty. Please select items first.");
      window.location.href = "/items.html";
      return;
    }

    // fetch all items, then map cart -> lines
    const items = await API.request("/api/items");
    const map = new Map(items.map((x) => [x.id, x]));

    const lines = [];
    let subtotal = 0;

    for (const c of cart) {
      const it = map.get(c.item_id);
      if (!it) continue;
      const lineTotal = it.price_cents * c.quantity;
      subtotal += lineTotal;
      lines.push({ ...it, quantity: c.quantity, lineTotal });
    }

    if (lines.length === 0) {
      alert("Your cart items are no longer available.");
      clearCart();
      window.location.href = "/items.html";
      return;
    }

    renderCheckoutTable(lines);
    renderSummary(subtotal);
  }

  async function payNow() {
    const btn = document.getElementById("payBtn");
    if (btn) btn.disabled = true;

    try {
      const cart = getCart();
      const result = await API.request("/api/payments/checkout", {
        method: "POST",
        body: { items: cart }
      });

      // success
      clearCart();
      // Redirect to receipt success with receipt_id
      window.location.href = `/receipt-success.html?id=${encodeURIComponent(result.receipt_id)}`;
    } catch (err) {
      // Insufficient balance -> failed receipt
      if ((err.message || "").toLowerCase().includes("insufficient")) {
        window.location.href = `/receipt-failed.html?reason=insufficient`;
        return;
      }
      alert(err.message || "Payment failed.");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function bindPayButton() {
    const btn = document.getElementById("payBtn");
    if (!btn) return;
    btn.addEventListener("click", payNow);
  }

  async function main() {
    await loadWalletBalance();
    await loadCheckout();
    bindPayButton();
  }

  main().catch((e) => {
    alert(e.message || "Checkout load failed.");
  });
})();