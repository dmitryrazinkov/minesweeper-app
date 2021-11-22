import TypedFastBitSet from 'typedfastbitset';

declare class TypedFastBitSetExt extends TypedFastBitSet {
  words: Uint32Array;
  static fromWords: (array: Uint32Array) => TypedFastBitSet;
}
