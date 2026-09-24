import { AppText } from "@/components/app-text";
import {
  BottomCloud,
  TopCloud,
  useCloudSizes,
} from "@/components/puffy-cloudv2";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const INK = "#0B2A4A";
const WHITE = "#FFF";
const SUBTLE = "#3D4F63";
const PINK = "#FECEF1";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { width, top, bottom } = useCloudSizes();

  // Gentle size scaling: a little smaller on narrow phones, a little
  // larger on big ones, but never extreme.
  const s = Math.min(Math.max(width / 390, 0.88), 1.12);

  // The logo must fit inside the top cloud (below the status bar).
  const logoSize = Math.min(96 * s, (top - insets.top) * 0.55);

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
        {/* <View style={styles.copy}>
          <AppText maxFontSizeMultiplier={1.6} style={[styles.tagline, { fontSize: 24 * s }]}>
            A daily check-in that keeps your family close.
          </AppText>
          <AppText maxFontSizeMultiplier={1.8} style={[styles.support, { fontSize: 17 * s }]}>
            One tap a day lets the people who love you know you're okay.
          </AppText>
        </View> */}

        {/* <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            onPress={() => {}}
          >
            <AppText maxFontSizeMultiplier={1.6} style={[styles.buttonText, { fontSize: 22 * s }]}>
              Get started
            </AppText>
          </Pressable>

          <Pressable accessibilityRole="link" hitSlop={12} onPress={() => {}}>
            <AppText maxFontSizeMultiplier={1.8} style={[styles.link, { fontSize: 18 * s }]}>
              I already have an account
            </AppText>
          </Pressable>
        </View> */}
      </ScrollView>
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
    color: WHITE,
    letterSpacing: 2,
    textAlign: "center",
  },
  body: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  copy: {
    gap: 12,
    alignItems: "center",
  },
  tagline: {
    color: INK,
    fontWeight: "800",
    textAlign: "center",
  },
  support: {
    color: SUBTLE,
    textAlign: "center",
  },
  actions: {
    gap: 20,
    alignItems: "center",
    marginTop: 32,
  },
  button: {
    width: "100%",
    maxWidth: 380,
    minHeight: 64, // grows with large text instead of clipping it
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: PINK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#D65AAA",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  buttonText: {
    color: INK,
    fontWeight: "800",
  },
  link: {
    color: INK,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
