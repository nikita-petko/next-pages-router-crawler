export enum MaxDiffMatchAttributeType {
  ServerAttribute = 'ServerAttribute',
  AggregationType = 'AggregationType',
}

export enum EqualityMatchAttributeType {
  ConstantValue = 'ConstantValue',
  PlayerAttribute = 'PlayerAttribute',
}

export type MatchAttributeType = EqualityMatchAttributeType | MaxDiffMatchAttributeType;
