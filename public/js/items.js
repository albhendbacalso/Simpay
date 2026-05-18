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

  function addToCart(itemId, qty = 1) {
    const cart = getCart();
    const existing = cart.find((x) => x.item_id === itemId);
    if (existing) existing.quantity += qty;
    else cart.push({ item_id: itemId, quantity: qty });
    setCart(cart);
  }

  function removeFromCart(itemId) {
    const cart = getCart().filter((x) => x.item_id !== itemId);
    setCart(cart);
  }

  function isSelected(itemId) {
    return getCart().some((x) => x.item_id === itemId);
  }

  function php(cents) {
    return "₱ " + (Number(cents || 0) / 100).toFixed(2);
  }

  function iconFor(name = "") {
    const n = name.toLowerCase();
    if (n.includes("meralco")) return { icon: "bolt", bg: "bg-orange-100", fg: "text-orange-600" };
    if (n.includes("maynilad")) return { icon: "water_drop", bg: "bg-blue-100", fg: "text-blue-600" };
    if (n.includes("pldt")) return { icon: "router", bg: "bg-red-100", fg: "text-red-600" };
    if (n.includes("globe")) return { icon: "smartphone", bg: "bg-emerald-100", fg: "text-emerald-600" };
    if (n.includes("sky")) return { icon: "tv", bg: "bg-slate-100", fg: "text-slate-700" };
    return { icon: "inventory_2", bg: "bg-slate-100", fg: "text-slate-700" };
  }

  function computeTotals(items) {
    const cart = getCart();
    let subtotal = 0;

    const selected = cart
      .map((c) => {
        const it = items.find((x) => x.id === c.item_id);
        if (!it) return null;
        const lineTotal = it.price_cents * c.quantity;
        subtotal += lineTotal;
        return { ...it, quantity: c.quantity, lineTotal };
      })
      .filter(Boolean);

    return { selected, subtotal };
  }

  function renderSummary(items) {
    const summaryList = document.getElementById("summaryList");
    const subtotalEl = document.getElementById("summarySubtotal");
    const totalEl = document.getElementById("summaryTotal");

    const { selected, subtotal } = computeTotals(items);

    if (summaryList) {
      if (selected.length === 0) {
        summaryList.innerHTML = `<p class="text-sm text-slate-500">No items selected.</p>`;
      } else {
        summaryList.innerHTML = selected
          .map((it) => {
            const meta = iconFor(it.name);
            return `
              <div class="flex items-center justify-between group">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 ${meta.bg} rounded flex items-center justify-center">
                    <span class="material-symbols-outlined ${meta.fg} text-sm">${meta.icon}</span>
                  </div>
                  <div>
                    <p class="text-sm font-bold">${it.name}</p>
                    <p class="text-xs text-slate-500">Qty: ${it.quantity}</p>
                  </div>
                </div>
                <span class="text-sm font-bold">${php(it.lineTotal)}</span>
              </div>
            `;
          })
          .join("");
      }
    }

    if (subtotalEl) subtotalEl.textContent = php(subtotal);
    if (totalEl) totalEl.textContent = php(subtotal); // no extra fee in SRS
  }

  function renderItems(items) {
    const grid = document.getElementById("itemsGrid");
    if (!grid) return;

    grid.innerHTML = items
      .map((it) => {
        const checked = isSelected(it.id) ? "checked" : "";
        const meta = iconFor(it.name);

        return `
          <div class="group relative bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 transition-all shadow-sm hover:shadow-md">
            <div class="flex justify-between items-start mb-4">
              <div class="w-12 h-12 ${meta.bg} rounded-lg flex items-center justify-center">
                <span class="material-symbols-outlined ${meta.fg} text-3xl">${meta.icon}</span>
              </div>

              <input
                data-item-id="${it.id}"
                class="itemCheckbox w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                type="checkbox"
                ${checked}
                aria-label="Select ${it.name}"
              />
            </div>

            <h3 class="font-bold text-lg text-slate-900 dark:text-white">${it.name}</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">${it.description || ""}</p>

            <div class="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Price</span>
              <span class="font-bold text-blue-600 dark:text-blue-400">${php(it.price_cents)}</span>
            </div>
          </div>
        `;
      })
      .join("");

    // bind checkbox events
    grid.querySelectorAll(".itemCheckbox").forEach((cb) => {
      cb.addEventListener("change", (e) => {
        const itemId = Number(e.target.getAttribute("data-item-id"));
        if (e.target.checked) addToCart(itemId, 1);
        else removeFromCart(itemId);

        renderSummary(items);
      });
    });
  }

  function bindProceedButton() {
    const btn = document.getElementById("proceedBtn");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const cart = getCart();
      if (cart.length === 0) {
        alert("Please select at least one item.");
        return;
      }
      window.location.href = "/checkout.html";
    });
  }

  async function main() {
    try {
      const items = await API.request("/api/items");
      renderItems(items);
      renderSummary(items);
      bindProceedButton();
    } catch (err) {
      alert(err.message || "Failed to load items.");
      if ((err.message || "").toLowerCase().includes("token")) {
        localStorage.removeItem("simpay_token");
        window.location.href = "/login.html";
      }
    }
  }

  main();
})();