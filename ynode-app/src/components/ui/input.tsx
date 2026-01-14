import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-500 
                    outline-none ring-0 focus:ring-0 focus:outline-none focus:border-zinc-600 transition-all
                    autofill:bg-zinc-900 autofill:text-white
                    [&:-webkit-autofill]:!bg-zinc-900 
                    [&:-webkit-autofill]:!border-zinc-800
                    [&:-webkit-autofill]:!outline-none
                    [&:-webkit-autofill]:!ring-0
                    [&:-webkit-autofill]:!text-white 
                    [&:-webkit-autofill]:[-webkit-text-fill-color:white] 
                    [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_rgb(24_24_27)_inset]
                    [&:-webkit-autofill:hover]:[box-shadow:0_0_0_1000px_rgb(24_24_27)_inset]
                    [&:-webkit-autofill:focus]:[box-shadow:0_0_0_1000px_rgb(24_24_27)_inset]
                    [&:-webkit-autofill:focus]:!border-zinc-600
                    ${className || ''}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
