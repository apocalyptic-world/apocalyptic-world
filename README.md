# Apocalyptic World

## Automated testing

The game's JavaScript helpers in `js/` have unit tests in `test/`. They act as a safety net: each test checks one piece
of game logic with known inputs, so a bug that was fixed and tested can't quietly come back when the code changes
later.

SugarCube only runs in a browser and has no way to test code automatically. The tests therefore cover helpers that
don't depend on SugarCube (such as `js/npcs.js`): callers pass the lists in, and the helpers return a result that can
be checked outside the game. The tests don't change the game build in any way: they are `.cjs` files, which Tweego
doesn't bundle, and building or playing the game doesn't need Node.js.

### Setting up the environment

The only requirement is **Node.js 18 or newer** (an LTS release is recommended). The tests use Node's built-in test
runner, so there are no npm packages to install.

1. Install Node.js, using one of these:
   - [nvm](https://github.com/nvm-sh/nvm) (Linux, macOS, WSL), then `nvm install --lts`
   - your package manager: `sudo apt install nodejs npm` (Debian/Ubuntu: check that the version is 18 or newer),
     `sudo dnf install nodejs` (Fedora), `brew install node` (macOS), `winget install OpenJS.NodeJS.LTS` (Windows)
   - the LTS installer from [nodejs.org](https://nodejs.org/)
2. Check the installed version:

   ```sh
   node --version
   ```

### Running the tests

From the repository root:

```sh
npm test
```

Each test prints `ok` or `not ok` with its name, followed by a summary with the number of passed and failed tests. To
run a single file, use `node --test test/npcs.test.cjs`.

See [`test/README.md`](test/README.md) for more ways to run the tests and for how to write new ones.

### GitHub Action

The workflow in `.github/workflows/tests.yml` runs `npm test` automatically on every pull request. The result shows up
on the pull request as a check: a green ✓ when all tests pass, or a red ✗ with the failing tests in the job log. This way
the tests run even when nobody remembers to run them locally, and a pull request that breaks something already fixed
is visible before it is merged.
