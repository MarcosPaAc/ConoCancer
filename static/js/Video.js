document.addEventListener("DOMContentLoaded", () => {
  const dropdownToggle = document.getElementById("dropdownToggle");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const logoutBtn = document.getElementById("logoutBtn");
  const confirmModal = document.getElementById("confirmModal");
  const confirmYes = document.getElementById("confirmYes");
  const confirmNo = document.getElementById("confirmNo");
  const languageBtn = document.querySelector(".language");

  // Dropdown logic
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
    window.location.href = "index.html";
  });

  confirmNo.addEventListener("click", () => {
    confirmModal.style.display = "none";
  });

  document.addEventListener("click", () => {
    dropdownMenu.style.display = "none";
  });

  // Translations
  const translations = {
    en: {
      navbar: {
        overview: "Dashboard",
        videos: "Videos & Articles",
        resources: "Resources",
        progress: "Progress",
        settings: "Settings"
      },
      categories: "Categories",
      categoriesList: {
        overview: "Introduction",
        screening: "Screening & Detection",
        diagnosis: "Diagnosis",
        treatment: "Treatment",
        survivorship: "Survivorship"
      },
      categoriesSub: {
        overview: "An overview of breast cancer",
        screening: "Understanding screening methods",
        diagnosis: "Steps in diagnosing breast cancer",
        treatment: "Treatment options available",
        survivorship: "Life after treatment"
      },
      view: "View"
    },
    es: {
      navbar: {
        overview: "Tablero",
        videos: "Videos y Artículos",
        resources: "Recursos",
        progress: "Progreso",
        settings: "Configuración"
      },
      categories: "Categorías",
      categoriesList: {
        overview: "Introducción",
        screening: "Detección y Evaluación",
        diagnosis: "Diagnóstico",
        treatment: "Tratamiento",
        survivorship: "Supervivencia"
      },
      categoriesSub: {
        overview: "Una visión general del cáncer de mama",
        screening: "Comprendiendo los métodos de detección",
        diagnosis: "Pasos en el diagnóstico del cáncer de mama",
        treatment: "Opciones de tratamiento disponibles",
        survivorship: "La vida después del tratamiento"
      },
      view: "Ver"
    }
  };

  function applyLanguage(lang) {
    // Navbar
    document.getElementById("nav-overview").textContent = translations[lang].navbar.overview;
    document.getElementById("nav-videos").textContent = translations[lang].navbar.videos;
    document.getElementById("nav-resources").textContent = translations[lang].navbar.resources;
    document.getElementById("nav-progress").textContent = translations[lang].navbar.progress;
    document.getElementById("nav-settings").textContent = translations[lang].navbar.settings;

    // Categories
    document.getElementById("section-categories").textContent = translations[lang].categories;

    document.getElementById("course-intro-title").textContent = translations[lang].categoriesList.overview;
    document.getElementById("course-intro-desc").textContent = translations[lang].categoriesSub.overview;
    document.getElementById("course-intro-view").textContent = translations[lang].view;

    document.getElementById("course-screening-title").textContent = translations[lang].categoriesList.screening;
    document.getElementById("course-screening-desc").textContent = translations[lang].categoriesSub.screening;
    document.getElementById("course-screening-view").textContent = translations[lang].view;

    document.getElementById("course-diagnosis-title").textContent = translations[lang].categoriesList.diagnosis;
    document.getElementById("course-diagnosis-desc").textContent = translations[lang].categoriesSub.diagnosis;
    document.getElementById("course-diagnosis-view").textContent = translations[lang].view;

    document.getElementById("course-treatment-title").textContent = translations[lang].categoriesList.treatment;
    document.getElementById("course-treatment-desc").textContent = translations[lang].categoriesSub.treatment;
    document.getElementById("course-treatment-view").textContent = translations[lang].view;

    document.getElementById("course-survivorship-title").textContent = translations[lang].categoriesList.survivorship;
    document.getElementById("course-survivorship-desc").textContent = translations[lang].categoriesSub.survivorship;
    document.getElementById("course-survivorship-view").textContent = translations[lang].view;

    languageBtn.textContent = lang === "en" ? "Español" : "English";
  }

  const storedLang = localStorage.getItem("preferredLanguage") || "en";
  applyLanguage(storedLang);

  languageBtn.addEventListener("click", () => {
    const currentLang = localStorage.getItem("preferredLanguage") || "en";
    const newLang = currentLang === "en" ? "es" : "en";
    localStorage.setItem("preferredLanguage", newLang);
    applyLanguage(newLang);
  });
});
player.ready(() => {
  player.el().addEventListener("click", () => {
    if (player.paused()) {
      player.play();
    } else {
      player.pause();
    }
  });
});
