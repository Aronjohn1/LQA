const QRCode = require("qrcode");

exports.generateQRCodeDataURL = async (text) => {
  try {
    const url = await QRCode.toDataURL(text);
    return url;
  } catch (err) {
    throw new Error("QR generation failed: " + err.message);
  }
};
