import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({origin: process.env.CORS_ORIGIN, credentials: true}));
app.use(express.json({limit: "10mb"})); 
app.use(express.urlencoded({extended: true, limit: "10mb"})) 
app.use(express.static("public"));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send("Welcome to ClassConnect");
})

import { studentRouter } from './routes/student.routes.js';
app.use('/students', studentRouter);

import { teacherRouter } from './routes/teacher.routes.js';
app.use('/teachers', teacherRouter);

import { classroomRouter } from './routes/classroom.routes.js';
app.use('/classrooms', classroomRouter);

export { app };