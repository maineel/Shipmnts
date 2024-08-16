import mongoose, {Schema} from "mongoose";

const classroomSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    teacher: {
        type: Schema.Types.ObjectId,
        ref: "Teacher"
    },
    students: [
        {
            type: Schema.Types.ObjectId,
            ref: "Student"
        }
    ],
    tasks: [
        {
            type: Schema.Types.ObjectId,
            ref: "Task"
        }
    ]
}, {timestamps: true});

export const Classroom = mongoose.model("Classroom", classroomSchema);