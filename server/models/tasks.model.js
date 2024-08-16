import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    classroom: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
    },
    dueDate: {
      type: String,
      required: true,
    },
    submissions: [
      {
        studentID: {
          type: Schema.Types.ObjectId,
          ref: "Student",
        },
        submittedAt: {
          type: String,
          required: true,
        },
        file: {
          type: String,
          required: true,
        },
      }
    ]
  },
  { timestamps: true }
);

export const Task = mongoose.model("Task", taskSchema);