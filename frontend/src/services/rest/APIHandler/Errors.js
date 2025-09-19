export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}

export class BackendError extends Error {
    constructor(message) {
        super(message);
        this.name = "BackendError"
    }
}

export class APIHandlerError extends Error {
    constructor(message) {
        super(message);
        this.name = "APIHandlerError";
    }
}