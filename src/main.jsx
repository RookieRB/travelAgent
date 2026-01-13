import ReactDOM from "react-dom/client";
import React from 'react';
import App from "./App.jsx";
import "./index.css";
import { Provider } from 'react-redux'; // 引入 Provider
import { store } from '@/store/store';    // 引入 store


ReactDOM.createRoot(document.getElementById("root")).render(
   <React.StrictMode>
    {/* 包裹 App */}
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
