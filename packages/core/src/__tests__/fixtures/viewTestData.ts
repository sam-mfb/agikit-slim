import * as fs from 'fs';
import * as path from 'path';

/**
 * Test data for view compilation/decompilation tests
 *
 * View220 is a real AGI view with:
 * - 1 loop
 * - 1 cel in that loop
 * - A description: "This is an order form you removed from a magazine for a free Labion Terror Beast Mating Whistle. It's ready to be mailed."
 *
 * This view is useful for testing encoding because the description contains
 * standard ASCII text that can be encoded into various character sets.
 */

const fixturesDir = __dirname;

/**
 * Original compiled view file (707 bytes)
 */
export const VIEW220_ORIGINAL_BINARY = fs.readFileSync(path.join(fixturesDir, 'View220.agv'));

/**
 * Decompiled view binary (without description)
 */
export const VIEW220_BINARY = fs.readFileSync(path.join(fixturesDir, 'View220.agiview'));

/**
 * View description in UTF-8
 */
export const VIEW220_DESCRIPTION = fs.readFileSync(
  path.join(fixturesDir, 'View220.agiviewdesc'),
  'utf-8',
);

/**
 * Expected description text
 */
export const VIEW220_EXPECTED_DESCRIPTION =
  "This is an order form you removed from a magazine for a free Labion Terror Beast Mating Whistle. It's ready to be mailed.";

/**
 * Hebrew translation of the description for encoding tests
 * "זהו טופס הזמנה שהסרת ממגזין עבור משרוקית הזדווגות של חיית הטרור הלביון בחינם. הוא מוכן למשלוח."
 */
export const VIEW220_HEBREW_DESCRIPTION =
  'זהו טופס הזמנה שהסרת ממגזין עבור משרוקית הזדווגות של חיית הטרור הלביון בחינם. הוא מוכן למשלוח.';

/**
 * Expected byte sequence for Hebrew description when encoded with windows-1255
 * First few bytes for verification
 */
export const VIEW220_HEBREW_ENCODED_START = Buffer.from([0xe6, 0xe4, 0xe5]); // "זהו" in windows-1255
