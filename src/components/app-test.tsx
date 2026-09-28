import { Text, TextProps } from 'react-native';

import { FontFamily } from '@/constants/fonts';

export function AppText({ style, ...props }: TextProps) {
  return <Text style={[{ fontFamily: FontFamily.regular }, style]} {...props} />;
}