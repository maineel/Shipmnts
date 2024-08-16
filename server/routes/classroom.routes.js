import { Router } from "express";
import {
  addStudents,
  removeStudents,
  assignTask,
  updateClassroom,
  updateClassroomTask,
  deleteClassroom,
  viewStudentSubmissions
} from "../controllers/teacher.controller.js";
import { viewSubmission } from "../controllers/student.controller.js";

const classroomRouter = Router();

classroomRouter.route("/:classroomID/students").post(addStudents);
classroomRouter
  .route("/:classroomID/students/:studentID")
  .delete(removeStudents);
classroomRouter.route("/:classroomID/tasks").post(assignTask);
classroomRouter.route("/:classroomID").put(updateClassroom);
classroomRouter.route("/:classroomID/tasks/:taskID").put(updateClassroomTask);
classroomRouter.route("/:classroomID").delete(deleteClassroom);
classroomRouter.route("/:classroomID/tasks/:taskID/submissions").get(viewStudentSubmissions);
classroomRouter.route("/:classroomID/tasks/:taskID/submission").get(viewSubmission);

export { classroomRouter };
