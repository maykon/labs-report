const { getOutputFileReport, toPdf } = require("./utils");

const prepareReport = querys => {
  let report = {};
  for (let [key, query] of Object.entries(querys)) {
    let props = prepareReportValue(key, query);
    report = { ...report, ...props };
  }
  return report;
};

const getNameVarReport = key => `#\\(${key.toUpperCase()}\\)`;

const returnEmptyVarReport = key => ({ [getNameVarReport(key)]: "" });

const prepareReportValue = (key, query = []) => {
  const REGEX_TYPE_VALUE = /_(text|list|table)_(?:pg|orcl)$/;
  if (!REGEX_TYPE_VALUE.test(key)) return returnEmptyVarReport(key);

  const match = key.match(REGEX_TYPE_VALUE)[1];
  switch (match) {
    case "list":
      return prepareListReport(key, query);
    case "table":
      return prepareTableReport(key, query);
    default:
      return prepareTextReport(key, query);
  }
};

const prepareTextReport = (key, query) => {
  if (query.length === 0) return returnEmptyVarReport(key);
  return { [getNameVarReport(key)]: query[0].text };
};

const prepareListReport = (key, query) => ({
  [getNameVarReport(key)]: "<ul>"
    .concat(query.map(v => `<li>${v.item}</li>`).join(""))
    .concat("</ul>")
});

const prepareTableReport = (key, query) => {
  if (query.length === 0) return returnEmptyVarReport(key);
  let table = `<div style="overflow-x:auto;"><table border="1" cellpadding="5" cellspacing="0"><tbody><tr>`;
  let firstRow = query[0];
  for (let header of Object.keys(firstRow)) {
    table += `<th>${header}</th>`;
  }
  table += "</tr>";

  for (let row of query) {
    table += "<tr>";
    for (let value of Object.values(row)) {
      table += `<td>${value}</td>`;
    }
    table += "</tr>";
  }
  table += "</tbody></table></div>";

  return { [getNameVarReport(key)]: table };
};

const prepareHtmlFile = file => {
  let html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><head>`;
  html += `<style type="text/css">
      table {
        border-collapse: collapse;
      }
      table tbody th {
        background-color: #4472c4;
        color: white;
        font-weight: 400;
      }
      table tbody tr:nth-child(even) {
        background-color: rgb(217, 226, 243);
      }
  </style></head><body>`;
  html += file;
  html += `</body></html>`;
  return html;
};

const prepareReportFile = (querys, reportFile) => {
  const reportValues = prepareReport(querys);
  for (let [key, text] of Object.entries(reportValues)) {
    reportFile = reportFile.replace(new RegExp(key, "g"), text);
  }
  return reportFile;
};

const prepareHtmlToPdf = file => {
  let isWin = /^win/.test(process.platform);
  let fixFontSizeStyle = isWin
    ? ""
    : `html,body { font: 7px Arial, Helvetica, sans-serif;
     -webkit-font-smoothing: antialiased !important; -webkit-print-color-adjust: exact;
     box-sizing: border-box; }`;
  return file.replace("</style>", `${fixFontSizeStyle}</style>`);
};

const preparePDF = async (report, reportFile) => {
  let reportPdf = { attachments: [] };
  if (report.mail.pdf) {
    let [filename, path] = getOutputFileReport(report.report);
    let htmlStyle = prepareHtmlToPdf(reportFile);
    await toPdf(htmlStyle, path).catch(console.error);
    reportPdf = {
      attachments: [{ filename, path, contentType: "application/pdf" }]
    };
  }
  return reportPdf;
};

module.exports = {
  prepareReport,
  prepareReportFile,
  prepareHtmlFile,
  prepareHtmlToPdf,
  preparePDF
};
