import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNav } from '../../context/NavigationContext';
import { sellSaveDraft } from '../../context/sellStore';
import { colors } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { Icon } from '../icons/Icon';
import { HeaderButton } from '../layout/AppScreen';
import { Field, Input, type InputProps } from '../ui/Field';
import { WordReveal } from '../ui/Motion';
import { buzz, Press } from '../ui/Press';
import { ProgressBar } from '../ui/Progress';
import { T } from '../ui/T';

/** "Save draft" pill shown on every sell step. */
export function SaveDraftBtn() {
  const { key, go } = useNav();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const onSave = async () => {
    if (busy) return;
    setBusy(true);
    setErr('');
    try {
      const data = await sellSaveDraft(key);
      buzz(12);
      go('draftSuccess', { data });
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <View>
      <Press onPress={onSave} style={styles.save}>
        <Icon name="save" size={13} color="#334155" />
        <T s={12} w={700} c={colors.ink700} numberOfLines={1}>{busy ? 'Saving…' : 'Save draft'}</T>
      </Press>
      {err ? <T s={10} c={colors.rose600} style={styles.errTiny}>{err}</T> : null}
    </View>
  );
}

/** Sell step header: back, progress bar, step count, save draft, title. */
export function SellHeader({ step, totalSteps = 7, back, title, sub }: { step: number; totalSteps?: number; back: () => void; title: string; sub?: React.ReactNode }) {
  return (
    <View style={styles.head}>
      <View style={styles.top}>
        <HeaderButton icon="arrow-left" onPress={back} label="Back" />
        <View style={styles.flex1}><ProgressBar value={(step / totalSteps) * 100} /></View>
        <T num s={11} w={700} c={colors.ink500}>{step}/{totalSteps}</T>
        <SaveDraftBtn />
      </View>
      <WordReveal text={title} style={styles.title} />
      {sub ? <T s={12.5} c={colors.ink500} style={styles.sub}>{sub}</T> : null}
    </View>
  );
}

/** Labelled input with an inline error (the design's TextIn). */
export function TextIn({ label, required, error, hint, ...p }: InputProps & { label?: string; required?: boolean; error?: string | false; hint?: string }) {
  return (
    <Field label={label} required={required} hint={hint}>
      <Input {...p} containerStyle={[p.containerStyle, error ? styles.errBorder : null]} />
      {error ? <T s={11.5} c={colors.rose600} style={styles.err}>{error}</T> : null}
    </Field>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  head: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: -8, marginBottom: 10 },
  save: { height: 32, paddingHorizontal: 12, borderRadius: 9999, backgroundColor: colors.ink100, flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  title: { fontFamily: 'BricolageGrotesque-ExtraBold', fontSize: 24, lineHeight: 30, letterSpacing: 24 * -0.035, color: colors.ink900, includeFontPadding: false },
  sub: { marginTop: 4 },
  errBorder: { borderColor: colors.rose400 },
  err: { marginTop: 4 },
  errTiny: { position: 'absolute', top: 34, right: 0, maxWidth: 140 },
});
