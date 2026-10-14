import type { Category } from "../types";

interface CategoryNavProps {
  categories: Category[];
  counts: Map<string, number>;
  total: number;
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryNav({ categories, counts, total, selected, onSelect }: CategoryNavProps) {
  return (
    <div className="chips" role="group" aria-label="Filter the menu by category">
      <button type="button" className="chip" aria-pressed={selected === null} onClick={() => onSelect(null)}>
        All <span className="chip-count">{total}</span>
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className="chip"
          aria-pressed={selected === category.id}
          onClick={() => onSelect(category.id)}
        >
          {category.name} <span className="chip-count">{counts.get(category.id) ?? 0}</span>
        </button>
      ))}
    </div>
  );
}