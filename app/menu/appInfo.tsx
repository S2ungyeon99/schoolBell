import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function AppDescriptionScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 상단 중앙에 hbNotice */}
      <Text style={styles.header}>SchoolBell</Text>

      {/* 앱 설명 및 조원 정보 */}
      <View style={styles.content}>
        <Text style={styles.description}>
          이 앱은 공지사항을 관리하고 사용자에게 중요한 알림을 전달하는{" "}
          어플리케이션입니다. 최신 공지 및 정보를 빠르게{" "}
          확인할 수 있습니다.
        </Text>
        <Text style={styles.teamTitle}>조원</Text>
        <Text style={styles.teamMember}>한승연</Text>
        <Text style={styles.teamMember}>이가은</Text>
        <Text style={styles.teamMember}>이혜린</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    padding: 16,
    alignItems: "center",
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    marginVertical: 24,
    textAlign: "center",
  },
  content: {
    width: "100%",
    paddingHorizontal: 16,
  },
  description: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  teamTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  teamMember: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 4,
  },
});
