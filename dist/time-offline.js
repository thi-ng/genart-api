"use strict";
(() => {
  // src/time/offline.ts
  var timeProviderOffline = (frameDelay = 250, referenceFPS = 60, frameOffset = 0) => {
    let frame = frameOffset;
    const frameTime = 1e3 / referenceFPS;
    return {
      start() {
        frame = frameOffset;
      },
      next(fn) {
        setTimeout(fn, frameDelay);
      },
      now() {
        return [frame * frameTime, frame];
      },
      tick() {
        return [++frame * frameTime, frame];
      }
    };
  };
})();
