import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { Field, Input } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { Grid } from '../../components/Layout';
import { Press } from '../../components/Press';
import { Screen, ScreenFooter, SolidButton } from '../../components/Screen';
import { ErrorState, LoadingState } from '../../components/States';
import { StatusMark } from '../../components/StatusMark';
import { T } from '../../components/T';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNav, useRefocus } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { decideOffer } from '../../services/sellRequest.service';
import type { SellerActivity } from '../../types/sellRequest';
import { palette, tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { formatINR } from '../../utils/format';
import { useSellerActivity } from './sellShared';

const ACCEPTED = [
  'seller_accepted',
  'accepted',
  'token_to_seller',
  'documentation',
  'seller_payout',
  'acquired',
];

/** Term sheet link, when the Builtglory team has attached one to the acquisition documentation. */
function termSheetUrl(a: SellerActivity): string | null {
  const doc = (a.acquisition?.documentation ?? {}) as Record<string, unknown>;
  const candidate =
    doc.termSheetUrl ??
    (doc.termSheet as { url?: string } | undefined)?.url ??
    doc.termSheet;
  return typeof candidate === 'string' && /^https?:\/\//.test(candidate)
    ? candidate
    : null;
}

/**
 * SL-14 Deal confirmed + payout bank details. The decision is POST /me/sell-requests/:id/offer-decision;
 * bank details go to PATCH /me `bankDetails`, which stores only the last 4 digits of the account number.
 */
export function DealConfirmedScreen({ params }: ScreenProps<'dealConfirmed'>) {
  const nav = useNav();
  const toast = useToast();
  const { user, saveProfile } = useAuth();
  const res = useSellerActivity(params.id);
  useRefocus(res.refresh);
  const [override, setOverride] = useState<SellerActivity | null>(null);
  const a = override ?? res.data;
  const offer = a?.offer;
  const confirmed = offer ? ACCEPTED.includes(offer.status) : false;
  const saved = user?.bankDetails;
  const [bank, setBank] = useState({
    holder: saved?.accountHolderName ?? '',
    name: saved?.bankName ?? '',
    acc: '',
    accConfirm: '',
    ifsc: saved?.ifsc ?? '',
    branch: saved?.branch ?? '',
    upi: saved?.upiId ?? '',
  });
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof bank, v: string) =>
    setBank(b => ({ ...b, [k]: v }));
  const accMatch = bank.acc.length >= 6 && bank.acc === bank.accConfirm;
  const valid =
    bank.holder.trim().length >= 2 &&
    bank.name.trim().length >= 2 &&
    accMatch &&
    bank.ifsc.length >= 6;
  const price = a?.acquisition?.agreedPrice ?? offer?.amount;
  const sheet = a ? termSheetUrl(a) : null;

  const confirmDeal = async () => {
    setConfirming(true);
    try {
      setOverride(await decideOffer(params.id, { decision: 'accepted' }));
    } catch (e) {
      toast.show(errorMessage(e), 'error');
    } finally {
      setConfirming(false);
    }
  };
  const saveBank = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveProfile({
        bankDetails: {
          accountHolderName: bank.holder.trim(),
          bankName: bank.name.trim(),
          accountNumberLast4: bank.acc.slice(-4),
          ifsc: bank.ifsc.trim(),
          branch: bank.branch.trim() || null,
          upiId: bank.upi.trim() || null,
        },
      });
      toast.show('Bank details saved');
      nav.go('paymentSchedule', { id: params.id });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      topBar={{ title: 'Deal Confirmed', back: true }}
      footer={
        a && offer ? (
          <ScreenFooter>
            {error && <T style={styles.error}>{error}</T>}
            <SolidButton
              label="Save Bank Details"
              disabled={!(confirmed && valid)}
              loading={saving}
              loadingLabel="Saving…"
              onPress={saveBank}
            />
          </ScreenFooter>
        ) : undefined
      }
    >
      <View style={styles.body}>
        {res.loading ? (
          <LoadingState />
        ) : res.error || !a ? (
          <ErrorState
            message={res.error ?? 'Could not load the deal.'}
            onRetry={res.reload}
          />
        ) : !offer ? (
          <ErrorState
            message="No offer is available for this listing yet."
            onRetry={res.reload}
          />
        ) : (
          <>
            <View style={styles.deal}>
              <View style={styles.dealHead}>
                <Icon name="circle-check" size={18} color="#10B981" />
                <T style={styles.dealTitle}>Deal agreed</T>
              </View>
              <View style={styles.dealRows}>
                <View style={styles.between}>
                  <T style={styles.k}>Final agreed price</T>
                  <T style={styles.price}>{formatINR(price)}</T>
                </View>
                <Press
                  disabled={!sheet}
                  onPress={() =>
                    sheet &&
                    nav.go('pdfViewer', {
                      doc: { name: 'Term Sheet.pdf', url: sheet },
                    })
                  }
                  pressScale={0.99}
                  style={[styles.sheetRow, !sheet && styles.dim]}
                >
                  <Icon name="file-text" size={16} color="#E11D48" />
                  <T style={styles.sheetName}>
                    {sheet
                      ? 'Term Sheet.pdf'
                      : 'Term sheet · shared after confirmation'}
                  </T>
                  {sheet ? (
                    <Icon name="chevron-right" size={15} color="#94A3B8" />
                  ) : null}
                </Press>
                <View style={styles.between}>
                  <T style={styles.k}>Expected timeline</T>
                  <T style={styles.v}>21–30 days</T>
                </View>
              </View>
              {!confirmed ? (
                <Btn
                  size="sm"
                  style={styles.confirm}
                  loading={confirming}
                  onPress={confirmDeal}
                >
                  Confirm Deal
                </Btn>
              ) : (
                <View style={styles.confirmed}>
                  <StatusMark kind="success" size={16} />
                  <T style={styles.confirmedText}>
                    Deal confirmed — now add your bank details
                  </T>
                </View>
              )}
            </View>
            <T style={styles.h3}>Your bank details for payout</T>
            {saved ? (
              <T style={styles.savedNote}>
                Saved: {saved.bankName} account ending{' '}
                {saved.accountNumberLast4}. Re-enter the account number to
                update.
              </T>
            ) : null}
            <View style={styles.fields}>
              <Field label="Account Holder Name" required>
                <Input
                  value={bank.holder}
                  onChangeText={v => set('holder', v)}
                  placeholder="As per bank records"
                  maxLength={120}
                />
              </Field>
              <Field label="Bank Name" required>
                <Input
                  value={bank.name}
                  onChangeText={v => set('name', v)}
                  placeholder="e.g. HDFC Bank"
                  maxLength={120}
                />
              </Field>
              <Field label="Account Number" required>
                <Input
                  keyboardType="number-pad"
                  secureTextEntry
                  value={bank.acc}
                  onChangeText={v => set('acc', v.replace(/\D/g, ''))}
                  placeholder="Enter account number"
                  maxLength={20}
                />
              </Field>
              <Field label="Confirm Account Number" required>
                <Input
                  keyboardType="number-pad"
                  value={bank.accConfirm}
                  onChangeText={v => set('accConfirm', v.replace(/\D/g, ''))}
                  placeholder="Re-enter account number"
                  maxLength={20}
                />
                {bank.accConfirm && !accMatch ? (
                  <T style={styles.mismatch}>Account numbers don't match</T>
                ) : null}
              </Field>
              <Field label="IFSC Code" required>
                <Input
                  autoCapitalize="characters"
                  value={bank.ifsc}
                  onChangeText={v => set('ifsc', v.toUpperCase())}
                  placeholder="e.g. HDFC0001234"
                  maxLength={20}
                />
              </Field>
              <Grid cols={2} gap={12}>
                <Field label="Branch (optional)">
                  <Input
                    value={bank.branch}
                    onChangeText={v => set('branch', v)}
                    placeholder="Branch"
                    maxLength={120}
                  />
                </Field>
                <Field label="UPI ID (optional)">
                  <Input
                    autoCapitalize="none"
                    value={bank.upi}
                    onChangeText={v => set('upi', v)}
                    placeholder="name@bank"
                    maxLength={120}
                  />
                </Field>
              </Grid>
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: tw('px-4 pb-24'),
  deal: {
    ...tw('rounded-card border border-emerald-200 p-4 mb-5'),
    backgroundColor: 'rgba(236,253,245,0.4)',
  },
  dealHead: tw('flex items-center gap-2 mb-3'),
  dealTitle: tw('text-[14px] font-bold text-emerald-800'),
  dealRows: { gap: 10 },
  between: tw('flex justify-between items-center'),
  k: tw('text-[12px] text-ink-500'),
  v: tw('text-[13px] font-semibold'),
  price: tw('text-[15px] font-bold text-ink-900'),
  sheetRow: tw(
    'w-full flex items-center gap-2 px-3 py-2.5 rounded-card bg-white border border-ink-200',
  ),
  sheetName: tw('flex-1 text-[13px] font-semibold'),
  dim: { opacity: 0.6 },
  confirm: tw('w-full mt-3'),
  confirmed: tw('mt-3 flex items-center gap-1.5'),
  confirmedText: tw('text-[12px] text-emerald-700 font-semibold'),
  h3: tw('text-[14px] font-semibold mb-3'),
  savedNote: {
    ...tw('text-[11.5px] text-ink-500 mb-3'),
    color: palette.ink[500],
  },
  fields: { gap: 12 },
  mismatch: tw('text-[11px] text-rose-500 mt-1.5'),
  error: tw('text-[12px] text-rose-600 mb-2'),
});
