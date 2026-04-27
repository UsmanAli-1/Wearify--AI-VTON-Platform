import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { scanPoses } from 'react-native-vision-camera-v3-pose-detection';
import { runOnJS } from 'react-native-worklets-core';

export default function SmartCamera({ onCapture }: { onCapture: (uri: string) => void }) {
  const device = useCameraDevice('front');
  const [isAligned, setIsAligned] = useState(false);
  const [cameraRef, setCameraRef] = useState<Camera | null>(null);

  // 1. Safely bridge the AI thread back to the React UI thread
  const updateUI = (aligned: boolean) => {
    setIsAligned(aligned);
  };

  // 🧠 2. THE REAL-TIME AI ENGINE
  // This runs continuously on the native GPU
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    // Pass the raw camera frame to Google MLKit
    const poses = scanPoses(frame);

    if (poses.length > 0) {
      const pose = poses[0]; // Isolate the primary person

      // Grab the Y-coordinates of the top and bottom of the body
      const nose = pose.nose;
      const leftAnkle = pose.leftAnkle;
      const rightAnkle = pose.rightAnkle;

      if (nose && leftAnkle && rightAnkle) {
        // Ensure the nose is safely below the top edge of the frame
        const headInFrame = nose.y > 50 && nose.y < 350; 
        
        // Ensure the ankles are safely above the bottom edge of the frame
        const feetInFrame = leftAnkle.y < frame.height - 50 || rightAnkle.y < frame.height - 50;

        if (headInFrame && feetInFrame) {
          runOnJS(updateUI)(true); // Perfect alignment!
        } else {
          runOnJS(updateUI)(false); // Stepped too close or chopped off frame
        }
      }
    } else {
      runOnJS(updateUI)(false); // Nobody is in the frame
    }
  }, []);

  const takePicture = async () => {
    if (cameraRef && isAligned) {
      const photo = await cameraRef.takePhoto({ qualityPrioritization: 'speed' });
      onCapture(`file://${photo.path}`); 
    }
  };

  if (device == null) return <View style={styles.container}><Text style={{color: 'white'}}>Initializing Hardware...</Text></View>;

  return (
    <View style={styles.container}>
      <Camera
        ref={(ref) => setCameraRef(ref)}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
        frameProcessor={frameProcessor} // Attach the AI brain
      />
      
      <View style={styles.overlay}>
        <View style={[styles.targetBox, { borderColor: isAligned ? '#10b981' : '#ef4444' }]}>
          <Text style={[styles.guideText, { color: isAligned ? '#10b981' : '#ef4444' }]}>
            {isAligned ? "Perfect Alignment! ✅" : "Step back to fit full body"}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.captureBtn, !isAligned && styles.captureBtnDisabled]}
          disabled={!isAligned}
          onPress={takePicture}
        >
          <View style={[styles.innerCaptureBtn, isAligned && { backgroundColor: '#10b981' }]} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between', paddingVertical: 60, alignItems: 'center' },
  targetBox: {
    width: '85%',
    height: '75%',
    borderWidth: 4,
    borderRadius: 24,
    alignItems: 'center',
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  guideText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  captureBtn: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  captureBtnDisabled: { opacity: 0.5 },
  innerCaptureBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF' },
});