/**
 * Bit-level packing helpers. Used by payload.ts to assemble the raw message
 * before ECC-expansion, and by encode.ts to stream bits across DCT blocks.
 */

export class BitWriter {
  private bits: number[] = [];

  writeBits(value: number, width: number): this {
    if (width < 0 || width > 32) {
      throw new Error(`BitWriter.writeBits: width ${width} out of range`);
    }
    for (let i = width - 1; i >= 0; i -= 1) {
      this.bits.push((value >> i) & 1);
    }
    return this;
  }

  get length(): number {
    return this.bits.length;
  }

  toArray(): Uint8Array {
    return Uint8Array.from(this.bits);
  }
}

export class BitReader {
  private idx = 0;

  constructor(private readonly bits: ArrayLike<number>) {}

  readBits(width: number): number {
    if (width < 0 || width > 32) {
      throw new Error(`BitReader.readBits: width ${width} out of range`);
    }
    let v = 0;
    for (let i = 0; i < width; i += 1) {
      if (this.idx >= this.bits.length) {
        throw new Error('BitReader.readBits: out of bits');
      }
      v = (v << 1) | (this.bits[this.idx] & 1);
      this.idx += 1;
    }
    return v;
  }

  remaining(): number {
    return this.bits.length - this.idx;
  }
}
