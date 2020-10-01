import { Observable } from "rxjs";

function fromNewYoutubePlayer(element, videoId) {
  return new Observable(subscriber => {
    new YT.Player(element, {
      videoId,
      events: {
        onReady: playerEvent => {
          subscriber.next(playerEvent.target);
          subscriber.complete();
        }
      }
    });
  });
}

export default fromNewYoutubePlayer;
