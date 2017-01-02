'use strict';
const fs           = require('fs');
const childProcess = require('child_process');

module.exports = passEnv;

//expose steps for tests
passEnv.parse = parseArgv;
passEnv.exec  = execTask;

function passEnv(process) {
  const task = passEnv.parse(process);
  passEnv.exec(task, process, process.exit)
}

function parseArgv(process) {
    const xEnv = /^([^=]+)=(.*)$/;
    const env  = Object.assign({}, process.env);
    const args = process.argv.slice(2);

    let match, part, cmd = '';

    while ( (part = args.shift()) ) {
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
      args,
      isIPC
    }
}

function execTask(task, process, done) {
    const child = childProcess[ task.isIPC ? "fork" : "spawn" ](task.cmd, task.args, task.options);
    
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
    
    setTimeout(() => { console.log('timeout'); setImmediate(process.exit) }, 3000)
}
