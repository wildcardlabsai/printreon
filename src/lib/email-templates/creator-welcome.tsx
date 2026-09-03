import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  slug?: string
}

const Email = ({ name, slug }: Props) => {
  const pageUrl = slug ? `https://printreon.com/c/${slug}` : 'https://printreon.com'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your Printreon creator page is live</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>PRINTREON</Text>
          <Heading style={h1}>Your page is live</Heading>
          <Text style={text}>
            {name ? `Hi ${name},` : 'Hi there,'} your creator page has been approved and is now
            public. Supporters can find it, subscribe to your tiers and download your files.
          </Text>
          <Button style={button} href="https://printreon.com/dashboard">
            Open your dashboard
          </Button>
          <Text style={muted}>Your page: {pageUrl}</Text>
          <Hr style={hr} />
          <Text style={h2}>Three things worth doing today</Text>
          <Text style={text}>
            1. Connect payouts in Dashboard, Payouts. Nothing reaches your bank until Stripe
            onboarding is finished.
            <br />
            2. Upload two or three files with recommended print settings filled in.
            <br />
            3. Set your tier prices. You can change them later without losing subscribers.
          </Text>
          <Hr style={hr} />
          <Text style={h2}>On file quality</Text>
          <Text style={text}>
            Every file needs an honest disclosure. AI assistance is fine and it happens, but a model
            generated start to finish has to be physically printed and shown before it goes live.
            Files that print well get a Print-Tested badge, and those sell.
          </Text>
          <Text style={muted}>
            Questions go straight to hello@printreon.com. A person reads them.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Your Printreon creator page is live',
  displayName: 'Creator welcome (activated)',
  previewData: { name: 'Matt', slug: 'demo-creator' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brand = { fontSize: '12px', letterSpacing: '2px', color: '#6b7280', margin: '0 0 12px' }
const h1 = { fontSize: '28px', color: '#0f1115', margin: '0 0 12px' }
const h2 = { fontSize: '15px', fontWeight: 700, color: '#0f1115', margin: '0 0 6px' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#2b2f36' }
const muted = { fontSize: '12px', color: '#6b7280', marginTop: '16px' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const button = {
  backgroundColor: '#c8f31d',
  color: '#0f1115',
  fontWeight: 700,
  fontSize: '15px',
  borderRadius: '999px',
  padding: '13px 24px',
  textDecoration: 'none',
  display: 'inline-block',
  marginTop: '8px',
}
