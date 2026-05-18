(function () {
  API.requireAuth();

  const tbody = document.getElementById("historyBody");
  const countText = document.getElementById("countText");
  const searchBox = document.getElementById("searchBox");
  const logoutBtn = document.getElementById("logoutBtn");

  function php(cents) {
    return "₱ " + (Number(cents || 0) / 100).toFixed(2);
  }

  function formatDateTime(s) {
    try {
      const iso = String(s).replace(" ", "T") + "Z";
      const d = new Date(iso);
      if (isNaN(d.getTime())) return String(s);
      return d.toLocaleString();
    } catch {
      return String(s || "");
    }
  }

  function typeLabel(t) {
    switch (t) {
      case "PAYMENT": return "Payment";
      case "CASH_IN": return "Cash In";
      case "TRANSFER_IN": return "Transfer In";
      case "TRANSFER_OUT": return "Transfer Out";
      default: return t || "—";
    }
  }

  function badge(status) {
    const s = (status || "").toUpperCase();
    if (s === "SUCCESS" || s === "COMPLETED") return "bg-emerald-100 text-emerald-700";
    if (s === "FAILED") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
  }

  function amountSign(type) {
    if (type === "CASH_IN" || type === "TRANSFER_IN") return "+";
    if (type === "PAYMENT" || type === "TRANSFER_OUT") return "-";
    return "";
  }

  let allTx = [];

  function render(list) {
    if (!tbody) return;

    tbody.innerHTML = list
      .map((t) => {
        const sign = amountSign(t.type);
        const amt = `${sign} ${php(t.amount_cents)}`.trim();
        const statusClass = badge(t.status);
        const receiptLink = t.receipt_id
          ? `<a class="text-blue-600 font-bold text-xs hover:underline" href="/receipt-success.html?id=${encodeURIComponent(t.receipt_id)}">View</a>`
          : "—";

        return `
          <tr class="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-semibold">${formatDateTime(t.created_at)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="font-mono text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                TX-${t.id}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm font-bold">${typeLabel(t.type)}</div>
              <div class="text-xs text-slate-500">${t.receipt_code ? "Receipt: " + t.receipt_code : (t.ref || "")}</div>
            </td>
            <td class="px-6 py-4">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                ${t.status || "—"}
              </span>
            </td>
            <td class="px-6 py-4 text-right whitespace-nowrap">
              <span class="text-sm font-bold">${amt}</span>
            </td>
            <td class="px-6 py-4 text-right whitespace-nowrap">
              ${receiptLink}
            </td>
          </tr>
        `;
      })
      .join("");

    if (countText) countText.textContent = `Showing ${list.length} transaction(s)`;
  }

  function applySearch() {
    const q = (searchBox?.value || "").trim().toLowerCase();
    if (!q) return render(allTx);

    const filtered = allTx.filter((t) => {
      return (
        String(t.id).includes(q) ||
        String(t.type || "").toLowerCase().includes(q) ||
        String(t.status || "").toLowerCase().includes(q) ||
        String(t.ref || "").toLowerCase().includes(q) ||
        String(t.receipt_code || "").toLowerCase().includes(q)
      );
    });

    render(filtered);
  }

  async function load() {
    const txs = await API.request("/api/transactions");
    allTx = Array.isArray(txs) ? txs : [];
    render(allTx);
  }

  if (searchBox) searchBox.addEventListener("input", applySearch);

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("simpay_token");
      localStorage.removeItem("cart");
      window.location.href = "/login.html";
    });
  }

  load().catch((e) => {
    alert(e.message || "Failed to load history.");
  });
})();