import ApiError from "../utils/apiError.js"
import { razorpay } from '../server.js'
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";

async function getRazorpayApiKey(req, res, next) {
    try {
        return res.status(200).json({
            success: true,
            message: "Razorpay API Key generated successfully",
            key: process.env.RAZORPAY_KEY_ID,
        })
    } catch (error) {
        return next(new ApiError(500, error.message))
    }
}

async function buySubscription(req, res, next) {
    try {
        const { id } = req.user;

        const user = await User.findById(id);
        if (!user) {
            return next(new ApiError(404, "User not found"))
        }

        if (user.role === "ADMIN") {
            return next(new ApiError(403, "Admin cannot buy subscription"))
        }

        const subscription = await razorpay.subscriptions.create({
            plan_id: process.env.RAZORPAY_PLAN_ID,
            customer_notify: 1,
            total_count: 12,
        })

        user.subscription.id = subscription.id;
        user.subscription.status = "active";

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Subscription successfully",
            subscription_id: subscription.id,
        })

    } catch (error) {
        console.error('Error creating subscription:', error);
        return next(new ApiError(500, error.message))
    }
}

async function verifySubscription(req, res, next) {
    try {
        const { id } = req.user;

        const user = await User.findById(id);
        if (!user) {
            return next(new ApiError(404, "User not found"))
        }

        const {
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_signature
        } = req.body;

        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET)
            .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)

        if (generatedSignature !== razorpay_signature) {
            return next(new ApiError(400, "Payment not verified! Please try again"))
        }

        // record payment details in payment collection 
        await Payment.create({
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_signature
        })

        user.subscription.status = "active";
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Subscription successfully verified",
        })

    } catch (error) {
        return next(new ApiError(500, error.message))
    }
}

async function cancelSubscription(req, res, next) {
    try {
        const { id } = req.user;

        const user = await User.findById(id);
        if (!user) {
            return next(new ApiError(404, "User not found"))
        }

        if (user.role === "ADMIN") {
            return next(new ApiError(403, "Admin cannot cancel subscription"))
        }

        const subscriptionId = user.subscription.id;

        const subscription = await razorpay.subscriptions.cancel(subscriptionId);

        user.subscription.status = subscription.status;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Subscription cancelled successfully",
        })

    } catch (error) {
        return next(new ApiError(500, error.message))
    }
}

async function getAllPayments(req, res, next) {
    try {
        const { count } = req.query;

        const subscriptions = await razorpay.subscriptions.all({
            count: count || 10
        });

        return res.status(200).json({
            success: true,
            message: "All payments fetched successfully",
            payments: subscriptions
        })
    } catch (error) {
        return next(new ApiError(500, error.message))
    }
}

export {
    getRazorpayApiKey,
    buySubscription,
    verifySubscription,
    cancelSubscription,
    getAllPayments
}