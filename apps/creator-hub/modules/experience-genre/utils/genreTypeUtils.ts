import GenreType from '../enums/GenreType';

// The current logic is that if a user selects a genre, but not a subgenre
// despite subgenres existing for the selected genre, send other_{genre} to the
// backend. This function should return the inputted genre if there doesn't
// exist a GenreType called other_{genre}. This function exists in case we ever
// want to return something different in the situation described above.
export function getPlaceholderEnum(genre: string) {
  const placeholder = `other_${genre}`;
  if (Object.values(GenreType).includes(placeholder as GenreType)) {
    return placeholder as GenreType;
  }
  return genre as GenreType;
}

export function isPlaceholderEnum(genre: string) {
  return genre.startsWith('other_');
}

// Based on implementation of getPlaceholderEnum, the genre should be everything
// after "other_"
export function getPlaceholderGenre(genre: string) {
  return genre.slice(6);
}

// This function takes a GenreType enum as input and resolves what the genre and
// subgenre should be for the genre selectors. Some special edge cases:
// - If the enum is NA, genre and subgenre should both be empty.
// - If the enum is a top-level genre and has no subgenres, subgenre should be empty.
// - If the enum is a placeholder (other_{genre}), genre should be {genre} and
//   subgenre should be empty.
export function getGenreAndSubgenre(
  genreEnum: GenreType,
  genreToSubgenre: { [key: string]: string[] },
  subgenreToGenre: { [key: string]: string },
): { genre: string; subgenre: string } {
  let genre = '';
  let subgenre = '';
  if (genreEnum in subgenreToGenre) {
    genre = subgenreToGenre[genreEnum];
    subgenre = genreEnum;
  } else if (genreEnum in genreToSubgenre) {
    genre = genreEnum;
  } else if (isPlaceholderEnum(genreEnum)) {
    genre = getPlaceholderGenre(genreEnum);
  }
  return {
    genre,
    subgenre,
  };
}

// This function takes values of GenreType as input and determines a single
// GenreType enum to return. This is used for deciding which enum to send to the
// genre backend based on the selector values. Some special edge cases:
// - If genre and subgenre are empty, return NA
// - If the subgenre is empty, but the genre has existing subgenres, return
//   other_{genre}
export function getGenreType(
  genre: string,
  subgenre: string,
  genreToSubgenre: { [key: string]: string[] },
): GenreType {
  if (genre === '' && subgenre === '') {
    return GenreType.NA;
  }
  if (subgenre === '' && genreToSubgenre[genre].length > 0) {
    return getPlaceholderEnum(genre);
  }
  if (subgenre === '' && genreToSubgenre[genre].length === 0) {
    return genre as GenreType;
  }
  return subgenre as GenreType;
}
