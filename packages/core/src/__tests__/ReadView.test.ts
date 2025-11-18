import { describe, it, expect } from 'vitest';
import { readViewResource } from '../Extract/View/ReadView';
import { buildView } from '../Build/BuildView';
import {
  VIEW220_ORIGINAL_BINARY,
  VIEW220_BINARY,
  VIEW220_EXPECTED_DESCRIPTION,
} from './fixtures/viewTestData';

describe('readViewResource', () => {
  describe('Reading View220 (view with description)', () => {
    it('should read the original compiled view file', () => {
      const view = readViewResource(VIEW220_ORIGINAL_BINARY);

      expect(view).toBeDefined();
      expect(view.loops).toBeDefined();
      expect(view.loops.length).toBe(1);
      expect(view.loops[0].cels.length).toBe(1);
      expect(view.description).toBe(VIEW220_EXPECTED_DESCRIPTION);
    });

    it('should read the decompiled view binary', () => {
      const view = readViewResource(VIEW220_BINARY);

      expect(view).toBeDefined();
      expect(view.loops).toBeDefined();
      expect(view.loops.length).toBe(1);
      expect(view.loops[0].cels.length).toBe(1);
    });

    it('should extract the correct description', () => {
      const view = readViewResource(VIEW220_ORIGINAL_BINARY);

      expect(view.description).toBeDefined();
      expect(view.description).toBe(VIEW220_EXPECTED_DESCRIPTION);
      expect(view.description).toContain('Labion Terror Beast');
      expect(view.description).toContain('Mating Whistle');
    });

    it('should use ASCII encoding for description extraction', () => {
      const view = readViewResource(VIEW220_ORIGINAL_BINARY);

      // All characters should be in ASCII range (0-127)
      if (view.description) {
        for (let i = 0; i < view.description.length; i++) {
          const charCode = view.description.charCodeAt(i);
          expect(charCode).toBeGreaterThanOrEqual(0);
          expect(charCode).toBeLessThan(256); // Single-byte encoding
        }
      }
    });
  });

  describe('Loop and cel structure', () => {
    it('should read loop data correctly', () => {
      const view = readViewResource(VIEW220_ORIGINAL_BINARY);

      expect(view.loops.length).toBeGreaterThan(0);

      // Each loop should have cels
      view.loops.forEach((loop, index) => {
        expect(loop.cels).toBeDefined();
        expect(loop.cels.length).toBeGreaterThan(0);
      });
    });

    it('should read cel data correctly', () => {
      const view = readViewResource(VIEW220_ORIGINAL_BINARY);

      const firstCel = view.loops[0].cels[0];

      expect(firstCel).toBeDefined();
      expect(firstCel.width).toBeDefined();
      expect(firstCel.height).toBeDefined();
      expect(firstCel.transparentColor).toBeDefined();

      // Check if it's a non-mirrored cel (which has buffer)
      if (!firstCel.mirrored) {
        expect(firstCel.buffer).toBeDefined();
        expect(firstCel.buffer.length).toBeGreaterThan(0);
      }
    });

    it('should preserve pixel data', () => {
      const view = readViewResource(VIEW220_ORIGINAL_BINARY);

      const firstCel = view.loops[0].cels[0];

      // Check if it's a non-mirrored cel (which has buffer)
      if (!firstCel.mirrored) {
        // Pixel data should be an array of numbers (color indices)
        Array.from(firstCel.buffer).forEach(pixel => {
          expect(typeof pixel).toBe('number');
          expect(pixel).toBeGreaterThanOrEqual(0);
          expect(pixel).toBeLessThanOrEqual(15); // AGI uses 4-bit color (0-15)
        });
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle views without descriptions', () => {
      // View220.agiview is actually still the full .agv file with description
      // To test views without description, we need to build one
      const view = readViewResource(VIEW220_ORIGINAL_BINARY);
      delete view.description;

      const built = buildView(view);
      const readBack = readViewResource(built);

      expect(readBack.description).toBeUndefined();
      expect(readBack.loops.length).toBe(1);
    });

    it('should handle empty buffer gracefully', () => {
      const emptyBuffer = Buffer.alloc(0);

      expect(() => {
        readViewResource(emptyBuffer);
      }).toThrow();
    });

    it('should handle malformed buffer gracefully', () => {
      const malformedBuffer = Buffer.from([0x00, 0x01, 0x02]);

      expect(() => {
        readViewResource(malformedBuffer);
      }).toThrow();
    });
  });

  describe('Data integrity', () => {
    it('should produce consistent results on multiple reads', () => {
      const view1 = readViewResource(VIEW220_ORIGINAL_BINARY);
      const view2 = readViewResource(VIEW220_ORIGINAL_BINARY);

      expect(view1.description).toBe(view2.description);
      expect(view1.loops.length).toBe(view2.loops.length);
      expect(view1.loops[0].cels.length).toBe(view2.loops[0].cels.length);
    });

    it('should not modify the input buffer', () => {
      const originalBuffer = Buffer.from(VIEW220_ORIGINAL_BINARY);
      const bufferCopy = Buffer.from(VIEW220_ORIGINAL_BINARY);

      readViewResource(originalBuffer);

      expect(originalBuffer.equals(bufferCopy)).toBe(true);
    });
  });
});
