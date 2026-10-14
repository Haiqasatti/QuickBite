import { useState, type FormEvent } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Field } from "../components/Field";
import { FoodImage } from "../components/FoodImage";
import { Icon } from "../components/Icons";
import { ImagePicker } from "../components/ImagePicker";
import { Modal } from "../components/Modal";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { useToast } from "../context/ToastContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { ApiError, getErrorMessage } from "../lib/api";
import { catalogApi } from "../lib/endpoints";
import { hasErrors, isValidImageSource, mapFieldErrors, type FormErrors } from "../lib/validation";
import type { Category } from "../types";

async function loadCategories(): Promise<Category[]> {
  return (await catalogApi.allCategories()).categories;
}

interface CategoryFormValues {
  name: string;
  description: string;
  image: string;
  isActive: boolean;
}

function CategoryForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: Category | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [values, setValues] = useState<CategoryFormValues>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    image: initial?.image ?? "",
    isActive: initial?.isActive ?? true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const found: FormErrors = {};
    const name = values.name.trim();
    if (name.length < 2) found.name = "Name must be at least 2 characters.";
    else if (name.length > 80) found.name = "Name must be at most 80 characters.";
    if (values.description.trim().length > 500) found.description = "Description must be at most 500 characters.";
    if (values.image.trim() !== "" && !isValidImageSource(values.image.trim())) {
      found.image = "Enter an http(s) image URL or a local /images/ path.";
    }
    setErrors(found);
    if (hasErrors(found)) return;

    setFormError(null);
    setSubmitting(true);
    const image = values.image.trim();
    const payload = {
      name,
      description: values.description.trim(),
      isActive: values.isActive,
      ...(image ? { image } : {}),
    };

    try {
      if (initial) {
        await catalogApi.updateCategory(initial.id, payload);
        notify("Category updated.", "success");
      } else {
        await catalogApi.createCategory(payload);
        notify("Category created.", "success");
      }
      onSaved();
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors.length > 0) setErrors(mapFieldErrors(error));
      setFormError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate className="form">
      {formError ? (
        <div className="form-alert" role="alert">
          {formError}
        </div>
      ) : null}
      <Field label="Name" error={errors.name}>
        {(props) => <input {...props} type="text" value={values.name} maxLength={80} onChange={(e) => set("name", e.target.value)} />}
      </Field>
      <Field label="Description (optional)" error={errors.description}>
        {(props) => <textarea {...props} rows={3} value={values.description} onChange={(e) => set("description", e.target.value)} />}
      </Field>
      <ImagePicker label="Image URL" value={values.image} error={errors.image} onChange={(value) => set("image", value)} />
      <label className="check">
        <input type="checkbox" checked={values.isActive} onChange={(e) => set("isActive", e.target.checked)} />
        <span>Active (visible on the public menu)</span>
      </label>
      <div className="dialog-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : initial ? "Save changes" : "Create category"}
        </button>
      </div>
    </form>
  );
}

export default function AdminCategories() {
  const { state, reload } = useAsyncData(loadCategories);
  const { notify } = useToast();
  const [editing, setEditing] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await catalogApi.deleteCategory(toDelete.id);
      notify("Category deleted.", "success");
      reload();
    } catch (error) {
      notify(getErrorMessage(error), "error");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  return (
    <>
      <div className="toolbar">
        <h2>Categories</h2>
        <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
          <Icon name="plus" size={16} />
          Add category
        </button>
      </div>

      {state.status === "loading" ? <LoadingState label="Loading categories…" /> : null}
      {state.status === "error" ? <ErrorState message={state.message} onRetry={reload} /> : null}
      {state.status === "success" && state.data.length === 0 ? (
        <EmptyState title="No categories yet" description="Create a category before adding dishes." />
      ) : null}
      {state.status === "success" && state.data.length > 0 ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {state.data.map((category) => (
                <tr key={category.id}>
                  <td>
                    <div className="cell-item">
                      <div className="cart-thumb">
                        <FoodImage src={category.image} name={category.name} />
                      </div>
                      <div>
                        <strong>{category.name}</strong>
                        {category.description ? <p className="muted small">{category.description}</p> : null}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={category.isActive ? "pill pill-on" : "pill pill-off"}>
                      {category.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="cell-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(category)}>
                      <Icon name="edit" size={16} />
                      Edit<span className="visually-hidden"> {category.name}</span>
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm danger-text" onClick={() => setToDelete(category)}>
                      <Icon name="trash" size={16} />
                      Delete<span className="visually-hidden"> {category.name}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Modal open={formOpen} title={editing ? "Edit category" : "New category"} onClose={() => setFormOpen(false)}>
        <CategoryForm
          initial={editing}
          onCancel={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            reload();
          }}
        />
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this category?"
        message={
          toDelete
            ? `“${toDelete.name}” will be permanently deleted. Categories that still contain dishes can't be deleted.`
            : ""
        }
        confirmLabel="Delete category"
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}