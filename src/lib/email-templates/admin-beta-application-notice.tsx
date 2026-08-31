import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  email?: string
  fullName?: string
  creatorName?: string
  role?: string
  currentPlatform?: string
  audienceSize?: string
  sellsStls?: boolean
  sellsPrints?: boolean
  commercial?: boolean
  frustration?: string
}

const yn = (v?: boolean) => (v ? 'Yes' : 'No')

const Email = ({
  email,
  fullName,
  creatorName,
  role,
  currentPlatform,
  audienceSize,
  sellsStls,
  sellsPrints,
  commercial,
  frustration,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New beta application from {creatorName || fullName || email || 'a maker'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>PRINTREON · BETA APPLICATION</Text>
        <Heading style={h1}>{creatorName || fullName || 'New applicant'}</Heading>
        <Text style={row}><strong>Email:</strong> {email || '—'}</Text>
        <Text style={row}><strong>Applying as:</strong> {role || '—'}</Text>
        <Text style={row}><strong>Current platform:</strong> {currentPlatform || '—'}</Text>
        <Text style={row}><strong>Audience size:</strong> {audienceSize || '—'}</Text>
        <Text style={row}><strong>Sells STLs:</strong> {yn(sellsStls)}</Text>
        <Text style={row}><strong>Sells physical prints:</strong> {yn(sellsPrints)}</Text>
        <Text style={row}><strong>Wants commercial licensing:</strong> {yn(commercial)}</Text>
        {frustration ? (
          <>
            <Text style={row}><strong>Biggest frustration</strong></Text>
            <Text style={quote}>{frustration}</Text>
          </>
        ) : null}
        <Text style={muted}>Review and invite from https://printreon.com/admin/inbox</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `New beta application: ${d?.['creatorName'] ?? d?.['fullName'] ?? d?.['email'] ?? 'unknown'}`,
  displayName: 'Admin — beta application',
  previewData: {
    email: 'jane@example.com',
    fullName: 'Jane Maker',
    creatorName: 'MakerJane',
    role: 'creator',
    currentPlatform: 'Patreon',
    audienceSize: '10k–50k',
    sellsStls: true,
    sellsPrints: false,
    commercial: true,
    frustration: 'Fees and no proper file hosting.',
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
  margin: '10px 0',
  whiteSpace: 'pre-wrap' as const,
}
const muted = { fontSize: '12px', color: '#6b7280', marginTop: '18px' }
