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
      }
    , "when called with env vars and a CLI tool from node_modules/.bin" :
      { timeout: "5s",
        beforeAll: 
        done => exec(
          "ENV1=gip-gip ENV2=urraaaa! istanbul cover --no-default-excludes --print none test/fixtures/echo-env.js -- baz --echo ENV1 --echo ENV2 foo"
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
      }
    , "when called in IPC mode" : 
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
    , "when called with no arguments" : {
        beforeAll: 
          done => exec(
          ""
        , result = {}
        , done
        )
      , "should not fail" : () => Should.not.exist(result.err)
      , "should emit the help" : ()=> Should(result.stdout.join("")).match(/example:/)
      }
    , "when called with only arguments" : {
        beforeAll: 
          done => exec(
          "ENV=value"
        , result = {}
        , done
        )
      , "should not fail" : () => Should.not.exist(result.err)
      , "should emit the help" : ()=> Should(result.stdout.join("")).match(/example:/)
      }
    , "when called with env vars and switches but no identifialble target" : 
      { beforeAll: 
        done => exec(
          "ENV1=gip-gip ENV2=urraaaa! --echo ENV1 --echo ENV2 foo"
        , result = {}
        , done
        )
      , "should not fail" : () => Should.not.exist(result.err)
      , "should emit to stderror a missing-target" : () => result.stderr[0].should.eql("Cannot open target: --echo")
      }
    , "when called with a --timeout switch" : 
      { beforeAll: 
        done => {
          const start = Date.now()
          exec(
            "ENV1=gip-gip --timeout 1 ENV2=\"w'ever\" test/fixtures/echo-env --killMsg who-cares"
          , result = {}
          , function(e) {
                result.due = Date.now() - start
                done(e)
            }
          )
        }
      , "should not fail" : () => Should.not.exist(result.err)
      , "should terminate by the given timeout" : 
          () => Should(result.due).be.greaterThan(1000).lessThan(2000)
      , "should emit a timeout notice on stderr" : 
          () => Should(result.stderr)
                  .eql(['env-pass: timeout of 1000 reached'])
      }
    }
  , "~internal" : 
    { ".parse(process)" : null
    , ".exec(task, process, console, done)" : null
    }
  }
};

function exec(cmd, result, done) {
    childProcess.exec( "node bin/cli " + cmd
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
