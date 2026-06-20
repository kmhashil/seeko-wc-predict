/**
 * Google Apps Script Web App for Seeko WC26 Prediction Pool backup
 * 
 * Instructions:
 * 1. Create a new Google Sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Delete any default code and paste this code.
 * 4. Click Deploy > New deployment.
 * 5. Select type: Web app.
 * 6. Set "Execute as": Me
 * 7. Set "Who has access": Anyone (this is important so the app can submit data without Google login).
 * 8. Click Deploy, authorize permissions, and copy the Web App URL.
 * 9. Paste the URL into index.html's GOOGLE_SHEETS_URL constant.
 */

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Set headers if the sheet is empty
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
      // Format headers bold
      sheet.getRange("A1:L1").setFontWeight("bold");
    }

    const phone = String(postData.phone || "").replace(/\D/g, "");
    if (!phone) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Missing phone number" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const dataRow = [
      phone,
      postData.name || "",
      postData.champion || "",
      postData.runnerUp || "",
      postData.secondRunnerUp || "",
      `${postData.champGoals || 0} - ${postData.runnerGoals || 0}`,
      postData.goldenBallCountry || "",
      postData.goldenBall || "",
      postData.goldenBootCountry || "",
      postData.goldenBoot || "",
      postData.status || "pending",
      postData.submittedAt || new Date().toISOString()
    ];

    // Search for existing phone entry to update
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).replace(/\D/g, "") === phone) {
        rowIndex = i + 1; // 1-indexed row number
        break;
      }
    }

    if (rowIndex > -1) {
      // Update existing row
      sheet.getRange(rowIndex, 1, 1, dataRow.length).setValues([dataRow]);
    } else {
      // Append new row
      sheet.appendRow(dataRow);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, action: rowIndex > -1 ? "update" : "append" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Allow CORS preflight requests
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}
