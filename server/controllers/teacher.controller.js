import { asyncFunctionHandler } from "../utils/asyncFunctionHandler.js";
import { apiErrorHandler } from "../utils/apiErrorHandler.js";
import { apiResponseHandler } from "../utils/apiResponseHandler.js";
import { User } from "../models/user.model.js";
import { Classroom } from "../models/classroom.model.js";
import { Task } from "../models/tasks.model.js";
import { object } from "yup";

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

const createClassroom = asyncFunctionHandler(async (req, res) => {
  const { name } = req.body;
  const teacherID = req.params.teacherID;

  if (!name || !teacherID) {
    throw new apiErrorHandler(400, "All fields are required");
  }
  const teacher = await User.findById(teacherID);
  if (!teacher) {
    throw new apiErrorHandler(404, "Teacher not found");
  }
  if (teacher.role !== "teacher") {
    throw new apiErrorHandler(400, "User is not a teacher");
  }
  const classroom = await Classroom.create({
    name,
    teacher: teacherID,
  });

  teacher.classrooms.push(classroom._id);
  await teacher.save();

  const createdClassroom = await Classroom.findById(classroom._id).select(
    "-__v -createdAt -updatedAt -teacher -students -tasks"
  );

  return res
    .status(200)
    .json(
      new apiResponseHandler(
        200,
        createdClassroom,
        "Classroom created successfully"
      )
    );
});

const addStudents = asyncFunctionHandler(async (req, res) => {
  const { studentID, teacherID } = req.body;
  const classroomID = req.params.classroomID;

  const teacher = await User.findById(teacherID);
  if (!teacher) {
    throw new apiErrorHandler(404, "Teacher not found");
  }
  if (teacher.role !== "teacher") {
    throw new apiErrorHandler(400, "User is not a teacher");
  }
  const classroom = await Classroom.findById(classroomID);
  if (!classroom) {
    throw new apiErrorHandler(404, "Classroom not found");
  }
  if (classroom.teacher.toString() !== teacherID) {
    throw new apiErrorHandler(
      401,
      "Teacher is not the owner of this classroom"
    );
  }
  const student = await User.findById(studentID);
  if (!student) {
    throw new apiErrorHandler(404, "Student not found");
  }
  if (student.role !== "student") {
    throw new apiErrorHandler(400, "User is not a student");
  }
  classroom.students.push(studentID);
  await classroom.save();
  student.classrooms.push(classroomID);
  await student.save();

  return res
    .status(200)
    .json(
      new apiResponseHandler(200, {}, "Student added to classroom successfully")
    );
});

const removeStudents = asyncFunctionHandler(async (req, res) => {
  const { teacherID } = req.body;
  const { classroomID, studentID } = req.params;

  const teacher = await User.findById(teacherID);
  if (!teacher) {
    throw new apiErrorHandler(404, "Teacher not found");
  }
  if (teacher.role !== "teacher") {
    throw new apiErrorHandler(400, "User is not a teacher");
  }
  const classroom = await Classroom.findById(classroomID);
  if (!classroom) {
    throw new apiErrorHandler(404, "Classroom not found");
  }
  if (classroom.teacher.toString() !== teacherID) {
    throw new apiErrorHandler(
      401,
      "Teacher is not the owner of this classroom"
    );
  }
  const student = await User.findById(studentID);
  if (!student) {
    throw new apiErrorHandler(404, "Student not found");
  }
  if (student.role !== "student") {
    throw new apiErrorHandler(400, "User is not a student");
  }
  classroom.students = classroom.students.filter(
    (student) => student.toString() !== studentID
  );
  await classroom.save();
  student.classrooms = student.classrooms.filter(
    (classroom) => classroom.toString() !== classroomID
  );
  await student.save();

  return res
    .status(200)
    .json(
      new apiResponseHandler(
        200,
        {},
        "Student removed from classroom successfully"
      )
    );
});

const assignTask = asyncFunctionHandler(async (req, res) => {
  const { teacherID, title, description, dueDate } = req.body;
  const { classroomID } = req.params;

  const teacher = await User.findById(teacherID);
  if (!teacher) {
    throw new apiErrorHandler(404, "Teacher not found");
  }
  if (teacher.role !== "teacher") {
    throw new apiErrorHandler(400, "User is not a teacher");
  }
  const classroom = await Classroom.findById(classroomID);
  if (!classroom) {
    throw new apiErrorHandler(404, "Classroom not found");
  }
  if (classroom.teacher.toString() !== teacherID) {
    throw new apiErrorHandler(
      401,
      "Teacher is not the owner of this classroom"
    );
  }

  const task = await Task.create({
    title,
    description,
    dueDate,
    classroom: classroomID,
    teacher: teacherID,
  });

  classroom.tasks.push(task._id);
  await classroom.save();
  for (let studentID of classroom.students) {
    const student = await User.findById(studentID);
    student.tasks.push(task._id);
    await student.save();
  }

  const fetchedTask = await Task.findById(task._id).select(
    "-__v -createdAt -updatedAt -classroom -teacher"
  );

  return res
    .status(200)
    .json(
      new apiResponseHandler(
        200,
        fetchedTask,
        "Task assigned to students successfully"
      )
    );
});

const getClassroom = asyncFunctionHandler(async (req, res) => {
  const { teacherID } = req.params;

  const teacher = await User.findById(teacherID);
  if (!teacher) {
    throw new apiErrorHandler(404, "Teacher not found");
  }
  if (teacher.role !== "teacher") {
    throw new apiErrorHandler(400, "User is not a teacher");
  }
  const classroom = await Classroom.find({ teacher: teacherID })
    .populate()
    .select("-__v -createdAt -updatedAt");
  if (!classroom) {
    throw new apiErrorHandler(404, "Classroom not found");
  }

  return res
    .status(200)
    .json(
      new apiResponseHandler(200, classroom, "Classroom fetched successfully")
    );
});

const updateClassroom = asyncFunctionHandler(async (req, res) => {
  const { classroomID } = req.params;
  const { name, teacherID } = req.body;
  const classroom = await Classroom.findById(classroomID);
  if (!classroom) {
    throw new apiErrorHandler(404, "Classroom not found");
  }
  if (classroom.teacher.toString() !== teacherID) {
    throw new apiErrorHandler(
      401,
      "Teacher is not the owner of this classroom"
    );
  }
  classroom.name = name;
  await classroom.save();
  const updatedClassroom = await Classroom.findById(classroomID).select(
    "-__v -createdAt -updatedAt"
  );

  return res
    .status(200)
    .json(
      new apiResponseHandler(
        200,
        updatedClassroom,
        "Classroom updated successfully"
      )
    );
});

const updateClassroomTask = asyncFunctionHandler(async (req, res) => {
  const { classroomID, taskID } = req.params;
  const { title, description, dueDate, teacherID } = req.body;
  const classroom = await Classroom.findById(classroomID);
  if (!classroom) {
    throw new apiErrorHandler(404, "Classroom not found");
  }
  if (classroom.teacher.toString() !== teacherID) {
    throw new apiErrorHandler(
      401,
      "Teacher is not the owner of this classroom"
    );
  }
  const task = await Task.findById(taskID);
  if (!task) {
    throw new apiErrorHandler(404, "Task not found");
  }

  if (title) task.title = title;
  if (description) task.description = description;
  if (dueDate) task.dueDate = dueDate;

  await task.save();
  const updatedTask = await Task.findById(taskID).select(
    "-__v -createdAt -updatedAt -classroom -teacher"
  );

  return res
    .status(200)
    .json(
      new apiResponseHandler(200, updatedTask, "Task updated successfully")
    );
});

const deleteClassroom = asyncFunctionHandler(async (req, res) => {
    const { classroomID } = req.params;
    const { teacherID } = req.body;
    const classroom = await Classroom.findById(classroomID)
    if (!classroom) {
        throw new apiErrorHandler(404, "Classroom not found")
    }
    if (classroom.teacher.toString() !== teacherID) {
        throw new apiErrorHandler(401, "Teacher is not the owner of this classroom")
    }
    await classroom.deleteOne()

    return res.status(200).json(new apiResponseHandler(200, {}, "Classroom deleted successfully"))
});

const viewStudentSubmissions = asyncFunctionHandler(async (req, res) => {
    const { classroomID, taskID } = req.params;
    const { teacherID } = req.body;

    const teacher = await User.findById(teacherID)
    if (!teacher) {
        throw new apiErrorHandler(404, "Teacher not found")
    }
    if (teacher.role !== "teacher") {
        throw new apiErrorHandler(400, "User is not a teacher")
    }
    const classroom = await Classroom.findById(classroomID)
    if (!classroom) {
        throw new apiErrorHandler(404, "Classroom not found")
    }
    if (classroom.teacher.toString() !== teacherID) {
        throw new apiErrorHandler(401, "Teacher is not the owner of this classroom")
    }
    const students = []
    for (let studentID of classroom.students) {
        const student = await User.findById(studentID).select("-__v -createdAt -updatedAt -password -refreshToken")
        if (student.completedTasks.includes(taskID)) {
            students.push([student, {status: "submitted"}])
        }
        else {
            students.push([student, {status: "pending"}])
        }
    }

    return res.status(200).json(new apiResponseHandler(200, students, "Student submissions fetched successfully"))
});

export {
  registerUser,
  loginUser,
  logoutUser,
  createClassroom,
  addStudents,
  removeStudents,
  assignTask,
  getClassroom,
  updateClassroom,
  updateClassroomTask,
  deleteClassroom,
  viewStudentSubmissions
};
