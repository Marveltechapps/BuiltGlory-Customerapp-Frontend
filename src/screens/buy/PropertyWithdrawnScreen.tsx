import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { Badge } from '../../components/Form';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Screen } from '../../components/Screen';
import { StatusMark } from '../../components/StatusMark';
import { T } from '../../components/T';
import { propertyTypeById } from '../../config/catalog';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { tw } from '../../theme';
import { formatINR } from '../../utils/format';

/** B-18 The enquired property is no longer listed (GET /properties/:id returns 404 or it left the market). */
export function PropertyWithdrawnScreen({
  params,
}: ScreenProps<'propertyWithdrawn'>) {
  const nav = useNav();
  const { enquiry } = params;
  const snap = enquiry.propertySnapshot ?? {};
  const type = propertyTypeById(snap.type);
  return (
    <Screen topBar={{ title: 'Enquiry Detail', back: true }}>
      <View style={styles.body}>
        <View style={styles.banner}>
          <StatusMark kind="warn" size={20} />
          <T style={styles.bannerText}>This property is no longer available.</T>
        </View>
        <View style={styles.card}>
          <View style={styles.row}>
            <PhotoPlaceholder tag={enquiry.propertyId} style={styles.thumb} />
            <View style={styles.flex}>
              <T style={styles.title}>{snap.title || 'Property'}</T>
              {snap.location ? (
                <T style={styles.place}>{snap.location}</T>
              ) : null}
              {snap.price ? (
                <T style={styles.price}>{formatINR(snap.price)}</T>
              ) : null}
              <Badge color="ink" style={styles.badge}>
                No longer listed
              </Badge>
            </View>
          </View>
        </View>
        <Btn
          style={styles.full}
          icon="search"
          onPress={() =>
            nav.go('filters', {
              filters: { typeId: type?.id, apiType: type?.apiType },
            })
          }
        >
          Browse Similar Properties
        </Btn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1'),
  body: tw('px-4'),
  banner: tw(
    'flex items-center gap-2.5 p-3.5 rounded-card bg-amber-50 border border-amber-200 mb-4',
  ),
  bannerText: tw('flex-1 text-[12.5px] text-amber-800 font-medium'),
  card: {
    ...tw('rounded-card border border-ink-200 p-3 mb-5'),
    opacity: 0.5,
    filter: 'grayscale(1)',
  },
  row: tw('flex gap-3'),
  thumb: { ...tw('rounded-md shrink-0'), width: 72, height: 72 },
  title: tw('text-[14px] font-semibold'),
  place: tw('text-[12px] text-ink-500'),
  price: tw('text-[13px] font-bold text-ink-400 mt-1'),
  badge: { alignSelf: 'flex-start' },
  full: tw('w-full'),
});
