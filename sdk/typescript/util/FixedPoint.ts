import BN from "bn.js";

/**
 * The FixedPoint class represents a fixed-point number designed to be 
 * compatible with the I80F48 type used in the Plasma AMM implementation.
 */
export class FixedPoint {
    /**
     * @param value A BN (Big Number) instance representing the fixed-point number.
     * The value is stored as an integer, where the lower 48 bits represent the fractional part.
     */
    constructor(public value: BN) {}

    // Number of bits used for the fractional part of the fixed-point number
    static FRACTIONAL_BITS = 48;

    // Representation of 1.0 in this fixed-point format
    static ONE = new BN(1).shln(FixedPoint.FRACTIONAL_BITS);

    /**
     * Creates a FixedPoint instance from a BN instance.
     * 
     * @param {BN} num - The BN instance to convert.
     * @returns {FixedPoint} The FixedPoint instance.
     */
    static fromBN(num: BN): FixedPoint {
        return new FixedPoint(num);
    }

    /**
     * Converts the fixed-point number to a JavaScript number.
     * 
     * In the Plasma SDK context, this is useful to display LP reward amounts, fee amounts, etc. to users.
     * 
     * @returns {number} The JavaScript number representation.
     * @throws {Error} If the number is too large to safely convert to a JavaScript number.
     */
    toNumber(): number {
        // Check if the number is too large to safely convert
        if (this.value.abs().gt(new BN(Number.MAX_SAFE_INTEGER).shln(48))) {
            throw new Error("Number is too large to safely convert to a JavaScript number");
        }

        // Extract the whole part of the number
        const wholePart = this.value.shrn(FixedPoint.FRACTIONAL_BITS);

        // Extract the fractional part of the number
        const fractionalPart = this.value.and(FixedPoint.ONE.subn(1));

        // Combine whole and fractional parts
        return wholePart.toNumber() + fractionalPart.toNumber() / 2**FixedPoint.FRACTIONAL_BITS;
    }
}