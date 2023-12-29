import { Router } from "express";

const userRouter = Router();

userRouter.get("/", (req, res) => {
  res.send("Hello from user");
});

export default userRouter;
