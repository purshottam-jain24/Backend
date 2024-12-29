import { Router } from "express";
import {
  changePassword,
  getCurrentUser,
  loginUser,
  logOut,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserCoverImage,
  updateUserProfileImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "coverPicture", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logOut);
router.route("/refreshToken").post(refreshAccessToken);
router.route("/changePassword").patch(verifyJWT,changePassword);
router.route("/getCurrentUser").get(verifyJWT, getCurrentUser);
router.route("/updateAccountDetails").patch(verifyJWT, updateAccountDetails);
router
  .route("/updateUserProfileImage")
  .patch(verifyJWT, upload.single("profilePicture"), updateUserProfileImage);
router
  .route("/updateUserCoverImage")
  .patch(verifyJWT, upload.single("coverPicture"), updateUserCoverImage);

export default router;
