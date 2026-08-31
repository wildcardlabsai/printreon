import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
import { template as betaInvite } from './beta-invite'
import { template as adminFeedbackNotice } from './admin-feedback-notice'
import { template as adminContactNotice } from './admin-contact-notice'
import { template as adminBetaApplicationNotice } from './admin-beta-application-notice'
import { template as newsletterWelcome } from './newsletter-welcome'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'beta-invite': betaInvite,
  'admin-feedback-notice': adminFeedbackNotice,
  'admin-contact-notice': adminContactNotice,
  'admin-beta-application-notice': adminBetaApplicationNotice,
  'newsletter-welcome': newsletterWelcome,
}
