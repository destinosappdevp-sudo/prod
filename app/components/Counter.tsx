"use client";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useState, useEffect } from "react";

function Counter({ 
  name, 
  value, 
  onChange 
}: { 
  name: string;
  value?: number;
  onChange?: (value: number) => void;
}) {
  const [amount, setAmount] = useState(value ?? 0);

  useEffect(() => {
    if (value !== undefined) {
      setAmount(value);
    }
  }, [value]);

  function incrase() {
    const newValue = amount + 1;
    setAmount(newValue);
    onChange?.(newValue);
  }

  function deincrase() {
    if (amount > 0) {
      const newValue = amount - 1;
      setAmount(newValue);
      onChange?.(newValue);
    }
  }

  return (
    <div className="flex items-center gap-x-4">
      <input type="hidden" name={name} value={amount} />
      <Button variant="outline" size="icon" type="button" onClick={deincrase}>
        <Minus className="h-4 w-4 text-primary" />
      </Button>
      <p>{amount}</p>
      <Button variant="outline" size="icon" type="button" onClick={incrase}>
        <Plus className="h-4 w-4 text-primary" />
      </Button>
    </div>
  );
}

export default Counter;
