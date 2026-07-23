import { Locale } from '@rbx/intl';

const localeNameMapping: { [key in Locale]: string } = {
  [Locale.English]: 'en_us',
  [Locale.Spanish]: 'es_es',
  [Locale.French]: 'fr_fr',
  [Locale.German]: 'de_de',
  [Locale.Italian]: 'it_it',
  [Locale.BrazilPortuguese]: 'pt_br',
  [Locale.Korean]: 'ko_kr',
  [Locale.SimplifiedChinese]: 'zh_cn',
  [Locale.SimplifiedChineseJV]: 'zh_cjv',
  [Locale.TraditionalChinese]: 'zh_tw',
  [Locale.Japanese]: 'ja_jp',
  [Locale.Russian]: 'ru_ru',
  [Locale.Indonesian]: 'id_id',
  [Locale.Polish]: 'pl_pl',
  [Locale.Vietnamese]: 'vi_vn',
  [Locale.Turkish]: 'tr_tr',
  [Locale.Arabic]: 'ar_001',
  [Locale.Thai]: 'th_th',
  [Locale.Hindi]: 'hi_in',
};

export default localeNameMapping;
