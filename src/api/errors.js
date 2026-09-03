/** Normalised transport error so screens never branch on fetch internals. */
export class ApiError extends Error {
  constructor(message, { status = 0, code = "unknown", details = null, path } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.path = path;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isValidation() {
    return this.status === 422;
  }
}

export const notFound = (path) =>
  new ApiError("Resource not found", { status: 404, code: "not_found", path });

export const forbidden = (path) =>
  new ApiError("You do not have permission to do that", {
    status: 403,
    code: "forbidden",
    path,
  });
