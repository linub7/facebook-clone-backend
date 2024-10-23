const { readdirSync } = require('fs');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');

const app = express();

app.use(express.json());
dotenv.config();
// const options = { origin: 'http://localhost:3000' };
app.use(cors());
app.use(morgan('dev'));
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

readdirSync('./routes').map((r) =>
  app.use(`/api/v1/`, require('./routes/' + r))
);

app.use('/', (req, res) => {
  res.json({ message: 'OK' });
});

// db
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('DB Connected'))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));
