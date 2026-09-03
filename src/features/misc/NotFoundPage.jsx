import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <EmptyState
        icon={<Compass className="h-6 w-6" />}
        title="This page hasn't been built yet"
        description="The route exists in the navigation but has no screen behind it. Pick another section to continue."
        action={
          <Button as={Link} to="/dashboard">
            Back to dashboard
          </Button>
        }
      />
    </div>
  );
}
