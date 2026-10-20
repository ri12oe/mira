import { PhoneSignIn } from "@/components/phone-sign-in";

/**
 * "Someone invited me": the person a caregiver set up (e.g. Lin) signs in
 * with the number she was invited on. That's her YES; then her Home.
 */
export default function Invited() {
  return <PhoneSignIn mode="invited" />;
}
