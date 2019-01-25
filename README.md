# Keynotes

Scene based animation JS library

![Travis](https://travis-ci.com/chaht01/Keynotes.svg?branch=master)
[![npm](https://img.shields.io/badge/license-MIT-blue.svg)](https://www.npmjs.com/package/keynotes)
[![npm](https://img.shields.io/badge/version-1.0.0-green.svg)](https://www.npmjs.com/package/keynotes)

## What is Keynotes?

> Scene based animation JS library.

There are many ways to make animation with css, jquery, GSAP and etc.

However, as managing a bunch of target objects through your application, especially when you make animation scenes using aforementioned libraries, the application's complexity tremendously get larger and you app becomes more error prone.

Also, even if you already use some optimized animation library like GSAP, concurrently handling animation of objects is hardly managable.

Keynotes aims to separate those concerns from your storytelling routine. By processing your animation specification with Keynotes' animation timelines to each scene(called as Note) and shared object(called as NoteObject) through registered Notes. You don't have to worry with these terms and machnism. Let's get started with HOW TO USE.

## Wait! What does `scene` mean?

Different from traditional animation provided as video or gif, web, especially javascript, is able to handle user's events interactively. For example, in "Black Mirror: Bandersnatch", interactive movie by Netflix, each sub sequence provide some choices to proceed stories within many possibilities. This 'sub sequence' is same as `scene` in Keynotes. Makers and storytellers can plan and suggest choices within their animation sequences by `scene` notion in Keynotes. Thus, `scene` should guarantee not only that each animated object proceed its own motion through timeline but also the possibility of prescribing animation while waiting user's interruptions. Keynotes can rescue such problems!

## How to use: User scenario

> Let's assume that you want to animate a red ball 10px to right for 1 second. After then, you want to oscillate that ball by changing color from red to black waiting user's click event. With such click event, ball, regardless of its color, change as transparent within 2 second. The initial animation should start when page loaded.

### STEP1: Define Keynote & Note

Your story looks good to have two scene. The first one handles initial movement of red ball and the other one treats opacity of the ball.

Thus, let's define one global keynote and two notes as a whole like below.

```js
let keynote;

keynote = new Keynote(); // global keynote object

const noteFirst = keynote.addNote("noteFirst", {
  // options will be defined
});

const noteSecond = keynote.addNote("noteSecond", {
  // options will be defined
});
```

### STEP2: Register objects to Keynote

It is plausible you already specify your ball in many ways - by using html and css or canvas/WebGL. The only thing you need to do is register your object with name. `keynote` object will trace, reference and apply all objects' animation by name. Therefore, you should define **unique** name.

```js
// You can reference your object in many ways. Bottom is one of those cases.
let ball = document.getElementById("myBall");

// Register your item with unique name.
keynote.addNoteObject("ballToAnimate", ball);
```

### STEP3: Specifiy each scene's animation within registered objects

Now, let's specify animation!

```js
const noteFirst = keynote.addNote("noteFirst", {
  object_options: {
    ballToAnimate: {
      "style.marginLeft": [{ start: 0, end: 1, from: 0, to: 10 }],
      "style.backgroundColor": [
        {
          start: 1,
          end: -1,
          from: "rgba(255, 0, 0, 1)",
          to: function(time, ball, index, transition_duration) {
            const ratio = Math.cos(time);
            const next = 255 * ratio;
            return `rgba(${next}, 0, 0, 1)`;
          },
          easing: false
        }
      ]
    }
  }
});

const noteSecond = keynote.addNote("noteSecond", {
  object_options: {
    ballToAnimate: {
      "style.opacity": [{ start: 0, end: 2, from: 1, to: 0 }]
    }
  }
});
```

Let me know what each line means and functions. First, you should define your specification with object named as `object_options`. Then, the keynote reads along with registered objects' name. Any nested property of object can be represented with "`.` ". For example, if you'll change `ballToAnimate`'s width and the setter of that propery is `style.width`, you can define that with key `style.width` and array of values. In other case like using three.js, you can also specify your object's movement with key `position.x`.

The curious part is specifying values of array to each object setter. The meaning and signature of each terminologies are like below.

```js
{ // Signature of Segment
  start: Double,
  end: Double,
  from: Function|Any,
  to: Function|Any,
  easing: Function|Boolean
}
```

`start` and `end` are intuitively Double value. The very start of its note is defined as **0**. Thus, you don't have to calculate the absolute time through your whole application's animation.

`easing` is easing function which describe the aspect of animation. You can use one of predefined easing function from below. The default easing function is `linear`.

```
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,
  easeInSine,
  easeOutSine,
  easeInOutSine,
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,
  easeInElastic,
  easeOutElastic,
  easeInOutElastic,
  easeInBack,
  easeOutBack,
  easeInOutBack,
  easeInBounce,
  easeOutBounce,
  easeInOutBounce,
  linear
```

Also, you can use your own easing function which signature follow this.

```js
function yourEasingFunction (time, base, change, duration) // return double value.
```

The tricky but powerful feature is `from` and `to`. They support you to define the initial value(`from`) and destination value(`to`). However, `to` also can be used to describe the value during the animation from `start` to `end` duration. Therefore, belows are exatly same specification of animation.

```js
// Simplest
{
  start: 0,
  end: 1,
  from: 3,
  to: 5
}

// Using function
{
  start: 0,
  end: 1,
  from: 3,
  to: function(time, object, index, animation_duration) {
    return 5;
  }
}

// Thoroughly Customed
{
  start: 0,
  end: 1,
  from: 3,
  to: function(time, object, index, animation_duration) {
    // assume easing function imported
    return easing.linear(
      0, //start
      3, //base
      2, //change
      1 //duration
    )
  },
  easing: false
}
```

You may know easing can be defined as Boolean. If easing is defined as `false`, keynote calculate and call setter of each object immediately(without interpolate value from easing). The `true` means same as `linear` as well.

## Strength

Manually, it was able to code each object's animation using vanilla js, jqeury and GSAP. However, in case these animation settings are operated concurrently, the performance of animation frame rate rapidly slowed.

Keynotes' animation settings only requires each object's animation through timeline and optimally calculate each object's changes through given tick(time). From this easy settings, any object's changes can be defined, rendered and optimized thorugh single thread.

Also, Keynotes' powerful timeline based animation specificaiton can help you rewind and jump to any keynote easily. It is really powerful feature for storyteller to design, develope and test their ideas on web.

## Features

### Lifecycle Handling

Each Note has their own lifecycle and you can define one or more of them below.

- beforeBuild
- beforeAnimation
- afterAnimation
- afterDestroy

For example, if you want an object `A` visibility should be set as visible before animation but as hidden right before animating next Note,

```js
{
  ...some other specification,
  beforeAnimation(){
    A.style = "visiblity: visible";
  },
  afterDestory(){
    A.style = "visibility: hidden";
  }
}
```

### Ordering Notes for Storyteller

With each note's animation should be specified independently, predefining order of scenes can be powerful.

Let's take an example as you predefine notes' order like below.

```
[ Note A] -- [ Note B ] -- [ Note C ]
```

If animating note is `Note A` and user want to interrupt this animation to start `Note C` without losing animation context flow, Keynotes can help this user's concern. The only command user need is "Just start `Note C`". Smart Keynotes then process animation through `Note B` and `Note C` automatically within 1sec minimizing losing frame rate.

From this Powerful feature, it is also able to rewind animation with any given start point to end point. This animation structure satisfy storyteller's concern about navigation!

### Animation Expressiveness

The state of Note can be described as lifecycle mentioned above, but the mid of animation is more complex because of two state: (1) Directional and (2) Circular. Any animation can be classified by these criteria and thus, any NoteObject can be defined whether its animation is Directional or Circular. Keynotes supports this with easy rules.

### Object Sharing

In many cases, polluting namespace is not that good idea. Without solid frameworks, such concerns irritate developers incessantly. Keynotes support shared singletone namespace through Keynotes instance. Based on the assumption that any time(tick) is single, the idea sharing object through all notes from Keynotes instance is really powerful.

## How to use?

## How to contribute?
