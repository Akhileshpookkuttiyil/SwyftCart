import { NextResponse } from "next/server";

export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const createSuccessResponse = (payload, status = 200) =>
  NextResponse.json(payload, { status });

export const createErrorResponse = (
  error,
  fallbackMessage = "Internal server error",
  context = "API error"
) => {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  console.error(`${context}:`, error);

  return NextResponse.json(
    {
      success: false,
      message: fallbackMessage,
    },
    { status: 500 }
  );
};

export const withController = (handler, options = {}) => {
  const {
    fallbackMessage = "Internal server error",
    context = "API error",
  } = options;

  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponse(error, fallbackMessage, context);
    }
  };
};
