/* YuvaSense — yönetim paneli kabuğu (sidebar + topbar) */

const NAV_ITEMS = [
  { key: "dashboard", href: "/dashboard.html", label: "Panel", roles: ["admin", "teacher"], icon: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>' },
  { key: "classrooms", href: "/classrooms.html", label: "Sınıflar", roles: ["admin", "teacher"], icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>' },
  { key: "children", href: "/children.html", label: "Çocuklar", roles: ["admin", "teacher"], icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
  { key: "staff", href: "/staff.html", label: "Personel", roles: ["admin", "teacher"], icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>' },
  { key: "attendance", href: "/attendance.html", label: "Yoklama", roles: ["admin", "teacher"], icon: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
  { key: "billing", href: "/billing.html", label: "Faturalandırma", roles: ["admin"], icon: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>' },
  { key: "parents", href: "/parents.html", label: "Veliler", roles: ["admin"], icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' }
];

function renderSidebar(activeKey, user) {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  const links = NAV_ITEMS.filter((i) => i.roles.includes(user.role))
    .map(
      (item) => `
      <a href="${item.href}" class="${item.key === activeKey ? "active" : ""}">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${item.icon}</svg>
        ${item.label}
      </a>`
    )
    .join("");

  const initials = (user.name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  sidebar.innerHTML = `
    <div class="brand">
      <svg class="logo-mark" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#1e8a78"/><path d="M9 17.5c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5-3.1 5.5-7 5.5-7-1.9-7-5.5z" fill="#fff"/><circle cx="13" cy="16.5" r="1.4" fill="#1e8a78"/><circle cx="19" cy="16.5" r="1.4" fill="#1e8a78"/></svg>
      YuvaSense
    </div>
    <nav>${links}</nav>
    <div class="sidebar-footer">
      <div class="user-chip">
        <div class="avatar">${initials}</div>
        <div><strong>${escapeHtml(user.name)}</strong><span>${user.role === "admin" ? "Yönetici" : "Öğretmen"}</span></div>
      </div>
      <a href="#" class="logout-link" id="logoutLink">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Çıkış Yap
      </a>
    </div>`;

  document.getElementById("logoutLink").addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await Api.post("/api/auth/logout");
    } catch (err) {
      /* yine de yönlendir */
    }
    window.location.href = "/login.html";
  });
}

/**
 * Sayfayi yetkilendirir ve kabugu (sidebar/topbar) hazirlar.
 * @param {string} activeKey - aktif nav ogesi
 * @returns {Promise<object>} oturum acmis kullanici
 */
async function initShell(activeKey) {
  try {
    const data = await Api.get("/api/auth/me");
    if (!["admin", "teacher"].includes(data.user.role)) {
      window.location.href = "/login.html";
      return Promise.reject();
    }
    renderSidebar(activeKey, data.user);
    return data.user;
  } catch (err) {
    window.location.href = "/login.html";
    return Promise.reject(err);
  }
}
