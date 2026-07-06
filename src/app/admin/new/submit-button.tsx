"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  idle = "Create chatbot",
  pendingLabel = "Creating… processing documents",
}: {
  idle?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary">
      {pending ? pendingLabel : idle}
    </button>
  );
}
