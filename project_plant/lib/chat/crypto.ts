import "react-native-get-random-values";
import nacl from "tweetnacl";
import {
  decodeBase64,
  decodeUTF8,
  encodeBase64,
  encodeUTF8,
} from "tweetnacl-util";

export function generateKeyPair(): {
  publicKey: string;
  secretKey: string;
} {
  const kp = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(kp.publicKey),
    secretKey: encodeBase64(kp.secretKey),
  };
}

export function encryptDM(
  message: string,
  recipientPublicKeyB64: string,
  mySecretKeyB64: string,
): string {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageBytes = decodeUTF8(message);
  const encrypted = nacl.box(
    messageBytes,
    nonce,
    decodeBase64(recipientPublicKeyB64),
    decodeBase64(mySecretKeyB64),
  );
  if (!encrypted) {
    throw new Error("DM encryption failed");
  }
  const combined = new Uint8Array(nonce.length + encrypted.length);
  combined.set(nonce);
  combined.set(encrypted, nonce.length);
  return encodeBase64(combined);
}

export function decryptDM(
  ciphertextB64: string,
  senderPublicKeyB64: string,
  mySecretKeyB64: string,
): string | null {
  const data = decodeBase64(ciphertextB64);
  if (data.length < nacl.box.nonceLength) return null;
  const nonce = data.slice(0, nacl.box.nonceLength);
  const box = data.slice(nacl.box.nonceLength);
  const result = nacl.box.open(
    box,
    nonce,
    decodeBase64(senderPublicKeyB64),
    decodeBase64(mySecretKeyB64),
  );
  return result ? encodeUTF8(result) : null;
}

export function encryptGroup(
  message: string,
  groupKeyB64: string,
): string {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const messageBytes = decodeUTF8(message);
  const encrypted = nacl.secretbox(
    messageBytes,
    nonce,
    decodeBase64(groupKeyB64),
  );
  if (!encrypted) {
    throw new Error("Group encryption failed");
  }
  const combined = new Uint8Array(nonce.length + encrypted.length);
  combined.set(nonce);
  combined.set(encrypted, nonce.length);
  return encodeBase64(combined);
}

export function decryptGroup(
  ciphertextB64: string,
  groupKeyB64: string,
): string | null {
  const data = decodeBase64(ciphertextB64);
  if (data.length < nacl.secretbox.nonceLength) return null;
  const nonce = data.slice(0, nacl.secretbox.nonceLength);
  const box = data.slice(nacl.secretbox.nonceLength);
  const result = nacl.secretbox.open(box, nonce, decodeBase64(groupKeyB64));
  return result ? encodeUTF8(result) : null;
}
