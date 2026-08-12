(function () {
  "use strict";

  /* ---------------------------------------------------------
     Page-load overlay
  --------------------------------------------------------- */
  window.addEventListener("load", function () {
    var loader = document.getElementById("loader");
    if (loader) {
      setTimeout(function () {
        loader.classList.add("is-hidden");
      }, 350);
    }
  });

  /* ---------------------------------------------------------
     Footer year
  --------------------------------------------------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Navbar: scrolled state + mobile menu
  --------------------------------------------------------- */
  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");

  function onScroll() {
    if (window.scrollY > 12) {
      nav.classList.add("is-scrolled");
    } else {
      nav.classList.remove("is-scrolled");
    }
    toggleBackToTop();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var isOpen = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      navToggle.classList.toggle("is-active", isOpen);
    });

    // Close mobile menu after tapping a link
    navLinks.querySelectorAll(".nav-link").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------------------------------------------------
     Scroll reveal animations
  --------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------------------------------------------------------
     Animated counters (stats section)
  --------------------------------------------------------- */
  var counters = document.querySelectorAll(".stat-num");
  if ("IntersectionObserver" in window && counters.length) {
    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (el) {
      counterObserver.observe(el);
    });
  }

  function animateCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 1400;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      var current = Math.round(eased * target);
      el.textContent = current + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target + suffix;
      }
    }
    requestAnimationFrame(step);
  }

  /* ---------------------------------------------------------
     Portfolio filtering
  --------------------------------------------------------- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var pfCards = document.querySelectorAll(".pf-card");

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");

      var filter = btn.getAttribute("data-filter");
      pfCards.forEach(function (card) {
        var match = filter === "all" || card.getAttribute("data-cat") === filter;
        card.classList.toggle("is-hidden", !match);
      });
    });
  });

  /* ---------------------------------------------------------
     FAQ accordion
  --------------------------------------------------------- */
  var faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(function (item) {
    var q = item.querySelector(".faq-q");
    var a = item.querySelector(".faq-a");

    q.addEventListener("click", function () {
      var isOpen = item.getAttribute("data-open") === "true";

      // Close all other items
      faqItems.forEach(function (other) {
        if (other !== item) {
          other.setAttribute("data-open", "false");
          other.querySelector(".faq-q").setAttribute("aria-expanded", "false");
          other.querySelector(".faq-a").style.maxHeight = null;
        }
      });

      if (isOpen) {
        item.setAttribute("data-open", "false");
        q.setAttribute("aria-expanded", "false");
        a.style.maxHeight = null;
      } else {
        item.setAttribute("data-open", "true");
        q.setAttribute("aria-expanded", "true");
        a.style.maxHeight = a.scrollHeight + "px";
      }
    });
  });

  /* ---------------------------------------------------------
     Back to top button
  --------------------------------------------------------- */
  var backToTop = document.getElementById("backToTop");
  function toggleBackToTop() {
    if (!backToTop) return;
    if (window.scrollY > 500) {
      backToTop.classList.add("is-visible");
    } else {
      backToTop.classList.remove("is-visible");
    }
  }
  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------------------------------------------------------
     Contact form validation
  --------------------------------------------------------- */
  var form = document.getElementById("contactForm");
  var formSuccess = document.getElementById("formSuccess");

  var validators = {
    name: function (v) {
      return v.trim().length >= 2 ? "" : "Please enter your full name.";
    },
    email: function (v) {
      var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(v.trim()) ? "" : "Please enter a valid email address.";
    },
    phone: function () {
      return ""; // optional field
    },
    service: function (v) {
      return v ? "" : "Please select a service.";
    },
    message: function (v) {
      return v.trim().length >= 10 ? "" : "Please add a few details about your project.";
    }
  };

  function setFieldError(fieldName, message) {
    var input = document.getElementById(fieldName);
    var errorEl = document.getElementById(fieldName + "Error");
    if (!input || !errorEl) return;
    var wrapper = input.closest(".field");
    if (message) {
      wrapper.classList.add("has-error");
    } else {
      wrapper.classList.remove("has-error");
    }
    errorEl.textContent = message;
  }

  if (form) {
    Object.keys(validators).forEach(function (fieldName) {
      var input = document.getElementById(fieldName);
      if (!input) return;
      input.addEventListener("blur", function () {
        setFieldError(fieldName, validators[fieldName](input.value));
      });
    });

    var submitBtn = form.querySelector('button[type="submit"]');

    function showFormMessage(text, isError) {
      formSuccess.textContent = text;
      formSuccess.classList.add("is-visible");
      formSuccess.classList.toggle("is-error", !!isError);
      setTimeout(function () {
        formSuccess.classList.remove("is-visible");
      }, 7000);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var isValid = true;

      Object.keys(validators).forEach(function (fieldName) {
        var input = document.getElementById(fieldName);
        if (!input) return;
        var error = validators[fieldName](input.value);
        setFieldError(fieldName, error);
        if (error) isValid = false;
      });

      if (!isValid) {
        formSuccess.classList.remove("is-visible");
        return;
      }

      var apiBase = window.SWIFTWEB_API_BASE || "";
      var payload = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        service: document.getElementById("service").value,
        message: document.getElementById("message").value.trim(),
        website: document.getElementById("website") ? document.getElementById("website").value : ""
      };

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";
      }

      fetch(apiBase + "/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok && result.data.success) {
            showFormMessage(result.data.message, false);
            form.reset();
          } else {
            var msg =
              (result.data && result.data.message) ||
              "Something went wrong. Please try again or reach us on WhatsApp.";
            showFormMessage(msg, true);
          }
        })
        .catch(function () {
          showFormMessage(
            "We couldn't send your message. Please check your connection and try again.",
            true
          );
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Send Message";
          }
        });
    });
  }

  /* ---------------------------------------------------------
     Portfolio: load projects dynamically from the backend
  --------------------------------------------------------- */
  var portfolioGrid = document.getElementById("portfolioGrid");

  function buildPortfolioCard(project, apiBase) {
    var article = document.createElement("article");
    article.className = "pf-card reveal is-visible";
    article.setAttribute("data-cat", project.category);

    var categoryLabels = { branding: "Branding", design: "Graphic Design", dev: "Web Design" };
    var tagLabel = categoryLabels[project.category] || project.category;

    var imgSrc = project.image_url
      ? (project.image_url.indexOf("http") === 0 ? project.image_url : apiBase + project.image_url)
      : "";

    var thumbHtml = imgSrc
      ? '<img src="' + imgSrc + '" alt="' + escapeHtml(project.title) + '" loading="lazy">'
      : "";

    article.innerHTML =
      '<div class="pf-thumb pf-image">' +
      thumbHtml +
      '<span class="pf-tag">' + escapeHtml(tagLabel) + "</span></div>" +
      "<h3>" + escapeHtml(project.title) + "</h3>" +
      "<p>" + escapeHtml(project.description) + "</p>";

    return article;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function rebindPortfolioFilters() {
    var btns = document.querySelectorAll(".filter-btn");
    var cards = document.querySelectorAll(".pf-card");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        btns.forEach(function (b) {
          b.classList.remove("is-active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-selected", "true");

        var filter = btn.getAttribute("data-filter");
        cards.forEach(function (card) {
          var match = filter === "all" || card.getAttribute("data-cat") === filter;
          card.classList.toggle("is-hidden", !match);
        });
      });
    });
  }

  if (portfolioGrid) {
    var apiBase = window.SWIFTWEB_API_BASE || "";
    fetch(apiBase + "/api/portfolio")
      .then(function (res) {
        if (!res.ok) throw new Error("Portfolio request failed");
        return res.json();
      })
      .then(function (result) {
        if (result && result.success && Array.isArray(result.data) && result.data.length) {
          portfolioGrid.innerHTML = "";
          result.data.forEach(function (project) {
            portfolioGrid.appendChild(buildPortfolioCard(project, apiBase));
          });
          rebindPortfolioFilters();
        }
        // If the backend has no projects yet (empty array), the existing
        // static markup already in the page is left as-is.
      })
      .catch(function () {
        // Backend unreachable — keep the existing static portfolio cards
        // already in the HTML so the section never looks broken.
      });
  }
})();
