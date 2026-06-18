const XLSX = require("xlsx");

exports.parseExcelBuffer = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(sheet);
  return jsonData;
};
