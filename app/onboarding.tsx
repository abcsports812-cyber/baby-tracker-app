import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Button } from '../src/components/ui/Button';
import { FormField } from '../src/components/ui/FormField';
import { DateTimeField } from '../src/components/ui/DateTimeField';
import { IllustrationBadge } from '../src/components/ui/IllustrationBadge';
import { ChipSelect } from '../src/components/ui/ChipSelect';
import { fontSize, palette, spacing } from '../src/theme';
import { useBabyProfilesStore, useSettingsStore } from '../src/store';
import { ensureLegacyDefaultBaby, setActiveBaby } from '../src/lib/babyScope';
import { generateId, nowIso } from '../src/lib/id';
import type { Gender } from '../src/types/models';

const STEPS = ['welcome', 'baby', 'finish'] as const;

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [dob, setDob] = useState(new Date());
  const [gender, setGender] = useState<Gender>('unspecified');
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  const addProfile = useBabyProfilesStore((s) => s.add);
  const patchSettings = useSettingsStore((s) => s.patch);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const finish = () => {
    const now = nowIso();
    const newProfile = {
      id: generateId(),
      name: name.trim() || 'Baby',
      dateOfBirth: dob.toISOString().slice(0, 10),
      gender,
      photoUri,
      createdAt: now,
      updatedAt: now,
    };
    addProfile(newProfile);
    setActiveBaby(newProfile.id);
    ensureLegacyDefaultBaby(newProfile.id);
    patchSettings({ onboardingCompleted: true });
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.dots}>
          {STEPS.map((s, i) => (
            <View key={s} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        {step === 0 && (
          <Animated.View entering={FadeIn} style={styles.centerContent}>
            <IllustrationBadge name="home" size={160} />
            <Text style={styles.title}>Welcome to Baby Tracker</Text>
            <Text style={styles.subtitle}>Your little one’s journey, beautifully organized.</Text>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View entering={FadeInDown} style={styles.formContent}>
            <Text style={styles.title}>Let’s set up your baby</Text>
            <Text style={styles.subtitle}>You can always edit this later.</Text>

            <Pressable style={styles.photoPicker} onPress={pickPhoto}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera" size={26} color={palette.primaryPinkDark} />
                </View>
              )}
              <Text style={styles.photoLabel}>Add photo</Text>
            </Pressable>

            <FormField label="Baby's name" value={name} onChangeText={setName} placeholder="e.g. Luna" />
            <DateTimeField label="Date of birth" value={dob} onChange={setDob} mode="date" maximumDate={new Date()} />
            <ChipSelect
              label="Gender"
              value={gender}
              onChange={setGender}
              options={[
                { value: 'girl', label: 'Girl' },
                { value: 'boy', label: 'Boy' },
                { value: 'other', label: 'Other' },
                { value: 'unspecified', label: 'Prefer not to say' },
              ]}
            />
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeIn} style={styles.centerContent}>
            <IllustrationBadge name="babyProfile" size={160} />
            <Text style={styles.title}>You’re ready to start your baby’s journey 💕</Text>
            <Text style={styles.subtitle}>Track feeding, sleep, growth, milestones and more — all in one calm, beautiful place.</Text>
          </Animated.View>
        )}

        <View style={styles.footer}>
          {step > 0 && (
            <Button label="Back" variant="secondary" onPress={() => setStep((s) => s - 1)} style={{ flex: 1 }} />
          )}
          {step < STEPS.length - 1 ? (
            <Button
              label={step === 0 ? "Let's go" : 'Continue'}
              onPress={() => setStep((s) => s + 1)}
              style={{ flex: 1 }}
            />
          ) : (
            <Button label="Start tracking" onPress={finish} style={{ flex: 1 }} icon="heart" />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.cream },
  flex: { flex: 1, paddingHorizontal: spacing.xl },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.border,
  },
  dotActive: {
    backgroundColor: palette.primaryPink,
    width: 20,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  formContent: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: palette.text,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  photoPicker: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  photo: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  photoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: palette.softPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: palette.primaryPinkDark,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
});
