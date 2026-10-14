import { Link } from "react-router-dom";
import { EmptyState } from "../components/StateViews";

export default function NotFoundPage() {
  return (
    <div className="container page">
      <EmptyState
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved."
        action={
          <Link className="btn btn-primary" to="/">
            Back to the menu
          </Link>
        }
      />
    </div>
  );
}