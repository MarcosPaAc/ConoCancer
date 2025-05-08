// Dummy data simulating backend/database
const courses = [
  { title: "Overview", progress: "75%", className: "purple" },
  { title: "Diagnosis", progress: "50%", className: "orange" },
  { title: "Treatment", progress: "25%", className: "green" },
  { title: "Survivor ship", progress: "75%", className: "yellow" },
];

const videos = [
  { title: "Breast Cancer Awareness", time: "2 min", icon: "video" },
  { title: "Breast Self-Exam", time: "3 min", icon: "video" },
  { title: "Screening & detection Quiz", time: "Not Started", icon: "quiz" }
];

const stats = {
  coursesCompleted: 2,
  videosWatched: 5,
  coursesInProgress: 6,
  quizzesCompleted: 5,
};

// Load courses
function renderCourses() {
  const container = document.getElementById("courses-container");
  courses.forEach(course => {
    container.innerHTML += `
      <div class="card ${course.className}">
        ${course.title}
        <span>${course.progress}</span>
      </div>
    `;
  });
}

// Load videos
function renderVideos() {
  const container = document.getElementById("videos-container");
  videos.forEach(video => {
    container.innerHTML += `
      <div class="upcoming-item">
        <div class="icon ${video.icon}"></div>
        <div class="text">${video.title}<br><span>${video.time}</span></div>
      </div>
    `;
  });
}

// Load statistics
function renderStats() {
  document.getElementById("coursesCompleted").textContent = stats.coursesCompleted;
  document.getElementById("videosWatched").textContent = stats.videosWatched;
  document.getElementById("coursesInProgress").textContent = stats.coursesInProgress;
  document.getElementById("quizzesCompleted").textContent = stats.quizzesCompleted;
}

// View All Button Handler
function handleViewAll(type) {
  alert(`Navigating to full ${type} page...`);
  // Replace this with actual page routing logic
}

// Toggle stats dropdown (for mobile if needed)
function toggleStats() {
  const statsGrid = document.getElementById("stats-grid");
  statsGrid.style.display = statsGrid.style.display === "none" ? "grid" : "none";
}

// Simulate loading from DB
window.onload = function () {
  renderCourses();
  renderVideos();
  renderStats();
};
