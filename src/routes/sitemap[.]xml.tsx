import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const base = "https://makermind.club";
        const staticPaths = ["/", "/explore", "/for-creators", "/pricing", "/about", "/blog", "/changelog", "/roadmap", "/press", "/contact", "/help", "/legal/terms", "/legal/privacy", "/legal/dmca", "/legal/creator-agreement"];

        const [{ data: creators }, { data: posts }] = await Promise.all([
          supabaseAdmin.from("creator_profiles").select("slug, updated_at").eq("is_published", true),
          supabaseAdmin.from("blog_posts").select("slug, updated_at").eq("is_published", true),
        ]);

        const urls: string[] = [
          ...staticPaths.map((p) => `<url><loc>${base}${p}</loc></url>`),
          ...(creators ?? []).map((c: any) => `<url><loc>${base}/c/${c.slug}</loc><lastmod>${c.updated_at}</lastmod></url>`),
          ...(posts ?? []).map((p: any) => `<url><loc>${base}/blog/${p.slug}</loc><lastmod>${p.updated_at}</lastmod></url>`),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml" } });
      },
    },
  },
});
