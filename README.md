# agikit-slim

agikit-slim is a fork of the original agikit toolchain here:

https://github.com/nbudin/agikit

The purpose of the fork is to focus solely on decompiling and compiling and not any user interface issues. This makes it easier to keep dependencies up to date and to add new features. The particular feature I forked in order to add is foreign-language encoding for translations. I tried to develop a PR for the original package, but its development toolchain is somewhat out of date and one I'm not familiar with...

## Background

The original agikit was made as a developer toolchain for Sierra's AGI (Adventure Game Interpreter) engine. AGI was used
in the 1980s to develop adventure games including King's Quest I, II, and III, Space Quest I and II,
and more. Later, it was reverse engineered by fans and used to develop many fan-made games.
A lot more information about AGI is available at
[the AGI Programmers Wiki](http://agiwiki.sierrahelp.com).

## Development Setup

This project uses [Rush.js](https://rushjs.io/) with pnpm for monorepo management.

### Prerequisites

- Node.js >= 18.0.0
- Rush installed globally: `npm install -g @microsoft/rush`

### Getting Started

```bash
# Install dependencies
rush update

# Build all packages
rush rebuild

# Build only changed packages
rush build
```

### Project Structure

- `packages/core` - Core AGI compiler/decompiler library
- `packages/cli` - Command-line interface

## Command line usage

To install the CLI globally:

`npm install -g @agikit-slim/cli`

To extract an AGI game to source files:

`agikit extract path/to/game output/path`

To build AGI game volume files from extracted source files:

`agikit build path/to/project`

## Current status

Known limitations:

- Not compatible with WinAGI projects
- There are some missing features in the LOGIC language:
  - `]` as a comment character
