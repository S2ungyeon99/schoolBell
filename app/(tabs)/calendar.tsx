import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

const ScheduleScreen = () => {
  return (
    <View style={styles.container}>
      <WebView
        source={{
          uri: "https://www.hanbat.ac.kr/prog/schafsSchdul/kor/sub05_0201/A/scheduleList.do",
        }}
        style={styles.webview}
        injectedJavaScript={`window.scrollTo(0, 300); true;`}
      />
    </View>
  );
};

export default ScheduleScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
