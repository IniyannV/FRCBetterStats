import { RefreshCcw } from 'lucide-react';

interface ErrorCardProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorCard({
  title = 'Something went sideways',
  message = 'The Blue Alliance did not return data for this view. Check your API key or try again.',
  onRetry,
}: ErrorCardProps) {
  return (
    <div className="panel rounded-lg p-6">
      <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{message}</p>
      {onRetry ? (
        <button className="btn mt-4" onClick={onRetry}>
          <RefreshCcw className="h-4 w-4" />
          Retry
        </button>
      ) : null}
    </div>
  );
}
