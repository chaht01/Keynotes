const _isFunction = require("lodash.isfunction");
const _cloneDeep = require("lodash.clonedeep");
const _difference = require("lodash.difference");
const easing = require("./easing");
const binarySearch = require("./binarySearch");

class Note {
  constructor(name, { object_options, beforeBuild, afterDestroy }) {
    // Validation
    const object_names = Object.keys(object_options);
    object_names.map(object_name => {
      Note.validateSpec(object_options[object_name]);
    });

    // BUILD / DESTROY SETTINGS
    this.beforeBuild = _isFunction(beforeBuild) ? beforeBuild : function() {};
    this.afterDestroy = _isFunction(afterDestroy)
      ? afterDestroy
      : function() {};

    // Split object as segment
    this._split = { start: {}, end: {} };
    this._split_records = {};
    this.transition_duration = 0;
    this.segments = [];
    object_names.map(obj_name => {
      this.computeSplit(obj_name, object_options[obj_name]);
    });
    const split_records_unique = Object.keys(this._split_records).sort(
      (a, b) => {
        if (Number(a) === -1) return 1;
        if (Number(b) === -1) return -1;
        return Number(a) < Number(b) ? -1 : Number(a) > Number(b) ? 1 : 0;
      }
    );
    let segment_stack = {};
    let prev_start = split_records_unique[0];
    this._split.start[prev_start].map(([object_name, prop_key, spec]) => {
      // Guarantee that first keyframe is start
      segment_stack[object_name] = {
        ...segment_stack[object_name],
        [prop_key]: spec // pure object(from and to could be function)
      };
    });
    split_records_unique.slice(1).map(tick => {
      this.segments.push({
        start: prev_start,
        end: tick,
        object_prop_spec: _cloneDeep(segment_stack)
      });
      prev_start = tick;
      if (this._split.end.hasOwnProperty(tick)) {
        this._split.end[tick].map(([object_name, prop_key, spec]) => {
          delete segment_stack[object_name][prop_key];
          if (Object.keys(segment_stack[object_name]).length === 0) {
            delete segment_stack[object_name];
          }
        });
      }
      if (this._split.start.hasOwnProperty(tick)) {
        this._split.start[tick].map(([object_name, prop_key, spec]) => {
          segment_stack[object_name] = {
            ...segment_stack[object_name],
            [prop_key]: spec
          };
        });
      }
    });

    this.name = name;
    this.object_options = object_options;
  }

  /**
   * CHECK VALIDATION
   * 1. Spec Key validation
   * 2. Keyframe Overlap validation
   * @param {*} prop_timelines
   */
  static validateSpec(prop_timelines) {
    const prop_keys = Object.keys(prop_timelines);
    prop_keys.map(prop_key => {
      if (
        !Array.isArray(prop_timelines[prop_key]) ||
        prop_timelines[prop_key].length === 0
      ) {
        console.error("Given animation spec should be non-empty array.");
        throw "Given animation spec should be non-empty array.";
        console.trace();
      }
      prop_timelines[prop_key].reduce((prev_spec, spec) => {
        if (
          _difference(["start", "end", "from", "to"], Object.keys(spec))
            .length > 0
        ) {
          console.error(
            `Keys are required: ${["start", "end", "from", "to"].join(
              ", "
            )}. (Given key: ${Object.keys(spec).join(", ")})`
          );
          throw `Keys are required: ${["start", "end", "from", "to"].join(
            ", "
          )}.`;
          console.trace();
        }
        if (
          prev_spec.end > spec.start ||
          prev_spec.end < 0 || // spec.end must assign only if it is last spec of current prop.
          (spec.end != -1 && spec.start >= spec.end) // spec.end can be -1 when if it is looping function.
        ) {
          console.error(
            `Given start and end compute error: ${spec.start}, ${spec.end}`
          );
          throw "Given start and end compute error";
          console.trace();
        }
        return spec;
      });
    });
  }

  /**
   * SPLIT PREPROCESSING
   * @param {*} object_name
   * @param {*} prop_timelines
   */
  computeSplit(object_name, prop_timelines) {
    const prop_keys = Object.keys(prop_timelines);
    prop_keys.map(prop_key => {
      prop_timelines[prop_key].map(spec => {
        if (!this._split.start.hasOwnProperty(spec.start)) {
          this._split.start[spec.start] = [];
        }
        if (!this._split.end.hasOwnProperty(spec.end)) {
          this._split.end[spec.end] = [];
        }
        this._split_records[spec.start] = 1;
        this._split_records[spec.end] = 1;
        this._split.start[spec.start].push([object_name, prop_key, spec]); // Store spec as itself (conserve functional format)
        this._split.end[spec.end].push([object_name, prop_key, spec]); // Store spec as itself (conserve functional format)
        this.transition_duration = Math.max(this.transition_duration, spec.end);
      });
    });
  }

  getSegmentIdx(tick) {
    return binarySearch(this.segments, tick, ({ start, end }, tick) => {
      if (start <= tick && (tick < end || end < 0)) {
        return 0;
      } else {
        if (tick < start) {
          return -1;
        } else {
          return 1;
        }
      }
    });
  }

  /**
   * SEEK AND COMPUTE EACH MESH'S APPEARANCE
   * @param {Number} tick
   * @param {[NoteObject]} objects
   */
  seek(tick, objects) {
    const object_prop_idx = this.getSegmentIdx(tick);
    if (object_prop_idx === -1) return;
    const object_prop = this.segments[object_prop_idx];
    const object_prop_spec = object_prop.object_prop_spec;
    const object_names = Object.keys(object_prop_spec);
    object_names.map(name => {
      const target_props = Object.keys(object_prop_spec[name]);
      target_props.map(prop => {
        try {
          objects[name].getObjectAsArray().map((item, index) => {
            const target_animation = object_prop_spec[name][prop];
            const prop_chain = prop.split(".");
            this.calculateAnimation(
              tick,
              target_animation,
              prop_chain,
              item,
              index
            );
          });
        } catch (error) {
          console.log(objects, name, object_prop_spec[name]);
          throw error;
          console.trace();
        }
      });
    });
  }

  handleAssignMap(target, prop, val) {
    if (target instanceof Map) {
      target.set(prop, val);
    } else if (_isFunction(target[prop])) {
      try {
        target[prop].apply(target, val);
      } catch (e) {
        console.error(e);
        console.log(target, prop);
      }
    } else {
      try {
        target[prop] = val;
      } catch (e) {
        console.error(e);
        console.log(target, prop);
      }
    }
  }

  /**
   * CALCULATE AND ASSIGN VALUE TO EACH OBJECT USING TICK(RELATIVE)
   * @param {*} tick
   * @param {*} target_animation
   * @param {*} prop_chain
   * @param {*} target_prop
   */
  calculateAnimation(tick, target_animation, prop_chain, item, item_index) {
    const { start, end, from, to, easing: optional_easing } = target_animation;
    let target_prop = item;
    for (let i = 0; i < prop_chain.length; i++) {
      if (
        target_prop[prop_chain[i]] === undefined &&
        (target_prop.get === undefined ||
          target_prop.get(prop_chain[i]) === undefined) &&
        i != prop_chain.length - 1
      ) {
        console.error(`Object does not have property: ${prop_chain.join("-")}`);
        throw `Object does not have property: ${prop_chain.join("-")}`;
        console.trace();
      }
      if (i < prop_chain.length - 1) {
        // prevent losing reference
        target_prop =
          target_prop[prop_chain[i]] || target_prop.get(prop_chain[i]);
      }
    }

    const duration = end - start;
    const relative_tick = tick - start;
    let eval_from = from;
    let eval_to = to;
    if (_isFunction(from)) {
      eval_from = from(
        relative_tick,
        item,
        item_index,
        this.transition_duration
      );
    }
    if (_isFunction(to)) {
      eval_to = to(
        relative_tick,
        item,
        item_index,
        this.transition_duration,
        eval_from
      ); //additional param: eval_from
    }
    if (relative_tick === 0) {
      this.handleAssignMap(
        target_prop,
        prop_chain[prop_chain.length - 1],
        eval_from
      );
    } else {
      if (target_animation.hasOwnProperty("easing")) {
        if (_isFunction(optional_easing)) {
          this.handleAssignMap(
            target_prop,
            prop_chain[prop_chain.length - 1],
            optional_easing(
              relative_tick,
              eval_from,
              eval_to - eval_from,
              duration,
              item_index
            )
          );
        } else if (easing.hasOwnProperty(optional_easing)) {
          // Use built-in function.
          this.handleAssignMap(
            target_prop,
            prop_chain[prop_chain.length - 1],
            easing[optional_easing](
              relative_tick,
              eval_from,
              eval_to - eval_from,
              duration
            )
          );
        } else if (optional_easing === true) {
          this.handleAssignMap(
            target_prop,
            prop_chain[prop_chain.length - 1],
            ((eval_to - eval_from) / duration) * relative_tick + eval_from
          );
        } else if (optional_easing === false) {
          this.handleAssignMap(
            target_prop,
            prop_chain[prop_chain.length - 1],
            eval_to
          );
        } else {
          console.error("Defined easing does not match: function or string");
          throw "Defined easing does not match: function or string";
          console.trace();
        }
      } else {
        //use linear function.
        this.handleAssignMap(
          target_prop,
          prop_chain[prop_chain.length - 1],
          ((eval_to - eval_from) / duration) * relative_tick + eval_from
        );
      }
    }
    if (Number.isNaN(target_prop[prop_chain[prop_chain.length - 1]])) {
      console.error(target_prop, val);
      throw "nan";
      console.trace();
    }
  }

  toString() {
    return this.name;
  }
}

module.exports = Note;
