export interface IGuestureEventCallbacks {
  seekEventFired: () => void,
  volumeEventFired: (volume: number) => void,
  brightnessEventFired: (birghtness: number) => void
  volumeVisibilityEvent: (visible: boolean) => void
  brightnessVisibilityEvent: (visible: boolean) => void

}