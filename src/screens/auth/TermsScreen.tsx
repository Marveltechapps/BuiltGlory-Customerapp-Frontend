import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/icons/Icon';
import { Screen, TopBar } from '../../components/layout/Screen';
import { SolidBtn } from '../../components/ui/SolidBtn';
import { T } from '../../components/ui/T';
import type { ScreenProps } from '../../navigation/types';
import * as content from '../../services/content.service';
import { colors } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';

/** S-07 Terms & Privacy (also P-12 Terms of Use) — body from GET /content?section=legal. */
export function TermsScreen({ onNext, back }: ScreenProps) {
  const [t1, setT1] = useState(false);
  const [t2, setT2] = useState(false);
  const [t3, setT3] = useState(false);
  const [paras, setParas] = useState<string[]>([]);
  const [title, setTitle] = useState('Builtglory Marketplace Agreement');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const checks: [boolean, (v: boolean) => void, string][] = [
    [t1, setT1, 'I have read and accept the Terms of Service'],
    [t2, setT2, 'I accept the Privacy Policy and data use'],
    [t3, setT3, 'I consent to receive updates by SMS / Email'],
  ];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    content.listContent({ section: 'legal', limit: 20 })
      .then(res => {
        if (cancelled) return;
        const items = res.items || [];
        if (items[0]?.title) setTitle(items[0].title);
        const bodies = items
          .map(i => String(i.body || i.excerpt || '').trim())
          .filter(Boolean);
        if (bodies.length) {
          setParas(bodies.flatMap(b => b.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)));
        } else {
          setParas([]);
        }
      })
      .catch(e => { if (!cancelled) setErr(errorMessage(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <Screen>
      <TopBar onBack={back} title="Terms & Privacy" />
      <View style={styles.px6}>
        <ScrollView style={styles.box} contentContainerStyle={styles.boxContent} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          <T s={12.5} w={600} lh={1.625} style={styles.mb8}>{title}</T>
          {loading ? <ActivityIndicator color={colors.brand600} /> : null}
          {err ? <T s={12} c={colors.rose600}>{err}</T> : null}
          {!loading && !paras.length && !err ? (
            <T s={12.5} c={colors.ink500} lh={1.625}>Legal content is not available yet. Please try again later or contact support.</T>
          ) : null}
          {paras.map((p, i) => <T key={i} s={12.5} c={colors.ink700} lh={1.625} style={i ? styles.mt8 : null}>{p}</T>)}
        </ScrollView>
        <View style={styles.checks}>
          {checks.map(([val, setVal, txt], idx) => (
            <Pressable key={idx} onPress={() => setVal(!val)} style={styles.checkRow} accessibilityRole="checkbox" accessibilityState={{ checked: val }}>
              <View style={[styles.box20, val ? styles.boxOn : styles.boxOff]}>
                {val && <Icon name="check" size={12} color="white" strokeWidth={3} />}
              </View>
              <T s={13} c={colors.ink700} style={styles.flex1}>{txt}</T>
            </Pressable>
          ))}
        </View>
        <SolidBtn onPress={onNext} disabled={!(t1 && t2)} style={styles.mt24}>Accept & Continue</SolidBtn>
        <T s={11} c={colors.ink500} align="center" style={styles.mt12}>You must accept Terms and Privacy Policy to proceed.</T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  px6: { paddingHorizontal: 24 },
  flex1: { flex: 1 },
  mb8: { marginBottom: 8 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  mt24: { marginTop: 24 },
  box: { height: 208, backgroundColor: colors.ink50, borderWidth: 1, borderColor: colors.ink200, borderRadius: 14 },
  boxContent: { padding: 16 },
  checks: { marginTop: 20, gap: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  box20: { marginTop: 2, width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  boxOff: { borderColor: colors.ink300, backgroundColor: colors.white },
});
