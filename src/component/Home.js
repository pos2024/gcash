import React from 'react'
import Gcash from '../gcash/gcash'
import GcashPoints from './GcashPoints'

const Home = () => {
  return (
    <div className='flex justify-between space-x-2 m-auto'>
          <Gcash/>
          <GcashPoints/>
    </div>
  )
}

export default Home