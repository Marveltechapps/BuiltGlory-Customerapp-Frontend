import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { DocCard } from '../../components/Layout';
import { Spin } from '../../components/Motion';
import { Press } from '../../components/Press';
import { Screen, ScreenFooter, SolidButton } from '../../components/Screen';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { StatusMark } from '../../components/StatusMark';
import { T } from '../../components/T';
import { useToast } from '../../context/ToastContext';
import { useResource } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { uploadDocument } from '../../services/document.service';
import {
  getMySellRequest,
  submitMySellRequest,
  updateMySellRequest,
} from '../../services/sellRequest.service';
import type { SellDocument } from '../../types/sellRequest';
import { palette, tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { pickImages } from '../../utils/media';

const docKey = (d: SellDocument, i: number) => d.documentId ?? `${d.name}-${i}`;

/**
 * SL-11 Re-upload flagged documents: POST /documents for the new file, PATCH /me/sell-requests/:id with the
 * updated document list, then POST /me/sell-requests/:id/submit for re-verification.
 */
export function ReuploadScreen({ params }: ScreenProps<'reupload'>) {
  const nav = useNav();
  const toast = useToast();
  const res = useResource(
    signal => getMySellRequest(params.id, signal),
    [params.id],
  );
  const req = res.data;
  const [docs, setDocs] = useState<SellDocument[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [replaced, setReplaced] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const list = docs ?? req?.documents ?? [];
  const flagged = list
    .map((d, i) => ({ d, i, key: docKey(d, i) }))
    .filter(
      ({ d, key }) =>
        d.status === 'rejected' || d.status === 'missing' || replaced[key],
    );
  const allDone = flagged.length > 0 && flagged.every(f => replaced[f.key]);
  const canEdit =
    req?.status === 'changes_requested' || req?.status === 'draft';

  const reupload = async (index: number, key: string) => {
    if (!req) return;
    try {
      const [file] = await pickImages(1);
      if (!file) return;
      setBusy(key);
      const doc = await uploadDocument(file, {
        ownerType: 'sell_request',
        ownerId: req._id,
        purpose: 'legal',
        documentType: list[index].name,
      });
      const next = list.map((d, i) =>
        i === index
          ? {
              ...d,
              documentId: doc._id,
              status: 'uploaded' as const,
              fileUrl: doc.url,
            }
          : d,
      );
      const updated = await updateMySellRequest(req._id, { documents: next });
      setDocs(updated.documents ?? next);
      setReplaced(r => ({ ...r, [key]: true }));
    } catch (e) {
      toast.show(errorMessage(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  const resubmit = async () => {
    if (!req) return;
    setSubmitting(true);
    try {
      await submitMySellRequest(req._id);
      toast.show('Submitted for re-verification');
      nav.popTo('verificationStatus', { id: req._id });
    } catch (e) {
      toast.show(errorMessage(e), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      topBar={{ title: 'Re-upload Documents', back: true }}
      footer={
        flagged.length ? (
          <ScreenFooter>
            <SolidButton
              label="Submit for Re-verification"
              disabled={!allDone}
              loading={submitting}
              loadingLabel="Submitting…"
              onPress={resubmit}
            />
          </ScreenFooter>
        ) : undefined
      }
    >
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
            <View style={styles.banner}>
              <StatusMark kind="warn" size={16} />
              <T style={styles.bannerText}>
                Only the flagged documents need re-uploading.
              </T>
            </View>
            {req.changeRequests?.length ? (
              <T style={styles.requests}>{req.changeRequests.join('\n')}</T>
            ) : null}
            {flagged.length === 0 ? (
              <EmptyState
                icon="file-text"
                title="No flagged documents"
                body="Nothing needs re-uploading right now."
              />
            ) : (
              <View style={styles.list}>
                {flagged.map(({ d, i, key }) => {
                  const done = replaced[key];
                  return (
                    <DocCard
                      key={key}
                      name={d.name}
                      meta={
                        done
                          ? 'New file uploaded ✓'
                          : d.status === 'missing'
                          ? 'Missing'
                          : 'Flagged'
                      }
                      flagged={!done}
                      reason={
                        !done
                          ? d.status === 'missing'
                            ? 'This document has not been uploaded yet.'
                            : 'This document was not accepted. Please upload a clear, complete copy.'
                          : null
                      }
                      action={
                        <View style={styles.actionWrap}>
                          <Press
                            disabled={done || busy !== null || !canEdit}
                            onPress={() => reupload(i, key)}
                            style={[
                              styles.action,
                              done ? styles.actionDone : styles.actionTodo,
                              !canEdit && !done && styles.locked,
                            ]}
                          >
                            {busy === key ? (
                              <Spin>
                                <Icon
                                  name="loader-2"
                                  size={14}
                                  color="#FFFFFF"
                                />
                              </Spin>
                            ) : (
                              <Icon
                                name={done ? 'check' : 'upload'}
                                size={14}
                                color={done ? '#10B981' : '#FFFFFF'}
                              />
                            )}
                            <T
                              style={[
                                styles.actionText,
                                {
                                  color: done
                                    ? palette.emerald[700]
                                    : '#FFFFFF',
                                },
                              ]}
                            >
                              {done
                                ? 'Uploaded'
                                : busy === key
                                ? 'Uploading…'
                                : 'Re-upload'}
                            </T>
                          </Press>
                        </View>
                      }
                    />
                  );
                })}
              </View>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: tw('px-4 pb-24'),
  banner: tw(
    'flex items-center gap-2 p-3 rounded-card bg-amber-50 border border-amber-200 mb-4',
  ),
  bannerText: tw('flex-1 text-[12px] text-amber-800'),
  requests: tw('text-[12px] text-ink-600 mb-4 leading-relaxed'),
  list: { gap: 12 },
  actionWrap: tw('px-3 pb-3'),
  action: tw('w-full h-10 rounded-card flex items-center justify-center gap-2'),
  actionTodo: tw('bg-brand-600'),
  actionDone: tw('bg-emerald-50'),
  actionText: tw('font-semibold text-[13px]'),
  locked: { opacity: 0.5 },
});
