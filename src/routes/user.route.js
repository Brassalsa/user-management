import { Router } from "express";
import {
  loginUser,
  registerUser,
  updateAccountDetails,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

// register
userRouter.post(
  "/register",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  registerUser
);

// login
userRouter.post("/login", loginUser);

// update
userRouter.put(
  "/account",
  verifyJWT,
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  updateAccountDetails
);

export default userRouter;
