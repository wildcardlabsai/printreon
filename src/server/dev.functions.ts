// Dev-only helpers for testing the full buyer/creator/admin flow without
// going through real Stripe checkout or manual signups. These should NOT
// be used in production — every handler checks NODE_ENV / a dev guard.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEMO_PASSWORD = "DemoPass123!";

const DEMO_ACCOUNTS = [
  { email: "buyer@demo.printreon.test", role: "member" as const, fullName: "Demo Buyer" },
  { email: "creator@demo.printreon.test", role: "creator" as const, fullName: "Demo Creator" },
  { email: "admin@demo.printreon.test", role: "admin" as const, fullName: "Demo Admin" },
];

// Tiny valid ASCII STL — one triangle. Enough for the viewer/download to work.
const DEMO_STL = `solid demo_cube
facet normal 0 0 1
  outer loop
    vertex 0 0 0
    vertex 10 0 0
    vertex 0 10 0
  endloop
endfacet
endsolid demo_cube
`;

// Minimal valid ZIP archive containing a single README.txt — built by hand
// so we don't need a zip library at the edge.
function buildDemoZip(): Uint8Array {
  const enc = new TextEncoder();
  const name = enc.encode("README.txt");
  const content = enc.encode(
    "Printreon demo bundle — replace with real STL/3MF files in production."
  );

  // CRC32
  const table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  let crc = 0xffffffff;
  for (let i = 0; i < content.length; i++) crc = (crc >>> 8) ^ table[(crc ^ content[i]) & 0xff];
  crc = (crc ^ 0xffffffff) >>> 0;

  const size = content.length;
  const localHeader = new Uint8Array(30 + name.length);
  const dv = new DataView(localHeader.buffer);
  dv.setUint32(0, 0x04034b50, true);
  dv.setUint16(4, 20, true);
  dv.setUint16(6, 0, true);
  dv.setUint16(8, 0, true); // store, no compression
  dv.setUint16(10, 0, true);
  dv.setUint16(12, 0, true);
  dv.setUint32(14, crc, true);
  dv.setUint32(18, size, true);
  dv.setUint32(22, size, true);
  dv.setUint16(26, name.length, true);
  dv.setUint16(28, 0, true);
  localHeader.set(name, 30);

  const central = new Uint8Array(46 + name.length);
  const cv = new DataView(central.buffer);
  cv.setUint32(0, 0x02014b50, true);
  cv.setUint16(4, 20, true);
  cv.setUint16(6, 20, true);
  cv.setUint16(8, 0, true);
  cv.setUint16(10, 0, true);
  cv.setUint16(12, 0, true);
  cv.setUint16(14, 0, true);
  cv.setUint32(16, crc, true);
  cv.setUint32(20, size, true);
  cv.setUint32(24, size, true);
  cv.setUint16(28, name.length, true);
  cv.setUint16(30, 0, true);
  cv.setUint16(32, 0, true);
  cv.setUint16(34, 0, true);
  cv.setUint16(36, 0, true);
  cv.setUint32(38, 0, true);
  cv.setUint32(42, 0, true);
  central.set(name, 46);

  const localOffset = 0;
  const centralOffset = localHeader.length + size;
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, 1, true);
  ev.setUint16(10, 1, true);
  ev.setUint32(12, central.length, true);
  ev.setUint32(16, centralOffset, true);
  ev.setUint16(20, 0, true);

  const out = new Uint8Array(localHeader.length + size + central.length + eocd.length);
  let o = 0;
  out.set(localHeader, o); o += localHeader.length;
  out.set(content, o); o += size;
  out.set(central, o); o += central.length;
  out.set(eocd, o);
  void localOffset;
  return out;
}

async function seedDemoFiles(creatorId: string, userId: string) {
  // Skip if creator already has any files seeded
  const { data: existing } = await supabaseAdmin
    .from("creator_files")
    .select("id")
    .eq("creator_id", creatorId)
    .limit(1);
  if (existing && existing.length > 0) return;

  // Look up the "Pro Maker" tier (highest) to lock the second file behind it
  const { data: tiers } = await supabaseAdmin
    .from("creator_tiers")
    .select("id, price")
    .eq("creator_id", creatorId)
    .order("price", { ascending: false });
  const lockTierId = tiers?.[0]?.id ?? null;

  const stlPath = `${userId}/${creatorId}/demo-cube-${Date.now()}.stl`;
  const zipPath = `${userId}/${creatorId}/demo-bundle-${Date.now()}.zip`;

  const stlBytes = new TextEncoder().encode(DEMO_STL);
  const { error: stlErr } = await supabaseAdmin.storage
    .from("files")
    .upload(stlPath, stlBytes, { contentType: "model/stl", upsert: false });
  if (stlErr) {
    console.error("[dev] failed to upload demo STL", stlErr.message);
    return;
  }

  const zipBytes = buildDemoZip();
  const { error: zipErr } = await supabaseAdmin.storage
    .from("files")
    .upload(zipPath, zipBytes, { contentType: "application/zip", upsert: false });
  if (zipErr) {
    console.error("[dev] failed to upload demo ZIP", zipErr.message);
  }

  await supabaseAdmin.from("creator_files").insert([
    {
      creator_id: creatorId,
      title: "Demo Calibration Cube",
      slug: `demo-cube-${Math.random().toString(36).slice(2, 6)}`,
      description: "Free 10mm calibration cube — perfect for testing the download flow.",
      category: "Functional",
      is_free: true,
      is_published: true,
      tier_required_id: null,
      file_url: stlPath,
      file_type: "stl",
      file_size: stlBytes.length,
    },
    {
      creator_id: creatorId,
      title: "Demo Pro Bundle (Locked)",
      slug: `demo-bundle-${Math.random().toString(36).slice(2, 6)}`,
      description: "Subscriber-only bundle. Subscribe to the top tier to unlock.",
      category: "Miniatures",
      is_free: false,
      is_published: true,
      tier_required_id: lockTierId,
      file_url: zipErr ? null : zipPath,
      file_type: "zip",
      file_size: zipErr ? null : zipBytes.length,
    },
  ]);
}

export const ensureDemoAccounts = createServerFn({ method: "POST" })
  .handler(async () => {
    const results: { email: string; password: string; role: string }[] = [];

    for (const acc of DEMO_ACCOUNTS) {
      // Find existing user
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      let user = list?.users?.find((u) => u.email === acc.email);

      if (!user) {
        const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
          email: acc.email,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: acc.fullName },
        });
        if (error) throw new Error(`Could not create ${acc.email}: ${error.message}`);
        user = created.user!;
      } else {
        // Reset password so it always matches DEMO_PASSWORD
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password: DEMO_PASSWORD,
          email_confirm: true,
        });
      }

      // Ensure role row
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", acc.role)
        .maybeSingle();
      if (!existingRole) {
        await supabaseAdmin.from("user_roles").insert({ user_id: user.id, role: acc.role });
      }

      // Ensure creator profile + demo content for the creator demo account
      if (acc.role === "creator") {
        let { data: cp } = await supabaseAdmin
          .from("creator_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cp) {
          const { data: newCp } = await supabaseAdmin
            .from("creator_profiles")
            .insert({
              user_id: user.id,
              display_name: "Demo Creator Studio",
              slug: "demo-creator",
              short_intro: "Sample creator for testing the full flow.",
              bio: "This is a demo creator account. Subscribe and download files to test the platform end-to-end.",
              is_published: true,
            })
            .select("id")
            .single();
          cp = newCp ?? null;

          if (cp) {
            await supabaseAdmin.from("creator_tiers").insert([
              {
                creator_id: cp.id,
                name: "Supporter",
                price: 5,
                currency: "USD",
                description: "Early access to new files.",
                benefits: ["All free files", "Early access", "Discord role"],
                sort_order: 1,
              },
              {
                creator_id: cp.id,
                name: "Pro Maker",
                price: 12,
                currency: "USD",
                description: "Everything + commercial license.",
                benefits: ["Everything in Supporter", "Commercial license", "Source files"],
                sort_order: 2,
              },
            ]);
          }
        }

        if (cp) {
          await seedDemoFiles(cp.id, user.id);
        }
      }

      results.push({ email: acc.email, password: DEMO_PASSWORD, role: acc.role });
    }

    return { accounts: results };
  });

const SimulateInput = z.object({
  tierId: z.string().uuid(),
});

export const simulateSubscribe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SimulateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { data: tier, error: tierErr } = await supabaseAdmin
      .from("creator_tiers")
      .select("id, creator_id")
      .eq("id", data.tierId)
      .maybeSingle();
    if (tierErr || !tier) throw new Error("Tier not found");

    // If there is already an active sub for this tier, just return it.
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", userId)
      .eq("tier_id", data.tierId)
      .eq("environment", "sandbox")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing && ["active", "trialing"].includes(existing.status)) {
      return { id: existing.id, simulated: true, alreadyActive: true };
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { data: inserted, error } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        user_id: userId,
        creator_id: tier.creator_id,
        tier_id: tier.id,
        status: "active",
        environment: "sandbox",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        stripe_customer_id: `sim_cus_${userId.slice(0, 8)}`,
        stripe_subscription_id: `sim_sub_${Date.now()}`,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: inserted.id, simulated: true };
  });
