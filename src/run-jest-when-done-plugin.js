const {join} = require('path');

const jest = require('jest');

class RunJestWhenDone {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    const {argv, jestArgv} = this.options;
    // let cliOnce = false;

    compiler.plugin('done', function() {
      const config = compiler.options;
      // if (watchMode && cliOnce) {
      //   return;
      // }
      // cliOnce = true;

      const wd = join(config.context, '.cache/jest-webpack');
      const oldWd = process.cwd();
      process.chdir(wd);

      const jestDone = result => {
        if (compiler._plugins['jest-webpack-done']) {
          try {
            process.chdir(oldWd);
          }
          finally {
            compiler.applyPlugins('jest-webpack-done', result);
          }
          return true;
        }
      };

      const run = () => {
        return new Promise((resolve, reject) => {
          const promise = jest.runCLI(jestArgv, [wd], (e, result) => {
            if (e) {return reject(e);}
            return resolve(result);
          });
          if (promise) {
            promise.then(resolve, reject);
          }
        });
      };

      try {
        run()
        .then((result) => {
          if (!jestDone(result.results)) {
            if (!result.results.success) {
              process.on('exit', () => process.exit(1));
            }
            else if (jestArgv.forceExit) {
              process.exit(result.results.success ? 0 : 1);
            }
          }
        })
        .catch(function(e) {
          console.error(e.stack || e);
          jestDone({success: false});
          process.exit(1);
        });
      }
      catch (e) {
        console.error(e.stack || e);
        jestDone({success: false});
        process.exit(1);
      }
    });
  }
}

module.exports = RunJestWhenDone;
