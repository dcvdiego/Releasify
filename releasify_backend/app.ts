import express from 'express';

var cors = require('cors');
const appRouter = require('./routers/artists');

const port = 5000;
const app = express();
app.use(cors());
app.use(appRouter);
app.listen(port, () => {
  console.log(`Releasify ML application is running on port ${port}.`);
});
module.exports = app;
