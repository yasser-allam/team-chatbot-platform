"use client";

import { useFormStatus } from "react-dom";

// A submit button that asks for confirmation before allowing the form to
// submit. Used for destructive actions (delete bot, delete document).
export function ConfirmButton({
  message,
  idle,
  pendingLabel = "Working…",
  className = "btn btn-danger",
}: {
  message: string;
  idle: string;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={className}
    >
      {pending ? pendingLabel : idle}
    </button>
  );
}
