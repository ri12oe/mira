# Mira demo script

A live demo of about 4 minutes on two phones, plus a backup recording in case
anything fails on the day. Demo accounts and how to reset them are in the
README's **Demo** section.

| Phone | Signed in as | Number | Shows |
|---|---|---|---|
| **A** (caregiver) | Jordan | +1 312 555 0101 | Home with Lin and Mo, History, the **Demo** button |
| **B** (person checking in) | Mo, Jordan's dad | +1 312 555 0103 | Mo's check-in screen ("I'm okay") |

Why Mo for the live part: Mo checks in with the Mira app, so his asks and
reminders are real notifications that make phone B buzz. Lin is on text, and
texts are only logged in test mode (her card says "Texting is off…").

---

## Before the demo

**The day before**
- [ ] Both phones have the current development build (SDK 58), not Expo Go: push only works in a development build.
- [ ] Test codes are set and not expired (Supabase → Authentication → Phone → "Test OTPs valid until").
- [ ] Do one full run of the script below, start to finish.
- [ ] Record the backup video (see the end) from that run or a second one.

**15 minutes before**
- [ ] Reset the data (clears today and rebuilds the history):
  ```bash
  npx supabase db query --linked -f supabase/seed-demo.sql
  ```
- [ ] Phone A: signed in as Jordan, **bell is orange** (alerts on). Phone B: signed in as Mo, reminders on.
- [ ] Both phones: Do Not Disturb off, volume up, battery charged, Wi-Fi works (or use mobile data).
- [ ] Phone A: tap **Demo**, select **Mo**, tap **1. Start the day**. Phone B should buzz within a few seconds. If it does, tap **I'm okay** on B and you're ready (scene 2 resets it anyway).
- [ ] Have the backup video open on the laptop, paused at the start.

---

## The script

### 1. The problem (20 s), phone A on Home

> "Many older and disabled adults live alone. Their family wants to know they're
> okay each day, without calling every morning or installing cameras. Mira asks
> them once a day. If they don't answer, it tells the family, then backups, in order."

### 2. Four weeks of history (30 s), phone A

- Tap **History**. Show the calendar: mostly on time, a couple of late days, one missed day.
- Point at Lin's missed day (about 9 days ago).

> "Mira only shares *whether* someone checked in, and when. Never what they said,
> and never where they are."

### 3. A good day (45 s), both phones

1. Phone A: select **Mo**, tap **Demo**, tap **1. Start the day**.
2. Phone B buzzes: **"Time to check in. Hi Mo! Tap to let Jordan know you're okay today."**
3. Phone B: tap the notification (it opens Mo's check-in), then tap **I'm okay**: **"Thanks, Mo!"**
4. Phone A, without touching it: Mo's card changes to **"Mo is okay today"**.

> "That update came live from the database; Jordan didn't refresh anything.
> For Mo it's one big button. He can also be asked by text or by a phone call where he presses 1."

### 4. A missed day (75 s), both phones

1. Phone A: **Demo**, **1. Start the day** again (it resets today). Phone B buzzes; **don't tap it**.

   > "Normally Mo has from 8 to 10 AM. Demo controls move today's check-in
   > earlier, so we don't have to wait two hours. The clock and the rules stay real."

2. Phone A: **2. Skip to the end of the window**. Phone B: **"A gentle reminder. Mo, tap to let Jordan know you're okay."**
3. Phone A: **3. Skip to the alert**. Phone A buzzes: **"Mo hasn't checked in."** Mo's card shows the missed timeline with **"You were alerted"**.

   > "In the real app Jordan also gets a text and a phone call. Texting is off for
   > this class project, because it needs a registered number that costs money."

4. Phone B: open Mira, tap **I'm okay**. Phone A buzzes again: **"Mo checked in"**. The card shows he's okay, marked late.

   > "A check-in at any point stops the alerts, and everyone who was alerted gets an all clear."

### 5. Backups (optional, 30 s), phone A

1. Select **Lin**, **Demo**, **1. Start the day**, then **4. Skip to the backups**.
2. Lin's timeline shows Jordan, then **Sam**, her neighbour, in order (no reminder: jumping past the alert time skips it). (Skipping straight to the backups alerts them in the same minute; normally Sam is told 15 minutes after Jordan.) Because texting is off, Sam's line honestly reads **"Texting is off, so Sam wasn't told"**.

> "Every message Mira sends is logged with whether it really went out. An alert
> that fails without anyone knowing is the worst bug this app could have."

### 6. How it works (30 s)

> "The app is React Native with Expo. The backend is Supabase: Postgres with
> row-level security, so families can only see their own people. A scheduler runs
> every minute, finds who is due a question, a reminder or an alert, and an Edge
> Function sends them as notifications, texts or calls through Twilio. The
> scheduler is written so that running it twice can never alert anyone twice."

Show the "How Mira works" page here (diagrams of the loop, a day to scale, and what the demo controls change): https://claude.ai/artifact/YKM1a1SQAoRyD9Z7HiCyDk. It's private until you share it from its Share menu; open it on the laptop before you start.

---

## If something goes wrong

| What you see | What to do |
|---|---|
| No **Demo** button on phone A | Wrong account, or the seed hasn't run. Sign in as Jordan (0101); rerun the seed. |
| "There's no check-in today yet. Tap Start the day first." | Tap **1. Start the day**. |
| "Today's check-in is already done…" | Tap **1. Start the day** to begin the day again. |
| Phone B doesn't buzz | Wait 60 s (the every-minute job delivers it anyway). Check B's reminders are on and it's a development build. Mo's screen still updates when opened, so carry on by opening Mira on B. |
| Phone A doesn't buzz on the alert | Check the bell is orange. The card still shows the timeline, so point at that. |
| "We couldn't reach Mira…" | Wi-Fi. Switch to mobile data, or play the backup video. |
| Anything else | Say "this is why we record a backup" and play the video from the same scene. |

---

## The backup video

Aim for 2–3 minutes covering scenes 2–4 (and 5 if there's time).

- **Easiest:** film both phones side by side from above with a third phone or a
  laptop webcam, in one take, while you narrate. It shows the two phones reacting
  to each other, which is the point of the demo.
- **Cleaner:** screen-record both phones at once (Android: Quick Settings →
  Screen record; iPhone: Control Center → Screen Recording), then put the two
  clips side by side in any video editor (CapCut, iMovie, Clipchamp).
- Turn on notifications in the recording (iPhone: hold the record button and turn
  the microphone on if you want to narrate). Hide anything private on the phones first.
- Reset with the seed before recording, so the history matches the live demo.
- Keep the video out of git (it's large); save it on the laptop and a USB stick or cloud drive.
