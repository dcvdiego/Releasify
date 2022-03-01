const getPythonJSON = (json, filename) => {
  const stringJSON = JSON.stringify(json);
  return new Promise(function (success, nosuccess) {
    const { spawn } = require('child_process');
    const pyprog = spawn('python', [
      `components/ai/${filename}.py`,
      stringJSON,
    ]);

    pyprog.stdout.on('data', function (data) {
      success(data);
    });

    pyprog.stderr.on('data', (data) => {
      nosuccess(data);
    });
  });
};

module.exports = getPythonJSON;
