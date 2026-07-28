import type { FormattedText } from '@modules/analytics-translations/types';

export enum SearchType {
  Text = 'text',
  Image = 'image',
}

export enum SearchSource {
  Experience = 'Experience',
  Development = 'Development',
  Avatar = 'Avatar',
}

export enum FilterGroups {
  Experience = 'Experience',
  Development = 'Development',
  Avatar = 'Avatar',
  Clothing = 'Clothing',
  Characters = 'Characters',
  Accessories = 'Accessories',
  BodyParts = 'BodyParts',
  AvatarAnimations = 'AvatarAnimations',
}

export enum FilterCategories {
  avatar_all = 'avatar_all',
  avatar_characters = 'avatar_characters',
  avatar_clothing = 'avatar_clothing',
  avatar_t_shirt_accessories = 'avatar_t_shirt_accessories',
  avatar_shirt_accessories = 'avatar_shirt_accessories',
  avatar_sweater_accessories = 'avatar_sweater_accessories',
  avatar_jacket_accessories = 'avatar_jacket_accessories',
  avatar_pants_accessories = 'avatar_pants_accessories',
  avatar_shorts_accessories = 'avatar_shorts_accessories',
  avatar_dress_skirt_accessories = 'avatar_dress_skirt_accessories',
  avatar_shoes_bundle = 'avatar_shoes_bundle',
  avatar_classic_shirts = 'avatar_classic_shirts',
  avatar_classic_t_shirts = 'avatar_classic_t_shirts',
  avatar_classic_pants = 'avatar_classic_pants',
  avatar_accessories = 'avatar_accessories',
  avatar_head_accessories = 'avatar_head_accessories',
  avatar_face_accessories = 'avatar_face_accessories',
  avatar_neck_accessories = 'avatar_neck_accessories',
  avatar_shoulder_accessories = 'avatar_shoulder_accessories',
  avatar_front_accessories = 'avatar_front_accessories',
  avatar_back_accessories = 'avatar_back_accessories',
  avatar_waist_accessories = 'avatar_waist_accessories',
  avatar_gear = 'avatar_gear',
  avatar_body_parts = 'avatar_body_parts',
  avatar_dynamic_heads = 'avatar_dynamic_heads',
  avatar_hair_accessories = 'avatar_hair_accessories',
  avatar_heads = 'avatar_heads',
  avatar_faces = 'avatar_faces',
  avatar_animations = 'avatar_animations',
  avatar_animation_bundles = 'avatar_animation_bundles',
  avatar_emote_animations = 'avatar_emote_animations',
  creator_all = 'creator_all',
  creator_models = 'creator_models',
  creator_images = 'creator_images',
  creator_meshes = 'creator_meshes',
}

// TODO translate
export const ENUM_GROUPS = [
  {
    groupName: FilterGroups.Development as FormattedText,
    enumOptions: [
      FilterCategories.creator_models,
      FilterCategories.creator_images,
      FilterCategories.creator_meshes,
    ],
    SearchSources: [SearchSource.Development],
    SearchTypes: [SearchType.Text, SearchType.Image],
  },
  {
    groupName: FilterGroups.Characters as FormattedText,
    enumOptions: [FilterCategories.avatar_characters],
    SearchSources: [SearchSource.Avatar],
    SearchTypes: [SearchType.Text],
  },
  {
    groupName: FilterGroups.Clothing as FormattedText,
    enumOptions: [
      FilterCategories.avatar_clothing,
      FilterCategories.avatar_t_shirt_accessories,
      FilterCategories.avatar_sweater_accessories,
      FilterCategories.avatar_jacket_accessories,
      FilterCategories.avatar_pants_accessories,
      FilterCategories.avatar_shorts_accessories,
      FilterCategories.avatar_dress_skirt_accessories,
      FilterCategories.avatar_shoes_bundle,
      FilterCategories.avatar_classic_shirts,
      FilterCategories.avatar_classic_t_shirts,
      FilterCategories.avatar_classic_pants,
    ],
    SearchSources: [SearchSource.Avatar],
    SearchTypes: [SearchType.Text],
  },
  {
    groupName: FilterGroups.Accessories as FormattedText,
    enumOptions: [
      FilterCategories.avatar_accessories,
      FilterCategories.avatar_head_accessories,
      FilterCategories.avatar_face_accessories,
      FilterCategories.avatar_neck_accessories,
      FilterCategories.avatar_shoulder_accessories,
      FilterCategories.avatar_front_accessories,
      FilterCategories.avatar_back_accessories,
      FilterCategories.avatar_waist_accessories,
      FilterCategories.avatar_gear,
    ],
    SearchSources: [SearchSource.Avatar],
    SearchTypes: [SearchType.Text],
  },
  {
    groupName: FilterGroups.BodyParts as FormattedText,
    enumOptions: [
      FilterCategories.avatar_body_parts,
      FilterCategories.avatar_dynamic_heads,
      FilterCategories.avatar_hair_accessories,
      FilterCategories.avatar_heads,
      FilterCategories.avatar_faces,
    ],
    SearchSources: [SearchSource.Avatar],
    SearchTypes: [SearchType.Text],
  },
  {
    groupName: FilterGroups.AvatarAnimations as FormattedText,
    enumOptions: [
      FilterCategories.avatar_animations,
      FilterCategories.avatar_animation_bundles,
      FilterCategories.avatar_emote_animations,
    ],
    SearchSources: [SearchSource.Avatar],
    SearchTypes: [SearchType.Text],
  },
];

export function getCategoryTLKey(category: string) {
  switch (category) {
    case FilterGroups.Experience:
      return 'Heading.Experience';
    case FilterGroups.Development:
      return 'Heading.DevelopmentItems';
    case FilterGroups.Avatar:
      return 'Heading.AvatarItems';
    case FilterGroups.Clothing:
      return 'Label.Clothing';
    case FilterGroups.Characters:
      return 'Label.Characters';
    case FilterGroups.Accessories:
      return 'Label.Accessories';
    case FilterGroups.BodyParts:
      return 'Label.BodyParts';
    case FilterGroups.AvatarAnimations:
      return 'Label.Animations';
    case FilterCategories.avatar_all:
      return 'Label.AllAvatarItems';
    case FilterCategories.avatar_characters:
      return 'Label.AllCharacters';
    case FilterCategories.avatar_clothing:
      return 'Label.AllClothing';
    case FilterCategories.avatar_t_shirt_accessories:
      return 'Label.TShirts';
    case FilterCategories.avatar_shirt_accessories:
      return 'Label.Shirts';
    case FilterCategories.avatar_sweater_accessories:
      return 'Label.Sweaters';
    case FilterCategories.avatar_jacket_accessories:
      return 'Label.Jackets';
    case FilterCategories.avatar_pants_accessories:
      return 'Label.Pants';
    case FilterCategories.avatar_shorts_accessories:
      return 'Label.Shorts';
    case FilterCategories.avatar_dress_skirt_accessories:
      return 'Label.DressesAndSkirts';
    case FilterCategories.avatar_shoes_bundle:
      return 'Label.Shoes';
    case FilterCategories.avatar_classic_shirts:
      return 'Label.ClassicShirts';
    case FilterCategories.avatar_classic_t_shirts:
      return 'Label.ClassicTShirts';
    case FilterCategories.avatar_classic_pants:
      return 'Label.ClassicPants';
    case FilterCategories.avatar_accessories:
      return 'Label.AllAccessories';
    case FilterCategories.avatar_head_accessories:
      return 'Label.Head';
    case FilterCategories.avatar_face_accessories:
      return 'Label.Face';
    case FilterCategories.avatar_neck_accessories:
      return 'Label.Neck';
    case FilterCategories.avatar_shoulder_accessories:
      return 'Label.Shoulder';
    case FilterCategories.avatar_front_accessories:
      return 'Label.Front';
    case FilterCategories.avatar_back_accessories:
      return 'Label.BackAccessories';
    case FilterCategories.avatar_waist_accessories:
      return 'Label.Waist';
    case FilterCategories.avatar_gear:
      return 'Label.Gear';
    case FilterCategories.avatar_body_parts:
      return 'Label.BodyParts';
    case FilterCategories.avatar_dynamic_heads:
      return 'Label.DynamicHeads';
    case FilterCategories.avatar_hair_accessories:
      return 'Label.HairAccessories';
    case FilterCategories.avatar_heads:
      return 'Label.Heads';
    case FilterCategories.avatar_faces:
      return 'Label.Faces';
    case FilterCategories.avatar_animations:
      return 'Label.AllAnimations';
    case FilterCategories.avatar_animation_bundles:
      return 'Label.AnimationBundles';
    case FilterCategories.avatar_emote_animations:
      return 'Label.EmoteAnimations';
    case FilterCategories.creator_all:
      return 'Label.AllDevelopmentItems';
    case FilterCategories.creator_models:
      return 'Label.Models';
    case FilterCategories.creator_images:
      return 'Label.Images';
    case FilterCategories.creator_meshes:
      return 'Label.Meshes';
    default:
      return category;
  }
}

export function getSourceTLKey(category: SearchSource): string {
  switch (category) {
    case SearchSource.Experience:
      return 'Heading.Experience';
    case SearchSource.Development:
      return 'Heading.DevelopmentItems';
    case SearchSource.Avatar:
      return 'Heading.AvatarItems';
    default:
      return category;
  }
}
