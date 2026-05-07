import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useTensorflowModel } from 'react-native-fast-tflite';
import * as ImageManipulator from 'expo-image-manipulator';

interface LivePoseCameraProps {
  onCapture: (uri: string) => void;
}


interface Keypoint {
  x: number;
  y: number;
  confidence: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LivePoseCamera({ onCapture }: LivePoseCameraProps) {
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<any>(null);

  const model = useTensorflowModel(
    require('../assets/images/models/3.tflite'),
    ['nnapi']
  );

  const [keypoints, setKeypoints] = useState<Keypoint[]>([]);
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  useEffect(() => {
    if (!model || model.state !== 'loaded') {
      setStatus("Loading Model...");
      return;
    }

    setStatus("Detecting Pose...");

    const interval = setInterval(async () => {
      try {
        if (!cameraRef.current) return;

        const snapshot = await cameraRef.current.takeSnapshot({ quality: 70 });
        const imageUri = snapshot?.path || snapshot?.uri;

        if (!imageUri) return;

        const inputTensor = await prepareImage(imageUri);
        if (!inputTensor) return;

        const output: any = model.model.runSync([inputTensor]);
        const raw = output?.[0];

        if (raw) {
          const processed = processKeypoints(raw);
          setKeypoints(processed);
        }
      } catch (e) {
        console.log('Detection error:', e);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [model]);

  const prepareImage = async (uri: string): Promise<ArrayBuffer | null> => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 192, height: 192 } }],
        { compress: 1.0, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!manipResult.base64) return null;

      const binaryString = atob(manipResult.base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      console.error('Prepare failed:', error);
      return null;
    }
  };

  const processKeypoints = (raw: any): Keypoint[] => {
    let points = raw;
    if (Array.isArray(points) && points.length === 1) points = points[0];
    if (Array.isArray(points) && points.length === 1) points = points[0];

    const kp: Keypoint[] = [];
    for (let i = 0; i < 17; i++) {
      const x = points[i]?.[0] || 0;
      const y = points[i]?.[1] || 0;
      const conf = points[i]?.[2] || 0;

      kp.push({
        x: x * SCREEN_WIDTH,
        y: y * (SCREEN_HEIGHT * 0.82),   // Adjusted for camera preview
        confidence: conf
      });
    }
    return kp;
  };

  if (!hasPermission || !device) {
    return <Text style={styles.loading}>Loading Camera...</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
      />

      {/* Draw Keypoints */}
      {keypoints.map((kp, index) => (
        kp.confidence > 0.2 && (
          <View
            key={index}
            style={[
              styles.keypoint,
              {
                left: kp.x - 8,
                top: kp.y - 8,
                backgroundColor: kp.confidence > 0.4 ? '#00FF00' : '#FFAA00',
              },
            ]}
          />
        )
      ))}

      <View style={styles.bottomBar}>
        <Text style={styles.status}>{status}</Text>
        <Text style={styles.info}>
          Min Confidence: {keypoints.length > 0 ? Math.max(...keypoints.map(k => k.confidence)).toFixed(3) : '0.000'}
        </Text>

        <TouchableOpacity style={styles.captureBtn} onPress={() => console.log("Capture pressed")}>
          <Text style={styles.captureText}>CAPTURE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loading: { color: 'white', textAlign: 'center', marginTop: 100, fontSize: 18 },

  keypoint: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  status: {
    color: '#00FF00',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  info: {
    color: 'white',
    fontSize: 14,
    marginBottom: 15,
  },
  captureBtn: {
    backgroundColor: 'white',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 50,
  },
  captureText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 18,
  },
});