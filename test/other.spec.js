/* global describe, it, before */

import chai from "chai";

chai.expect();

const expect = chai.expect;

let lib;

describe("Given an instance of my Note library", () => {
  before(() => {
    lib = 3;
  });
  describe("when I need the name", () => {
    it("should return the name", () => {
      expect(lib).to.be.equal(3);
    });
  });
});
