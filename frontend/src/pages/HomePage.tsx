import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Hero } from "../components/Hero";
import { MenuSection, type MenuData } from "../components/MenuSection";
import { useAsyncData } from "../hooks/useAsyncData";
import { catalogApi } from "../lib/endpoints";

async function loadMenu(): Promise<MenuData> {
  const [categoryData, foodData] = await Promise.all([catalogApi.categories(), catalogApi.foods()]);
  return { categories: categoryData.categories, foods: foodData.foods };
}

const STEPS = [
  { title: "Pick your dishes", text: "Search or filter the menu and add what you like to your cart." },
  { title: "Confirm your order", text: "Sign in, enter your delivery address and review the total." },
  { title: "Pay on delivery", text: "Cash on delivery is the available payment method." },
];

export default function HomePage() {
  const { state, reload } = useAsyncData(loadMenu);
  const { hash } = useLocation();

  useEffect(() => {
    if (hash === "#menu") document.getElementById("menu")?.scrollIntoView();
  }, [hash]);

  const featured = useMemo(
    () => (state.status === "success" ? (state.data.foods.find((food) => food.image) ?? null) : null),
    [state]
  );

  return (
    <>
      <Hero featured={featured} />
      <MenuSection state={state} onRetry={reload} />
      <section className="steps" aria-labelledby="steps-title">
        <div className="container">
          <h2 id="steps-title" className="visually-hidden">
            How ordering works
          </h2>
          <ol className="steps-list">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}