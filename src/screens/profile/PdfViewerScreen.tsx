import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Btn } from '../../components/Btn';
import { Icon } from '../../components/Icon';
import { Press } from '../../components/Press';
import { LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { useToast } from '../../context/ToastContext';
import { useResource } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { getDocumentReadUrl } from '../../services/document.service';
import { palette, tw } from '../../theme';
import { openUrl } from '../../utils/links';

const IMAGE = /\.(png|jpe?g|webp|gif)(\?|#|$)/i;

/**
 * P-11 Document viewer. Image documents render inline with zoom; PDFs and other files open in the device viewer
 * (no PDF renderer ships with the app). Private files resolve through GET /documents/:id/read-url.
 */
export function PdfViewerScreen({ params }: ScreenProps<'pdfViewer'>) {
  const nav = useNav();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { doc } = params;
  const url = useResource(
    async () =>
      doc.url
        ? doc.url
        : doc.documentId
        ? (await getDocumentReadUrl(doc.documentId)).readUrl
        : null,
    [doc.url, doc.documentId],
  );
  const [zoom, setZoom] = useState(1);
  const [failed, setFailed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(scale, {
      toValue: zoom,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [scale, zoom]);

  const link = url.data ?? null;
  const isImage = Boolean(link && IMAGE.test(link));
  const name = /\.[a-z0-9]{2,4}$/i.test(doc.name)
    ? doc.name
    : `${doc.name}.pdf`;

  const download = async () => {
    if (!link) return;
    const ok = await openUrl(link);
    toast.show(
      ok ? 'Opening document…' : 'Could not open the document',
      ok ? 'success' : 'error',
    );
  };
  const share = async () => {
    if (!link) return;
    try {
      await Share.share({
        message: `${doc.name}: ${link}`,
        url: link,
        title: doc.name,
      });
    } catch {
      toast.show('Could not open the share sheet', 'error');
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.toolbar}>
        <Press
          onPress={nav.back}
          style={styles.toolBtn}
          accessibilityLabel="Back"
        >
          <Icon name="arrow-left" size={20} color="#FFFFFF" />
        </Press>
        <View style={styles.flex}>
          <T style={styles.name} numberOfLines={1}>
            {name}
          </T>
          <T style={styles.meta}>
            {isImage ? 'Page 1 of 1' : doc.meta ?? 'Document'}
          </T>
        </View>
        <Press
          disabled={!link}
          onPress={download}
          style={styles.toolBtn}
          accessibilityLabel="Download"
        >
          <Icon name="download" size={17} color="#FFFFFF" />
        </Press>
        <Press
          disabled={!link}
          onPress={share}
          style={styles.toolBtn}
          accessibilityLabel="Share"
        >
          <Icon name="share-2" size={16} color="#FFFFFF" />
        </Press>
      </View>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.page}
        maximumZoomScale={3}
        minimumZoomScale={1}
        centerContent
      >
        {url.loading ? (
          <LoadingState />
        ) : !link || url.error ? (
          <View style={styles.message}>
            <Icon name="file-text" size={32} color={palette.ink[400]} />
            <T style={styles.messageText}>
              {url.error ?? 'This document has no file attached yet.'}
            </T>
            {url.error ? (
              <Btn variant="outline" size="sm" style={styles.selfCenter} onPress={url.reload}>
                Retry
              </Btn>
            ) : null}
          </View>
        ) : isImage && !failed ? (
          <Animated.View style={[styles.sheet, { transform: [{ scale }] }]}>
            <Image
              source={{ uri: link }}
              style={styles.image}
              resizeMode="contain"
              onError={() => setFailed(true)}
              accessibilityLabel={doc.name}
            />
          </Animated.View>
        ) : (
          <View style={styles.message}>
            <View style={styles.fileIcon}>
              <Icon name="file-text" size={28} color="#E11D48" />
            </View>
            <T style={styles.fileName}>{name}</T>
            <T style={styles.messageText}>
              {failed
                ? 'The preview could not be loaded.'
                : 'This file opens in your device’s document viewer.'}
            </T>
            <Btn icon="external-link" style={styles.selfCenter} onPress={download}>
              Open document
            </Btn>
          </View>
        )}
      </ScrollView>
      {isImage && !failed ? (
        <View style={[styles.controls, { paddingBottom: 12 + insets.bottom }]}>
          <View style={[styles.toolRound, styles.disabled]}>
            <Icon name="chevron-left" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.zoom}>
            <Press
              onPress={() => setZoom(z => Math.max(0.8, +(z - 0.2).toFixed(1)))}
              style={styles.toolRound}
              accessibilityLabel="Zoom out"
            >
              <Icon name="zoom-out" size={16} color="#FFFFFF" />
            </Press>
            <T style={styles.zoomText}>{Math.round(zoom * 100)}%</T>
            <Press
              onPress={() => setZoom(z => Math.min(2, +(z + 0.2).toFixed(1)))}
              style={styles.toolRound}
              accessibilityLabel="Zoom in"
            >
              <Icon name="zoom-in" size={16} color="#FFFFFF" />
            </Press>
          </View>
          <View style={[styles.toolRound, styles.disabled]}>
            <Icon name="chevron-right" size={18} color="#FFFFFF" />
          </View>
        </View>
      ) : (
        <View style={{ height: insets.bottom }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  selfCenter: tw('self-center'),
  root: { ...StyleSheet.absoluteFill, backgroundColor: palette.ink[900] },
  flex: tw('flex-1 min-w-0'),
  toolbar: tw('px-3 py-2.5 flex items-center gap-2'),
  toolBtn: tw('w-9 h-9 rounded-full items-center justify-center'),
  name: tw('text-[14px] font-semibold text-white'),
  meta: { ...tw('text-[10.5px]'), color: 'rgba(255,255,255,0.5)' },
  page: tw('flex-grow items-center justify-center p-4'),
  sheet: {
    ...tw('bg-white rounded overflow-hidden'),
    width: 280,
    boxShadow: '0 25px 50px -12px rgba(0,0,0,.25)',
  },
  image: { width: 280, height: 396 },
  message: tw('items-center gap-3 px-8'),
  messageText: {
    ...tw('text-[13px] text-center'),
    color: 'rgba(255,255,255,0.7)',
  },
  fileIcon: tw('w-16 h-16 rounded-2xl bg-white items-center justify-center'),
  fileName: tw('text-[14px] font-semibold text-white text-center'),
  controls: {
    ...tw('px-4 pt-3 flex items-center justify-between'),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  zoom: tw('flex items-center gap-2'),
  toolRound: {
    ...tw('w-10 h-10 rounded-full items-center justify-center'),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  disabled: { opacity: 0.3 },
  zoomText: {
    ...tw('text-[12px] w-10 text-center'),
    color: 'rgba(255,255,255,0.7)',
  },
});
