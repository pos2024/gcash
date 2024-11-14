
import React from 'react';
import MainNavigation from '../component/MainNavigation';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className='flex bg-[#e4e4e4]'>
      <MainNavigation />
      <Outlet />
    </div>
  );
};

export default Layout;
