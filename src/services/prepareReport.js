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

const prepareReportValue = (key, query) => {
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
  [getNameVarReport(key)]: query.map(v => `<li>${v.item}</li>`).join("")
});

const prepareTableReport = (key, query) => {
  if (query.length === 0) return returnEmptyVarReport(key);
  let table = "<tr>";
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

  return { [getNameVarReport(key)]: table };
};

module.exports = {
  prepareReport
};
