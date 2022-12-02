const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const chordSchema = new Schema(
  {
    chordName: {
      type: String,
      required: true,
      trim: true,
    },
    chordStrings: {
        type: String,
        required: true
    }
  },
  {
    timestamps: true,
  }
);

const Chord = mongoose.model('Chord', chordSchema)

module.exports = Chord;