import { describe, it, expect } from 'vitest';
import { buildPicture } from '../Build/BuildPicture';
import { readPictureResource } from '../Extract/Picture/ReadPicture';
import { readPictureJSON, buildPictureJSON, PictureJSON } from '../Extract/Picture/PictureJSON';
import { PIC1_JSON, PIC2_JSON } from './fixtures/pictureTestData';

describe('Picture Round-Trip Integration Tests', () => {
  describe('Simple picture (Pic1)', () => {
    it('should round-trip JSON -> Binary -> JSON', () => {
      // Convert JSON to Picture object
      const picture = readPictureJSON(PIC1_JSON);

      expect(picture.commands.length).toBe(2);
      expect(picture.commands[0].type).toBe('SetPictureColor');
      expect(picture.commands[1].type).toBe('Fill');

      // Build binary
      const binary = buildPicture(picture, false);
      expect(binary.length).toBeGreaterThan(0);

      // Read binary back to Picture
      const readBack = readPictureResource(binary, false);
      expect(readBack.commands.length).toBe(picture.commands.length);

      // Convert back to JSON
      const finalJSON = buildPictureJSON(readBack);
      expect(finalJSON.commands.length).toBe(PIC1_JSON.commands.length);

      // Verify command types match
      for (let i = 0; i < PIC1_JSON.commands.length; i++) {
        expect(finalJSON.commands[i].type).toBe(PIC1_JSON.commands[i].type);
      }
    });

    it('should produce valid binary format', () => {
      const picture = readPictureJSON(PIC1_JSON);
      const binary = buildPicture(picture, false);

      // AGI picture format ends with 0xFF
      expect(binary[binary.length - 1]).toBe(0xff);
    });
  });

  describe('Complex picture (Pic2)', () => {
    it('should round-trip JSON -> Binary -> JSON preserving all commands', () => {
      const originalCommandCount = PIC2_JSON.commands.length;

      // Convert JSON to Picture object
      const picture = readPictureJSON(PIC2_JSON);
      expect(picture.commands.length).toBe(originalCommandCount);

      // Build binary
      const binary = buildPicture(picture, false);
      expect(binary.length).toBeGreaterThan(0);

      // Read binary back
      const readBack = readPictureResource(binary, false);
      expect(readBack.commands.length).toBe(originalCommandCount);

      // Convert back to JSON
      const finalJSON = buildPictureJSON(readBack);
      expect(finalJSON.commands.length).toBe(originalCommandCount);
    });

    it('should preserve command data through round-trip', () => {
      const picture = readPictureJSON(PIC2_JSON);
      const binary = buildPicture(picture, false);
      const readBack = readPictureResource(binary, false);
      const finalJSON = buildPictureJSON(readBack);

      // Check each command matches
      for (let i = 0; i < PIC2_JSON.commands.length; i++) {
        const original = PIC2_JSON.commands[i];
        const final = finalJSON.commands[i];

        expect(final.type).toBe(original.type);

        // Check command-specific data
        if ('colorNumber' in original) {
          expect((final as typeof original).colorNumber).toBe(original.colorNumber);
        }
        if ('points' in original) {
          expect((final as typeof original).points).toEqual(original.points);
        }
        if ('startPositions' in original) {
          expect((final as typeof original).startPositions).toEqual(original.startPositions);
        }
      }
    });

    it('should handle multiple round-trips without data loss', () => {
      let json: PictureJSON = PIC2_JSON;
      const originalCommandCount = json.commands.length;

      // Perform 3 round-trips
      for (let i = 0; i < 3; i++) {
        const picture = readPictureJSON(json);
        const binary = buildPicture(picture, false);
        const readBack = readPictureResource(binary, false);
        json = buildPictureJSON(readBack);

        expect(json.commands.length).toBe(originalCommandCount);
      }
    });
  });

  describe('Color compression option', () => {
    it('should round-trip with color compression enabled', () => {
      const picture = readPictureJSON(PIC1_JSON);

      // Build with compression
      const binary = buildPicture(picture, true);
      expect(binary.length).toBeGreaterThan(0);

      // Read with compression
      const readBack = readPictureResource(binary, true);
      expect(readBack.commands.length).toBe(picture.commands.length);
    });

    it('should round-trip complex picture with color compression', () => {
      const picture = readPictureJSON(PIC2_JSON);

      // Build with compression
      const binary = buildPicture(picture, true);
      expect(binary.length).toBeGreaterThan(0);

      // Read with compression
      const readBack = readPictureResource(binary, true);
      expect(readBack.commands.length).toBe(picture.commands.length);

      // Verify JSON round-trip
      const finalJSON = buildPictureJSON(readBack);
      expect(finalJSON.commands.length).toBe(PIC2_JSON.commands.length);
    });
  });

  describe('Binary format validation', () => {
    it('should produce AGI-compliant binary ending with 0xFF', () => {
      const testCases = [PIC1_JSON, PIC2_JSON];

      for (const json of testCases) {
        const picture = readPictureJSON(json);
        const binary = buildPicture(picture, false);

        // AGI pictures end with 0xFF terminator
        expect(binary[binary.length - 1]).toBe(0xff);
      }
    });

    it('should produce deterministic output', () => {
      const picture = readPictureJSON(PIC2_JSON);

      const binary1 = buildPicture(picture, false);
      const binary2 = buildPicture(picture, false);

      expect(binary1.equals(binary2)).toBe(true);
    });
  });
});
