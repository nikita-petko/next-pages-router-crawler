import { Locale, NativeName } from '@rbx/intl';
import EnglishMetaJson from '../../../../public/metadata/en-US/CreatorDashboard.Metadata.json';
import ChineseMetaJson from '../../../../public/metadata/zh-CN/CreatorDashboard.Metadata.json';

export const defaultLocale =
  process.env.buildTarget === 'luobu' ? Locale.SimplifiedChinese : Locale.English;
export const defaultNativeName =
  process.env.buildTarget === 'luobu' ? NativeName.SimplifiedChinese : NativeName.English;

export const fallbackLocale =
  process.env.buildTarget === 'luobu' ? Locale.SimplifiedChinese : undefined;

export const defaultMetadataJson =
  defaultLocale === Locale.SimplifiedChinese ? ChineseMetaJson : EnglishMetaJson;
