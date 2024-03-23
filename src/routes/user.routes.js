import express from 'express'
import { changePassword, forgotPassword, getProfile, login, logout, register, resetPassword, updateProfile } from '../controllers/user.controller.js'
import { isLoggedIn } from '../middleware/auth.middleware.js'
import upload from '../middleware/multer.middleware.js'
const authRouter = express.Router()

authRouter.post('/register', upload.single('avatar'), register);
authRouter.post('/login',upload.none() ,login);
authRouter.get('/logout', logout);
authRouter.get('/me',isLoggedIn, getProfile);
authRouter.post('/reset', forgotPassword);
authRouter.post('/reset/:resetToken', resetPassword);
authRouter.post('/change-password', isLoggedIn, changePassword);
authRouter.put('/update', isLoggedIn, upload.single('avatar'), updateProfile);

export default authRouter;