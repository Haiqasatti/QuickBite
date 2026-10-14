import { useMemo, useState, type FormEvent } from "react";
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
import { formatPrice } from "../lib/format";
import { hasErrors, isValidImageSource, mapFieldErrors, type FormErrors } from "../lib/validation";
import type { Category, Food } from "../types";

interface AdminFoodData {
  foods: Food[];
  categories: Category[];
}

async function loadAdminFoods(): Promise<AdminFoodData> {
  const [foodData, categoryData] = await Promise.all([catalogApi.allFoods(), catalogApi.allCategories()]);
  return { foods: foodData.foods, categories: categoryData.categories };
}

interface FoodFormValues {
  name: string;
  description: string;
  price: string;
  image: string;
  categoryId: string;
  isAvailable: boolean;
}

function FoodForm({
  initial,
  categories,
  onCancel,
  onSaved,
}: {
  initial: Food | null;
  categories: Category[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [values, setValues] = useState<FoodFormValues>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    price: initial ? String(initial.price) : "",
    image: initial?.image ?? "",
    categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
    isAvailable: initial?.isAvailable ?? true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FoodFormValues>(key: K, value: FoodFormValues[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const found: FormErrors = {};
    const name = values.name.trim();
    const price = Number(values.price);
    if (name.length < 2) found.name = "Name must be at least 2 characters.";
    else if (name.length > 120) found.name = "Name must be at most 120 characters.";
    if (values.price.trim() === "" || !Number.isFinite(price) || price <= 0) {
      found.price = "Price must be greater than zero.";
    } else if (price > 1_000_000) {
      found.price = "Price is too large.";
    }
    if (values.categoryId === "") found.categoryId = "Choose a category.";
    if (values.description.trim().length > 1000) found.description = "Description must be at most 1000 characters.";
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
      price,
      categoryId: values.categoryId,
      isAvailable: values.isAvailable,
      ...(image ? { image } : {}),
    };

    try {
      if (initial) {
        await catalogApi.updateFood(initial.id, payload);
        notify("Dish updated.", "success");
      } else {
        await catalogApi.createFood(payload);
        notify("Dish created.", "success");
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
        {(props) => <input {...props} type="text" value={values.name} maxLength={120} onChange={(e) => set("name", e.target.value)} />}
      </Field>
      <Field label="Category" error={errors.categoryId}>
        {(props) => (
          <select {...props} value={values.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.isActive ? "" : " (hidden)"}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Price" error={errors.price}>
        {(props) => (
          <input
            {...props}
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={values.price}
            onChange={(e) => set("price", e.target.value)}
          />
        )}
      </Field>
      <Field label="Description (optional)" error={errors.description}>
        {(props) => <textarea {...props} rows={3} value={values.description} onChange={(e) => set("description", e.target.value)} />}
      </Field>
      <ImagePicker label="Photo URL" value={values.image} error={errors.image} onChange={(value) => set("image", value)} />
      <label className="check">
        <input type="checkbox" checked={values.isAvailable} onChange={(e) => set("isAvailable", e.target.checked)} />
        <span>Available to order</span>
      </label>
      <div className="dialog-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : initial ? "Save changes" : "Create dish"}
        </button>
      </div>
    </form>
  );
}

export default function AdminFoods() {
  const { state, reload } = useAsyncData(loadAdminFoods);
  const { notify } = useToast();
  const [editing, setEditing] = useState<Food | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Food | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const categoryNames = useMemo(
    () =>
      state.status === "success"
        ? new Map<string, string>(state.data.categories.map((c): [string, string] => [c.id, c.name]))
        : new Map<string, string>(),
    [state]
  );

  async function toggleAvailability(food: Food) {
    setTogglingId(food.id);
    try {
      await catalogApi.updateFood(food.id, { isAvailable: !food.isAvailable });
      notify(`${food.name} is now ${food.isAvailable ? "unavailable" : "available"}.`, "success");
      reload();
    } catch (error) {
      notify(getErrorMessage(error), "error");
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await catalogApi.deleteFood(toDelete.id);
      notify("Dish deleted.", "success");
      reload();
    } catch (error) {
      notify(getErrorMessage(error), "error");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  const noCategories = state.status === "success" && state.data.categories.length === 0;

  return (
    <>
      <div className="toolbar">
        <h2>Foods</h2>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={state.status !== "success" || noCategories}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Icon name="plus" size={16} />
          Add dish
        </button>
      </div>

      {noCategories ? <p className="muted">Create a category first, then you can add dishes to it.</p> : null}
      {state.status === "loading" ? <LoadingState label="Loading dishes…" /> : null}
      {state.status === "error" ? <ErrorState message={state.message} onRetry={reload} /> : null}
      {state.status === "success" && state.data.foods.length === 0 && !noCategories ? (
        <EmptyState title="No dishes yet" description="Add your first dish to build the menu." />
      ) : null}
      {state.status === "success" && state.data.foods.length > 0 ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Dish</th>
                <th scope="col">Category</th>
                <th scope="col">Price</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {state.data.foods.map((food) => (
                <tr key={food.id}>
                  <td>
                    <div className="cell-item">
                      <div className="cart-thumb">
                        <FoodImage src={food.image} name={food.name} />
                      </div>
                      <strong>{food.name}</strong>
                    </div>
                  </td>
                  <td>{categoryNames.get(food.categoryId) ?? "Unknown"}</td>
                  <td>{formatPrice(food.price)}</td>
                  <td>
                    <span className={food.isAvailable ? "pill pill-on" : "pill pill-off"}>
                      {food.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="cell-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={togglingId === food.id}
                      onClick={() => void toggleAvailability(food)}
                    >
                      {food.isAvailable ? "Mark unavailable" : "Mark available"}
                      <span className="visually-hidden"> {food.name}</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setEditing(food);
                        setFormOpen(true);
                      }}
                    >
                      <Icon name="edit" size={16} />
                      Edit<span className="visually-hidden"> {food.name}</span>
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm danger-text" onClick={() => setToDelete(food)}>
                      <Icon name="trash" size={16} />
                      Delete<span className="visually-hidden"> {food.name}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Modal open={formOpen} title={editing ? "Edit dish" : "New dish"} onClose={() => setFormOpen(false)}>
        {state.status === "success" ? (
          <FoodForm
            initial={editing}
            categories={state.data.categories}
            onCancel={() => setFormOpen(false)}
            onSaved={() => {
              setFormOpen(false);
              reload();
            }}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this dish?"
        message={
          toDelete
            ? `“${toDelete.name}” will be permanently deleted. Dishes that appear in past orders can't be deleted; mark them unavailable instead.`
            : ""
        }
        confirmLabel="Delete dish"
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}