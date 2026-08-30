# Printreon

Build a fully functional, production-ready SaaS platform called MakerMind Club.

This must NOT be an MVP, mockup, prototype, or fake demo.

It must be a real, working platform with authentication, database, file storage, subscriptions, protected downloads, creator dashboards, user dashboards, admin tools, and clean production-ready code.

MakerMind Club is a subscription platform built specifically for 3D printing creators who want to sell STL, 3MF, OBJ, ZIP and other 3D print files through monthly memberships.

Think Patreon, but purpose-built for 3D printing files, makers, STL creators, print farms, hobby designers, and digital model sellers.

Use the supplied MakerMind branding style:

- Clean white background

- Orange accent colour

- Black and dark grey typography

- Premium, modern SaaS feel

- Geometric/faceted style inspiration from the MakerMind logo

- Do not make it look like a generic AI-generated website

- Avoid clutter, generic gradients, fake stats, or placeholder content

-----------------------------------

TECH STACK

-----------------------------------

Use:

- React

- Vite

- TypeScript

- Tailwind CSS

- shadcn/ui

- Supabase Auth

- Supabase Database

- Supabase Storage

- Stripe subscriptions

- Stripe webhooks

- Responsive design

- Row Level Security

Everything must be wired up properly.

-----------------------------------

AUTHENTICATION

-----------------------------------

Build full authentication using Supabase.

Include:

- Email/password signup

- Email/password login

- Google OAuth login

- Forgot password

- Reset password

- Email verification where suitable

- Persistent sessions

- Protected routes

- Role-based access

Roles:

- Member

- Creator

- Admin

During onboarding, users should be able to choose:

1. “I want to support and download files”

2. “I want to become a creator”

If they choose creator, take them through a creator onboarding flow.

-----------------------------------

DATABASE STRUCTURE

-----------------------------------

Create proper Supabase tables with relationships.

Tables required:

profiles

- id

- user_id

- full_name

- username

- email

- avatar_url

- role

- created_at

- updated_at

creator_profiles

- id

- user_id

- display_name

- slug

- bio

- short_intro

- profile_image_url

- banner_image_url

- website_url

- instagram_url

- tiktok_url

- youtube_url

- cults_url

- printables_url

- makerworld_url

- is_verified

- is_published

- created_at

- updated_at

creator_tiers

- id

- creator_id

- stripe_price_id

- name

- price

- currency

- description

- benefits

- is_active

- sort_order

- created_at

creator_files

- id

- creator_id

- title

- slug

- description

- file_type

- file_url

- file_size

- preview_images

- tags

- category

- tier_required_id

- is_free

- is_published

- download_count

- created_at

- updated_at

subscriptions

- id

- user_id

- creator_id

- tier_id

- stripe_customer_id

- stripe_subscription_id

- status

- current_period_start

- current_period_end

- cancel_at_period_end

- created_at

- updated_at

downloads

- id

- user_id

- creator_id

- file_id

- downloaded_at

followers

- id

- user_id

- creator_id

- created_at

referrals

- id

- referrer_user_id

- referred_user_id

- creator_id

- referral_code

- status

- reward_type

- created_at

creator_announcements

- id

- creator_id

- title

- content

- audience

- created_at

admin_reports

- id

- reported_by

- creator_id

- file_id

- reason

- status

- created_at

-----------------------------------

CREATOR ONBOARDING FLOW

-----------------------------------

Design this properly.

After signup as creator, show a clean onboarding wizard:

Step 1: Creator identity

- Display name

- Username / creator URL slug

- Short intro

- Profile image upload

Step 2: Brand your page

- Banner image upload

- Bio

- Social links

- Existing marketplace links

Step 3: Create your first tier

Suggested templates:

- Supporter

- Standard Files

- Premium Vault

- Commercial Licence

Allow creator to edit:

- Tier name

- Monthly price

- Benefits

- Who it is for

Step 4: Upload first file

- File title

- Description

- Upload STL / 3MF / OBJ / ZIP

- Upload preview images

- Choose category

- Add tags

- Choose free or locked behind tier

Step 5: Publish creator page

- Preview page

- Publish button

- Share link

Make onboarding feel smooth, confidence-building and premium.

-----------------------------------

CREATOR DASHBOARD UX

-----------------------------------

Design a proper creator dashboard, not a basic admin table.

Default page: Creator Home

Creator Home should show:

- Profile completion score

- Monthly recurring revenue

- Active subscribers

- New subscribers this month

- File downloads this month

- Most popular file

- Quick actions:

  - Upload new file

  - Create tier

  - Post update

  - Share creator page

Add a “Next best action” card that suggests what the creator should do next:

- Add a profile image

- Upload first file

- Create a premium tier

- Share their page

- Add preview images

- Post an update

Creator dashboard sections:

1. Overview

- Revenue summary

- Subscriber growth

- Download trends

- Recent activity

2. Files

- Upload new file

- Manage files

- Filter by published/draft/free/locked

- See downloads per file

- Edit file

- Delete file

- Preview file page

3. Tiers

- Create, edit, pause and delete tiers

- Show subscribers per tier

- Show monthly value per tier

- Include tier templates

4. Subscribers

- List active subscribers

- Tier subscribed to

- Join date

- Subscription status

- Monthly value

- Search and filter

5. Announcements

- Post updates to followers or subscribers

- Choose audience:

  - Everyone

  - Followers only

  - Subscribers only

  - Specific tier

6. Growth Tools

- Creator referral link

- Social share graphics

- “Free file lead magnet” setup

- Subscriber discount links

- Shareable launch post copy

- QR code for creator page

- Embeddable creator badge

7. Analytics

- Revenue over time

- Download trends

- Conversion rate

- Profile views

- Follower to subscriber conversion

- Most popular files

- Best performing tiers

8. Settings

- Creator profile

- Social links

- Payment settings

- Notification settings

- Account settings

-----------------------------------

VIRAL GROWTH LOOPS

-----------------------------------

Build growth features into the platform from day one.

1. Creator referral system

Each creator gets a unique referral link:

makermind.club/c/creator-name?ref=code

Track:

- Visits

- Signups

- Subscribers

- Conversion rate

2. Free file unlock

Creators can mark selected files as “free with account”.

User must create a free account to download.

This grows the user base.

3. Follow before subscribe

Users can follow creators for free.

Creators can later convert followers into subscribers with announcements.

4. Share after download

After downloading a free file, show:

“Enjoyed this file? Share this creator with another maker.”

Include:

- Copy link button

- Facebook share

- X share

- Reddit share

5. Creator launch kit

Inside Growth Tools, provide ready-made launch copy:

- Facebook group post

- Instagram caption

- X post

- Reddit post

- Email announcement

6. Public creator pages

Every creator gets a public profile that can rank on Google.

7. Featured creators

Landing page and explore page should show real creators from the database, not fake placeholder creators.

8. Waitlist / early access mode

If no creators exist yet, show a real waitlist signup instead of fake creator cards.

-----------------------------------

MEMBER EXPERIENCE

-----------------------------------

Members can:

- Browse creators

- Search creators

- Filter by niche:

  - Miniatures

  - Cosplay

  - Functional prints

  - Toys

  - Home decor

  - Tools

  - Art

  - Tabletop gaming

  - Seasonal

  - Business sellers

- View creator profile

- Follow creators

- Subscribe to creator tiers

- Download unlocked files

- See download history

- Manage subscriptions

- Cancel subscriptions

- Update payment method through Stripe customer portal

Member dashboard:

- Subscribed creators

- Latest files from creators they support

- Free files they downloaded

- Followed creators

- Recommended creators

- Subscription billing links

-----------------------------------

PUBLIC LANDING PAGE

-----------------------------------

Create a high-converting landing page for MakerMind Club.

Hero section:

Headline:

Turn Your 3D Print Files Into Monthly Income

Subheading:

MakerMind Club gives 3D creators a simple way to sell STL, 3MF and printable files through monthly memberships, without trying to force Patreon to do something it was never built for.

Primary CTA:

Start as a Creator

Secondary CTA:

Explore Creators

Sections:

1. Built for 3D creators, not generic content creators

Explain that the platform is made for STL files, 3MF files, preview images, tiered access, protected downloads and maker communities.

2. How it works

- Create your creator page

- Add membership tiers

- Upload your files

- Share your page

- Get paid monthly

3. Why creators use MakerMind Club

Cards:

- File protection

- Tiered memberships

- Subscriber-only downloads

- Free file lead magnets

- Creator analytics

- Built-in growth tools

4. For supporters

Explain that members can support their favourite designers and access fresh files every month.

5. Creator dashboard preview

Show realistic UI cards from the actual dashboard design, not fake data.

6. Growth tools section

Explain referral links, free file unlocks, social sharing and creator launch kits.

7. Pricing

MakerMind Club should have platform pricing ready, but do not charge creators until Stripe platform settings are connected.

Suggested model:

- Free to start

- Platform takes a small percentage per paid subscription

- No monthly fee for creators

- Free files allowed

Make this editable in admin settings.

8. FAQ

Include:

- Can I upload STL files?

- Can I upload 3MF files?

- Can I offer free files?

- Can I create multiple tiers?

- Can I use it instead of Patreon?

- How do payouts work?

- Can I sell commercial licence tiers?

- Can subscribers cancel anytime?

9. Final CTA

Start your MakerMind Club page today.

-----------------------------------

CREATOR PROFILE PAGE

-----------------------------------

Each creator gets a public page:

URL format:

makermind.club/c/creator-slug

Page sections:

- Banner

- Profile image

- Creator name

- Bio

- Follow button

- Subscribe button

- Social links

- Tiers

- Free files

- Subscriber files preview

- Latest announcements

- Download stats if creator chooses public visibility

Tier cards:

- Name

- Price/month

- Benefits

- Subscribe button

File cards:

- Preview image

- Title

- Category

- Tags

- Free/Locked badge

- Download button if accessible

- Subscribe prompt if locked

-----------------------------------

FILE ACCESS CONTROL

-----------------------------------

This is critical.

Files must not be downloadable just because someone has the URL.

Implement secure access control:

- Check logged-in user

- Check subscription status

- Check tier access

- Generate secure download link only if allowed

- Free files require account login unless creator chooses fully public

- Store files securely in Supabase Storage

- Use RLS policies properly

-----------------------------------

STRIPE SUBSCRIPTIONS

-----------------------------------

Implement proper Stripe subscription flow.

Required:

- Stripe Checkout for joining a creator tier

- Stripe Customer Portal for managing subscription

- Webhook handling for:

  - checkout.session.completed

  - customer.subscription.created

  - customer.subscription.updated

  - customer.subscription.deleted

  - invoice.payment_succeeded

  - invoice.payment_failed

Update subscription status in Supabase automatically.

Important:

The app must be structured so Stripe Connect can be added later for creator payouts.

Add database fields and architecture readiness for:

- connected_account_id

- payout_status

- platform_fee_percentage

Do not fake payouts.

If Stripe Connect is not fully configured, show a clear setup state in admin and creator settings.

-----------------------------------

ADMIN DASHBOARD

-----------------------------------

Build a proper admin dashboard.

Admin can:

- View all users

- View all creators

- View all files

- View all subscriptions

- View platform revenue

- Review reported content

- Suspend creators

- Remove files

- Manage featured creators

- Manage categories

- Manage platform fee settings

- View waitlist signups

-----------------------------------

DESIGN REQUIREMENTS

-----------------------------------

The design must feel premium, modern and trustworthy.

Use:

- White backgrounds

- Black/dark grey text

- Orange accent

- Soft shadows

- Rounded cards

- Clean spacing

- Dashboard cards with strong hierarchy

- Subtle geometric details inspired by the MakerMind logo

- Mobile responsive layouts

Avoid:

- Generic AI gradients

- Fake testimonials

- Fake creator cards

- Placeholder charts

- Lorem ipsum

- Overly colourful startup template look

If data does not exist, show useful empty states:

- “Upload your first file”

- “Create your first tier”

- “Share your creator page”

- “No subscribers yet”

-----------------------------------

REAL EMPTY STATES

-----------------------------------

Do not use fake data.

Examples:

If no creators:

Show:

“MakerMind Club is opening for creators soon.”

Include waitlist form.

If creator has no files:

Show:

“Your first upload is where your Club starts.”

Button: Upload your first file.

If member has no subscriptions:

Show:

“Find creators worth supporting.”

Button: Explore creators.

-----------------------------------

SEO

-----------------------------------

Build SEO-ready pages:

- Proper meta titles

- Meta descriptions

- Open graph tags

- Public creator pages indexable

- File pages indexable only when public

- Clean URL slugs

- Sitemap-ready structure

Landing page SEO focus:

- 3D creator subscriptions

- Sell STL files

- Sell 3D print files

- Patreon alternative for 3D printing

- Membership platform for 3D creators

-----------------------------------

EMAIL NOTIFICATIONS

-----------------------------------

Create email-ready triggers using Supabase Edge Functions or structured placeholders ready for Resend.

Emails:

- Welcome email

- Creator onboarding reminder

- New subscriber notification

- Subscription confirmation

- Payment failed

- New file uploaded by creator

- Announcement from creator

Do not fake sending unless API keys are configured.

Show clear environment variable requirements.

-----------------------------------

ENVIRONMENT VARIABLES

-----------------------------------

Set up clear environment variable structure:

VITE_SUPABASE_URL

VITE_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

STRIPE_SECRET_KEY

STRIPE_WEBHOOK_SECRET

VITE_STRIPE_PUBLISHABLE_KEY

RESEND_API_KEY

-----------------------------------

FINAL OUTPUT

-----------------------------------

The final app must include:

- Fully working authentication

- Google login

- Supabase database

- Supabase storage

- Creator onboarding

- Creator dashboard

- Member dashboard

- Admin dashboard

- File uploads

- Protected downloads

- Subscription tiers

- Stripe Checkout

- Stripe webhook handling

- Public creator pages

- Viral growth tools

- Landing page

- SEO structure

- Mobile responsive design

- No fake data

- No placeholder functionality

- No broken buttons

- No mock-only pages

Build this like a real SaaS product that is ready to onboard real 3D printing creators.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://printreon.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3c1497c7-e35c-41b2-9c17-ff6316cac877).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
