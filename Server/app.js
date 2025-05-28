document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('quiz-form');
  const submitBtn = document.getElementById('submitBtn');
  const progressBar = document.getElementById('progressBar');
  const name = localStorage.getItem('name');
  const email = localStorage.getItem('email');

  if (!name || !email) {
    window.location.href = 'login.html';
    return;
  }

  fetch('/questions')
    .then(res => res.json())
    .then(questions => {
      questions.forEach((q, idx) => {
        const div = document.createElement('div');
        div.className = 'bg-blue-50 p-4 rounded-lg';
        div.innerHTML = `<p class='font-medium mb-2'>${idx + 1}. ${q.question}</p>` +
          q.options.map(opt => `
            <label class="block"><input type="radio" name="q${q.id}" value="${opt}" class="mr-2" required> ${opt}</label>
          `).join('');
        form.appendChild(div);
      });

      const updateProgress = () => {
        const total = questions.length;
        const answered = form.querySelectorAll("input[type=radio]:checked").length;
        const percent = Math.round((answered / total) * 100);
        progressBar.style.width = `${percent}%`;
      };

      form.addEventListener("change", updateProgress);
      
      submitBtn.onclick = async () => {
        const answers = questions.map(q => {
          const selected = document.querySelector(`input[name=q${q.id}]:checked`);
          return selected ? selected.value : null;
        });

        if (answers.includes(null)) {
          alert("Please answer all questions.");
          return;
        }

        const res = await fetch('/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, answers })
        });

        const data = await res.json();
        localStorage.setItem('quizScore', data.score);
        localStorage.setItem('quizRank', data.rank);
        localStorage.setItem('quizPass', data.result);
        window.location.href = 'result.html';
      };
    })
    .catch(err => {
      form.innerHTML = '<p class="text-red-600">Failed to load questions. Check backend.</p>';
      console.error(err);
    });
});
