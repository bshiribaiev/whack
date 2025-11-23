import React from "react";
import ReactDOM from "react-dom/client";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./index.css";

import WalletContext from "./WalletContext.jsx";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <WalletContext>
    <App />
  </WalletContext>
);
