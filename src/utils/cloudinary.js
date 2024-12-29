import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const profileUpload = async (file, userName) => {
  if (!file) return null;
  try {
    const publicId = `profiles/${userName}/${Date.now()}`;
    const res = await cloudinary.uploader.upload(file, {
      folder: "profiles",
      resource_type: "auto",
      public_id: publicId,
      overwrite: true,
    });
    fs.unlinkSync(file);
    return res;
  } catch (error) {
    fs.unlinkSync(file);
    return null;
  }
};
const coverUpload = async (file, userName) => {
  if (!file) return null;
  try {
    const publicId = `covers/${userName}/${Date.now()}`;
    const res = await cloudinary.uploader.upload(file, {
      folder: "covers",
      resource_type: "auto",
      public_id: publicId,
      overwrite: true,
    });
    fs.unlinkSync(file);
    return res;
  } catch (error) {
    fs.unlinkSync(file);
    return null;
  }
};

export { profileUpload, coverUpload };
