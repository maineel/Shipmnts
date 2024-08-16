import { asyncFunctionHandler } from "../utils/asyncFunctionHandler.js";
import { apiErrorHandler } from "../utils/apiErrorHandler.js";
import { apiResponseHandler } from "../utils/apiResponseHandler.js";
import { User } from "../models/user.model.js";
import { Classroom } from "../models/classroom.model.js";
import { Task } from "../models/tasks.model.js";

const generatAccessAndRefreshTokens = async (user) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save();
  return { accessToken };
};

const registerUser = asyncFunctionHandler(async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name || !role) {
    throw new apiErrorHandler(400, "All fields are required");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new apiErrorHandler(400, "User with this email already exists");
  }

  const user = await User.create({
    email,
    password,
    name,
    role,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apiErrorHandler(
      500,
      "Something went wrong while registering the user"
    );
  }

  return res
    .status(200)
    .json(
      new apiResponseHandler(200, createdUser, "User registered successfully")
    );
});

const loginUser = asyncFunctionHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new apiErrorHandler(400, "All fields are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new apiErrorHandler(404, "User with this email does not exist");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new apiErrorHandler(401, "Invalid credentials");
  }

  const { accessToken } = await generatAccessAndRefreshTokens(user);

  const fetchedUser = await User.findById(user._id).select(
    "-password -refreshToken -__v -createdAt -updatedAt"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(
      new apiResponseHandler(
        200,
        {
          user: fetchedUser,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncFunctionHandler(async (req, res) => {
  const { user } = req.body;
  if (!user) {
    throw new apiErrorHandler(401, "User not found");
  }

  const fetchedUser = await User.findById(user._id);

  fetchedUser.refreshToken = "";
  await fetchedUser.save();
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .json(new apiResponseHandler(200, {}, "User logged out successfully!!"));
});

const getClassrooms = asyncFunctionHandler(async (req, res) => {
  const { studentID } = req.params;
  const student = await User.findById(studentID).populate({
    path: "classrooms",
    select: "-__v -createdAt -updatedAt -teacher -students -tasks",
  });
  if (!student) {
    throw new apiErrorHandler(404, "Student not found");
  }

  return res
    .status(200)
    .json(
      new apiResponseHandler(
        200,
        student.classrooms,
        "Classrooms fetched successfully"
      )
    );
});

const viewTasks = asyncFunctionHandler(async (req, res) => {
  const { studentID, classroomID } = req.params;
  const student = await User.findById(studentID);
  if (!student) {
    throw new apiErrorHandler(404, "Student not found");
  }
  const tasks = [];
  for (let i = 0; i < student.classrooms.length; i++) {
    if (student.classrooms[i]._id == classroomID) {
      const classroom = await Classroom.findById(classroomID).populate({
        path: "tasks",
        select: "-__v -createdAt -updatedAt -classroom -teacher",
      });
      tasks.push(classroom.tasks);
    }
  }

  return res
    .status(200)
    .json(new apiResponseHandler(200, tasks, "Tasks fetched successfully"));
});

const submitTask = asyncFunctionHandler(async (req, res) => {
  const { studentID, classroomID, taskID } = req.params;
  const file = req.file.path;
  const student = await User.findById(studentID);
  if (!student) {
    throw new apiErrorHandler(404, "Student not found");
  }
  const classroom = await Classroom.findById(classroomID);
  if (!classroom) {
    throw new apiErrorHandler(404, "Classroom not found");
  }
  if (!classroom.students.includes(studentID)) {
    throw new apiErrorHandler(403, "Student is not part of this classroom");
  }
  if (!classroom.tasks.includes(taskID)) {
    throw new apiErrorHandler(403, "Task is not part of this classroom");
  }

  const task = await Task.findById(taskID);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  const dueDate = new Date(task.dueDate.replace(/_/g, "-"));
  if (new Date() > dueDate) {
    return res.status(400).json({ message: "Due date has passed" });
  }

  task.submissions.push({
    studentID,
    file,
    submittedAt: new Date().toISOString().split("T")[0].replace(/-/g, "_"),
  });
  await task.save();

  student.tasks = student.tasks.filter((t) => t != taskID);
  student.completedTasks.push(taskID);
  await student.save();
  return res.status(200).json({ message: "Task submitted successfully" });
});

const viewSubmission = asyncFunctionHandler(async (req, res) => {
  const { classroomID, taskID } = req.params;
  const { studentID } = req.body;

  const classroom = await Classroom.findById(classroomID);
  if (!classroom) {
    throw new apiErrorHandler(404, "Classroom not found");
  }
  const task = await Task.findById(taskID);
  if (!task) {
    throw new apiErrorHandler(404, "Task not found");
  }
  const submissions = [];
  const student = await User.findById(studentID);

  student.completedTasks.includes(taskID)
    ? submissions.push([student.name, student._id, { status: "submitted" }])
    : submissions.push([student.name, student._id, { status: "Pending" }]);

  return res
    .status(200)
    .json(
      new apiResponseHandler(
        200,
        submissions,
        "Submissions fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  getClassrooms,
  viewTasks,
  submitTask,
  viewSubmission,
};
