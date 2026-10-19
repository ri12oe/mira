@AGENTS.md

# Mira — project guide for Claude Code

Mira is a daily check-in app for older and disabled adults. A **caregiver** sets it up for the person they look after (the **taker**, e.g. "Lin"). Every day Mira asks the taker to check in (by text reply, a short phone call where they press 1, or a tap in the app). If they don't, Mira alerts the caregiver, then their backup contacts in order.

The front end for the **Welcome** and **Caregiver** sections is built. The current job is the **backend** for those sections. The "I'm checking in" (self) flow is out of scope for now.

## How to work with me

- I'm a CS student and I'm building this to learn. **Explain what you're doing and why, step by step**, in plain language. When there's a choice, tell me the options and your recommendation before doing a big change.
- Work in **small steps I can test**: one feature at a time, each ending with "how to try it" (what to run, what to tap, what I should see).
- **Ask before adding a dependency or creating a cloud resource** (a Supabase project, a Twilio number, anything that costs money).
- Never put secrets in the app or in git. Tell me where each secret goes.
- Before saying a task is done: run `npx tsc --noEmit` and `npx expo lint`, and tell me the result. The repo already has 1 type error (`src/hooks/use-theme.ts`, missing `@/constants/theme`) and 43 lint problems that existed before the backend work; don't add new ones.
- Suggest a commit message at the end of each step. Don't push unless I ask.

## Backend stack (decision — change this section if I pick something else)

- **Supabase**: Postgres database, Auth (phone number + SMS code), Row Level Security, Edge Functions (Deno/TypeScript), `pg_cron` for scheduled jobs, Realtime for live updates on the home screen.
- **Twilio**: sending SMS invites and check-in texts, receiving replies (webhook), and the press-1 phone call (Voice + TwiML).
- The app talks to Supabase with `@supabase/supabase-js` (works in Expo Go). Store the session with `expo-secure-store` or `@react-native-async-storage/async-storage`; check the Expo SDK 57 docs for the current recommended setup before installing.
- Only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` go in the app (`.env`, gitignored). The Supabase service-role key and all Twilio credentials live **only** in Edge Function secrets.
- Keep backend code in `supabase/` (`supabase/migrations/` for SQL, `supabase/functions/` for Edge Functions), managed with the Supabase CLI.
- **Delivery is in free/test mode** (decision, Oct 2026): US carriers require a registered number to text, which costs money, so Mira doesn't text or call for real yet. Sends are recorded with `test-…` ids. Invites go from the caregiver's own phone and the caregiver confirms the YES in the app (`confirm-invite`, refused once live). Real delivery turns on with the `SMS_MODE=live` Edge Function secret plus Twilio secrets; cheapest real option is voice calls only (no registration).

## The app today (what exists)

Expo SDK 57, Expo Router, React 19 with the React Compiler, TypeScript, Reanimated, react-native-svg. Routes are in `src/app/`; everything else is outside it.

**All data currently lives in memory** in `src/context/caregiver-setup.tsx` (`CaregiverSetupProvider` / `useCaregiverSetup()`), wrapped around the `<Stack>` in `src/app/_layout.tsx`. It's lost when the app restarts. The backend work is mostly: keep the screens, and make this context load from and save to Supabase.

Key types (in that file):
- `CaregiverSetupData`: the caregiver (`yourFirstName`, `yourPhone`, `yourEmail`, `yourPhotoUri`) plus the **first** taker (`firstName`, `phone`, `method`, `windowStart`, `windowEnd`, `extraMinutes`, `backups`, `paused`, `caregiverRelationship`).
- `Person`: extra takers added later from the home screen (`people[]`), with the same per-taker settings plus `days`.
- `Backup`: `{ id, name, phone, relationship, alertAfter }`, kept in alert order.
- `CheckInMethod = "text" | "call" | "app"`.
- Times are **minutes after midnight** (540 = 9:00 AM). Days are `0 = Monday … 6 = Sunday`.
- `displayName` falls back to `"they"`, which produces broken copy like "they checks in" and "If they doesn' check in" on Setup step 2. Fix the copy when touching those screens.

Screens and what each will need from the backend:

| Route | Screen | Backend need |
|---|---|---|
| `index` | Welcome | "Get started" → onboarding; "I already have an account" → **sign in** (today it wrongly goes to `whoUsesMira`) |
| `whoUsesMira` | Who is using Mira | Caregiver path only for now |
| `caregiverSetup1` | Step 1: who you care for, phone, check-in method | Saved as a draft taker |
| `caregiverSetup2` | Step 2: window, days, extra time | Saved on the taker |
| `caregiverSetup3` | Step 3: alert order, backups, invite text | **Send the invite SMS**; editable message, but "Reply YES to start." is always appended |
| `connected`, `connected2` | Connected (first taker / a taker added later) | Should only show once the taker **actually replied YES**; until then show a "waiting for reply" state |
| `caregiverHome`, `caregiverHomeNotCheckIn` | Home (checked in / missed) | Today's status, next check-in, this week |
| `checkInNow`, `waiting` | Check on Lin now / Waiting for Lin | **On-demand check-in**: send now, wait 15 min, alert only the caregiver |
| `caregiverHistory` | History | Real check-in history (today `src/utils/check-in-history.ts` **generates fake data**) |
| `caregiverPeople` | People | Takers and backups, add/edit/remove |
| `caregiverSetting` | Settings | Per-taker method, window, extra time, pause |
| `caregiverProfile` | Profile | Caregiver name, phone, email, photo (photo → Supabase Storage); account deletion not built yet |
| `helpAndSupport` | Help | Static for now |

## How Mira should behave (the rules the backend must follow)

1. **Invite**: after Step 3, text the taker the invite (`TEXT TO <phone>`). The taker replies **YES** to join. No app install for the taker. The text is sent as `Mira: <caregiver's message> Reply YES to start, or STOP to opt out.` (carriers require the sender name and opt-out; Twilio handles STOP). Limits: at most 3 invites per taker and 10 per caregiver per day.
2. **Daily check-in**, on each selected day, in the taker's **own time zone** (store an IANA zone per taker, e.g. `America/Indianapolis`; don't assume the caregiver's):
   - At window start, ask: a text ("Reply OK"), a call (press 1), or an in-app prompt, depending on `method`.
   - A reply/press/tap inside the window is **on time**; after the window but before alerts is **late**; no response is **missed**.
   - At window end with no check-in: send the taker a **gentle reminder**.
   - At window end + `extraMinutes` (default 30): **alert the caregiver** (text and call), then each backup in order after their own `alertAfter` delay.
   - A check-in at any point stops the escalation.
3. **Pause**: a paused taker gets no check-ins and nobody is alerted.
4. **Check in now** (on demand): send immediately by the chosen method; if no reply in **15 minutes**, alert **only the caregiver** (not backups). Those are the defaults; the Check in now screen lets the caregiver change the wait and add people to alert **for that one check-in** (kept on the check-in as `alert_contacts`). One open at a time per person, at most 10 a day.
5. **Privacy**: Mira only shares *whether* a check-in happened and when. Never message contents or location. (This promise is shown on the Who is using Mira screen.)
6. **Reliability matters more than features**: an alert that silently fails is the worst bug. Every send/alert should be logged with its status, and the scheduler must be safe to run twice (no double alerts).

## Suggested build order

Do these one at a time, and confirm with me before moving to the next:

1. **Setup**: Supabase project, CLI, `supabase/` folder, `.env` with the two public keys, a `src/lib/supabase.ts` client. Show me it connects.
2. **Sign in** for caregivers with phone + SMS code (Welcome "I already have an account", and the end of onboarding). Session persists across restarts.
3. **Database schema + RLS**: caregivers, takers, backups, invites, check-ins (one row per taker per scheduled day), alerts/sends log. A caregiver can only read and write their own rows. Explain each table to me.
4. **Save setup**: steps 1–3 write to the database; the context loads it on start. Keep the context's API (`update`, `addPerson`, `updatePerson`, …) so the screens barely change.
5. **Invite SMS + YES reply**: an Edge Function sends the invite through Twilio; an inbound-SMS webhook (verify Twilio's signature) marks the taker as joined; the Connected screen waits for it (Realtime).
6. **Scheduler**: `pg_cron` runs every minute and calls an Edge Function that sends due check-ins, reminders and alerts. Write it so running it twice can't double-send.
7. **Replies**: inbound SMS ("OK"/"YES") and the voice press-1 webhook record the check-in.
8. **Home and History** read real data; remove the fake generator.
9. **Check in now** + the Waiting screen.
10. **Push notifications** for the caregiver (needs a development build, not Expo Go; check the current Expo docs).

## Self flow ("I'm checking in") — backend build order

The self screens exist (`selfSetup*`, `selfHome`, `selfHistory`, `selfPeople`, `selfSetting`, `selfHelp`) but keep everything on the phone, so a missed check-in alerts nobody. Decisions (Oct 2026):
- A self user has a normal account and is **their own taker** (`takers.is_self`, at most one per account). Their phone is their verified sign-in number; they're active straight away (no invite).
- Escalation for a self user has **no caregiver step**: missed → their backups in order, each after their own delay. Backups must **say YES to an invite** before they're alerted.
- Check-ins run even if no backup has said yes yet; Home warns "Nobody will be alerted until a backup says yes".
- Self users check in with the **Mira app only** (push prompt + tap), which is real even in free mode.
- Start fresh on the server (don't import the on-phone `mira.selfCheckIns`). One account type per person for now.

Steps, one at a time:
1. **Schema**: `takers.is_self`, `backups.confirmed_at` (only the server sets it), `invites.backup_id`; tests.
2. **Sign-in**: self setup ends with the phone code; "I already have an account" routes self users to `selfHome`.
3. **Save setup** through the context / `save_taker`.
4. **Backup invites** (free mode: caregiver-style manual confirm); replace `mira.selfConfirmedBackups`.
5. **Scheduler**: push prompt/reminder to their own phone; missed → confirmed backups; all-clear.
6. **Check in**: `check_in_myself()`; History from the server; remove `mira.selfCheckIns`.
7. **Push**: permission during setup; tapping a reminder opens the check-in.
8. **Privacy / delete account** checks.

## Code conventions in this repo

- **Files**: screens in `src/app/` are camelCase (`caregiverSetup2.tsx`) and must have a default export. Components are kebab-case in `src/components/` (`bottom-sheet.tsx`), icons in `src/components/icons/`, hooks in `src/hooks/`, helpers in `src/utils/`. Put backend client code in `src/lib/` (or `src/services/`), never in `src/app/`.
- **Imports** use the `@/` alias for `src/`.
- **Text** uses `AppText` from `@/components/app-test`. Fonts: `FontFamily.*` is Bricolage Grotesque (headings), `FigtreeFont.*` is Figtree (body). Set the font family instead of `fontWeight`.
- **Colours** are constants at the top of each file: INK `#15163A`, SUBTITLE `#54566E`, PRIMARY `#4338CA`, BACKGROUND `#F5F4FA`, BORDER `#E6E4EF`, LILAC `#E7E4FB`, MINT `#DDF3EE`, SUN `#FFE8DB`, ORANGE `#C2551F`.
- **Hooks** must be called inside components, never at the top of a file.
- **Lint rules that bite (React Compiler)**: don't read `ref.current` during render (so no `useRef(new Animated.Value(0)).current`; use `useState(() => new Animated.Value(0))`), and don't call `setState` directly inside `useEffect`.
- **Animations**: shared helpers are in `src/hooks/use-entrance.ts` (`useEntrance`, `useLoop`, `useReduceMotion`, `EASE_OUT`, `EASE_POP`) and `src/components/rise.tsx`. Respect Reduce motion.
- **Bottom sheets** use `src/components/bottom-sheet.tsx` (slide up, fade, drag down to close).
- **Accessibility**: real `accessibilityRole` / `accessibilityLabel` on pressables, touch targets at least 44px. The users are older adults: clear words, big targets, no jargon in error messages.
- Don't create or edit `ios/` or `android/` by hand.

## Design reference

The approved designs are on the **Mira Redesign** canvas (https://claude.ai/artifact/7PRMA3m14eWJGUSdvNhUKj) and in Figma (file key `5MBkExqpjvKxLTUF6rk4Gg`). Match them for any new loading, error or "waiting for reply" states.