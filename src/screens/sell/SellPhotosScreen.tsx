import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { Grid } from '../../components/Layout';
import { Spin } from '../../components/Motion';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Press } from '../../components/Press';
import { Screen, ScreenFooter, SolidButton } from '../../components/Screen';
import { SellHeader } from '../../components/SellHeader';
import { Sheet } from '../../components/Sheet';
import { LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { useSellFlow } from '../../context/SellFlowContext';
import { useToast } from '../../context/ToastContext';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { getMySellRequest } from '../../services/sellRequest.service';
import { tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { pickImages, takePhoto } from '../../utils/media';
import { useBackgroundDraftSave } from './sellShared';

// The backend requires at least 5 photos before a listing can be submitted.
const MIN = 5;
const MAX = 30;

/** SL-06 Photo upload (step 4/7). Each photo is uploaded with POST /documents to the draft. */
export function SellPhotosScreen({ params }: ScreenProps<'sellPhotos'>) {
  const nav = useNav();
  const toast = useToast();
  const sell = useSellFlow();
  const saveInBackground = useBackgroundDraftSave();
  const [chooser, setChooser] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(
    Boolean(params?.editId && sell.draftId !== params.editId),
  );
  const editId = params?.editId;

  // Opened from Edit Listing: load that request into the wizard first.
  useEffect(() => {
    if (!editId || sell.draftId === editId) return;
    getMySellRequest(editId)
      .then(req => sell.load(req))
      .catch(e => toast.show(errorMessage(e), 'error'))
      .finally(() => setLoadingEdit(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const photos = sell.form.photos;
  const ready = photos.filter(p => p.status === 'done').length;
  const uploading = photos.some(p => p.status === 'uploading');

  const add = async (source: 'library' | 'camera') => {
    setChooser(false);
    try {
      const files =
        source === 'library'
          ? await pickImages(Math.max(1, MAX - photos.length))
          : await takePhoto().then(f => (f ? [f] : []));
      if (files.length) await sell.uploadPhotos(files);
    } catch (e) {
      toast.show(errorMessage(e), 'error');
    }
  };

  return (
    <Screen
      footer={
        <ScreenFooter>
          <SolidButton
            label={`Continue (${ready}/${MIN} photos)`}
            disabled={ready < MIN || uploading}
            onPress={() => {
              saveInBackground(6);
              nav.go('sellPrice');
            }}
          />
        </ScreenFooter>
      }
    >
      <SellHeader step={4} title="Add Photos" />
      <View style={styles.body}>
        {loadingEdit ? (
          <LoadingState />
        ) : (
          <>
            <T style={styles.lead}>
              Add at least {MIN} photos. The first one is your cover.
            </T>
            <Grid cols={3} gap={8} style={styles.mb4}>
              {[
                ...photos.map((p, i) => (
                  <View key={p.key} style={styles.square}>
                    <PhotoPlaceholder
                      tag={p.key}
                      src={p.uri}
                      noShade
                      style={styles.photo}
                    />
                    {i === 0 && p.status === 'done' && (
                      <View style={styles.cover}>
                        <T style={styles.coverText}>COVER</T>
                      </View>
                    )}
                    {p.status === 'uploading' && (
                      <View style={styles.overlay}>
                        <Spin>
                          <Icon name="loader-2" size={20} color="#FFFFFF" />
                        </Spin>
                      </View>
                    )}
                    {p.status === 'error' && (
                      <Press
                        onPress={() =>
                          toast.show(p.error ?? 'Upload failed', 'error')
                        }
                        style={[styles.overlay, styles.overlayError]}
                      >
                        <Icon name="circle-alert" size={20} color="#FFFFFF" />
                        <T style={styles.errorText}>Failed</T>
                      </Press>
                    )}
                    <Press
                      onPress={() => sell.removePhoto(p.key)}
                      style={styles.remove}
                      accessibilityLabel="Remove photo"
                    >
                      <Icon name="x" size={12} color="#FFFFFF" />
                    </Press>
                  </View>
                )),
                photos.length < MAX ? (
                  <Press
                    key="add"
                    onPress={() => setChooser(true)}
                    style={[styles.square, styles.add]}
                    accessibilityLabel="Add photos"
                  >
                    <Icon name="plus" size={22} color="#94A3B8" />
                    <T style={styles.addText}>Add</T>
                  </Press>
                ) : null,
              ]}
            </Grid>
            <View style={styles.info}>
              <Icon name="info" size={14} color="#64748B" />
              <T style={styles.infoText}>
                {ready}/{MIN} required photos
              </T>
            </View>
            <T style={styles.h3}>Tips for great photos</T>
            {[
              'Shoot in daylight with windows open',
              'Wide-angle covers more of each room',
              'Tidy clutter before each shot',
            ].map(t => (
              <View key={t} style={styles.tip}>
                <Icon name="check" size={14} color="#10B981" />
                <T style={styles.tipText}>{t}</T>
              </View>
            ))}
          </>
        )}
      </View>
      <Sheet
        visible={chooser}
        onClose={() => setChooser(false)}
        title="Add photos"
      >
        <View style={styles.choices}>
          <Press onPress={() => add('library')} style={styles.choice}>
            <Icon name="image" size={18} color="#1A6FFF" />
            <T style={styles.choiceText}>Choose from gallery</T>
          </Press>
          <Press onPress={() => add('camera')} style={styles.choice}>
            <Icon name="camera" size={18} color="#1A6FFF" />
            <T style={styles.choiceText}>Take a photo</T>
          </Press>
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: tw('px-4 mt-4 pb-24'),
  lead: tw('text-[12px] text-ink-500 mb-3'),
  mb4: tw('mb-4'),
  square: { aspectRatio: 1, position: 'relative' },
  photo: { ...tw('rounded-card'), width: '100%', height: '100%' },
  cover: tw('absolute top-1 left-1 bg-emerald-600 px-1.5 py-0.5 rounded'),
  coverText: tw('text-white text-[9px] font-bold'),
  overlay: {
    ...StyleSheet.absoluteFill,
    ...tw('rounded-card items-center justify-center'),
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  overlayError: { backgroundColor: 'rgba(225,29,72,0.6)' },
  errorText: tw('text-white text-[10px] font-bold mt-1'),
  remove: {
    ...tw(
      'absolute w-6 h-6 rounded-full bg-rose-500 items-center justify-center',
    ),
    top: -6,
    right: -6,
  },
  add: tw(
    'rounded-card border-2 border-dashed border-ink-300 items-center justify-center',
  ),
  addText: tw('text-[10px] text-ink-500 mt-0.5'),
  info: tw('p-3 bg-ink-50 rounded-card flex items-center gap-2 mb-4'),
  infoText: tw('text-[12px] text-ink-700'),
  h3: tw('text-[13px] font-semibold mb-2'),
  tip: tw('flex gap-2 mb-1.5'),
  tipText: tw('flex-1 text-[12px] text-ink-700'),
  choices: { gap: 8 },
  choice: tw('flex items-center gap-3 p-4 rounded-card border border-ink-200'),
  choiceText: tw('text-[14px] font-semibold'),
});
