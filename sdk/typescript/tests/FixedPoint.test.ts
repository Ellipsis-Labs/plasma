import BN from 'bn.js';
import {FixedPoint} from '../util/FixedPoint';
import assert from 'assert';

describe('FixedPoint', () => {
  it('should correctly convert small integers', () => {
    const fp = FixedPoint.fromBN(new BN(5).shln(48));
    assert.strictEqual(fp.toNumber(), 5);
  });

  it('should correctly convert large integers', () => {
    const fp = FixedPoint.fromBN(new BN(1000000).shln(48));
    assert.strictEqual(fp.toNumber(), 1000000);
  });

  it('should correctly convert small fractions', () => {
    const fp = FixedPoint.fromBN(new BN(5).shln(46)); // 5/4 = 1.25
    assert.strictEqual(fp.toNumber(), 1.25);
  });

  it('should correctly convert large fractions', () => {
    // 123456789.012345
    const fp = FixedPoint.fromBN(new BN('123456789012345').mul(new BN(2).pow(new BN(48))).div(new BN(1000000)));
    assert.strictEqual(fp.toNumber(), 123456789.012345);
});

  it('should handle numbers very close to zero', () => {
    const fp = FixedPoint.fromBN(new BN(1)); // Smallest positive value
    assert(fp.toNumber() > 0 && fp.toNumber() < 1e-14);
  });

  it('should handle the maximum safe integer', () => {
    const fp = FixedPoint.fromBN(new BN(Number.MAX_SAFE_INTEGER).shln(48));
    assert.strictEqual(fp.toNumber(), Number.MAX_SAFE_INTEGER);
  });

  it('should handle numbers larger than MAX_SAFE_INTEGER', () => {
    const fp = FixedPoint.fromBN(new BN('9007199254740993').shln(48)); // 2^53 + 1
    assert(fp.value.abs().gt(new BN(Number.MAX_SAFE_INTEGER)));
  });
});