import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import type { Speaker, WorkshopSession } from '../constants/inspireConstants';
import {
  CAFE_ONLY_SPEAKER_IDS,
  inspireSpeakerEntries,
  orderFeaturedSpeakersByWorkshops,
  workshopSessions,
} from '../constants/inspireConstants';
import {
  localizeInspireSpeakerCopy,
  localizeInspireWorkshopCopy,
} from '../constants/inspirePendingTranslations';

function resolveLocalizedString(value: string, fallback: string): string {
  if (value.length === 0) {
    return fallback;
  }
  return value;
}

function localizeWorkshopSession(
  session: WorkshopSession,
  tPendingTranslation: ReturnType<typeof useTranslationWrapper>['tPendingTranslation'],
): WorkshopSession {
  const localize = localizeInspireWorkshopCopy[session.id];
  if (!localize) {
    return session;
  }

  const localized = localize(tPendingTranslation);

  return {
    ...session,
    title: resolveLocalizedString(localized.title, session.title),
    topic: resolveLocalizedString(localized.topic, session.topic),
    dateLabel: resolveLocalizedString(localized.dateLabel, session.dateLabel),
    time: resolveLocalizedString(localized.time, session.time),
    language: resolveLocalizedString(localized.language, session.language),
  };
}

function localizeSpeaker(
  speaker: Speaker,
  tPendingTranslation: ReturnType<typeof useTranslationWrapper>['tPendingTranslation'],
): Speaker {
  const localize = localizeInspireSpeakerCopy[speaker.id];
  if (!localize) {
    return speaker;
  }

  const localized = localize(tPendingTranslation);
  return {
    ...speaker,
    title:
      localized.title !== undefined
        ? resolveLocalizedString(localized.title, speaker.title)
        : speaker.title,
    bio:
      localized.bio !== undefined
        ? resolveLocalizedString(localized.bio, speaker.bio)
        : speaker.bio,
    talks: localized.talks?.length ? localized.talks : speaker.talks,
  };
}

export function useLocalizedWorkshopSessions(): WorkshopSession[] {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  return useMemo(
    () => workshopSessions.map((session) => localizeWorkshopSession(session, tPendingTranslation)),
    [tPendingTranslation],
  );
}

export function useLocalizedFeaturedSpeakers(): Speaker[] {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const localizedWorkshopSessions = useLocalizedWorkshopSessions();

  return useMemo(() => {
    const localizedSpeakers = inspireSpeakerEntries.map((speaker) =>
      localizeSpeaker(speaker, tPendingTranslation),
    );

    return orderFeaturedSpeakersByWorkshops(
      localizedSpeakers,
      localizedWorkshopSessions,
      CAFE_ONLY_SPEAKER_IDS,
    );
  }, [localizedWorkshopSessions, tPendingTranslation]);
}
