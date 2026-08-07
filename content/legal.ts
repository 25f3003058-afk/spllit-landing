/**
 * Legal copy.
 *
 * Written against what this codebase actually does — every clause below maps to
 * a real behaviour (a Prisma field, a route, a middleware), not to a template.
 * Where a feature is planned but not built, it says so rather than reserving
 * rights over something that does not exist.
 *
 * This is not legal advice and has not been reviewed by a lawyer. Before
 * Spllit takes money or opens beyond a pilot, it needs review by someone
 * qualified in Indian consumer, IT and data-protection law (the DPDP Act 2023
 * in particular).
 */

export const LEGAL_UPDATED = '8 August 2026';

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export const TERMS: LegalSection[] = [
  {
    heading: 'Who this agreement is between',
    paragraphs: [
      'These terms govern your use of Spllit — the website, the app, and the services reachable through them. By creating an account you accept them.',
      'Spllit is a student travel-coordination platform. We connect people travelling the same way. We are not a transport provider, we do not employ drivers, and we do not own or operate any vehicle.',
    ],
  },
  {
    heading: 'Who can use Spllit',
    bullets: [
      'You must be 18 or older, or have the consent of a parent or guardian.',
      'You must sign in with a genuine Google account or phone number. One person, one account.',
      'Some features — creating and joining rides — require a verified institute email address. We check the domain against the institute you selected.',
      'You may not use Spllit if we have previously removed your account.',
    ],
  },
  {
    heading: 'Rides, squads and what we are responsible for',
    paragraphs: [
      'Spllit is an introduction service. When you join a ride or a squad, you are making an arrangement with another user, not with us.',
      'We do not vet drivers, verify licences, inspect vehicles, or check insurance. We verify that an account holds an institute email address — nothing more. Treat every arrangement with the caution you would apply to travelling with someone you met through a noticeboard.',
      'You are responsible for your own safety. Share your trip, meet in public, and stop if something feels wrong.',
    ],
    bullets: [
      'We do not guarantee that anyone will offer a ride, accept your request, or arrive.',
      'We do not set or collect fares. Any money that changes hands is between you and the other person.',
      'We are not liable for loss, injury, delay or damage arising from a journey arranged through Spllit, except where that liability cannot be excluded by law.',
    ],
  },
  {
    heading: 'Money',
    paragraphs: [
      'Spllit is currently free. We do not process payments, hold funds, or take a commission — there is no payment provider connected to this service today.',
      'If that changes, we will say so before any charge is made, and you will be asked to agree to the terms that apply to it.',
    ],
  },
  {
    heading: 'Your content and conduct',
    bullets: [
      'You keep ownership of what you post. You grant us the licence needed to display it inside Spllit to the people you shared it with.',
      'Do not post anything unlawful, harassing, or deliberately misleading, and do not impersonate anyone.',
      'Do not use Spllit to advertise a commercial taxi service, to collect other users’ data, or to run automated requests against our systems.',
      'We may remove content or suspend an account that breaks these rules. Where it is safe and lawful to do so, we will tell you why.',
    ],
  },
  {
    heading: 'Location sharing',
    paragraphs: [
      'Live location is opt-in and scoped to a single squad while you have that squad open. Closing the screen stops the broadcast. Leaving a squad clears the last position we held for you in it.',
      'We keep a coarse home location if you set one, so that "nearby" searches work when live location is off. You can change or remove it in your profile.',
    ],
  },
  {
    heading: 'Ending the agreement',
    bullets: [
      'You may stop using Spllit at any time and ask us to delete your account.',
      'We may suspend or close an account that breaks these terms, or where we are required to by law.',
      'Some records survive account deletion where we are legally required to keep them, or where they belong to someone else — a message you sent to another user remains in their conversation.',
    ],
  },
  {
    heading: 'Changes',
    paragraphs: [
      'We will update these terms as Spllit changes. Material changes will be announced in the app before they take effect. Continuing to use Spllit after that means you accept the new version.',
    ],
  },
  {
    heading: 'Law',
    paragraphs: [
      'These terms are governed by the laws of India, and the courts of Chennai, Tamil Nadu have exclusive jurisdiction.',
    ],
  },
];

export const PRIVACY: LegalSection[] = [
  {
    heading: 'What we collect',
    bullets: [
      'Identity: your name, email address, and — if you sign in that way — your phone number, from Google or Firebase phone sign-in.',
      'Profile: username, college, institute email, gender, date of birth, photo, and bio, as you provide them.',
      'Location: live position while you have a squad open and sharing switched on; a coarse home location if you set one; pickup and destination points for trips you create.',
      'Usage: rides and squads you create or join, messages you send, and notifications generated for you.',
      'Technical: IP address and user agent, in server logs and rate-limiting counters.',
    ],
  },
  {
    heading: 'What we do not collect',
    bullets: [
      'We do not use advertising cookies or cross-site trackers.',
      'We do not sell personal data to anyone, for any purpose.',
      'We do not store your password when you sign in with Google or phone — there is no password on those accounts. Where a password exists, it is stored only as a bcrypt hash and cannot be read back.',
      'We do not read your device contacts, camera roll, or messages.',
      'Analytics is not switched on. The Firebase analytics SDK is deliberately not initialised.',
    ],
  },
  {
    heading: 'How your phone number is stored',
    paragraphs: [
      'Your phone number is stored twice and for different reasons: once in readable form so it can be shown to you and to people you are actively travelling with, and once as a salted one-way hash used to detect duplicate accounts. The hash cannot be reversed into a number.',
    ],
  },
  {
    heading: 'Who can see what',
    bullets: [
      'Your name, username, photo, college and rating are visible to other Spllit users.',
      'Your email address, phone number and institute email are not shown on your public profile.',
      'Live location is visible only to members of the squad you are sharing with, and only while you are sharing.',
      'Messages are visible to the people in that conversation. We do not read them except where we must to investigate a report or comply with the law.',
    ],
  },
  {
    heading: 'Cookies and local storage',
    paragraphs: [
      'Strictly necessary storage keeps you signed in. It is not optional — without it the app cannot tell who you are — and it is exempt from consent under ePrivacy rules.',
      'Everything else is asked for: remembering dismissed banners and your invite link (preferences), and usage measurement (analytics, currently unused). You can accept, reject, or choose per category, and change your mind by clearing site data.',
    ],
  },
  {
    heading: 'Third parties we share with',
    bullets: [
      'Google Firebase — authentication (Google sign-in, phone OTP) and push tokens.',
      'MongoDB Atlas — the database where your account and activity are stored.',
      'Mapbox — geocoding, map tiles and directions. Coordinates are sent to compute a route or resolve a place name.',
      'Cloudflare and Vercel — hosting and delivery.',
      'We share what those services need to do their job, and nothing more. None of them is permitted to use your data for their own purposes.',
    ],
  },
  {
    heading: 'How long we keep it',
    paragraphs: [
      'Account and profile data is kept while your account exists. Live positions are short-lived and cleared when you stop sharing or leave a squad. Server logs are retained for a limited period for security and debugging.',
    ],
  },
  {
    heading: 'Your rights',
    paragraphs: [
      'Under India’s Digital Personal Data Protection Act 2023 — and under GDPR if you are in the EU/UK — you can ask for a copy of your data, ask us to correct it, or ask us to delete it. Write to the address below and we will respond within 30 days.',
    ],
  },
  {
    heading: 'Security',
    bullets: [
      'Passwords, where they exist, are hashed with bcrypt. They are never stored or logged in readable form.',
      'Sign-in endpoints are rate limited, and repeated failed attempts against one account trigger a temporary lockout.',
      'Sign-in failures return the same message whether the account exists or not, so the response cannot be used to discover who has an account.',
      'Traffic is served over HTTPS. No system is perfectly secure, and we will tell affected users promptly if a breach puts their data at risk.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: [
      'Questions, or a request about your data: spllittech@gmail.com',
    ],
  },
];
