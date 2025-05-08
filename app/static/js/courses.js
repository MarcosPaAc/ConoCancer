// Ensure the DOM is fully loaded before running script
document.addEventListener("DOMContentLoaded", () => {
  let currentLanguage = localStorage.getItem("preferredLanguage") || "en";
  const user_id = document.body.dataset.userId;

  const lessons = document.querySelectorAll(".lesson-item");
  const breadcrumb = document.getElementById("breadcrumb");
  const videoWrapper = document.getElementById("video-wrapper");
  const readingSection = document.getElementById("reading-section");
  const quizSection = document.getElementById("quiz-section");
  const languageBtn = document.querySelector(".language");

  const videoMap = {
    en: {
      1: "Breast_Cancer_Awareness_03E.mp4",
      2: "Public_Health_Talk_by_Breast_Cancer_Now_03E.mp4",
      3: "Breast_Cancer_and_Mammography_Myth_vs_Fact_03E.mp4"
    },
    es: {
      1: "Breast_Cancer_Awareness_03S.mp4",
      2: "Public_Health_Talk_by_Breast_Cancer_Now_03S.mp4",
      3: "Breast_Cancer_and_Mammography_Myth_vs_Fact_03S.mp4"
    }
  };

  const readingMap = {
    en: "Breast Cancer_En.pdf",
    es: "Breast Cancer_SP.pdf"
  };

  // =============== VIDEO + EMBEDDED QUESTIONS ===============
  function loadVideo(id) {
    const videoID = currentLanguage === "en" ? "03E" : "03S";
    const videoURL = `/static/media/${videoMap[currentLanguage][id]}`;

    if (videojs.getPlayer("lesson-video")) {
      videojs.getPlayer("lesson-video").dispose();
    }

    videoWrapper.innerHTML = `
      <video id="lesson-video" class="video-js vjs-default-skin" controls preload="auto" playsinline style="width: 100%; height: auto;">
        <source src="${videoURL}" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    `;

    const player = videojs("lesson-video", {
      autoplay: true,
      muted: true,
      controls: true
    });

    let hasStartedPlaying = false;
    let lastAllowedTime = 0;

    player.ready(() => {
      player.play().catch(() => {});
      player.one("play", () => {
        hasStartedPlaying = true;
        updateProgress(`video${id}`, "in_progress");
        updateLessonStatusUI(id, "video", "in_progress");
        player.muted(false);
        player.volume(1.0);
      });
    });

    player.on("timeupdate", () => {
      if (!player.paused()) {
        lastAllowedTime = player.currentTime();
      }
    });

    player.on("seeking", () => {
      if (player.currentTime() > lastAllowedTime + 1) {
        player.currentTime(lastAllowedTime);
      }
    });

    player.on("ended", () => {
      if (hasStartedPlaying) {
        updateProgress(`video${id}`, "completed");
        updateLessonStatusUI(id, "video", "completed");
      }
    });

    fetch(`/api/questions/${videoID}`)
      .then(res => res.json())
      .then(questions => {
        const embeddedQuestions = questions.map(q => ({ ...q, shown: false, answered: false }));
        player.on("timeupdate", () => {
          const currentTime = player.currentTime();
          embeddedQuestions.forEach(q => {
            if (!q.shown && currentTime >= q.timestamp) {
              q.shown = true;
              player.pause();
              displayEmbeddedQuestion(q);
            }
          });
        });
      });
  }

  function displayEmbeddedQuestion(question) {
    quizSection.innerHTML = `
      <div class="quiz-container" style="margin-top: 20px;">
        <p><strong>${question.text}</strong></p>
        ${question.options.map(opt => `
          <label class="quiz-option">
            <input type="radio" name="q-${question.id}" value="${opt.text}">
            ${opt.text}
          </label>
        `).join('')}
        <button onclick="submitAnswer('${question.id}', document.querySelector('input[name=q-${question.id}]:checked')?.value, '${question.category_id}', '${question.type}')">Submit</button>
      </div>
    `;
    quizSection.style.display = "block";
  }

  window.submitAnswer = function (questionId, answer, categoryId, questionType) {
    if (!answer) return alert("Please select an answer first.");

    fetch("/check_answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, question_id: questionId, answer, category_id: categoryId })
    })
    .then(res => res.json())
    .then(data => {
      alert(data.correct ? "Correct!" : "Incorrect. Try again.");
      if (data.correct) {
        fetch("/submit_answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id, question_id: questionId, answer, category_id: categoryId, question_type: questionType })
        });
        videojs("lesson-video").play();
      }
    });
  };

  // =============== READING ===============
  function loadReading() {
    const pdfURL = `/static/media/${readingMap[currentLanguage]}`;
    readingSection.innerHTML = `
      <h3>${currentLanguage === "en" ? "Reading" : "Lectura"}</h3>
      <iframe src="${pdfURL}" width="100%" height="600" style="border: none;"></iframe>
      <button id="markAsReadBtn" class="transcript-btn">${currentLanguage === "en" ? "Mark as Read" : "Marcar como Leído"}</button>
    `;
    document.getElementById("markAsReadBtn").addEventListener("click", () => {
      updateProgress("reading", true);
      updateLessonStatusUI(1, "reading");
      alert(currentLanguage === "en" ? "Marked as read!" : "¡Marcado como leído!");
    });
  }

  // =============== STUDY QUIZ WITH MICROPHONE ===============
  async function loadStudyQuiz(categoryId) {
    const res = await fetch(`/api/study_quiz/${categoryId}?lang=${currentLanguage}`);
    const questions = await res.json();

    quizSection.innerHTML = `<h3>${currentLanguage === "en" ? "Study Quiz" : "Cuestionario de Estudio"}</h3>`;

    questions.forEach((q, i) => {
      const questionDiv = document.createElement("div");
      questionDiv.classList.add("quiz-q");

      let optionsHTML = "";

      if (q.question_type === "Multiple Choice" || q.question_type === "T/F") {
        q.options.forEach(opt => {
          optionsHTML += `
            <label class="quiz-option">
              <input type="radio" name="q${i}" value="${opt.option_text}"> ${opt.option_text}
            </label>
          `;
        });
      } else if (q.question_type === "Short Response") {
        optionsHTML = `
          <textarea name="q${i}" placeholder="${currentLanguage === "en" ? "Your answer..." : "Tu respuesta..."}"></textarea>
          <button class="mic-btn" data-index="${i}">🎤 Start Recording</button>
        `;
      }

      questionDiv.innerHTML = `
        <p><strong>${i + 1}. ${q.question_text}</strong></p>
        ${optionsHTML}
        <button class="save-answer-btn" data-index="${i}">Save Answer</button>
      `;

      quizSection.appendChild(questionDiv);
    });

    document.querySelectorAll(".save-answer-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = btn.dataset.index;
        const question = questions[index];
        let answer = "";

        if (question.question_type === "Multiple Choice" || question.question_type === "T/F") {
          const selected = document.querySelector(`input[name="q${index}"]:checked`);
          answer = selected ? selected.value : "";
        } else {
          const textarea = document.querySelector(`textarea[name="q${index}"]`);
          answer = textarea.value;
        }

        fetch("/api/save_study_answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id,
            category_id: categoryId,
            question_id: question.study_question_id,
            question_type: question.question_type,
            answer
          })
        }).then(() => alert("Answer saved!"));
      });
    });

    document.querySelectorAll(".mic-btn").forEach(btn => {
      const idx = btn.dataset.index;
      const textarea = document.querySelector(`textarea[name="q${idx}"]`);
      setupMicButton(btn, textarea);
    });   

    const submitBtn = document.createElement("button");
    submitBtn.classList.add("transcript-btn");
    submitBtn.textContent = currentLanguage === "en" ? "Submit Study Quiz" : "Enviar Cuestionario de Estudio";
    submitBtn.addEventListener("click", () => submitStudyQuiz(categoryId, questions));
    quizSection.appendChild(submitBtn);
  }

  function submitStudyQuiz(categoryId, questions) {
    const answers = questions.map((q,i) => {
      let ua = "";
      if (q.question_type === "Short Response") {
        ua = document.querySelector(`textarea[name="q${i}"]`).value.trim();
      } else {
        const sel = document.querySelector(`input[name="q${i}"]:checked`);
        ua = sel ? sel.value : "";
      }
      return { question_id: q.study_question_id, question_type: q.question_type, user_answer: ua };
    });
  
    // 1) Save
    fetch("/api/submit_study_quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, category_id: categoryId, answers })
    })
    // 2) Then evaluate & parse JSON
    .then(() => fetch("/api/evaluate_study_quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, category_id: categoryId })
    }))
    .then(res => res.json())
    .then(data => {
      // 3) Show the summary modal
      showQuizSummary(data.summary || []);
    })
    .catch(err => console.error("Quiz flow error:", err));
  }
  
  // helper to populate & show the modal
  function showQuizSummary(summary) {
    const list = document.getElementById('summaryList');
    list.innerHTML = "";
    summary.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.question_id}: ${item.status.toUpperCase()} — Your answer: "${item.user_answer}"`;
      li.style.color = item.status === 'correct'
        ? 'green'
        : item.status === 'semi_correct'
          ? 'orange'
          : 'red';
      list.appendChild(li);
    });
    document.getElementById('quizSummaryModal').style.display = 'flex';
  }
  
  document.getElementById('closeSummary').addEventListener('click', () => {
    document.getElementById('quizSummaryModal').style.display = 'none';
  });
  
  
  function setupMicButton(btn, textarea) {
    let recorder, stream, chunks;
    let isRecording = false;
    const MAX_TIME = 10000; // 10s
  
    btn.addEventListener("click", () => {
      if (!isRecording) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(s => {
            stream = s;
            recorder = new MediaRecorder(stream);
            chunks = [];
  
            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = () => {
              const blob = new Blob(chunks, { type: "audio/webm" });
              // send to Whisper proxy:
              fetch("/api/transcribe_whisper", {
                method: "POST",
                headers: { "Content-Type": "audio/webm" },
                body: blob
              })
              .then(r => r.json())
              .then(json => {
                if (json.transcript) {
                  textarea.value += json.transcript + " ";
                } else {
                  console.error("Whisper error:", json.error);
                }
              })
              .catch(err => console.error("Whisper fetch error:", err))
              .finally(() => {
                stream.getTracks().forEach(t => t.stop());
                btn.textContent = "🎤 Start Recording";
                isRecording = false;
              });
            };
  
            recorder.start();
            isRecording = true;
            btn.textContent = "⏹ Stop Recording";
  
            setTimeout(() => {
              if (isRecording) recorder.stop();
            }, MAX_TIME);
          })
          .catch(err => {
            console.error("Mic error:", err);
            btn.textContent = "🎤 Start Recording";
          });
      } else {
        // Stop early if user clicks again
        recorder.stop();
      }
    });
  }
  
  
  
  function startASR(textarea, btn) {
    const RECORD_TIME = 10000; // 10s
    btn.textContent = "Recording…";
    btn.disabled = true;
  
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const recorder = new MediaRecorder(stream);
        const chunks = [];
  
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          // send to your Flask proxy
          fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "audio/webm" },
            body: blob
          })
          .then(r => r.json())
          .then(json => {
            if (json.transcript) {
              textarea.value += json.transcript + " ";
            }
          })
          .catch(err => console.error("Transcription error:", err))
          .finally(() => {
            stream.getTracks().forEach(t => t.stop());
            btn.textContent = "🎤 Start Recording";
            btn.disabled = false;
          });
        };
  
        recorder.start();
        setTimeout(() => recorder.stop(), RECORD_TIME);
      })
      .catch(err => {
        console.error("Microphone error:", err);
        btn.textContent = "🎤 Code-Switch";
        btn.disabled = false;
      });
  }
  
  // =============== LESSON CLICK EVENTS ===============
  lessons.forEach(lesson => {
    lesson.addEventListener("click", () => {
      lessons.forEach(l => l.classList.remove("active"));
      lesson.classList.add("active");

      const type = lesson.dataset.type;
      const id = lesson.dataset.id;

      videoWrapper.style.display = "none";
      readingSection.style.display = "none";
      quizSection.style.display = "none";

      if (type === "video") {
        loadVideo(id);
        videoWrapper.style.display = "block";
      } else if (type === "reading") {
        loadReading();
        readingSection.style.display = "block";
      } else if (type === "quiz") {
        loadStudyQuiz(id);
        quizSection.style.display = "block";
      }
    });
  });

  function updateProgress(lessonKey, status) {
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonKey, status })
    });
  }

  async function loadUserProgress() {
    try {
      const res = await fetch("/api/progress");
      const data = await res.json();
      data.forEach(entry => {
        updateLessonStatusUI(entry.lesson_id, entry.lesson_type, entry.status);
      });
    } catch (err) {
      console.error("Could not load user progress", err);
    }
}

  function updateLessonStatusUI(id, type, status = "completed") {
    const item = document.querySelector(`.lesson-item[data-id="${id}"][data-type="${type}"]`);
    if (item) {
      item.classList.remove("completed", "in-progress");
      item.classList.add(status === "completed" ? "completed" : "in-progress");
      item.querySelector(".lesson-status").textContent = status === "completed" ? "Completed" : "In Progress";
    }
  }

  languageBtn.addEventListener("click", () => {
    currentLanguage = currentLanguage === "en" ? "es" : "en";
    localStorage.setItem("preferredLanguage", currentLanguage);
    location.reload();
  });
  // <-- After all lessons loaded
loadUserProgress();
});
