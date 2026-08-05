import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@flow/design-system';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: colors.primary[600],
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.neutral[50] },
        }}
      >
        <Stack.Screen name="index" options={{ title: '心流OS', headerShown: false }} />
      </Stack>
    </>
  );
}
