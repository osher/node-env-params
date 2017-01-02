const args = require('minimist')(process.argv.slice(2));

if (!args.echo) args.echo = [];
if (!Array.isArray(args.echo)) args.echo = [ args.echo ];

args.echo.forEach((name) => console.log( name + ":" + process.env[name] ));

if (!args.killMsg) return;
  
setInterval( () => console.log('blip'), 60000);
process.on('message', (m) => { console.log(m, args.killMsg); if (m == args.killMsg) process.exit() });
