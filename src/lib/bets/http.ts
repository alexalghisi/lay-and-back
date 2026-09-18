import { NotFoundError, ValidationError } from "./errors";

export function ok(data: unknown, status = 200): Response {
    return Response.json(data, { status });
}

export function fail(error: unknown): Response {
    if (error instanceof ValidationError || error instanceof SyntaxError) {
        return Response.json({ error: error.message || "Invalid request" }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
        return Response.json({ error: error.message }, { status: 404 });
    }
    return Response.json({ error: "Internal error" }, { status: 500 });
}
