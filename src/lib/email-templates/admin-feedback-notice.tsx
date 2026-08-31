import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  type?: string
  name?: string
  email?: string
  message?: string
  pageUrl?: string
}

const Email = ({ type, name, email, message, pageUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New Printreon feedback from {name || email || 'a visitor'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>PRINTREON · FEEDBACK</Text>
        <Heading style={h1}>New {type || 'feedback'} submission</Heading>
        <Text style={row}><strong>From:</strong> {name || '—'} ({email || 'no email'})</Text>
        {pageUrl ? <Text style={row}><strong>Page:</strong> {pageUrl}</Text> : null}
        <Text style={quote}>{message || ''}</Text>
        <Text style={muted}>Manage it in the admin inbox at https://printreon.com/admin/inbox</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `New feedback: ${d?.['type'] ?? 'message'}`,
  displayName: 'Admin — feedback received',
  previewData: {
    type: 'idea',
    name: 'Jane Maker',
    email: 'jane@example.com',
    message: 'Would love bundle discounts.',
    pageUrl: 'https://printreon.com/feedback',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brand = { fontSize: '12px', letterSpacing: '2px', color: '#6b7280', margin: '0 0 12px' }
const h1 = { fontSize: '22px', color: '#0f1115', margin: '0 0 14px' }
const row = { fontSize: '14px', color: '#2b2f36', margin: '4px 0' }
const quote = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#0f1115',
  borderLeft: '3px solid #c8f31d',
  padding: '6px 0 6px 14px',
  margin: '16px 0',
  whiteSpace: 'pre-wrap' as const,
}
const muted = { fontSize: '12px', color: '#6b7280', marginTop: '18px' }
