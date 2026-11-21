import { ArgDef } from "../analysis/ArgDef";

/**
 * Chooses an identifier name from candidate names that does not conflict with input argument names.
 *
 * @param inArgs Input argument definitions
 * @param candidateNames Candidate identifier names in priority order
 * @param maxSuffix Maximum suffix index to attempt when disambiguating
 * @returns Chosen name and whether a numbered suffix was generated
 */
export function getIdentifierNameAvoidingConflicts(
  inArgs: ArgDef[],
  candidateNames: string[],
  maxSuffix: number = 1000
): { name: string; generated: boolean } {
  const inArgNames = inArgs.map((argDef) => argDef.getName());
  for (const name of candidateNames) {
    if (!inArgNames.includes(name)) {
      return { name, generated: false };
    }
  }

  let i = 1;
  for (const candidateName of candidateNames) {
    while (i <= maxSuffix) {
      const name = `${candidateName}_${i}`;
      if (!inArgNames.includes(name)) {
        return { name, generated: true };
      }
      i++;
    }
  }

  return { name: "r_conflicted", generated: true };
} // fn: getIdentifierNameAvoidingConflicts

/**
 * Returns a file's bytes with `text` inserted at the start of a line, keeping
 * all other bytes as they are.
 *
 * Writing back the file's decoded source instead would replace bytes that
 * are not valid UTF-8: e.g., `é` in a Latin-1 file (the byte 0xE9) would
 * become `�`.
 *
 * @param bytes Contents of the file
 * @param offset Offset of the line's start in the file decoded as UTF-8
 * (e.g., in `AbstractProgram.src`)
 * @param text Text to insert
 * @returns The file's contents with `text` inserted
 */
export function insertIntoBytes(
  bytes: Buffer,
  offset: number,
  text: string
): Buffer {
  // Decoding keeps newlines as they are, so the line has as many newlines
  // before it in the bytes as in the decoded source
  const lineIndex = bytes.toString().slice(0, offset).split("\n").length - 1;
  let byteOffset = 0;
  for (let i = 0; i < lineIndex; i++) {
    byteOffset = bytes.indexOf("\n", byteOffset) + 1;
  }
  return Buffer.concat([
    bytes.subarray(0, byteOffset),
    Buffer.from(text),
    bytes.subarray(byteOffset),
  ]);
} // fn: insertIntoBytes
