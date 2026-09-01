import { useMemo, useState, useEffect } from 'react';
import type { FormattedText, TranslationKey } from '@modules/analytics-translations/types';
import type {
  GetEstimatedAdsEarningsResponse,
  DailyEstimatedEarning,
} from '@modules/clients/developerAdsStats';

// EPM (Earnings Per Mille) is measured per 1000 ad views
const EPM_DIVISOR = 1000;

interface AdFormat {
  value: string;
  label: string;
}

interface UseEstimatedEarningsProps {
  apiData: GetEstimatedAdsEarningsResponse;
  translate: (key: TranslationKey) => FormattedText;
  RewardedVideoAdsKey: TranslationKey;
}

interface UseEstimatedEarningsReturn {
  selectedAdFormat: string;
  setSelectedAdFormat: (format: string) => void;
  dailyAdViews: number;
  setDailyAdViews: (views: number) => void;
  adFormats: AdFormat[];
  estimatedEarnings: number;
  formattedEarnings: string | number;
  handleAdFormatChange: (event: React.ChangeEvent<{ value: string }>) => void;
  handleSliderChange: (event: Event, value: number | number[]) => void;
}

const useEstimatedEarnings = ({
  apiData,
  translate,
  RewardedVideoAdsKey,
}: UseEstimatedEarningsProps): UseEstimatedEarningsReturn => {
  const [selectedAdFormat, setSelectedAdFormat] = useState<string>('');
  const [dailyAdViews, setDailyAdViews] = useState<number>(1.5);

  // Map API ad format keys to display labels
  const AD_FORMAT_LABELS: Record<string, string> = useMemo(
    () => ({
      AD_FORMAT_VIDEO_2D: translate(RewardedVideoAdsKey),
    }),
    [translate, RewardedVideoAdsKey],
  );

  // Set default ad format and daily ad views from API data
  useEffect(() => {
    const formats = Object.keys(apiData.dailyEstimatedEarningsByFormat || {});
    if (formats.length > 0 && !selectedAdFormat) {
      setSelectedAdFormat(formats[0]);

      // Set default daily ad views from API
      const defaultFormat = apiData.dailyEstimatedEarningsByFormat?.[formats[0]];
      if (defaultFormat?.defaultAdsViewPerEdau) {
        setDailyAdViews(defaultFormat.defaultAdsViewPerEdau);
      }
    }
  }, [apiData, selectedAdFormat]);

  // Generate ad formats from API data
  const adFormats: AdFormat[] = useMemo(() => {
    return Object.keys(apiData.dailyEstimatedEarningsByFormat || {}).map((formatKey) => ({
      value: formatKey,
      label: AD_FORMAT_LABELS[formatKey] || formatKey,
    }));
  }, [apiData, AD_FORMAT_LABELS]);

  // Calculate estimated weekly earnings based on API data
  const estimatedEarnings = useMemo(() => {
    if (!selectedAdFormat) {
      return 0;
    }

    const formatData = apiData.dailyEstimatedEarningsByFormat?.[selectedAdFormat];
    if (!formatData?.dailyEstimatedEarnings) {
      return 0;
    }

    // Calculate weekly earning: dailyAdViews * sum of (daily eligible DAU * EPM)
    const weeklySum = formatData.dailyEstimatedEarnings.reduce(
      (total: number, dailyData: DailyEstimatedEarning) => {
        const dailyValue = (dailyData.eligibleDau || 0) * (dailyData.estimatedEpmRobux || 0);
        return total + dailyValue;
      },
      0,
    );

    const weeklyEarnings = (dailyAdViews * weeklySum) / EPM_DIVISOR;

    return Math.round(weeklyEarnings); // Round to nearest integer
  }, [apiData, selectedAdFormat, dailyAdViews]);

  // Format earnings for display with 2-digit precision
  // Examples: 15345 -> "15K", 1187 -> "1.2K", 907 -> "910", 409 -> "410", 533 -> "530"
  const formattedEarnings = useMemo(() => {
    if (estimatedEarnings >= 10000000) {
      // For 10M and above: round to nearest M (e.g., 15345000 -> 15M)
      return `${Math.round(estimatedEarnings / 1000000)}M`;
    }
    if (estimatedEarnings >= 1000000) {
      // For 1M to 9.9M: round to 1 decimal place (e.g., 1187000 -> 1.2M)
      return `${Math.round(estimatedEarnings / 100000) / 10}M`;
    }
    if (estimatedEarnings >= 10000) {
      // For 10K and above: round to nearest K (e.g., 15345 -> 15K)
      return `${Math.round(estimatedEarnings / 1000)}K`;
    }
    if (estimatedEarnings >= 1000) {
      // For 1K to 9.9K: round to 1 decimal place (e.g., 1187 -> 1.2K)
      return `${Math.round(estimatedEarnings / 100) / 10}K`;
    }
    if (estimatedEarnings >= 100) {
      // For 100 to 999: round to 2 significant digits (e.g., 907 -> 910, 533 -> 530)
      return Math.round(estimatedEarnings / 10) * 10;
    }
    return estimatedEarnings.toString();
  }, [estimatedEarnings]);

  const handleAdFormatChange = (event: React.ChangeEvent<{ value: string }>) => {
    const newFormat = event.target.value;
    setSelectedAdFormat(newFormat);

    // Update default daily ad views when format changes
    const formatData = apiData.dailyEstimatedEarningsByFormat?.[newFormat];
    if (formatData?.defaultAdsViewPerEdau) {
      setDailyAdViews(formatData.defaultAdsViewPerEdau);
    }
  };

  const handleSliderChange = (_event: Event, value: number | number[]) => {
    setDailyAdViews(Array.isArray(value) ? value[0] : value);
  };

  return {
    selectedAdFormat,
    setSelectedAdFormat,
    dailyAdViews,
    setDailyAdViews,
    adFormats,
    estimatedEarnings,
    formattedEarnings,
    handleAdFormatChange,
    handleSliderChange,
  };
};

export default useEstimatedEarnings;
