import { StyleSheet, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PuffyCloud } from "@/components/puffy-cloud";

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      {/* {Clouds display on top} */}
      <PuffyCloud style={styles.topCloud} contentStyle={styles.cloudContent}>
        <Text style={styles.wordmark}>MIRA</Text>
      </PuffyCloud>
      <SafeAreaView style={styles.content}>
        {/* {Content goes here} */}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF8FC",
    overflow: "hidden",
  },
  topCloud: {
    left: -199,
    top: -382,
  },
  bottomCloud: {
    left: -199,
    top: -552,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cloudContent: {
    paddingTop: 450,
    paddingLeft: 50,
    alignItems: "center",
  },
  wordmark: {
    color: "#fff",
    fontSize: 120,
    fontWeight: 800,
    letterSpacing: 2,
    lineHeight: 96,
    textAlign: "center",
  },
});
