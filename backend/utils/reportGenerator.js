const { parseExcelBuffer } = require("./excelParser");
const fs = require("fs");

exports.generateReportCSV = (records, filePath) => {
  const headers = Object.keys(records[0] || {}).join(",");
  const rows = records.map(r => Object.values(r).join(",")).join("\n");
  const csvData = `${headers}\n${rows}`;
  fs.writeFileSync(filePath, csvData, "utf8");
  return filePath;
};
