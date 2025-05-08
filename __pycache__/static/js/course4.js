document.addEventListener("DOMContentLoaded", () => {
  let currentLanguage = localStorage.getItem("preferredLanguage") || "en";

  const lessons = document.querySelectorAll(".lesson-item");
  const breadcrumb = document.getElementById("breadcrumb");

  const videoWrapper = document.getElementById("video-wrapper");
  const readingSection = document.getElementById("reading-section");
  const quizSection = document.getElementById("quiz-section");
  const languageBtn = document.querySelector(".language");

  // Video file paths
  const videoMap = {
    en: {
      1: "Breast Cancer Awareness (3) English.mp4",
      2: "Public Health Talk by Breast Cancer Now (4) English.mp4",
      3: "Breast Cancer and Mammography_ Myth vs. Fact (6) English.mp4"
    },
    es: {
      1: "Breast Cancer Awareness (3) Spanish.mp4",
      2: "Public Health Talk by Breast Cancer Now (4) Spanish.mp4",
      3: "Breast Cancer and Mammography_ Myth vs. Fact (6) Spanish.mp4"
    }
  };

  // Reading articles (local files)
  const readingMap = {
    en: "Breast Cancer_En.pdf",
    es: "Breast Cancer_SP.pdf"
  };

  // Load video by ID
  function loadVideo(id) {
    const url = videoMap[currentLanguage][id] || videoMap[currentLanguage][1];
    videoWrapper.innerHTML = `
      <video id="lesson-video" controls autoplay style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;" data-lesson-id="${id}">
        <source src="${url}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    `;

    const videoElement = document.getElementById("lesson-video");
    videoElement.addEventListener("ended", () => {
      updateProgress(`video${id}`, true);
      updateLessonStatusUI(id, "video");
    });
  }

  // Load reading article
  function loadReading() {
    const url = readingMap[currentLanguage];
    readingSection.innerHTML = `
      <h3>${currentLanguage === "en" ? "Reading" : "Lectura"}</h3>
      <iframe src="${url}" width="100%" height="600px" style="border: none;"></iframe>
      <button id="markAsReadBtn" class="transcript-btn">${currentLanguage === "en" ? "Mark as Read" : "Marcar como Leído"}</button>
    `;

    document.getElementById("markAsReadBtn").addEventListener("click", () => {
      updateProgress('reading', true);
      updateLessonStatusUI(1, "reading"); // Assuming reading has ID 1
      alert(currentLanguage === "en" ? "Marked as read!" : "¡Marcado como leído!");
    });
  }

  // Load quiz questions from database
  async function loadQuiz(id) {
    try {
      const response = await fetch(`/api/quiz?lang=${currentLanguage}&id=${id}`);
      const questions = await response.json();

      quizSection.innerHTML = `<h3>${currentLanguage === "en" ? "Study Quiz" : "Cuestionario de Estudio"}</h3>`;
      questions.forEach((q, index) => {
        const questionDiv = document.createElement("div");
        questionDiv.classList.add("quiz-q");
        questionDiv.innerHTML = `
          <p><strong>${index + 1}. ${q.question}</strong></p>
          ${q.options.map((opt, i) => `
            <label><input type="radio" name="q${index}" value="${opt}"> ${opt}</label><br>
          `).join('')}
        `;
        quizSection.appendChild(questionDiv);
      });

      const submitBtn = document.createElement("button");
      submitBtn.classList.add("transcript-btn");
      submitBtn.textContent = currentLanguage === "en" ? "Submit" : "Enviar";
      submitBtn.addEventListener("click", () => {
        // Handle quiz submission
        // Example: evaluateQuiz();
        alert(currentLanguage === "en" ? "Quiz submitted!" : "¡Cuestionario enviado!");
        // Update progress in database
        updateProgress(`quiz${id}`, true);
        // Update UI to show checkmark
        updateLessonStatusUI(id, 'quiz');
      });
      quizSection.appendChild(submitBtn);
    } catch (error) {
      console.error("Error loading quiz:", error);
      quizSection.innerHTML = `<p>${currentLanguage === "en" ? "Error loading quiz." : "Error al cargar el cuestionario."}</p>`;
    }
  }

  // Handle lesson item clicks
  lessons.forEach(lesson => {
    lesson.addEventListener("click", () => {
      lessons.forEach(el => el.classList.remove("active"));
      lesson.classList.add("active");

      const type = lesson.dataset.type;
      const id = lesson.dataset.id;
      const title = lesson.querySelector(".lesson-title")?.textContent || "";

      videoWrapper.style.display = "none";
      readingSection.style.display = "none";
      quizSection.style.display = "none";

      if (type === "video") {
        loadVideo(id);
        videoWrapper.style.display = "block";
        breadcrumb.innerText = `Treatment › ${title}`;
      } else if (type === "reading") {
        loadReading(id);
        readingSection.style.display = "block";
        breadcrumb.innerText = `Treatment › ${currentLanguage === "en" ? "Reading" : "Lectura"}`;
      } else if (type === "quiz") {
        loadQuiz(id);
        quizSection.style.display = "block";
        breadcrumb.innerText = `Treatment › ${currentLanguage === "en" ? "Quiz" : "Cuestionario"}`;
      }
    });
  });

  // Handle language switching
  languageBtn.addEventListener("click", () => {
    currentLanguage = currentLanguage === "en" ? "es" : "en";
    localStorage.setItem("preferredLanguage", currentLanguage);
    updateLanguageUI();

    const activeLesson = document.querySelector(".lesson-item.active");
    if (activeLesson) activeLesson.click();
  });

  function updateLanguageUI() {
    languageBtn.textContent = currentLanguage === "en" ? "Español" : "English";

    // Update sidebar texts
    const sidebarItems = document.querySelectorAll(".sidebar-nav li");
    const translations = {
      en: ["Dashboard", "Videos & Articles", "Resources", "Progress", "Settings"],
      es: ["Tablero", "Videos y Artículos", "Recursos", "Progreso", "Configuración"]
    };

    sidebarItems.forEach((item, index) => {
      const img = item.querySelector('img');
      const span = item.querySelector('.nav-text');
      if (img && span) {
        span.textContent = translations[currentLanguage][index];
      }
    });

    // Update profile info
    const joinDate = "Apr 2025";
    const joinDateSpan = document.getElementById("join-date");
    joinDateSpan.textContent = currentLanguage === "en" ? `Member since ${joinDate}` : `Miembro desde ${joinDate}`;
  }

  function updateLessonStatusUI(lessonId, type) {
    const lessonItem = document.querySelector(`.lesson-item[data-id="${lessonId}"][data-type="${type}"]`);
    if (lessonItem) {
      lessonItem.classList.add("completed");
      const statusSpan = lessonItem.querySelector(".lesson-status");
      if (statusSpan) {
        statusSpan.textContent = "Completed";
      }
    }
  }

  async function loadUserProgress() {
    try {
      const response = await fetch(`/api/progress`);
      const progressData = await response.json();
      progressData.forEach(item => {
        updateLessonStatusUI(item.lessonId, item.type);
      });
    } catch (error) {
      console.error("Error loading user progress:", error);
    }
  }

  async function updateProgress(lessonKey, status) {
    try {
      await fetch(`/api/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ lessonKey, status })
      });
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  }

  // Initial UI setup
  updateLanguageUI();
  loadUserProgress();
  const initialLesson = document.querySelector(".lesson-item.active");
  if (initialLesson) initialLesson.click();
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