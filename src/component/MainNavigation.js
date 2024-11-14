// MainNavigation.js
import React from 'react';
import { Link } from 'react-router-dom';

const MainNavigation = () => {
  return (
    <nav className="bg-[#44abeb] text-white w-64 h-full min-h-screen fixed p-5">
      <h1 className="text-xl font-bold mb-4">Dashbold</h1>
      <ul className="space-y-2">
        <li>
          <Link to="/" className="block p-2 rounded hover:bg-[#5cc1ff]">Home</Link>
        </li>
        <li>
          <Link to="/register" className="block p-2 rounded hover:bg-[#5cc1ff]">Register</Link>
        </li>
        <li>
          <Link to="/tables" className="block p-2 rounded hover:bg-[#5cc1ff]">List</Link>
        </li>
        <li>
          <Link to="/" className="block p-2 rounded hover:bg-[#5cc1ff]">Use Reward</Link>
        </li>
      </ul>
    </nav>
  );
}

export default MainNavigation;
