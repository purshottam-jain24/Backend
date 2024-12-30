import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { generateAccessTokenandRefreshToken } from "./generateAccessTokenandRefreshToken.js";
import { coverUpload, profileUpload } from "../../utils/cloudinary.js";
import { User } from "../../models/user.model.js";

export const registerUser = asyncHandler(async (req, res) => {
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
