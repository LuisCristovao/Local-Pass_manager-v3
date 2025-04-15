import { encrypt, decrypt, sha256 } from "../utils/cryptoUtils.ts";
import { useEffect } from "react";

const runCrypto = async () => {
  const password = "my-password";
  const secret = "Top Secret Data";

  const encrypted = await encrypt(secret, password);
  console.log("Encrypted:", encrypted);

  const decrypted = await decrypt(encrypted, password);
  console.log("Decrypted:", decrypted);

  const hash = await sha256(secret);
  console.log("SHA-256:", hash);
};

function ManagePasswords() {
  useEffect(() => {
    runCrypto();
  },[]);
  
  return (
    <>
      <h1>Manage Passwords</h1>
    </>
  );
}

export default ManagePasswords;
