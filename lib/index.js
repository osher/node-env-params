module.exports = function parseArgv(argv) {
    const xEnv = /^([^=]+)=(.+)$/;
    const env  = require('util')._extend({}, process.env);
    const args = process.argv.slice(2);

    let match, part, cmd = '';

    while ((part = args.shift())) {
        match = xEnv.exec(part);
        if (match) {
            env[match[1]] = match[2]
        } else {
            //first without a match is the target script
            cmd = part;
            break
        }
    }
    
    return {
      options: { env },
      cmd,
      args,
      isIPC : require('fs').existsSync(task.cmd)
    }
}



