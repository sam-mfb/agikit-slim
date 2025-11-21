import { readPictureResource, buildPictureJSON } from '@agikit-slim/core';
import * as fs from 'fs';
import * as path from 'path';

export function decompilePic(
  picPath: string,
  outputPath?: string,
  compressColors: boolean = false,
): void {
  // Read the binary picture file
  const picData = fs.readFileSync(picPath);

  console.log(`Decompiling ${picPath}...`);
  console.log(`File size: ${picData.length} bytes\n`);

  // Decode binary to Picture object
  const picture = readPictureResource(picData, compressColors);

  // Convert to JSON format
  const pictureJSON = buildPictureJSON(picture);

  // Determine output path
  const baseDir = path.dirname(picPath);
  const baseName = path.basename(picPath, path.extname(picPath));
  const finalOutputPath = outputPath || path.join(baseDir, `${baseName}.agipic`);

  // Write JSON file
  fs.writeFileSync(finalOutputPath, JSON.stringify(pictureJSON, null, 2));

  console.log(`Decompiled pic to: ${finalOutputPath}`);
  console.log(`  Commands: ${picture.commands.length}`);
  console.log(`  Compress colors: ${compressColors}`);
}
