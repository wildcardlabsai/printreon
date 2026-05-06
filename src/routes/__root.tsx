import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { Link } from "@tanstack/react-router";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-ink">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-ink">Page not found</h2>
        <p className="mt-2 text-sm text-ink-soft">
          That page hasn't been printed yet.
        </p>
        <div className="mt-6">
          <Link to="/" className="btn-primary">Back home</Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Printreon — Memberships for 3D Print Creators" },
      { name: "description", content: "Sell STL, 3MF and printable files through monthly memberships. The Patreon alternative purpose-built for 3D printing creators. Partnered with MakerMind App." },
      { property: "og:title", content: "Printreon — Memberships for 3D Print Creators" },
      { property: "og:description", content: "Sell STL, 3MF and printable files through monthly memberships. The Patreon alternative purpose-built for 3D printing creators. Partnered with MakerMind App." },
      { property: "og:site_name", content: "Printreon" },
      { property: "og:url", content: "https://printreon.com" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#ea7a2c" },
      { name: "twitter:title", content: "Printreon — Memberships for 3D Print Creators" },
      { name: "twitter:description", content: "Sell STL, 3MF and printable files through monthly memberships. The Patreon alternative purpose-built for 3D printing creators. Partnered with MakerMind App." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/3TUi3JNUmJQa4eVdOnmIkCiRgCJ3/social-images/social-1777834042693-ChatGPT_Image_May_3,_2026,_07_47_06_PM.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/3TUi3JNUmJQa4eVdOnmIkCiRgCJ3/social-images/social-1777834042693-ChatGPT_Image_May_3,_2026,_07_47_06_PM.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster richColors position="top-center" />
    </AuthProvider>
  );
}
