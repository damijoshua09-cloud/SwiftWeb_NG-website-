(function () {
  "use strict";

  // Same-origin API calls — the admin panel is always served by the
  // backend itself (see server.js), so no API base URL is needed here.

  /* ---------------------------------------------------------
     Auth guard + logout
  --------------------------------------------------------- */
  fetch("/api/admin/me", { credentials: "include" }).then(function (res) {
    if (!res.ok) window.location.href = "login.html";
  });

  document.getElementById("logoutBtn").addEventListener("click", function () {
    fetch("/api/admin/logout", { method: "POST", credentials: "include" }).finally(function () {
      window.location.href = "login.html";
    });
  });

  /* ---------------------------------------------------------
     Tabs
  --------------------------------------------------------- */
  var sidebarLinks = document.querySelectorAll(".sidebar-link");
  sidebarLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      sidebarLinks.forEach(function (l) { l.classList.remove("is-active"); });
      link.classList.add("is-active");
      document.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.remove("is-active"); });
      document.getElementById("tab-" + link.getAttribute("data-tab")).classList.add("is-active");
    });
  });

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function formatDate(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) +
      " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  /* ===========================================================
     ENQUIRIES
  =========================================================== */
  var inquiriesBody = document.getElementById("inquiriesBody");
  var searchInput = document.getElementById("searchInput");
  var statusFilter = document.getElementById("statusFilter");
  var paginationEl = document.getElementById("pagination");

  var state = { page: 1, search: "", status: "" };
  var searchDebounce;

  function loadInquiries() {
    inquiriesBody.innerHTML = '<tr><td colspan="8" class="empty-state">Loading...</td></tr>';

    var params = new URLSearchParams();
    params.set("page", state.page);
    params.set("limit", 15);
    if (state.search) params.set("search", state.search);
    if (state.status) params.set("status", state.status);

    fetch("/api/admin/inquiries?" + params.toString(), { credentials: "include" })
      .then(function (res) {
        if (res.status === 401) { window.location.href = "login.html"; return null; }
        return res.json();
      })
      .then(function (result) {
        if (!result) return;
        if (!result.success) {
          inquiriesBody.innerHTML = '<tr><td colspan="8" class="empty-state">Failed to load enquiries.</td></tr>';
          return;
        }
        renderInquiries(result.data);
        renderPagination(result.pagination);
      })
      .catch(function () {
        inquiriesBody.innerHTML = '<tr><td colspan="8" class="empty-state">Could not reach the server.</td></tr>';
      });
  }

  function renderInquiries(rows) {
    if (!rows.length) {
      inquiriesBody.innerHTML = '<tr><td colspan="8" class="empty-state">No enquiries found.</td></tr>';
      return;
    }

    inquiriesBody.innerHTML = "";
    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + formatDate(row.created_at) + "</td>" +
        "<td>" + escapeHtml(row.name) + "</td>" +
        '<td><a href="mailto:' + escapeHtml(row.email) + '">' + escapeHtml(row.email) + "</a></td>" +
        "<td>" + escapeHtml(row.phone || "—") + "</td>" +
        "<td>" + escapeHtml(row.service) + "</td>" +
        '<td class="msg-cell">' + escapeHtml(row.message) + "</td>" +
        "<td></td>" +
        "<td></td>";

      var statusCell = tr.children[6];
      var select = document.createElement("select");
      select.className = "status-select status-" + row.status.replace(/\s+/g, "-");
      ["New", "In Progress", "Completed", "Archived"].forEach(function (s) {
        var opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        if (s === row.status) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener("change", function () {
        updateStatus(row.id, select.value);
      });
      statusCell.appendChild(select);

      var actionsCell = tr.children[7];
      var delBtn = document.createElement("button");
      delBtn.className = "btn-danger";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", function () {
        deleteInquiry(row.id);
      });
      actionsCell.appendChild(delBtn);

      inquiriesBody.appendChild(tr);
    });
  }

  function renderPagination(pagination) {
    paginationEl.innerHTML = "";
    if (!pagination || pagination.totalPages <= 1) return;

    for (var i = 1; i <= pagination.totalPages; i++) {
      (function (pageNum) {
        var btn = document.createElement("button");
        btn.textContent = pageNum;
        if (pageNum === pagination.page) btn.classList.add("is-active");
        btn.addEventListener("click", function () {
          state.page = pageNum;
          loadInquiries();
        });
        paginationEl.appendChild(btn);
      })(i);
    }
  }

  function updateStatus(id, status) {
    fetch("/api/admin/inquiries/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: status })
    })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (!result.success) alert(result.message || "Failed to update status.");
      })
      .catch(function () { alert("Could not reach the server."); });
  }

  function deleteInquiry(id) {
    if (!confirm("Delete this enquiry? This cannot be undone.")) return;
    fetch("/api/admin/inquiries/" + id, { method: "DELETE", credentials: "include" })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (result.success) loadInquiries();
        else alert(result.message || "Failed to delete.");
      })
      .catch(function () { alert("Could not reach the server."); });
  }

  searchInput.addEventListener("input", function () {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(function () {
      state.search = searchInput.value.trim();
      state.page = 1;
      loadInquiries();
    }, 350);
  });

  statusFilter.addEventListener("change", function () {
    state.status = statusFilter.value;
    state.page = 1;
    loadInquiries();
  });

  /* ===========================================================
     PORTFOLIO
  =========================================================== */
  var portfolioGrid = document.getElementById("portfolioAdminGrid");
  var modal = document.getElementById("projectModal");
  var projectForm = document.getElementById("projectForm");
  var modalTitle = document.getElementById("modalTitle");
  var projectError = document.getElementById("projectError");
  var pImagePreview = document.getElementById("pImagePreview");

  var categoryLabels = { branding: "Branding", design: "Graphic Design", dev: "Web Design" };

  function loadPortfolio() {
    portfolioGrid.innerHTML = '<p class="empty-state">Loading...</p>';
    fetch("/api/portfolio/admin", { credentials: "include" })
      .then(function (res) {
        if (res.status === 401) { window.location.href = "login.html"; return null; }
        return res.json();
      })
      .then(function (result) {
        if (!result) return;
        if (!result.success || !result.data.length) {
          portfolioGrid.innerHTML = '<p class="empty-state">No projects yet. Click "Add Project" to create one.</p>';
          return;
        }
        renderPortfolio(result.data);
      })
      .catch(function () {
        portfolioGrid.innerHTML = '<p class="empty-state">Could not reach the server.</p>';
      });
  }

  function renderPortfolio(projects) {
    portfolioGrid.innerHTML = "";
    projects.forEach(function (p) {
      var card = document.createElement("div");
      card.className = "portfolio-admin-card";

      var thumbHtml = p.image_url
        ? '<img src="' + escapeHtml(p.image_url) + '" alt="">'
        : '<span class="thumb-placeholder">No image</span>';

      card.innerHTML =
        '<div class="thumb">' + thumbHtml + "</div>" +
        '<div class="body">' +
        "<h3>" + escapeHtml(p.title) + (p.featured ? '<span class="featured-badge">Featured</span>' : "") + "</h3>" +
        '<div class="meta">' + escapeHtml(categoryLabels[p.category] || p.category) + "</div>" +
        "<p>" + escapeHtml(p.description) + "</p>" +
        '<div class="card-actions"><button class="btn-ghost edit-btn">Edit</button><button class="btn-danger del-btn">Delete</button></div>' +
        "</div>";

      card.querySelector(".edit-btn").addEventListener("click", function () { openProjectModal(p); });
      card.querySelector(".del-btn").addEventListener("click", function () { deleteProject(p.id); });

      portfolioGrid.appendChild(card);
    });
  }

  function openProjectModal(project) {
    projectError.textContent = "";
    projectForm.reset();
    pImagePreview.style.display = "none";

    if (project) {
      modalTitle.textContent = "Edit Project";
      document.getElementById("projectId").value = project.id;
      document.getElementById("pTitle").value = project.title;
      document.getElementById("pCategory").value = project.category;
      document.getElementById("pDescription").value = project.description;
      document.getElementById("pTechnologies").value = project.technologies || "";
      document.getElementById("pFeatured").checked = !!project.featured;
      if (project.image_url) {
        pImagePreview.src = project.image_url;
        pImagePreview.style.display = "block";
      }
    } else {
      modalTitle.textContent = "Add Project";
      document.getElementById("projectId").value = "";
    }

    modal.classList.add("is-open");
  }

  function closeProjectModal() {
    modal.classList.remove("is-open");
  }

  document.getElementById("newProjectBtn").addEventListener("click", function () { openProjectModal(null); });
  document.getElementById("cancelProjectBtn").addEventListener("click", closeProjectModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeProjectModal(); });

  document.getElementById("pImage").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      pImagePreview.src = ev.target.result;
      pImagePreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  projectForm.addEventListener("submit", function (e) {
    e.preventDefault();
    projectError.textContent = "";

    var id = document.getElementById("projectId").value;
    var formData = new FormData();
    formData.append("title", document.getElementById("pTitle").value.trim());
    formData.append("category", document.getElementById("pCategory").value);
    formData.append("description", document.getElementById("pDescription").value.trim());
    formData.append("technologies", document.getElementById("pTechnologies").value.trim());
    formData.append("featured", document.getElementById("pFeatured").checked);
    var fileInput = document.getElementById("pImage");
    if (fileInput.files[0]) formData.append("image", fileInput.files[0]);

    var saveBtn = document.getElementById("saveProjectBtn");
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    var url = id ? "/api/portfolio/admin/" + id : "/api/portfolio/admin";
    var method = id ? "PUT" : "POST";

    fetch(url, { method: method, credentials: "include", body: formData })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (result) {
        if (result.ok && result.data.success) {
          closeProjectModal();
          loadPortfolio();
        } else {
          projectError.textContent = (result.data && result.data.message) || "Failed to save project.";
        }
      })
      .catch(function () {
        projectError.textContent = "Could not reach the server.";
      })
      .finally(function () {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Project";
      });
  });

  function deleteProject(id) {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    fetch("/api/portfolio/admin/" + id, { method: "DELETE", credentials: "include" })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (result.success) loadPortfolio();
        else alert(result.message || "Failed to delete.");
      })
      .catch(function () { alert("Could not reach the server."); });
  }

  /* ---------------------------------------------------------
     Init
  --------------------------------------------------------- */
  loadInquiries();
  loadPortfolio();
})();
