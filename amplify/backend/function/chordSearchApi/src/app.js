/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
let Chord = require("./models/chord.model");
require("dotenv").config();

// declare a new express app
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true });
const connection = mongoose.connection;

connection.once("open", () => {
  console.log("MongoDB database connection established successfully");
});

/**********************
 * Example get method *
 **********************/

app.get("/chords", function (req, res) {
  Chord.find()
    .then((chords) => res.json(chords))
    .catch((err) => res.status(400).json("Error: " + err));
});

app.get("/chords/search", function (req, res) {
  let regx = new RegExp(`${req.query.chordName}`, "i");

  Chord.find({ chordName: regx })
    .then((chords) => res.json(chords))
    .catch((err) => res.status(400).json("Error: " + err));
});

/****************************
 * Example post method *
 ****************************/

app.post("/chords/add", async function (req, res) {
  const chordName = req.body.chordName;
  const chordStrings = req.body.chordStrings;
  let nameExists = false;
  let stringsExist = false;

  const newChord = new Chord({ chordName, chordStrings });

  await Chord.exists({ chordName: chordName }).then((result) => {
    if (result) nameExists = true;
  });

  await Chord.exists({ chordStrings: chordStrings }).then((result) => {
    if (result) stringsExist = true;
  });

  if (nameExists && stringsExist) {
    // duplicate record

    res
      .status(400)
      .json(`Chord ${chordName} already exists with this string pattern.`);
  } else if (!stringsExist) {
    // new chord
    newChord
      .save()
      .then(() => res.json("Chord added!"))
      .catch((err) => {
        res.status(400).json("Error: " + err);
      });
  } else {
    // duplicate string pattern
    Chord.find({ chordStrings: chordStrings }).then((chords) =>
      res
        .status(400)
        .json(
          `This string pattern is already matched to ${chords
            .map((chord) => chord.chordName)
            .join(" ")}`
        )
    );
  }
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
