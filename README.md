# Keynotes

Javascript scene based animation library

![Travis](https://travis-ci.com/chaht01/Keynotes.svg?branch=master)
[![npm](https://img.shields.io/badge/license-MIT-blue.svg)](https://www.npmjs.com/package/keynotes)
[![npm](https://img.shields.io/badge/version-1.0.0-green.svg)](https://www.npmjs.com/package/keynotes)

## What is Keynotes?

> Javascript scene based animation library.

There are many ways to make specific animation from using css, jquery to GSAP and etc.

However, as managing a bunch of target object through whole your application, especially when you want to make animation scene using libraries given above, the complexity tremendously get larger and error prone.

Also, even if you already use some optimized animation library like GSAP, handling animating object parallel is hardly managable.

Keynotes aim to solve those problem with providing animation timeline to each scene(called as Note) and shared object(called as NoteObject) through registered Notes.

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

```
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
