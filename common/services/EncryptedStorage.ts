/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires */
import "../utils/crypto";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

import { SecureStorage, Storage } from "./Storage";

const JsonFormatter = {
  stringify(cipherParams: { ciphertext: any; any: string; salt: any; iv: any }) {
    const CryptoJS = require("crypto-js");
    // create json object with ciphertext
    const jsonObj: { ct: string; iv: string; s: string } = {
      ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64),
    } as { ct: string; iv: string; s: string };

    // optionally add iv or salt
    if (cipherParams.iv) {
      jsonObj.iv = cipherParams.iv.toString();
    }

    if (cipherParams.salt) {
      jsonObj.s = cipherParams.salt.toString();
    }

    // stringify json object
    return JSON.stringify(jsonObj);
  },
  parse(jsonStr: string) {
    const CryptoJS = require("crypto-js");

    // parse json string
    const jsonObj = JSON.parse(jsonStr);

    // extract ciphertext from json object, and create cipher params object
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct),
    });

    // optionally extract iv or salt
    if (jsonObj.iv) {
      cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv);
    }

    if (jsonObj.s) {
      cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s);
    }

    return cipherParams;
  },
};

export class EncryptedStorage {
  public static async getItem<I extends object>(
    key: string,
    options: SecureStore.SecureStoreOptions = {}
  ): Promise<I | null> {
    const secureKey = await SecureStorage.getItem(key, undefined, options);
    const encrypted = await Storage.getItem(key, undefined, { ignoreDataProcessing: true });

    if (!secureKey || !encrypted) {
      return null;
    }

    const CryptoJS = require("crypto-js");
    const raw = CryptoJS.AES.decrypt(encrypted, secureKey, { format: JsonFormatter }).toString(CryptoJS.enc.Utf8);

    return JSON.parse(raw) as I;
  }

  public static async setItem<I extends object>(
    key: string,
    value: I,
    options: SecureStore.SecureStoreOptions = {}
  ): Promise<void> {
    if (!value || !key) {
      return;
    }
    const CryptoJS = require("crypto-js");

    const secureKey = Crypto.randomUUID();
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(value), secureKey, { format: JsonFormatter }).toString();

    await Storage.setItem(key, encrypted, undefined, { ignoreDataProcessing: true });
    await SecureStorage.setItem(key, secureKey, options);
  }

  public static async removeItem(key: string, options: SecureStore.SecureStoreOptions = {}): Promise<void> {
    await SecureStorage.removeItem(key, options);
    await Storage.removeItem(key);
  }
}
