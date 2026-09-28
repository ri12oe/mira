import { StyleSheet, View } from 'react-native';
import { SafeAreaView,} from 'react-native-safe-area-context';


export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {

  },
});
