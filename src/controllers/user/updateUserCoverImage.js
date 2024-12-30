import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { User } from "../../models/user.model.js";
import { coverUpload } from "../../utils/cloudinary.js";
import { deletePreviousCoverPicture } from "../../utils/cloudinary.js";

export const updateUserCoverImage = asyncHandler(async (req, res) => {
  const userName = req.user?.userName;
  const coverPath = req.file?.path;
  if (!coverPath) throw new ApiError(400, "cover Picture is Important");
  const cover = await coverUpload(coverPath, userName);
  if (!cover.url) throw new ApiError(400, "Error Occured");
  const user = await User.findById(req.user?._id);
  const cuurentCover = user?.coverPicture;
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { coverPicture: "" },
    },
    { new: true }
  ).select("-password -refreshToken");

  const updateUserCover = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { coverPicture: cover?.url },
    },
    { new: true }
  ).select("-password -refreshToken");
  deletePreviousCoverPicture(cuurentCover, userName);
  return res
    .status(200)
    .json(
      new ApiResponse(200, updateUserCover, "Avatar image updated successfully")
    );
});
