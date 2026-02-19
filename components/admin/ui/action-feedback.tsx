import { AlertCircle, CheckCircle2 } from "lucide-react";

type ActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
} | null;

interface ActionFeedbackProps {
  state: ActionState;
  successFallback?: string;
  errorFallback?: string;
}

export function ActionFeedback({
  state,
  successFallback = "Action completed successfully.",
  errorFallback = "Something went wrong. Please try again.",
}: ActionFeedbackProps) {
  if (!state) return null;

  if (state.ok) {
    return (
      <p
        className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400"
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 size={14} />
        {state.message || successFallback}
      </p>
    );
  }

  if (state.error || state.ok === false) {
    return (
      <p
        className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400"
        role="alert"
        aria-live="assertive"
      >
        <AlertCircle size={14} />
        {state.error || errorFallback}
      </p>
    );
  }

  return null;
}
