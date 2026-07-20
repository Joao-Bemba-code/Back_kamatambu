var express = require("express");
var router_upload = express.Router();
var multer = require("multer");
var path = require("path");

var storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads"),
  filename: (req, file, cb) => {
    var ext = path.extname(file.originalname);
    var name = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  }
});

var upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Apenas imagens sao permitidas"));
    }
    cb(null, true);
  }
});

router_upload.post("/", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Nenhuma imagem enviada" });
  }
  var baseUrl = process.env.BASE_URL || "https://back-kamatambu-1.onrender.com";
  var url = `${baseUrl}/uploads/${req.file.filename}`;
  res.status(200).json({ success: true, url });
});

router_upload.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
});

module.exports = router_upload;
