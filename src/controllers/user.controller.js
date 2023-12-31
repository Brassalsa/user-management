import fs from "fs";

import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isEmailFormatCorrect } from "../utils/validation.js";

// generate access token
const generateAccessTokens = async (userId) => {
  try {
    // get a user
    const user = await User.findById(userId).select("-password");
    // generate token
    const token = user.generateAccessToken();

    return {
      user,
      token,
    };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access token"
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
    if (!avatarUrl) return;
    try {
      fs.unlinkSync(avatarUrl);
    } catch (err) {
      console.log("Failed to delete previous profile image ", err);
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
    throw new ApiError(400, "Email or Phone number is required");
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

// login
const loginUser = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;

  // check for email or phone
  if (!email && !phone) {
    throw new ApiError(400, "Email or Phone number is required");
  }

  // check for password
  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  // get user details
  const user = await User.findOne({
    $or: [{ email }, { phone }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // check password
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Wrong credentials");
  }

  // generate access token
  const { user: loggedUser, token } = await generateAccessTokens(user._id);

  res.status(200).json(
    new ApiResponse(200, {
      user: loggedUser,
      token,
    })
  );
});

// update account details
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { name, email, phone, avatar } = req.body;
  // profile img path
  const avatarUrl = req.files?.avatar?.[0].path;
  const user = await User.findById(_id);
  const prevAvatar = user.avatar;
  let updateParams = {};

  // check for non-empty fields
  if (name && name.trim()) {
    updateParams = { ...updateParams, name };
  }
  if (email && email.trim()) {
    updateParams = { ...updateParams, email };
  }
  if (phone && phone.trim()) {
    updateParams = { ...updateParams, phone };
  }
  if (avatarUrl) {
    updateParams = { ...updateParams, avatar: avatarUrl };
  }

  // check if email already exists
  if (user.email && email) {
    throw new ApiError(400, "Email cannot be changed");
  }

  // check if phone number exists
  if (user.phone && phone) {
    throw new ApiError(400, "Phone number cannot be changed");
  }

  // update the user
  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      $set: updateParams,
    },
    { new: true }
  ).select("-password");

  // delete previous profile image
  if (prevAvatar) {
    try {
      fs.unlinkSync(prevAvatar);
    } catch (err) {
      console.log("Failed to delete previous profile image ", err);
    }
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: updatedUser },
        "Account updated successfully"
      )
    );
});

// exports
export { generateAccessTokens, registerUser, loginUser, updateAccountDetails };
