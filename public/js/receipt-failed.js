(function () {
  API.requireAuth();

  const u = new URL(window.location.href);
  const reason = (u.searchParams.get("reason") || "").toLowerCase();

  const reasonText = document.getElementById("reasonText");
  const reasonDetail = document.getElementById("reasonDetail");

  let detail = "Unknown error";
  if (reason.includes("insufficient")) detail = "Insufficient balance";
  else if (reason) detail = reason;

  if (reasonText) reasonText.textContent = detail;
  if (reasonDetail) reasonDetail.textContent = detail;

  document.getElementById("tryAgainBtn")?.addEventListener("click", () => (window.location.href = "/checkout.html"));
  document.getElementById("backItemsBtn")?.addEventListener("click", () => (window.location.href = "/items.html"));
  document.getElementById("backDashBtn")?.addEventListener("click", () => (window.location.href = "/dashboard.html"));
})();