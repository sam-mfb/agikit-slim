# Migration Plan: agikit → Rush.js/pnpm Monorepo (Compile/Decompile Only)

## Overview

This plan outlines the migration from a Yarn-based monorepo to a Rush.js/pnpm monorepo, while simultaneously slimming down the project to focus only on compilation and decompilation functionality. The final structure will contain only two packages: `core` and `cli`.

## Phase 1: Rush.js Setup & Repository Structure

### 1.1 Initialize Rush.js

- Install Rush globally: `npm install -g @microsoft/rush`
- Create `rush.json` in root with pnpm package manager configuration
- Create `common/config/rush/.pnpmfile.cjs` for pnpm hooks (if needed)
- Create `.npmrc` to configure pnpm settings
- Remove yarn-specific files: `.yarnrc.yml`, `.pnp.cjs`, `.pnp.loader.mjs`, `yarn.lock`, `.yarn/`

### 1.2 Target Directory Structure

```
agikit-slim/
├── rush.json                    # Rush configuration
├── .npmrc                       # pnpm configuration
├── common/
│   └── config/
│       └── rush/
│           ├── .pnpmfile.cjs   # pnpm customizations
│           └── pnpm-lock.yaml  # Lockfile
├── packages/
│   ├── core/                   # Slimmed @agikit/core
│   └── cli/                    # Slimmed @agikit/cli
├── .gitignore
├── README.md
└── tsconfig.json               # Shared TS config
```

## Phase 2: Core Package Slimming

### 2.1 Files to KEEP in `packages/core/src/`

```
Build/
  ├── BuildLogic.ts ✓
  ├── BuildObjectList.ts ✓
  ├── BuildPicture.ts ✓
  ├── BuildSound.ts ✓
  ├── BuildView.ts ✓
  ├── BuildWordsTok.ts ✓
  ├── ProjectBuilder.ts ✓
  └── WriteResources.ts ✓

Compression/
  ├── Bitstreams.ts ✓
  └── LZW.ts ✓

Extract/
  ├── DetectGame.ts ✓
  ├── GameExtractor.ts ✓
  ├── ReadObject.ts ✓
  ├── ReadResources.ts ✓
  ├── ReadWordsTok.ts ✓
  ├── Logic/
  │   ├── ASTOptimization.ts ✓
  │   ├── CodeGeneration.ts ✓
  │   ├── ControlFlowAnalysis.ts ✓
  │   ├── DominatorTree.ts ✓
  │   ├── LogicDecompile.ts ✓
  │   ├── LogicDisasm.ts ✓
  │   └── ReadLogic.ts ✓
  ├── Picture/
  │   ├── PictureJSON.ts ✓
  │   └── ReadPicture.ts ✓
  ├── Sound/
  │   └── ReadSound.ts ✓
  └── View/
      └── ReadView.ts ✓

Scripting/
  ├── generateParsers.ts ✓
  ├── LogicAssembler.ts ✓
  ├── LogicCompiler.ts ✓
  ├── LogicDiagnostics.ts ✓ (keep for error reporting)
  ├── LogicScriptASTGenerator.ts ✓
  ├── LogicScriptGenerator.ts ✓
  ├── LogicScriptIdentifierMapping.ts ✓
  ├── LogicScriptParser.generated.ts ✓
  ├── LogicScriptParser.ts ✓
  ├── LogicScriptParserTypes.ts ✓
  ├── LogicScript.pegjs ✓
  ├── LogicScriptPrimitiveTree.ts ✓
  ├── PropositionalLogic.ts ✓
  ├── WordListParser.generated.ts ✓
  ├── WordListParser.ts ✓
  ├── WordList.pegjs ✓
  └── WriteLogic.ts ✓

Types/
  ├── agiCommands.json ✓
  ├── AGICommands.ts ✓
  ├── AGIVersion.ts ✓
  ├── Logic.ts ✓
  ├── ObjectList.ts ✓
  ├── Picture.ts ✓
  ├── Resources.ts ✓
  ├── Sound.ts ✓
  ├── View.ts ✓
  └── WordList.ts ✓

Root files:
├── ColorPalettes.ts ✓
├── DataEncoding.ts ✓
├── Logger.ts ✓
├── Project.ts ✓
├── ProjectConfig.ts ✓
├── XorEncryption.ts ✓
└── index.ts ✓ (needs updating)
```

### 2.2 Files to REMOVE

```
❌ Extract/Graphs.ts (visualization, debug only)
❌ Extract/Picture/RenderPicture.ts (visual rendering)
❌ Extract/View/RenderView.ts (visual rendering)
```

### 2.3 Update `packages/core/index.ts`

- Remove exports for deleted files (RenderPicture, RenderView, Graphs)

### 2.4 Update `packages/core/package.json`

```json
{
  "name": "@agikit/core",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "pnpm run generate-parsers && tsc --build",
    "generate-parsers": "ts-node src/Scripting/generateParsers.ts",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "assert-never": "^1.2.1",
    "filesize": "^8.0.7",
    "lodash": "^4.17.21",
    "ts-is-present": "^1.2.2"
  },
  "devDependencies": {
    "@types/lodash": "^4.14.200",
    "@types/node": "^20.0.0",
    "@types/pegjs": "^0.10.3",
    "pegjs": "^0.10.0",
    "ts-node": "^10.9.0",
    "ts-pegjs": "^0.3.1",
    "typescript": "^5.3.0"
  }
}
```

## Phase 3: CLI Package Setup

### 3.1 Files to KEEP in `packages/cli/src/`

```
Commands/
  ├── build.ts ✓
  └── extract.ts ✓

Root files:
├── cli.ts ✓
└── CLILogger.ts ✓
```

### 3.2 Files to REMOVE

```
❌ Commands/formatLogic.ts (not needed for compile/decompile)
```

### 3.3 Update `packages/cli/cli.ts`

- Remove `formatLogic` command references
- Keep only `build` and `extract` commands

### 3.4 Update `packages/cli/package.json`

```json
{
  "name": "@agikit/cli",
  "version": "1.0.0",
  "description": "Command line tools for compiling and decompiling AGI games",
  "main": "dist/cli.js",
  "bin": {
    "agikit": "dist/cli.js"
  },
  "scripts": {
    "build": "tsc --build",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@agikit/core": "workspace:*",
    "ansi-colors": "^4.1.1",
    "color-support": "^1.1.3",
    "minimist": "^1.2.5"
  },
  "devDependencies": {
    "@types/color-support": "^1.1.1",
    "@types/minimist": "^1.2.2",
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0"
  }
}
```

## Phase 4: Rush Configuration Files

### 4.1 Create `rush.json`

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/rush/v5/rush.schema.json",
  "rushVersion": "5.119.0",
  "pnpmVersion": "8.15.0",
  "nodeSupportedVersionRange": ">=18.0.0",
  "projectFolderMinDepth": 2,
  "projectFolderMaxDepth": 2,
  "projects": [
    {
      "packageName": "@agikit/core",
      "projectFolder": "packages/core"
    },
    {
      "packageName": "@agikit/cli",
      "projectFolder": "packages/cli"
    }
  ]
}
```

### 4.2 Create `.npmrc`

```
# Use workspace protocol for local packages
link-workspace-packages=true
strict-peer-dependencies=false
auto-install-peers=true
```

### 4.3 Create `common/config/rush/.pnpmfile.cjs`

```javascript
'use strict';

/**
 * When using the PNPM package manager, you can use pnpmfile.js to workaround
 * dependencies that have mistakes in their package.json file.
 */
module.exports = {
  hooks: {
    readPackage
  }
};

function readPackage(packageJson, context) {
  return packageJson;
}
```

## Phase 5: Shared TypeScript Configuration

### 5.1 Root `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  }
}
```

### 5.2 `packages/core/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

### 5.3 `packages/cli/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../core" }
  ]
}
```

## Phase 6: Update Git Configuration

### 6.1 Update `.gitignore`

```
# Rush
common/temp/
common/deploy/
common/scripts/install-run.js
common/scripts/install-run-rush.js
.rush/

# Build outputs
**/dist/
**/*.tsbuildinfo

# Dependencies
node_modules/
**/node_modules/

# pnpm
pnpm-lock.yaml
.pnpm-debug.log

# Old yarn files (remove these)
.yarn/
.pnp.*
yarn.lock
```

## Phase 7: Migration Steps (Execution Order)

1. **Create new branch**: `git checkout -b rush-migration`

2. **Install Rush globally**: `npm install -g @microsoft/rush`

3. **Backup current state**: `git commit -am "Pre-migration checkpoint"`

4. **Remove yarn artifacts**:
   ```bash
   rm -rf .yarn/ .pnp.* yarn.lock .yarnrc.yml
   rm -rf node_modules packages/*/node_modules
   ```

5. **Remove unwanted packages**:
   ```bash
   rm -rf packages/agikit-vscode
   rm -rf packages/logic-language-server
   rm -rf packages/react-editors
   ```

6. **Create Rush structure**:
   ```bash
   mkdir -p common/config/rush
   # Create rush.json, .npmrc, .pnpmfile.cjs from templates above
   ```

7. **Update package.json files** in core and cli with new dependencies

8. **Remove unnecessary files** from core/src:
   ```bash
   cd packages/core/src
   rm Extract/Graphs.ts
   rm Extract/Picture/RenderPicture.ts
   rm Extract/View/RenderView.ts
   cd ../../cli/src/Commands
   rm formatLogic.ts
   ```

9. **Update index.ts exports** in core to remove deleted files

10. **Update cli.ts** to remove formatLogic command

11. **Create TypeScript configs** (root + per-package)

12. **Install dependencies**: `rush update`

13. **Generate parsers**: `cd packages/core && pnpm run generate-parsers`

14. **Build all packages**: `rush rebuild`

15. **Test extraction**:
    ```bash
    cd packages/cli
    node dist/cli.js extract /path/to/test/game /path/to/output
    ```

16. **Test compilation**:
    ```bash
    node dist/cli.js build /path/to/output
    ```

17. **Commit changes**: `git add . && git commit -m "Migrate to Rush.js/pnpm monorepo"`

## Phase 8: Post-Migration Cleanup

- Update README.md with new build instructions
- Update CI/CD scripts (if any) to use Rush commands
- Remove old test configurations (Jest) if not needed
- Remove babel configs if not needed
- Remove husky/lint-staged if not needed

## Rush Commands Cheatsheet

```bash
# Install dependencies
rush update

# Build all packages
rush rebuild

# Build only changed packages
rush build

# Clean all packages
rush purge

# Run scripts in all packages
rush exec -- pnpm run test

# Add dependency to a package
cd packages/core
pnpm add lodash

# Link packages locally
rush link
```

## Benefits of This Migration

1. ✅ **Faster installs**: pnpm uses content-addressable storage
2. ✅ **Stricter dependency management**: Rush enforces consistent versions
3. ✅ **Smaller footprint**: Removed 3 packages + rendering code (~50% reduction)
4. ✅ **Better monorepo tooling**: Rush provides better build orchestration
5. ✅ **Workspace protocol**: Easier local package development
6. ✅ **Modern tooling**: Updated to latest TypeScript, Node 20+

## Size Comparison

### Before
- **Packages**: 5 (core, cli, vscode, language-server, react-editors)
- **Core files**: 64 TypeScript files
- **Package manager**: Yarn 3 with PnP

### After
- **Packages**: 2 (core, cli)
- **Core files**: ~58 TypeScript files (removed 3 rendering/visualization files)
- **Package manager**: Rush.js with pnpm
- **Focus**: Compile/decompile only

## Notes

- The migration preserves all compilation and decompilation functionality
- Control flow analysis and AST optimization are retained for proper decompilation
- LogicDiagnostics is kept for compiler error reporting
- All resource types (LOGIC, PIC, VIEW, SOUND) are supported
- Both AGI v2 and v3 formats are supported
