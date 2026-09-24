import { Text, TextProps } from 'react-native';

import { FontFamily } from '@/constants/theme';

export function AppText({ style, ...props }: TextProps) {
  return <Text style={[{ fontFamily: FontFamily.regular }, style]} {...props} />;
}