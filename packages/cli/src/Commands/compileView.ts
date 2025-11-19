import { readViewResource, buildView } from '@agikit-slim/core';
import * as fs from 'fs';
import * as path from 'path';

export function compileView(
  viewPath: string,
  outputPath?: string,
  encoding: string = 'ascii',
): void {
  // Read the binary view file
  const viewData = fs.readFileSync(viewPath);
  const view = readViewResource(viewData);

  console.log(`Compiling ${viewPath}...`);

  // Check for a description file
  const baseDir = path.dirname(viewPath);
  const baseName = path.basename(viewPath, path.extname(viewPath));
  const descPath = path.join(baseDir, `${baseName}.agiviewdesc`);

  if (fs.existsSync(descPath)) {
    console.log(`  Found description file: ${descPath}`);

    // Read the UTF-8 description and store it
    view.description = fs.readFileSync(descPath, 'utf-8');
    console.log(`  Merging description with encoding: ${encoding}`);
  } else {
    console.log(`  No description file found`);
  }

  // Build the view with encoding
  const builtData = buildView(view, encoding);

  // Determine output path
  const finalOutputPath = outputPath || viewPath.replace(/\.agiview$/i, '.agv');

  fs.writeFileSync(finalOutputPath, builtData);

  console.log(`✓ Compiled view to: ${finalOutputPath}`);
  console.log(`  Size: ${builtData.length} bytes`);
  console.log(`  Loops: ${view.loops.length}`);
  console.log(`  Encoding: ${encoding}`);
}
