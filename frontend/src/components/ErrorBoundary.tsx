"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="max-w-4xl mx-auto p-8">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-red-800 mb-2">
                エラーが発生しました
              </h2>
              <p className="text-red-600 mb-4">
                {this.state.error?.message || "Unknown error"}
              </p>
              <pre className="bg-white p-4 rounded-lg text-xs overflow-auto max-h-48 text-gray-700">
                {this.state.error?.stack}
              </pre>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                再試行
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
