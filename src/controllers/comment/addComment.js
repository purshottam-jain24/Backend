import { Comment } from "../../models/comment.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";

export const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  const user = req.user;
  if (!content) throw new ApiError(400, "Comment Content is required");
  if (!videoId) throw new ApiError(404, "Video ID not found");
  if (!user) throw new ApiError(404, "User not found");
  const newComment = new Comment({
    content,
    video: videoId,
    owner: user._id,
  });

  await newComment.save();

  const addedComment = await Comment.findById(newComment._id);
  if (!addedComment) throw new ApiError(500, "Error adding comment");
  return res
    .status(201)
    .json(new ApiResponse(201, "Comment added", addedComment));
});
