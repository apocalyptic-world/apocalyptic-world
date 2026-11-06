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

### Validating the game with Tweego

The unit tests only cover the JavaScript helpers. To check the story passages themselves, build the game with the
[Tweego](https://www.motoslave.net/tweego/) command-line compiler. A successful build means every passage parses, and
Tweego warns about problems such as two passages with the same name.

#### Setting up Tweego

1. Download the archive for your system from [motoslave.net/tweego](https://www.motoslave.net/tweego/) and extract
   it. It contains the `tweego` executable and a `storyformats` folder.
2. Put the `tweego` executable in a folder on your `PATH` (for example `~/bin` or `~/.local/bin` on Linux and macOS),
   and move the `storyformats` folder **next to it**: Tweego looks for the story formats in the folder the executable
   is in.

   ```text
   ~/bin/
   ├── tweego
   └── storyformats/
       ├── sugarcube-2/
       └── …
   ```

3. Check that Tweego runs and finds SugarCube:

   ```sh
   tweego --version
   tweego --list-formats
   ```

#### Building the game

From the repository root:

```sh
tweego -f sugarcube-2 -o ../apocalyptic-world.html .
```

Write the output **outside** the repository, as above. Tweego also reads `.html` files as story sources, so a build
left inside the repository would be pulled into the next build. Tweego bundles every `.tw`, `.js` and `.css` file it
finds under the folder you pass it, so keep other projects' files (such as a Python `.venv`) out of the repository
folder too.

> [!NOTE]
> The archive from the Tweego site ships an older SugarCube 2 (2.30.0), while the game needs **SugarCube 2.37.3**
> (see `core/StoryData.tw`). Without the upgrade, a plain `tweego -o … .` stops with
> `Story format named "SugarCube" at version "2.37.3" is not available`. The `-f sugarcube-2` flag above forces the
> installed SugarCube 2, which is enough to validate the passages, but the resulting game runs on the older version.
> For a proper build, download SugarCube 2.37.3 for Tweego from the [SugarCube site](https://www.motoslave.net/sugarcube/2/)
> (or its [GitHub releases](https://github.com/tmedwards/sugarcube-2/releases)) and replace the
> `storyformats/sugarcube-2` folder with it. Then build without `-f`:
>
> ```sh
> tweego -o ../apocalyptic-world.html .
> ```

### GitHub Action

The workflow in `.github/workflows/tests.yml` runs `npm test` automatically on every pull request. The result shows up
on the pull request as a check: a green ✓ when all tests pass, or a red ✗ with the failing tests in the job log. This way
the tests run even when nobody remembers to run them locally, and a pull request that breaks something already fixed
is visible before it is merged.
