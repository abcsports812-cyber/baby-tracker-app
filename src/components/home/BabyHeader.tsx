import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { calculateAge, formatDate } from '../../lib/date';
import { fontSize, palette, radius, spacing } from '../../theme';
import type { BabyProfile } from '../../types/models';

interface Props {
  profile: BabyProfile;
}

export function BabyHeader({ profile }: Props) {
  const age = calculateAge(profile.dateOfBirth);

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {profile.photoUri ? (
          <Image source={{ uri: profile.photoUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="happy" size={28} color={palette.primaryPinkDark} />
          </View>
        )}
        <View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.meta}>
            {age.label} · Born {formatDate(profile.dateOfBirth)}
          </Text>
        </View>
      </View>
      <Pressable style={styles.profileBtn} onPress={() => router.push('/profile')} hitSlop={8}>
        <Ionicons name="chevron-forward" size={18} color={palette.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: palette.softPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: palette.text,
  },
  meta: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
    marginTop: 2,
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
