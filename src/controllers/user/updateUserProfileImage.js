import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { User } from "../../models/user.model.js";
import { profileUpload } from "../../utils/cloudinary.js";
import { deletePreviousProfilePicture } from "../../utils/cloudinary.js";

export const updateUserProfileImage = asyncHandler(async (req, res) => {
  const userName = req.user?.userName;
  const profilePath = req.file?.path;
  if (!profilePath) throw new ApiError(400, "Profile Picture is Important");
  const profile = await profileUpload(profilePath, userName);
  if (!profile.url) throw new ApiError(400, "Error Occured");
  const user = await User.findById(req.user?._id);
  const cuurentProfile = user?.profilePicture;
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { profilePicture: "" },
    },
    { new: true }
  ).select("-password -refreshToken");
  const updateUserProfile = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { profilePicture: profile.url },
    },
    { new: true }
  ).select("-password -refreshToken");
  deletePreviousProfilePicture(cuurentProfile, userName);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updateUserProfile,
        "Avatar image updated successfully"
      )
    );
});
