import { asyncHandler } from "../../utils/asyncHandler.js";
import { User } from "../../models/user.model.js";
import mongoose from "mongoose";
import { ApiResponse } from "../../utils/apiResponse.js";

export const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(`${req.user._id}`),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    profilePicture: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ]);
  if (!user[0].watchHistory.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "No watch history found"));
  }
  return res.status(200).json(new ApiResponse(200, {}, "Success"));
});
