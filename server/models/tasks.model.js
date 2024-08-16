import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    classroom: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Task = mongoose.model("Task", taskSchema);