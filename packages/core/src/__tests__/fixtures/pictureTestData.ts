import * as fs from 'fs';
import * as path from 'path';
import { PictureJSON } from '../../Extract/Picture/PictureJSON';

/**
 * Test data for picture compilation/decompilation tests
 *
 * These pictures are from the Hebrew translation project:
 * - Pic1: Simple picture with just fill command
 * - Pic2: Complex picture with many drawing commands
 */

const hebPicDir = path.resolve(__dirname, '../../../../examples/heb/src/pic');

/**
 * Simple picture JSON (1.agipic) - just a fill command
 */
export const PIC1_JSON: PictureJSON = JSON.parse(
  fs.readFileSync(path.join(hebPicDir, '1.agipic'), 'utf-8'),
);

/**
 * Complex picture JSON (2.agipic) - many drawing commands
 */
export const PIC2_JSON: PictureJSON = JSON.parse(
  fs.readFileSync(path.join(hebPicDir, '2.agipic'), 'utf-8'),
);
