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

const getFirstPropValue = obj => Object.values(obj)[0];

const prepareTextReport = (key, query) => {
  if (query.length === 0) return returnEmptyVarReport(key);
  return { [getNameVarReport(key)]: getFirstPropValue(query[0]) };
};

const prepareListReport = (key, query) => ({
  [getNameVarReport(key)]: "<ul>"
    .concat(query.map(v => `<li>${getFirstPropValue(v)}</li>`).join(""))
    .concat("</ul>")
});

const getStripedClass = i => (i % 2 === 0 ? "even" : "odd");

const prepareTableReport = (key, query) => {
  if (query.length === 0) return returnEmptyVarReport(key);
  let table = `<div style="overflow-x:auto;"><table border="1" cellpadding="5" cellspacing="0"><thead><tr>#head</tr></thead><tbody>#body</tbody></table></div>`;
  let firstRow = query[0];
  let head = Object.keys(firstRow)
    .map(h => `<th>${h}</th>`)
    .join("");

  let body = query.reduce(
    (acc, row, i) =>
      acc
        .concat(`<tr class="${getStripedClass(i)}">`)
        .concat(
          Object.values(row)
            .map(v => `<td>${v}</td>`)
            .join("")
        )
        .concat("</tr>"),
    ""
  );

  table = table.replace("#head", head).replace("#body", body);
  return { [getNameVarReport(key)]: table };
};

const prepareHtmlFile = file => {
  let html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><head>
    <style type="text/css">
      table {
        border-collapse: collapse;
      }
      table thead tr th {
        background-color: #4472c4;
        color: white;
        font-weight: 400;
      }
      table tbody tr:nth-child(even) {
        background-color: rgb(217, 226, 243);
      }
      table tbody tr.even {
        background-color: rgb(217, 226, 243);
      }
    </style></head><body>${file}</body></html>`;
  return html;
};

const prepareReportFile = (querys, reportFile) => {
  const reportValues = prepareReport(querys);
  for (let [key, text] of Object.entries(reportValues)) {
    reportFile = reportFile.replace(new RegExp(key, "g"), text);
  }
  return reportFile;
};

module.exports = {
  prepareReportFile,
  prepareHtmlFile
};
