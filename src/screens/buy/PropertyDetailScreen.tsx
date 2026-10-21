import React, { useState } from 'react';
import { Modal, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Btn } from '../../components/Btn';
import { DetailScreen } from '../../components/DetailScreen';
import { Icon } from '../../components/Icon';
import {
  Card,
  Grid,
  PriceBlock,
  SectionTitle,
  SpecGrid,
} from '../../components/Layout';
import { SwipeGallery } from '../../components/Interactive';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { useFavToggle } from '../../components/PropertyCard';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { useAppConfig } from '../../context/AppConfigContext';
import { useToast } from '../../context/ToastContext';
import type { PropertyView } from '../../interfaces/PropertyView';
import { useResource } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { getProperty } from '../../services/property.service';
import { tw, twh } from '../../theme';
import { formatINR } from '../../utils/format';
import { callPhone, openUrl } from '../../utils/links';
import { placeLabel, toPropertyView } from '../../utils/property';

function Gallery({
  p,
  onBack,
  onShare,
}: {
  p: PropertyView;
  onBack: () => void;
  onShare: () => void;
}) {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { onToggle, isSaved } = useFavToggle();
  const fav = isSaved(p.id);
  const [img, setImg] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const images: Array<string | null> = p.images.length ? p.images : [null];
  const n = images.length;
  return (
    <>
      <SwipeGallery
        data={images}
        index={img}
        onIndex={setImg}
        height={280}
        renderItem={(src, i) => (
          <PhotoPlaceholder tag={p.id + i} src={src} style={styles.fill} />
        )}
      />
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <Press
          onPress={onBack}
          accessibilityLabel="Back"
          style={[styles.glassBtn, styles.backPos]}
        >
          <Icon name="arrow-left" size={18} />
        </Press>
        {p.verified && (
          <View style={styles.verified}>
            <Icon name="badge-check" size={12} color="#FFFFFF" />
            <T style={styles.verifiedText}>Verified</T>
          </View>
        )}
        <View style={styles.topRight}>
          <Press
            onPress={() => onToggle(p.id)}
            haptic
            accessibilityLabel="Save"
            style={styles.glassBtn}
          >
            <Icon
              name="heart"
              size={18}
              color={fav ? '#E11D48' : '#0F172A'}
              fill={fav ? '#E11D48' : 'none'}
            />
          </Press>
          <Press
            onPress={onShare}
            accessibilityLabel="Share"
            style={styles.glassBtn}
          >
            <Icon name="share-2" size={18} />
          </Press>
        </View>
        <Press
          onPress={() => setFullscreen(true)}
          accessibilityLabel="Fullscreen"
          style={[styles.glassSmall, styles.maxPos]}
        >
          <Icon name="maximize-2" size={16} />
        </Press>
        <View style={styles.counter}>
          <T style={styles.counterText}>
            {img + 1}/{n}
          </T>
        </View>
        <View style={styles.dots} pointerEvents="box-none">
          {images.map((_, i) => (
            <Press
              key={i}
              pressScale={1}
              onPress={() => setImg(i)}
              hitSlop={6}
              style={[styles.dot, i === img ? styles.dotOn : styles.dotOff]}
            />
          ))}
        </View>
        {n > 1 && <T style={styles.swipeHint}>swipe to browse</T>}
      </View>
      <Modal
        visible={fullscreen}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setFullscreen(false)}
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.full}>
          <View style={styles.fullStage}>
            <SwipeGallery
              data={images}
              index={img}
              onIndex={setImg}
              style={styles.fill}
              renderItem={(src, i) => (
                <PhotoPlaceholder
                  tag={p.id + i}
                  src={src}
                  noShade
                  style={styles.fill}
                />
              )}
            />
            <Press
              onPress={() => setFullscreen(false)}
              accessibilityLabel="Close"
              style={[styles.fsBtn, { top: insets.top + 16, left: 16 }]}
            >
              <Icon name="x" size={18} color="#FFFFFF" />
            </Press>
            <View style={[styles.fsCounter, { top: insets.top + 16 }]}>
              <T style={styles.fsCounterText}>
                {img + 1}/{n}
              </T>
            </View>
            <Press
              onPress={() => setImg(i => (i === 0 ? n - 1 : i - 1))}
              accessibilityLabel="Previous"
              style={[styles.fsBtn, styles.fsPrev]}
            >
              <Icon name="chevron-left" size={18} color="#FFFFFF" />
            </Press>
            <Press
              onPress={() => setImg(i => (i === n - 1 ? 0 : i + 1))}
              accessibilityLabel="Next"
              style={[styles.fsBtn, styles.fsNext]}
            >
              <Icon name="chevron-right" size={18} color="#FFFFFF" />
            </Press>
          </View>
          <View style={[styles.fsBar, { paddingBottom: 8 + insets.bottom }]}>
            <Press onPress={() => setFullscreen(false)} style={styles.fsClose}>
              <T style={styles.fsCloseText}>Close</T>
            </Press>
            <Press
              onPress={async () => {
                const src = images[img];
                if (!src)
                  return toast.show(
                    'No photo to download for this listing.',
                    'warn',
                  );
                toast.show('Download started');
                await openUrl(src);
              }}
              style={styles.fsDownload}
            >
              <Icon name="download" size={12} color="#FFFFFF" />
              <T style={styles.fsDownloadText}>Download</T>
            </Press>
          </View>
        </View>
      </Modal>
    </>
  );
}

/** B-04 Property detail. */
export function PropertyDetailScreen({
  params,
}: ScreenProps<'propertyDetail'>) {
  const nav = useNav();
  const { supportPhone } = useAppConfig();
  const res = useResource(
    signal => getProperty(params.id, signal).then(toPropertyView),
    [params.id],
  );
  const { onToggle, isSaved } = useFavToggle();
  const p = res.data ?? params.property;

  if (!p) {
    const gone = res.error && res.data === undefined;
    return (
      <Screen topBar={{ title: 'Property', back: true }}>
        {res.loading ? (
          <LoadingState />
        ) : gone ? (
          <ErrorState message={res.error ?? ''} onRetry={res.reload} />
        ) : null}
      </Screen>
    );
  }
  // A 404 after the listing was shown means it was sold or withdrawn since.
  if (res.errorStatus === 404) {
    return (
      <Screen topBar={{ title: p.title, back: true }}>
        <EmptyState
          icon="search-x"
          title="This property is no longer available"
          body={res.error ?? undefined}
          action={
            <Btn
              icon="search"
              onPress={() =>
                nav.go('buyList', { filters: { apiType: p.type } })
              }
            >
              Browse Similar Properties
            </Btn>
          }
        />
      </Screen>
    );
  }
  const fav = isSaved(p.id);
  const hasPlan = Boolean(p.floorPlanUrl);

  return (
    <DetailScreen
      title={p.title}
      heroHeight={280}
      hero={
        <Gallery
          p={p}
          onBack={nav.back}
          onShare={() => nav.go('shareProperty', { property: p })}
        />
      }
      dockSummary={
        <>
          <PriceBlock
            price={formatINR(p.price)}
            per={p.pricePerSqft ? `${formatINR(p.pricePerSqft)}/sqft` : null}
            note={p.negotiable ? 'Negotiable' : null}
          />
          <Press
            onPress={() => onToggle(p.id)}
            haptic
            accessibilityLabel="Save"
            style={styles.dockHeart}
          >
            <Icon
              name="heart"
              size={19}
              color={fav ? '#E11D48' : '#64748B'}
              fill={fav ? '#E11D48' : 'none'}
            />
          </Press>
        </>
      }
      dock={[
        <Btn
          key="c"
          variant="outline"
          icon="git-compare"
          onPress={() => nav.go('compare', { property: p })}
          style={styles.stretch}
        >
          Compare
        </Btn>,
        <Btn
          key="e"
          onPress={() => nav.go('enquiry', { property: p })}
          style={styles.stretch}
        >
          Enquire
        </Btn>,
      ]}
    >
      <View style={styles.body}>
        <T style={styles.title}>{p.title}</T>
        <Press
          onPress={() => nav.go('mapView', { property: p })}
          pressScale={1}
          style={styles.locRow}
        >
          <Icon name="map-pin" size={13} color="#64748B" />
          <T style={styles.loc}>
            {placeLabel(p)} <T style={styles.mapLink}>View map →</T>
          </T>
        </Press>
        <View style={styles.mt4}>
          <SpecGrid
            cols={4}
            items={[
              { icon: 'bed-double', value: p.bhk ?? '—', label: 'BHK' },
              { icon: 'ruler', value: p.area ?? '—', label: 'sqft' },
              { icon: 'building', value: p.floor ?? '—', label: 'Floor' },
              { icon: 'calendar', value: p.age ?? '—', label: 'Age' },
            ]}
          />
        </View>
        <View style={styles.mt5}>
          <SectionTitle>About this property</SectionTitle>
          <T style={styles.desc}>
            {p.description || 'The owner has not added a description yet.'}
          </T>
        </View>
        <View style={styles.mt5}>
          <SectionTitle>Floor plan</SectionTitle>
        </View>
        <Grid cols={3} gap={8} style={styles.mb5}>
          {hasPlan ? (
            <Press
              onPress={() => nav.go('floorPlan', { property: p })}
              style={styles.plan}
            >
              <PhotoPlaceholder
                src={p.floorPlanUrl}
                gradient={['#E8EEF6', '#CBD8E8']}
                height={90}
                style={styles.planImg}
              >
                <T style={styles.planLabel}>Plan 1</T>
                <View style={styles.planMax}>
                  <Icon name="maximize-2" size={10} color="#FFFFFF" />
                </View>
              </PhotoPlaceholder>
            </Press>
          ) : (
            <View style={styles.plan}>
              <PhotoPlaceholder
                gradient={['#E8EEF6', '#CBD8E8']}
                height={90}
                style={styles.planImg}
                noShade
              >
                <T style={styles.planNone}>Not available</T>
              </PhotoPlaceholder>
            </View>
          )}
        </Grid>
        <View style={styles.mb2}>
          <SectionTitle>Explore</SectionTitle>
        </View>
        <Grid cols={4} gap={8} style={styles.mb5}>
          {(
            [
              ['glasses', 'VR Tour', () => nav.go('vrTour', { property: p })],
              ['plane', 'Aerial', () => nav.go('aerial', { property: p })],
              ['list-checks', 'Specs', () => nav.go('specs', { property: p })],
              [
                'map-pin',
                'Location',
                () => nav.go('advantages', { property: p }),
              ],
            ] as const
          ).map(([icon, label, onPress]) => (
            <Press key={label} onPress={onPress} style={styles.explore}>
              <Icon name={icon} size={20} color="#1A6FFF" />
              <T style={styles.exploreText}>{label}</T>
            </Press>
          ))}
        </Grid>
        <Card style={styles.advisor}>
          <View style={styles.advisorAvatar}>
            <T style={styles.advisorInitials}>BG</T>
          </View>
          <View style={styles.flex}>
            <T style={styles.advisorName} numberOfLines={1}>
              Builtglory Advisor
            </T>
            <T style={styles.advisorSub}>
              {supportPhone
                ? `Property support · ${supportPhone}`
                : 'Property support'}
            </T>
          </View>
          <Press
            onPress={() => supportPhone && callPhone(supportPhone)}
            disabled={!supportPhone}
            accessibilityLabel="Call advisor"
            style={styles.call}
          >
            <Icon name="phone" size={15} color="#1A6FFF" />
          </Press>
        </Card>
      </View>
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1'),
  fill: { width: '100%', height: '100%' },
  stretch: { alignSelf: 'stretch' },
  glassBtn: {
    ...tw('w-10 h-10 rounded-full items-center justify-center elev-2'),
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  glassSmall: {
    ...tw('w-9 h-9 rounded-full items-center justify-center'),
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  backPos: { position: 'absolute', left: 16, top: 12 },
  verified: {
    ...tw(
      'absolute top-16 left-4 bg-emerald-500 px-3 py-1 rounded-full flex items-center gap-1 elev-2',
    ),
  },
  verifiedText: tw('text-white text-[11px] font-bold'),
  topRight: tw('absolute top-3 right-3 flex gap-2'),
  maxPos: { position: 'absolute', left: 12, bottom: 12 },
  counter: {
    ...tw('absolute bottom-3 right-3 px-2 py-0.5 rounded-full'),
    backgroundColor: 'rgba(9,14,30,0.55)',
  },
  counterText: tw('num text-white text-[11px] font-bold'),
  dots: {
    ...tw('absolute flex gap-1.5'),
    bottom: 14,
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
  dot: tw('h-1.5 rounded-full'),
  dotOn: tw('w-6 bg-white'),
  dotOff: tw('w-1.5 bg-white/55'),
  swipeHint: {
    ...tw(
      'absolute text-[10px] font-semibold text-white/70 tracking-wide text-center',
    ),
    bottom: 36,
    left: 0,
    right: 0,
  },
  full: { flex: 1, backgroundColor: '#000000' },
  fullStage: { flex: 1 },
  fsBtn: {
    ...tw('absolute w-9 h-9 rounded-full items-center justify-center z-10'),
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  fsCounter: {
    ...tw('absolute right-4 px-2.5 py-0.5 rounded-full'),
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  fsCounterText: tw('text-white text-[11px] font-semibold'),
  fsPrev: { left: 12, top: '50%', marginTop: -18 },
  fsNext: { right: 12, top: '50%', marginTop: -18 },
  fsBar: {
    ...tw('px-3 pt-2 flex justify-center gap-2'),
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  fsClose: tw('px-3 py-1.5 rounded-lg bg-white'),
  fsCloseText: tw('text-black font-semibold text-[12px]'),
  fsDownload: tw(
    'px-3 py-1.5 rounded-lg bg-brand-600 flex items-center gap-1.5',
  ),
  fsDownloadText: tw('text-white font-semibold text-[12px]'),
  dockHeart: tw(
    'w-11 h-11 rounded-full bg-ink-100 items-center justify-center',
  ),
  body: tw('px-4 pt-1'),
  title: twh('text-[20px] font-extrabold text-ink-900 leading-snug'),
  locRow: tw('mt-1.5 flex items-center gap-1'),
  loc: tw('text-[12.5px] text-ink-500'),
  mapLink: tw('text-[12.5px] text-brand-600 font-semibold'),
  mt4: tw('mt-4'),
  mt5: tw('mt-5'),
  mb5: tw('mb-5'),
  mb2: tw('mb-2'),
  desc: tw('text-[13px] leading-relaxed'),
  plan: { height: 90, borderRadius: 6, overflow: 'hidden' },
  planImg: { borderRadius: 6 },
  planLabel: {
    ...tw(
      'absolute bottom-1 left-1 text-[10px] text-white font-semibold rounded px-1.5',
    ),
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  planNone: {
    ...tw(
      'absolute bottom-1 left-1 text-[10px] text-white font-semibold rounded px-1.5',
    ),
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  planMax: {
    ...tw(
      'absolute top-1 right-1 w-5 h-5 rounded-full items-center justify-center',
    ),
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  explore: tw('p-3 rounded-card border border-ink-200 items-center'),
  exploreText: tw('text-[11px] font-semibold mt-1'),
  advisor: {
    ...tw('p-3 flex items-center gap-3'),
    experimental_backgroundImage: 'linear-gradient(to right, #EEF4FF, #FFFFFF)',
  },
  advisorAvatar: {
    ...tw('w-11 h-11 rounded-full items-center justify-center elev-2'),
    experimental_backgroundImage: 'linear-gradient(135deg, #3B86FF, #1259D4)',
  },
  advisorInitials: tw('text-white font-bold text-[16px]'),
  advisorName: tw('text-[13.5px] font-bold'),
  advisorSub: tw('text-[11px] text-ink-500'),
  call: tw(
    'w-10 h-10 rounded-full bg-white items-center justify-center elev-2',
  ),
});
