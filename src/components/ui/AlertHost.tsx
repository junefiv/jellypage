import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
import Animated, { FadeOut, runOnJS } from 'react-native-reanimated';

import JellyAlertDom from '@/src/components/jelly/JellyAlert.dom';
import { jellyDom } from '@/src/components/jelly/domProps';
import { useAlert } from '@/src/features/alert/alert';
import { alertTone, type AlertKind } from '@/src/theme/tokens';

import { ALERT_DOM_H } from '@/src/components/ui/alertConstants';

const DISMISS_MS = 4200;
const BANNER_MAX_W = 360;

type Sheet = { text: string; token: number; tone: AlertKind };

export function AlertHost() {
  const { width: screenW } = useWindowDimensions();
  const bannerW = Math.min(screenW - 32, BANNER_MAX_W);
  const message = useAlert((s) => s.message);
  const tone = useAlert((s) => s.tone);
  const token = useAlert((s) => s.token);
  const hide = useAlert((s) => s.hide);
  const dismissRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [show, setShow] = useState(false);

  const finish = useCallback(() => {
    hide();
    setSheet(null);
    setShow(false);
  }, [hide]);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShow(false);
  }, []);

  useEffect(() => {
    if (!message) return;
    setSheet({ text: message, token, tone });
    setShow(true);
    timerRef.current = setTimeout(dismiss, DISMISS_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [message, token, tone, dismiss]);

  const exit = FadeOut.duration(200).withCallback((finished) => {
    'worklet';
    if (finished) runOnJS(finish)();
  });

  if (!sheet) return null;

  const colors = alertTone[sheet.tone];

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={dismiss}
    >
      <TouchableWithoutFeedback onPress={dismiss} accessible={false}>
        <View style={styles.overlay}>
        {show ? (
          <Animated.View exiting={exit} pointerEvents="none" style={styles.exitWrap}>
            <View style={[styles.banner, { width: bannerW, height: ALERT_DOM_H }]}>
              <JellyAlertDom
                key={sheet.token}
                {...jellyDom({
                  matchContents: false,
                  style: {
                    width: bannerW,
                    height: ALERT_DOM_H,
                    minHeight: ALERT_DOM_H,
                    backgroundColor: 'transparent',
                    overflow: 'visible',
                  },
                })}
                message={sheet.text}
                size="medium"
                tone={sheet.tone}
                accent={colors.base}
                accentIcon={colors.icon}
                accentFill={colors.fill}
                accentBorder={colors.border}
                onDismiss={dismiss}
                dismissRef={dismissRef}
              />
            </View>
          </Animated.View>
        ) : null}
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  exitWrap: {
    overflow: 'visible',
  },
  banner: {
    overflow: 'visible',
  },
});
