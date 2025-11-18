"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error object:", error);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            An error occurred while loading this page.
          </p>
          {error.message && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs text-red-800 font-mono text-left">
                {error.message}
              </p>
            </div>
          )}
          {error.digest && (
            <p className="mt-2 text-xs text-gray-500">Error ID: {error.digest}</p>
          )}
        </div>
        <div>
          <button
            onClick={() => reset()}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
