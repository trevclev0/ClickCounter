import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { TouchApp } from '@mui/icons-material';

interface CounterButtonProps {
  count: number;
  onIncrement: () => void;
}

const CounterButton: FC<CounterButtonProps> = ({ count, onIncrement }) => {
  return (
    <div className="text-center">
      <div className="mb-3 text-3xl font-medium text-primary">
        {count}
      </div>
      <Button 
        onClick={onIncrement}
        className="flex items-center justify-center py-6 px-6 rounded-full"
      >
        <TouchApp className="h-5 w-5 mr-2" />
        <span>Click Me</span>
      </Button>
    </div>
  );
};

export default CounterButton;
