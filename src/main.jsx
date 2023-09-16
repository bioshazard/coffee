import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

import {
  createHashRouter as createRouter,
  RouterProvider,
} from "react-router-dom";

import App from './App.jsx'
import Home from './components/Home.jsx';
import Board from './components/Board.jsx';

const router = createRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: "/board/:id",
        element: <Board />
      }
    ]
  },
]);


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
