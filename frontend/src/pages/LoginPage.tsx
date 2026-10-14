import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { AuthShell } from "../components/AuthShell";
import { Field } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ApiError, getErrorMessage } from "../lib/api";
import { getRedirectPath } from "../lib/guards";
import { hasErrors, mapFieldErrors, validateLogin, type FormErrors } from "../lib/validation";

export default function LoginPage() {
  const { user, login } = useAuth();
  const { notify } = useToast();
  const location = useLocation();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={getRedirectPath(location.state)} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const found = validateLogin(values);
    setErrors(found);
    if (hasErrors(found)) {
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      await login({ email: values.email.trim(), password: values.password });
      notify("Welcome back.", "success");
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors.length > 0) setErrors(mapFieldErrors(error));
      setFormError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back. Sign in to check out and see your orders."
      footer={
        <>
          New to QuickBite?{" "}
          <Link to="/register" state={location.state}>
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="form">
        {formError ? (
          <div className="form-alert" role="alert">
            {formError}
          </div>
        ) : null}
        <Field label="Email" error={errors.email}>
          {(props) => (
            <input
              {...props}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={values.email}
              onChange={(event) => setValues((previous) => ({ ...previous, email: event.target.value }))}
            />
          )}
        </Field>
        <Field label="Password" error={errors.password}>
          {(props) => (
            <input
              {...props}
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={(event) => setValues((previous) => ({ ...previous, password: event.target.value }))}
            />
          )}
        </Field>
        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}