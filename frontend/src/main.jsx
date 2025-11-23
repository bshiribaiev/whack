import React from "react";
import ReactDOM from "react-dom/client";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./index.css";

import WalletContext from "./WalletContext.jsx";
import App from "./App.jsx";
import { Buffer } from 'buffer';
window.Buffer = Buffer;

ReactDOM.createRoot(document.getElementById("root")).render(
  <WalletContext>
    <App />
  </WalletContext>
);
