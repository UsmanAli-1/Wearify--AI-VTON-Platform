import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";

const { width, height } = Dimensions.get("window");

// Define the boundaries of our visual guide
const BOX_WIDTH = width * 0.8;
const BOX_HEIGHT = height * 0.7;

export default function SmartCamera({
  onCapture,
}: {
  onCapture: (uri: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [facing, setFacing] = useState<"front" | "back">("front");

  // ✨ The Demo Hack States
  const [isScanning, setIsScanning] = useState(true);

  // 🧠 Fake the "AI Scan" for the demo
  useEffect(() => {
    // Start scanning (Orange)
    setIsScanning(true);

    // After 3.5 seconds, pretend the AI found the body and turn Green!
    const timer = setTimeout(() => {
      setIsScanning(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, [facing]); // Re-run the scan if they flip the camera

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need camera access for the fitting room.
        </Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestPermission}
        >
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef && !isScanning) {
      const photo = await cameraRef.takePictureAsync({ quality: 0.8 });
      onCapture(photo.uri);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={(ref) => setCameraRef(ref)}
      >
        <View style={styles.overlay}>
          {/* Top Controls */}
          <View style={[styles.darkArea, styles.topControls]}>
            <TouchableOpacity
              style={styles.flipBtn}
              onPress={toggleCameraFacing}
            >
              <Text style={styles.flipBtnText}>🔄 Flip</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.middleRow}>
            <View style={styles.darkArea} />

            {/* THE TARGET BOX */}
            <View
              style={[
                styles.targetBox,
                { borderColor: isScanning ? "#f59e0b" : "#10b981" }, // Orange -> Green
              ]}
            >
              <Text
                style={[
                  styles.guideText,
                  { color: isScanning ? "#f59e0b" : "#10b981" },
                ]}
              >
                {isScanning
                  ? "Align full body in frame..."
                  : "Ready to capture ✅"}
              </Text>
            </View>

            <View style={styles.darkArea} />
          </View>

          <View style={styles.darkArea}>
            <TouchableOpacity
              style={[
                styles.captureBtn,
                isScanning && styles.captureBtnDisabled,
              ]}
              disabled={isScanning}
              onPress={takePicture}
            >
              <View
                style={[
                  styles.innerCaptureBtn,
                  !isScanning && { backgroundColor: "#10b981" },
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: "transparent" },
  darkArea: { flex: 1, backgroundColor: "rgba(10, 15, 28, 0.7)" },

  topControls: {
    alignItems: "flex-end",
    paddingTop: 50,
    paddingRight: 20,
  },
  flipBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  flipBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },

  middleRow: { flexDirection: "row", height: BOX_HEIGHT },

  targetBox: {
    width: BOX_WIDTH,
    height: BOX_HEIGHT,
    borderWidth: 4,
    borderRadius: 24,
    backgroundColor: "transparent",
    alignItems: "center",
    paddingTop: 20,
  },
  guideText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 10,
  },

  captureBtn: {
    alignSelf: "center",
    marginTop: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureBtnDisabled: { opacity: 0.5 },
  innerCaptureBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
  },

  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#080d1a",
  },
  permissionText: { color: "#FFF", fontSize: 16, marginBottom: 20 },
  permissionBtn: { backgroundColor: "#8b5cf6", padding: 12, borderRadius: 8 },
  permissionBtnText: { color: "#FFF", fontWeight: "bold" },
});
