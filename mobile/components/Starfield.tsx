import React, { useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";

const { width, height } = Dimensions.get("window");
const STAR_COUNT = 60; // Adjust this if you want more or fewer stars!

export default function Starfield() {
  // useMemo ensures the stars stay in the exact same spot and don't re-randomize every time the screen renders
  const stars = useMemo(() => {
    return Array.from({ length: STAR_COUNT }).map((_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1, // Random size between 1px and 3px
      opacity: Math.random() * 0.5 + 0.1, // Random opacity between 0.1 and 0.6
    }));
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {stars.map((star) => (
        <View
          key={star.id}
          style={[
            styles.star,
            {
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              opacity: star.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
});
