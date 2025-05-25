import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

import {
  createHashRouter as createRouter,
  RouterProvider,
} from "react-router-dom";

import App from './App.jsx'
import Home from './components/Home.jsx';
import Board from './components/Board.jsx';
import ShareTarget from './components/ShareTarget.jsx';

// https://github.com/vuejs/vue-router/issues/2125#issuecomment-519521424
if (window.location.search) {
  window.location.replace(
    window.location.pathname + window.location.hash + window.location.search
  );
}

const router = createRouter([
  // {
  //   path: "/",
  //   element: <Test />
  // }
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />
      },
      // {
      //   path: '/test',
      //   element: <Test />,
      // },
      {
        path: "/board/:board_id",
        element: <Board />
      },
      {
        path: "/share-target",
        element: <ShareTarget />
      }
    ]
  },
]);

registerSW({ immediate: true })


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
