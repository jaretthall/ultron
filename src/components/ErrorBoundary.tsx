import { Component, ErrorInfo, ReactNode } from 'react';
// Phase 6: Enhanced error boundary with monitoring
import { captureException, ErrorCategory, ErrorSeverity } from '../services/monitoringService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
    
    // Phase 6: Enhanced error tracking with monitoring service
    const errorId = `ui_error_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    captureException(error, {
      category: ErrorCategory.UI,
      severity: ErrorSeverity.HIGH,
      additionalData: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        errorId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    });
    
    this.setState({ errorInfo, errorId });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-slate-100 p-8 overflow-y-auto">
          <svg className="w-16 h-16 text-red-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <h1 className="text-3xl font-bold text-red-500 mb-3">
            Application Error
          </h1>
          <p className="text-xl text-slate-300 mb-2 text-center">
            Sorry, an unexpected error occurred in this part of the application.
          </p>
          <p className="text-slate-400 text-sm mb-2 text-center max-w-md">
            You can try refreshing the page. If the problem continues, this information may be helpful for support or debugging.
          </p>
          {this.state.errorId && (
            <p className="text-xs text-slate-500 mb-4 text-center">
              Error ID: <code className="bg-slate-800 px-2 py-1 rounded">{this.state.errorId}</code>
            </p>
          )}
          
          {this.state.error && (
            <details className="bg-slate-800 p-4 rounded-md text-xs text-slate-400 max-w-xl w-full mt-4">
              <summary className="cursor-pointer font-medium text-slate-200 text-sm hover:text-sky-400">
                Error Details (for developers)
              </summary>
              <div className="mt-3 space-y-2">
                <div>
                    <strong className="text-slate-300">Message:</strong>
                    <pre className="mt-1 whitespace-pre-wrap bg-slate-900 p-2 rounded text-red-300">{this.state.error.message}</pre>
                </div>
                {this.state.error.stack && (
                    <div>
                        <strong className="text-slate-300">Stack Trace:</strong>
                        <pre className="mt-1 whitespace-pre-wrap bg-slate-900 p-2 rounded max-h-48 overflow-y-auto">{this.state.error.stack}</pre>
                    </div>
                )}
                {this.state.errorInfo && this.state.errorInfo.componentStack && (
                     <div>
                        <strong className="text-slate-300">Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap bg-slate-900 p-2 rounded max-h-48 overflow-y-auto">{this.state.errorInfo.componentStack}</pre>
                    </div>
                )}
              </div>
            </details>
          )}

          <button
            onClick={() => window.location.reload()}
            className="mt-8 bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 px-6 rounded-lg text-sm"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 