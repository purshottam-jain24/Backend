import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { generateAccessTokenandRefreshToken } from "./generateAccessTokenandRefreshToken.js";
import { User } from "../../models/user.model.js";
import jwt from "jsonwebtoken";

export const refreshAccessToken = asyncHandler(async (req, res) => {
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
