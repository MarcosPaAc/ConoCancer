document.addEventListener("DOMContentLoaded", () => {
  let currentLang = "en";

  const translations = {
    en: {
      nav: {
        dashboard: "Dashboard",
        videos: "Videos & Articles",
        resources: "Resources",
        progress: "Progress",
        settings: "Setting"
      }
    },
    es: {
      nav: {
        dashboard: "Tablero",
        videos: "Videos y Artículos",
        resources: "Recursos",
        progress: "Progreso",
        settings: "Configuración"
      }
    }
  };

  // Handle Language Toggle
  const languageBtn = document.querySelector(".language");
  if (languageBtn) {
    languageBtn.addEventListener("click", () => {
      currentLang = currentLang === "en" ? "es" : "en";
      applyTranslations();
      languageBtn.textContent = currentLang === "en" ? "Español" : "English";
    });
  }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const parts = key.split(".");
      let value = translations[currentLang];

      parts.forEach(p => {
        if (value && value[p]) {
          value = value[p];
        }
      });

      if (value) {
        el.textContent = value;
      }
    });
  }

  // Initial translations
  applyTranslations();

  // Load user profile
  fetchUserProfile();

  // Dropdown toggle for profile
  const dropdownToggle = document.getElementById("dropdownToggle");
  const dropdownMenu = document.getElementById("dropdownMenu");

  if (dropdownToggle && dropdownMenu) {
    dropdownToggle.addEventListener("click", () => {
      dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", (e) => {
      if (!dropdownMenu.contains(e.target) && !dropdownToggle.contains(e.target)) {
        dropdownMenu.style.display = "none";
      }
    });
  }

  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      alert("Logging out...");
      window.location.href = "/logout";
    });
  }

  // Password change form
  const passwordForm = document.querySelector(".security form");
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const [current, newPass, confirm] = passwordForm.querySelectorAll("input");

      if (newPass.value !== confirm.value) {
        alert("New password and confirmation do not match.");
        return;
      }

      try {
        const res = await fetch("/api/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: current.value,
            newPassword: newPass.value,
            confirmPassword: confirm.value
          })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message);
        alert("Password updated successfully.");
        passwordForm.reset();
      } catch (err) {
        alert(err.message || "Failed to update password.");
      }
    });
  }
});

// 🔁 Fetch user profile and update the DOM
async function fetchUserProfile() {
  try {
    const res = await fetch("/api/user-profile");
    if (!res.ok) throw new Error("Failed to fetch profile");

    const user = await res.json();

    document.getElementById("user-name").textContent = user.name;
    document.getElementById("user-email").textContent = user.email;
    document.getElementById("user-lang").textContent = user.language;

    // Preferences
    const prefList = document.getElementById("user-preferences");
    if (prefList) {
      prefList.innerHTML = ""; // Clear existing items
      user.preferences.forEach(pref => {
        const li = document.createElement("li");
        li.textContent = `🟣 ${pref}`;
        prefList.appendChild(li);
      });
    }

    const format = document.getElementById("user-format");
    if (format) {
      format.textContent = user.contentFormat || "Mixed Content";
    }

  } catch (err) {
    console.error(err);
    alert("Could not load user profile.");
  }
}
document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/user-info")
    .then(res => res.json())
    .then(data => {
      document.getElementById("user-name").textContent = data.name || "N/A";
      document.getElementById("user-email").textContent = data.email || "N/A";
      document.getElementById("user-lang").textContent = data.language || "N/A";

      // Preferences list
      const prefList = document.getElementById("user-preferences");
      prefList.innerHTML = ""; // Clear 'Loading...'
      if (data.preferences && data.preferences.length) {
        data.preferences.forEach(item => {
          const li = document.createElement("li");
          li.textContent = item;
          prefList.appendChild(li);
        });
      } else {
        prefList.innerHTML = "<li>No preferences set</li>";
      }

      document.getElementById("user-format").textContent = data.format || "N/A";
    })
    .catch(err => {
      console.error("Failed to load user info", err);
    });
});
