/**
 * Represents the safety status of an experience based on playability restrictions and discovery settings.
 */
export enum ExperienceSafetyStatus {
  /**
   * Users can't play the game, even the owner can't play
   * Occurs when userPlayabilityRestrictions = 'RestrictedForAll'
   */
  Red = 'Red',

  /**
   * Users can't play the game, but owner can still play
   * Occurs when userPlayabilityRestrictions = 'RestrictedToOwner'
   */
  Orange = 'Orange',

  /**
   * Users can play the game, but can't find it
   * Occurs when discoveryBlocked = true
   */
  Yellow = 'Yellow',

  /**
   * No restrictions - game is fully accessible
   * Default state when no restrictions apply
   */
  Green = 'Green',
}

export default ExperienceSafetyStatus;
