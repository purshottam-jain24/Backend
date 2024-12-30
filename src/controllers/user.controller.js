import { registerUser } from "./user/registerUser.js";
import { loginUser } from "./user/loginUser.js";
import { logOut } from "./user/logOut.js";
import { refreshAccessToken } from "./user/refreshAccessToken.js";
import { changePassword } from "./user/changePassword.js";
import { getCurrentUser } from "./user/getCurrentUser.js";
import { updateAccountDetails } from "./user/updateAccountDetails.js";
import { updateUserProfileImage } from "./user/updateUserProfileImage.js";
import { updateUserCoverImage } from "./user/updateUserCoverImage.js";
import { deleteProfilePicture } from "./user/deleteProfilePicture.js";
import { deleteCoverPicture } from "./user/deleteCoverPicture.js";
import { getUserChannel } from "./user/getUserChannel.js";
import { getWatchHistory } from "./user/getWatchHistory.js";

export {
  registerUser,
  loginUser,
  logOut,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserProfileImage,
  updateUserCoverImage,
  deleteProfilePicture,
  deleteCoverPicture,
  getUserChannel,
  getWatchHistory,
};
