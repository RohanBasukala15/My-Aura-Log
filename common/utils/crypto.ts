/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-var-requires */
if (typeof global.crypto !== "object") {
  // @ts-ignore
  global.crypto = {};
}

if (typeof global.crypto.getRandomValues !== "function") {
  // @ts-ignore
  global.crypto.getRandomValues = require("expo-crypto").getRandomValues;
}

if (typeof global.crypto.randomUUID !== "function") {
  // @ts-ignore
  global.crypto.randomUUID = require("expo-crypto").randomUUID;
}
