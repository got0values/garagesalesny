class AppError extends Error {
    constructor(message, status) {
        super();
        this.message = message;
        this.statusCode = status;
    }
}

module.exports = AppError;