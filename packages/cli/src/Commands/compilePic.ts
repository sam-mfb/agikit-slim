import { readPictureJSON, buildPicture, PictureJSON } from '@agikit-slim/core';
import * as fs from 'fs';
import * as path from 'path';

export function compilePic(
  picPath: string,
  outputPath?: string,
  compressColors: boolean = false,
): void {
  console.log(`Compiling ${picPath}...`);

  // Read the JSON picture file
  const jsonData = fs.readFileSync(picPath, 'utf-8');
  const pictureJSON: PictureJSON = JSON.parse(jsonData);

  // Convert JSON to Picture object
  const picture = readPictureJSON(pictureJSON);

  // Build the binary picture
  const builtData = buildPicture(picture, compressColors);

  // Determine output path
  const finalOutputPath = outputPath || picPath.replace(/\.agipic$/i, '.agp');

  fs.writeFileSync(finalOutputPath, builtData);

  console.log(`Compiled pic to: ${finalOutputPath}`);
  console.log(`  Size: ${builtData.length} bytes`);
  console.log(`  Commands: ${picture.commands.length}`);
  console.log(`  Compress colors: ${compressColors}`);
}
