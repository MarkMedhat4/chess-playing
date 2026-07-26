/**
 * Chess Exam — Google Apps Script backend
 * Receives exam submissions via POST and appends them to a Google Sheet.
 *
 * SETUP:
 * 1. Create a Google Sheet.
 * 2. Extensions > Apps Script, paste this file as Code.gs.
 * 3. Deploy > New deployment > Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web App URL into WEB_APP_URL in script.js.
 * See README.md for the full walkthrough.
 */

const SHEET_NAME = 'Responses';

const HEADERS = [
  'Timestamp',
  'Student Name',
  'Date of Birth',
  'Phone',
  'Question 1',
  'Question 2',
  'Question 3',
  'Question 4',
  'Question 5',
  'Question 6',
  'Question 7',
  'Correct Answers',
  'Wrong Answers',
  'Score',
  'Percentage',
  'Grade',
  'Submission ID',
];

/**
 * Handles POST requests from the exam web app.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: 'error', message: 'No data received' });
    }

    const data = JSON.parse(e.postData.contents);

    const requiredFields = ['studentName', 'dateOfBirth', 'phone', 'submissionId'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return jsonResponse({ status: 'error', message: `Missing field: ${field}` });
      }
    }

    const sheet = getOrCreateSheet();

    // Prevent duplicate submissions with the same Submission ID
    if (isDuplicateSubmission(sheet, data.submissionId)) {
      return jsonResponse({ status: 'success', message: 'Already recorded', duplicate: true });
    }

    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.studentName,
      data.dateOfBirth,
      data.phone,
      data.q1 || '',
      data.q2 || '',
      data.q3 || '',
      data.q4 || '',
      data.q5 || '',
      data.q6 || '',
      data.q7 || '',
      data.correctAnswers,
      data.wrongAnswers,
      data.score,
      data.percentage,
      data.grade,
      data.submissionId,
    ]);

    return jsonResponse({ status: 'success', message: 'Saved' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

/**
 * Simple health check for GET requests (useful when testing the deployment URL).
 */
function doGet() {
  return jsonResponse({ status: 'success', message: 'Chess Exam API is running' });
}

/**
 * Returns the "Responses" sheet, creating it with headers if it doesn't exist yet.
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }

  return sheet;
}

/**
 * Checks the last 200 rows for a matching Submission ID to avoid duplicates
 * (e.g. from network retries or double clicks that slip past the client-side guard).
 */
function isDuplicateSubmission(sheet, submissionId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const startRow = Math.max(2, lastRow - 200);
  const idColumn = HEADERS.indexOf('Submission ID') + 1;
  const range = sheet.getRange(startRow, idColumn, lastRow - startRow + 1, 1);
  const ids = range.getValues().flat();

  return ids.includes(submissionId);
}

/**
 * Builds a JSON response with the correct MIME type.
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
