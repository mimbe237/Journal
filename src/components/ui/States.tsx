type LoadingStateProps = { message?: string };
type ErrorStateProps = { message: string; onRetry?: () => void };
type EmptyStateProps = { 
  title: string; 
  message?: string; 
  action?: React.ReactNode;
};

export function LoadingState({ message = "Chargement en cours..." }: LoadingStateProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
      <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
      <p>{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="mt-2 text-red-600 hover:text-red-800 underline text-xs"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {message && <p className="text-gray-500 mb-4">{message}</p>}
      {action}
    </div>
  );
}
