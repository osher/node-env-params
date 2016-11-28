const argv = require('minimist').parse(process.argv.slice(2));

if (!Array.isArray(argv.env)) argv.env = [ argv.env ];

argv.env.forEach(console.log);

if (argv.stayup) setInterval( () => console.log('blip'), 60000);

process.on('message', (m) => { if (m == argv.kill) process.exit() });
