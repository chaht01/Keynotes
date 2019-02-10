/* global describe, it, before */

import chai from "chai";
import { Note, NoteObject, Keynotes } from "../lib/Keynotes";

chai.expect();

const expect = chai.expect;

let lib, keynote;

describe("Given an instance of my Note library", () => {
  before(() => {
    lib = new NoteObject("test", [1, 2, 3]);
  });
  describe("when I need the name", () => {
    it("should return the name", () => {
      expect(lib.name).to.be.equal("test");
    });
  });
  describe("when I need the Object", () => {
    it("should return the object", () => {
      expect(lib.getObject()).to.be.an("array");
      expect(lib.getObject()).to.deep.equal([1, 2, 3]);
    });
  });
});

describe("Given an instance of my Keynotes library", () => {
  before(() => {
    keynote = new Keynotes();
    keynote.addNoteObject("a", { k: 123, j: [1, 4, 6] });
  });
  describe("when I defined note object named `a`", () => {
    it("should return note object", () => {
      expect(keynote.getNoteObject("a").getObject()).to.deep.equal({
        k: 123,
        j: [1, 4, 6]
      });
    });
  });
});
