import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Comment } from "../../models/comment.model.js";
import mongoose from "mongoose";

export const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const comment = await Comment.find({ video: videoId });
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Updated successfully"));
});
