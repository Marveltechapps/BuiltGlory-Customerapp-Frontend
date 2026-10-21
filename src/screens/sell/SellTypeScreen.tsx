import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Press } from '../../components/Press';
import { PropertyTypeGrid } from '../../components/PropertyTypeGrid';
import { Screen } from '../../components/Screen';
import { Skeleton } from '../../components/States';
import { T } from '../../components/T';
import { useSellFlow } from '../../context/SellFlowContext';
import { useResource } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import { listProperties } from '../../services/property.service';
import { tw } from '../../theme';
import { formatINR, toDate } from '../../utils/format';

const DAY = 86400000;

/** SL-03 What would you like to sell? (also lists recently sold properties from GET /properties?recentlySold=true). */
export function SellTypeScreen() {
  const nav = useNav();
  const sell = useSellFlow();
  const sold = useResource(
    signal =>
      listProperties({ recentlySold: true, limit: 6, sort: 'newest' }, signal),
    [],
  );
  const items = sold.data?.data ?? [];

  return (
    <Screen>
      <View style={styles.header}>
        <Press onPress={nav.back} style={styles.back} accessibilityLabel="Back">
          <Icon name="arrow-left" size={22} />
        </Press>
        <T style={styles.headerTitle}>Sell Property</T>
        <Press
          onPress={() => nav.go('helpFaqs')}
          style={styles.help}
          accessibilityLabel="Help"
        >
          <Icon name="help-circle" size={17} color="#64748B" />
        </Press>
      </View>
      <View style={styles.intro}>
        <T style={styles.h2}>What Would You Like to Sell?</T>
        <T style={styles.lead}>Select property type to get started</T>
      </View>
      <PropertyTypeGrid
        accentColor="#059669"
        onSelect={t => {
          sell.start(t.id);
          nav.go('sellIntent', { type: t.id });
        }}
      />
      <View style={styles.section}>
        <T style={styles.h3}>Need Help?</T>
        <View style={styles.helpCard}>
          <Icon name="info" size={16} color="#1A6FFF" style={styles.mt2} />
          <View style={styles.flex}>
            <T style={styles.helpTitle}>Not sure which category?</T>
            <T style={styles.helpBody}>
              Get free consultation from our property experts
            </T>
            <Press
              onPress={() => nav.go('customerSupport')}
              style={styles.callBtn}
            >
              <Icon name="phone" size={14} color="#FFFFFF" />
              <T style={styles.callText}>Call Us</T>
            </Press>
          </View>
        </View>
      </View>
      {sold.loading || items.length > 0 ? (
        <View style={styles.section}>
          <T style={[styles.h3, styles.mb3]}>Recently Sold on Builtglory</T>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.soldRow}
          >
            {sold.loading
              ? [0, 1, 2].map(i => <Skeleton key={i} w={130} h={120} r={8} />)
              : items.map(p => {
                  const listed = toDate(p.createdAt);
                  const soldAt = toDate(p.soldAt);
                  const days =
                    listed && soldAt
                      ? Math.max(
                          1,
                          Math.round(
                            (soldAt.getTime() - listed.getTime()) / DAY,
                          ),
                        )
                      : null;
                  return (
                    <View key={p._id} style={styles.soldCard}>
                      <PhotoPlaceholder
                        tag={p._id}
                        src={p.media?.coverPhoto || p.media?.photos?.[0]}
                        height={72}
                      />
                      <View style={styles.soldBody}>
                        <T style={styles.soldPrice}>{formatINR(p.price)}</T>
                        <T style={styles.soldDays}>
                          {days ? `Sold in ${days} days` : 'Recently sold'}
                        </T>
                      </View>
                    </View>
                  );
                })}
          </ScrollView>
        </View>
      ) : null}
      <View style={[styles.section, styles.mb6]}>
        <T style={[styles.h3, styles.mb3]}>Why Sell with Builtglory?</T>
        <View style={styles.why}>
          <T style={[styles.pill, styles.pillGreen]}>✓ No Commission</T>
          <T style={[styles.pill, styles.pillBrand]}>✓ Verified Buyers</T>
          <T style={[styles.pill, styles.pillAmber]}>✓ Quick Sale</T>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1'),
  header: tw('px-4 pt-2 pb-3 flex items-center justify-between'),
  back: { ...tw('p-2 rounded-full'), marginLeft: -4 },
  headerTitle: tw('text-[18px] font-semibold'),
  help: tw('w-9 h-9 rounded-full bg-ink-100 items-center justify-center'),
  intro: tw('px-4 mb-4'),
  h2: tw('text-[22px] font-bold text-ink-900'),
  lead: tw('text-[14px] text-ink-500 mt-1'),
  section: tw('px-4 mt-5'),
  h3: tw('text-[14px] font-semibold mb-2'),
  mb3: tw('mb-3'),
  mb6: tw('mb-6'),
  mt2: { marginTop: 2 },
  helpCard: tw('bg-brand-50 rounded-xl p-4 flex items-start gap-3'),
  helpTitle: tw('text-[13px] font-medium text-ink-900 mb-0.5'),
  helpBody: tw('text-[12px] text-ink-600 mb-3'),
  callBtn: {
    ...tw('flex items-center gap-2 bg-brand-600 px-4 py-2 rounded-lg'),
    alignSelf: 'flex-start',
  },
  callText: tw('text-white text-[12px] font-medium'),
  soldRow: tw('flex gap-3 pb-1'),
  soldCard: {
    ...tw('bg-white border border-ink-200 rounded-lg overflow-hidden'),
    width: 130,
  },
  soldBody: tw('p-2'),
  soldPrice: tw('text-[13px] font-bold text-brand-600'),
  soldDays: tw('text-[10.5px] text-ink-600'),
  why: tw('flex gap-2 flex-wrap'),
  pill: tw(
    'text-white px-3 py-1.5 rounded-full text-[11px] font-semibold overflow-hidden',
  ),
  pillGreen: tw('bg-emerald-500'),
  pillBrand: tw('bg-brand-600'),
  pillAmber: tw('bg-amber-500'),
});
