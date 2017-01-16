'use strict';
const fs            = require('fs');
const childProcess  = require('child_process');

module.exports      = envPass;

//expose steps for tests
envPass.parse       = parse;
envPass.exec        = execTask;

function envPass(process) {
    const task = envPass.parse(process);
    if (!task.cmd) return help(console, process.exit);
    envPass.exec(task, process, console, process.exit)
}

function parse(process) {
    const xEnv = /^([^=]+)=(.*)$/;
    const env  = Object.assign({}, process.env);
    const args = process.argv.slice(2);

    let match, part, timeout, cmd = '';

    while ( (part = args.shift()) ) {
        if (part == "--timeout" || part == "-t") {
            timeout = parseTimeout(args);
            continue
        }
        if ( !(match = xEnv.exec(part)) ) {
            //first expression without a match is the target script
            cmd = part;
            break
        }
        env[match[1]] = match[2]
    }
    
    const isIPC = fs.existsSync(cmd) || fs.existsSync(cmd + ".js");
    
    return {
      options: { 
        env, 
        stdio: isIPC ? [0,1,2,'ipc'] : [0,1,2] 
      },
      cmd,
      timeout, 
      args,
      isIPC
    }
}

function parseTimeout(args) {
    let timeout = (args.shift());
    if (isNaN(timeout * 1)) {
        if (timeout) args.unshift(timeout);
        console.log("--timeout <value> switch expects a number of seconds for timeout")
    } else
        timeout = timeout * 1000;
    return timeout
}

function execTask(task, process, console, done) {

    const child = childProcess[ task.isIPC ? "fork" : "spawn" ](task.cmd, task.args, task.options);
    child.on('error', e => {
        console.error("Cannot find target: " + e.path);
        done(e.errno)
    });

    //propagate messages to child
    process.on('SIGINT' , () => child.kill('SIGINT') );
    process.on('SIGTERM', () => child.kill('SIGTERM') );
    if (task.isIPC) process.on('message', (m) => child.send(m) );

    //propagate messages from child
    if (process.send) child.on('message', (m) => process.send(m) );
    child.on('exit', c => {
      child.removeListener('close', done);
      child.on('close', () => { done(c) });
    });
    child.on('close', done);

    if (task.timeout) setTimeout(() => {
        console.error('env-pass: timeout of %s reached', task.timeout);
        child.kill('SIGKILL');
        child.on('exit', () => process.exit() )
    }, task.timeout)
}

function help(console, exit) {
    console.log(
      [ "env-pass - pass env variables on windows and linux alike."
      , ""
      , "the first part that does not look like <NAME>=<value>"
      , "is asummed to be your target script."
      , "all arguments and switches from this point and on are passed"
      , "to it as-is"
      , ""
      , "example:"
      , "  env-pass ENV_VAR1=value1 ENV_VARn=foo bin/my-svc --switch1 --switch2 --switch3 value verb1 --switch4 verb2"
      , ""
      , "calls:  bin/my-svc --switch1 --switch2 --switch3 value verb1 --switch4 verb2"
      , "in context with env vars:"
      , "  ENV_VAR1=value1"
      , "  ENV_VARn=foo"
      ].join("\n")
    );
    exit()
}