import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  subject?: string
  category?: string
  email?: string
  message?: string
}

const Email = ({ subject, category, email, message }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New Printreon contact message: {subject || 'no subject'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>PRINTREON · CONTACT</Text>
        <Heading style={h1}>{subject || 'New contact message'}</Heading>
        <Text style={row}><strong>From:</strong> {email || 'no email'}</Text>
        <Text style={row}><strong>Category:</strong> {category || 'general'}</Text>
        <Text style={quote}>{message || ''}</Text>
        <Text style={muted}>Reply directly to this email, or open https://printreon.com/admin/inbox</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Contact form: ${d?.['subject'] ?? 'new message'}`,
  displayName: 'Admin — contact message',
  previewData: {
    subject: 'Partnership idea',
    category: 'partnership',
    email: 'hello@example.com',
    message: 'We run a filament shop and would love to collaborate.',
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
