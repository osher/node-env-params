'use strict';
const childProcess = require('child_process');
const sut = require('../');

var result;

module.exports = 
{ "node-env-params" : 
  { "should be a strategy function that names 1 argument - process" : 
     () => Should(sut).be.a.Function().have.property("length", 1)
  , "end-to-end" :
    { "when called with env vars and a local script" : 
      { beforeAll: 
        done => exec(
          "ENV1=gip-gip ENV2=urraaaa! test/fixtures/echo-env baz --echo ENV1 --echo ENV2 foo"
        , result = {}
        , done
        )
      , "should not fail" : () => Should.not.exist(result.err)
      , "should pass the env vars to the target script" :
        () => Should(result.stdout).eql(
          [ "ENV1:gip-gip"
          , "ENV2:urraaaa!"
          ]
        )
      },
      "when called in IPC mode" : 
      { timeout: "5s"
      , beforeAll: 
        done => execIpc(
          "ENV1=gip-gip ENV2=urraaaa! test/fixtures/echo-env --echo ENV1 --echo ENV2 --killMsg die"
        , "die"
        , result = {}
        , done
        )
      , "should not fail" : () => Should.not.exist(result.err)
      , "should pass kill signal" : () => Should(result.stdout).not.containEql("timeout")
      }
    }
  , "~internal" : 
    { ".parse(argv)" : null
    , ".exec(task, process, done)" : null
    }
  }
};

function exec(cmd, result, done) {
    childProcess.exec( "node bin/cli.js " + cmd
    , (err, stdout, stderr) => {
          if (err) return done(err);
          Object.assign(result, {
            err,
            stdout: stdout.toString().trim().split("\n"),
            stderr: stderr.toString().trim().split("\n")
          });
          done()
      }
    )
}

function execIpc(cmd, die, result, done) {
    const sout = result.stdout = [];
    const serr = result.stderr = [];
    const child = childProcess.fork( "bin/cli"
    , cmd.split(" ")
    , { env:     process.env
      , stdio:   ["ipc", "pipe", "pipe"]
      }
    );
    
    child.stdout.on('data', m => sout.push(m + "") );
    child.stderr.on('data', m => serr.push(m + "") );
    
    child.on('close', (c) => done() );
    
    setTimeout(() => child.send(die), 1000)
}
