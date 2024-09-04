/* tslint:disable */
/* eslint-disable */
/**
*/
export class Pow {
  free(): void;
/**
* Initialize the PoW backend with a random secret.
*
* This or `init()` must be called before creating new `Pow` instances.
*
* You can call `init()` instead of `init_random()` to initialize with a chosen secret, which
* is necessary if multiple backends must be allowed to validate challenges.
*/
  static init_random(): void;
/**
* Initialize the PoW backend with a chosen secret.
*
* This or `init_random()` must be called before creating new `Pow` instances.
* @param {string} secret
*/
  static init(secret: string): void;
/**
* Create a new PoW challenge.
* @param {number} valid_seconds
* @param {number | undefined} [difficulty]
* @returns {string}
*/
  static build_challenge(valid_seconds: number, difficulty?: number): string;
/**
* Perform the work and generate a PoW
* @param {string} challenge
* @returns {string}
*/
  static work(challenge: string): string;
/**
* Validate a solved PoW
*
* It will return the challenge after successful validation, which could be used do implement
* re-use mechanisms or something like that.
* @param {string} pow
* @returns {string}
*/
  static validate(pow: string): string;
}
