import { API_URL } from "@/constants/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Suggestion {
  _id: string;
  name: string;
  imagePath: string;
  color: string;
}

type Gender = "male" | "female";
type Step = "upload" | "loading" | "results";

const { width } = Dimensions.get("window");
const CARD_SIZE = (width - 60) / 2; // two columns with padding

// ─── Helper ───────────────────────────────────────────────────────────────────

async function getAuthToken(): Promise<string> {
  const token = await AsyncStorage.getItem("authToken");
  return token ?? "";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AISuggestionScreen() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("upload");
  const [gender, setGender] = useState<Gender>("male");
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [skinTone, setSkinTone] = useState<string>("");
  const [suggestedColors, setSuggestedColors] = useState<string[]>([]);
  const [loadingMessage, setLoadingMessage] = useState("");

  // ── Image picker ────────────────────────────────────────────────────────────

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
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
    }
  };

  const handleRemoveImage = () => {
    setPersonImage(null);
    setStep("upload");
    setSuggestions([]);
  };

  // ── Suggest ─────────────────────────────────────────────────────────────────

  const handleSuggest = async () => {
    if (!personImage) {
      Alert.alert("No Image", "Please select a photo first.");
      return;
    }

    setStep("loading");

    try {
      const token = await getAuthToken();

      // Build multipart form
      const formData = new FormData();
      formData.append("image", {
        uri: personImage,
        name: "person.jpg",
        type: "image/jpeg",
      } as any);
      formData.append("gender", gender);

      // Step messages so the user knows what's happening
      setLoadingMessage("Validating full body image...");
      await new Promise((r) => setTimeout(r, 800));
      setLoadingMessage("Analyzing skin tone...");
      await new Promise((r) => setTimeout(r, 600));
      setLoadingMessage("Finding matching outfits...");

      const { data } = await axios.post(
        `${API_URL}/suggestions/suggest`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 90000,
        }
      );

      setSkinTone(data.skin_tone ?? "");
      setSuggestedColors(data.suggested_colors ?? []);
      setSuggestions(data.suggestions ?? []);
      setStep("results");
    } catch (err: any) {
      setStep("upload");

      // Handle specific backend error messages
      const msg =
        err?.response?.data?.message ?? "Something went wrong. Please try again.";

      if (msg.includes("full-body") || msg.includes("full body")) {
        Alert.alert(
          "Full Body Required 📸",
          "Please upload a clear head-to-toe photo so we can analyze your skin tone accurately.\n\nTips:\n• Stand in good lighting\n• Make sure your full body is visible\n• Avoid cropped or close-up shots",
          [{ text: "Try Again", style: "default" }]
        );
      } else if (msg.includes("points") || msg.includes("Points")) {
        Alert.alert(
          "Not Enough Diamonds 💎",
          "You need 40 diamonds to use AI Suggestions. Top up from your dashboard.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Top Up", onPress: () => router.back() },
          ]
        );
      } else {
        Alert.alert("Error", msg);
      }
    }
  };

  const handleReset = () => {
    setStep("upload");
    setPersonImage(null);
    setSuggestions([]);
    setSkinTone("");
    setSuggestedColors([]);
  };

  // ── Render helpers ───────────────────────────────────────────────────────────

  const renderUploadStep = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Person image area */}
      <TouchableOpacity
        style={styles.uploadBox}
        onPress={handlePickImage}
        activeOpacity={personImage ? 1 : 0.7}
      >
        {personImage ? (
          <View style={{ flex: 1, width: "100%" }}>
            <Image source={{ uri: personImage }} style={styles.personPreview} />
            <TouchableOpacity style={styles.removeBtn} onPress={handleRemoveImage}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Text style={styles.uploadIcon}>📸</Text>
            <Text style={styles.uploadTitle}>Upload Your Photo</Text>
            <Text style={styles.uploadSubtitle}>
              Head-to-toe full body photo required
            </Text>
            <View style={styles.uploadHint}>
              <Text style={styles.uploadHintText}>Tap to select from gallery</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Full body reminder */}
      <View style={styles.reminderBox}>
        <Text style={styles.reminderIcon}>💡</Text>
        <Text style={styles.reminderText}>
          For best results, use a clear full-body photo in good lighting
        </Text>
      </View>

      {/* Gender selector */}
      <View style={styles.genderContainer}>
        <Text style={styles.sectionLabel}>Select Gender</Text>
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[styles.genderBtn, gender === "male" && styles.genderBtnActive]}
            onPress={() => setGender("male")}
          >
            <Text style={styles.genderIcon}>♂</Text>
            <Text
              style={[
                styles.genderText,
                gender === "male" && styles.genderTextActive,
              ]}
            >
              Male
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderBtn,
              gender === "female" && styles.genderBtnActive,
            ]}
            onPress={() => setGender("female")}
          >
            <Text style={styles.genderIcon}>♀</Text>
            <Text
              style={[
                styles.genderText,
                gender === "female" && styles.genderTextActive,
              ]}
            >
              Female
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Suggest button */}
      <TouchableOpacity
        style={[styles.suggestBtn, !personImage && styles.suggestBtnDisabled]}
        onPress={handleSuggest}
        disabled={!personImage}
      >
        <LinearGradient
          colors={personImage ? ["#8b5cf6", "#3b82f6"] : ["#1f2937", "#1f2937"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.suggestBtnGradient}
        >
          <Text style={styles.suggestBtnText}>✨ Suggest Me (40 💎)</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderLoadingStep = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingCard}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingTitle}>Analyzing your photo...</Text>
        <Text style={styles.loadingMessage}>{loadingMessage}</Text>

        {/* Progress steps */}
        <View style={styles.progressSteps}>
          {[
            "Validating full body",
            "Detecting skin tone",
            "Matching outfits",
          ].map((s, i) => (
            <View key={i} style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  loadingMessage.toLowerCase().includes(
                    s.split(" ")[0].toLowerCase()
                  ) && styles.progressDotActive,
                ]}
              />
              <Text style={styles.progressStepText}>{s}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderResultsStep = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Skin tone result */}
      <View style={styles.resultHeader}>
        <View style={styles.skinToneCard}>
          <Text style={styles.skinToneLabel}>Skin Tone Detected</Text>
          <Text style={styles.skinToneValue}>
            {skinTone
              ? skinTone.charAt(0).toUpperCase() + skinTone.slice(1)
              : "Analyzed"}
          </Text>
        </View>

        <View style={styles.colorsCard}>
          <Text style={styles.colorsLabel}>Recommended Colors</Text>
          <View style={styles.colorChips}>
            {suggestedColors.map((color, i) => (
              <View key={i} style={styles.colorChip}>
                <Text style={styles.colorChipText}>{color}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Suggestions grid */}
      <Text style={styles.suggestionsTitle}>
        {suggestions.length > 0
          ? `${suggestions.length} Outfits Matched For You`
          : "No outfits found for your profile"}
      </Text>

      {suggestions.length > 0 ? (
        <View style={styles.grid}>
          {suggestions.map((item) => (
            <View key={item._id} style={styles.garmentCard}>
              <Image
                source={{
                  uri: item.imagePath.startsWith("http")
                    ? item.imagePath
                    : `${API_URL.replace("/api", "")}/${item.imagePath.replace(
                        /\\/g,
                        "/"
                      )}`,
                }}
                style={styles.garmentImage}
                resizeMode="cover"
              />
              <View style={styles.garmentInfo}>
                <Text style={styles.garmentColor}>{item.color}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyResults}>
          <Text style={styles.emptyResultsIcon}>👗</Text>
          <Text style={styles.emptyResultsText}>
            No outfits available for your color profile right now.
          </Text>
        </View>
      )}

      {/* Try again */}
      <TouchableOpacity style={styles.tryAgainBtn} onPress={handleReset}>
        <Text style={styles.tryAgainText}>🔄 Try Another Photo</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ── Main render ──────────────────────────────────────────────────────────────

  return (
    <LinearGradient
      colors={["#1c103f", "#080d1a", "#080d1a", "#2d1445"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Outfit Suggestion</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.content}>
          {step === "upload" && renderUploadStep()}
          {step === "loading" && renderLoadingStep()}
          {step === "results" && renderResultsStep()}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 8,
    marginTop: 50,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  backBtnText: { color: "#8b5cf6", fontWeight: "600", fontSize: 14 },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Upload step
  uploadBox: {
    width: "100%",
    height: 320,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    borderStyle: "dashed",
    overflow: "hidden",
    marginBottom: 16,
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  uploadIcon: { fontSize: 48, marginBottom: 16 },
  uploadTitle: {
    color: "#E2E8F0",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  uploadSubtitle: { color: "#64748b", fontSize: 13, textAlign: "center", marginBottom: 16 },
  uploadHint: {
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  uploadHintText: { color: "#8b5cf6", fontSize: 13, fontWeight: "600" },
  personPreview: { width: "100%", height: "100%", resizeMode: "cover" },
  removeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: { color: "#FFF", fontSize: 14, fontWeight: "bold" },

  reminderBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 92, 246, 0.08)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
    gap: 10,
  },
  reminderIcon: { fontSize: 18 },
  reminderText: { color: "#A0AEC0", fontSize: 13, flex: 1, lineHeight: 18 },

  sectionLabel: {
    color: "#A0AEC0",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  genderContainer: { marginBottom: 24 },
  genderRow: { flexDirection: "row", gap: 12 },
  genderBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  genderBtnActive: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    borderColor: "#8b5cf6",
  },
  genderIcon: { fontSize: 18, color: "#A0AEC0" },
  genderText: { color: "#A0AEC0", fontSize: 15, fontWeight: "600" },
  genderTextActive: { color: "#FFFFFF" },

  suggestBtn: { borderRadius: 16, overflow: "hidden", marginBottom: 20 },
  suggestBtnDisabled: { opacity: 0.5 },
  suggestBtnGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestBtnText: { color: "#FFFFFF", fontSize: 17, fontWeight: "bold" },

  // Loading step
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  loadingTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
  },
  loadingMessage: { color: "#8b5cf6", fontSize: 14, marginBottom: 32 },
  progressSteps: { width: "100%", gap: 16 },
  progressStep: { flexDirection: "row", alignItems: "center", gap: 12 },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  progressDotActive: { backgroundColor: "#8b5cf6" },
  progressStepText: { color: "#A0AEC0", fontSize: 14 },

  // Results step
  resultHeader: { flexDirection: "row", gap: 12, marginBottom: 20 },
  skinToneCard: {
    flex: 1,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  skinToneLabel: { color: "#A0AEC0", fontSize: 11, marginBottom: 6, fontWeight: "600" },
  skinToneValue: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  colorsCard: {
    flex: 2,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  colorsLabel: { color: "#A0AEC0", fontSize: 11, marginBottom: 8, fontWeight: "600" },
  colorChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  colorChip: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.4)",
  },
  colorChipText: { color: "#d8b4fe", fontSize: 11, fontWeight: "600" },

  suggestionsTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  garmentCard: {
    width: CARD_SIZE,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  garmentImage: { width: "100%", height: CARD_SIZE * 1.3 },
  garmentInfo: { padding: 10 },
  garmentColor: { color: "#A0AEC0", fontSize: 12, fontWeight: "600", textTransform: "capitalize" },

  emptyResults: { alignItems: "center", padding: 40 },
  emptyResultsIcon: { fontSize: 48, marginBottom: 16 },
  emptyResultsText: { color: "#64748b", fontSize: 14, textAlign: "center" },

  tryAgainBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 20,
  },
  tryAgainText: { color: "#A0AEC0", fontSize: 15, fontWeight: "600" },
});
