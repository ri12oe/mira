import { AppText } from "@/components/app-text";
import {
  BottomCloud,
  TopCloud,
  useCloudSizes,
} from "@/components/puffy-cloudv2";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
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
        <View style={styles.buttonsArea}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            onPress={() => {}}
            >
              <AppText style={styles.buttonText}>
                Get Started
              </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.button2, pressed && styles.pressed]}
            onPress={() => {}}
            >
              <AppText style={styles.buttonText}>
                Sign-IN
              </AppText>
          </Pressable>
        </View>

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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  buttonsArea: {
    gap: 25,
  },
  button: {
    backgroundColor: "#FECEF1",
    borderRadius: 45,
    width: 325,
    height: 93,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: '0px 6px 8px rgba(0, 0, 0, 0.25)',
  },
  button2: {
    backgroundColor: "#fff",
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
    backgroundColor: "#32CBFF",
    
  },
  buttonText: {
    fontSize: 24,
    color: "#0B2A4A",
    fontWeight: 500,
    lineHeight: 55,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
