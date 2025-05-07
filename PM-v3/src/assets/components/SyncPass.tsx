import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Peer from "peerjs";

function SyncPass() {
  const peerId: any = useRef(null);
  const remotePeerId:any = useRef(null);
  const peer: any = useRef(null);

  const navigate = useNavigate();
  const connect = () => {
    const input = document.getElementById("remoteId") as HTMLInputElement;
    remotePeerId.current=input.value
    const conn = peer.current.connect(remotePeerId.current);
    conn.on("open", () => {
      console.log("Connected to peer:", remotePeerId.current);

      conn.send({ type: "msg", data: `Hi my name is ${peerId.current}` }); // Fixed typo here
    });
    conn.on("data", (data: any) => {
      console.log(data);
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
      conn.on("open", () => {
        console.log("Incoming connection from:", conn.peer);
        conn.send({ type: "msg", data: `Hi my name is ${peerId.current}` }); // Fixed typo here
      });
      conn.on("data", (data: any) => {
        console.log(data);
      });
    });

    return () => {
      peer.current.destroy();
    };
  }, []);

  return (
    <>
      <button
        style={{ position: "absolute", top: "10px", left: "10px" }}
        onClick={() => navigate("/")}
      >
        Go back
      </button>
      <h2>Sync ID</h2>
      <input id="remoteId" type="text" />
      <button
        style={{ marginTop: "20px" }}
        onClick={() => {
          connect();
        }}
      >
        Connect
      </button>
    </>
  );
}

export default SyncPass;
