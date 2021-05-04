const prepareReport = (querys) => {
  let report = {};
  for (let [key, query] of Object.entries(querys)) {
    let props = prepareReportValue(key, query);
    report = { ...report, ...props };
  }
  return report;
};

const getNameVarReport = (key) => `#\\(${key.toUpperCase()}\\)`;

const returnEmptyVarReport = (key) => ({ [getNameVarReport(key)]: "" });

const prepareReportValue = (key, query = []) => {
  const REGEX_TYPE_VALUE = /_(text|list|table|nop)_(?:pg|orcl)$/;
  if (!REGEX_TYPE_VALUE.test(key)) return returnEmptyVarReport(key);

  const match = key.match(REGEX_TYPE_VALUE)[1];
  switch (match) {
    case "list":
      return prepareListReport(key, query);
    case "table":
      return prepareTableReport(key, query);
    case "nop":
      return {};
    default:
      return prepareTextReport(key, query);
  }
};

const getFirstPropValue = (obj) => Object.values(obj)[0];

const prepareTextReport = (key, query) => {
  if (query.length === 0) return returnEmptyVarReport(key);
  return { [getNameVarReport(key)]: getFirstPropValue(query[0]) };
};

const prepareListReport = (key, query) => ({
  [getNameVarReport(key)]: "<ul>"
    .concat(query.map((v) => `<li>${getFirstPropValue(v)}</li>`).join(""))
    .concat("</ul>"),
});

const getStripedClass = (i) => (i % 2 === 0 ? "even" : "odd");

const prepareTableReport = (key, query) => {
  if (query.length === 0) return returnEmptyVarReport(key);
  let table = `<div style="overflow-x:auto;"><table border="1" cellpadding="5" cellspacing="0"><thead><tr>#head</tr></thead><tbody>#body</tbody></table></div>`;
  let firstRow = query[0];
  let head = Object.keys(firstRow)
    .map((h) => `<th>${h}</th>`)
    .join("");

  let body = query.reduce(
    (acc, row, i) =>
      acc
        .concat(`<tr class="${getStripedClass(i)}">`)
        .concat(
          Object.values(row)
            .map((v) => `<td>${v}</td>`)
            .join("")
        )
        .concat("</tr>"),
    ""
  );

  table = table.replace("#head", head).replace("#body", body);
  return { [getNameVarReport(key)]: table };
};

const prepareHtmlFile = (file) => {
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
  reportFile = processSetOperation(querys, reportFile);
  return reportFile;
};

const unionSet = (setA, setB) => {
  const setOperation = new Set(setA);
  for (let elem of setB) {
    setOperation.add(elem);
  }
  return setOperation;
};

const intersectionSet = (setA, setB) => {
  const setOperation = new Set();
  for (let elem of setB) {
    if (setA.has(elem)) {
      setOperation.add(elem);
    }
  }
  return setOperation;
};

const diferenceSet = (setA, setB) => {
  const setOperation = new Set(setA);
  for (let elem of setB) {
    setOperation.delete(elem);
  }
  return setOperation;
};

const setOpNotFound = (reportFile, command) =>
  reportFile.replace(
    command,
    "Não há dados suficientes para realizar esta operação."
  );

const processSetOperation = (querys, reportFile) => {
  const replaceOps = reportFile.matchAll(
    /\#\((DIFERENCE|UNION|INTERSECTION)\(([^,]+),\s*([^,]+),\s*([^)]+)\)\)/g
  );
  for (const match of replaceOps) {
    const [commandText, operation, firstSql, secondSql, columnFilter] = match;
    const querysCommand = Object.entries(querys).filter(
      ([key]) => key === firstSql || key === secondSql
    );
    if (querysCommand.length !== 2) {
      reportFile = setOpNotFound(reportFile, commandText);
      continue;
    }
    let [[, queryFirst], [, querySecond]] = querysCommand;
    if (queryFirst.length === 0) {
      reportFile = setOpNotFound(reportFile, commandText);
      continue;
    }
    if (!(columnFilter in queryFirst[0])) {
      reportFile = setOpNotFound(reportFile, commandText);
      continue;
    }
    const setFirst = new Set(queryFirst.map((e) => e[columnFilter]));
    const setSecond = new Set(querySecond.map((e) => e[columnFilter]));
    let resOpFunc = [];
    switch (operation) {
      case "DIFERENCE":
        resOpFunc = diferenceSet(setFirst, setSecond);
        break;
      case "UNION":
        resOpFunc = unionSet(setFirst, setSecond);
        break;
      case "INTERSECTION":
        resOpFunc = intersectionSet(setFirst, setSecond);
        break;
    }
    if (resOpFunc.size === 0) {
      reportFile = setOpNotFound(reportFile, commandText);
      continue;
    }
    const uniao = [...queryFirst, ...querySecond];
    const resultadoFiltrado = uniao.filter((e) =>
      resOpFunc.has(e[columnFilter])
    );
    const commandTable = prepareTableReport("setOp", resultadoFiltrado);
    reportFile = reportFile.replace(
      commandText,
      commandTable[getNameVarReport("setOp")]
    );
  }
  return reportFile;
};

module.exports = {
  prepareReportFile,
  prepareHtmlFile,
};
