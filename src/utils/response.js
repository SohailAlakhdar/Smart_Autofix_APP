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
    return res.status(error.cause || 400).json({
        error,
        message: error.message,
        stack: error.stack,
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
