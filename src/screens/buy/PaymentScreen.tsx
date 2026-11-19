import Clipboard from '@react-native-clipboard/clipboard';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Icon, type IconName } from '../../components/Icon';
import { Divided, Grid } from '../../components/Layout';
import { Fade } from '../../components/Motion';
import { Press } from '../../components/Press';
import { Screen, ScreenFooter, SolidButton } from '../../components/Screen';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { useAppConfig } from '../../context/AppConfigContext';
import { useToast } from '../../context/ToastContext';
import { useResource } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { getMyEnquiry } from '../../services/enquiry.service';
import {
  createTokenPayment,
  listMyPayments,
} from '../../services/payment.service';
import type { Payment } from '../../types/payment';
import { palette, tw, twh } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { formatDate, formatRupees } from '../../utils/format';

type Method = 'bank' | 'upi' | 'cheque';
const METHODS: Array<{ id: Method; label: string; icon: IconName }> = [
  { id: 'bank', label: 'Bank Transfer', icon: 'building-2' },
  { id: 'upi', label: 'UPI', icon: 'smartphone' },
  { id: 'cheque', label: 'Cheque', icon: 'file-text' },
];

/** Loads the enquiry (for its deal), the configured escrow details and any existing token payment. */
async function loadPayment(enquiryId: string, signal: AbortSignal) {
  const enquiry = await getMyEnquiry(enquiryId, signal);
  const deal = enquiry.deal ?? null;
  const existing = deal
    ? (await listMyPayments({ dealId: deal._id, type: 'token' }, signal)).data
    : [];
  const open =
    existing.find(p => p.status === 'paid') ??
    existing.find(p => p.status === 'pending' || p.status === 'created') ??
    null;
  return { enquiry, deal, open };
}

/** B-15 Token payment into Builtglory escrow (manual transfer recorded with POST /payments/token). */
export function PaymentScreen({ params }: ScreenProps<'payment'>) {
  const nav = useNav();
  const toast = useToast();
  const { config, load } = useAppConfig();
  const [method, setMethod] = useState<Method>('bank');
  const [copied, setCopied] = useState('');
  const [processing, setProcessing] = useState(false);
  const res = useResource(
    signal => loadPayment(params.enquiryId, signal),
    [params.enquiryId],
  );

  useEffect(() => {
    if (!config) load().catch(() => undefined);
  }, [config, load]);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(''), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  const amount = config?.payment.tokenAmount ?? null;
  const escrow = config?.payment.escrow ?? null;
  const copy = (key: string, value?: string) => {
    if (!value) return;
    Clipboard.setString(value);
    setCopied(key);
  };

  const deal = res.data?.deal;
  const enquiry = res.data?.enquiry;
  const existing: Payment | null = res.data?.open ?? null;

  const pay = async () => {
    if (!deal || !enquiry || !amount) return;
    setProcessing(true);
    try {
      const payment = await createTokenPayment({
        dealId: deal._id,
        propertyId: enquiry.propertyId,
        amount,
        method,
        idempotencyKey: `token-${deal._id}-${method}`,
      });
      if (
        payment.status === 'failed' ||
        payment.status === 'rejected' ||
        payment.status === 'cancelled'
      ) {
        nav.go('paymentFailure', {
          enquiryId: params.enquiryId,
          reason:
            payment.failureReason ||
            payment.verificationNotes ||
            'The payment could not be recorded.',
        });
        return;
      }
      toast.show(
        payment.status === 'paid'
          ? 'Token payment confirmed'
          : 'Payment submitted for verification',
      );
      nav.go('registrationDetails', { enquiryId: params.enquiryId });
    } catch (e) {
      nav.go('paymentFailure', {
        enquiryId: params.enquiryId,
        reason: errorMessage(e),
      });
    } finally {
      setProcessing(false);
    }
  };

  const bankRows: Array<[string, string | undefined, string]> = [
    ['Account Holder', escrow?.accountHolder, 'holder'],
    ['Bank', escrow?.bankName, 'bank'],
    ['Account No.', escrow?.accountNumber, 'acc'],
    ['IFSC', escrow?.ifsc, 'ifsc'],
    ['Branch', escrow?.branch, 'branch'],
  ];
  const payee = escrow?.chequePayee || escrow?.accountHolder;
  const chequeSteps = escrow?.chequeInstructions?.length
    ? escrow.chequeInstructions
    : [
        payee
          ? `Draw the cheque in favour of "${payee}"`
          : 'Draw the cheque in favour of the Builtglory escrow account',
        `Write your enquiry ID ${
          enquiry?.referenceId ?? ''
        } on the reverse`.trim(),
        'Hand over to your advisor or courier it to the Builtglory office',
      ];
  const upiUri =
    escrow?.upiId && amount
      ? `upi://pay?pa=${encodeURIComponent(
          escrow.upiId,
        )}&pn=${encodeURIComponent(
          escrow.accountHolder ?? 'Builtglory',
        )}&am=${amount}&cu=INR&tn=${encodeURIComponent(
          deal?.referenceId ?? 'Token payment',
        )}`
      : null;

  const blocked = Boolean(existing);
  const label = existing
    ? existing.status === 'paid'
      ? 'View registration details'
      : 'Awaiting verification'
    : method === 'cheque'
    ? 'I have handed over the cheque'
    : `I have paid ${formatRupees(amount)}`;

  return (
    <Screen
      topBar={{ title: 'Token Payment', back: true }}
      footer={
        deal && amount ? (
          <ScreenFooter>
            <SolidButton
              label={label}
              loading={processing}
              loadingLabel="Confirming payment…"
              disabled={blocked && existing?.status !== 'paid'}
              onPress={
                existing?.status === 'paid'
                  ? () =>
                      nav.go('registrationDetails', {
                        enquiryId: params.enquiryId,
                      })
                  : pay
              }
            />
          </ScreenFooter>
        ) : undefined
      }
    >
      <View style={styles.body}>
        {res.loading || (!config && !res.error) ? (
          <LoadingState />
        ) : res.error ? (
          <ErrorState message={res.error} onRetry={res.reload} />
        ) : !deal ? (
          <EmptyState
            icon="credit-card"
            title="Token payment not open yet"
            body="Your advisor opens the token payment once the price is agreed."
          />
        ) : (
          <>
            <View style={styles.amount}>
              <T style={styles.amountLabel}>Token Amount</T>
              <T style={styles.amountValue}>{formatRupees(amount)}</T>
              <T style={styles.amountNote}>
                Refundable · Held in Builtglory escrow
              </T>
            </View>
            {existing && (
              <View
                style={[
                  styles.status,
                  existing.status === 'paid'
                    ? styles.statusPaid
                    : styles.statusPending,
                ]}
              >
                <Icon
                  name={existing.status === 'paid' ? 'circle-check' : 'clock'}
                  size={16}
                  color={
                    existing.status === 'paid'
                      ? palette.emerald[600]
                      : palette.amber[600]
                  }
                />
                <T
                  style={[
                    styles.statusText,
                    {
                      color:
                        existing.status === 'paid'
                          ? palette.emerald[800]
                          : palette.amber[800],
                    },
                  ]}
                >
                  {existing.status === 'paid'
                    ? `Token payment ${existing.referenceId} confirmed.`
                    : `Payment ${
                        existing.referenceId
                      } submitted on ${formatDate(
                        existing.createdAt,
                      )} · awaiting verification.`}
                </T>
              </View>
            )}
            <Grid cols={3} gap={8} style={styles.mb4}>
              {METHODS.map(m => {
                const on = method === m.id;
                return (
                  <Press
                    key={m.id}
                    onPress={() => setMethod(m.id)}
                    style={[
                      styles.method,
                      on ? styles.methodOn : styles.methodOff,
                    ]}
                  >
                    <Icon
                      name={m.icon}
                      size={18}
                      color={on ? '#1A6FFF' : '#64748B'}
                    />
                    <T
                      style={[
                        styles.methodText,
                        on ? styles.methodTextOn : styles.methodTextOff,
                      ]}
                    >
                      {m.label}
                    </T>
                  </Press>
                );
              })}
            </Grid>
            {!escrow ? (
              <ErrorState
                compact
                message="Escrow account details are not available right now. Please contact support."
              />
            ) : method === 'bank' ? (
              <Fade key="bank">
                <Divided style={styles.box}>
                  {bankRows.map(([k, v, key]) => (
                    <View key={key} style={styles.bankRow}>
                      <View style={styles.flex}>
                        <T style={styles.bankKey}>{k}</T>
                        <T style={styles.bankValue}>{v || '—'}</T>
                      </View>
                      {v ? (
                        <Press
                          onPress={() => copy(key, v)}
                          style={styles.copyBtn}
                        >
                          <T style={styles.copy}>
                            {copied === key ? '✓ Copied' : 'Copy'}
                          </T>
                        </Press>
                      ) : null}
                    </View>
                  ))}
                </Divided>
              </Fade>
            ) : method === 'upi' ? (
              <Fade key="upi">
                <View style={[styles.box, styles.upi]}>
                  <View style={styles.qr}>
                    {upiUri ? (
                      <QRCode
                        value={upiUri}
                        size={152}
                        color={palette.ink[900]}
                        backgroundColor="#FFFFFF"
                      />
                    ) : (
                      <Icon name="qr-code" size={32} />
                    )}
                  </View>
                  <View style={styles.upiRow}>
                    <T style={styles.upiId}>{escrow.upiId || '—'}</T>
                    {escrow.upiId ? (
                      <Press onPress={() => copy('upi', escrow.upiId)}>
                        <T style={styles.copy}>
                          {copied === 'upi' ? '✓ Copied' : 'Copy'}
                        </T>
                      </Press>
                    ) : null}
                  </View>
                  <T style={styles.upiHint}>Scan with any UPI app to pay</T>
                </View>
              </Fade>
            ) : (
              <Fade key="cheque">
                <View style={[styles.box, styles.cheque]}>
                  <T style={styles.chequeTitle}>Cheque instructions</T>
                  {chequeSteps.map((t, i) => (
                    <View key={i} style={styles.step}>
                      <View style={styles.stepNum}>
                        <T style={styles.stepNumText}>{i + 1}</T>
                      </View>
                      <T style={styles.stepText}>{t}</T>
                    </View>
                  ))}
                </View>
              </Fade>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1'),
  body: tw('px-4 pb-24'),
  amount: tw('rounded-card bg-brand-600 p-5 items-center mb-5'),
  amountLabel: {
    ...tw('text-[12px] uppercase tracking-wider'),
    color: 'rgba(255,255,255,0.7)',
  },
  amountValue: {
    ...twh('num text-[36px] font-bold leading-tight mt-1 text-white'),
  },
  amountNote: { ...tw('text-[12px]'), color: 'rgba(255,255,255,0.8)' },
  status: tw('flex items-start gap-2 p-3 rounded-card border mb-4'),
  statusPaid: tw('bg-emerald-50 border-emerald-200'),
  statusPending: tw('bg-amber-50 border-amber-200'),
  statusText: tw('flex-1 text-[12px] font-medium'),
  mb4: tw('mb-4'),
  method: tw('p-3 rounded-card border items-center gap-1.5'),
  methodOn: tw('border-brand-600 bg-brand-50'),
  methodOff: tw('border-ink-200'),
  methodText: tw('text-[11px] font-semibold text-center'),
  methodTextOn: tw('text-brand-700'),
  methodTextOff: tw('text-ink-600'),
  box: tw('rounded-card border border-ink-200'),
  bankRow: tw('flex items-center gap-2 px-3 py-2.5'),
  bankKey: tw('text-[10.5px] text-ink-500'),
  bankValue: tw('text-[13px] font-semibold text-ink-900'),
  copyBtn: tw('px-2 py-1'),
  copy: tw('text-[11px] font-semibold text-brand-600'),
  upi: tw('p-4 items-center'),
  qr: tw(
    'w-44 h-44 rounded-lg items-center justify-center bg-white border border-ink-200',
  ),
  upiRow: tw(
    'mt-3 flex items-center gap-2 px-3 py-2 rounded-card bg-ink-50 w-full justify-between',
  ),
  upiId: tw('text-[13px] font-semibold'),
  upiHint: tw('text-[11px] text-ink-500 mt-2'),
  cheque: { ...tw('p-4'), gap: 10 },
  chequeTitle: tw('text-[13px] font-semibold'),
  step: tw('flex gap-2'),
  stepNum: tw(
    'w-5 h-5 rounded-full bg-brand-50 items-center justify-center shrink-0',
  ),
  stepNumText: tw('text-[10px] font-bold text-brand-700'),
  stepText: tw('flex-1 text-[12px] text-ink-700'),
});
