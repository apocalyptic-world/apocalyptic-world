# Unit tests

Tests for the game's JavaScript helpers in `js/`, run with Node.js's built-in test runner (`node:test`). There are no
npm dependencies to install.

SugarCube itself only runs in a browser, so the tests can only cover code that doesn't depend on it. Each test file
loads the game scripts it needs into a sandbox (`node:vm`) that provides a stub `setup` object, the same global
namespace the game uses. Helpers meant to be tested (such as `js/npcs.js`) must not touch SugarCube globals
(`State`, `variables()`, `$guests`, …); callers pass the data in instead.

## Requirements

- Node.js **18 or newer** (an LTS release, such as 22 or 24, is recommended)
- npm, which comes with Node.js

Check what you have:

```sh
node --version
npm --version
```

## Installing Node.js

Pick one option.

### nvm (Linux, macOS, WSL), recommended

[nvm](https://github.com/nvm-sh/nvm) installs Node.js in your home directory, without root, and lets you switch
versions per project. Install nvm by following the instructions in its README, then:

```sh
nvm install --lts
nvm use --lts
```

### Package manager

```sh
# Debian/Ubuntu: the distribution's package may be older than 18; check with node --version
sudo apt install nodejs npm

# Fedora
sudo dnf install nodejs

# macOS (Homebrew)
brew install node

# Windows (winget)
winget install OpenJS.NodeJS.LTS
```

### Installer

Download the LTS installer from [nodejs.org](https://nodejs.org/).

## Running the tests

From the repository root:

```sh
npm test
```

`npm test` runs `node --test test/*.test.cjs` (see `package.json`). You can also run Node directly:

```sh
# All test files
node --test test/*.test.cjs

# One file
node --test test/npcs.test.cjs

# Only tests whose name matches a pattern (Node 18.11+)
node --test --test-name-pattern="pick" test/*.test.cjs
```

Each test prints `ok` or `not ok` with its name, followed by a summary. The command exits with a non-zero status if any
test fails.

## Writing tests

- Name test files `*.test.cjs` and put them in this folder. The `.cjs` extension matters: Tweego builds the game from
  the repository root and bundles every `.js` file it finds, so a test saved as `.js` would end up inside the game.
- Load the game scripts under test into the sandbox with `loadGameScripts(['js/your-file.js'])`, as in
  `npcs.test.cjs`. If the code calls other `setup` functions, add simple stubs to the returned `setup` object (e.g.
  `setup.getAge = npc => npc.age`).
- Arrays and objects created inside the sandbox have their own prototypes, so `assert.deepStrictEqual(result, [])`
  fails on them even when they look equal. Compare contents instead: `assertEmptyArray(result)`, `result.length`, or
  copy first with `[...result]`.
- For code that uses randomness, make the random source a parameter (`rng = Math.random`) and pass a seeded
  generator in tests (see `seededRng` in `npcs.test.cjs`), so results can be repeated.
