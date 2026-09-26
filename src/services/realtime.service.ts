// Whether the realtime socket is up: the list/detail hooks poll only as a fallback.
let connected = false;

export const setRealtimeConnected = (value: boolean) => {
  connected = value;
};

export const isRealtimeConnected = () => connected;

/** Poll interval for a view with running jobs: fast without the socket, slow safety net with it. */
export const activeJobPollMs = () => (connected ? 30_000 : 5_000);
