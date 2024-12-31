import { User } from "../../models/user.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { deletePreviousCoverPicture } from "../../utils/cloudinary.js";
import { deletePreviousProfilePicture } from "../../utils/cloudinary.js";

export const deleteLoginUser = asyncHandler(async (req, res) => {
  const { user } = req;
  await deletePreviousCoverPicture(user.coverPicture, user.userName);
  await deletePreviousProfilePicture(user.profilePicture, user.userName);
  await User.findByIdAndDelete(user._id);
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Deleted"));
});
