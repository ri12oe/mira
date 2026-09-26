import { CornerClouds, useCornerCloudSize } from "@/components/conor_clouds";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function GetStarted() {
  const insets = useSafeAreaInsets();
  const { height: cloudH } = useCornerCloudSize();
  return (
    <View style={styles.screen}>
      <CornerClouds />
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(cloudH * 0.6, insets.top + 16),
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 23,
        }}
      >
        
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
