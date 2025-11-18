import { readViewResource } from '@agikit-slim/core';
import * as fs from 'fs';
import * as path from 'path';

export function decompileView(viewPath: string, outputDir?: string): void {
  // Read the binary view file
  const viewData = fs.readFileSync(viewPath);

  console.log(`Decompiling ${viewPath}...`);
  console.log(`File size: ${viewData.length} bytes\n`);

  // Decode it to check for description
  const agiView = readViewResource(viewData);

  // Determine output directory and base name
  const baseDir = outputDir || path.dirname(viewPath);
  const baseName = path.basename(viewPath, path.extname(viewPath));

  // Write the binary view file
  const viewOutputPath = path.join(baseDir, `${baseName}.agiview`);
  fs.writeFileSync(viewOutputPath, viewData);
  console.log(`✓ Wrote binary view to: ${viewOutputPath}`);

  // Write description if present
  if (agiView.description) {
    const descOutputPath = path.join(baseDir, `${baseName}.agiviewdesc`);
    fs.writeFileSync(descOutputPath, Buffer.from(agiView.description, 'utf-8'));
    console.log(`✓ Wrote description to: ${descOutputPath}`);
    console.log(`  Description: "${agiView.description}"`);
  } else {
    console.log('  No description found in view');
  }

  // Display summary
  console.log('\nView Summary:');
  console.log(`  Loops: ${agiView.loops.length}`);
  agiView.loops.forEach((loop) => {
    console.log(`    Loop ${loop.loopNumber}: ${loop.cels.length} cel(s)`);
  });
}
