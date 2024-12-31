import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Comment } from "../../models/comment.model.js";
import mongoose from "mongoose";

export const updateComment = asyncHandler(async (req, res) => {
  const { content, commentId } = req.body;

  if (!content) throw new ApiError(400, "Content is required");
  if (!commentId) throw new ApiError(400, "CommentId is required");

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid CommentId");
  }

  const comment = await Comment.findOneAndUpdate(
    { _id: commentId, owner: req.user._id },
    { $set: { content } },
    { new: true }
  );

  if (!comment) throw new ApiError(404, "Comment not found or not authorized");
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Updated successfully"));
});
