import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Peer from "peerjs";

function SyncPass() {
    
  const [peerId, setPeerId] = useState<string | null>(null);

  const navigate = useNavigate();

  return (
    <>
      <button
        style={{ position: "absolute", top: "10px", left: "10px" }}
        onClick={() => navigate("/")}
      >
        Go back
      </button>
      <h2>Sync ID</h2>
      <input type="text" />
    </>
  );
}

export default SyncPass;
