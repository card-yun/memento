import { StatusBar } from "expo-status-bar";
import React from "react";
import { View, StyleSheet, Text } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.city}>
        <Text>Seoul</Text>
      </View>
      <View style={styles.weather}></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "orange",
  },
  city: {
    flex: 1,
    backgroundColor: "blue",
  },
  weather: {
    flex: 2,
    backgroundColor: "teal",
  },
});
