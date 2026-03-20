import React, { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.log('ErrorBoundary - getDerivedStateFromError input error:', error); // DEBUG LOG
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error, errorInfo: null }; // errorInfo will be populated by componentDidCatch
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary - Uncaught error:", error, errorInfo); // DEBUG LOG
    this.setState({ errorInfo: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      console.log('ErrorBoundary - rendering with this.state.error:', this.state.error); // DEBUG LOG
      console.log('ErrorBoundary - rendering with this.state.errorInfo:', this.state.errorInfo); // DEBUG LOG
      // You can render any custom fallback UI
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>
            {this.state.error ? (
              (this.state.error instanceof Error) ? this.state.error.toString() : JSON.stringify(this.state.error, null, 2)
            ) : 'No error information available.'}
            <br />
            {this.state.errorInfo?.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
