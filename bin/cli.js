/* 
  usage:
    env-pass PORT=3001 bin/my-svc --switch1 --switch2 --switch3 value verb1 --switch4 verb2
*/
const parse = require("../");
const task    = parse(process.argv);
const child = require('child_process')[ task.isIPC ? "fork" : "spawn" ](task.cmd, task.argv, task.options);

//propagate messages to child
process.on('SIGINT' , ()  => child.kill('SIGINT') );
process.on('SIGTERM', ()  => child.kill('SIGTERM') );
if (task.isIPC) process.on('message', (m) => child.send(m) );

//propagate messages from child
child.on('exit', (code => { 
  child.on('close', () => { process.exit(c) } );
});
if (process.send) child.on('message', (m) => process.send(m) );
