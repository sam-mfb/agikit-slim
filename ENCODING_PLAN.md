# agikit Encoding Support - Implementation Guide

## Overview

This document provides instructions for adding configurable text encoding support to agikit. Currently, agikit hardcodes `'ascii'` encoding when compiling text (messages and object names), which prevents non-English AGI game translations from working correctly.

**Implementation Approach:** Encoding will be specified via CLI flag (`--encoding`) rather than in project.json to keep the configuration simpler and avoid changing the project file format.

**Important:** Node.js does not natively support Windows codepage encodings (windows-1255, windows-1251, etc.). This implementation requires the `iconv-lite` library for encoding support.

## Problem Statement

**Current Behavior:**

- All text is encoded as ASCII regardless of source encoding
- Characters with codepoints > 127 are corrupted
- Non-English translations (Hebrew, Russian, etc.) produce garbage in the compiled game

**Example:**

- Hebrew text "שלום" (Windows-1255: `e9 ec e5 ed`)
- Gets corrupted to ASCII: `69 6c 65 6d` (gibberish)

## Required Changes

### 0. Add iconv-lite Dependency

**File:** `packages/core/package.json`

Add iconv-lite to dependencies:

```json
{
  "dependencies": {
    "assert-never": "^1.2.1",
    "filesize": "^8.0.7",
    "iconv-lite": "^0.6.3",
    "lodash": "^4.17.21",
    "ts-is-present": "^1.2.2"
  },
  "devDependencies": {
    "@types/iconv-lite": "^0.0.1"
    // ... rest of devDependencies
  }
}
```

**Why iconv-lite?**

- Node.js `Buffer.from()` only supports: utf8, utf16le, latin1, base64, hex, ascii, binary, ucs2
- Windows codepages (windows-1255, windows-1251, etc.) are NOT supported natively
- iconv-lite provides comprehensive encoding support including all Windows codepages
- Already used by many Node.js projects for encoding conversion

### 1. Update Message Encoding

**File:** `packages/core/src/Scripting/WriteLogic.ts`

**Add import:**

```typescript
import * as iconv from 'iconv-lite';
```

**Current code (line ~15):**

```typescript
messageBuffers.push(Buffer.from(`${message}\0`, 'ascii'));
```

**Change to:**

```typescript
messageBuffers.push(iconv.encode(`${message}\0`, encoding));
```

**Function signature change:**

```typescript
// OLD
export function encodeMessages(messageArray: (string | undefined)[], encrypt: boolean): Buffer;

// NEW
export function encodeMessages(
  messageArray: (string | undefined)[],
  encrypt: boolean,
  encoding: string = 'ascii',
): Buffer;
```

**Note:** Type changed from `BufferEncoding` to `string` because iconv-lite supports many more encodings than Node.js built-in types.

### 2. Update Object List Encoding

**File:** `packages/core/src/Build/BuildObjectList.ts`

**Add import:**

```typescript
import * as iconv from 'iconv-lite';
```

**Current code (line ~8):**

```typescript
const objectNames = objectList.objects.map((object) => Buffer.from(`${object.name}\0`, 'ascii'));
```

**Change to:**

```typescript
const objectNames = objectList.objects.map((object) => iconv.encode(`${object.name}\0`, encoding));
```

**Function signature change:**

```typescript
// OLD
export function buildObjectList(objectList: ObjectList): Buffer;

// NEW
export function buildObjectList(objectList: ObjectList, encoding: string = 'ascii'): Buffer;
```

### 3. Thread Encoding Through Build Pipeline

**File:** `packages/core/src/Build/BuildLogic.ts`

Update `compileLogicScript` to accept and pass encoding:

```typescript
export function compileLogicScript(
  input: string,
  filePath: string,
  wordList: WordList,
  objectList: ObjectList,
  encrypt: boolean,
  encoding: string = 'ascii', // NEW parameter
): [Buffer, LogicDiagnostic[]] {
  // ... existing code ...

  // Pass encoding to encodeMessages
  const messageSection = encodeMessages(
    messageArray,
    encrypt,
    encoding, // NEW
  );

  // ... rest of function ...
}
```

### 4. Update ProjectBuilder to Accept Encoding

**File:** `packages/core/src/Build/ProjectBuilder.ts`

Add encoding parameter to constructor and store it:

```typescript
class ProjectBuilder {
  private encoding: string;

  constructor(
    project: Project,
    logger?: Logger,
    encoding: string = 'ascii'  // NEW parameter
  ) {
    this.project = project;
    this.logger = logger;
    this.encoding = encoding;  // NEW
  }

  // In buildLogic method:
  const [data, diagnostics] = compileLogicScript(
    input,
    scriptPath,
    wordList,
    objectList,
    encrypt,
    this.encoding  // Use stored encoding
  );

  // In buildProject method:
  const objectData = buildObjectList(
    objectList,
    this.encoding  // Use stored encoding
  );
}
```

### 5. Add CLI Support

Update `buildProject` function to accept encoding parameter:

**File:** `packages/cli/src/Commands/build.ts`

```typescript
export function buildProject(basePath: string, encoding?: string) {
  const project = new Project(basePath);
  const builder = new ProjectBuilder(project, new CLILogger(), encoding);
  builder.buildProject();
}
```

**File:** `packages/cli/src/cli.ts`

Add encoding flag parsing and pass to buildProject:

```typescript
const args = parseArgs(process.argv.slice(2), {
  boolean: 'd',
  string: 'encoding', // NEW: parse --encoding flag
});

const commandRunners: { [cmd: string]: (args: ParsedArgs) => void } = {
  build: (args: ParsedArgs) => {
    if (args._.length !== 2) {
      console.error(
        `Usage: ${process.argv[1]} ${process.argv[2]} projectdir [--encoding <encoding>]`,
      );
    } else {
      buildProject(args._[1], args.encoding);
    }
  },
  // ... rest of commands
};
```

## Supported Encodings

Using `iconv-lite`, the following encodings are supported (among many others):

**Recommended for AGI games (single-byte encodings):**

- `'ascii'` (default, backward compatible)
- `'windows-1255'` (Hebrew)
- `'windows-1251'` (Cyrillic/Russian)
- `'windows-1252'` (Western European)
- `'windows-1250'` (Central European)
- `'windows-1253'` (Greek)
- `'windows-1254'` (Turkish)
- `'windows-1256'` (Arabic)
- `'windows-1257'` (Baltic)
- `'windows-1258'` (Vietnamese)
- `'latin1'` / `'iso-8859-1'` (Western European)
- `'iso-8859-2'` through `'iso-8859-16'` (various regions)
- `'cp437'`, `'cp850'`, `'cp866'` (DOS codepages)

**Not recommended for AGI (multi-byte encodings):**

- `'utf8'` - Characters > 127 use multiple bytes; AGI interprets each byte separately

**Note:** AGI supports characters 0-255 (8-bit). Only single-byte encodings should be used. See [iconv-lite supported encodings](https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings) for complete list.

## Testing

### Test Cases

1. **Backward Compatibility:**
   - Build existing ASCII-only games without encoding specified
   - Verify output identical to current version

2. **Windows-1255 (Hebrew):**

   ```typescript
   import * as iconv from 'iconv-lite';

   // Test message encoding
   const message = 'שלום עולם'; // Hebrew: "Hello World"
   const encoded = iconv.encode(message, 'windows-1255');
   // Should produce: e9 ec e5 ed 20 e5 e5 ec ed
   ```

3. **Windows-1251 (Russian):**

   ```typescript
   import * as iconv from 'iconv-lite';

   const message = 'Привет мир'; // Russian: "Hello World"
   const encoded = iconv.encode(message, 'windows-1251');
   ```

### Integration Test

Create a minimal test project:

```
test-encoding/
├── project.json
├── src/
│   ├── logic/
│   │   └── 0.agilogic    (with Hebrew #message declarations)
│   ├── object.json       (with Hebrew object names)
│   └── words.txt
```

Build with encoding flag:

```bash
agikit build test-encoding --encoding windows-1255
```

Verify compiled OBJECT file contains correct Windows-1255 bytes.

### Test Files Created

**Unit Tests:** `/packages/core/src/Build/__tests__/BuildObjectList.test.ts`

- Tests ASCII backward compatibility
- Tests current buggy behavior with Hebrew text (documents the bug)
- Tests Windows-1255 encoding (will pass after implementation)
- Tests Windows-1251 encoding (Russian)

**Simple Test Script:** `/test-encoding.js`

- Demonstrates UTF-8 vs ASCII vs Windows-1255 encoding
- Shows byte-level differences
- Tests the example project's Hebrew object
- Can be run with: `node test-encoding.js`

**Example Output:**

```
=== Hebrew Encoding Test ===

Original text: אובייקט בדיקה

UTF-8 encoding:
  Length: 25 bytes
  Hex: d790d795d791d799d799d7a7d79820d791d793d799d7a7d794

ASCII encoding (CURRENT BUG):
  Length: 13 bytes
  Hex: d0d5d1d9d9e7d820d1d3d9e7d4
  ❌ Characters with codepoint > 127 are corrupted!

Windows-1255 encoding (EXPECTED - requires iconv-lite):
  Expected bytes: 0xE0 0xE5 0xE1 0xE9 0xE9 0xF7 0xE8 0x20 0xE1 0xE3 0xE9 0xF7 0xE4
  Length: 13 bytes (vs 25 bytes for UTF-8)
```

## Usage Guide

### For Existing ASCII Games

No changes needed. Build without the `--encoding` flag and encoding defaults to 'ascii' for backward compatibility.

```bash
agikit build /path/to/project
```

### For Non-English Translations

1. Ensure source files use UTF-8:
   - Logic files (\*.agilogic) saved as UTF-8
   - object.json saved as UTF-8

2. Build with the `--encoding` flag:

   ```bash
   agikit build /path/to/project --encoding windows-1255
   ```

3. agikit will convert UTF-8 source → target encoding during build

4. Test in ScummVM with appropriate encoding support

## Example PR Description

````markdown
## Add configurable text encoding support via CLI flag

### Problem

agikit currently hardcodes ASCII encoding for all text (messages and object
names), preventing non-English AGI game translations from working correctly.

### Solution

- Add optional `--encoding` CLI flag to `agikit build` command
- Use iconv-lite library for comprehensive encoding support
- Thread encoding parameter through build pipeline
- Default to 'ascii' for backward compatibility
- Support any iconv-lite encoding (windows-1255, windows-1251, iso-8859-\*, etc.)

### Dependencies

- Add `iconv-lite` to @agikit/core dependencies
- Add `@types/iconv-lite` to devDependencies

**Why iconv-lite?** Node.js Buffer.from() doesn't support Windows codepages
(windows-1255, windows-1251, etc.) natively. iconv-lite provides comprehensive
encoding support for all common single-byte encodings.

### Changes

- package.json: Add iconv-lite dependency
- WriteLogic: Use iconv.encode() in encodeMessages()
- BuildObjectList: Use iconv.encode() in buildObjectList()
- BuildLogic: Accept encoding parameter in compileLogicScript()
- ProjectBuilder: Accept encoding parameter in constructor
- CLI: Add --encoding flag to build command

### Backward Compatibility

Existing build commands without --encoding flag continue to use ASCII. No
breaking changes.

### Use Case

Enables AGI game translations to Hebrew (windows-1255), Russian
(windows-1251), Greek (windows-1253), and other non-English languages.

### Usage

```bash
# Default ASCII encoding (existing behavior)
agikit build /path/to/project

# Hebrew translation
agikit build /path/to/project --encoding windows-1255

# Russian translation
agikit build /path/to/project --encoding windows-1251

# Greek translation
agikit build /path/to/project --encoding windows-1253
```
````

### Testing

- All existing tests pass (ASCII behavior unchanged)
- Added BuildObjectList.test.ts with encoding tests
- Created test-encoding.js demonstrating the bug and expected behavior
- Verified with real Hebrew AGI translation project (example/)

```

## Additional Considerations

### Character Set Limitations

AGI supports characters 0-255 (8-bit). Multi-byte encodings (UTF-8) won't work
for characters > 127 since AGI interprets each byte separately. Use single-byte
encodings (windows-125x series) for extended characters.

### Source File Encoding

Recommend a workflow where:
1. Translators work in UTF-8 (widely supported in editors)
2. agikit converts UTF-8 → target encoding during build
3. Binary game files use target encoding (e.g., windows-1255)

### WORDS.TOK Limitation

The vocabulary file (WORDS.TOK) may have additional encoding restrictions in
the AGI interpreter. Test thoroughly with ScummVM or original interpreters.

## References

- AGI Specifications: http://agispecs.sierrahelp.com/
- Node.js Buffer Encodings: https://nodejs.org/api/buffer.html#buffers-and-character-encodings
- Windows-1255 (Hebrew): https://en.wikipedia.org/wiki/Windows-1255
- Windows-1251 (Cyrillic): https://en.wikipedia.org/wiki/Windows-1251

## Implementation Considerations

1. **Encoding scope:** Project-wide (via CLI flag) is simpler and matches typical use case

2. **Validation:** Could add warning if multi-byte encoding detected (AGI may not handle these correctly)

3. **Auto-detection:** Explicit configuration via CLI flag is clearer than auto-detection

---

**Document Version:** 3.0
**Last Updated:** 2025-11-15
**Author:** sq2heb translation project team

**Changelog:**
- v3.0: Added iconv-lite requirement (Node.js doesn't support Windows codepages natively)
- v2.0: Changed from project.json configuration to CLI flag approach
- v1.0: Initial version with project.json configuration
```
