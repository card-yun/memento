import { StatusBar } from "expo-status-bar";
import React from "react";
import { View, ScrollView, Text, StyleSheet, Dimensions } from "react-native";
// Components(View etc..) & APIs(StyleSheet, Dimensions)
// Dimensions: size of phone screen

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
//console.log(windowWidth);

export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.city}>
        <Text style={styles.cityName}>Seoul</Text>
      </View>
      <ScrollView // has so many Props!! See the Docs!!
        horizontal
        pagingEnabled // sticky & created scroll indicator_below (none: (too?) naturally)
        showsHorizontalScrollIndicator={false} // hided indicator_below
        contentContainerStyle={styles.weather}
      >
        {/*reactnative.dev/docs -> ScrollView (kind of View) -> Sellected 'horizontal' of Many Props */}
        {/* Don't Memorize these all Prop things! Just Practice and Practice More!
        by Reading Documents!! */}
        <View style={styles.day}>
          <Text style={styles.temp}>27</Text>
          <Text style={styles.description}>Sunny</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>27</Text>
          <Text style={styles.description}>Sunny</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>27</Text>
          <Text style={styles.description}>Sunny</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>27</Text>
          <Text style={styles.description}>Sunny</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>27</Text>
          <Text style={styles.description}>Sunny</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>27</Text>
          <Text style={styles.description}>Sunny</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>27</Text>
          <Text style={styles.description}>Sunny</Text>
        </View>
      </ScrollView>
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
    justifyContent: "center",
    alignItems: "center",
  },
  cityName: {
    fontSize: 68,
    fontWeight: 500,
  },
  weather: {
    //ScrollView는 Screen을 벗어나야 하므로 flex없어야 함. 안 하면 에러남.
    backgroundColor: "lightblue",
  },
  day: {
    width: windowWidth,
    alignItems: "center",
  },
  temp: {
    marginTop: 50,
    fontSize: 178,
  },
  description: {
    marginTop: -30,
    fontSize: 60,
  },
});
