import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "ict-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) setVisible(true);
  }, []);

  const decide = (choice: "accepted" | "rejected") => {
    localStorage.setItem(KEY, choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 md:p-5 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-border/60 glass shadow-elegant p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Cookie className="h-4 w-4" />
          </div>
          <div className="text-sm">
            <p className="font-medium">We use cookies</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              We store your role, profile, and preferences locally to keep the app working.
              Accept to allow non-essential storage or reject to keep only what's required.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => decide("rejected")}>
            Reject
          </Button>
          <Button size="sm" onClick={() => decide("accepted")} className="bg-gradient-primary">
            Accept
          </Button>
          <button
            onClick={() => decide("rejected")}
            aria-label="Close"
            className="ml-1 text-muted-foreground hover:text-foreground md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
