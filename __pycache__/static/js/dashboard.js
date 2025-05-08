// ============================
// 📥 FETCH USER DATA FROM DATABASE
// ============================
const userName = document.body.dataset.username;
async function fetchUserData() {
  // TODO: Replace this with your actual database call
  return {
    name: userName,
    joinDate: "Apr 2025",
    photo: "default-user-icon.png", // Static photo, not random
    stats: {
      completed: 0,
      watched: 0,
      inProgress: 0,
      quizzes: 0
    },
    courses: [
      { id: "overview", percent: 0 },
      { id: "diagnosis", percent: 0 },
      { id: "treatment", percent: 0 },
      { id: "survivor", percent: 0 }
    ],
    upcoming: []
  };
}

// ============================
// 🌎 TEXT TRANSLATIONS
// ============================
const translations = {
  en: {
    welcome: "Hello",
    memberSince: "Member since",
    categories: "Categories",
    upcoming: "Upcoming Videos & Quizzes",
    statistics: "Statistics",
    viewAll: "View All",
    noUpcoming: "No upcoming content yet. Start a course to get recommendations!",
    categoriesList: {
      overview: "Introduction",
      diagnosis: "Screening & Detection",
      treatment: "Diagnosis",
      survivor: "Treatment"
    },
    categoriesSub: {
      overview: "3 Videos available",
      diagnosis: "4 Videos available",
      treatment: "3 Videos available",
      survivor: "3 Videos available"
    },
    navbar: {
      overview: "Dashboard",
      videos: "Videos & Articles",
      resources: "Resources",
      progress: "Progress",
      settings: "Setting"
    },
    stats: {
      completed: "Courses Completed",
      watched: "Videos Watched",
      inProgress: "Courses In Progress",
      quizzes: "Quizzes Completed"
    }
  },
  es: {
    welcome: "¡Hola",
    memberSince: "Miembro desde",
    categories: "Categorías",
    upcoming: "Próximos Videos y Cuestionarios",
    statistics: "Estadísticas",
    viewAll: "Ver Todo",
    noUpcoming: "No hay contenido próximo. ¡Comienza un curso para recibir recomendaciones!",
    categoriesList: {
      overview: "Introducción",
      diagnosis: "Detección y Evaluación",
      treatment: "Diagnóstico",
      survivor: "Tratamiento"
    },
    categoriesSub: {
      overview: "3 Videos disponibles",
      diagnosis: "4 Videos disponibles",
      treatment: "3 Videos disponibles",
      survivor: "3 Videos disponibles"
    },
    navbar: {
      overview: "Tablero",
      videos: "Videos y Artículos",
      resources: "Recursos",
      progress: "Progreso",
      settings: "Configuración"
    },
    stats: {
      completed: "Cursos Completados",
      watched: "Videos Vistos",
      inProgress: "Cursos en Progreso",
      quizzes: "Cuestionarios Completados"
    }
  }
};

// ============================
// 📊 UPDATE UI FUNCTIONS
// ============================

function updateUserProfile(user, lang = "en") {
  document.getElementById("profile-name").textContent = user.name;
  document.getElementById("user-name").textContent = user.name;
  document.getElementById("join-date").textContent = `${translations[lang].memberSince} ${user.joinDate}`;
  document.getElementById("user-photo").src = user.photo;
}

function updateUserStats(user, lang = "en") {
  document.querySelector('[data-stat="completed"] .stat-label').textContent = translations[lang].stats.completed;
  document.querySelector('[data-stat="watched"] .stat-label').textContent = translations[lang].stats.watched;
  document.querySelector('[data-stat="inProgress"] .stat-label').textContent = translations[lang].stats.inProgress;
  document.querySelector('[data-stat="quizzes"] .stat-label').textContent = translations[lang].stats.quizzes;

  document.getElementById("stat-completed").textContent = user.stats.completed;
  document.getElementById("stat-watched").textContent = user.stats.watched;
  document.getElementById("stat-in-progress").textContent = user.stats.inProgress;
  document.getElementById("stat-quizzes").textContent = user.stats.quizzes;
}

function updateCourseProgress(user) {
  user.courses.forEach(course => {
    const card = document.querySelector(`.card[data-course="${course.id}"]`);
    if (card) {
      const ring = card.querySelector(".progress-ring");
      const text = ring.querySelector(".progress-text");

      if (course.percent === 0) {
        ring.style.background = "rgba(255,255,255,0.2)";
      } else {
        ring.style.background = `conic-gradient(white ${course.percent}%, rgba(255,255,255,0.2) 0)`;
      }

      text.textContent = `${course.percent}%`;
    }
  });
}

function updateUpcomingVideos(user, lang = "en") {
  const list = document.getElementById("video-list");
  list.innerHTML = "";

  if (!user.upcoming.length) {
    list.innerHTML = `<p>${translations[lang].noUpcoming}</p>`;
    return;
  }

  user.upcoming.forEach(item => {
    const div = document.createElement("div");
    div.className = "video-card";
    div.innerHTML = `
      <div class="icon-box">
        <img src="${item.icon}" alt="Video Icon" />
      </div>
      <div class="video-details">
        <div class="video-title">${item.title}</div>
        <div class="video-time">${item.duration}</div>
      </div>
      <div class="menu-icon">⋮</div>
    `;
    list.appendChild(div);
  });

  const today = new Date().toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric"
  });
  document.getElementById("video-date").textContent = today;
}

function applyLanguage(user, lang) {
  document.querySelector(".welcome").innerHTML = `${translations[lang].welcome} <span id="user-name">${user.name}</span>!`;

  // Section Titles
  document.querySelectorAll(".section-header")[0].querySelector("h2").textContent = translations[lang].categories;
  document.querySelectorAll(".section-header")[1].querySelector("h2").textContent = translations[lang].upcoming;
  document.querySelector(".stats h3").textContent = translations[lang].statistics;

  // View All Links
  document.querySelectorAll(".section-header a").forEach(link => {
    link.textContent = translations[lang].viewAll;
  });

  // Navbar Texts
  const sidebarItems = document.querySelectorAll(".sidebar-nav li span");
  if (sidebarItems.length >= 5) {
    sidebarItems[0].textContent = translations[lang].navbar.overview;
    sidebarItems[1].textContent = translations[lang].navbar.videos;
    sidebarItems[2].textContent = translations[lang].navbar.resources;
    sidebarItems[3].textContent = translations[lang].navbar.progress;
    sidebarItems[4].textContent = translations[lang].navbar.settings;
  }

  // Category Cards
  document.getElementById("cat-overview-title").textContent = translations[lang].categoriesList.overview;
  document.getElementById("cat-diagnosis-title").textContent = translations[lang].categoriesList.diagnosis;
  document.getElementById("cat-treatment-title").textContent = translations[lang].categoriesList.treatment;
  document.getElementById("cat-survivor-title").textContent = translations[lang].categoriesList.survivor;

  document.getElementById("cat-overview-small").textContent = translations[lang].categoriesSub.overview;
  document.getElementById("cat-diagnosis-small").textContent = translations[lang].categoriesSub.diagnosis;
  document.getElementById("cat-treatment-small").textContent = translations[lang].categoriesSub.treatment;
  document.getElementById("cat-survivor-small").textContent = translations[lang].categoriesSub.survivor;

  updateUserStats(user, lang);
  updateUpcomingVideos(user, lang);

  // Language Button
  const langButton = document.querySelector(".language");
  langButton.textContent = lang === "en" ? "Español" : "English";
}

// ============================
// 🚀 MAIN INIT FUNCTION
// ============================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const userData = await fetchUserData();
    const storedLanguage = localStorage.getItem("preferredLanguage") || "en";

    updateUserProfile(userData, storedLanguage);
    updateUserStats(userData, storedLanguage);
    updateCourseProgress(userData);
    applyLanguage(userData, storedLanguage);

    // LANGUAGE SWITCH BUTTON
    document.querySelector(".language").addEventListener("click", () => {
      const currentLang = localStorage.getItem("preferredLanguage") || "en";
      const newLang = currentLang === "en" ? "es" : "en";
      localStorage.setItem("preferredLanguage", newLang);

      document.body.classList.add('fade-transition');
      setTimeout(() => {
        applyLanguage(userData, newLang);
        updateUserProfile(userData, newLang);
        document.body.classList.remove('fade-transition');
      }, 200);
    });

  } catch (error) {
    console.error("Error loading dashboard:", error);
  }
});
//user profile log in and out 
document.addEventListener("DOMContentLoaded", () => {
  const dropdownToggle = document.getElementById("dropdownToggle");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const logoutBtn = document.getElementById("logoutBtn");
  const confirmModal = document.getElementById("confirmModal");
  const confirmYes = document.getElementById("confirmYes");
  const confirmNo = document.getElementById("confirmNo");

  // Toggle Dropdown
  dropdownToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
  });

  // Show Confirm Modal
  logoutBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.style.display = "none";
    confirmModal.style.display = "flex";
  });

  // Confirm YES
  confirmYes.addEventListener("click", () => {
    window.location.href = "/logout"; // ✅ Redirect to Landing
  });

  // Confirm NO
  confirmNo.addEventListener("click", () => {
    confirmModal.style.display = "none";
  });

  // Close dropdown on outside click
  document.addEventListener("click", () => {
    dropdownMenu.style.display = "none";
  });
});


document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.querySelector('.sidebar');

  menuToggle.addEventListener('click', function () {
    sidebar.classList.toggle('active');
  });
});

