// client/src/components/common/ErrorBoundary.jsx
import React, { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Catch errors in any components below and re-render with error message
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // You can also log the error to an error reporting service
    console.error("Error caught by boundary:", error, errorInfo);

    // In a real app, you would send this to your error tracking service
    // Example: Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-700 mb-4">
              The application encountered an unexpected error. Please try
              refreshing the page or contact support if the issue persists.
            </p>
            {process.env.NODE_ENV === "development" && (
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Error Details:
                </h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
            <div className="mt-6 flex space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Otherwise, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
