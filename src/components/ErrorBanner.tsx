import type { AppError } from "@/types/iss";

/** Maps internal error codes to plain-language, non-technical messages. */
function friendlyMessage(error: AppError): string {
  switch (error.code) {
    case "GEOLOCATION_DENIED":
      return "Location access was declined. Set your observing location manually in Settings.";
    case "GEOLOCATION_UNSUPPORTED":
      return "This browser can't detect your location automatically. Set it manually in Settings.";
    case "TLE_FETCH_FAILED":
      return "Couldn't fetch the ISS orbital data. Please try again in a moment.";
    case "TLE_STALE":
      return "Showing slightly older orbital data — predictions may be a little less precise.";
    case "OFFLINE":
      return "You're offline. Showing the last available data.";
    case "NOTIFICATION_DENIED":
      return "Notifications are turned off, so ISSCOPE can't alert you before a pass.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export default function ErrorBanner({ error, onRetry }: { error: AppError; onRetry?: () => void }) {
  return (
    <div className="glass-panel px-4 py-3 flex items-center justify-between gap-3 border-amber-300/20">
      <p className="text-sm text-amber-200/90">{friendlyMessage(error)}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs shrink-0 px-3 py-1.5 rounded-full glass-chip text-cyan hover:bg-white/10 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
