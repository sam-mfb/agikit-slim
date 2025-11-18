import { describe, it, expect } from 'vitest';
import { buildView } from '../Build/BuildView';
import { readViewResource } from '../Extract/View/ReadView';
import {
  VIEW220_BINARY,
  VIEW220_DESCRIPTION,
  VIEW220_EXPECTED_DESCRIPTION,
  VIEW220_HEBREW_DESCRIPTION,
  VIEW220_HEBREW_ENCODED_START,
} from './fixtures/viewTestData';

describe('buildView', () => {
  describe('ASCII encoding (default)', () => {
    it('should build a view with description using ASCII encoding', () => {
      const view = readViewResource(VIEW220_BINARY);
      view.description = VIEW220_EXPECTED_DESCRIPTION;

      const built = buildView(view);

      expect(built).toBeInstanceOf(Buffer);
      expect(built.length).toBeGreaterThan(0);

      // Verify the built view can be read back
      const readBack = readViewResource(built);
      expect(readBack.description).toBe(VIEW220_EXPECTED_DESCRIPTION);
      expect(readBack.loops.length).toBe(view.loops.length);
    });

    it('should build a view without description', () => {
      const view = readViewResource(VIEW220_BINARY);
      delete view.description;

      const built = buildView(view);

      expect(built).toBeInstanceOf(Buffer);
      expect(built.length).toBeGreaterThan(0);

      // Verify the built view has no description
      const readBack = readViewResource(built);
      expect(readBack.description).toBeUndefined();
      expect(readBack.loops.length).toBe(view.loops.length);
    });

    it('should use ASCII encoding by default', () => {
      const view = readViewResource(VIEW220_BINARY);
      view.description = 'Test ABC 123';

      const built = buildView(view);
      const readBack = readViewResource(built);

      expect(readBack.description).toBe('Test ABC 123');
    });
  });

  describe('Hebrew encoding (windows-1255)', () => {
    it('should build a view with Hebrew description using windows-1255 encoding', () => {
      const view = readViewResource(VIEW220_BINARY);
      view.description = VIEW220_HEBREW_DESCRIPTION;

      const built = buildView(view, 'windows-1255');

      expect(built).toBeInstanceOf(Buffer);
      expect(built.length).toBeGreaterThan(0);

      // Verify the Hebrew text was encoded properly
      // The description starts after the loop/cel data
      // We can check for the Hebrew byte sequence in the buffer
      const descriptionIndex = built.indexOf(VIEW220_HEBREW_ENCODED_START);
      expect(descriptionIndex).toBeGreaterThan(-1);
    });

    it('should encode Hebrew characters to correct byte values', () => {
      const view = readViewResource(VIEW220_BINARY);
      // Simple Hebrew text: "זהו"
      view.description = 'זהו';

      const built = buildView(view, 'windows-1255');

      // Find the description in the buffer
      // It should contain bytes 0xe6, 0xe4, 0xe5 followed by null terminator
      const descIndex = built.indexOf(VIEW220_HEBREW_ENCODED_START);
      expect(descIndex).toBeGreaterThan(-1);
      expect(built[descIndex]).toBe(0xe6); // ז
      expect(built[descIndex + 1]).toBe(0xe4); // ה
      expect(built[descIndex + 2]).toBe(0xe5); // ו
      expect(built[descIndex + 3]).toBe(0x00); // null terminator
    });
  });

  describe('Other encodings', () => {
    it('should support windows-1251 (Cyrillic) encoding', () => {
      const view = readViewResource(VIEW220_BINARY);
      // Russian text: "Привет"
      view.description = 'Привет';

      const built = buildView(view, 'windows-1251');

      expect(built).toBeInstanceOf(Buffer);
      expect(built.length).toBeGreaterThan(0);

      // Just verify it builds without error
      // We don't have the exact byte values for verification
    });

    it('should support windows-1252 (Western European) encoding', () => {
      const view = readViewResource(VIEW220_BINARY);
      // Text with accented characters
      view.description = 'Café résumé naïve';

      const built = buildView(view, 'windows-1252');

      expect(built).toBeInstanceOf(Buffer);
      expect(built.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty description', () => {
      const view = readViewResource(VIEW220_BINARY);
      view.description = '';

      const built = buildView(view);
      const readBack = readViewResource(built);

      // Empty string should be treated as no description (undefined when read back)
      expect(readBack.description).toBeUndefined();
    });

    it('should handle special characters in ASCII range', () => {
      const view = readViewResource(VIEW220_BINARY);
      view.description = 'Test!@#$%^&*()_+-=[]{}|;:\'",.<>?/';

      const built = buildView(view);
      const readBack = readViewResource(built);

      expect(readBack.description).toBe('Test!@#$%^&*()_+-=[]{}|;:\'",.<>?/');
    });

    it('should preserve loop and cel structure', () => {
      const view = readViewResource(VIEW220_BINARY);
      const originalLoops = view.loops.length;
      const originalCels = view.loops[0].cels.length;

      view.description = 'Modified description';
      const built = buildView(view);
      const readBack = readViewResource(built);

      expect(readBack.loops.length).toBe(originalLoops);
      expect(readBack.loops[0].cels.length).toBe(originalCels);
    });
  });
});
