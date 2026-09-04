import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { Check } from "lucide-react";
export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Printreon" },
      { name: "description", content: "Free to list. Printreon takes a 10% marketplace fee on digital file sales, and nothing else." },
      { property: "og:title", content: "Pricing — Printreon" },
      { property: "og:description", content: "Free to list. A 10% marketplace fee on digital 3D file sales." },
    ],
  }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container-page py-16">
        <h1 className="text-4xl font-bold text-ink md:text-5xl">Pricing</h1>
        <p className="mt-3 max-w-xl text-ink-soft">Free to list your files. Printreon keeps a 10% marketplace fee on digital file sales, and nothing else.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="card-soft">
            <h2 className="text-xl font-bold text-ink">Creator</h2>
            <div className="mt-3 text-4xl font-bold text-ink">Free<span className="ml-2 text-base font-medium text-ink-soft">to start</span></div>
            <ul className="mt-5 space-y-2 text-sm text-ink">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Unlimited tiers and uploads</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Built-in growth tools</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />10% marketplace fee on digital file sales</li>
            </ul>
            <Link to="/auth" search={{ mode: "signup", as: "creator" }} className="btn-primary mt-6 w-full">Start as a creator</Link>
          </div>
          <div className="card-soft">
            <h2 className="text-xl font-bold text-ink">Member</h2>
            <div className="mt-3 text-4xl font-bold text-ink">$0</div>
            <ul className="mt-5 space-y-2 text-sm text-ink">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Free account, follow creators</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Pay per creator subscription</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Cancel anytime</li>
            </ul>
            <Link to="/auth" search={{ mode: "signup" }} className="btn-ghost mt-6 w-full">Create free account</Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  ),
});
