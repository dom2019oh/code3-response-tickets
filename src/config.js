// ─────────────────────────────────────────────────────────────────────────────
// Ticket configuration — community branding + the dropdown ticket types.
//
// Everything a server owner needs to customise lives in this file (or the
// matching environment variables). IDs left blank fall back gracefully:
//   • no category set  → the ticket channel is created at the server root
//   • no staff role set → the ticket opens, but no team is auto-granted access
// so the bot always runs, even before you have finished wiring up your server.
// ─────────────────────────────────────────────────────────────────────────────

// Shown in embed footers and the panel title. Override with COMMUNITY_NAME.
export const COMMUNITY_NAME = process.env.COMMUNITY_NAME ?? 'Our Community';

// Brand accent for every embed (hex). Override with BRAND_COLOR (e.g. 0x1F6FEB).
export const brandColor = Number(process.env.BRAND_COLOR ?? 0x1F6FEB);

// A 17–20 digit Discord ID. Placeholders/blanks are treated as "not set".
export const isSnowflake = (v) => typeof v === 'string' && /^\d{17,20}$/.test(v);

/**
 * The ticket types shown in the panel dropdown, in display order.
 *
 *   label       – the bold title in the dropdown
 *   emoji       – the icon beside it (Unicode or "<:name:id>" for a custom emoji)
 *   description – the grey subtitle under the label (max 100 chars)
 *   blurb       – the one-liner listed in the panel embed body
 *   intro       – the welcome message posted inside the opened ticket
 *   teamLabel   – how this type's staff are labelled in transcripts
 *   categoryId  – category the ticket channel is created under (optional)
 *   staffRoleId – role granted access to this ticket type (optional)
 */
export const ticketTypes = {
  moderation: {
    key: 'moderation',
    label: 'Moderation Support',
    emoji: '🆘',
    description: 'Click on this option to create a Moderation Support Ticket',
    blurb: 'Report rule-breaking or get help from our moderation team.',
    intro:
      'Thanks for opening a **Moderation Support** ticket. Please describe the ' +
      'issue clearly — who or what is involved, what happened, and any evidence ' +
      '(screenshots, links, user IDs) — and a member of the moderation team will ' +
      'be with you shortly.',
    teamLabel: 'Moderation Team',
    categoryId: process.env.TICKETS_MODERATION_CATEGORY_ID ?? '',
    staffRoleId: process.env.TICKETS_MODERATION_ROLE_ID ?? '',
  },
  customer: {
    key: 'customer',
    label: 'Customer Support',
    emoji: '❗',
    description: 'Click on this option to create a Public Relations Ticket',
    blurb: 'Questions, public relations, or general assistance.',
    intro:
      'Thanks for opening a **Customer Support** ticket. Let us know how we can ' +
      'help and a member of our Public Relations team will be with you shortly.',
    teamLabel: 'Public Relations Team',
    categoryId: process.env.TICKETS_CUSTOMER_CATEGORY_ID ?? '',
    staffRoleId: process.env.TICKETS_CUSTOMER_ROLE_ID ?? '',
  },
  order: {
    key: 'order',
    label: 'Custom Order',
    emoji: '🎟️',
    description: 'Click on this option to create a Custom order Ticket',
    blurb: 'Request a custom order from our team.',
    intro:
      'Thanks for opening a **Custom Order** ticket. Please describe exactly what ' +
      'you would like, along with any details, references or deadlines, and our ' +
      'team will follow up with you here.',
    teamLabel: 'Orders Team',
    categoryId: process.env.TICKETS_ORDER_CATEGORY_ID ?? '',
    staffRoleId: process.env.TICKETS_ORDER_ROLE_ID ?? '',
  },
  highrank: {
    key: 'highrank',
    label: 'High Rank Support',
    emoji: '🎫',
    description: 'Click on this option to reach our HR Department!',
    blurb: 'Reach our HR department / high ranks directly.',
    intro:
      'Thanks for opening a **High Rank Support** ticket. This reaches our **HR ' +
      'Department** directly — please outline what you need and a high-ranking ' +
      'team member will respond as soon as possible.',
    teamLabel: 'HR Department',
    categoryId: process.env.TICKETS_HIGHRANK_CATEGORY_ID ?? '',
    staffRoleId: process.env.TICKETS_HIGHRANK_ROLE_ID ?? '',
  },
  expo: {
    key: 'expo',
    label: '2026 Expo Enrollment',
    emoji: '🚓',
    description: 'Click on this option to enroll in our 2026 expo!',
    blurb: 'Enroll in our 2026 Expo.',
    intro:
      'Thanks for your interest in the **2026 Expo**! Please share your enrollment ' +
      'details — who you are representing, what you would like to showcase, and ' +
      'any requirements — and our events team will get you signed up.',
    teamLabel: 'Events Team',
    categoryId: process.env.TICKETS_EXPO_CATEGORY_ID ?? '',
    staffRoleId: process.env.TICKETS_EXPO_ROLE_ID ?? '',
  },
};

// The panel header shown above the dropdown.
export const panel = {
  title: `${COMMUNITY_NAME} — Support`,
  intro:
    'Need a hand? Select the type of ticket you would like to open from the menu ' +
    'below and a private channel will be created just for you and our team.',
};

// Where closed-ticket transcripts + summaries are posted (optional).
export const transcriptChannelId = process.env.TICKETS_TRANSCRIPT_CHANNEL_ID ?? '';
