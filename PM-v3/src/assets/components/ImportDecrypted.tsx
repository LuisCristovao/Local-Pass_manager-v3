import { useEffect, useState, useRef } from "react";
import * as DB from "../utils/dbUtils";
import * as Crypto from "../utils/cryptoUtils";
import { useNavigate } from "react-router-dom"; // Add this import
import InsertPassword from "./InsertPassword";

function ImportDecrypted() {
  const [state, setState] = useState("intro");
  const userPassRef = useRef<string>(""); // default value is an empty string
  const navigate = useNavigate();

  const [success, setSuccess] = useState<string>("nothing");

  

  /**
   * Replaces all occurrences of 'search' with 'replacement' inside 'str'.
   * This does not modify String.prototype. It works safely across all environments.
   *
   * @param str - The input string to operate on
   * @param search - The substring to find
   * @param replacement - The string to replace all found substrings with
   * @returns A new string with all occurrences replaced
   */
  const replaceAll = (
    str: string,
    search: string,
    replacement: string
  ): string => {
    return str.split(search).join(replacement);
  };

  /**
   * Converts a CSV string into an array of plain objects.
   * Encrypts each field using Crypto.encrypt(value, password).
   *
   * @param csv - The CSV input string
   * @param delimiter - The delimiter between fields
   * @param password - The password used for encrypting each field
   * @returns A Promise resolving to an array of encrypted objects
   */
  const csvToJson = async (
    csv: string,
    delimiter: string,
    password: string
  ): Promise<object[]> => {
    const normalizedCsv =
      delimiter !== "\t" ? replaceAll(csv, delimiter, "\t") : csv;

    const lines = normalizedCsv.trim().split("\n");

    const result = await Promise.all(
      lines.map(async (line) => {
        const values = line.split("\t").map((v) => v.trim());

        // Encrypt each value using the provided password
        const encryptedSite = await Crypto.encrypt(values[0] || "", password);
        const encryptedUser = await Crypto.encrypt(values[1] || "", password);
        const encryptedPass = await Crypto.encrypt(values[2] || "", password);
        const encryptedComments = await Crypto.encrypt(
          values[3] || "",
          password
        );

        return {
          site: encryptedSite,
          user: encryptedUser,
          pass: encryptedPass,
          comments: encryptedComments,
          timestamp: await Crypto.encrypt(Date.now().toString(), password),
          sync: await Crypto.sha256(
            "".concat(values[0]||"").concat(values[1]||"").concat(values[2]||"").concat(values[3]||"")
          ),
          is_deleted: await Crypto.encrypt("false", password),
        };
      })
    );

    return result;
  };

  const overwrite = async (raw_data: string) => {
    const delimiter = document.getElementById(
      "spliting character"
    ) as HTMLInputElement;
    if (raw_data !== "") {
      const json_data = csvToJson(
        raw_data,
        delimiter.value,
        userPassRef.current
      );
      const encrypted_data_json: any[] = await json_data;
      //clear db then append  records
      try {
        DB.clearDatabase();
        encrypted_data_json.forEach((record) => {
          DB.add(record);
        });

        return "success";
      } catch (err) {
        return "error";
      }
    }
    return "nothing";
  };

  const append = async (raw_data: string) => {


    const delimiter = document.getElementById(
      "spliting character"
    ) as HTMLInputElement;

    if (raw_data !== "") {
      const json_data = csvToJson(
        raw_data,
        delimiter.value,
        userPassRef.current
      );
      const encrypted_data_json: any[] = await json_data
      //append to the db the records
      try {
        encrypted_data_json.forEach((record) => {
          DB.add(record);
        });
        return "success";
      } catch (err) {
        return "error";
      }
    }
    return "nothing";
  };

  const renderSuccessMessage = () => {
    if (success === "success") {
      return <p>Success </p>;
    } else if (success === "error") {
      return <p>Error </p>;
    } else if (success === "nothing") {
      return null;
    } else {
      return null;
    }
  };

  //ONLY for development/debugging
  // if (typeof window !== "undefined") {
  //   (window as any).PM = { decryptedPasswords, Search };
  // }

  return state === "intro" ? (
    <InsertPassword userPassRef={userPassRef} setState={setState} />
  ) : (
    <>
      <button
        style={{ position: "absolute", top: "10px", left: "10px" }}
        onClick={() => {
          navigate("/");
        }}
      >
        Go back
      </button>
      <h1>Import Passwords</h1>
      <p>
        Data splitting character:{" "}
        <input
          id="spliting character"
          type="text"
          value="\t"
          style={{ width: "20px" }}
        />
      </p>
      <textarea
        id="import encrypted data"
        style={{
          height: "350px",
          width: "60%",
          maxWidth: "800px",
          minWidth: "300px",
          marginBottom: "20px",
          backgroundColor: "transparent",
          fontSize: "1.5em",
          color: "aliceblue",
        }}
        placeholder={`site1\tuser1\tpass1\toptional comments 1
site2\tuser2\tpass2\toptional comments 2`}
        defaultValue={`site1\tuser1\tpass1\toptional comments 1
site2\tuser2\tpass2\toptional comments 2`}
      ></textarea>
      <div
        style={{
          gap: "30px",
          display: "flex",
        }}
      >
        <button
          onClick={async () => {
            const textarea = document.getElementById(
              "import encrypted data"
            ) as HTMLTextAreaElement;
            const output = await overwrite(textarea.value);
            setSuccess(output);
          }}
        >
          Overwrite
        </button>
        <button
          onClick={async () => {
            const textarea = document.getElementById(
              "import encrypted data"
            ) as HTMLTextAreaElement;
            const output = await append(textarea.value);
            setSuccess(output);
          }}
        >
          Append
        </button>
      </div>
      {renderSuccessMessage()}
    </>
  );
}

export default ImportDecrypted;
