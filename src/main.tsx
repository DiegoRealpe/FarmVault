import { Amplify } from "aws-amplify";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import React from "react";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import outputs from "../amplify_outputs.json";
import App from "./App";
import { store } from "./app/store";
import "./index.css";

Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <Authenticator hideSignUp={true}>
        {({ user, signOut }) => (
          <BrowserRouter>
            <App user={user} onSignOut={() => signOut?.()} />
          </BrowserRouter>
        )}
      </Authenticator>
    </Provider>
  </React.StrictMode>
);
