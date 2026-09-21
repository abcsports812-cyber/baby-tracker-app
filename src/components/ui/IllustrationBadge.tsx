import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { categoryColors } from '../../theme';
import { illustrationIconFallback, illustrationSources, type IllustrationKey } from '../../theme/illustrations';

interface Props {
  name: IllustrationKey;
  size?: number;
}

export function IllustrationBadge({ name, size = 56 }: Props) {
  const source = illustrationSources[name];

  if (source) {
    return (
      <Image
        source={source}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        transition={150}
      />
    );
  }

  const fallback = illustrationIconFallback[name];
  const colors = categoryColors[fallback.category];

  return (
    <View
      style={[
        styles.iconWrap,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.bg },
      ]}
    >
      <Ionicons name={fallback.icon} size={size * 0.46} color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
