import { Course } from "../models/course.model.js";
import ApiError from "../utils/apiError.js"
import cloudinary from "cloudinary"
import fs from "fs/promises"

async function getAllCourses(req, res, next) {
    try {
        const courses = await Course.find({}).select('-lectures');

        return res.status(200).json({
            success: true,
            message: "All courses",
            courses
        })
    } catch (error) {
        return next(new ApiError(500, error.message))
    }
}

async function getLecturesByCourseId(req, res, next) {
    try {
        const { courseId } = req.params;
        const course = await Course.findById(courseId);

        if (!course) {
            return next(new ApiError(404, "Course not found"));
        }

        return res.status(200).json({
            success: true,
            message: "Course Lectures fetched Successfully",
            lectures: course.lectures,
            course: course
        })
    } catch (error) {
        return next(new ApiError(500, error.message))
    }
}

async function createCourse(req, res, next) {
    try {
        const { title, description, category, createdBy } = req.body;

        if (!title || !description || !category || !createdBy) {
            return next(new ApiError(400, "All fields are required"));
        }

        const course = await Course.create({
            title,
            description,
            category,
            createdBy,
            thumbnail: {
                public_id: "DUMMY",
                secure_url: "DUMMY",
            }
        })

        if (req.file) {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms/thumbnails'
            })

            if (result) {
                course.thumbnail.public_id = result.public_id;
                course.thumbnail.secure_url = result.secure_url;
            }

            fs.rm(`./public/${req.file.filename}`);
        }

        await course.save();

        return res.status(201).json({
            success: true,
            message: "Course created successfully",
            course
        })

    } catch (error) {
        return next(new ApiError(500, error.message))
    }
}

async function updateCourse(req, res, next) {
    try {
        const { courseId } = req.params;
        const { title, description, category, createdBy } = req.body;

        if (!title || !description || !category || !createdBy) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        console.log("Update Course", title, description, category, createdBy)

        const course = await Course.findByIdAndUpdate(
            courseId,
            {
                $set: {
                    title,
                    description,
                    category,
                    createdBy,
                }
            },
            { new: true, runValidators: true }
        )

        if (!course) {
            return next(new ApiError(404, "Course not found"));
        }

        return res.status(200).json({
            success: true,
            message: "Course updated successfully",
            course: course
        })
    } catch (error) {
        return next(new ApiError(500, error.message))
    }
}

async function deleteCourse(req, res, next) {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId);

        if (!course) {
            return next(new ApiError(404, "Course not found"));
        }

        await Course.findByIdAndDelete(courseId);

        return res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        })
    } catch (error) {
        return next(new ApiError(500, error.message))
    }
}

async function addLectureToCourseById(req, res, next) {
    try {
        const { title, description } = req.body;
        const { courseId } = req.params;

        if (!title || !description) {
            return next(new ApiError(400, "All fields are required"));
        }

        const course = await Course.findById(courseId);

        if (!course) {
            return next(new ApiError(404, "Course not found"));
        }

        const lectureData = {
            title,
            description,
            lecture: {}
        }

        if (req.file) {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms/lectures',
                chunk_size: 50000000,
                resource_type: 'video'
            })

            if (result) {
                lectureData.lecture.public_id = result.public_id;
                lectureData.lecture.secure_url = result.secure_url;
            }

            fs.rm(`./public/${req.file.filename}`);
        }

        course.lectures.push(lectureData);
        course.numberOfLectures = course.lectures.length;
        await course.save();

        return res.status(200).json({
            success: true,
            message: "Lecture added successfully",
            course
        })

    } catch (error) {
        return next(new ApiError(500, error.message));
    }
}

async function removeLectureFromCourse(req, res, next) {
    try {
        const { courseId, lectureId } = req.query;

        console.log(courseId, lectureId)

        if (!courseId) {
            return next(new ApiError(400, "Course Id is required"));
        }

        if (!lectureId) {
            return next(new ApiError(400, "Lecture Id is required"));
        }

        const course = await Course.findById(courseId);

        console.log("COURSE: ", course.lectures)

        if (!course) {
            return next(new ApiError(404, "Course not found"));
        }

        const courseLecture = course.lectures.findIndex(
            (lecture) => lecture._id.toString() === lectureId
        )

        if (courseLecture == -1) {
            return next(new ApiError(404, "Lecture not found"));
        }

        // delete the video from cloudinary
        await cloudinary.v2.uploader.destroy(
            course.lectures[courseLecture].lecture?.public_id,
            {
                resource_type: 'video'
            }
        )

        course.lectures.splice(courseLecture, 1);
        course.numberOfLectures = course.lectures.length;

        await course.save()

        return res.status(200).json({
            success: true,
            message: "Lecture removed successfully",
            course
        })
    } catch (error) {
        return next(new ApiError(500, error.message));
    }
}

export {
    getAllCourses,
    getLecturesByCourseId,
    createCourse,
    updateCourse,
    deleteCourse,
    addLectureToCourseById,
    removeLectureFromCourse
}