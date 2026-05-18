window.API = {
  getToken() {
    return localStorage.getItem("simpay_token");
  },

  requireAuth() {
    const token = this.getToken();
    if (!token) window.location.href = "/login.html";
    return token;
  },

  async request(path, { method = "GET", body } = {}) {
    const headers = {};
    const token = this.getToken();
    if (token) headers.Authorization = "Bearer " + token;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    const res = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.error || "Request failed";
      throw new Error(msg);
    }
    return data;
  }
};