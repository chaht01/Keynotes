const _isFunction = require("lodash.isfunction");
const _isPlainObject = require("lodash.isplainobject");
const _isString = require("lodash.isstring");
const _find = require("lodash.find");
const binarySearch = require("./binarySearch");
const NoteObject = require("./NoteObject");
const Note = require("./Note");

class Keynotes {
  constructor() {
    // NOTE OBJECT
    this.note_objects = {};

    // NOTE
    this.notes = {};
    this.note_order = [];

    // CURSOR
    this.time = 0.0; // world time. constantly increase
    this.current_animation = {
      start_time: 0.0, // start time of current animation
      journey_extract_to: 2.0, // objective duration of journeys
      journey_duration: 0.0, // total duration of journeys
      journey_tree: [], // for binary search of journey tick
      journey: [], // journey list(Array of Note object)
      journey_segment_counter: [], // journey segment visit check
      forward: true, // only when if note is after of recent_note
      note: null, // target note
      lock: false, // prevent interruption
      recent_journey: null, // note destroied right before curr journey
      afterAnimation: function() {} // user define function
    };
    this.recent_note = null;
  }

  getNoteObject(name, raiseException = true) {
    if (this.note_objects.hasOwnProperty(name)) {
      return this.note_objects[name];
    } else {
      if (raiseException) {
        console.error(`note object not found: ${name}`);
        throw "note object not found";
        console.trace();
      } else {
        return null;
      }
    }
  }

  /**
   * ENROLL NOTE OBJECT TO KEYNOTE
   * @param {*} name
   * @param {Object|[Object]} object3D
   * @param {*} param2
   */
  addNoteObject(name, object3D) {
    if (this.getNoteObject(name, false) !== null) {
      console.error("duplicated note object name");
      throw "duplicated note object name";
      console.trace();
    } else {
      const new_noteobj = new NoteObject(name, object3D);
      this.note_objects[name] = new_noteobj;
      return new_noteobj;
    }
  }

  /**
   * ENROLL NOTE TO KEYNOTE
   * @param {*} note_name
   * @param {*} param1
   */
  addNote(note_name, { object_options, beforeBuild, afterDestroy }) {
    if (this.notes.hasOwnProperty(note_name)) {
      console.error("duplicated note name");
      throw "duplicated note name";
      console.trace();
    }
    const new_note = new Note(note_name, {
      object_options,
      beforeBuild,
      afterDestroy
    });
    this.notes[note_name] = new_note;
    return new_note;
  }

  /**
   * SET ORDER BETWEEN NOTES
   * @param {*} order
   */
  setNoteOrder(order) {
    if (
      !Array.isArray(order) ||
      order.filter(note => !(note instanceof NoteObject || _isString(note)))
        .length > 0
    ) {
      console.error(
        "Order should be passed as array of Note instance or note name(String)"
      );
      throw "Order should be passed as array of Note instance or note name(String)";
      console.trace();
    } else {
      // check if duplicate note name exist
      let note_count = {};
      this.note_order = order.map(noteStr_or_noteObj => {
        const notename = String(noteStr_or_noteObj);
        if (note_count.hasOwnProperty(notename)) {
          console.error("Given note name was duplicated in list");
          throw "Given note name was duplicated in list";
          console.trace();
        } else if (!this.notes.hasOwnProperty(notename)) {
          console.error("Given note name doesn't exist");
          throw "Given note name doesn't exist";
          console.trace();
        } else {
          note_count[notename] = 1;
          return this.findNoteByName(notename);
        }
      });
    }
  }
  startNote(noteStr_or_noteObj, options) {
    if (options === undefined || options === null || !_isPlainObject(options)) {
      this._startNote(noteStr_or_noteObj, {
        beforeAnimation: function() {},
        afterAnimation: function() {}
      });
    } else {
      if (!options.hasOwnProperty("beforeAnimation")) {
        options = { ...options, beforeAnimation: function() {} };
      }
      if (!options.hasOwnProperty("afterAnimation")) {
        options = { ...options, afterAnimation: function() {} };
      }
      this._startNote(noteStr_or_noteObj, options);
    }
  }
  _startNote(
    noteStr_or_noteObj,
    { beforeAnimation = function() {}, afterAnimation = function() {} }
  ) {
    const notename = String(noteStr_or_noteObj);
    const target_note = this.findNoteByName(notename);
    if (Array.prototype.indexOf.call(this.note_order, target_note) < 0) {
      console.error(
        "Requested Note was not registered. Call setNoteOrder before it."
      );
      throw "Requested Note was not registered. Call setNoteOrder before it.";
      console.trace();
    }

    if (this.current_animation.lock) {
      return false; // do nothing
    }

    if (this.recent_note === null) {
      // very first time to start note
      const next_idx = Array.prototype.indexOf.call(
        this.note_order,
        target_note
      );
      if (_isFunction(beforeAnimation)) {
        beforeAnimation();
      }

      this.current_animation = {
        ...this.current_animation,
        start_time: this.time,
        journey: [],
        journey_duration: 0,
        journey_tree: [],
        journey_segment_counter: [],
        forward: true,
        note: target_note,
        lock: true,
        afterAnimation
      };
      // But not update recent_note. recent_note only updated when note's animation ends.
    } else {
      const prev_idx = Array.prototype.indexOf.call(
        this.note_order,
        this.recent_note
      );
      const next_idx = Array.prototype.indexOf.call(
        this.note_order,
        target_note
      );
      let journey = [];
      let journey_segment_counter = [];
      const forward = prev_idx < next_idx;

      if (_isFunction(beforeAnimation)) {
        beforeAnimation();
      }

      if (forward) {
        // forward
        journey = this.note_order.filter(
          (note, idx) => prev_idx < idx && idx < next_idx
        );
        journey_segment_counter = journey.map(j => 0);
      } else {
        // Backward also when if prev_idx === next_idx
        journey = this.note_order
          .filter((note, idx) => next_idx <= idx && idx <= prev_idx)
          .reverse(); // reverse order
        journey_segment_counter = journey.map(j => 0);
      }
      this.current_animation = {
        ...this.current_animation,
        start_time: this.time,
        journey,
        ...this.calculateJourneyDuration(
          journey,
          this.current_animation.journey_extract_to
        ),
        journey_segment_counter,
        forward,
        note: target_note,
        lock: true,
        afterAnimation
      };
    }
  }

  calculateJourneyDuration(journey, journey_extract_to) {
    const journey_duration = journey.reduce(
      (acc, curr) => acc + curr.transition_duration,
      0
    );

    /**
     * For example, if each journey takes 3, 4, 9(sec).
     * Then, journey_duration must be calculated as 16(=3+4+9)
     * and according to objective journey traverse time(journey_extract_to=1.0),
     * each journey_duration_each should be reduced as 3/16, 4/16 and 9/16.
     */
    const journey_duration_each = journey.map(j => {
      return (j.transition_duration / journey_duration) * journey_extract_to;
    });

    /**
     * Using given journey_duration_each, we can get accumulated time portion like
     * [0, 3/16, 7/16, 16/16]
     */
    let journey_duration_each_acc = [0];
    for (let i = 0; i < journey_duration_each.length; i++) {
      journey_duration_each_acc.push(
        journey_duration_each_acc[i] + journey_duration_each[i]
      );
    }

    /**
     * For fast search of journey time, preprocessing each journey's start and end time within journey_extract_to
     */
    let journey_tree = [];
    for (let i = 0; i < journey_duration_each_acc.length - 1; i++) {
      journey_tree.push({
        start: journey_duration_each_acc[i],
        end: journey_duration_each_acc[i + 1]
      });
    }
    return {
      journey_duration,
      journey_tree
    };
  }

  findNoteByName(notename) {
    const ret = _find(this.notes, note => note.toString() === notename);
    if (ret === undefined) {
      console.error(
        `Note not found(${notename}). Check if it was made without Keynote object or mispell note name.`
      );
      throw `Note not found(${notename}). Check if it was made without Keynote object or mispell note name.`;
      console.trace();
    }
    return ret;
  }

  seekUntil(forward, note, tick, note_objects) {
    const segment_idx = note.getSegmentIdx(tick);
    if (forward) {
      for (let i = 0; i < segment_idx; i++) {
        if (note.segments[i].end == -1) break;
        note.seek(note.segments[i].end - 0.00001, note_objects);
      }
    } else {
      for (let i = note.segments.length - 1; i > segment_idx; i--) {
        if (note.segments[i].end == -1) continue;
        note.seek(note.segments[i].start, note_objects);
      }
    }
    note.seek(tick, note_objects);
  }

  visitUnprocessedSegmentsOfJourney(target_journey_idx) {
    let { forward, journey, journey_segment_counter } = this.current_animation;
    let new_journey_segment_counter = journey_segment_counter.slice();
    for (let i = 0; i < target_journey_idx; i++) {
      const segments_outof_terminate = journey[i].segments.filter(
        ({ end }) => end != -1
      );

      if (journey_segment_counter[i] < segments_outof_terminate.length) {
        this.seekUntil(
          forward,
          journey[i],
          forward ? journey[i].transition_duration - 0.00001 : 0,
          this.note_objects
        );
        new_journey_segment_counter[i] = segments_outof_terminate.length;
      }
    }
    this.current_animation.journey_segment_counter = new_journey_segment_counter; //update
  }

  render(time) {
    this.time = time;
    const {
      start_time,
      journey_extract_to,
      journey,
      journey_duration,
      journey_tree,
      journey_segment_counter,
      forward,
      note,
      lock,
      recent_journey,
      afterAnimation
    } = this.current_animation;
    const relative_tick = this.time - start_time;
    if (note === null || !(note instanceof Note)) {
      console.error("Animation target note should be Note instance");
      throw "Animation target note should be Note instance";
      console.trace();
    }
    if (!lock) {
      // must be after promised transition
      if (note !== recent_journey) {
        if (recent_journey instanceof Note) {
          recent_journey.seek(
            forward ? recent_journey.transition_duration - 0.00001 : 0, // (delta: -0.00001) for exclusive to end tick
            this.note_objects
          );
          recent_journey.afterDestroy(forward);
        }

        note.beforeBuild(forward);
        this.current_animation.recent_journey = note; // udpate to target note
      }
      note.seek(
        relative_tick - (journey.length > 0 ? journey_extract_to : 0.0), //offset
        this.note_objects
      );
    } else {
      if (journey.length > 0 && relative_tick <= journey_extract_to) {
        /**
         * IN JOURNEY
         * Using given journey_time_portion_acc, we are able to know which note relative tick should seek.
         * Also, recalculate tick as journey_tick according to direction(forward or backward) as relative_tick - journey_time_portion_acc[i]
         * and then multiply it with ratio(time lapse).
         *
         * FORWARD
         * For example, if relative tick is 0.5, it falls into third notes([7/16, 16/16]) and the journey tick reduced as
         * (1/2 - 7/16) * (16 / 1.0) = 1.(It means when relative tick is at 0.5, it calculated as 1sec after start third note.)
         *
         * BACKWARD
         * For example, if relative tick is 0.5, it falls into third notes([7/16, 16/16]) and the journey tick reduced as
         * 9(=target_journey.transition_duration) - (1/2 - 7/16) * (16 / 1.0) = 8.(It means when relative tick is at 0.5, it calculated as 1sec after start third note.)
         */
        const target_journey_idx = binarySearch(
          journey_tree,
          relative_tick,
          ({ start, end }, tick) => {
            if (start <= tick && tick <= end) {
              return 0;
            } else {
              if (tick < start) {
                return -1;
              } else {
                return 1;
              }
            }
          }
        );

        /**
         *  Check if target journey index jumped over some notes.
         *  In this case, calculate each one's segments props with its marginal tick
         *  (forward: end of semgnet / backward: start of segment).
         */
        if (
          (recent_journey instanceof Note &&
            recent_journey !==
              journey[target_journey_idx - (forward ? 1 : -1)]) ||
          target_journey_idx !== 0
        ) {
          // handle exception
          console.log(
            journey.map(j => j.name),
            recent_journey.name,
            target_journey_idx
          );
        } else {
        }

        // Calculate journey tick
        let journey_tick = 0.0;
        if (forward) {
          journey_tick =
            (relative_tick - journey_tree[target_journey_idx].start) *
            (journey_duration / journey_extract_to);
        } else {
          journey_tick =
            journey[target_journey_idx].transition_duration -
            (relative_tick - journey_tree[target_journey_idx].start) *
              (journey_duration / journey_extract_to);
        }

        // Cause requestanimationframe pass start and end point of each journey, precalculate this point.
        if (journey[target_journey_idx] !== recent_journey) {
          if (recent_journey instanceof Note) {
            //check if all journey_segemnt_count qualifies segments animations.
            recent_journey.seek(
              forward ? recent_journey.transition_duration - 0.00001 : 0, // (delta: -0.00001) for exclusive to end tick
              this.note_objects
            );
            recent_journey.afterDestroy(forward);
          }
          journey[target_journey_idx].beforeBuild(forward);
          this.current_animation.recent_journey = journey[target_journey_idx]; // udpate to target note
        }
        journey[target_journey_idx].seek(journey_tick, this.note_objects); // And then, calculate related to current journey_tick.
      } else {
        if (note !== recent_journey) {
          if (recent_journey instanceof Note) {
            recent_journey.seek(
              forward ? recent_journey.transition_duration - 0.00001 : 0, // (delta: -0.00001) for exclusive to end tick
              this.note_objects
            );
            recent_journey.afterDestroy(forward);
          }
          note.beforeBuild(forward);
          this.current_animation.recent_journey = note; // udpate to target note
        }
        // after journey and mid of target note's transition
        const target_note_tick =
          relative_tick - (journey.length > 0 ? journey_extract_to : 0.0);
        if (target_note_tick >= note.transition_duration) {
          this.recent_note = note;
          this.current_animation.lock = false; // release lock
          afterAnimation();
        }
        note.seek(
          target_note_tick, //offset
          this.note_objects
        );
      }
    }
  }
}

module.exports = Keynotes;
