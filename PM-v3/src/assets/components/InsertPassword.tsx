import {  useEffect, useState } from "react";
import * as DB from "../utils/dbUtils";
import * as Crypto from "../utils/cryptoUtils";
import "../css/ManagePasswords.css";
import { useNavigate } from "react-router-dom"; // Add this import

// Define the props interface
interface InsertPassword {
  userPassRef: React.RefObject<string>; // Adjust based on the ref's type
  setState: React.Dispatch<React.SetStateAction<string>>;
}

const InsertPassword: React.FC<InsertPassword> = ({
  userPassRef,
  setState,
}) => {
  const [passwords, setPasswords] = useState<Record<string, any>[]>([]);

  const [loading, setLoading] = useState(true);
  const [wrong_pass, setWrongPass] = useState(false);

  const fetchData = async () => {
    const data = await DB.load();
    setPasswords(data);
    setLoading(false);
  };

  const showPassword = (input_id: string) => {
    let input = document.getElementById(input_id) as HTMLInputElement;
    if (input.type == "password") {
      input.type = "text";
    } else {
      input.type = "password";
    }
  };
  const enterPassManager = async (password: string) => {
    userPassRef.current = password;

    const canAccess = await Crypto.canDecrypt(
      passwords[0].data,
      userPassRef.current
    );

    if (canAccess) {
      setState("manage");
    } else {
      console.warn("Wrong password");
      // Optional: show error to user
      setWrongPass(true);
      setTimeout(() => {
        setWrongPass(false);
      }, 1000);
    }
  };

  const navigate = useNavigate();

  //fetch encrypted DB
  useEffect(()=>{
    fetchData();
  },[])
  

  if (loading)
    return (
      <p
        style={{
          animation: "spin 1s linear infinite",
          display: "inline-block",
        }}
      >
        🔄 Loading...
      </p>
    );

  if (passwords.length === 0) {
    return (
      <>
        <button
          style={{ position: "absolute", top: "10px", left: "10px" }}
          onClick={() => navigate("/")}
        >
          Go back
        </button>
        <h2>No Passwords yet</h2>
        <input
          key={crypto.randomUUID()}
          id="pass"
          placeholder="Password"
          type="password"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const target = e.target as HTMLInputElement;
              userPassRef.current = target.value;
              setState("manage");
            }
          }}
        ></input>
        <p>
          show password:
          <input
            type="checkbox"
            onClick={() => {
              showPassword("pass");
            }}
          />
        </p>
      </>
    );
  }
  // already has password
  return (
    <>
      <button
        style={{ position: "absolute", top: "10px", left: "10px" }}
        onClick={() => navigate("/")}
      >
        Go back
      </button>
      <h2>Insert Master Password</h2>
      <input
        key={crypto.randomUUID()}
        id="pass"
        placeholder="Password"
        type="password"
        onKeyDown={async (e) => {
          if (e.key === "Enter") {
            const target = e.target as HTMLInputElement;
            enterPassManager(target.value);
          }
        }}
      ></input>
      <button
        onClick={() => {
          const password = document.getElementById("pass") as HTMLInputElement;
          enterPassManager(password.value);
        }}
      >
        Enter
      </button>
      <p>
        show password:
        <input
          type="checkbox"
          onClick={() => {
            showPassword("pass");
          }}
        />
      </p>
      {wrong_pass && <h3 style={{ color: "red" }}>Wrong Password!</h3>}
    </>
  );
};
export default InsertPassword;
