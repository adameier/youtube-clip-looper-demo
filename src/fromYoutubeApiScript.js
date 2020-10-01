import { Observable } from "rxjs";
import addScript from "./addScript";

function fromYoutubeApiScript() {
  return new Observable(subscriber => {
    const scriptAdded = addScript("https://www.youtube.com/iframe_api");
    if (!scriptAdded) {
      window.onYouTubeIframeAPIReady = () => {
        window.youTubeIframeAPIReady = true;
        subscriber.next("ready");
        subscriber.complete();
      };
    } else if (window.youTubeIframeAPIReady) {
      subscriber.next("ready");
      subscriber.complete();
    } else {
      subscriber.error("YouTube API loaded without using this Observable.");
    }
  });
}

export default fromYoutubeApiScript;
