import {
  concatMapTo,
  shareReplay,
  map,
  startWith,
  withLatestFrom,
  distinctUntilKeyChanged,
  concatMap,
  share,
  switchMap,
  switchMapTo,
  filter,
  takeUntil
} from "rxjs/operators";
import fromYoutubeApiScript from "./fromYoutubeApiScript";
import fromNewYoutubePlayer from "./fromNewYoutubePlayer";
import { fromEvent, combineLatest, partition, defer, timer } from "rxjs";

const playerElement = document.getElementById("youtubePlayer");
const videoId = "Nj2U6rhnucI";

const playerObservable = fromYoutubeApiScript().pipe(
  concatMapTo(fromNewYoutubePlayer(playerElement, videoId)),
  shareReplay(1)
);

const startInput = document.getElementById("start");
const endInput = document.getElementById("end");

const loopValues = combineLatest(
  fromEvent(startInput, "input").pipe(
    map(e => Number.parseFloat(e.target.value)),
    startWith(0)
  ),
  fromEvent(endInput, "input").pipe(
    map(e => Number.parseFloat(e.target.value)),
    startWith(0)
  )
).pipe(map(values => ({ start: values[0], end: values[1] })));

function validateLoop(loop, player) {
  return (
    Object.values(loop).every(
      val => val <= player.getDuration() && !isNaN(val)
    ) &&
    loop.start < loop.end &&
    loop.start >= 0
  );
}

const [validPlayerLoops, invalidPlayerLoops] = partition(
  loopValues.pipe(withLatestFrom(playerObservable)),
  ([loop, player]) => validateLoop(loop, player)
);

const loopButton = document.getElementById("loop");

validPlayerLoops.subscribe({
  next: () => {
    loopButton.disabled = false;
  }
});
invalidPlayerLoops.subscribe({
  next: () => {
    loopButton.disabled = true;
  }
});

const newPlayerLoops = fromEvent(loopButton, "click").pipe(
  withLatestFrom(validPlayerLoops, (_, playerLoop) => playerLoop),
  distinctUntilKeyChanged("0")
);

const playerStateChanges = playerObservable.pipe(
  concatMap(player => fromEvent(player, "onStateChange")),
  share()
);

const playerPlaybackRateChanges = playerObservable.pipe(
  concatMap(player => fromEvent(player, "onPlaybackRateChange")),
  share()
);

function getRemainingTime(loop, player) {
  return (
    (Math.max(loop.end - player.getCurrentTime(), 0) * 1000) /
    player.getPlaybackRate()
  );
}

newPlayerLoops
  .pipe(
    switchMap(([loop, player]) =>
      playerStateChanges.pipe(
        filter(e => e.data === YT.PlayerState.PLAYING),
        switchMapTo(
          playerPlaybackRateChanges.pipe(
            map(e => e.data),
            startWith(player.getPlaybackRate()),
            switchMapTo(
              defer(() => timer(getRemainingTime(loop, player))).pipe(
                map(() => [loop, player]),
                takeUntil(
                  playerStateChanges.pipe(
                    filter(e => e.data !== YT.PlayerState.PLAYING)
                  )
                )
              )
            )
          )
        )
      )
    )
  )
  .subscribe({
    next: ([loop, player]) => {
      player.seekTo(loop.start, true);
    }
  });

newPlayerLoops.subscribe({
  next: ([loop, player]) => {
    player.seekTo(loop.start, true);
  }
});
