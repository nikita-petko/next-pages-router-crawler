import { useQuery, useMutation } from '@tanstack/react-query';
import type GenreType from '@modules/experience-genre/enums/GenreType';
import { getExperienceGenre, updateExperienceGenre } from './experienceGenreRequests';

export function useGetExperienceGenre(
  universeId?: number | null,
  genreTaxonomyVersion: number = 1,
  includeUpdateLockExpirationTime: boolean = true,
  includeCreatorSelectedGenre: boolean = true,
  includeNotifyGenreChange: boolean = true,
) {
  return useQuery({
    queryKey: [
      'experienceGenre',
      universeId,
      includeUpdateLockExpirationTime,
      genreTaxonomyVersion,
      includeUpdateLockExpirationTime,
      includeCreatorSelectedGenre,
      includeNotifyGenreChange,
    ],
    queryFn: async () => {
      const response = await getExperienceGenre(
        universeId!,
        genreTaxonomyVersion,
        includeUpdateLockExpirationTime,
        includeCreatorSelectedGenre,
        includeNotifyGenreChange,
      );
      return response;
    },
    enabled: !!universeId,
  });
}

type TUpdateExperienceGenreRequest = {
  universeId: number;
  genre: GenreType;
  experienceGenreTaxonomyVersion?: number;
  includeUpdateLockExpirationTime?: boolean;
};
export function useUpdateExperienceGenre() {
  return useMutation({
    mutationFn: async ({
      universeId,
      genre,
      experienceGenreTaxonomyVersion = 1,
      includeUpdateLockExpirationTime = true,
    }: TUpdateExperienceGenreRequest) => {
      return updateExperienceGenre(
        universeId,
        genre,
        experienceGenreTaxonomyVersion,
        includeUpdateLockExpirationTime,
      );
    },
  });
}
