import React from 'react';
import { useThemeMode } from '@rbx/settings';

export type ThemedImageProps = {
  lightSrc: string;
  darkSrc?: string;
  alt: string;
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'>;

const ThemedImage: React.FC<ThemedImageProps> = ({ lightSrc, darkSrc, alt, ...imgProps }) => {
  const { themeMode } = useThemeMode();
  const illustrationPath = themeMode === 'dark' ? (darkSrc ?? lightSrc) : lightSrc;

  return <img src={illustrationPath} alt={alt} {...imgProps} />;
};

export default ThemedImage;
