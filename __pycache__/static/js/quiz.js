const player = videojs('quiz-video');
let videoQuestions = [];
let quizReady = false;

const videoId = document.getElementById('quiz-video').getAttribute('data-video-id');

// Load questions from backend
fetch(`/api/questions/${videoId}`)
  .then(res => res.json())
  .then(data => {
    videoQuestions = data;
  });

// Start watching only after video actually starts
player.ready(() => {
  player.on('play', () => {
    if (!quizReady) {
      attachTimeUpdateListener();
      quizReady = true;
    }
  });
});

function attachTimeUpdateListener() {
  player.on('timeupdate', () => {
    const currentTime = Math.floor(player.currentTime());

    for (const q of videoQuestions) {
      // Use a 1-second window for better reliability
      if (currentTime >= q.timestamp && currentTime <= q.timestamp + 1 && !q.shown) {
        q.shown = true;
        showQuiz(q);
        player.pause();
        player.controls(false);
        break;
      }
    }
  });
}

function showQuiz(question) {
  const quizContainer = document.getElementById("quiz-overlay");
  quizContainer.innerHTML = `<p><strong>${question.text}</strong></p>`;
  question.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.textContent = opt.text;
    btn.onclick = () => submitAnswer(question.id, opt.text, question.category_id);
    quizContainer.appendChild(btn);
  });
  quizContainer.style.display = "block";
}

function submitAnswer(questionId, answerText, categoryId) {
  fetch("/submit_answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question_id: questionId,
      answer: answerText,
      category_id: categoryId
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log(data.message);
    document.getElementById("quiz-overlay").style.display = "none";
    player.controls(true);
    player.play();
  });
}