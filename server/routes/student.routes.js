import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getClassrooms,
  viewTasks,
  submitTask,
} from "../controllers/student.controller.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); 
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`); 
  },
});

const upload = multer({ storage: storage });

const studentRouter = Router();

studentRouter.route("/register").post(registerUser);
studentRouter.route("/login").post(loginUser);
studentRouter.route("/logout").post(logoutUser);
studentRouter.route("/:studentID/classrooms").get(getClassrooms);
studentRouter.route("/:studentID/classrooms/:classroomID/tasks").get(viewTasks);
studentRouter.route("/:studentID/classrooms/:classroomID/tasks/:taskID").post(upload.single('file'),submitTask);

export { studentRouter };