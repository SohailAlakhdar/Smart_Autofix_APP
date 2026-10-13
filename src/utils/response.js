export const asyncHandler = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            // attach cause if needed
            error.statusCode = error.statusCode || 500;
            return next(error);
        }
    };
};
export const globalErrorHandling = async (error, req, res, next) => {
    const statusCode =
        typeof error.cause === "number"
            ? error.cause
            : typeof error.statusCode === "number"
            ? error.statusCode
            : typeof error.status === "number"
            ? error.status
            : 400;

    return res.status(statusCode).json({
        error: process.env.NODE_ENV === "production" ? undefined : error,
        message: error.message,
        stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    });
};
export const appError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true; // expected error, safe to show message to client
    return error;
};

export const successResponse = async ({
    res,
    data = {},
    message = "Done",
    status = 200,
} = {}) => {
    if (!res) {
        // console.log("Missing response in successResponse?");
        return;
    }
    return res.status(status).json({
        message,
        data,
    });
};
