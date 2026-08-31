import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  inviteCode?: string
  signupUrl?: string
}

const Email = ({ name, inviteCode, signupUrl = 'https://printreon.com/join' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Printreon beta invite is here</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>PRINTREON</Text>
        <Heading style={h1}>You're in.</Heading>
        <Text style={text}>
          {name ? `Hi ${name},` : 'Hi there,'} your invite to the Printreon beta is ready. Create your
          account and you can start publishing files, setting up tiers and building your supporter base
          straight away.
        </Text>
        {inviteCode ? (
          <Section style={codeBox}>
            <Text style={codeLabel}>Your invite code</Text>
            <Text style={code}>{inviteCode}</Text>
          </Section>
        ) : null}
        <Button style={button} href={signupUrl}>
          Create your account
        </Button>
        <Text style={muted}>
          If the button doesn't work, paste this into your browser: {signupUrl}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Your Printreon beta invite',
  displayName: 'Beta invite',
  previewData: { name: 'Matt', inviteCode: 'PRN-BETA-1234' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brand = { fontSize: '12px', letterSpacing: '2px', color: '#6b7280', margin: '0 0 12px' }
const h1 = { fontSize: '28px', color: '#0f1115', margin: '0 0 12px' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#2b2f36' }
const muted = { fontSize: '12px', color: '#6b7280', marginTop: '20px' }
const codeBox = {
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  padding: '14px 16px',
  margin: '18px 0',
}
const codeLabel = { fontSize: '11px', textTransform: 'uppercase' as const, color: '#6b7280', margin: 0 }
const code = { fontSize: '20px', fontWeight: 700, color: '#0f1115', margin: '4px 0 0' }
const button = {
  backgroundColor: '#c8f31d',
  color: '#0f1115',
  fontWeight: 700,
  fontSize: '15px',
  borderRadius: '999px',
  padding: '13px 24px',
  textDecoration: 'none',
  display: 'inline-block',
}
