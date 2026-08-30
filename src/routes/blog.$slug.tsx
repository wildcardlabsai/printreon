import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL, SITE_NAME, blogUrl } from "@/lib/site";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", params.slug)
      .eq("is_published", true)
      .maybeSingle();
    return { post: data as any | null };
  },
  head: ({ params, loaderData }) => {
    const post = loaderData?.post;
    const url = blogUrl(params.slug);
    if (!post) {
      return {
        meta: [
          { title: `Post not found — ${SITE_NAME}` },
          { name: "description", content: "This article is no longer available on the Printreon blog." },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const description: string =
      post.excerpt ?? String(post.body ?? "").replace(/\s+/g, " ").slice(0, 155);
    return {
      meta: [
        { title: `${post.title} — ${SITE_NAME} Blog` },
        { name: "description", content: description },
        { property: "og:title", content: post.title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:title", content: post.title },
        { name: "twitter:description", content: description },
        ...(post.cover_image_url
          ? [
              { property: "og:image", content: post.cover_image_url },
              { name: "twitter:image", content: post.cover_image_url },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description,
            image: post.cover_image_url ?? undefined,
            datePublished: post.published_at ?? post.created_at,
            dateModified: post.updated_at ?? post.published_at ?? post.created_at,
            mainEntityOfPage: url,
            articleBody: post.body ?? undefined,
            publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
          }),
        },
      ],
    };
  },
  component: BlogPost,
});

function BlogPost() {
  const { post } = Route.useLoaderData();

  if (!post)
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container-page py-20 text-center">
          <h1 className="text-3xl font-bold text-ink">Post not found</h1>
          <Link to="/blog" className="btn-primary mt-6 inline-flex">Back to blog</Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <article className="container-page max-w-3xl py-16">
        <Link to="/blog" className="text-sm text-ink-soft hover:text-ink">← Blog</Link>
        <h1 className="mt-4 text-4xl font-bold text-ink md:text-5xl">{post.title}</h1>
        <p className="mt-2 text-sm text-ink-soft">{new Date(post.published_at ?? post.created_at).toLocaleDateString()}</p>
        {post.cover_image_url && (
          <img
            src={post.cover_image_url}
            alt={`Cover image for the article “${post.title}”`}
            className="mt-8 aspect-video w-full rounded-2xl object-cover"
          />
        )}
        <div className="prose prose-lg mt-8 max-w-none whitespace-pre-line text-ink">{post.body}</div>
      </article>
      <SiteFooter />
    </div>
  );
}
