import type { FC } from 'react';
import { useMemo } from 'react';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type { ValidConditionRule } from '../api/validTypes';
import { getRpnTokenChipSegments } from '../utils/getRpnTokenChipSegments';
import RpnTokenChipSegmentRow from './RpnTokenChipSegmentRow';

type RpnTokenChipsProps = {
  tokens: ValidConditionRule['tokens'];
};

const RpnTokenChips: FC<RpnTokenChipsProps> = ({ tokens }) => {
  const translationDependencies = useRAQIV2TranslationDependencies();

  const segments = useMemo(
    () => getRpnTokenChipSegments(tokens, translationDependencies),
    [tokens, translationDependencies],
  );

  if (segments.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        alignItems: 'center',
        overflow: 'hidden',
      }}>
      <RpnTokenChipSegmentRow segments={segments} />
    </div>
  );
};

export default RpnTokenChips;
