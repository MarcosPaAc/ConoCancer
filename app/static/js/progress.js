let currentLang = "en"; // Global for reuse in other functions

const translations = {
  en: {
    nav: {
      dashboard: "Dashboard",
      videos: "Videos & Articles",
      resources: "Resources",
      progress: "Progress",
      setting: "Setting"
    },
    heading: {
      title: "Learning Progress",
      subtitle: "You're making steady progress! Keep going!",
      overall: "Overall Progress",
      category: "Category Progress",
      recent: "Recent Performance"
    },
    milestones: {
      quizzes: "Total Quizzes",
      categories: "Categories Mastered"
    },
    button: {
      review: "📄 Review Materials"
    },
    items: {
      screening: "Screening & Detection",
      treatment: "Treatment",
      overview: "Overview",
      diagnosis: "Diagnosis"
    },
    user: {
      memberSince: "Member since Apr 2025"
    }
  },
  es: {
    nav: {
      dashboard: "Tablero",
      videos: "Videos y Artículos",
      resources: "Recursos",
      progress: "Progreso",
      setting: "Configuración"
    },
    heading: {
      title: "Progreso de Aprendizaje",
      subtitle: "¡Estás progresando constantemente! ¡Sigue así!",
      overall: "Progreso General",
      category: "Progreso por Categoría",
      recent: "Rendimiento Reciente"
    },
    milestones: {
      quizzes: "Cuestionarios Completados",
      categories: "Categorías Dominadas"
    },
    button: {
      review: "📄 Revisar Materiales"
    },
    items: {
      screening: "Detección y Evaluación",
      treatment: "Tratamiento",
      overview: "Resumen",
      diagnosis: "Diagnóstico"
    },
    user: {
      memberSince: "Miembro desde abril de 2025"
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Language toggle
  const languageBtn = document.querySelector(".language");
  languageBtn.addEventListener("click", () => {
    currentLang = currentLang === "en" ? "es" : "en";
    applyTranslations();
    languageBtn.textContent = currentLang === "en" ? "Español" : "English";
  });

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const parts = key.split(".");
      let value = translations[currentLang];
      parts.forEach(p => value = value[p]);
      if (value) el.textContent = value;
    });
  }

  // Dropdown functionality
  const dropdownToggle = document.getElementById("dropdownToggle");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const logoutBtn = document.getElementById("logoutBtn");
  const confirmModal = document.getElementById("confirmModal");
  const confirmYes = document.getElementById("confirmYes");
  const confirmNo = document.getElementById("confirmNo");

  dropdownToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
  });

  logoutBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.style.display = "none";
    confirmModal.style.display = "flex";
  });

  confirmYes.addEventListener("click", () => {
    window.location.href = "/logout";
  });

  confirmNo.addEventListener("click", () => {
    confirmModal.style.display = "none";
  });

  document.addEventListener("click", () => {
    dropdownMenu.style.display = "none";
  });

  // Initial load
  fetchUserProgress();
  fetchRecentPerformance();
});

/**
 * 🌐 Fetch personalized progress
 */
async function fetchUserProgress() {
  try {
    const res = await fetch("/api/progress");
    const data = await res.json();
    renderProgress(data);
  } catch (err) {
    console.error("❌ Failed to load user progress:", err);
  }
}

function renderProgress(data) {
  document.querySelector(".overall-progress .progress-bar").style.width = `${data.overallProgress}%`;

  document.querySelectorAll(".metric-box")[0].innerHTML = `
    ${translations[currentLang].milestones.quizzes}<br><strong>${data.totalQuizzes.completed} / ${data.totalQuizzes.total}</strong>`;
  document.querySelectorAll(".metric-box")[1].innerHTML = `
    ${translations[currentLang].milestones.categories}<br><strong>${data.categoriesMastered.completed} / ${data.categoriesMastered.total}</strong>`;

  const container = document.querySelector(".category-progress");
  const categoryHtml = data.categories.map(cat => {
    const percent = Math.round((cat.completed / cat.total) * 100);
    const label = translations[currentLang].items[cat.key] || cat.key;
    const showBtn = cat.key === "screening";
    return `
      <div class="category-item">
        <label data-i18n="items.${cat.key}">${label}</label> <span>${cat.completed}/${cat.total} Completed</span>
        <div class="progress-bar-container"><div class="progress-bar" style="width: ${percent}%"></div></div>
        ${showBtn ? `<div class="review-wrapper"><button class="review-btn" data-i18n="button.review">${translations[currentLang].button.review}</button></div>` : ""}
      </div>`;
  }).join("");
  container.innerHTML = `<h3 data-i18n="heading.category">${translations[currentLang].heading.category}</h3>` + categoryHtml;
}

/**
 * 🌐 Fetch recent quiz scores
 */
async function fetchRecentPerformance() {
  try {
    const res = await fetch("/api/recent-quizzes");
    const quizzes = await res.json();
    renderRecentPerformance(quizzes);
  } catch (err) {
    console.error("❌ Failed to load recent quizzes:", err);
  }
}

function renderRecentPerformance(quizzes) {
  const container = document.getElementById("recent-performance-container");
  container.innerHTML = quizzes.map(q => {
    const scoreClass = q.score >= 90 ? "blue" : q.score >= 75 ? "green" : "pink";
    const catLabel = translations[currentLang]?.items[q.category] || q.category;
    return `
      <div class="performance-row">
        <div><strong>${q.title}</strong><br><small>${catLabel}</small></div>
        <span class="score ${scoreClass}">${q.score}%</span>
      </div>`;
  }).join("");
}
