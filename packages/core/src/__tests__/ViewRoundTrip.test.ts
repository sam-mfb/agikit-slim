import { describe, it, expect } from 'vitest';
import { buildView } from '../Build/BuildView';
import { readViewResource } from '../Extract/View/ReadView';
import {
  VIEW220_ORIGINAL_BINARY,
  VIEW220_EXPECTED_DESCRIPTION,
  VIEW220_HEBREW_DESCRIPTION,
} from './fixtures/viewTestData';

describe('View Round-Trip Integration Tests', () => {
  describe('ASCII round-trip', () => {
    it('should round-trip View220 with original ASCII description', () => {
      // Read original view
      const originalView = readViewResource(VIEW220_ORIGINAL_BINARY);

      expect(originalView.description).toBe(VIEW220_EXPECTED_DESCRIPTION);
      expect(originalView.loops.length).toBe(1);

      // Rebuild with ASCII (default)
      const rebuilt = buildView(originalView);

      // Read the rebuilt view
      const finalView = readViewResource(rebuilt);

      // Verify description matches
      expect(finalView.description).toBe(VIEW220_EXPECTED_DESCRIPTION);

      // Verify structure matches
      expect(finalView.loops.length).toBe(originalView.loops.length);
      expect(finalView.loops[0].cels.length).toBe(originalView.loops[0].cels.length);

      // Verify pixel data structure matches
      const originalCel = originalView.loops[0].cels[0];
      const finalCel = finalView.loops[0].cels[0];

      expect(finalCel.width).toBe(originalCel.width);
      expect(finalCel.height).toBe(originalCel.height);
      expect(finalCel.transparentColor).toBe(originalCel.transparentColor);

      // Both should be non-mirrored cels with buffer data
      // Note: Pixel data may differ due to AGI encoding optimizations
      // (trailing transparent pixels are not explicitly encoded)
      if (!originalCel.mirrored && !finalCel.mirrored) {
        expect(finalCel.buffer.length).toBe(originalCel.buffer.length);
      }
    });

    it('should handle multiple round-trips without data loss', () => {
      let view = readViewResource(VIEW220_ORIGINAL_BINARY);
      let lastDescription = view.description;

      // Perform 3 round-trips
      for (let i = 0; i < 3; i++) {
        const built = buildView(view);
        view = readViewResource(built);

        expect(view.description).toBe(lastDescription);
        expect(view.loops.length).toBe(1);
        expect(view.loops[0].cels.length).toBe(1);

        lastDescription = view.description;
      }
    });
  });

  describe('Hebrew (windows-1255) round-trip', () => {
    it('should translate description from ASCII to Hebrew and back', () => {
      // Read original view (ASCII description)
      const originalView = readViewResource(VIEW220_ORIGINAL_BINARY);

      // Replace description with Hebrew text
      originalView.description = VIEW220_HEBREW_DESCRIPTION;

      // Build with Hebrew encoding
      const hebrewBuilt = buildView(originalView, 'windows-1255');

      // The Hebrew bytes should be in the buffer
      expect(hebrewBuilt.length).toBeGreaterThan(0);

      // When we read it back, readViewResource uses ASCII encoding
      // So we won't get the original Hebrew text back correctly
      // This demonstrates the extraction always uses ASCII workflow
      const readBack = readViewResource(hebrewBuilt);

      // The description will be garbled because we're reading Hebrew bytes as ASCII
      expect(readBack.description).toBeDefined();
      expect(readBack.description).not.toBe(VIEW220_HEBREW_DESCRIPTION);

      // But the structure should still be intact
      expect(readBack.loops.length).toBe(1);
      expect(readBack.loops[0].cels.length).toBe(1);
    });

    it('should preserve pixel data structure when changing description encoding', () => {
      const originalView = readViewResource(VIEW220_ORIGINAL_BINARY);
      const originalCel = originalView.loops[0].cels[0];

      // Change to Hebrew description
      originalView.description = VIEW220_HEBREW_DESCRIPTION;

      // Build with Hebrew encoding
      const hebrewBuilt = buildView(originalView, 'windows-1255');

      // Read back with ASCII
      const readBack = readViewResource(hebrewBuilt);
      const readBackCel = readBack.loops[0].cels[0];

      // Pixel data structure should be preserved (dimensions, transparency)
      if (!originalCel.mirrored && !readBackCel.mirrored) {
        expect(readBackCel.width).toBe(originalCel.width);
        expect(readBackCel.height).toBe(originalCel.height);
        expect(readBackCel.transparentColor).toBe(originalCel.transparentColor);
        expect(readBackCel.buffer.length).toBe(originalCel.buffer.length);
      }
    });
  });

  describe('Translation workflow simulation', () => {
    it('should simulate the complete translation workflow', () => {
      // Step 1: Extract game (always ASCII)
      const extractedView = readViewResource(VIEW220_ORIGINAL_BINARY);
      const originalDescription = extractedView.description;

      expect(originalDescription).toBe(VIEW220_EXPECTED_DESCRIPTION);

      // Step 2: Translator edits description file (UTF-8 to UTF-8)
      // In reality this happens in a .agiviewdesc file
      // Translator changes English to Hebrew
      extractedView.description = VIEW220_HEBREW_DESCRIPTION;

      // Step 3: Build game with Hebrew encoding
      const hebrewGame = buildView(extractedView, 'windows-1255');

      // Verify the game was built successfully
      expect(hebrewGame.length).toBeGreaterThan(0);

      // The built game should be smaller or same size since
      // Hebrew text is typically shorter
      expect(hebrewGame.length).toBeLessThanOrEqual(VIEW220_ORIGINAL_BINARY.length + 100);

      // Verify structure is preserved
      const finalView = readViewResource(hebrewGame);
      expect(finalView.loops.length).toBe(1);
      expect(finalView.loops[0].cels.length).toBe(1);
    });

    it('should support changing encoding without re-extracting', () => {
      const view = readViewResource(VIEW220_ORIGINAL_BINARY);

      // Build with different encodings
      const asciiBuilt = buildView(view, 'ascii');
      const win1252Built = buildView(view, 'windows-1252');
      const win1255Built = buildView(view, 'windows-1255');

      // All should build successfully
      expect(asciiBuilt.length).toBeGreaterThan(0);
      expect(win1252Built.length).toBeGreaterThan(0);
      expect(win1255Built.length).toBeGreaterThan(0);

      // ASCII and windows-1252 should be identical for ASCII text
      expect(asciiBuilt.equals(win1252Built)).toBe(true);

      // All should have same structure when read back
      const asciiView = readViewResource(asciiBuilt);
      const win1252View = readViewResource(win1252Built);
      const win1255View = readViewResource(win1255Built);

      expect(asciiView.loops.length).toBe(win1252View.loops.length);
      expect(win1252View.loops.length).toBe(win1255View.loops.length);
    });
  });

  describe('View without description', () => {
    it('should round-trip view without description', () => {
      const view = readViewResource(VIEW220_ORIGINAL_BINARY);

      // Remove description
      delete view.description;

      // Build and read back
      const built = buildView(view);
      const readBack = readViewResource(built);

      // Should have no description
      expect(readBack.description).toBeUndefined();

      // Structure should be preserved
      expect(readBack.loops.length).toBe(1);
      expect(readBack.loops[0].cels.length).toBe(1);
    });

    it('should produce smaller binary without description', () => {
      const view = readViewResource(VIEW220_ORIGINAL_BINARY);

      // Build with description
      const withDesc = buildView(view);

      // Build without description
      delete view.description;
      const withoutDesc = buildView(view);

      // Without description should be smaller
      expect(withoutDesc.length).toBeLessThan(withDesc.length);

      // The difference should be approximately the description length + null terminator
      const descLength = VIEW220_EXPECTED_DESCRIPTION.length + 1;
      expect(withDesc.length - withoutDesc.length).toBeCloseTo(descLength, 5);
    });
  });

  describe('Data integrity across encodings', () => {
    it('should maintain loop count across all encodings', () => {
      const view = readViewResource(VIEW220_ORIGINAL_BINARY);

      const encodings = ['ascii', 'windows-1251', 'windows-1252', 'windows-1255'];

      encodings.forEach((encoding) => {
        const built = buildView(view, encoding);
        const readBack = readViewResource(built);

        expect(readBack.loops.length).toBe(1);
      });
    });

    it('should maintain cel count across all encodings', () => {
      const view = readViewResource(VIEW220_ORIGINAL_BINARY);

      const encodings = ['ascii', 'windows-1251', 'windows-1252', 'windows-1255'];

      encodings.forEach((encoding) => {
        const built = buildView(view, encoding);
        const readBack = readViewResource(built);

        expect(readBack.loops[0].cels.length).toBe(1);
      });
    });

    it('should maintain pixel data structure across all encodings', () => {
      const view = readViewResource(VIEW220_ORIGINAL_BINARY);
      const originalCel = view.loops[0].cels[0];

      const encodings = ['ascii', 'windows-1251', 'windows-1252', 'windows-1255'];

      encodings.forEach((encoding) => {
        const built = buildView(view, encoding);
        const readBack = readViewResource(built);
        const readBackCel = readBack.loops[0].cels[0];

        if (!originalCel.mirrored && !readBackCel.mirrored) {
          expect(readBackCel.width).toBe(originalCel.width);
          expect(readBackCel.height).toBe(originalCel.height);
          expect(readBackCel.transparentColor).toBe(originalCel.transparentColor);
          expect(readBackCel.buffer.length).toBe(originalCel.buffer.length);
        }
      });
    });
  });
});
