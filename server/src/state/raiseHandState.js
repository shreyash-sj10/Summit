// Centralized in-memory state for buzzer control.
// Keeping this module separate from server bootstrap avoids coupling route logic
// to the HTTP app entrypoint and makes state ownership explicit.
export const raiseHandAccessStore = new Map();
export const raiseHandWindowStore = new Map();
