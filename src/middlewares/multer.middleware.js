import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    const userName = req.body.userName || req.user?.userName;
    if (!userName) {
      return cb(new Error("User name is required to upload files"));
    }
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${userName}-${uniqueSuffix}`);
  },
});

export const upload = multer({
  storage,
  fileFilter: function (_, file, cb) {
    if (file.mimetype.startsWith("image")) {
      return cb(null, true);
    }
    cb(new Error("Only images are allowed"));
  },
  limits: { fileSize: 1024 * 1024 * 10 },
});

export const videoUpload = multer({
  storage,
  fileFilter: function (_, file, cb) {
    if (file.mimetype.startsWith("video")) {
      return cb(null, true);
    }
    cb(new Error("Only videos are allowed"));
  },
  limits: {
    fileSize: 1024 * 1024 * 50, // 50 MB
  },
});
