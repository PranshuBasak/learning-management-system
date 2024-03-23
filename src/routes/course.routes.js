import express from "express";
import { addLectureToCourseById, createCourse, deleteCourse, getAllCourses, getLecturesByCourseId, removeLectureFromCourse, updateCourse } from "../controllers/course.controller.js";
import { authorizedRoles, authorizedSubscribers, isLoggedIn } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js"
const courseRouter = express.Router();

courseRouter
    .route("/")
    .get(getAllCourses)
    .post(
        isLoggedIn,
        authorizedRoles('ADMIN'),
        upload.single('thumbnail'),
        createCourse
    )
    .delete(
        isLoggedIn,
        authorizedRoles('ADMIN'),
        removeLectureFromCourse
    );

courseRouter
    .route("/:courseId")
    .get(
        isLoggedIn,
        authorizedSubscribers,
        getLecturesByCourseId
    )
    .put(
        isLoggedIn,
        authorizedRoles('ADMIN'),
        updateCourse
    )
    .delete(
        isLoggedIn,
        authorizedRoles('ADMIN'),
        deleteCourse
    )
    .post(
        isLoggedIn,
        authorizedRoles('ADMIN'),
        upload.single('lecture'),
        addLectureToCourseById
    );
export default courseRouter;