import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '../../src/theme';

// The visual height/padding of the tab bar's own icon+label content,
// unchanged from before this fix -- only the safe-area inset below it
// changes per device.
const TAB_BAR_CONTENT_HEIGHT = 64;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primaryPinkDark,
        tabBarInactiveTintColor: palette.textFaint,
        tabBarStyle: {
          backgroundColor: palette.white,
          borderTopColor: palette.border,
          // Setting a numeric `height` here makes expo-router/react-navigation
          // use it EXACTLY, with none of its own bottom-inset handling added
          // (confirmed in expo-router's vendored BottomTabBar.js:
          // getTabBarHeight returns a custom numeric height as-is). Without
          // adding insets.bottom back in ourselves, the tab bar's visible
          // content sits in the same screen real estate as the Android
          // system nav bar / gesture area. Adding insets.bottom here is the
          // one and only place it's added -- never doubled with a second
          // safe-area reservation elsewhere.
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingBottom: spacing.sm + insets.bottom,
          paddingTop: spacing.sm,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track',
          tabBarIcon: ({ color, size }) => <Ionicons name="apps" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <Ionicons name="ellipsis-horizontal-circle" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
