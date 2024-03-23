import { User } from "../models/user.model.js"
import ApiError from "../utils/apiError.js"
import cloudinary from 'cloudinary';
import fs from 'fs/promises';
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";

const cookieOptions = {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: false,
    secure: false,
}

async function register(req, res, next) {
    const { fullName, email, password } = req.body;
    try {
        if (!fullName || !email || !password) {
            
            return next(new ApiError(400, "All Fields are required"))
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return next(new ApiError(400, "Email already exists"))
        }

        const user = await User.create({
            fullName,
            email,
            password,
            avatar: {
                public_id: email,
                secure_url: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
            }
        });

        if (!user) {
            return next(new ApiError(400, "User registration failed, Please try again!"))
        }

        console.log("File Details: ", JSON.stringify(req.file))

        // Upload avatar image
        if (req.file) {
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: "lms/user",
                    width: 250,
                    height: 250,
                    crop: "fill",
                    gravity: "face"
                })

                if (result) {
                    user.avatar.public_id = result.public_id;
                    user.avatar.secure_url = result.secure_url;
                }

                fs.rm(`./public/${req.file.filename}`)
            } catch (error) {

                return next(new ApiError(400, error.message || "File not uploaded, Please try again!"))
            }
        }

        await user.save();

        // set jwt token in cookie
        const token = user.generateJWTToken();

        user.password = undefined;
        res.cookie("token", token, cookieOptions)

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user,
        })
    } catch (error) {
        
        return next(new ApiError(500, error.message))
    }
}

async function login(req, res, next) {
    const { email, password } = req.body;
    console.log(req.body)
    try {
        if (!email || !password) {
            return next(new ApiError(400, "All Fields are required"));
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return next(new ApiError(400, "User not found"));
        }

        if (!user || !(await user.comparePassword(password))) {
            return next(new ApiError(400, "Invalid credentials"));
        }

        const token = user.generateJWTToken();

        user.password = undefined;
        res.cookie("token", token, cookieOptions)

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: user,
        })
    } catch (error) {
        return next(new ApiError(500, error.message))
    }
}

function logout(req, res, next) {
    try {
        res.cookie("token", null, {
            maxAge: 0,
            httpOnly: true,
            secure: true
        })

        return res.status(200).json({
            success: true,
            message: "User logged out successfully"
        })
    } catch (error) {
        return next(new ApiError(500, error.message))
    }
}

async function getProfile(req, res, next) {
    const { id } = req.user;

    try {
        const user = await User.findById(id);

        return res.status(200).json({
            success: true,
            message: "User profile fetched successfully",
            data: user
        })
    } catch (error) {
        
        return next(new ApiError(500, error.message))
    }
}

async function forgotPassword(req, res, next) {
    const { email } = req.body;

    if (!email) {
        return next(new ApiError(400, "Email is required"))
    }

    const user = await User.findOne({ email });

    if (!user) {
        return next(new ApiError(400, "User not found"))
    }

    const resetToken = await user.generateResetToken();

    await user.save();

    const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const subject = "Password Reset Request";
    const message = `You can reset you password by clicking <a href="${resetPasswordUrl}" target="_blank">Reset Your Password</a>\n If the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl} \nIf you have requested this, kindly ignore it.`;

    console.log(resetPasswordUrl)

    try {
        // TODO: Create sendEmail method
        await sendEmail(email, subject, message)

        return res.status(200).json({
            success: true,
            message: `Reset password token has been sent to ${email} successfully!`
        })
    } catch (error) {
        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;
        await user.save();

        return next(new ApiError(500, error.message))
    }
}

async function resetPassword(req, res, next) {
    const { resetToken } = req.params;
    const { password } = req.body;

    const forgotPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry: { $gt: Date.now() }
    })

    if (!user) {
        return next(new ApiError(400, "reset token is invalid or expired, please try again later"))
    }

    user.password = password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save();

    return res.status(200).json({
        success: true,
        message: "Password reset successfully"
    })
}

async function changePassword(req, res, next) {
    const { oldPassword, newPassword } = req.body;
    const { id } = req.user;

    if (!oldPassword || !newPassword) {
        return next(new ApiError(400, "All fields are required"));
    }

    const user = await User.findById(id).select("+password");

    if (!user) {
        return next(new ApiError(400, "User not found"));
    }

    const isPasswordValid = await user.comparePassword(oldPassword);

    if (!isPasswordValid) {
        return next(new ApiError(400, "Invalid old password"));
    }

    user.password = newPassword;
    await user.save();

    user.password = undefined;

    return res.status(200).json({
        success: true,
        message: "Password changed successfully",
    })
}

async function updateProfile(req, res, next) {
    const { fullName } = req.body;
    const { id } = req.user;

    const user = await User.findById(id);

    if (!user) {
        return next(new ApiError(400, "User not found"));
    }

    if (fullName) {
        user.fullName = fullName;
    }

    if (req.file) {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);

        const result = await cloudinary.v2.uploader.upload(req.file.path, {
            folder: "lms",
            width: 250,
            height: 250,
            crop: "fill",
            gravity: "face"
        })

        if (result) {
            user.avatar.public_id = result.public_id;
            user.avatar.secure_url = result.secure_url;
        }

        fs.rm(`./public/${req.file.filename}`)
    }

    await user.save();

    return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
    })
}

export {
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile
}