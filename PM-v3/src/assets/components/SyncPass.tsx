import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Peer from "peerjs";
import InsertPassword from "./InsertPassword";
import * as DB from "../utils/dbUtils";
import * as Crypto from "../utils/cryptoUtils";

function SyncPass() {
  const [state, setState] = useState("intro");
  const peerId: any = useRef(null);
  const remotePeerId: any = useRef(null);
  const peer: any = useRef(null);
  const userPassRef = useRef("");

  const navigate = useNavigate();
  const connect = () => {
    const input = document.getElementById("remoteId") as HTMLInputElement;
    remotePeerId.current = input.value;
    const conn = peer.current.connect(remotePeerId.current);
    conn.on("open", async () => {
      console.log("Connected to peer:", remotePeerId.current);
      const data = await DB.load()  
      conn.send({ type: "msg", data: data }); // Fixed typo here
    });
    conn.on("data", (data: any) => {
      console.log(data);
      setState("connected");
    });
  };

  // Initialize PeerJS and handle connections
  useEffect(() => {
    peer.current = new Peer();

    peer.current.on("open", (id: string) => {
      peerId.current = id;
      console.log("My peer ID is: " + id);
    });

    peer.current.on("connection", (conn: any) => {
      conn.on("open", async () => {
        console.log("Incoming connection from:", conn.peer);
        remotePeerId.current = conn.peer;
        const data = await DB.load()
        conn.send({ type: "msg", data: data }); // Fixed typo here
      });
      conn.on("data", (data: any) => {
        console.log(data);
        setState("connected");
      });
    });

    return () => {
      peer.current.destroy();
    };
  }, []);

  return state === "intro" ? (
    <InsertPassword userPassRef={userPassRef} setState={setState} />
  ) : state === "manage" ? (
    <>
      <button
        style={{ position: "absolute", top: "10px", left: "10px" }}
        onClick={() => navigate("/")}
      >
        Go back
      </button>
      <h2 style={{ margin: "10px" }}>Sync ID: </h2>
      <p style={{ fontSize: "large", userSelect: "auto" }}>{peerId.current}</p>
      <input id="remoteId" type="text" placeholder="Insert remote sync ID" />
      <button
        style={{ marginTop: "20px" }}
        onClick={() => {
          connect();
        }}
      >
        Connect
      </button>
    </>
  ) : (
    state === "connected" && (
      <>
        <button
          style={{ position: "absolute", top: "10px", left: "10px" }}
          onClick={() => navigate("/")}
        >
          Go back
        </button>
        <h2>
          Connected with: <p>{remotePeerId.current}</p>
        </h2>
      </>
    )
  );
}

export default SyncPass;
