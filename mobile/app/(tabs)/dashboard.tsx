import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// A quick TypeScript interface so our app knows what a "Garment" looks like
interface Garment {
  _id: string;
  name: string;
  imagePath: string;
}

export default function DashboardScreen() {
  const router = useRouter();

  // --- Data State ---
  const [garments, setGarments] = useState<Garment[]>([]);
  const [isLoadingGarments, setIsLoadingGarments] = useState(true);

  // --- UI & Action State (Your exact TypeScript snippet!) ---
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(
    null,
  );
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // YOUR Express Backend URL
  const API_URL = "http://192.168.0.105:4000/api";

  // Fetch Garments from MongoDB on Load
  useEffect(() => {
    const fetchGarments = async () => {
      try {
        const response = await axios.get(`${API_URL}/garments`);
        setGarments(response.data);
      } catch (error) {
        console.error("Failed to fetch garments:", error);
        Alert.alert("Error", "Could not load garments from the database.");
      } finally {
        setIsLoadingGarments(false);
      }
    };

    fetchGarments();
  }, []);

  // Real Camera Roll Upload Function
  const handleRealUpload = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "We need access to your photos to upload a picture of yourself!",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPersonImage(result.assets[0].uri);
      setGeneratedImage(null);
    }
  };

  // Fake AI Generation function (Until we wire up /api/users/generate)
  const handleGenerateTryOn = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedImage(
        "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=80",
      );
      setIsGenerating(false);
    }, 3000);
  };

  const handleReset = () => {
    setGeneratedImage(null);
    setSelectedGarmentId(null);
  };

  const isReadyToGenerate = selectedGarmentId !== null && personImage !== null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <TouchableOpacity onPress={() => router.replace("/")}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* STEP 1: Garment Carousel */}
        <Text style={styles.sectionTitle}>1. Select Garment</Text>
        <View style={styles.carouselContainer}>
          {isLoadingGarments ? (
            <ActivityIndicator
              size="small"
              color="#8b5cf6"
              style={{ marginTop: 20, marginBottom: 20 }}
            />
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={garments}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                const isSelected = selectedGarmentId === item._id;
                return (
                  <TouchableOpacity
                    onPress={() => setSelectedGarmentId(item._id)}
                    style={[
                      styles.garmentCard,
                      isSelected && styles.garmentCardSelected,
                    ]}
                  >
                    <Image
                      source={{ uri: item.imagePath }}
                      style={styles.garmentImage}
                    />
                    {isSelected && (
                      <View style={styles.checkmarkBadge}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>

        {/* STEP 2: The "Smart" Central Container */}
        <Text style={styles.sectionTitle}>
          {generatedImage
            ? "Your AI Fitting Result"
            : "2. Target Person Canvas"}
        </Text>

        <TouchableOpacity
          style={[
            styles.mainContainer,
            generatedImage ? styles.mainContainerSuccess : null,
          ]}
          onPress={generatedImage ? undefined : handleRealUpload}
          activeOpacity={generatedImage ? 1 : 0.7}
        >
          {isGenerating ? (
            <View style={styles.placeholder}>
              <ActivityIndicator
                size="large"
                color="#8b5cf6"
                style={{ marginBottom: 16 }}
              />
              <Text style={styles.uploadText}>Generating AI Preview...</Text>
              <Text style={styles.subUploadText}>
                Applying diffusion models
              </Text>
            </View>
          ) : generatedImage ? (
            <Image
              source={{ uri: generatedImage }}
              style={styles.previewImage}
            />
          ) : personImage ? (
            <View style={{ flex: 1 }}>
              <Image
                source={{ uri: personImage }}
                style={styles.previewImage}
              />
              <View style={styles.editOverlay}>
                <Text style={styles.editOverlayText}>Tap to change photo</Text>
              </View>
            </View>
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.iconText}>📸</Text>
              <Text style={styles.uploadText}>Upload Target Person</Text>
              <Text style={styles.subUploadText}>
                Front-facing, clear lighting
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* STEP 3: Action Buttons */}
        {!generatedImage ? (
          <TouchableOpacity
            style={[
              styles.buttonContainer,
              !isReadyToGenerate || isGenerating ? styles.buttonDisabled : null,
            ]}
            disabled={!isReadyToGenerate || isGenerating}
            onPress={handleGenerateTryOn}
          >
            <LinearGradient
              colors={
                isReadyToGenerate
                  ? ["#8b5cf6", "#3b82f6"]
                  : ["#1f2937", "#1f2937"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <Text
                style={[
                  styles.buttonText,
                  !isReadyToGenerate ? styles.buttonTextDisabled : null,
                ]}
              >
                {isGenerating ? "Processing..." : "Try On ✨"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={handleReset}
          >
            <LinearGradient
              colors={["#10b981", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <Text style={styles.buttonText}>Try Another Garment 🔄</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0F1C" },
  scrollContent: { padding: 24, paddingBottom: 50 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 10,
  },
  headerLogo: { width: 120, height: 40 },
  logoutText: { color: "#ef4444", fontSize: 16, fontWeight: "600" },
  sectionTitle: {
    color: "#E2E8F0",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },

  carouselContainer: {
    marginBottom: 24,
    marginHorizontal: -24,
    paddingHorizontal: 24,
    minHeight: 120,
    justifyContent: "center",
  },
  garmentCard: {
    width: 90,
    height: 120,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    marginRight: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  garmentCardSelected: { borderColor: "#8b5cf6" },
  garmentImage: { width: "100%", height: "100%", resizeMode: "cover" },
  checkmarkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#8b5cf6",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: { color: "#FFFFFF", fontSize: 10, fontWeight: "bold" },

  mainContainer: {
    width: "100%",
    aspectRatio: 3 / 4,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderStyle: "dashed",
    overflow: "hidden",
    marginBottom: 30,
  },
  mainContainerSuccess: {
    borderStyle: "solid",
    borderColor: "#8b5cf6",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  iconText: { fontSize: 48, marginBottom: 16 },
  uploadText: {
    color: "#E2E8F0",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  subUploadText: { color: "#64748b", fontSize: 14 },
  previewImage: { width: "100%", height: "100%", resizeMode: "cover" },
  editOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 12,
    alignItems: "center",
  },
  editOverlayText: { color: "#FFFFFF", fontSize: 14, fontWeight: "500" },

  buttonContainer: { width: "100%", borderRadius: 16, overflow: "hidden" },
  buttonDisabled: { opacity: 0.7 },
  gradient: {
    paddingVertical: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  buttonTextDisabled: { color: "#9ca3af" },
});
