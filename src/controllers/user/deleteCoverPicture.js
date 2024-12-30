import { asyncHandler } from "../../utils/asyncHandler.js";
import { deletePreviousCoverPicture } from "../../utils/cloudinary.js";
import { User } from "../../models/user.model.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";

export const deleteCoverPicture = asyncHandler(async (req, res) => {
  const { userName, coverPicture, _id } = req.user;
  if (!coverPicture) throw new ApiError(400, "cover Picture is not available");
  deletePreviousCoverPicture(coverPicture, userName);
  await User.findByIdAndUpdate(
    _id,
    {
      $set: { coverPicture: "" },
    },
    { new: true }
  ).select("-password -refreshToken");
  return res
    .status(200)
    .json(new ApiResponse(200, userName, "Image deleted successfully"));
});
