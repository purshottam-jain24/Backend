import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { coverUpload, profileUpload } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

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

  return res
    .status(201)
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
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { profilePicture: profile.url },
    },
    { new: true }
  ).select("-password -refreshToken");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const userName = req.user?.userName;
  const coverPath = req.file?.path;
  if (!coverPath) throw new ApiError(400, "cover Picture is Important");
  const cover = await coverUpload(coverPath, userName);
  if (!cover.url) throw new ApiError(400, "Error Occured");
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { coverPicture: cover?.url },
    },
    { new: true }
  ).select("-password -refreshToken");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
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
};
