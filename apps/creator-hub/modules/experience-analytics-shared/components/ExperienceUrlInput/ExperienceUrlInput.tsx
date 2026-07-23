import type { FC } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { Button, Grid, TextField } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import gamesClient from '@modules/clients/games';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import useExperienceUrlInputStyles from './ExperienceUrlInput.styles';
import {
  creatorDashboardUrlRegex,
  gamesUrlRegex,
  st1CreatorDashboardUrlRegex,
} from './ExperienceUrlRegex';

export class AddExperienceError extends Error {
  constructor(msg: string) {
    super(msg);
    // Set the prototype explicitly due to Typescript limitations.
    // See: https://stackoverflow.com/questions/31626231/custom-error-class-in-typescript
    Object.setPrototypeOf(this, AddExperienceError.prototype);
  }
}

type ExperienceUrlInputSpec = {
  addExperience: (experienceId: number) => Promise<void>;
};

const enum regexUrlIdType {
  ExperienceId = 'ExperienceId',
  PlaceId = 'PlaceId',
}
const regexMatches = [
  { regex: creatorDashboardUrlRegex, idType: regexUrlIdType.ExperienceId },
  { regex: gamesUrlRegex, idType: regexUrlIdType.PlaceId },
  ...(process.env.targetEnvironment === 'sitetest1'
    ? [{ regex: st1CreatorDashboardUrlRegex, idType: regexUrlIdType.ExperienceId }]
    : []),
];

const ExperienceUrlInput: FC<ExperienceUrlInputSpec> = ({ addExperience }) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const [url, setUrl] = React.useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {
    classes: { textField },
  } = useExperienceUrlInputStyles();

  const isValidUrl = useMemo(() => regexMatches.some((reg) => reg.regex.test(url)), [url]);
  const [warningText, setWarningText] = useState<string | null>(null);

  const onChangeUrl = useCallback((newUrl: string) => {
    setUrl(newUrl);
    setWarningText(null);
  }, []);

  const tryAddExperience = useCallback(
    async (experienceId: number) => {
      try {
        await addExperience(experienceId);
        setUrl('');
      } catch (e) {
        if (e instanceof AddExperienceError) {
          setWarningText(e.message);
        } else {
          throw e;
        }
      }
    },
    [addExperience],
  );

  const onChange = useCallback<NonNullable<React.ComponentProps<typeof TextField>['onChange']>>(
    (event) => onChangeUrl(event.target.value),
    [onChangeUrl],
  );

  const addUrl = useCallback(async () => {
    const match = regexMatches.find(({ regex }) => Number(regex.exec(url)?.[1]));
    if (!match) {
      return;
    }
    const matchId = Number(match?.regex.exec(url)?.[1]);
    if (matchId) {
      setIsLoading(true);
      switch (match.idType) {
        case regexUrlIdType.ExperienceId:
          await tryAddExperience(matchId);
          break;
        case regexUrlIdType.PlaceId:
          try {
            const details = await gamesClient.multigetPlaceDetails([matchId]);
            const universeId = details[0]?.universeId;
            if (universeId) {
              await tryAddExperience(universeId);
            } else {
              setWarningText(
                translate(
                  translationKey('Message.CouldNotFindExperience', TranslationNamespace.Analytics),
                ),
              );
            }
          } catch {
            setWarningText(
              translate(
                translationKey('Message.CouldNotFindExperience', TranslationNamespace.Analytics),
              ),
            );
          }
          break;
        default: {
          const exhaustiveCheck: never = match.idType;
          throw new Error(`Unhandled idType: ${exhaustiveCheck}`);
        }
      }
      setIsLoading(false);
    }
  }, [translate, tryAddExperience, url]);

  const catchEnter = useCallback<NonNullable<React.ComponentProps<typeof TextField>['onKeyDown']>>(
    (ev) => {
      if (ev.key === 'Enter') {
        addUrl();
        ev.preventDefault();
      }
    },
    [addUrl],
  );

  return (
    <Grid container direction='row' spacing={2}>
      <Grid item Medium={9} XSmall={12}>
        <TextField
          label={translate(
            translationKey('Label.EnterExperienceURL', TranslationNamespace.Analytics),
          )}
          id='experienceURL'
          className={textField}
          value={url}
          onChange={onChange}
          onKeyDown={catchEnter}
          error={warningText !== null}
          helperText={warningText}
          size='small'
          disabled={isLoading}
          data-testid='input'
        />
      </Grid>
      <Grid item Medium='auto' XSmall={12}>
        <Button
          variant='contained'
          color='primaryBrand'
          size='large'
          disabled={!isValidUrl}
          onClick={addUrl}
          loading={isLoading}
          data-testid='add-button'>
          {translate(translationKey('Label.Add', TranslationNamespace.Analytics))}
        </Button>
      </Grid>
    </Grid>
  );
};

export default ExperienceUrlInput;
