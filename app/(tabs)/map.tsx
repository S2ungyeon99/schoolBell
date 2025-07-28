import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

const MapScreen = () => {
  return (
    <View style={styles.container}>
      {/* 상단 영역: 로고와 텍스트를 한 줄에 배치 */}
      <View style={styles.topContainer}>
        <View style={styles.headerRow}>
          <Image 
            source={require('../../assets/images/hb_logo3.jpg')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
          <Text style={styles.headerText}>학교 캠퍼스 지도</Text>
        </View>

        <View style={styles.divider1} />
        {/* 캠퍼스 지도 이미지 (상단 영역 아래에 위치) */}
        <Image 
          source={require('../../assets/images/hb_map.jpg')}
          style={styles.mapImage}
          resizeMode="contain"
        />
      </View>

      {/* 구분선 */}
      <View style={styles.divider2} />

      {/* 하단 영역: 찾아오는 길 웹뷰 */}
      <View style={styles.webviewContainer}>
        <WebView 
          source={{ uri: "https://www.hanbat.ac.kr/kor/sub01_0801.do" }}
          style={styles.webview}
          injectedJavaScript={`window.scrollTo(0, 1050); true;`}
        />
      </View>
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topContainer: {
    padding: 16,
  },
  headerRow: {
    //flexDirection: "row",
    //alignItems: "center",
    marginBottom: 12,
  },
  logo: {
    width: 130,
    height: 30,
    marginBottom: 40,
  },
  headerText: {
    fontSize: 18,
    //fontWeight: "bold",
    marginTop: 4,
  },
  mapImage: {
    width: "100%",
    height: 250,
  },
  divider1: {
    height: 2,
    width: "100%",
    backgroundColor: "#020715",
  },
  divider2: {
    height: 2,
    backgroundColor: "#020715",
    marginVertical: 10,
    marginHorizontal: 16,
  },
  webviewContainer: {
    flex: 1,
    marginBottom: 16,
  },
  webview: {
    flex: 1,
  },
});
