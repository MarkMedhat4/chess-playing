/* ==========================================================================
   Chess Exam — script.js
   Handles: validation, auto-grading, Google Sheets submission, UI feedback
   ========================================================================== */

'use strict';

/* ============ CONFIGURATION ============ */
// Replace this with your deployed Google Apps Script Web App URL (see README.md)
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzgKSHnvdDJ0jTmsxuo8k3IKL0xTqhUR5zFrM1XfVQWh4t8MgVB4mhGfMLD9pNYGg/exec';

// Correct answers for each question (values match the radio button "value" attributes)
const CORRECT_ANSWERS = {
  q1: 'b', // كش مات للخصم
  q2: 'b', // 64
  q3: 'b', // الأبيض على اليمين من تحت
  q4: 'b', // حصان أبيض
  q5: 'b', // أسود
  q6: 'c', // 16
  q7: 'c', // الملك والحصان
  q8: 'b', // علامة (+)
  q9: 'b', // غلط
  q10: 'c', // الطابية والفيل
  q11: 'c', // 8
  q12: 'c', // 8
  q13: 'a', // صح
  q14: 'c', // لا أستطيع تحريك البيدق
  q15: 'b', // غلط
};

const TOTAL_QUESTIONS = Object.keys(CORRECT_ANSWERS).length;
const TOTAL_FIELDS = TOTAL_QUESTIONS + 3; // + name, birthDate, phone

/* ============ STATE ============ */
let isSubmitting = false;

/* ============ DOM REFERENCES ============ */
const form = document.getElementById('examForm');
const progressFill = document.getElementById('progressFill');
const progressCounter = document.getElementById('progressCounter');
const progressPercent = document.getElementById('progressPercent');
const submitBtn = document.getElementById('submitBtn');
const resultScreen = document.getElementById('resultScreen');
const backHomeBtn = document.getElementById('backHomeBtn');

/* ==========================================================================
   PROGRESS TRACKING
   ========================================================================== */
function countFilledFields() {
  let filled = 0;

  const name = document.getElementById('studentName').value.trim();
  const birth = document.getElementById('birthDate').value.trim();
  const phone = document.getElementById('phone').value.trim();

  if (name) filled++;
  if (birth) filled++;
  if (phone) filled++;

  Object.keys(CORRECT_ANSWERS).forEach((q) => {
    if (form.querySelector(`input[name="${q}"]:checked`)) filled++;
  });

  return filled;
}

function updateProgress() {
  const filled = countFilledFields();
  const pct = Math.round((filled / TOTAL_FIELDS) * 100);
  progressFill.style.width = `${pct}%`;
  progressCounter.textContent = `${filled} / ${TOTAL_FIELDS}`;
  progressPercent.textContent = `${pct}%`;
}

form.addEventListener('input', updateProgress);
form.addEventListener('change', (e) => {
  updateProgress();
  // Mark the parent question card as answered
  if (e.target.type === 'radio') {
    const card = e.target.closest('.question-card');
    if (card) {
      card.classList.add('answered');
      card.classList.remove('invalid');
    }
  }
});

/* ==========================================================================
   TOAST NOTIFICATIONS
   ========================================================================== */
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'error' ? 'fa-circle-exclamation'
             : type === 'success' ? 'fa-circle-check'
             : 'fa-circle-info';

  toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ==========================================================================
   VALIDATION
   ========================================================================== */
function clearErrors() {
  document.querySelectorAll('.field-error').forEach((el) => (el.textContent = ''));
  document.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
}

function setFieldError(fieldId, message) {
  const errorEl = document.getElementById(`err-${fieldId}`);
  if (errorEl) errorEl.textContent = message;

  const inputEl = document.getElementById(fieldId);
  if (inputEl) inputEl.classList.add('invalid');

  const group = document.querySelector(`[data-question="${fieldId}"]`) ||
                (inputEl ? inputEl.closest('.card') : null);
  if (group) group.classList.add('invalid');
}

function isValidPhone(phone) {
  // Egyptian mobile format: 01 followed by 9 digits (11 digits total),
  // also accepts +20 prefix.
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(01[0125][0-9]{8}|(\+20|0020)1[0125][0-9]{8})$/.test(cleaned);
}

function validateForm() {
  clearErrors();
  let firstInvalid = null;
  let isValid = true;

  const name = document.getElementById('studentName').value.trim();
  const birthDate = document.getElementById('birthDate').value;
  const phone = document.getElementById('phone').value.trim();

  if (!name) {
    setFieldError('studentName', 'من فضلك اكتب الاسم الرباعي');
    isValid = false;
    firstInvalid = firstInvalid || document.getElementById('studentName').closest('.card');
  } else if (name.split(/\s+/).length < 2) {
    setFieldError('studentName', 'من فضلك اكتب الاسم كاملاً (اسمين على الأقل)');
    isValid = false;
    firstInvalid = firstInvalid || document.getElementById('studentName').closest('.card');
  }

  if (!birthDate) {
    setFieldError('birthDate', 'من فضلك اختر تاريخ الميلاد');
    isValid = false;
    firstInvalid = firstInvalid || document.getElementById('birthDate').closest('.card');
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosen = new Date(birthDate);
    if (chosen > today) {
      setFieldError('birthDate', 'لا يمكن اختيار تاريخ في المستقبل');
      isValid = false;
      firstInvalid = firstInvalid || document.getElementById('birthDate').closest('.card');
    }
  }

  if (!phone) {
    setFieldError('phone', 'من فضلك اكتب رقم الهاتف');
    isValid = false;
    firstInvalid = firstInvalid || document.getElementById('phone').closest('.card');
  } else if (!isValidPhone(phone)) {
    setFieldError('phone', 'رقم الهاتف غير صحيح، تأكد من كتابته بشكل صحيح');
    isValid = false;
    firstInvalid = firstInvalid || document.getElementById('phone').closest('.card');
  }

  Object.keys(CORRECT_ANSWERS).forEach((q) => {
    const checked = form.querySelector(`input[name="${q}"]:checked`);
    if (!checked) {
      setFieldError(q, 'من فضلك اختر إجابة');
      isValid = false;
      firstInvalid = firstInvalid || document.querySelector(`[data-question="${q}"]`);
    }
  });

  if (!isValid && firstInvalid) {
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return isValid;
}

/* ==========================================================================
   GRADING
   ========================================================================== */
function gradeExam() {
  const answers = {};
  let correctCount = 0;

  Object.keys(CORRECT_ANSWERS).forEach((q) => {
    const checked = form.querySelector(`input[name="${q}"]:checked`);
    const value = checked ? checked.value : '';
    answers[q] = value;
    if (value === CORRECT_ANSWERS[q]) correctCount++;
  });

  const wrongCount = TOTAL_QUESTIONS - correctCount;
  const percentage = Math.round((correctCount / TOTAL_QUESTIONS) * 100);

  let grade;
  if (percentage === 100) grade = '🏆 ممتاز';
  else if (percentage >= 85) grade = '🥇 ممتاز جداً';
  else if (percentage >= 75) grade = '🥈 جيد جداً';
  else if (percentage >= 60) grade = '🥉 جيد';
  else grade = '📚 يحتاج إلى تدريب أكثر';

  return { answers, correctCount, wrongCount, percentage, grade };
}

function generateSubmissionId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `CHESS-${timestamp}-${random}`.toUpperCase();
}

function formatDateDDMMYYYY(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/* ==========================================================================
   SUBMISSION
   ========================================================================== */
async function submitToSheet(payload) {
  console.log('[Chess Exam] Sending payload to:', WEB_APP_URL);
  console.log('[Chess Exam] Payload:', payload);

  if (!WEB_APP_URL || WEB_APP_URL.includes('AKfycbxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')) {
    throw new Error('WEB_APP_URL لسه بيحتوي على القيمة الافتراضية — استبدلها برابط الـ deployment الحقيقي');
  }

  let response;
  try {
    response = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // avoids CORS preflight with Apps Script
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
  } catch (networkErr) {
    // This branch fires for real network/CORS failures (request never completed).
    console.error('[Chess Exam] Network/CORS failure — the request may not have reached the server at all:', networkErr);
    throw new Error('فشل الاتصال بالسيرفر (Network/CORS) — تأكد إن الرابط شغال ومتاح لـ "Anyone"');
  }

  console.log('[Chess Exam] Response status:', response.status, response.statusText);

  // Read as text first so we can see the raw body even if it's not valid JSON
  // (e.g. an HTML "Authorization required" page instead of our JSON).
  const rawText = await response.text();
  console.log('[Chess Exam] Raw response body:', rawText);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${rawText.slice(0, 200)}`);
  }

  let result;
  try {
    result = JSON.parse(rawText);
  } catch (parseErr) {
    console.error('[Chess Exam] Response was not valid JSON — likely a Google login/authorization page instead of the API response.');
    throw new Error('الرد من السيرفر مش JSON — على الأغلب الـ deployment محتاج صلاحيات "Anyone" أو الرابط غلط');
  }

  console.log('[Chess Exam] Parsed result:', result);

  if (!result || result.status !== 'success') {
    throw new Error(result && result.message ? result.message : 'Unknown error from server');
  }
  return result;
}

function setLoading(loading) {
  isSubmitting = loading;
  submitBtn.disabled = loading;
  submitBtn.classList.toggle('loading', loading);
}

async function handleSubmit(event) {
  event.preventDefault();

  if (isSubmitting) return; // prevent double submission

  if (!validateForm()) {
    showToast('من فضلك أكمل جميع الحقول قبل الإرسال', 'error');
    return;
  }

  const name = document.getElementById('studentName').value.trim();
  const birthDate = document.getElementById('birthDate').value;
  const phone = document.getElementById('phone').value.trim();

  const { answers, correctCount, wrongCount, percentage, grade } = gradeExam();
  const submissionId = generateSubmissionId();

  const payload = {
    timestamp: new Date().toISOString(),
    studentName: name,
    dateOfBirth: formatDateDDMMYYYY(birthDate),
    phone,
    q1: answers.q1,
    q2: answers.q2,
    q3: answers.q3,
    q4: answers.q4,
    q5: answers.q5,
    q6: answers.q6,
    q7: answers.q7,
    q8: answers.q8,
    q9: answers.q9,
    q10: answers.q10,
    q11: answers.q11,
    q12: answers.q12,
    q13: answers.q13,
    q14: answers.q14,
    q15: answers.q15,
    correctAnswers: correctCount,
    wrongAnswers: wrongCount,
    score: `${correctCount} / ${TOTAL_QUESTIONS}`,
    percentage: `${percentage}%`,
    grade,
    submissionId,
  };

  setLoading(true);

  try {
    await submitToSheet(payload);
    showToast('تم إرسال إجابتك بنجاح!', 'success');
    showResult({ name, correctCount, wrongCount, percentage, grade });
  } catch (err) {
    console.error('Submission error:', err);
    // Showing err.message (not just a generic message) so the real cause is
    // visible on-screen while debugging. You can revert to a generic message
    // once submissions are working reliably.
    showToast(`حدث خطأ أثناء الإرسال: ${err.message}`, 'error', 6000);
  } finally {
    setLoading(false);
  }
}

form.addEventListener('submit', handleSubmit);

/* ==========================================================================
   RESULT SCREEN
   ========================================================================== */
function showResult({ name, correctCount, wrongCount, percentage, grade }) {
  document.getElementById('progressWrap').hidden = true;
  form.hidden = true;

  document.getElementById('resultName').textContent = name;
  document.getElementById('resultScoreText').textContent = `${correctCount} / ${TOTAL_QUESTIONS}`;
  document.getElementById('resultCorrect').textContent = correctCount;
  document.getElementById('resultWrong').textContent = wrongCount;
  document.getElementById('resultPercent').textContent = `${percentage}%`;
  document.getElementById('resultGrade').textContent = grade;
  document.getElementById('resultScoreCircle').style.setProperty('--pct', `${percentage}%`);

  resultScreen.hidden = false;
  resultScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (percentage >= 60) {
    launchConfetti();
  }
}

backHomeBtn.addEventListener('click', () => {
  window.location.reload();
});

/* ==========================================================================
   CONFETTI ANIMATION (lightweight canvas implementation)
   ========================================================================== */
function launchConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#4F46E5', '#22C55E', '#FACC15', '#EF4444', '#818CF8'];
  const pieces = Array.from({ length: 140 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.5,
    size: 6 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    speedY: 2 + Math.random() * 3,
    speedX: -2 + Math.random() * 4,
    rotation: Math.random() * 360,
    rotationSpeed: -6 + Math.random() * 12,
  }));

  let frame = 0;
  const maxFrames = 220;

  function draw() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pieces.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotationSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });

    if (frame < maxFrames) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  requestAnimationFrame(draw);
}

window.addEventListener('resize', () => {
  const canvas = document.getElementById('confettiCanvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

/* ==========================================================================
   INIT
   ========================================================================== */
document.getElementById('birthDate').max = new Date().toISOString().split('T')[0];
updateProgress();
