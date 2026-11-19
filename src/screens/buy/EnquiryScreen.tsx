import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { StatusMark } from '../../components/hero/StatusMark';
import { Icon } from '../../components/icons/Icon';
import { Screen, TopBar } from '../../components/layout/Screen';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Btn } from '../../components/ui/Btn';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field, Input } from '../../components/ui/Field';
import { Spin } from '../../components/ui/Float';
import { FadeIn } from '../../components/ui/Motion';
import { T } from '../../components/ui/T';
import { useAuth } from '../../context/AuthContext';
import { jEnquire } from '../../context/journeyStore';
import type { ScreenProps } from '../../navigation/types';
import * as buyEnquiries from '../../services/buyEnquiries.service';
import { colors, type } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { formatINR } from '../../utils/format';
import { useResolvedProperty } from '../../utils/useResolvedProperty';

const INTERESTS = ['More Details', 'Price Negotiation', 'Legal Documents', 'Home Loan'];

function mapInterestType(types: Set<string>): 'schedule_visit' | 'price_negotiation' | 'more_details' {
  if (types.has('Price Negotiation')) return 'price_negotiation';
  return 'more_details';
}

function mapContact(label: string): 'phone' | 'whatsapp' | 'email' {
  if (label === 'WhatsApp') return 'whatsapp';
  if (label === 'Email') return 'email';
  return 'phone';
}

/** B-10 Submit enquiry */
export function EnquiryScreen({ go, back, ctx }: ScreenProps) {
  const { property: p, loading: loadingProperty, error: propertyError } = useResolvedProperty(ctx);
  const { user, isAuthenticated } = useAuth();
  const isNRI: boolean = ctx?.isNRI || user?.userType === 'nri' || false;
  const [data, setData] = useState({
    name: user?.name || '',
    phone: (user?.mobileNumber || '').replace(/\D/g, '').slice(0, 10),
    email: user?.email || '',
  });
  const [contact, setContact] = useState('WhatsApp');
  const [types, setTypes] = useState<Set<string>>(new Set(['More Details']));
  const [msg, setMsg] = useState('');
  const [msgFocus, setMsgFocus] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const toggleType = (t: string) => { const s = new Set(types); if (s.has(t)) s.delete(t); else s.add(t); setTypes(s); };
  const valid = !!p && !!data.name && data.phone.length === 10 && agreed && types.size > 0;
  const submit = async () => {
    if (!valid || !p || loading) return;
    if (!isAuthenticated) {
      setSubmitError('Please sign in to submit an enquiry.');
      return;
    }
    setLoading(true);
    setSubmitError(null);
    try {
      const created = await buyEnquiries.createBuyEnquiry({
        propertyId: p.id,
        preferredContact: mapContact(contact),
        interestType: mapInterestType(types),
        additionalMessage: msg.trim() || undefined,
        enquiryTypes: [...types],
      });
      jEnquire(p, { types: [...types], isNRI, enquiryId: created._id, referenceId: created.referenceId });
      go('enquirySuccess', { p, isNRI, enquiryId: created._id });
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  const enabled = valid && !loading;

  if (loadingProperty) {
    return (
      <Screen>
        <TopBar onBack={back} title="Submit Enquiry" />
        <View style={styles.load}><ActivityIndicator color={colors.brand600} /></View>
      </Screen>
    );
  }
  if (!p) {
    return (
      <Screen>
        <TopBar onBack={back} title="Submit Enquiry" />
        <EmptyState icon="building-2" title="Property not found" body={propertyError || 'Choose a property first.'} action={<Btn onPress={back}>Go back</Btn>} />
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar onBack={back} title="Submit Enquiry" />
      <View style={styles.body}>
        <View style={styles.ref}>
          <PhotoPlaceholder tag={p.id} style={styles.thumb} />
          <View style={styles.flex1}>
            <T s={13} w={600} truncate>{p.title}</T>
            <T s={12} w={500} c={colors.brand600}>{formatINR(p.price)} · {p.bhk > 0 ? `${p.bhk} BHK` : 'Plot'}</T>
            <T s={11} c={colors.ink500}>Ref ID: BG-{p.id.toUpperCase().slice(-6)}</T>
          </View>
        </View>

        <View>
          <T display s={14} w={600} style={styles.mb12}>Your Details</T>
          <View style={styles.gap12}>
            <Field label="Full Name" required>
              <Input icon="user" value={data.name} onChangeText={v => setData({ ...data, name: v })} placeholder="Enter your full name" />
            </Field>
            <Field label="Mobile" required>
              <Input icon="phone" prefix="+91" value={data.phone} keyboardType="number-pad" onChangeText={v => setData({ ...data, phone: v.replace(/\D/g, '').slice(0, 10) })} placeholder="10-digit number" />
            </Field>
            <Field label="Email (Optional)">
              <Input icon="mail" value={data.email} keyboardType="email-address" autoCapitalize="none" onChangeText={v => setData({ ...data, email: v })} placeholder="you@example.com" />
            </Field>
            <View>
              <T s={13} w={500} c={colors.ink700} style={styles.mb8}>Preferred Contact</T>
              <View style={styles.row8}>
                {['Phone', 'WhatsApp', 'Email'].map(m => (
                  <Pressable key={m} onPress={() => setContact(m)} style={({ pressed }) => [styles.contact, { backgroundColor: contact === m ? colors.brand600 : pressed ? colors.ink200 : colors.ink100 }]}>
                    <T s={12} w={500} c={contact === m ? colors.white : colors.ink700}>{m}</T>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View>
          <T display s={14} w={600} style={styles.mb12}>I'm interested in</T>
          <View style={[styles.wrap, styles.mb12]}>
            {INTERESTS.map(t => (
              <Pressable key={t} onPress={() => toggleType(t)} style={({ pressed }) => [styles.interest, { backgroundColor: types.has(t) ? colors.brand600 : pressed ? colors.ink200 : colors.ink100 }]}>
                <T s={12} w={500} c={types.has(t) ? colors.white : colors.ink700}>{t}</T>
              </Pressable>
            ))}
          </View>
        </View>

        <Field label="Additional Message (Optional)">
          <View>
            <TextInput
              value={msg}
              onChangeText={v => setMsg(v.slice(0, 500))}
              placeholder="Any specific requirements or questions?"
              placeholderTextColor={colors.ink400}
              multiline
              textAlignVertical="top"
              onFocus={() => setMsgFocus(true)}
              onBlur={() => setMsgFocus(false)}
              style={[styles.textarea, msgFocus && styles.textareaFocus]}
            />
            <T s={10} c={colors.ink400} style={styles.counter}>{msg.length}/500</T>
          </View>
        </Field>

        <View>
          <Pressable onPress={() => setAgreed(!agreed)} style={styles.agree} accessibilityRole="checkbox" accessibilityState={{ checked: agreed }}>
            <View style={[styles.box, agreed ? styles.boxOn : styles.boxOff]}>
              {agreed && <Icon name="check" size={11} color="white" strokeWidth={3} />}
            </View>
            <T s={12.5} c={colors.ink700} lh={1.625} style={styles.flex1}>I agree to be contacted by Builtglory and the property owner regarding this enquiry</T>
          </Pressable>
          <View style={styles.secure}>
            <Icon name="lock" size={13} color="#64748B" />
            <T s={11} c={colors.ink600} style={styles.flex1}>Your information is secure and shared only with the property owner.</T>
          </View>
        </View>

        {submitError && (
          <FadeIn style={styles.error}>
            <StatusMark kind="error" size={16} />
            <T s={12} c={colors.rose700}>{submitError}</T>
          </FadeIn>
        )}
        <Pressable onPress={submit} disabled={!enabled} accessibilityRole="button"
          style={({ pressed }) => [styles.cta, enabled ? { backgroundColor: pressed ? colors.brand700 : colors.brand600 } : { backgroundColor: colors.ink100 }]}>
          {loading ? (
            <>
              <Spin><Icon name="loader-2" size={18} color="#94A3B8" /></Spin>
              <T s={15} w={600} c={colors.ink400}>Submitting…</T>
            </>
          ) : <T s={15} w={600} c={enabled ? colors.white : colors.ink400}>Submit Enquiry</T>}
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  load: { paddingVertical: 64, alignItems: 'center' },
  body: { paddingHorizontal: 16, gap: 20 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  gap12: { gap: 12 },
  row8: { flexDirection: 'row', gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ref: { backgroundColor: colors.brand50, borderRadius: 14, padding: 12, flexDirection: 'row', gap: 12 },
  thumb: { width: 60, height: 60, borderRadius: 6 },
  contact: { flex: 1, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  interest: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999 },
  textarea: { width: '100%', height: 80, padding: 12, borderWidth: 1, borderColor: colors.ink200, borderRadius: 14, ...type(14), lineHeight: 20, color: colors.ink900 },
  textareaFocus: { borderColor: colors.brand600 },
  counter: { position: 'absolute', bottom: 8, right: 12 },
  agree: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  box: { marginTop: 2, width: 20, height: 20, borderRadius: 4, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  boxOff: { borderColor: colors.ink300 },
  secure: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: colors.ink50, borderRadius: 14 },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: colors.rose50, borderWidth: 1, borderColor: colors.rose200, borderRadius: 14 },
  cta: { width: '100%', height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
