import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Playlist } from "../models/playlist.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { deleteAll } from "../utils/cloudinary.js";

export const getAdminDashboard = asyncHandler(async (req, res) => {
  const users = await User.find().countDocuments();
  const videos = await Video.find().countDocuments();
  const comments = await Comment.find().countDocuments();
  const likes = await Like.find().countDocuments();
  const playlists = await Playlist.find().countDocuments();
  const tweets = await Tweet.find().countDocuments();
  const subscriptions = await Subscription.find().countDocuments();
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { users, videos, comments, likes, playlists, tweets, subscriptions },
        "Updated successfully"
      )
    );
});

export const deleteWhole = asyncHandler(async (req, res) => {
  await User.deleteMany();
  await Video.deleteMany();
  await Comment.deleteMany();
  await Like.deleteMany();
  await Playlist.deleteMany();
  await Tweet.deleteMany();
  await Subscription.deleteMany();
  await deleteAll();
  return res.status(200).json(new ApiResponse(200, {}, "Deletion Successful"));
});
