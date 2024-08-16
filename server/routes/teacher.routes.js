import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  createClassroom,
  getClassroom
} from "../controllers/teacher.controller.js";

const teacherRouter = Router();

teacherRouter.route("/register").post(registerUser);
teacherRouter.route("/login").post(loginUser);
teacherRouter.route("/logout").post(logoutUser);
teacherRouter.route("/:teacherID/classrooms").post(createClassroom);    
teacherRouter.route("/:teacherID/classrooms").get(getClassroom);

export { teacherRouter };