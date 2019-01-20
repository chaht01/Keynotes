/* global describe, it, before */

import chai from "chai";
import { Note, NoteObject, Longtake } from "../lib/Longtake.js";

chai.expect();

const expect = chai.expect;

let lib;

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
      expect(lib.getObject()).to.be.equal([1, 2, 3]);
    });
  });
});
