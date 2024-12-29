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

export const upload = multer({ storage });
