# Apocalyptic World

## Setup for Python related code

### Requirements

- Python version 3.11 or higher

### Virtual environment

A Python virtual environment (or "virtualenv", to make it shorter) is highly recommended: you don't want to break your
global Python setup specially if your operational system (likes Linux) depends on it.

Open a terminal of your preference and type:

1. Execute `python -m venv .venv`. It will create a directory named `.venv` with the virtualenv.
1. Run `. .venv/bin/activate`, which activates the virtualenv. From now on, anything that you do that changes the environment is restricted to this one enabled.
1. Run `python -m pip install -U pip` to upgrade pip to it's latest available version.

`pip` is the standard dependency manager for Python. We will need it to install code not available in the standard
Python distribution.

Here is a example of the execution of those steps on a terminal running Bash, as reference:

```bash
fubar@myhost:~/Projects/apocalyptic-world$ python -m venv .venv
fubar@myhost:~/Projects/apocalyptic-world$ . .venv/bin/activate
(.venv) fubar@myhost:~/Projects/apocalyptic-world$ python -m pip install -U pip

[notice] A new release of pip is available: 25.3 -> 26.3
[notice] To update, run: pip install --upgrade pip
(.venv) fubar@myhost:~/Projects/apocalyptic-world$ python -m pip install -U pip
Requirement already satisfied: pip in ./.venv/lib/python3.14/site-packages (25.3)
Collecting pip
  Downloading pip-26.3-py3-none-any.whl.metadata (4.6 kB)
Downloading pip-26.3-py3-none-any.whl (2.0 MB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 2.0/2.0 MB 4.9 MB/s  0:00:00
Installing collected packages: pip
  Attempting uninstall: pip
    Found existing installation: pip 25.3
    Uninstalling pip-25.3:
      Successfully uninstalled pip-25.3
Successfully installed pip-26.3
(.venv) fubar@myhost:~/Projects/apocalyptic-world$
```

Notice that the prompt of the shell now has the prefix `(.venv)`. This indicates that a virtualenv is now in place.


### Installing additional stuff

Run `python -m pip install -r requirements.txt`.

## Security scanning

Passages (`*.tw`) are scanned with [Semgrep](https://github.com/semgrep/semgrep) for signs of injected code, both
locally and in GitHub Actions. See [`.semgrep/README.md`](.semgrep/README.md) for the rules and how to install and run
it.
