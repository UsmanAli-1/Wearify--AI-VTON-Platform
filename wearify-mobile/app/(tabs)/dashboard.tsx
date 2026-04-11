import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function DashboardScreen() {
  const router = useRouter();

  // State to hold our selected images (we'll implement the actual picker later)
  const [personImage, setPersonImage] = useState(null);
  const [garmentImage, setGarmentImage] = useState(null);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Virtual Try-On</Text>
          <TouchableOpacity onPress={() => router.replace("/")}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.instructions}>
          Upload a photo of yourself and a 2D upper garment to see how it looks.
        </Text>

        {/* Upload Cards Container */}
        <View style={styles.uploadSection}>
          {/* Person Upload Card */}
          <TouchableOpacity style={styles.uploadCard}>
            {personImage ? (
              <Image
                source={{ uri: personImage }}
                style={styles.previewImage}
              />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.iconText}>👤</Text>
                <Text style={styles.uploadText}>Upload Person</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Plus Icon */}
          <View style={styles.plusContainer}>
            <Text style={styles.plusText}>+</Text>
          </View>

          {/* Garment Upload Card */}
          <TouchableOpacity style={styles.uploadCard}>
            {garmentImage ? (
              <Image
                source={{ uri: garmentImage }}
                style={styles.previewImage}
              />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.iconText}>👕</Text>
                <Text style={styles.uploadText}>Upload Garment</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() =>
            console.log("Sending to Express Backend for Diffusion!")
          }
        >
          <LinearGradient
            colors={["#10b981", "#3b82f6"]} // Emerald to Blue for action
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <Text style={styles.buttonText}>Generate Try-On ✨</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0F1C",
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  logoutText: {
    color: "#ef4444", // Red for logout
    fontSize: 16,
    fontWeight: "600",
  },
  instructions: {
    color: "#A0AEC0",
    fontSize: 16,
    marginBottom: 32,
    lineHeight: 24,
  },
  uploadSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  uploadCard: {
    flex: 1,
    aspectRatio: 3 / 4,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderStyle: "dashed",
    overflow: "hidden",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  iconText: {
    fontSize: 40,
    marginBottom: 12,
  },
  uploadText: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  plusContainer: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  plusText: {
    color: "#8b5cf6",
    fontSize: 28,
    fontWeight: "bold",
  },
  buttonContainer: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gradient: {
    paddingVertical: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
});
