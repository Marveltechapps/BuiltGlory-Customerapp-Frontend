import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SampleItem } from '../types/sample';
import { colors, spacing } from '../theme';

export function SampleCard({ item }: { item: SampleItem }) {
  return <View style={styles.card}><Text style={styles.title}>{item.name}</Text><Text>{item.description}</Text><Text>{item.id}</Text></View>;
}
const styles = StyleSheet.create({
  card: { padding: spacing.medium, marginBottom: spacing.medium, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
  title: { fontSize: 20, color: colors.text, fontWeight: '600', marginBottom: spacing.small },
});
