export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}

export class BackendError extends Error {
    constructor(message, { status = null, detail = null, payload = null } = {}) {
        super(message);
        this.name = "BackendError";
        this.status = status;
        this.detail = detail;
        this.payload = payload;
    }
}

export class APIHandlerError extends Error {
    constructor(message) {
        super(message);
        this.name = "APIHandlerError";
    }
}