import { asyncHandler } from "../../utils/asyncHandler.js";
import { User } from "../../models/user.model.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";

export const getUserChannel = asyncHandler(async (req, res) => {
  const { userName } = req.params;

  if (!userName?.trim()) throw new ApiError(400, "Username not found");
  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedChannels",
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        subcribedToCount: { $size: "$subscribedChannels" },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        email: 1,
        profilePicture: 1,
        coverPicture: 1,
        createdAt: 1,
        subscribersCount: 1,
        subcribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);
  if (!channel?.length) throw new ApiError(404, "Channel does not exist");
  return res.status(200).json(new ApiResponse(200, channel[0], "Fetched"));
});
