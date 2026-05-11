import { API_URL } from '@/constants/config';
import { useStripe } from '@stripe/stripe-react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import SmartCamera from '../../components/SmartCamera';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Garment {
  _id: string;
  name: string;
  imagePath: string;
}

type PlanKey = 'basic' | 'pro' | 'premium';

interface Plan {
  key: PlanKey;
  name: string;
  price: string;
  points: number;
  diamonds: number;   // diamonds added to local state on success
  popular?: boolean;
}

// ─── Plan definitions (must match backend `plans` object) ────────────────────

const PLANS: Plan[] = [
  { key: 'basic', name: 'Basic', price: 'Rs. 1,200', points: 400, diamonds: 400 },
  { key: 'pro', name: 'Pro', price: 'Rs. 3,000', points: 1000, diamonds: 1000, popular: true },
  { key: 'premium', name: 'Premium', price: 'Rs. 6,000', points: 2000, diamonds: 2000 },
];

// ─── Helper: get auth token (adjust to however you store it) ─────────────────

async function getAuthToken(): Promise<string> {
  // Replace with your actual token retrieval, e.g. from AsyncStorage or context
  const AsyncStorage = await import('@react-native-async-storage/async-storage');
  const token = await AsyncStorage.default.getItem('authToken');
  return token ?? '';
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const { presentPaymentSheet, initPaymentSheet } = useStripe();

  // --- Data & Economy State ---
  const [garments, setGarments] = useState<Garment[]>([]);
  const [isLoadingGarments, setIsLoadingGarments] = useState(true);
  const [diamonds, setDiamonds] = useState(120);
  const [showPlans, setShowPlans] = useState(false);

  // --- UI & Action State ---
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(null);
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  // --- Payment State ---
  const [payingPlan, setPayingPlan] = useState<PlanKey | null>(null);

  // ── Fetch garments ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchGarments = async () => {
      try {
        const response = await axios.get(`${API_URL}/garments`, {
          headers: { 'Bypass-Tunnel-Reminder': 'true' },
        });
        setGarments(response.data);
      } catch (error) {
        console.error('Failed to fetch garments:', error);
      } finally {
        setIsLoadingGarments(false);
      }
    };
    fetchGarments();
  }, []);

  // ── Image selection ─────────────────────────────────────────────────────────

  const handleCameraOpen = () => {
    setShowCamera(true);
    setGeneratedImage(null);
  };

  const handleGalleryOpen = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'We need access to your photos!');
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

  const handleImageOption = () => {
    Alert.alert(
      'Add Target Person',
      'How would you like to provide your photo?',
      [
        { text: 'Smart Camera (Recommended)', onPress: handleCameraOpen },
        { text: 'Choose from Gallery', onPress: handleGalleryOpen },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  // ── Try-on ──────────────────────────────────────────────────────────────────

  const handleGenerateTryOn = async () => {
    if (diamonds < 40) {
      setShowPlans(true);
      return;
    }

    setIsGenerating(true);

    try {
      const token = await getAuthToken();

      // Get the selected garment details
      const selectedGarment = garments.find(g => g._id === selectedGarmentId);
      if (!selectedGarment) return;

      // Build multipart form
      const formData = new FormData();
      formData.append('image', {
        uri: personImage,
        name: 'person.jpg',
        type: 'image/jpeg',
      } as any);
      formData.append('garmentId', selectedGarment._id);

      const { data } = await axios.post(
        `${API_URL}/users/generate`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // 2 min timeout for AI processing
        }
      );

      setDiamonds(data.points);
      setGeneratedImage(data.resultImage);  // ← use result directly

      if (data.pointsExhausted) {
        setShowPlans(true);
      }

    } catch (err: any) {
      const msg = err?.response?.data?.message ?? '';
      const reason = err?.response?.data?.reason ?? '';

      if (msg.includes('full') || msg.includes('Invalid image')) {
        Alert.alert(
          'Full Body Required 📸',
          `Please upload a clear head-to-toe photo.\n\n${reason}`,
          [{ text: 'Try Again', style: 'default' }]
        );
      } else if (msg.includes('points') || msg.includes('Points')) {
        setShowPlans(true);
      } else {
        Alert.alert('Error', msg || 'Something went wrong. Please try again.');
      }

    } finally {
      setIsGenerating(false);
    }
  };
  const handleReset = () => {
    setGeneratedImage(null);
    setSelectedGarmentId(null);
    setPersonImage(null);
  };
  // ── Payment flow ────────────────────────────────────────────────────────────

  /**
   * 1. Ask backend for a PaymentIntent clientSecret
   * 2. Init the Stripe payment sheet
   * 3. Present the native card UI
   * 4. On success → add diamonds locally (backend webhook handles DB update)
   */
  const handlePurchasePlan = async (plan: Plan) => {
    setPayingPlan(plan.key);
    try {
      // Step 1 – get clientSecret from your backend
      const token = await getAuthToken();
      const { data } = await axios.post(
        `${API_URL}/payment/create-payment-intent`,
        { plan: plan.key },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const { clientSecret } = data;

      // Step 2 – initialise the payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Wearify',
        appearance: {
          colors: {
            primary: '#8b5cf6',
            background: '#0A0F1C',
            componentBackground: '#141929',
            componentBorder: '#1f2937',
            componentDivider: '#1f2937',
            primaryText: '#FFFFFF',
            secondaryText: '#A0AEC0',
            componentText: '#FFFFFF',
            placeholderText: '#64748b',
            icon: '#8b5cf6',
            error: '#ef4444',
          },
          shapes: {
            borderRadius: 12,
            borderWidth: 0.5,
          },
          primaryButton: {
            colors: {
              background: '#8b5cf6',
              text: '#FFFFFF',
            },
            shapes: { borderRadius: 12 },
          },
        },
      });

      if (initError) {
        Alert.alert('Payment Error', initError.message);
        setPayingPlan(null);
        return;
      }

      // Step 3 – present native card sheet
      const { error: payError } = await presentPaymentSheet();

      if (payError) {
        if (payError.code !== 'Canceled') {
          Alert.alert('Payment Failed', payError.message);
        }
        setPayingPlan(null);
        return;
      }

      // Step 4 – payment succeeded 🎉
      setDiamonds(prev => prev + plan.diamonds);
      setShowPlans(false);
      setPayingPlan(null);

      Alert.alert(
        '💎 Purchase Successful!',
        `${plan.diamonds} diamonds have been added to your account. Happy styling!`,
        [{ text: 'Awesome!', style: 'default' }],
      );
    } catch (err: any) {
      console.error('Payment error:', err);
      Alert.alert(
        'Payment Error',
        err?.response?.data?.message ?? 'Something went wrong. Please try again.',
      );
      setPayingPlan(null);
    }
  };

  // ── Derived state ───────────────────────────────────────────────────────────
  const isReadyToGenerate = selectedGarmentId !== null && personImage !== null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <LinearGradient
      colors={['#1c103f', '#080d1a', '#080d1a', '#2d1445']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.backgroundGradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.mainWrapper}>

          {/* ── HEADER ── */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/logo1.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={styles.headerRight}>
              {/* Tapping the diamond badge opens the plans modal */}
              <TouchableOpacity onPress={() => setShowPlans(true)}>
                <View style={styles.diamondBadge}>
                  <Text style={styles.diamondText}>💎 {diamonds}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.replace('/auth')}>
                <LinearGradient
                  colors={['#8b5cf6', '#3b82f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.signOutBtn}
                >
                  <Text style={styles.signOutText}>Sign Out</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── QUICK NAV BUTTONS ── */}
          <View style={styles.quickNav}>
            <TouchableOpacity
              style={styles.quickNavBtn}
              onPress={() => router.push('/AISuggestionScreen' as any)}
            >
              <LinearGradient
                colors={['rgba(139,92,246,0.2)', 'rgba(59,130,246,0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.quickNavGradient}
              >
                <Text style={styles.quickNavIcon}>✨</Text>
                <Text style={styles.quickNavText}>AI Suggest</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickNavBtn}
              onPress={() => router.push('/TryOnHistoryScreen' as any)}
            >
              <LinearGradient
                colors={['rgba(16,185,129,0.2)', 'rgba(5,150,105,0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.quickNavGradient}
              >
                <Text style={styles.quickNavIcon}>🕓</Text>
                <Text style={styles.quickNavText}>My Try-Ons</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── GARMENT CAROUSEL ── */}
          <View style={styles.carouselContainer}>
            {isLoadingGarments ? (
              <ActivityIndicator size="small" color="#8b5cf6" />
            ) : (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={garments}
                keyExtractor={item => item._id}
                renderItem={({ item }) => {
                  const isSelected = selectedGarmentId === item._id;
                  return (
                    <TouchableOpacity
                      onPress={() => setSelectedGarmentId(item._id)}
                      style={[styles.garmentCard, isSelected && styles.garmentCardSelected]}
                    >
                      <Image
                        source={{
                          uri: item.imagePath.startsWith('http')
                            ? item.imagePath
                            : `${API_URL.replace('/api', '')}/${item.imagePath.replace(/\\/g, '/')}`,
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

          {/* ── DYNAMIC CANVAS ── */}
          <View style={styles.canvasWrapper}>
            <TouchableOpacity
              style={[
                styles.mainContainer,
                generatedImage ? styles.mainContainerSuccess : null,
              ]}
              onPress={generatedImage ? undefined : handleImageOption}
              activeOpacity={generatedImage ? 1 : 0.7}
            >
              {isGenerating ? (
                <View style={styles.placeholder}>
                  <ActivityIndicator size="large" color="#8b5cf6" style={{ marginBottom: 16 }} />
                  <Text style={styles.uploadText}>Generating AI Preview...</Text>
                  <Text style={styles.subUploadText}>Applying diffusion models</Text>
                </View>
              ) : generatedImage ? (
                <Image source={{ uri: generatedImage }} style={styles.previewImage} />
              ) : personImage ? (
                <View style={{ flex: 1, width: '100%' }}>
                  <Image source={{ uri: personImage }} style={styles.previewImage} />
                  <View style={styles.editOverlay}>
                    <Text style={styles.editOverlayText}>Tap to change photo</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.iconText}>📸</Text>
                  <Text style={styles.uploadText}>Add Target Person</Text>
                  <Text style={styles.subUploadText}>Tap to open camera or gallery</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ── ACTION BUTTON ── */}
          <View style={styles.footer}>
            {!generatedImage ? (
              <TouchableOpacity
                style={[
                  styles.buttonContainer,
                  (!isReadyToGenerate || isGenerating) ? styles.buttonDisabled : null,
                ]}
                disabled={!isReadyToGenerate || isGenerating}
                onPress={handleGenerateTryOn}
              >
                <LinearGradient
                  colors={isReadyToGenerate ? ['#8b5cf6', '#3b82f6'] : ['#1f2937', '#1f2937']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradient}
                >
                  <Text style={[styles.buttonText, !isReadyToGenerate ? styles.buttonTextDisabled : null]}>
                    {isGenerating ? 'Processing...' : 'Try On (40 💎)'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.buttonContainer} onPress={handleReset}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
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

      {/* ── SMART CAMERA MODAL ── */}
      <Modal visible={showCamera} animationType="slide" onRequestClose={() => setShowCamera(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <SmartCamera
            onCapture={uri => {
              setPersonImage(uri);
              setShowCamera(false);
            }}
          />
          <TouchableOpacity style={styles.closeCameraBtn} onPress={() => setShowCamera(false)}>
            <Text style={styles.closeCameraText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── PAYWALL / PLANS MODAL ── */}
      <Modal visible={showPlans} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            {/* Close button */}
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowPlans(false)}>
              <Text style={styles.closeModalText}>✕</Text>
            </TouchableOpacity>

            {/* Header changes depending on context */}
            {diamonds < 40 ? (
              <>
                <Text style={styles.modalTitle}>Out of Diamonds!</Text>
                <Text style={styles.modalSubtitle}>Upgrade your plan to keep generating.</Text>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>💎 {diamonds} Diamonds</Text>
                <Text style={styles.modalSubtitle}>Top up to generate more try-ons.</Text>
              </>
            )}

            {/* Plan cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.planScroll}
            >
              {PLANS.map(plan => {
                const isPro = plan.popular === true;
                const isLoading = payingPlan === plan.key;

                return (
                  <View
                    key={plan.key}
                    style={[styles.planCard, isPro && styles.planCardPro]}
                  >
                    {/* Popular badge */}
                    {isPro && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>Most Popular</Text>
                      </View>
                    )}

                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    <Text style={styles.planPoints}>{plan.points} Points</Text>

                    {/* CTA button */}
                    <TouchableOpacity
                      style={isPro ? styles.planBtnPro : styles.planBtn}
                      onPress={() => handlePurchasePlan(plan)}
                      disabled={payingPlan !== null}   // disable all cards while one is loading
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.planBtnText}>
                          {isPro ? 'Upgrade Now' : plan.key === 'basic' ? 'Get Started' : 'Go Premium'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>

            {/* Stripe trust badge */}
            <Text style={styles.stripeBadge}>🔒 Secured by Stripe</Text>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backgroundGradient: { flex: 1 },
  container: { flex: 1, backgroundColor: 'transparent' },
  mainWrapper: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 50,
  },
  headerLogo: { width: 100, height: 40, marginLeft: -25 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  diamondBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  diamondText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },

  signOutBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  signOutText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },

  quickNav: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickNavBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  quickNavGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  quickNavIcon: { fontSize: 16 },
  quickNavText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },

  carouselContainer: { height: 100, marginBottom: 16, justifyContent: 'center' },
  garmentCard: {
    width: 75,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  garmentCardSelected: { borderColor: '#8b5cf6' },
  garmentImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  checkmarkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#8b5cf6',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },

  canvasWrapper: { flex: 1, justifyContent: 'center', marginBottom: 16 },
  mainContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContainerSuccess: {
    borderStyle: 'solid',
    borderColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  placeholder: { alignItems: 'center', padding: 20 },
  iconText: { fontSize: 40, marginBottom: 12 },
  uploadText: { color: '#E2E8F0', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  subUploadText: { color: '#64748b', fontSize: 12 },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  editOverlayText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },

  footer: { width: '100%', marginTop: 'auto' },
  buttonContainer: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  buttonDisabled: { opacity: 0.7 },
  gradient: { paddingVertical: 16, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  buttonTextDisabled: { color: '#9ca3af' },

  closeCameraBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closeCameraText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0A0F1C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    minHeight: 420,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  closeModalBtn: { alignSelf: 'flex-end', padding: 8 },
  closeModalText: { color: '#64748b', fontSize: 20, fontWeight: 'bold' },
  modalTitle: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  modalSubtitle: { color: '#A0AEC0', fontSize: 16, marginBottom: 24 },

  planScroll: { paddingRight: 24, alignItems: 'center' },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    width: 200,
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  planCardPro: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  popularText: { color: '#d8b4fe', fontSize: 10, fontWeight: 'bold' },

  planName: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  planPrice: { color: '#FFF', fontSize: 24, fontWeight: '900', marginBottom: 12 },
  planPoints: { color: '#A0AEC0', fontSize: 14, marginBottom: 24 },

  planBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  planBtnPro: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  planBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  stripeBadge: {
    color: '#4B5563',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});
