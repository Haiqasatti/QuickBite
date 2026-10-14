import { useId, type ReactNode } from "react";

export interface ControlProps {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: (props: ControlProps) => ReactNode;
}

/** Wires label, hint and error text to any control (input, select, textarea). */
export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : "", error ? errorId : ""].filter(Boolean).join(" ");

  const controlProps: ControlProps = { id };
  if (error) controlProps["aria-invalid"] = true;
  if (describedBy) controlProps["aria-describedby"] = describedBy;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children(controlProps)}
      {hint ? (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}