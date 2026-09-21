import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { FormField } from '../../src/components/ui/FormField';
import { DateTimeField } from '../../src/components/ui/DateTimeField';
import { ChipSelect } from '../../src/components/ui/ChipSelect';
import { Button } from '../../src/components/ui/Button';
import { useBabyProfileStore, useSettingsStore } from '../../src/store';
import { generateId, nowIso } from '../../src/lib/id';
import { showToast } from '../../src/components/ui/Toast';
import { kgToDisplay, cmToDisplay, weightToKg, heightToCm } from '../../src/lib/units';
import { palette, spacing } from '../../src/theme';
import type { Gender } from '../../src/types/models';

export default function EditProfileScreen() {
  const profile = useBabyProfileStore((s) => s.value);
  const setProfile = useBabyProfileStore((s) => s.set);
  const weightUnit = useSettingsStore((s) => s.value.weightUnit);
  const heightUnit = useSettingsStore((s) => s.value.heightUnit);

  const [name, setName] = useState(profile?.name ?? '');
  const [dob, setDob] = useState(profile ? new Date(profile.dateOfBirth) : new Date());
  const [gender, setGender] = useState<Gender>(profile?.gender ?? 'unspecified');
  const [birthWeight, setBirthWeight] = useState(kgToDisplay(profile?.birthWeightKg, weightUnit));
  const [birthHeight, setBirthHeight] = useState(cmToDisplay(profile?.birthHeightCm, heightUnit));
  const [bloodType, setBloodType] = useState(profile?.bloodType ?? '');
  const [notes, setNotes] = useState(profile?.notes ?? '');
  const [photoUri, setPhotoUri] = useState(profile?.photoUri);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const save = () => {
    const now = nowIso();
    setProfile({
      id: profile?.id ?? generateId(),
      name: name.trim() || 'Baby',
      dateOfBirth: dob.toISOString().slice(0, 10),
      gender,
      birthWeightKg: birthWeight ? weightToKg(Number(birthWeight), weightUnit) : undefined,
      birthHeightCm: birthHeight ? heightToCm(Number(birthHeight), heightUnit) : undefined,
      bloodType: bloodType.trim() || undefined,
      photoUri,
      notes: notes.trim() || undefined,
      createdAt: profile?.createdAt ?? now,
      updatedAt: now,
    });
    showToast('Profile saved', 'heart');
    router.back();
  };

  return (
    <Screen>
      <ModuleHeader illustration="babyProfile" title={profile ? 'Edit Profile' : 'Baby Profile'} />

      <Pressable style={styles.photoPicker} onPress={pickPhoto}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera" size={26} color={palette.primaryPinkDark} />
          </View>
        )}
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
      <FormField label={`Birth weight (${weightUnit})`} value={birthWeight} onChangeText={setBirthWeight} keyboardType="decimal-pad" optional />
      <FormField label={`Birth height (${heightUnit})`} value={birthHeight} onChangeText={setBirthHeight} keyboardType="decimal-pad" optional />
      <FormField label="Blood type" value={bloodType} onChangeText={setBloodType} placeholder="e.g. O+" optional />
      <FormField label="Notes" value={notes} onChangeText={setNotes} multiline optional />

      <Button label="Save profile" icon="checkmark" onPress={save} fullWidth size="lg" style={{ marginTop: spacing.md }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoPicker: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: palette.softPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
