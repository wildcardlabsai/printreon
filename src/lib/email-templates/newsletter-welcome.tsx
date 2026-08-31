import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
}

const Email = ({ name }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're on the Printreon updates list</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>PRINTREON</Text>
        <Heading style={h1}>You're on the list</Heading>
        <Text style={text}>
          {name ? `Thanks ${name}!` : 'Thanks!'} You'll get Printreon product updates — new creator tools,
          platform releases and beta milestones. No spam, and you can opt out any time from the footer of
          any email.
        </Text>
        <Text style={text}>— The Printreon team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: "You're on the Printreon updates list",
  displayName: 'Newsletter — welcome',
  previewData: { name: 'Matt' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brand = { fontSize: '12px', letterSpacing: '2px', color: '#6b7280', margin: '0 0 12px' }
const h1 = { fontSize: '26px', color: '#0f1115', margin: '0 0 12px' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#2b2f36' }
