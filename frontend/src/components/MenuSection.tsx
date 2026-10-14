import { useMemo, useState } from "react";
import type { AsyncState } from "../hooks/useAsyncData";
import type { Category, Food } from "../types";
import { CategoryNav } from "./CategoryNav";
import { FoodCard } from "./FoodCard";
import { Icon } from "./Icons";
import { EmptyState, ErrorState, FoodGridSkeleton } from "./StateViews";

export interface MenuData {
  categories: Category[];
  foods: Food[];
}

interface MenuGroup {
  id: string;
  name: string;
  description?: string;
  foods: Food[];
}

interface MenuSectionProps {
  state: AsyncState<MenuData>;
  onRetry: () => void;
}

export function MenuSection({ state, onRetry }: MenuSectionProps) {
  return (
    <section id="menu" className="menu-section" aria-labelledby="menu-title">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow">The menu</p>
          <h2 id="menu-title">Choose what you're hungry for</h2>
        </header>
        {state.status === "loading" ? <FoodGridSkeleton /> : null}
        {state.status === "error" ? <ErrorState message={state.message} onRetry={onRetry} /> : null}
        {state.status === "success" ? <MenuContent data={state.data} /> : null}
      </div>
    </section>
  );
}

function MenuContent({ data }: { data: MenuData }) {
  const { categories, foods } = data;
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const needle = query.trim().toLowerCase();

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const food of foods) map.set(food.categoryId, (map.get(food.categoryId) ?? 0) + 1);
    return map;
  }, [foods]);

  const filtered = useMemo(
    () =>
      foods.filter(
        (food) =>
          (categoryId === null || food.categoryId === categoryId) &&
          (needle === "" ||
            food.name.toLowerCase().includes(needle) ||
            (food.description ?? "").toLowerCase().includes(needle))
      ),
    [foods, categoryId, needle]
  );

  const groups = useMemo<MenuGroup[]>(() => {
    const known = new Set(categories.map((category) => category.id));
    const result: MenuGroup[] = categories
      .map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        foods: filtered.filter((food) => food.categoryId === category.id),
      }))
      .filter((group) => group.foods.length > 0);
    const others = filtered.filter((food) => !known.has(food.categoryId));
    if (others.length > 0) result.push({ id: "other", name: "More dishes", foods: others });
    return result;
  }, [categories, filtered]);

  function clearFilters() {
    setQuery("");
    setCategoryId(null);
  }

  if (foods.length === 0) {
    return (
      <EmptyState
        title="The menu is empty right now"
        description="No dishes are available at the moment. Please check back soon."
      />
    );
  }

  const grouped = categoryId === null && needle === "";

  return (
    <>
      <div className="menu-toolbar">
        <div className="search">
          <Icon name="search" size={18} />
          <label htmlFor="menu-search" className="visually-hidden">
            Search dishes by name or description
          </label>
          <input
            id="menu-search"
            type="search"
            placeholder="Search dishes"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </div>
        <CategoryNav
          categories={categories}
          counts={counts}
          total={foods.length}
          selected={categoryId}
          onSelect={setCategoryId}
        />
      </div>

      <p className="result-count" role="status">
        {filtered.length} {filtered.length === 1 ? "dish" : "dishes"}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          title={needle ? `No dishes match “${query.trim()}”` : "Nothing in this category yet"}
          description="Try a different search or browse all categories."
          action={
            <button type="button" className="btn btn-ghost" onClick={clearFilters}>
              Clear filters
            </button>
          }
        />
      ) : grouped ? (
        groups.map((group) => (
          <div key={group.id} className="menu-group">
            <div className="menu-group-head">
              <h3>{group.name}</h3>
              {group.description ? <p>{group.description}</p> : null}
            </div>
            <div className="food-grid">
              {group.foods.map((food) => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="food-grid">
          {filtered.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>
      )}
    </>
  );
}