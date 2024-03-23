import mongoose from 'mongoose'
import { Schema } from 'mongoose'

const courseSchema = new Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        minLength: [8, "Title must be at least 8 characters"],
        maxLength: [60, "Title must be at most 60 characters"],
        trim: true,
    },
    description: {
        type: String,
        required: true,
        minLength: [8, "Description must be at least 8 characters"],
        maxLength: [200, "Description must be at most 200 characters"],
        trim: true,
    },
    category: {
        type: String,
        required: true,
    },
    thumbnail: {
        public_id: {
            type: String,
            required: true
        },
        secure_url: {
            type: String,
            required: true
        }
    },
    lectures: [{
        title: String,
        description: String,
        lecture: {
            public_id: {
                type: String,
            },
            secure_url: {
                type: String,
            }
        }
    }],
    numberOfLectures: {
        type: Number,
        default: 0,
    },
    createdBy: {
        type: String,
        required: true
    }
}, { timestamps: true, versionKey: false })

export const Course = mongoose.model('Course', courseSchema);