import { PhoneSignIn } from "@/components/phone-sign-in";

/** "I already have an account": phone number, then the code */
export default function SignIn() {
  return <PhoneSignIn mode="signIn" />;
}
