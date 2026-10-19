import { StyleSheet, Text, TextProps } from 'react-native';
import { useSyncExternalStore } from 'react';

import { FontFamily } from '@/constants/fonts';
import { getTextScale, subscribeTextScale } from '@/lib/text-size';

export function AppText({ style, ...props }: TextProps) {
  const scale = useSyncExternalStore(subscribeTextScale, getTextScale, getTextScale);

  let scaled = style;
  if (scale !== 1) {
    // "Bigger text": grow the size and the line height together so lines don't clip
    const flat = StyleSheet.flatten(style) ?? {};
    scaled = {
      ...flat,
      ...(flat.fontSize ? { fontSize: flat.fontSize * scale } : {}),
      ...(flat.lineHeight ? { lineHeight: flat.lineHeight * scale } : {}),
    };
  }

  return <Text style={[{ fontFamily: FontFamily.regular }, scaled]} {...props} />;
}