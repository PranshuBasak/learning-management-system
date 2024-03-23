import dotenv from 'dotenv'
dotenv.config()
import cookieParser from 'cookie-parser'
import express from 'express'
import cors from 'cors'
import connectToDB from './config/dbConnection.js'
import errorMiddleware from "./middleware/error.middleware.js"
import cloudinary from 'cloudinary'
import morgan from 'morgan'
import Razorpay from 'razorpay';
const app = express()

// mongodb connection
connectToDB();

// Cloudinary Config
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Razorpay config
export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET
})

app.use(express.json())
app.use(cors({
    origin: true,
    credentials: true
}))
app.use(cookieParser())
app.use(morgan("dev"))
app.use((req, res, next) => {
    console.log('Headers:', req.headers);
    console.log('Raw Body:', req.body); 
    next();
})

// Routes Import
import authRouter from './routes/user.routes.js'
import courseRouter from './routes/course.routes.js'
import paymentRouter from './routes/payment.routes.js'
import miscRouter from './routes/miscellanous.routes.js'

// Routes Decleration
app.use('/api/v1/user', authRouter);
app.use('/api/v1/courses', courseRouter);
app.use('/api/v1/payments', paymentRouter);
app.use('/api/v1', miscRouter)


app.use(errorMiddleware);

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to Coursify API'
    })
})

app.all('*', (req, res) => {
    res.status(404).send('OOPS!! 404 Page not found')
})

// Server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})