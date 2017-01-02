# Work In Progress... 

I just expressed the idea in code, I did not test it, and will have time for it in few weeks time.
 - need to add tests and publish to npm
 - need to connect to travis
 - need to connect to a builder with windows platform

# env-pass

A CLI utility that lets you pass env-params to CLI tools on windows, Mac and 
linux alike.

# Overview


While passing env-parameters is done differently on `*n*x` and on `windows`,
one may encounter a problem with tools that relay on environment-variables as 
an input for feature-flags or env-switches.

The linux/Mac/Unix form:
```
$ PARAM1=value PARAM2=value the-program args1 args2 args3
```

The windows form:
```
> Set PARAM1=value
> Set PARAM2=value
> the-program args1 args2 args3
```
 
As long as these tools are ran mannually, it stays a matter of style. 

But when the tools are run as a part of a unified automated flow that should 
run the same accross platforms - e.g. commands expressed in scripts section of 
`package.json` as part of your test flow - the problem becomes a nuisance this 
tool comes to solve.

## Install

```
npm install env-pass --global
```

(or localy, AND make sure your `PATH` includes `./node_modules/.bin`)

## Usage

**Synopsis**
```
env-pass [[<param>=<value>] ... ] <script> <arg> <arg> -<switch> -<switch> <switch-value>
```

**Example**
```
env-pass PORT=3001 bin/my-svc arg1 --switch1 --switch2 --switch3 sw-value arg2 arg3
```
    
## How does it work?

The tool exposes the CLI command `env-pass`.
When ran, it takes advantage of the fact that program tools almost certainly 
will *never* use the equal-sign (`=`) as a part of their file name.
(although file-systems allow equal sign as part of file names)

Implied from that:
 1. every leading expression that inlcudes the equal-sign (`=`) is basically
    a setting of an env parameter passed to the script.
 2. The first element wihtout `=` is the script command
 3. anything after the script name is args and switches passed to the program

Then the tool checks if the task command is a local script file.
 - If so - it uses [`require('child_process').fork`](https://nodejs.org/api/child_process.html#child_process_child_process_fork_modulepath_args_options).
 - Otherwise - it uses [`require('child_process').spawn`](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options).
The difference between them is `fork` being a private case for `spawn`, where
the child process is essentially a new node VM, and an IPC channel is created
between the two.

**In either case, the child process gets the injected environment variables,
cascading any existing environment variables with same name**.
 
Once spawned/forked, it makes sure to pass any SIGINT, SIGTERM to the child 
process, and if it's a local script - it also propagates IPC messages.

## Caveates

`SIGTERM` and `SIGINT` do not pass well on windows because of how `node`
handles these signals on windows (soemthing to do with libuv).

We encountered problems on windows when trying to work with `istanbul`, where
`istanbul` was running the SUT(System-Under-Test) which was a web-server, and
in the end of the test `istanbul` should terminate gracefully, and generate
the coverage reports. By the book, we're asked to run `istanbul` with the 
`--handle-sigint` switch.

But.

In effect, the child process is effectively killed, and coverage reports were 
not generated. The problem worsens with `nodist` on windows, that adds a `go` 
shim layer.

If you need your target script to accept `SIGINT/SIGTERM` messages (e.g. signal
to the SUT to shut-down gracefully) you should consider supporting an 
***additional*** alternative way to ask termination of that process.

The easiest shim is have your context file respond to a specific IPC message 
with termination code (I'll leave the code-word to you), in addition to hooking
`process.on('SIGINT'` and `'SIGTERM'`.

If you chose to do so - you'll have to run the script as a local script (not a 
CLI installed with --global) and run the actual node-file.

e.g. instead of `istanbul` run `node_modules/istanbul/lib/cli`


## Contribute
  - Using PRs
  - make sure all tests pass
 
## Lisence
MIT, and that's it :)
