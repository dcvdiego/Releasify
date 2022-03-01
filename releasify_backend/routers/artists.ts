const express = require('express');

const router = new express.Router();

const pythonCall = require('../utils/pythonCall');
router.get('/call', async (req, res) => {
  try {
    const json = {
      array: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    };
    pythonCall(json, 'example')
      .then(function (fromRunpy) {
        console.log(fromRunpy.toString());
        res.end(fromRunpy);
      })
      .catch((e) => res.status(400).send(e));
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;
