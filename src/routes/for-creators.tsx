import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
export const Route = createFileRoute("/for-creators")({
  head: () => ({ meta: [{ title: "For Creators — MakerMind Club" }, { name: "description", content: "Why STL designers and 3D print creators are choosing MakerMind Club over Patreon." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container-page py-16">
        <h1 className="text-4xl font-bold text-ink md:text-5xl">For 3D print creators.</h1>
        <p className="mt-4 max-w-2xl text-ink-soft">Native STL, 3MF, OBJ and ZIP support. Tiered memberships. Built-in growth loops. Everything you'd hack onto Patreon — built in by default.</p>
        <Link to="/auth" search={{ mode: "signup", as: "creator" }} className="btn-primary mt-8 inline-flex">Start as a creator</Link>
      </div>
      <SiteFooter />
    </div>
  ),
});
