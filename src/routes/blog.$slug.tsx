import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPost,
});

function BlogPost() {
  const { slug } = Route.useParams();
  const [post, setPost] = useState<any>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    supabase.from("blog_posts").select("*").eq("slug", slug).eq("is_published", true).maybeSingle()
      .then(({ data }) => { if (data) setPost(data); else setMissing(true); });
  }, [slug]);

  if (missing) return (
    <div className="min-h-screen bg-background"><SiteHeader />
      <div className="container-page py-20 text-center">
        <h1 className="text-3xl font-bold text-ink">Post not found</h1>
        <Link to="/blog" className="btn-primary mt-6 inline-flex">Back to blog</Link>
      </div></div>
  );
  if (!post) return <div className="min-h-screen bg-background"><SiteHeader /></div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <article className="container-page max-w-3xl py-16">
        <Link to="/blog" className="text-sm text-ink-soft hover:text-ink">← Blog</Link>
        <h1 className="mt-4 text-4xl font-bold text-ink md:text-5xl">{post.title}</h1>
        <p className="mt-2 text-sm text-ink-soft">{new Date(post.published_at ?? post.created_at).toLocaleDateString()}</p>
        {post.cover_image_url && <img src={post.cover_image_url} alt="" className="mt-8 aspect-video w-full rounded-2xl object-cover" />}
        <div className="prose prose-lg mt-8 max-w-none whitespace-pre-line text-ink">{post.body}</div>
        <p className="sr-only">{SITE_URL}/blog/{post.slug}</p>
      </article>
      <SiteFooter />
    </div>
  );
}
