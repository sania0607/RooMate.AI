import { X, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ErrorBannerProps {
  error: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  retryLabel?: string;
}

export default function ErrorBanner({ 
  error, 
  onDismiss, 
  onRetry, 
  retryLabel = "Try Again" 
}: ErrorBannerProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (onRetry) {
      setIsRetrying(true);
      try {
        await onRetry();
      } finally {
        setIsRetrying(false);
      }
    }
  };

  const isAuthError = error.includes('auth') || error.includes('Authentication');

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90vw] max-w-md">
      <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-red-800 mb-1">
                {isAuthError ? "Authentication Error" : "Error"}
              </h3>
              <p className="text-sm text-red-700 leading-relaxed">
                {isAuthError 
                  ? "There was an issue with authentication. Please try signing in again or contact support if the issue persists."
                  : error
                }
              </p>
              {(onRetry || onDismiss) && (
                <div className="flex items-center space-x-2 mt-3">
                  {onRetry && (
                    <Button
                      onClick={handleRetry}
                      disabled={isRetrying}
                      size="sm"
                      className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white text-xs"
                    >
                      {isRetrying ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        retryLabel
                      )}
                    </Button>
                  )}
                  {onDismiss && (
                    <Button
                      onClick={onDismiss}
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 border-red-300 text-red-700 hover:bg-red-50 text-xs"
                    >
                      Dismiss
                    </Button>
                  )}
                </div>
              )}
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 p-1 rounded-full hover:bg-red-100 transition-colors"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}