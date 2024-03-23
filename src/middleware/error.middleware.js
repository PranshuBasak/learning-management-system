const errorMiddleware = (err, req, res, next) => {

    req.statusCode = req.statusCode || 500;

    return res.status(req.statusCode).json({
        success: false,
        message: err.message,
        stack: err.stack,

    })
}

export default errorMiddleware;