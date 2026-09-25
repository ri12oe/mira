import { AppText } from "@/components/app-text";
import {
  BottomCloud,
  TopCloud,
  useCloudSizes,
} from "@/components/puffy-cloudv2";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "react-native-reanimated";
import { RefObject, useCallback, useRef, useState } from "react";
import { Href, router, useFocusEffect } from "expo-router";
import { MorphOverlay, MorphRect } from "@/components/morph-overlay";


type ButtonId = "start" | "signin";
type Morph = MorphRect & { id: ButtonId, color: string, label: string, href: Href}; 

const WHITE = "#FFF";

//  New Colors to test out
const lightGreen = "#A8D130";
const darkBlue = "#1C2E9D";
const lightBlue = "#414DC7";
const lightPurple = "#B024F1";
const lighterBlue = "#349AD5";



export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { width, top, bottom } = useCloudSizes();

  // Gentle size scaling: a little smaller on narrow phones, a little
  // larger on big ones, but never extreme.
  const s = Math.min(Math.max(width / 390, 0.88), 1.12);

  // The logo must fit inside the top cloud (below the status bar).
  const logoSize = Math.min(96 * s, (top - insets.top) * 0.55);

  // The button that's currently turning into a circle, if any
  const [morph, setMorph] = useState<Morph | null>(null);
  const reduceMotion = useReducedMotion();
  const startRef = useRef<View>(null);
  const signInRef = useRef<View>(null);

  // coming back to this screen clears the circle
  useFocusEffect(
    useCallback(() => {
      setMorph(null);
    }, [])
  );

  // measure the tapped button, then start the animation there
  function startMorph(
    id: ButtonId,
    ref: RefObject<View | null>,
    color: string,
    label: string,
    href: Href
  ) {
    if (morph) return; // ignore extra taps while it's running
    if (reduceMotion) {
      router.push(href); // skip the effect when "reduce motion" is on
      return;
    }
    ref.current?.measureInWindow((x, y, width, height) => {
      setMorph({ id, x, y, width, height, color, label, href });
    });
  }

  return (
    <View style={styles.screen}>
      <TopCloud />
      <BottomCloud />

      {/* Logo area: exactly the height of the top cloud */}
      <View style={[styles.logoArea, { height: top, paddingTop: insets.top }]}>
        <AppText
          accessibilityRole="header"
          maxFontSizeMultiplier={1}
          style={[
            styles.logo,
            { fontSize: logoSize, lineHeight: logoSize * 1.05 },
          ]}
        >
          MIRA
        </AppText>
      </View>

      {/* Everything between the clouds. It scrolls only if it has to,
          e.g. when someone uses a very large system text size. */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.body, { paddingBottom: bottom + 16 }]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.buttonsArea}>
          <Pressable
            ref={startRef}
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, pressed && styles.pressed, morph?.id === "start" && styles.hidden,]}
            onPress={() =>
              startMorph("start", startRef, lighterBlue, "Get Started", "/get-started" )
            }
            >
              <AppText style={styles.buttonText}>
                Get Started
              </AppText>
          </Pressable>
          <Pressable
            ref={signInRef}
            accessibilityRole="button"
            style={({ pressed }) => [styles.button2, pressed && styles.pressed, morph?.id === "signin" && styles.hidden]}
            onPress={() => 
              startMorph("signin", signInRef, lightGreen, "Sign-IN", "/sign-in")
            }
            >
              <AppText style={styles.buttonText}>
                Sign-IN
              </AppText>
          </Pressable>
        </View>

      </ScrollView>
      {morph && (
        <MorphOverlay
          from={morph}
          color={morph.color}
          label={morph.label}
          labelStyle={styles.buttonText}
          onCovered={() => router.push(morph.href)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF8FC",
    overflow: "hidden",
  },
  flex: { flex: 1 },
  logoArea: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    color: "#fff",
    letterSpacing: 2,
    textAlign: "center",
  },
  body: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  buttonsArea: {
    gap: 25,
  },
  button: {
    backgroundColor: lighterBlue,
    borderRadius: 45,
    width: 325,
    height: 93,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: '0px 6px 8px rgba(0, 0, 0, 0.25)',
  },
  button2: {
    backgroundColor: lightGreen,
    borderRadius: 45,
    width: 325,
    height: 93,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: '0px 6px 8px rgba(0, 0, 0, 0.25)',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.25)',
    backgroundColor: darkBlue,

  },
  buttonText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: 500,
    lineHeight: 55,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  hidden: {
    opacity: 0,
  },
});
