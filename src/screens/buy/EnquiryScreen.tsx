import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Checkbox, Field, Input, Radio, TextArea } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { Fade } from '../../components/Motion';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Press } from '../../components/Press';
import { Screen, SolidButton } from '../../components/Screen';
import { StatusMark } from '../../components/StatusMark';
import { T } from '../../components/T';
import { useAuth } from '../../context/AuthContext';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { createBuyEnquiry } from '../../services/enquiry.service';
import type {
  CreateBuyEnquiryRequest,
  InterestType,
  PreferredContact,
  PreferredVisitTime,
} from '../../types/enquiry';
import { palette, tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { formatINR } from '../../utils/format';

const CONTACTS: Array<[string, PreferredContact]> = [
  ['Phone', 'phone'],
  ['WhatsApp', 'whatsapp'],
  ['Email', 'email'],
];
const INTERESTS: Array<[string, InterestType]> = [
  ['Schedule Visit', 'schedule_visit'],
  ['Price Negotiation', 'price_negotiation'],
  ['More Details', 'more_details'],
];
const VISIT_TIMES: Array<[string, PreferredVisitTime | 'custom']> = [
  ['Tomorrow, 10:00 AM – 12:00 PM', 'tomorrow_morning'],
  ['This Weekend, 2:00 PM – 5:00 PM', 'this_weekend_afternoon'],
  ['Custom Date & Time', 'custom'],
];

/** B-10 Submit enquiry. */
export function EnquiryScreen({ params }: ScreenProps<'enquiry'>) {
  const nav = useNav();
  const { user, saveProfile } = useAuth();
  const p = params.property;
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.mobileNumber ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [contact, setContact] = useState<PreferredContact>('whatsapp');
  const [types, setTypes] = useState<Set<InterestType>>(
    new Set(['schedule_visit']),
  );
  const [visitTime, setVisitTime] =
    useState<PreferredVisitTime>('tomorrow_morning');
  const [msg, setMsg] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const emailOk =
    !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const valid =
    name.trim().length >= 2 &&
    /^\d{10}$/.test(phone) &&
    agreed &&
    types.size > 0 &&
    emailOk &&
    (contact !== 'email' || email.trim());

  const toggleType = (t: InterestType) =>
    setTypes(prev => {
      const s = new Set(prev);
      if (s.has(t)) s.delete(t);
      else s.add(t);
      return s;
    });

  const buildRequest = (): CreateBuyEnquiryRequest => {
    const ordered = INTERESTS.map(([, id]) => id).filter(id => types.has(id));
    const altPhone =
      user?.mobileNumber && phone !== user.mobileNumber
        ? `Alternate contact number: +91 ${phone}.`
        : '';
    const message = [msg.trim(), altPhone].filter(Boolean).join('\n');
    const visit = types.has('schedule_visit');
    return {
      propertyId: p.id,
      enquiryTypes: ordered,
      interestType: ordered[0],
      preferredContact: contact,
      preferredVisitTime: visit ? visitTime : null,
      preferredVisitTimeSlot: visit
        ? VISIT_TIMES.find(([, v]) => v === visitTime)?.[0] ?? null
        : null,
      additionalMessage: message || null,
    };
  };

  /** Keep the profile in sync with edited name/email so the enquiry's buyer snapshot is right. */
  const syncProfile = async () => {
    const patch: { name?: string; email?: string } = {};
    if (name.trim() && name.trim() !== user?.name) patch.name = name.trim();
    if (
      email.trim() &&
      email.trim().toLowerCase() !== (user?.email ?? '').toLowerCase()
    )
      patch.email = email.trim();
    if (Object.keys(patch).length) await saveProfile(patch);
  };

  const submit = async () => {
    if (!valid) return;
    setLoading(true);
    setSubmitError(null);
    try {
      await syncProfile();
      const enquiry = await createBuyEnquiry(buildRequest());
      nav.replace('enquirySuccess', { property: p, enquiry });
    } catch (e) {
      setSubmitError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const chooseVisit = async (v: PreferredVisitTime | 'custom') => {
    if (v !== 'custom') {
      setVisitTime(v);
      return;
    }
    // Custom slot: pick a date on the visit calendar, which submits the enquiry and books the visit together.
    if (!valid) {
      setSubmitError(
        'Fill in your details and accept the contact consent before picking a custom time.',
      );
      return;
    }
    try {
      await syncProfile();
    } catch (e) {
      setSubmitError(errorMessage(e));
      return;
    }
    setSubmitError(null);
    nav.go('visitCalendar', {
      property: p,
      pendingEnquiry: { ...buildRequest(), preferredVisitTime: 'custom' },
    });
  };

  return (
    <Screen topBar={{ title: 'Submit Enquiry', back: true }}>
      <View style={styles.body}>
        <View style={styles.ref}>
          <PhotoPlaceholder tag={p.id} src={p.images[0]} style={styles.thumb} />
          <View style={styles.flex}>
            <T style={styles.refTitle} numberOfLines={1}>
              {p.title}
            </T>
            <T style={styles.refPrice}>
              {formatINR(p.price)} · {p.bhk ? `${p.bhk} BHK` : 'Plot'}
            </T>
            <T style={styles.refId}>Ref ID: {p.referenceId}</T>
          </View>
        </View>

        <View>
          <T style={styles.h3}>Your Details</T>
          <View style={styles.gap3}>
            <Field label="Full Name" required>
              <Input
                icon="user"
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
              />
            </Field>
            <Field label="Mobile" required>
              <Input
                icon="phone"
                prefix="+91"
                value={phone}
                onChangeText={v => setPhone(v.replace(/\D/g, '').slice(0, 10))}
                keyboardType="number-pad"
                placeholder="10-digit number"
              />
            </Field>
            <Field
              label="Email (Optional)"
              error={!emailOk ? 'Enter a valid email address.' : null}
            >
              <Input
                icon="mail"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="you@example.com"
              />
            </Field>
            <View>
              <T style={styles.label}>Preferred Contact</T>
              <View style={styles.contactRow}>
                {CONTACTS.map(([label, id]) => (
                  <Press
                    key={id}
                    onPress={() => setContact(id)}
                    style={[
                      styles.contactBtn,
                      contact === id ? styles.on : styles.off,
                    ]}
                  >
                    <T
                      style={[
                        styles.contactText,
                        {
                          color: contact === id ? '#FFFFFF' : palette.ink[700],
                        },
                      ]}
                    >
                      {label}
                    </T>
                  </Press>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View>
          <T style={styles.h3}>I'm interested in</T>
          <View style={styles.chips}>
            {INTERESTS.map(([label, id]) => (
              <Press
                key={id}
                onPress={() => toggleType(id)}
                style={[styles.pill, types.has(id) ? styles.on : styles.off]}
              >
                <T
                  style={[
                    styles.pillText,
                    { color: types.has(id) ? '#FFFFFF' : palette.ink[700] },
                  ]}
                >
                  {label}
                </T>
              </Press>
            ))}
          </View>
          {types.has('schedule_visit') && (
            <View style={styles.gap2}>
              <T style={styles.label}>Preferred visit time</T>
              {VISIT_TIMES.map(([label, id]) => {
                const on = id !== 'custom' && visitTime === id;
                return (
                  <Press
                    key={label}
                    onPress={() => chooseVisit(id)}
                    style={[
                      styles.visitRow,
                      on ? styles.visitOn : styles.visitOff,
                    ]}
                  >
                    <Radio selected={on} variant="ring" />
                    <T style={styles.visitText}>{label}</T>
                  </Press>
                );
              })}
            </View>
          )}
        </View>

        <Field label="Additional Message (Optional)">
          <TextArea
            value={msg}
            onChangeText={v => setMsg(v.slice(0, 500))}
            placeholder="Any specific requirements or questions?"
            height={80}
            maxLength={500}
            counter
          />
        </Field>

        <View>
          <Press
            pressScale={1}
            onPress={() => setAgreed(!agreed)}
            style={styles.agreeRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
          >
            <View style={styles.mt05}>
              <Checkbox checked={agreed} radius={4} />
            </View>
            <T style={styles.agreeText}>
              I agree to be contacted by Builtglory and the property owner
              regarding this enquiry
            </T>
          </Press>
          <View style={styles.secure}>
            <Icon name="lock" size={13} color="#64748B" />
            <T style={styles.secureText}>
              Your information is secure and shared only with the property
              owner.
            </T>
          </View>
        </View>

        {submitError && (
          <Fade>
            <View style={styles.error}>
              <StatusMark kind="error" size={16} />
              <T style={styles.errorText}>{submitError}</T>
            </View>
          </Fade>
        )}
        <SolidButton
          label="Submit Enquiry"
          loading={loading}
          loadingLabel="Submitting…"
          disabled={!valid || loading}
          onPress={submit}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1 min-w-0'),
  body: { ...tw('px-4'), gap: 20 },
  ref: tw('bg-brand-50 rounded-card p-3 flex gap-3'),
  thumb: { ...tw('rounded-md shrink-0'), width: 60, height: 60 },
  refTitle: tw('text-[13px] font-semibold'),
  refPrice: tw('text-[12px] text-brand-600 font-medium'),
  refId: tw('text-[11px] text-ink-500'),
  h3: tw('text-[14px] font-semibold mb-3'),
  gap3: { gap: 12 },
  gap2: { gap: 8 },
  label: tw('text-[13px] font-medium text-ink-700 mb-2'),
  contactRow: tw('flex gap-2'),
  contactBtn: tw('flex-1 h-10 rounded-card items-center justify-center'),
  contactText: tw('text-[12px] font-medium'),
  on: tw('bg-brand-600'),
  off: tw('bg-ink-100'),
  chips: tw('flex flex-wrap gap-2 mb-3'),
  pill: tw('px-3 py-2 rounded-full'),
  pillText: tw('text-[12px] font-medium'),
  visitRow: tw('w-full p-3 rounded-card flex items-center gap-3'),
  visitOn: tw('bg-brand-50 border-2 border-brand-600'),
  visitOff: tw('bg-ink-50 border border-ink-200'),
  visitText: tw('text-[13px]'),
  agreeRow: tw('flex items-start gap-3 mb-3'),
  mt05: tw('mt-0.5'),
  agreeText: tw('flex-1 text-[12.5px] text-ink-700 leading-relaxed'),
  secure: tw('flex items-center gap-2 p-3 bg-ink-50 rounded-card'),
  secureText: tw('flex-1 text-[11px]'),
  error: tw(
    'flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-card',
  ),
  errorText: tw('flex-1 text-[12px] text-rose-700'),
});
