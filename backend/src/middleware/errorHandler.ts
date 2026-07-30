import type { ErrorRequestHandler, Response } from 'express';

// AppError carries a stable API code and an intentional HTTP status.
export class AppError extends Error {
	statusCode: number;
	code: string;

	constructor(statusCode: number, code: string, message: string) {
		super(message);
		this.name = 'AppError';
		this.statusCode = statusCode;
		this.code = code;
		Error.captureStackTrace(this, this.constructor);
	}
}

type StandardError = {
	statusCode: number;
	code: string;
	message: string;
};

const fallbackError: StandardError = {
	statusCode: 500,
	code: 'INTERNAL_SERVER_ERROR',
	message: 'Internal server error',
};

// Convert Prisma, application, and unknown failures into the public error contract.
export const normalizeError = (
	error: unknown,
	fallback: Partial<StandardError> = {}
): StandardError => {
	if (error instanceof AppError) {
		return {
			statusCode: error.statusCode,
			code: error.code,
			message: error.message,
		};
	}

	if (error && typeof error === 'object') {
		const statusCode =
		
			'statusCode' in error && typeof (error as { statusCode?: unknown }).statusCode === 'number'
				? (error as { statusCode: number }).statusCode
				: undefined;
		const code =
			'code' in error && typeof (error as { code?: unknown }).code === 'string'
				? (error as { code: string }).code
				: undefined;
		const message =
			'message' in error && typeof (error as { message?: unknown }).message === 'string'
				? (error as { message: string }).message
				: undefined;

		if (statusCode || code || message) {
			return {
				statusCode: statusCode ?? fallback.statusCode ?? fallbackError.statusCode,
				code: code ?? fallback.code ?? fallbackError.code,
				message: message ?? fallback.message ?? fallbackError.message,
			};
		}
	}

	return {
		statusCode: fallback.statusCode ?? fallbackError.statusCode,
		code: fallback.code ?? fallbackError.code,
		message: fallback.message ?? fallbackError.message,
	};
};

// Route handlers use this helper when they need a contextual fallback message.
export const sendError = (
	res: Response,
	error: unknown,
	fallback: Partial<StandardError> = {}
) => {
	const normalized = normalizeError(error, fallback);

	return res.status(normalized.statusCode).json({
		error: {
			code: normalized.code,
			message: normalized.message,
		},
	});
};

// Final Express error boundary for errors forwarded through next().
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
	sendError(res, error);
};

