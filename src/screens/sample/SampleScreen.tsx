import React from 'react';
import { Button, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

/** Sample API screen removed — production services live under src/services/. */
export function SampleScreen({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView style={styles.container}>
      <Button title="Back" onPress={onBack} />
      <Text style={styles.title}>Sample API removed</Text>
      <Text style={styles.body}>
        The scaffold GET /samples client has been replaced by the Builtglory API
        services. This screen is a placeholder until navigation is cleaned up.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.large, backgroundColor: colors.background },
  title: { fontSize: 28, fontWeight: '600', marginVertical: spacing.medium, color: colors.text },
  body: { fontSize: 16, lineHeight: 22, color: colors.text },
});
