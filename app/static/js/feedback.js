document.addEventListener("DOMContentLoaded", () => {
  const feedbackBtn = document.getElementById("feedback-btn");
  const modal = document.getElementById("feedback-modal");
  const closeModal = document.querySelector(".close-modal");
  const feedbackForm = document.getElementById("feedback-form");

  feedbackBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  closeModal.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Optional: hide modal when clicking outside it
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

  feedbackForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const experience = feedbackForm.experience.value;
    const problems = Array.from(feedbackForm.querySelectorAll("input[name='problem']:checked")).map(cb => cb.value);
    const problemDetail = feedbackForm["problem-detail"].value;
    const additional = feedbackForm["additional-feedback"].value;

    const data = {
      experience,
      problems,
      problemDetail,
      additional
    };

    console.log("Feedback submitted:", data);
    alert("Thank you for your feedback!");
    feedbackForm.reset();
    modal.classList.add("hidden");
  });
});
