import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Field, Input } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { Grid } from '../../components/Layout';
import { Press } from '../../components/Press';
import { Screen, ScreenFooter, SolidButton } from '../../components/Screen';
import { ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { useToast } from '../../context/ToastContext';
import { useResource } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import {
  getMySellRequest,
  updateMySellRequest,
} from '../../services/sellRequest.service';
import type { SellRequest } from '../../types/sellRequest';
import { palette, tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { SELL_STATUS_LABEL } from './sellShared';

const EDITABLE = ['draft', 'changes_requested'];
const STATUS_LABEL = SELL_STATUS_LABEL;

const digits = (v: string) => v.replace(/[^\d]/g, '');

/** SL-09 Edit a listing (PATCH /me/sell-requests/:id — allowed for drafts and change requests only). */
export function EditListingScreen({ params }: ScreenProps<'editListing'>) {
  const nav = useNav();
  const toast = useToast();
  const res = useResource(
    signal => getMySellRequest(params.id, signal),
    [params.id],
  );
  const req = res.data;
  const editable = req ? EDITABLE.includes(req.status) : false;
  const [data, setData] = useState({
    title: '',
    price: '',
    area: '',
    floor: '',
  });
  const [saving, setSaving] = useState<'save' | 'draft' | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!req) return;
    const s = req.specifications ?? {};
    setData({
      title: req.propertyTitle ?? '',
      price: req.askingPrice ? String(req.askingPrice) : '',
      area: s.builtUpArea ? String(s.builtUpArea) : '',
      floor: s.floor !== null && s.floor !== undefined ? String(s.floor) : '',
    });
  }, [req]);

  const persist = async (
    mode: 'save' | 'draft',
  ): Promise<SellRequest | null> => {
    if (!req) return null;
    setSaving(mode);
    setError(null);
    try {
      const price = Number(data.price);
      return await updateMySellRequest(req._id, {
        propertyTitle: data.title.trim(),
        ...(price ? { askingPrice: price } : {}),
        specifications: {
          ...(req.specifications ?? {}),
          builtUpArea: Number(data.area) || undefined,
          floor: data.floor || undefined,
        },
      });
    } catch (e) {
      setError(errorMessage(e));
      return null;
    } finally {
      setSaving(null);
    }
  };

  const save = async () => {
    const updated = await persist('save');
    if (!updated) return;
    setSaved(true);
    toast.show('Changes saved!');
    setTimeout(() => nav.jump('myListings'), 1200);
  };
  const saveDraft = async () => {
    const updated = await persist('draft');
    if (updated) nav.go('draftSuccess', { request: updated });
  };

  return (
    <Screen
      topBar={{
        title: 'Edit Listing',
        sub: req
          ? `Status: ${STATUS_LABEL[req.status] ?? req.status}`
          : undefined,
        back: true,
      }}
      footer={
        req ? (
          <ScreenFooter style={styles.footer}>
            {error && <T style={styles.error}>{error}</T>}
            <SolidButton
              label={saved ? 'Saved!' : 'Save Changes'}
              icon={
                saved ? (
                  <Icon name="check" size={18} color="#FFFFFF" />
                ) : undefined
              }
              tone={saved ? 'emerald' : 'brand'}
              loading={saving === 'save'}
              loadingLabel="Saving…"
              disabled={!editable || !data.title.trim()}
              onPress={save}
            />
            {req.status === 'draft' && (
              <Press
                onPress={saveDraft}
                disabled={saving !== null}
                pressScale={0.99}
                style={styles.draftBtn}
              >
                <T style={styles.draftText}>
                  {saving === 'draft' ? 'Saving…' : 'Save as Draft'}
                </T>
              </Press>
            )}
          </ScreenFooter>
        ) : undefined
      }
      footerSpace={150}
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
            {!editable ? (
              <View style={[styles.banner, styles.bannerLocked]}>
                <Icon name="lock" size={14} color="#D97706" />
                <T style={[styles.bannerText, { color: palette.amber[800] }]}>
                  Editing is only available before review begins.
                </T>
              </View>
            ) : (
              <View style={[styles.banner, styles.bannerInfo]}>
                <Icon name="info" size={14} color="#1A6FFF" />
                <T style={[styles.bannerText, { color: palette.brand[700] }]}>
                  {req.status === 'changes_requested' &&
                  req.changeRequests?.length
                    ? `Requested changes: ${req.changeRequests.join(' · ')}`
                    : 'You can edit until our team starts the review.'}
                </T>
              </View>
            )}
            <View style={styles.fields}>
              <Field label="Property Title" required>
                <Input
                  editable={editable}
                  value={data.title}
                  maxLength={200}
                  onChangeText={v => setData(d => ({ ...d, title: v }))}
                />
              </Field>
              <Field label="Asking Price (₹)" required>
                <Input
                  editable={editable}
                  prefix="₹"
                  keyboardType="number-pad"
                  value={data.price}
                  onChangeText={v => setData(d => ({ ...d, price: digits(v) }))}
                />
              </Field>
              <Grid cols={2} gap={12}>
                <Field label="Built-up Area">
                  <Input
                    editable={editable}
                    keyboardType="number-pad"
                    value={data.area}
                    onChangeText={v =>
                      setData(d => ({ ...d, area: digits(v) }))
                    }
                  />
                </Field>
                <Field label="Floor">
                  <Input
                    editable={editable}
                    keyboardType="number-pad"
                    value={data.floor}
                    onChangeText={v =>
                      setData(d => ({ ...d, floor: digits(v) }))
                    }
                  />
                </Field>
              </Grid>
              <Press
                disabled={!editable}
                onPress={() => nav.go('sellPhotos', { editId: req._id })}
                pressScale={0.99}
                style={[styles.link, !editable && styles.linkLocked]}
              >
                <T style={styles.linkText}>Photos & Amenities</T>
                <Icon name="chevron-right" size={16} color="#94A3B8" />
              </Press>
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: tw('px-4 pb-24'),
  banner: tw('flex items-center gap-2 p-3 rounded-card mb-4'),
  bannerLocked: tw('bg-amber-50 border border-amber-200'),
  bannerInfo: tw('bg-brand-50'),
  bannerText: tw('flex-1 text-[12px]'),
  fields: { gap: 16 },
  link: tw(
    'w-full flex items-center justify-between p-3.5 rounded-card border border-ink-200',
  ),
  linkLocked: { opacity: 0.5 },
  linkText: tw('text-[13px] font-semibold'),
  footer: { gap: 8 },
  draftBtn: tw(
    'w-full h-12 rounded-xl border border-ink-200 items-center justify-center',
  ),
  draftText: tw('font-semibold text-[15px] text-ink-700'),
  error: tw('text-[12px] text-rose-600'),
});
