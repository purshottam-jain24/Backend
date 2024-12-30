import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import {
  coverUpload,
  deletePreviousCoverPicture,
  deletePreviousProfilePicture,
  profileUpload,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, error);
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, userName } = req.body;

  if (!fullName || !email || !password || !userName) {
    throw new ApiError(400, "All fields are required");
  }
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "Invalid email");
  }
  if (userName.includes(" ")) {
    throw new ApiError(400, "Username cannot contain spaces");
  }

  const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const profilePicturePath = req.files?.profilePicture[0]?.path;
  let coverPicturePath;
  if (
    req.files &&
    Array.isArray(req.files.coverPicture) &&
    req.files.coverPicture.length > 0
  ) {
    coverPicturePath = req.files.coverPicture[0].path;
  }

  if (!profilePicturePath) {
    throw new ApiError(400, "Profile picture and cover picture are required");
  }

  const profile = await profileUpload(profilePicturePath, userName);
  const cover = await coverUpload(coverPicturePath, userName);

  if (!profile) {
    throw new ApiError(500, "Error uploading images");
  }

  const newUser = await User.create({
    fullName,
    email,
    password,
    userName: userName.toLowerCase(),
    profilePicture: profile?.url,
    coverPicture: cover?.url || null,
  });

  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Error creating user");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenandRefreshToken(newUser._id);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(201, "User registered successfully", createdUser));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body;
  if (!userName && !email)
    throw new ApiError(400, "Username or Email is required");
  const user = await User.findOne({ $or: [{ userName }, { email }] });
  if (!user) throw new ApiError(404, "User does not exist");
  const validatePassword = await user.isPasswordMatch(password);
  if (!validatePassword) throw new ApiError(401, "Invalid Password");

  const { accessToken, refreshToken } =
    await generateAccessTokenandRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")
    .lean();

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

const logOut = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized");
  const decodeToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN
  );
  const user = await User.findById(decodeToken?.id);
  if (!user) throw new ApiError(401, "Unauthorized");
  if (incomingRefreshToken !== user.refreshToken)
    throw new ApiError(401, "Token is Invalid");
  const options = {
    httpOnly: true,
    secure: true,
  };

  const { accessToken, refreshToken } =
    await generateAccessTokenandRefreshToken(user._id);
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, { accessToken, refreshToken }, "Token Refreshed")
    );
});

const changePassword = asyncHandler(async (req, res) => {
  console.log(req.body);
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?.id);
  const isPasswordCorrect = await user.isPasswordMatch(oldPassword);
  if (!isPasswordCorrect) throw new ApiError(401, "Password is not correct");
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User Fetched"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, userName, email } = req.body;
  if (!fullName || !userName || !email)
    throw new ApiError(400, "All fields are required");
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
        userName,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserProfileImage = asyncHandler(async (req, res) => {
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

const updateUserCoverImage = asyncHandler(async (req, res) => {
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

const deleteProfilePicture = asyncHandler(async (req, res) => {
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

const deleteCoverPicture = asyncHandler(async (req, res) => {
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

const getUserChannel = asyncHandler(async (req, res) => {
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

const getWatchHistory = asyncHandler(async (req, res) => {
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
    console.log("no");
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "No watch history found"));
  }

  console.log(user);
  return res.status(200).json(new ApiResponse(200, {}, "Success"));
});

export {
  registerUser,
  loginUser,
  logOut,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserProfileImage,
  updateUserCoverImage,
  deleteProfilePicture,
  deleteCoverPicture,
  getUserChannel,
  getWatchHistory,
};
