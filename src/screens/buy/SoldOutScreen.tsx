import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { Icon } from '../../components/Icon';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { propertyTypeById } from '../../config/catalog';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { tw, twh } from '../../theme';

/** B-19 Property sold (status "sold" on GET /properties/:id). */
export function SoldOutScreen({ params }: ScreenProps<'soldOut'>) {
  const nav = useNav();
  const p = params.property;
  return (
    <Screen padBottom>
      <PhotoPlaceholder tag={`${p.id}sold`} src={p.images[0]} height={260}>
        <Press onPress={nav.back} style={styles.back} accessibilityLabel="Back">
          <Icon name="arrow-left" size={18} />
        </Press>
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.stamp}>
            <T style={styles.stampText}>SOLD</T>
          </View>
        </View>
      </PhotoPlaceholder>
      <View style={styles.body}>
        <T style={styles.title}>This property has been sold</T>
        <T style={styles.text}>
          {p.title} is no longer on the market. Explore similar listings nearby.
        </T>
        <Btn
          style={styles.cta}
          icon="search"
          onPress={() =>
            nav.go('buyList', {
              filters: {
                typeId: propertyTypeById(p.type)?.id,
                apiType: p.type,
                city: p.city || undefined,
              },
            })
          }
        >
          View Similar Properties
        </Btn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    ...tw(
      'absolute left-4 top-3 w-10 h-10 rounded-full items-center justify-center z-10',
    ),
    backgroundColor: 'rgba(255,255,255,0.9)',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1)',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stamp: {
    ...tw('border-4 border-white px-6 py-2 rounded'),
    transform: [{ rotate: '-12deg' }],
  },
  stampText: {
    ...tw('text-white text-[34px] font-black'),
    letterSpacing: 34 * 0.2,
  },
  body: tw('px-4 pt-5 items-center'),
  title: { ...twh('text-[20px] font-bold text-ink-900 text-center') },
  text: tw(
    'text-[13px] text-ink-500 mt-2 max-w-[270px] leading-relaxed text-center',
  ),
  cta: tw('w-full mt-6'),
});
