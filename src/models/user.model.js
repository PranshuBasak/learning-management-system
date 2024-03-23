import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import JWT from 'jsonwebtoken'
const { Schema } = mongoose;
import crypto from "crypto"

const userSchema = new Schema({
    fullName: {
        type: String,
        required: [true, "Name is Required"],
        minLength: [3, "Name must be at least 3 characters long"],
        maxLength: [50, "Name must be less than 50 characters long"],
        trim: true,
        lowercase: true,
    },
    email: {
        type: String,
        required: [true, "Email is Required"],
        unique: [true, "Email should be unique"],
        lowercase: true,
        trim: true,
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Please enter a valid email address"]
    },
    password: {
        type: String,
        required: [true, "Password is Required"],
        minLength: [8, "Password must be atleast 8 char long"],
        select: false
    },
    role: {
        type: String,
        enum: ["ADMIN", "USER"],
        default: "USER"
    },
    avatar: {
        public_id: {
            type: String,
        },
        secure_url: {
            type: String,
        }
    },
    forgotPasswordToken: {
        type: String,
    },
    forgotPasswordExpiry: {
        type: Date,
    },
    subscription: {
        id: String,
        status: String,
    }
}, { timestamps: true, versionKey: false })

// Password hashing
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) next();

    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods = {
    generateJWTToken: function () {
        return JWT.sign(
            { id: this._id, role: this.role, email: this.email, subscription: this.subscription },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY }
        )
    },
    comparePassword: async function (password) {
        return await bcrypt.compare(password, this.password)
    },
    generateResetToken: function () {
        const resetToken = crypto.randomBytes(20).toString("hex");

        this.forgotPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        this.forgotPasswordExpiry = Date.now() + 10 * 60 * 1000 // 10 minutes

        return resetToken;
    }
}

export const User = mongoose.model("User", userSchema)