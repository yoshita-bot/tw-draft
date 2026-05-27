/**
 * Rich demo data — a small workspace where the user has very few projects
 * but each task is packed with descriptions, checklists, and attachments.
 * Accessible via ?rich URL param.
 */
import type { Project } from './mockProjects'

const YR = { name: 'Yoshita R.', initials: 'YR', color: '#0863C9' }
const AT = { name: 'Alex T.',    initials: 'AT', color: '#10B981' }
const SK = { name: 'Sam K.',     initials: 'SK', color: '#F59E0B' }

export const richProjects: Project[] = [
  {
    id: 'r1',
    name: 'Brand Launch 2026',
    color: '#0863C9',
    seconds: 9000,
    pendingTasks: 1,
    waitingTasks: 0,
    inProgressTasks: 1,
    overdueTasks: 0,
    totalTasks: 3,
    pinned: true,
    secondsToday: 3600,
    secondsThisWeek: 7200,
    lastWorkedAt: '2026-05-21',
    deadline: '2026-06-15',
    tasks: [
      {
        id: 'r1t1',
        name: 'Messaging & Positioning Doc',
        description:
          'Define the core brand narrative, value proposition, and tone of voice for the 2026 launch. This document will be the single source of truth for all marketing, sales, and product collateral going forward.\n\nBackground: The current messaging was written in 2023 and no longer reflects the product direction or the audience shift we have seen over the past 18 months. Customer interviews from Q4 2025 revealed that prospects consistently misunderstand what differentiates us from Competitor A and Competitor B — this needs to be addressed directly in the positioning.\n\nScope: The document should cover (1) a one-sentence positioning statement, (2) a 3-paragraph brand story for the website hero, (3) tone-of-voice guidelines with do/don\'t examples, (4) key differentiators ranked by customer importance, and (5) approved vocabulary — words we use and words we avoid.\n\nAcceptance criteria: Signed off by Head of Marketing, CEO, and Head of Sales before anything goes to design or copywriting. Must be accessible in Notion so all teams can reference it.',
        seconds: 5400,
        secondsToday: 1800,
        secondsThisWeek: 5400,
        deadline: '2026-05-28',
        assignee: YR,
        members: [AT, SK],
        status: 'in-progress',
        priority: 'urgent',
        checklist: [
          { label: 'Audit existing messaging across all channels', done: true },
          { label: 'Conduct 5 customer interviews', done: true },
          { label: 'Draft positioning statement (v1)', done: true },
          { label: 'Internal review with leadership', done: false },
          { label: 'Incorporate feedback and finalise', done: false },
          { label: 'Share with design team for visual alignment', done: false },
        ],
        attachments: [
          { id: 'a1', type: 'link', value: 'https://docs.google.com/document/d/brand-messaging-v3' },
          { id: 'a2', type: 'link', value: 'https://www.notion.so/competitor-analysis-2026' },
        ],
        createdAt: '2026-05-01',
      },
      {
        id: 'r1t2',
        name: 'Launch Day Social Media Plan',
        description:
          'Plan and schedule all organic social content across Instagram, LinkedIn, and X for launch week (June 9–15). Each platform has a different audience and content style — do not cross-post the same copy verbatim.\n\nInstagram: Focus on visual storytelling. We want 3 feed posts (product reveal, team behind-the-scenes, customer quote) and 5 Stories (countdown, poll, swipe-up to blog). Reels are a stretch goal if capacity allows.\n\nLinkedIn: Professional tone, thought leadership angle. 2 long-form posts from the founder\'s personal account + 2 company page posts. Avoid jargon. The audience here includes potential enterprise buyers and press.\n\nX: Fast-moving, conversational. Pre-schedule 8 tweets across launch day. Include one thread explaining the backstory of why we built this. Engage with replies for the first 3 hours post-launch — someone needs to be on call.\n\nDependencies: All copy needs design-approved visuals before scheduling. Asset briefs must be sent to design by May 26 at the latest to allow 10 working days. Use Buffer for scheduling — credentials in 1Password under "Social Media".',
        seconds: 2700,
        secondsToday: 1800,
        secondsThisWeek: 2700,
        deadline: '2026-06-01',
        assignee: AT,
        members: [YR],
        status: 'todo',
        priority: 'high',
        checklist: [
          { label: 'Define content themes per platform', done: false },
          { label: 'Write copy for 10 posts (Instagram)', done: false },
          { label: 'Write copy for 6 posts (LinkedIn)', done: false },
          { label: 'Write copy for 8 posts (X)', done: false },
          { label: 'Brief designer on visual assets needed', done: false },
          { label: 'Schedule content in Buffer', done: false },
          { label: 'Set up monitoring & response rota', done: false },
        ],
        attachments: [
          { id: 'a3', type: 'link', value: 'https://trello.com/b/social-launch-calendar' },
        ],
        createdAt: '2026-05-05',
      },
      {
        id: 'r1t3',
        name: 'Press Release & Media Outreach',
        description:
          'Draft and distribute the official press release for the June 15 launch. The release should lead with the problem we solve, not the product features — journalists receive hundreds of feature-first releases and ignore them.\n\nStructure: Hook (1 paragraph, news angle), What it is (1 paragraph, plain English), Why now (market context, 1 paragraph), Quote from CEO, Quote from an early customer (get approval from 2 customers beforehand), Boilerplate, Contact details.\n\nMedia list: We are targeting tier-1 tech publications (TechCrunch, The Verge, Wired), vertical publications in our two key industries, and 5–6 individual journalists who have covered our competitors. Research each journalist\'s last 3 articles before outreach — reference something specific in the email. Generic pitches will not work.\n\nEmbargo: Send to tier-1 under embargo on June 10, lifting June 15 at 9am EST. Make sure the embargo terms are clearly stated in the email and get a reply confirming they accept.\n\nLegal note: All quotes and statistics must be approved by legal before sending. Allow 48 hours for legal turnaround — do not leave this until the last minute.',
        seconds: 900,
        secondsToday: 0,
        secondsThisWeek: 900,
        deadline: '2026-06-10',
        assignee: SK,
        members: [YR, AT],
        status: 'todo',
        priority: 'medium',
        checklist: [
          { label: 'Research target publications and journalists', done: true },
          { label: 'Draft press release (v1)', done: false },
          { label: 'Legal review of press release', done: false },
          { label: 'Finalise media list (top 20)', done: false },
          { label: 'Personalise outreach emails', done: false },
          { label: 'Send embargo to tier-1 media', done: false },
          { label: 'Follow-up sequence (Day 2 & Day 5)', done: false },
        ],
        attachments: [
          { id: 'a4', type: 'link', value: 'https://docs.google.com/spreadsheets/d/media-list-2026' },
          { id: 'a5', type: 'link', value: 'https://drive.google.com/press-release-draft' },
        ],
        createdAt: '2026-05-10',
      },
    ],
  },
  {
    id: 'r2',
    name: 'Client Onboarding Revamp',
    color: '#31ADAC',
    seconds: 4500,
    pendingTasks: 0,
    waitingTasks: 1,
    inProgressTasks: 1,
    overdueTasks: 0,
    totalTasks: 2,
    pinned: false,
    secondsToday: 900,
    secondsThisWeek: 3600,
    lastWorkedAt: '2026-05-20',
    deadline: '2026-07-01',
    tasks: [
      {
        id: 'r2t1',
        name: 'Redesign Welcome Email Sequence',
        description:
          'Rewrite the full 5-email onboarding sequence triggered when a new user signs up. Current open rates drop sharply after Email 2 and our 7-day activation rate is 31% — industry benchmark is 52%. The sequence is the single biggest lever we have to close this gap before we invest in any paid acquisition.\n\nEmail 1 (send immediately on signup): Welcome + one quick win they can do in under 2 minutes. Do not overwhelm. Subject line must not start with "Welcome to" — it\'s the most ignored subject line pattern in SaaS.\n\nEmail 2 (Day 1): Feature spotlight on the one feature that correlates most strongly with retention (check with data team — currently believed to be the dashboard templates). Include a 60-second Loom walkthrough. Keep copy under 150 words.\n\nEmail 3 (Day 3): Social proof. Use a real customer story, ideally from the same industry as the recipient if we can segment by that. One quote, one measurable outcome, one CTA to try the same workflow.\n\nEmail 4 (Day 5): Advanced tip for power users. Segment: only send to users who have logged in at least twice. Users who haven\'t logged in go into a separate re-engagement branch.\n\nEmail 5 (Day 7): Check-in from a real person (use CS team sender name, not the brand). Offer a 15-min onboarding call. This email has the highest reply rate potential — make it feel human.\n\nTechnical notes: All emails must be built in Mailchimp. UTM parameters required on every CTA link. Test send to QA alias before activating any flow.',
        seconds: 3600,
        secondsToday: 900,
        secondsThisWeek: 3600,
        deadline: '2026-06-05',
        assignee: YR,
        members: [SK],
        status: 'in-progress',
        priority: 'high',
        checklist: [
          { label: 'Audit current open & click rates per email', done: true },
          { label: 'Identify drop-off points in current sequence', done: true },
          { label: 'Write Email 1 — Welcome & quick win', done: true },
          { label: 'Write Email 2 — Key feature spotlight', done: false },
          { label: 'Write Email 3 — Social proof & case study', done: false },
          { label: 'Write Email 4 — Advanced tips', done: false },
          { label: 'Write Email 5 — Check-in & support offer', done: false },
          { label: 'A/B test subject lines in staging', done: false },
          { label: 'Sign off from head of customer success', done: false },
        ],
        attachments: [
          { id: 'a6', type: 'link', value: 'https://app.mailchimp.com/campaigns/onboarding-v2' },
          { id: 'a7', type: 'link', value: 'https://docs.google.com/document/d/email-copy-drafts' },
          { id: 'a8', type: 'link', value: 'https://www.notion.so/onboarding-analytics-q1' },
        ],
        createdAt: '2026-05-08',
      },
      {
        id: 'r2t2',
        name: 'Update In-App Onboarding Checklist',
        description:
          'Revise the in-app onboarding checklist that surfaces inside the product for new users during their first 7 days. This is a collaborative workstream between Growth, Product, and Engineering — you are the DRI for content and copy; the product team owns implementation.\n\nBackground: The current checklist has 9 steps, was written 18 months ago, and references three features that no longer exist in their original form (the "Quick Import" wizard was merged into the main data panel, "Invite a colleague" moved to Account Settings, and "Set your timezone" is now auto-detected). Users are completing an average of 2.3 out of 9 steps, which tanks our activation metric. Research from the last user cohort suggests the steps feel either too obvious or too advanced with nothing in the middle — there is no clear "aha moment" step.\n\nNew checklist structure (proposed — confirm with product team before writing copy): (1) Connect your first data source, (2) Create a workspace for your team, (3) Set up your first project and add a task, (4) Run your first report, (5) Invite a teammate, (6) Enable notifications. Six steps, ordered by correlation to 30-day retention (the data team ran this analysis in March — link in Notion). Step 3 is the retention inflection point: users who complete it have 4× higher 90-day retention. This should be called out visually in the UI — discuss with product designer whether to badge it "Most important" or highlight it differently.\n\nCopy requirements: Each step needs (a) a one-line label (max 8 words), (b) a tooltip or sub-label of 1–2 sentences explaining why the step matters, not just what to do, (c) a primary CTA button label (verb-first, max 4 words), and (d) a "Skip for now" option on all non-critical steps. Tone: encouraging, not instructional. Write as if a knowledgeable colleague is guiding the user, not as a manual.\n\nAlignment with email sequence: Steps 1–3 should mirror Email 1 and Email 2 content so users who click through from email land in a familiar context. Step 4 (report) aligns with Email 3. Steps 5–6 align with Email 4 and Email 5. This cross-channel consistency is intentional — confirm the mapping before finalising any copy.\n\nEngineering handoff: Provide a spec doc (Notion page, not a Slack message) that includes: step ID, label text, tooltip text, CTA label, skip behaviour (yes/no), completion trigger (what API event marks it done), and the Figma link for each step\'s visual state. Engineering estimates 3–4 days of implementation time once spec is locked. QA will need a staging environment with a fresh account to test the full flow end-to-end.\n\nSuccess metric: 7-day checklist completion rate ≥ 55% (up from current 26%). Track per-step drop-off from day one of rollout. If step completion falls below 40% for any individual step, flag for copy revision within the first two weeks.',
        seconds: 900,
        secondsToday: 0,
        secondsThisWeek: 0,
        deadline: '2026-06-20',
        assignee: AT,
        members: [YR, SK],
        status: 'review',
        priority: 'medium',
        checklist: [
          { label: 'Map current checklist steps to feature usage data', done: true },
          { label: 'Propose new 6-step checklist with product team', done: true },
          { label: 'Write microcopy for each step', done: true },
          { label: 'Handoff to engineering for implementation', done: false },
          { label: 'QA in staging environment', done: false },
          { label: 'Monitor completion rate after rollout', done: false },
        ],
        attachments: [
          { id: 'a9', type: 'link', value: 'https://www.figma.com/file/onboarding-checklist-v2' },
          { id: 'a10', type: 'link', value: 'https://linear.app/issues/onboarding-revamp' },
        ],
        createdAt: '2026-05-12',
      },
    ],
  },
]
