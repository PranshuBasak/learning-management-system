import ApiError from "../utils/apiError.js";
import sendEmail from "../utils/sendEmail.js"

async function contactUs(req, res, next) {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return next(new ApiError(400, "All Fields are required"))
    }

    try {
        const subject = "Contact Us Form";
        const messageToSent = `${name} - ${email} <br />${message}`;

        await sendEmail(process.env.CONTACT_US_EMAIL, subject, messageToSent)

        return res.status(200).json({
            success: true,
            message: "Query Submitted Successfully"
        })
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, error.message))
    }
}

export {
    contactUs
}