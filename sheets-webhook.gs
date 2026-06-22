/**
 * Google Apps Script Web App for Seeko WC26 Prediction Pool
 * 
 * Functions as:
 * 1. Primary JSON Database: Reads and writes seeko_wc26_state.json directly from/to Google Drive.
 * 2. Spreadsheet Logger: Logs and updates predictions in spreadsheet rows.
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Replace all existing code with this updated code.
 * 4. Click Deploy > Manage deployments.
 * 5. Edit the active deployment, select version: "New version", and click Deploy.
 *    (This keeps the exact same Web App URL so you don't need to change index.html!)
 * 6. Make sure permissions are authorized when Google prompts you.
 */

const STATE_FILE_NAME = "seeko_wc26_state.json";

// 1. GET Request handler (for reading state)
function doGet(e) {
  try {
    const action = e.parameter.action;
    if (action === "read") {
      const state = readStateFile();
      return ContentService.createTextOutput(JSON.stringify(state))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Invalid GET action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 2. POST Request handler (for writing state or logging single submission)
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = e.parameter.action;
    
    // Check if it's a full state write
    if (action === "write" || payload.wc26_predictions) {
      writeStateFile(payload);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Full state saved successfully" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Otherwise, it's a single prediction submission log
    const entry = payload;
    const phone = String(entry.phone || "").replace(/\D/g, "");
    if (!phone) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Missing phone number" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Update state file with this single entry
    const state = readStateFile();
    state.wc26_predictions[phone] = entry;
    writeStateFile(state);
    
    // Log/update in Spreadsheet
    logToSpreadsheet(entry);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Prediction logged and synced successfully" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Helper to read the JSON state file from Google Drive
function readStateFile() {
  const files = DriveApp.getFilesByName(STATE_FILE_NAME);
  if (files.hasNext()) {
    const file = files.next();
    const content = file.getAs("text/plain").getDataAsString();
    try {
      return JSON.parse(content);
    } catch (e) {
      return { wc26_predictions: {}, wc26_results: null, photos: {} };
    }
  }
  return { wc26_predictions: {}, wc26_results: null, photos: {} };
}

// Helper to write the JSON state file to Google Drive
function writeStateFile(state) {
  const files = DriveApp.getFilesByName(STATE_FILE_NAME);
  let file;
  if (files.hasNext()) {
    file = files.next();
    file.setContent(JSON.stringify(state));
  } else {
    file = DriveApp.createFile(STATE_FILE_NAME, JSON.stringify(state), MimeType.PLAIN_TEXT);
  }
  return file;
}

// Helper to update the spreadsheet sheet
function logToSpreadsheet(entry) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Phone",
      "Name",
      "Champion",
      "Runner-up",
      "3rd Place",
      "Predicted Score",
      "Golden Ball Country",
      "Golden Ball Player",
      "Golden Boot Country",
      "Golden Boot Player",
      "Status",
      "Last Updated"
    ]);
    sheet.getRange("A1:L1").setFontWeight("bold");
  }

  const phone = String(entry.phone || "").replace(/\D/g, "");
  const dataRow = [
    phone,
    entry.name || "",
    entry.champion || "",
    entry.runnerUp || "",
    entry.secondRunnerUp || "",
    `${entry.champGoals || 0} - ${entry.runnerGoals || 0}`,
    entry.goldenBallCountry || "",
    entry.goldenBall || "",
    entry.goldenBootCountry || "",
    entry.goldenBoot || "",
    entry.status || "pending",
    entry.submittedAt || new Date().toISOString()
  ];

  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).replace(/\D/g, "") === phone) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, dataRow.length).setValues([dataRow]);
  } else {
    sheet.appendRow(dataRow);
  }
}

// Allow CORS preflight requests
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}
