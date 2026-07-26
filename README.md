# ♟️ امتحان أساسيات الشطرنج — Chess Exam Web App

A fun, colorful, kid-friendly Arabic (RTL) chess exam site that auto-grades students, shows results instantly, and stores every submission in Google Sheets.

## Project Structure

```
chess-exam/
├── index.html      # Page structure (hero, form, questions, result screen)
├── style.css        # All styling — no inline CSS
├── script.js         # Validation, grading, submission, confetti — no inline JS
├── Code.gs           # Google Apps Script backend (writes to Google Sheets)
└── README.md          # This file
```

## Setup Guide

### 1. Create a Google Sheet
- Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
- Name it something like **"Chess Exam Responses"**.
- You don't need to add any headers manually — the script creates a `Responses` tab with headers automatically on the first submission.

### 2. Create the Apps Script project
- In the sheet, go to **Extensions → Apps Script**.
- Delete any placeholder code in the editor.

### 3. Paste `Code.gs`
- Copy the full contents of `Code.gs` from this project into the Apps Script editor.
- Click the 💾 save icon and name the project (e.g. "Chess Exam API").

### 4. Deploy as a Web App
- Click **Deploy → New deployment**.
- Click the gear icon next to "Select type" and choose **Web app**.
- Configure:
  - **Description:** Chess Exam API v1
  - **Execute as:** Me (your Google account)
  - **Who has access:** Anyone
- Click **Deploy**.
- Authorize the script when prompted (click through the "unverified app" warning — this is expected since you own the script).
- Copy the generated **Web app URL** (it looks like `https://script.google.com/macros/s/XXXXXXXXXX/exec`).

### 5. Replace the Web App URL inside `script.js`
Open `script.js` and update this line near the top:

```js
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec';
```

Replace it with the URL you copied in step 4.

### 6. Test the submission
- Open `index.html` in a browser (or host it — see below).
- Fill in the student info and answer all 7 questions.
- Click **إرسال الإجابات**.
- You should see a success toast, confetti (if the score is 60%+), and the result screen.
- Check your Google Sheet — a new `Responses` tab should now contain the submission row.

> **Tip:** You can test the API directly by visiting the Web App URL in your browser — it should return `{"status":"success","message":"Chess Exam API is running"}`.

## Hosting

This is a static site (HTML/CSS/JS only), so it can be hosted anywhere:
- **GitHub Pages** — push the folder to a repo and enable Pages.
- **Netlify / Vercel** — drag-and-drop the folder or connect the repo.
- **Google Sites / Firebase Hosting** — also work fine.

No build step is required.

## Grading Logic

Each question is worth 1 point (7 points total). The grade thresholds are:

| Percentage | Grade |
|---|---|
| 100% | 🏆 ممتاز |
| 85% – 99% | 🥇 ممتاز جداً |
| 75% – 84% | 🥈 جيد جداً |
| 60% – 74% | 🥉 جيد |
| < 60% | 📚 يحتاج إلى تدريب أكثر |

To change the correct answers, edit the `CORRECT_ANSWERS` object at the top of `script.js`.

## Customization

- **Colors:** all defined as CSS custom properties at the top of `style.css` (`:root`).
- **Questions:** edit the `<section class="question-card">` blocks in `index.html`, then update `CORRECT_ANSWERS` in `script.js` to match.
- **Phone validation:** currently validates Egyptian mobile numbers (`01[0125]xxxxxxxx`). Adjust the regex in `isValidPhone()` in `script.js` for other countries.

## Security Notes

- The submit button is disabled while a request is in flight, preventing double submissions from double-clicks.
- Each submission gets a unique `Submission ID` generated client-side; the Apps Script backend also checks the last 200 rows for a duplicate ID before appending, guarding against network retries.
- All fields are validated both in the browser (fast feedback) and should be treated as untrusted on the backend — the current `Code.gs` performs basic required-field checks before writing.

## Browser Support

Modern evergreen browsers (Chrome, Edge, Safari, Firefox). Uses `:has()` for radio-option styling, which is supported in all current browser versions as of 2026.
