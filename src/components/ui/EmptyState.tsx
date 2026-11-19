import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, elev, gradients } from '../../theme';
import { Icon } from '../icons/Icon';
import { Float } from './Float';
import { T } from './T';

/** Empty list state: floating mint halo, icon tile, title, body, action. */
export function EmptyState({ icon = 'inbox', title, body, action }: { icon?: string; title: React.ReactNode; body?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.art}>
        <Float style={styles.halo} />
        <View style={styles.tile}><Icon name={icon} size={26} color="#1A6FFF" /></View>
      </View>
      <T display s={17} w={800} ls={-0.02} align="center" style={styles.title}>{title}</T>
      {body ? <T s={12.5} c={colors.ink500} lh={1.625} align="center" style={styles.body}>{body}</T> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 56, paddingHorizontal: 24, alignItems: 'center' },
  art: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 9999, opacity: 0.7, experimental_backgroundImage: gradients.meshMint },
  tile: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.white, boxShadow: elev.e2, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 20 },
  body: { marginTop: 6, maxWidth: 250 },
  action: { marginTop: 20, alignSelf: 'stretch', alignItems: 'center' },
});
