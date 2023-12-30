import fs from "fs";

import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isEmailFormatCorrect } from "../utils/validation.js";

// generate access token
const generateAccessTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();

    return accessToken;
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

// register a user
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // profile img path
  const avatarUrl = req.files?.avatar?.[0].path;

  // delete file if error occured
  req.errCb = () => {
    if (avatarUrl) {
      fs.unlinkSync(avatarUrl);
    }
  };

  // validate required fields
  if ([name, password].some((i) => !i || i.trim() == "")) {
    throw new ApiError(400, "Name and Password is required.");
  }

  // validate email if exist
  if (email && !isEmailFormatCorrect(email)) {
    throw new ApiError(400, "Email format is not correct.");
  }

  // check at least email or phone no. exist
  if (!email && !phone) {
    throw new ApiError(400, "Please provide at least email or phone number.");
  }

  // check if user exists wtih same phone or email
  const existedUser = await User.findOne({
    $or: [{ email }, { phone }],
  });

  if (existedUser) {
    throw new ApiError(
      409,
      "User already with same email or phone number already exists."
    );
  }
  const createdUser = await User.create({
    name,
    email,
    phone,
    password,
    avatar: avatarUrl || "",
  });

  const user = await User.findById(createdUser._id).select("-password");

  if (!createdUser || !user) {
    throw new ApiError(500, "Something went wrong while creating the user.");
  }

  res
    .status(201)
    .json(new ApiResponse(200, user, "User registered Successfully"));
});

export { generateAccessTokens, registerUser };
