import ApiError from "../utils/apiError.js";
import JWT from 'jsonwebtoken';

const isLoggedIn = (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return next(new ApiError(401, "Unauthenticated!! Please Login"))
    }

    const tokenDetails = JWT.verify(token, process.env.JWT_SECRET);

    if (!tokenDetails) {
        return next(new ApiError(401, "Unauthenticated!! Please Login"))
    }

    req.user = tokenDetails;
    next();
}

const authorizedRoles = (...roles) => (req, res, next) => {
    const currentRole = req.user.role;

    if (!roles.includes(currentRole)) {
        return next(new ApiError(403, "Unauthorized!! You do not have permission to access this route"))
    }

    next();
}

const authorizedSubscribers = (req, res, next) => {
    const subscriptionStatus = req.user.subscription.status;
    const currentRole = req.user.role;

    if (currentRole !== "ADMIN" && subscriptionStatus !== "active") {
        return next(new ApiError(403, "Unauthorized!! You do not have permission to access this route"))
    }

    next();
}

export {
    isLoggedIn,
    authorizedRoles,
    authorizedSubscribers
};