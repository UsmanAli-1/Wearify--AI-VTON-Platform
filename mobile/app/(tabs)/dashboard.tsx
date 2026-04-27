import axios from "axios";
import * as ImagePicker from "expo-image-picker"; // Brought this back!
import { LinearGradient } from "expo-linear-gradient";
import { API_URL } from "../config"; // (Adjust path if needed)
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert, // Added Alert for our native popup
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";

import SmartCamera from "../../components/SmartCamera";

interface Garment {
  _id: string;
  name: string;
  imagePath: string;
}

export default function DashboardScreen() {
  const router = useRouter();

  // --- Data & Economy State ---
  const [garments, setGarments] = useState<Garment[]>([]);
  const [isLoadingGarments, setIsLoadingGarments] = useState(true);
  const [diamonds, setDiamonds] = useState(120);
  const [showPlans, setShowPlans] = useState(false);

  // --- UI & Action State ---
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(
    null,
  );
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    const fetchGarments = async () => {
      try {
        const response = await axios.get(`${API_URL}/garments`, {
          headers: { "Bypass-Tunnel-Reminder": "true" },
        });
        setGarments(response.data);
      } catch (error) {
        console.error("Failed to fetch garments:", error);
      } finally {
        setIsLoadingGarments(false);
      }
    };
    fetchGarments();
  }, []);

  // --- IMAGE SELECTION LOGIC ---
  const handleCameraOpen = () => {
    setShowCamera(true);
    setGeneratedImage(null);
  };

  const handleGalleryOpen = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "We need access to your photos!");
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

  // ✨ THIS IS THE NEW POPUP MENU ✨
  const handleImageOption = () => {
    Alert.alert(
      "Add Target Person",
      "How would you like to provide your photo?",
      [
        { text: "Smart Camera (Recommended)", onPress: handleCameraOpen },
        { text: "Choose from Gallery", onPress: handleGalleryOpen },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const handleGenerateTryOn = () => {
    if (diamonds < 40) {
      setShowPlans(true);
      return;
    }

    setIsGenerating(true);
    setDiamonds((prev) => prev - 40);

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
    <LinearGradient
      colors={["#1c103f", "#080d1a", "#080d1a", "#2d1445"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.backgroundGradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.mainWrapper}>
          {/* HEADER */}
          <View style={styles.header}>
            <Image
              source={require("../../assets/images/logo1.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={styles.headerRight}>
              <View style={styles.diamondBadge}>
                <Text style={styles.diamondText}>💎 {diamonds}</Text>
              </View>

              <TouchableOpacity onPress={() => router.replace("/auth")}>
                <LinearGradient
                  colors={["#8b5cf6", "#3b82f6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.signOutBtn}
                >
                  <Text style={styles.signOutText}>Sign Out</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* GARMENT CAROUSEL */}
          <View style={styles.carouselContainer}>
            {isLoadingGarments ? (
              <ActivityIndicator size="small" color="#8b5cf6" />
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
                        source={{
                          uri: item.imagePath.startsWith("http")
                            ? item.imagePath
                            : `${API_URL.replace("/api", "")}/${item.imagePath.replace(/\\/g, "/")}`,
                        }}
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

          {/* DYNAMIC CANVAS */}
          <View style={styles.canvasWrapper}>
            <TouchableOpacity
              style={[
                styles.mainContainer,
                generatedImage ? styles.mainContainerSuccess : null,
              ]}
              onPress={generatedImage ? undefined : handleImageOption} // <-- Triggering the native menu here!
              activeOpacity={generatedImage ? 1 : 0.7}
            >
              {isGenerating ? (
                <View style={styles.placeholder}>
                  <ActivityIndicator
                    size="large"
                    color="#8b5cf6"
                    style={{ marginBottom: 16 }}
                  />
                  <Text style={styles.uploadText}>
                    Generating AI Preview...
                  </Text>
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
                <View style={{ flex: 1, width: "100%" }}>
                  <Image
                    source={{ uri: personImage }}
                    style={styles.previewImage}
                  />
                  <View style={styles.editOverlay}>
                    <Text style={styles.editOverlayText}>
                      Tap to change photo
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.iconText}>📸</Text>
                  <Text style={styles.uploadText}>Add Target Person</Text>
                  <Text style={styles.subUploadText}>
                    Tap to open camera or gallery
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ACTION BUTTON */}
          <View style={styles.footer}>
            {!generatedImage ? (
              <TouchableOpacity
                style={[
                  styles.buttonContainer,
                  !isReadyToGenerate || isGenerating
                    ? styles.buttonDisabled
                    : null,
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
                    {isGenerating ? "Processing..." : "Try On (40 💎)"}
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
          </View>
        </View>
      </SafeAreaView>

      {/* THE SMART CAMERA MODAL */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <SmartCamera
            onCapture={(uri) => {
              setPersonImage(uri);
              setShowCamera(false);
            }}
          />
          <TouchableOpacity
            style={styles.closeCameraBtn}
            onPress={() => setShowCamera(false)}
          >
            <Text style={styles.closeCameraText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* PAYWALL MODAL */}
      <Modal visible={showPlans} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowPlans(false)}
            >
              <Text style={styles.closeModalText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Out of Diamonds!</Text>
            <Text style={styles.modalSubtitle}>
              Upgrade your plan to keep generating.
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.planScroll}
            >
              <View style={styles.planCard}>
                <Text style={styles.planName}>Basic</Text>
                <Text style={styles.planPrice}>Rs. 1,200</Text>
                <Text style={styles.planPoints}>400 Points</Text>
                <TouchableOpacity style={styles.planBtn}>
                  <Text style={styles.planBtnText}>Get Started</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.planCard, styles.planCardPro]}>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
                <Text style={styles.planName}>Pro</Text>
                <Text style={styles.planPrice}>Rs. 3,000</Text>
                <Text style={styles.planPoints}>1000 Points</Text>
                <TouchableOpacity style={styles.planBtnPro}>
                  <Text style={styles.planBtnText}>Upgrade Now</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.planCard}>
                <Text style={styles.planName}>Premium</Text>
                <Text style={styles.planPrice}>Rs. 6,000</Text>
                <Text style={styles.planPoints}>2000 Points</Text>
                <TouchableOpacity style={styles.planBtn}>
                  <Text style={styles.planBtnText}>Go Premium</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backgroundGradient: { flex: 1 },
  container: { flex: 1, backgroundColor: "transparent" },
  mainWrapper: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 10,
  },
  headerLogo: { width: 100, height: 40 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },

  diamondBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.5)",
  },
  diamondText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 14 },

  signOutBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  signOutText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },

  carouselContainer: {
    height: 100,
    marginBottom: 16,
    justifyContent: "center",
  },
  garmentCard: {
    width: 75,
    height: 100,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    marginRight: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  garmentCardSelected: { borderColor: "#8b5cf6" },
  garmentImage: { width: "100%", height: "100%", resizeMode: "cover" },
  checkmarkBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#8b5cf6",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: { color: "#FFFFFF", fontSize: 10, fontWeight: "bold" },

  canvasWrapper: { flex: 1, justifyContent: "center", marginBottom: 16 },
  mainContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderStyle: "dashed",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
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
  placeholder: { alignItems: "center", padding: 20 },
  iconText: { fontSize: 40, marginBottom: 12 },
  uploadText: {
    color: "#E2E8F0",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  subUploadText: { color: "#64748b", fontSize: 12 },
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

  footer: { width: "100%", marginTop: "auto" },
  buttonContainer: { width: "100%", borderRadius: 16, overflow: "hidden" },
  buttonDisabled: { opacity: 0.7 },
  gradient: {
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  buttonTextDisabled: { color: "#9ca3af" },

  closeCameraBtn: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closeCameraText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0A0F1C",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    minHeight: 400,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  closeModalBtn: { alignSelf: "flex-end", padding: 8 },
  closeModalText: { color: "#64748b", fontSize: 20, fontWeight: "bold" },
  modalTitle: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalSubtitle: { color: "#A0AEC0", fontSize: 16, marginBottom: 24 },
  planScroll: { paddingRight: 24, alignItems: "center" },
  planCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 20,
    width: 200,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  planCardPro: {
    borderColor: "#8b5cf6",
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8b5cf6",
  },
  popularText: { color: "#d8b4fe", fontSize: 10, fontWeight: "bold" },
  planName: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  planPrice: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 12,
  },
  planPoints: { color: "#A0AEC0", fontSize: 14, marginBottom: 24 },
  planBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  planBtnPro: {
    backgroundColor: "#8b5cf6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  planBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
});
