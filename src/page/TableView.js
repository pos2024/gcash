import React, { useState } from 'react';
import Total from '../gcash/Total'; // Ensure this path is correct
import FundsManagement from '../gcash/FundsManagement';
import Expenses from '../gcash/Expenses';
import Pending from '../gcash/Pending';
import DailyTransaction from '../gcash/DailyTransaction';

const TableView = () => {
  // Define the amount and fee here (or you can get these from props if needed)
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('');

  return (
    <div className='ml-48 bg-[#e4e4e4]'>
      {/* Pass the amount and fee as props to Total component */}
      <Total amount={amount} fee={fee} />
      <FundsManagement />
      <Expenses />
      <Pending />
    
    </div>
  );
};

export default TableView;
