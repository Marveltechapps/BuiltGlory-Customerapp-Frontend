import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { Icon } from '../../components/Icon';
import { Press } from '../../components/Press';
import { Screen, SolidButton } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { ErrorState, LoadingState } from '../../components/States';
import { StatusMark } from '../../components/StatusMark';
import { T } from '../../components/T';
import { useResource } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { getMySellRequest, withdrawSellRequest } from '../../services/sellRequest.service';
import { errorMessage } from '../../utils/errorMessage';
import { tw } from '../../theme';

/**
 * SL-18 Listing rejected (`rejectionReason`). Delete withdraws the listing.
 */
export function RejectedListingScreen({
  params,
}: ScreenProps<'rejectedListing'>) {
  const nav = useNav();
  const res = useResource(
    signal => getMySellRequest(params.id, signal),
    [params.id],
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const req = res.data;
  const removeListing = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await withdrawSellRequest(params.id);
      setConfirmDelete(false);
      nav.go('myListings');
    } catch (e) {
      setDeleteError(errorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Screen topBar={{ title: 'Listing Rejected', back: true }}>
      <View style={styles.body}>
        {res.loading ? (
          <LoadingState />
        ) : res.error || !req ? (
          <ErrorState
            message={res.error ?? 'Listing not found.'}
            onRetry={res.reload}
          />
        ) : (
          <>
            <View style={styles.alert}>
              <StatusMark kind="error" size={22} />
              <View style={styles.flex}>
                <T style={styles.alertTitle}>Listing could not be approved</T>
                <T style={styles.alertText}>
                  Reason:{' '}
                  {req.rejectionReason || 'Not specified by the review team.'}
                </T>
              </View>
            </View>
            <View style={styles.safe}>
              <Icon name="shield-check" size={14} color="#10B981" />
              <T style={styles.safeText}>
                All your uploaded documents remain safe in your account.
              </T>
            </View>
            <View style={styles.actions}>
              <Btn
                variant="outline"
                style={styles.full}
                icon="headphones"
                onPress={() => nav.go('help')}
              >
                Contact Builtglory Team
              </Btn>
              <Press
                onPress={() => setConfirmDelete(true)}
                pressScale={0.99}
                style={styles.delete}
              >
                <T style={styles.deleteText}>Delete Listing</T>
              </Press>
            </View>
          </>
        )}
      </View>
      <Sheet
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this listing?"
      >
        <T style={styles.sheetText}>
          This withdraws listing {req?.referenceId ?? ''}. It leaves your active
          listings. Uploaded documents stay in your account.
        </T>
        {deleteError ? <T style={styles.sheetText}>{deleteError}</T> : null}
        <View style={styles.sheetActions}>
          <SolidButton
            label="Withdraw listing"
            tone="rose"
            loading={deleting}
            onPress={removeListing}
          />
          <SolidButton
            label="Keep Listing"
            tone="neutral"
            onPress={() => setConfirmDelete(false)}
          />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1'),
  full: tw('w-full'),
  body: tw('px-4'),
  alert: {
    ...tw('rounded-card border border-rose-200 p-4 flex gap-3 mb-4'),
    backgroundColor: 'rgba(255,241,242,0.5)',
  },
  alertTitle: tw('text-[14px] font-semibold text-rose-800'),
  alertText: tw('text-[12.5px] text-rose-700 mt-0.5'),
  safe: tw('flex items-center gap-2 p-3 rounded-card bg-ink-50 mb-5'),
  safeText: tw('flex-1 text-[12px] text-ink-600'),
  actions: { gap: 8 },
  delete: tw('w-full h-12 rounded-xl items-center justify-center'),
  deleteText: tw('font-medium text-[14px] text-rose-600'),
  sheetText: tw('text-[13px] text-ink-500 mb-5'),
  sheetActions: { gap: 8 },
});
