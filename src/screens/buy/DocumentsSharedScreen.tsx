import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { Icon } from '../../components/Icon';
import { DocCard } from '../../components/Layout';
import { Screen } from '../../components/Screen';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { useToast } from '../../context/ToastContext';
import { useResource } from '../../lib/useResource';
import { useNav, useRefocus } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { getMyEnquiry } from '../../services/enquiry.service';
import type { BuyEnquiry } from '../../types/enquiry';
import { tw } from '../../theme';
import { formatDate } from '../../utils/format';
import { openUrl } from '../../utils/links';

export interface SharedDoc {
  id: string;
  name: string;
  meta: string;
  url: string;
}

/** Deal documents the Builtglory team has sent to the buyer (`deal.documentation.*[].sentToBuyerAt`). */
export function sharedDocuments(enquiry?: BuyEnquiry | null): SharedDoc[] {
  const doc = enquiry?.deal?.documentation;
  const items = [...(doc?.documents ?? []), ...(doc?.customDocs ?? [])].filter(
    d => d.sentToBuyerAt,
  );
  return items.flatMap(item => {
    const files = (item.files ?? []).filter(f => f.url);
    return files.map(f => {
      const ext = (f.fileName.split('.').pop() || 'file').toUpperCase();
      return {
        id: f.id,
        name: files.length > 1 ? `${item.name} · ${f.fileName}` : item.name,
        meta: `${ext} · Shared ${formatDate(item.sentToBuyerAt)}`,
        url: f.url as string,
      };
    });
  });
}

/** Short "Sunrise Heights — 3 BHK" style subtitle from the enquiry's property snapshot. */
export function enquiryTitle(enquiry?: BuyEnquiry | null) {
  return (
    enquiry?.propertySnapshot?.title ||
    enquiry?.deal?.propertySnapshot?.title ||
    'Your property'
  );
}

/** B-14 Documents shared by Builtglory for a deal. */
export function DocumentsSharedScreen({
  params,
}: ScreenProps<'documentsShared'>) {
  const nav = useNav();
  const toast = useToast();
  const res = useResource(
    signal => getMyEnquiry(params.enquiryId, signal),
    [params.enquiryId],
  );
  useRefocus(res.refresh);
  const docs = useMemo(() => sharedDocuments(res.data), [res.data]);
  const [opened, setOpened] = useState<Record<string, boolean>>({});

  const download = async (d: SharedDoc) => {
    const ok = await openUrl(d.url);
    if (ok) setOpened(o => ({ ...o, [d.id]: true }));
    else toast.show('Could not open the document', 'error');
  };

  const deal = res.data?.deal;
  return (
    <Screen
      topBar={{
        title: 'Documents Shared',
        sub: res.data ? enquiryTitle(res.data) : undefined,
        back: true,
      }}
      refreshing={res.refreshing}
      onRefresh={res.refresh}
    >
      <View style={styles.body}>
        {res.loading ? (
          <LoadingState />
        ) : res.error ? (
          <ErrorState message={res.error} onRetry={res.reload} />
        ) : (
          <>
            <View style={styles.banner}>
              <View style={styles.bell}>
                <Icon name="bell" size={15} color="#FFFFFF" />
              </View>
              <T style={styles.bannerText}>
                Builtglory has shared your property documents. Tap any document
                to view.
              </T>
            </View>
            {docs.length === 0 ? (
              <EmptyState
                icon="file-text"
                title="No documents shared yet"
                body="Your advisor will share the sale deed and approvals here once they are verified."
              />
            ) : (
              <View style={styles.list}>
                {docs.map(d => (
                  <DocCard
                    key={d.id}
                    name={d.name}
                    meta={opened[d.id] ? `Opened · ${d.meta}` : d.meta}
                    onView={() =>
                      nav.go('pdfViewer', {
                        doc: { name: d.name, url: d.url, meta: d.meta },
                      })
                    }
                    onDownload={() => download(d)}
                  />
                ))}
              </View>
            )}
            <View style={styles.note}>
              <Icon name="shield-check" size={14} color="#10B981" />
              <T style={styles.noteText}>
                All documents are legally verified by the Builtglory team.
              </T>
            </View>
            <Btn
              style={styles.cta}
              icon="credit-card"
              disabled={!deal}
              onPress={() => nav.go('payment', { enquiryId: params.enquiryId })}
            >
              Proceed to Token Payment
            </Btn>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: tw('px-4'),
  banner: tw('flex items-center gap-2.5 p-3 rounded-card bg-brand-50 mb-4'),
  bell: tw(
    'w-8 h-8 rounded-full bg-brand-600 items-center justify-center shrink-0',
  ),
  bannerText: tw('flex-1 text-[12px] text-brand-800 leading-snug'),
  list: { gap: 10 },
  note: tw('mt-4 flex items-center gap-2 p-3 rounded-card bg-ink-50'),
  noteText: tw('flex-1 text-[11.5px] text-ink-600'),
  cta: tw('w-full mt-4'),
});
