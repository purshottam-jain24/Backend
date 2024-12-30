import { asyncHandler } from "../../utils/asyncHandler.js";
import { deletePreviousProfilePicture } from "../../utils/cloudinary.js";
import { User } from "../../models/user.model.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";

export const deleteProfilePicture = asyncHandler(async (req, res) => {
  const { userName, profilePicture, _id } = req.user;
  if (!profilePicture)
    throw new ApiError(400, "Profile Picture is not available");
  deletePreviousProfilePicture(profilePicture, userName);
  await User.findByIdAndUpdate(
    _id,
    {
      $set: { profilePicture: "" },
    },
    { new: true }
  ).select("-password -refreshToken");
  return res
    .status(200)
    .json(new ApiResponse(200, userName, "Image deleted successfully"));
});
