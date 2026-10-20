# Mira

Mira is a daily check-in app for older and disabled adults. Each day Mira asks the person to check in: a text reply, a short phone call where they press 1, or one tap in the app. If they don't, Mira alerts the people they chose, in order. Mira only shares *whether* a check-in happened, never messages or location.

Built with [Expo](https://expo.dev) and React Native (iOS, Android and web), with a [Supabase](https://supabase.com) backend and [Twilio](https://www.twilio.com) for texts and calls.

## Who it's for

Mira has three kinds of account:

| Account | Who | How they use Mira |
|---|---|---|
| **Caregiver** | Someone looking after a family member (e.g. Jordan, for his mom Lin) | Sets Mira up for one or more people, sees each day's check-in, gets alerted if one is missed |
| **Checking in for myself** | Someone who wants their own daily check-in | Taps "I'm okay" in the app each day; their backups are alerted if they miss it |
| **Invited person** | Someone a caregiver set up (e.g. Lin) | Signs in with the number they were invited on and checks in with one tap, for every caregiver at once |

## Features

**Caregivers**
- Three-step setup: who you care for and how they check in; their window, days and extra time before alerts; who to alert and in what order.
- An invite text ("Reply YES to start"); Mira only starts once they say yes.
- Home with today's status, the next check-in and the week; History by month; People, Settings and Profile.
- More than one person per caregiver, each with their own method, window, days, extra time and pause.
- **Check in now**: ask for a check-in at any time, then wait for the reply.
- Push notifications for check-ins, misses and replies.

**Checking in for myself**
- Setup with a practice check-in, a daily time and backups who must say yes before they're alerted.
- A big "I'm okay" button, reminders with an optional sound, History, People, Settings and Help.

**Invited people**
- Signing in with the invited number counts as their YES.
- One tap checks in for every caregiver who set them up, plus "Call" and "I need help".

**Everyone**
- Phone number sign-in with an SMS code; accounts persist across restarts.
- Account deletion that removes only that person's own data.
- Large touch targets, clear wording, screen-reader labels, and animations that respect Reduce motion.

## How the daily check-in works

1. At the start of the person's window (in **their** time zone), Mira asks them by their chosen method.
2. A reply in the window is **on time**; after the window but before alerts is **late**; no reply is **missed**.
3. At the end of the window, Mira sends a gentle reminder.
4. After the extra time (30 minutes by default), Mira alerts the caregiver, then each backup in order after their own delay.
5. A check-in at any point stops the alerts. A paused person gets no check-ins.

Every minute, `pg_cron` runs `scheduler_tick()`, which decides what's due, then calls the `deliver-sends` Edge Function, which sends it. Each send has a unique `dedupe_key` and is claimed with `for update skip locked`, so the scheduler can run twice without sending anything twice.

## Delivery mode

Texting from a US number requires carrier registration (A2P 10DLC), which costs money, so **Mira runs in free test mode by default**: sends are recorded with `test-…` ids instead of reaching a phone. Invites go from the caregiver's own phone, and the caregiver confirms the YES in the app. Self and invited users' app check-ins and push notifications are real in both modes.

Real texts and calls turn on with the `SMS_MODE=live` Edge Function secret plus the Twilio secrets below.

## Tech stack

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) with [Expo Router](https://docs.expo.dev/router/introduction) (file-based routing, typed routes), React 19, React Native 0.86, React Compiler, TypeScript
- Reanimated and Gesture Handler for animation and gestures, `react-native-svg` for icons and the mascot (Dot)
- Figtree and Bricolage Grotesque via `@expo-google-fonts`
- Supabase: Postgres with Row Level Security, phone Auth, Edge Functions (Deno), `pg_cron`, Realtime, Storage (profile photos)
- Twilio: SMS, voice calls (press 1), delivery status webhooks
- Expo push notifications (`expo-notifications`)

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) (LTS)
- A [Supabase](https://supabase.com) project and the [Supabase CLI](https://supabase.com/docs/guides/cli) (`npx supabase`)
- An iOS simulator, Android emulator, or a device. Push notifications need a [development build](https://docs.expo.dev/develop/development-builds/introduction/), not Expo Go.

### 1. Install and configure the app

```bash
npm install
cp .env.example .env
```

Fill in `.env` from Supabase → Project Settings → API. Only these two public values go in the app; never put the service-role key here.

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

### 2. Set up the backend

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push                     # applies supabase/migrations
npx supabase functions deploy            # deploys supabase/functions
```

Edge Function secrets (`npx supabase secrets set NAME=value`):

| Secret | Needed for |
|---|---|
| `MIRA_CRON_SECRET` | Lets only the scheduler call `deliver-sends` (also stored in Vault, below) |
| `EXPO_ACCESS_TOKEN` | Sending push notifications |
| `SMS_MODE` | `live` for real texts and calls; leave unset for test mode |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | Live mode, and checking that webhooks really come from Twilio |
| `TWILIO_FROM_NUMBER` or `TWILIO_MESSAGING_SERVICE_SID` | Live mode: the number or service Mira sends from |

The scheduler reads two values from Supabase **Vault**: `project_url` (your project's URL) and `mira_cron_secret` (the same value as `MIRA_CRON_SECRET`).

In live mode, point your Twilio number's webhooks at the `twilio-inbound` (messages), `twilio-voice` (calls) and `twilio-status` (delivery status) functions. All three check Twilio's signature.

### 3. Run it

```bash
npx expo start
```

## Scripts and checks

| Command | What it does |
|---|---|
| `npm start` | Start the Expo dev server |
| `npm run android` / `npm run ios` / `npm run web` | Start and open on that platform |
| `npm run lint` | Lint with ESLint (`expo lint`) |
| `npx tsc --noEmit` | Type-check |

Backend tests are SQL scripts in `supabase/tests/`. Each runs inside a transaction that is rolled back, so nothing is kept, and prints `ALL CHECKS PASSED` or names the failed check:

```bash
npx supabase db query --linked -f supabase/tests/security-check.sql
```

They cover security (people can't see each other's data), privacy, the scheduler (a whole day replayed minute by minute), replies, invites, Check in now, push tokens, account deletion, and the self and invited flows.

## Project structure

```
src/
  app/          Screens (Expo Router); each file is a route
  components/   Shared UI (bottom sheet, heroes, Dot, pickers, icons in icons/)
  context/      Caregiver setup state, loaded from and saved to Supabase; auth
  hooks/        Data and animation hooks (alerts, invites, check-ins, use-entrance)
  lib/          Supabase client, auth, check-ins, invites, push, account
  utils/        Time, dates, phone numbers, history helpers
  constants/    Fonts and check-in windows
supabase/
  migrations/   Database schema, security rules and scheduler (SQL)
  functions/    Edge Functions: send-invite, confirm-invite, deliver-sends,
                twilio-inbound, twilio-voice, twilio-status, delete-account
  tests/        SQL checks
assets/images/  App icon, Android icons, splash and favicon
```

## License

See [LICENSE](LICENSE).
