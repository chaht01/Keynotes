const _cloneDeep = require("lodash.clonedeep");

class NoteObject {
  constructor(name, object3D, options) {
    this.name = name;
    this.object3D = Array.isArray(object3D) ? object3D : [object3D];
    this._isPlural = Array.isArray(object3D) ? true : false;
  }
  getObject() {
    return this._isPlural ? this.object3D : this.object3D[0];
  }
  getObjectAsArray() {
    return this.object3D;
  }
  clone() {
    return new NoteObject(
      `__clone__${this.name}`,
      _cloneDeep(this.getObject())
    );
  }
}

module.exports = NoteObject;
