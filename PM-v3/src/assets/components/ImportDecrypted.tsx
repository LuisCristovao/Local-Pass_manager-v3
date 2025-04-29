import { useEffect, useState, useRef } from "react";
import * as DB from "../utils/dbUtils";
import * as Crypto from "../utils/cryptoUtils";
import { useNavigate } from "react-router-dom"; // Add this import

function ImportDecrypted() {
  //ONLY for development/debugging
  // if (typeof window !== "undefined") {
  //   (window as any).PM = { decryptedPasswords, Search };
  // }
  const [state, setState] = useState("intro");
  const [passwords, setPasswords] = useState<Record<string, any>[]>([]);

  

  return <></>;
}

export default ImportDecrypted;
