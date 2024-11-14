
import React from 'react';
import { createBrowserRouter, RouterProvider, Route } from 'react-router-dom';
import Home from './component/Home';
import Register from './component/Register';
import Layout from './page/Layout';
import CustomerList from './component/CustomerList';
import Gcash from './gcash/gcash'
import TableView from './page/TableView';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />, 
    children: [
      {
        path: '/',
        element: <Home />, 
      },
      {
        path: '/register',
        element: <Register />, 
      },
      {
        path: '/tables',
        element: <TableView/>
      }
    ],
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} /> 
 
    </>
  );
}

export default App;
