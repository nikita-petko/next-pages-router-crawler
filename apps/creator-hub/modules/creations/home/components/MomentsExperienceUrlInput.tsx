import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useFlag } from '@rbx/flags';
import { Button, TextInput } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { isMomentsSitetestUrlParsingEnabled } from '@generated/flags/creatorCreations';
import gamesClient from '@modules/clients/games';
import type { TExperience } from '@modules/home/providers/ExperienceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  logMomentsCreationsError,
  MomentsCreationsErrorOperation,
} from '../logging/momentsCreationsErrorLogging';
import {
  logMomentsCreationsAttempt,
  logMomentsCreationsSuccess,
  MomentsCreationsOperation,
} from '../logging/momentsCreationsEventLogging';
import {
  getMomentsExperienceUrlRegexMatches,
  plainUniverseIdRegex,
  UrlIdType,
} from '../utils/momentsExperienceUrlPatterns';

type MomentsExperienceUrlInputProps = {
  onExperienceResolved: (experience: TExperience) => void;
  isDisabled?: boolean;
};

const MomentsExperienceUrlInput: FC<MomentsExperienceUrlInputProps> = ({
  onExperienceResolved,
  isDisabled = false,
}) => {
  const { translate } = useTranslation();
  const { ready: isSitetestUrlParsingFlagReady, value: isSitetestUrlParsingEnabled } = useFlag(
    isMomentsSitetestUrlParsingEnabled,
  );
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const regexMatches = useMemo(() => {
    const includeSitetestUrls =
      isSitetestUrlParsingFlagReady && (isSitetestUrlParsingEnabled ?? false);

    return getMomentsExperienceUrlRegexMatches(includeSitetestUrls);
  }, [isSitetestUrlParsingEnabled, isSitetestUrlParsingFlagReady]);

  const isValidInput = useMemo(
    () => url.trim().length > 0 && regexMatches.some(({ regex }) => regex.test(url.trim())),
    [regexMatches, url],
  );

  const resolveExperience = useCallback(async () => {
    const trimmed = url.trim();
    const match = regexMatches.find(({ regex }) => regex.test(trimmed));
    if (!match) {
      return;
    }

    const matchId =
      match.idType === UrlIdType.UniverseId && plainUniverseIdRegex.test(trimmed)
        ? Number(trimmed)
        : Number(match.regex.exec(trimmed)?.[1]);

    if (!matchId || !Number.isFinite(matchId)) {
      return;
    }

    const resolveContext = {
      inputValue: trimmed,
      idType: match.idType,
      matchedId: matchId,
    };

    setIsLoading(true);
    setErrorMessage(undefined);
    logMomentsCreationsAttempt(MomentsCreationsOperation.ResolveExperience, resolveContext);

    try {
      let universeId: number;

      if (match.idType === UrlIdType.PlaceId) {
        const placeDetails = await gamesClient.multigetPlaceDetails([matchId]);
        const resolved = placeDetails[0]?.universeId;
        if (!resolved) {
          logMomentsCreationsError(
            MomentsCreationsErrorOperation.ResolveExperience,
            'Experience not found',
            {
              ...resolveContext,
              placeId: matchId,
              reason: 'ExperienceNotFound',
            },
          );
          setErrorMessage(translate('Error.ExperienceNotFound'));
          setIsLoading(false);
          return;
        }
        universeId = resolved;
      } else {
        universeId = matchId;
      }

      const gameDetailsResponse = await gamesClient.getDetails([universeId]);
      const gameDetail = gameDetailsResponse.data?.[0];
      if (!gameDetail?.id) {
        logMomentsCreationsError(
          MomentsCreationsErrorOperation.ResolveExperience,
          'Experience not found',
          {
            ...resolveContext,
            experienceId: universeId,
            reason: 'ExperienceNotFound',
          },
        );
        setErrorMessage(translate('Error.ExperienceNotFound'));
        setIsLoading(false);
        return;
      }

      onExperienceResolved({
        id: gameDetail.id,
        name: gameDetail.name ?? undefined,
        description: gameDetail.description ?? undefined,
        rootPlaceId: gameDetail.rootPlaceId ?? undefined,
      });
      logMomentsCreationsSuccess(MomentsCreationsOperation.ResolveExperience, {
        ...resolveContext,
        experienceId: gameDetail.id,
        placeId: match.idType === UrlIdType.PlaceId ? matchId : undefined,
      });
      setUrl('');
    } catch (resolveError) {
      logMomentsCreationsError(MomentsCreationsErrorOperation.ResolveExperience, resolveError, {
        ...resolveContext,
        placeId: match.idType === UrlIdType.PlaceId ? matchId : undefined,
        experienceId: match.idType === UrlIdType.UniverseId ? matchId : undefined,
      });
      setErrorMessage(translate('Error.ExperienceNotFound'));
    } finally {
      setIsLoading(false);
    }
  }, [onExperienceResolved, regexMatches, translate, url]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && isValidInput) {
        void resolveExperience();
        event.preventDefault();
      }
    },
    [isValidInput, resolveExperience],
  );

  return (
    <div className='flex flex-row gap-x-medium items-end width-full'>
      <div className='grow-1 min-width-0'>
        <TextInput
          label={translate('CreateMomentModal.ExperienceInput.Label')}
          placeholder={translate('CreateMomentModal.ExperienceInput.Placeholder')}
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setErrorMessage(undefined);
          }}
          onKeyDown={handleKeyDown}
          hasError={errorMessage != null}
          error={errorMessage}
          isDisabled={isDisabled || isLoading}
          size='Medium'
        />
      </div>
      <Button
        variant='Emphasis'
        size='Medium'
        // Since the TextInput and this button share a flex row with `items-end`,
        // when an error renders below the input, the button needs compensating
        // bottom margin to stay aligned. This value depends on foundation-ui
        // sizing and may need to be updated if that changes.
        className={errorMessage ? 'margin-bottom-[22px]' : undefined}
        isDisabled={!isValidInput || isLoading}
        isLoading={isLoading}
        onClick={() => void resolveExperience()}>
        {translate('Action.Add')}
      </Button>
    </div>
  );
};

export default withTranslation(MomentsExperienceUrlInput, [
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
]);
