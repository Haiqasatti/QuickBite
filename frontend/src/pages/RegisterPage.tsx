import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { AuthShell } from "../components/AuthShell";
import { Field } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ApiError, getErrorMessage } from "../lib/api";
import { getRedirectPath } from "../lib/guards";
import { hasErrors, mapFieldErrors, validateRegister, type FormErrors } from "../lib/validation";

interface RegisterValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  address: string;
}

export default function RegisterPage() {
  const { user, register } = useAuth();
  const { notify } = useToast();
  const location = useLocation();
  const [values, setValues] = useState<RegisterValues>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={getRedirectPath(location.state)} replace />;

  const set = <K extends keyof RegisterValues>(key: K, value: RegisterValues[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const found = validateRegister(values);
    setErrors(found);
    if (hasErrors(found)) {
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      const address = values.address.trim();
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        ...(address ? { address } : {}),
      });
      notify("Your account is ready.", "success");
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors.length > 0) setErrors(mapFieldErrors(error));
      setFormError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="It takes a minute and lets you place and track orders."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" state={location.state}>
            Sign in
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
        <Field label="Full name" error={errors.name}>
          {(props) => (
            <input {...props} type="text" autoComplete="name" value={values.name} onChange={(e) => set("name", e.target.value)} />
          )}
        </Field>
        <Field label="Email" error={errors.email}>
          {(props) => (
            <input {...props} type="email" autoComplete="email" inputMode="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
          )}
        </Field>
        <Field label="Password" hint="8 to 72 characters." error={errors.password}>
          {(props) => (
            <input {...props} type="password" autoComplete="new-password" value={values.password} onChange={(e) => set("password", e.target.value)} />
          )}
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword}>
          {(props) => (
            <input {...props} type="password" autoComplete="new-password" value={values.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} />
          )}
        </Field>
        <Field label="Delivery address (optional)" hint="We'll pre-fill this at checkout." error={errors.address}>
          {(props) => (
            <input {...props} type="text" autoComplete="street-address" value={values.address} onChange={(e) => set("address", e.target.value)} />
          )}
        </Field>
        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}