@AGENTS.md

# Mira — project guide for Claude Code

Mira is a daily check-in app for older and disabled adults. A **caregiver** sets it up for the person they look after (the **taker**, e.g. "Lin"). Every day Mira asks the taker to check in (by text reply, a short phone call where they press 1, or a tap in the app). If they don't, Mira alerts the caregiver, then their backup contacts in order.

The app is **built end to end** for all three account types: **caregivers**, people **checking in for themselves**, and **invited people** ("Someone invited me"), with a Supabase backend (see the build orders below, all done). Delivery runs in **free test mode** (see Backend stack). The current focus is **getting ready for real users**: see "What's next" at the end.

## How to work with me

- I'm a CS student and I'm building this to learn. **Explain what you're doing and why, step by step**, in plain language. When there's a choice, tell me the options and your recommendation before doing a big change.
- Work in **small steps I can test**: one feature at a time, each ending with "how to try it" (what to run, what to tap, what I should see).
- **Ask before adding a dependency or creating a cloud resource** (a Supabase project, a Twilio number, anything that costs money).
- Never put secrets in the app or in git. Tell me where each secret goes.
- Before saying a task is done: run `npx tsc --noEmit` and `npx expo lint`, and tell me the result. Both are at **0 errors and 0 problems** (Oct 2026); keep it that way. If `tsc` complains that a route like `"/selfHome"` isn't assignable, the typed-routes file is stale: run `npx expo start` once to regenerate it.
- For backend changes, run the matching SQL check in `supabase/tests/` (`npx supabase db query --linked -f supabase/tests/<name>.sql`) and add or update a check for anything new.
- Suggest a commit message at the end of each step. Don't push unless I ask.

## Backend stack (decision — change this section if I pick something else)

- **Supabase**: Postgres database, Auth (phone number + SMS code), Row Level Security, Edge Functions (Deno/TypeScript), `pg_cron` for scheduled jobs, Realtime for live updates on the home screen.
- **Twilio**: sending SMS invites and check-in texts, receiving replies (webhook), and the press-1 phone call (Voice + TwiML).
- The app talks to Supabase with `@supabase/supabase-js` (works in Expo Go). Store the session with `expo-secure-store` or `@react-native-async-storage/async-storage`; check the Expo SDK 57 docs for the current recommended setup before installing.
- Only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` go in the app (`.env`, gitignored). The Supabase service-role key and all Twilio credentials live **only** in Edge Function secrets.
- Keep backend code in `supabase/` (`supabase/migrations/` for SQL, `supabase/functions/` for Edge Functions), managed with the Supabase CLI.
- **Delivery is in free/test mode** (decision, Oct 2026): US carriers require a registered number to text, which costs money, so Mira doesn't text or call for real yet. Sends are recorded with `test-…` ids. Invites go from the caregiver's own phone and the caregiver confirms the YES in the app (`confirm-invite`, refused once live). Real delivery turns on with the `SMS_MODE=live` Edge Function secret plus Twilio secrets; cheapest real option is voice calls only (no registration).

## The app today (what exists)

Expo SDK 57, Expo Router, React 19 with the React Compiler, TypeScript, Reanimated, react-native-svg. Routes are in `src/app/`; everything else is outside it. The README has the full feature list and setup steps.

**Data**: everything is saved in Supabase. `src/context/caregiver-setup.tsx` (`CaregiverSetupProvider` / `useCaregiverSetup()`, wrapped around the `<Stack>` in `src/app/_layout.tsx`) loads the caregiver and their takers on start and saves through `save_taker` and the `caregivers` table; the screens use its API (`update`, `addPerson`, `updatePerson`, …). Auth state is in `src/context/auth.tsx`; other backend calls live in `src/lib/` (check-ins, invites, push, account, photos, invited) and the hooks in `src/hooks/` (`use-alerts`, `use-invite`, `use-check-in-now`, `use-people-today`, `use-taker-activity`).

Key types (in `caregiver-setup.tsx`):
- `CaregiverSetupData`: the caregiver (`yourFirstName`, `yourPhone`, `yourEmail`, `yourPhotoUri`) plus the **first** taker (`firstName`, `phone`, `method`, `windowStart`, `windowEnd`, `extraMinutes`, `backups`, `paused`, `caregiverRelationship`).
- `Person`: extra takers added later from the home screen (`people[]`), with the same per-taker settings plus `days`.
- `Backup`: `{ id, name, phone, relationship, alertAfter }`, kept in alert order.
- `CheckInMethod = "text" | "call" | "app"`.
- Times are **minutes after midnight** (540 = 9:00 AM). Days are `0 = Monday … 6 = Sunday`. Each taker has an IANA `time_zone`.
- `displayName` falls back to `"they"`; check the grammar of any sentence that uses it ("They check in", not "they checks in").

Screens:

| Who | Routes |
|---|---|
| Everyone | `index` (Welcome), `whoUsesMira`, `signIn`, `verifyCode` |
| Caregiver setup | `caregiverSetup1`–`3`, then `connected` (first person) / `connected2` (someone added later) |
| Caregiver app | `caregiverHome`, `caregiverHistory`, `caregiverPeople`, `caregiverSetting`, `caregiverProfile`, `helpAndSupport`, `checkInNow`, `waiting` |
| Self setup | `selfSetupindex` (intro, with Dot), `selfSetup1`–`3`, `selfSetup4` (practice run), `selfSetup5` (you're all set) |
| Self app | `selfHome`, `selfHistory`, `selfPeople`, `selfSetting`, `selfHelp` |
| Invited person | `invited`, `invitedHome`, `invitedSetting` |

Backend: `supabase/migrations/` (schema, Row Level Security on every table, `security definer` functions with a fixed `search_path`, the scheduler), `supabase/functions/` (`send-invite`, `confirm-invite`, `deliver-sends`, `twilio-inbound`, `twilio-voice`, `twilio-status`, `delete-account`; shared code in `_shared/`), `supabase/tests/` (SQL checks).

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

## Caregiver backend — build order (all done, Oct 2026)

Kept as a record of how it was built:

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

All 8 are done (Oct 2026), plus "Reminder sound" per phone (`push_tokens.reminder_sound`).

## Invited person ("Someone invited me") — build order

Someone a caregiver set up (e.g. Lin) can use the Mira app to check in, instead of only texts/calls. Design: the **CheckIn** and **CheckInDone** artboards on the canvas (`SelfIntro` → "Someone invited me" → `CheckIn`). Decisions (Oct 2026):
- They sign in with **the phone number they were invited on** + the SMS code. **Signing in counts as their YES**: the code proves they own the number, the same proof as a YES text. A number nobody invited gets a plain "We don't have an invite for this number".
- It's a third account type: an account with **no takers of its own** whose verified phone matches one or more takers' phone. One tap checks in **for every caregiver** who set them up with that number ("Tap once to let Jordan and Maya know").
- They see only what they need: their own day, their window, and the first names (and, for "Call Jordan" / "I need help", the phone numbers) of the caregivers who set them up. Never the caregivers' other people, backups or history. Everything goes through `security definer` functions keyed on the caller's verified phone; no table access.
- **Backups too** (decision B): a self user's backup who taps "Someone invited me" and signs in with the invited number is **confirmed** the same way (their YES), and sees "You're Ana's backup ✓". `join_as_invited()` returns `{ checks_in_for, backup_for }`. A caregiver's backups have no invite, so they get "We don't have an invite".
- Asking them: if their caregiver chose **Mira app** for them, the prompt and reminder are pushes to *their* phone (today they're only logged). If the caregiver chose text or call, that stays the way they're asked; a tap in the app still counts.

Steps, one at a time:
1. **Server**: `join_as_invited()` (accepts the pending invite(s) for the caller's number), `my_invited_day()` (today's check-in(s), window, caregivers' names/numbers), `check_in_as_invited()` (records for every taker with the caller's number, server clock); tests.
2. **Sign-in and routing**: "Someone invited me" → phone → code (creates the account) → join → their Home (CheckIn); "I already have an account" routes invited people there too; their own protected screens.
3. **CheckIn screen** from the design: I'm okay → Thanks (CheckInDone), Call [caregiver], I need help; live status; no flash.
4. **Push**: prompts/reminders for "Mira app" takers go to the invited person's phone(s); turn on reminders; tapping opens the check-in.
5. **Settings-lite, privacy and delete**: sign out, delete account (their own account only; the caregiver's setup stays), privacy tests.

All 5 are done (Oct 2026). Push (step 4): `invited_push_targets(send)` finds her own sign-ins; two caregivers asking at once buzz her phone once; not signed in anywhere is logged as **failed**, not sent. Delete (step 5): only her own sign-in and phones go; caregivers who chose "Mira app" for her get a push (`invited_leaving`) to switch her to text or call. Settings is `invitedSetting` (her check-ins read-only).

## What's next (getting ready for real users)

Do these in order, one at a time, and confirm with me before moving on:

1. **Cleanup** (done Oct 2026): README and this file updated; Mira icon, Android icons, splash (`#F5F4FA`) and favicon; app name "Mira"; iOS `bundleIdentifier` `com.rios0.mira` (same as the Android package; it can't change once the app is published); Expo template images and `scripts/reset-project.js` removed; `userInterfaceStyle: "light"` because there's no dark mode yet.
2. **Landing page** (a separate small website): what Mira is, how it works, and **Privacy policy, Terms, and an SMS consent page** (what texts Mira sends, how often, "Reply STOP to opt out", "Msg & data rates may apply"). Twilio's A2P 10DLC registration and both app stores require these to be public.
3. **Go live in two stages**: first **voice calls only** (`SMS_MODE=live` with calls; no carrier registration needed), then register for texting using the landing page.
4. **Safety net**: GitHub Actions running `tsc`, lint and the SQL checks (against a local `supabase start`) on every push; monitoring so we hear about it if `pg_cron` stops or sends keep failing (a heartbeat check and error reporting such as Sentry).
5. **Real-world testing** with 2–3 families, including an older adult using it alone. Hold off on new features until then.
6. Later: split the biggest screens (`caregiverHome.tsx` is 1,100+ lines) and share components between the caregiver and self screens, which nearly mirror each other.

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