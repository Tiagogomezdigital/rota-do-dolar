'use client';

import {createContext,useContext,useId,type ComponentProps,type ReactNode} from 'react';

const buttonBase="inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 h-9 px-4 py-2 has-[>svg]:px-3";
const buttonColors={
  default:'bg-primary text-primary-foreground hover:bg-primary/90',
  outline:'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
};

/** The quiz only needs ordinary buttons; its visual classes match the shared UI button. */
export function Button({className='',variant='default',type='button',...props}:ComponentProps<'button'>&{variant?:keyof typeof buttonColors}){
  return <button type={type} data-slot="button" data-variant={variant} data-size="default" className={`${buttonBase} ${buttonColors[variant]} ${className}`} {...props}/>;
}

export function Progress({className='',value=0,max=100,...props}:ComponentProps<'div'>&{value?:number|null;max?:number}){
  const limit=Number.isFinite(max)&&max>0?max:100;
  const current=typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=limit?value:null;
  const percent=current===null?0:current/limit*100;
  const state=current===null?'indeterminate':current===limit?'complete':'loading';
  return <div role="progressbar" aria-valuemax={limit} aria-valuemin={0} aria-valuenow={current??undefined} aria-valuetext={current===null?undefined:`${Math.round(percent)}%`} data-state={state} data-value={current??undefined} data-max={limit} data-slot="progress" className={`relative h-2 w-full overflow-hidden rounded-full bg-primary/20 ${className}`} {...props}>
    <div data-state={state} data-value={current??undefined} data-max={limit} data-slot="progress-indicator" className="h-full w-full flex-1 bg-primary transition-all" style={{transform:`translateX(-${100-percent}%)`}}/>
  </div>;
}

type RadioContextValue={name:string;value:string;disabled:boolean;onValueChange:(value:string)=>void};
const RadioContext=createContext<RadioContextValue|null>(null);
type RadioGroupProps=Omit<ComponentProps<'div'>,'onChange'|'children'>&{children:ReactNode;value:string;onValueChange:(value:string)=>void;disabled?:boolean;name?:string};

/** Native inputs retain arrow/Space/Tab behavior without a custom roving-focus runtime. */
export function RadioGroup({children,className='',value,onValueChange,disabled=false,name,onKeyDown,...props}:RadioGroupProps){
  const id=useId();
  return <RadioContext.Provider value={{name:name??id,value,onValueChange,disabled}}>
    <div role="radiogroup" aria-disabled={disabled||undefined} data-disabled={disabled?'':undefined} data-slot="radio-group" className={`grid gap-3 ${className}`} {...props} onKeyDown={event=>{
      onKeyDown?.(event);
      if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
      const input=event.target;
      if(!(input instanceof HTMLInputElement)||input.type!=='radio'||input.disabled||input.closest('[data-slot="radio-group"]')!==event.currentTarget)return;
      if(event.key==='Enter'){event.preventDefault();return;}
      const first=event.key==='Home'||event.key==='PageUp';
      const last=event.key==='End'||event.key==='PageDown';
      if(!first&&!last)return;
      event.preventDefault();
      const inputs=Array.from(event.currentTarget.querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)')).filter(item=>item.closest('[data-slot="radio-group"]')===event.currentTarget);
      // These navigation keys move focus only, matching the previous radio group.
      (first?inputs[0]:inputs[inputs.length-1])?.focus();
    }}>{children}</div>
  </RadioContext.Provider>;
}

type RadioItemProps=Omit<ComponentProps<'input'>,'type'|'name'|'value'|'checked'|'defaultChecked'|'onChange'>&{value:string};

export function RadioGroupItem({value,className='',disabled=false,...props}:RadioItemProps){
  const group=useContext(RadioContext);
  if(!group)throw new Error('RadioGroupItem must be rendered inside RadioGroup.');
  const checked=group.value===value;
  return <span className={`quiz-radio-control relative inline-flex size-4 shrink-0 ${disabled||group.disabled?'opacity-50':''}`}>
    <input type="radio" name={group.name} value={value} checked={checked} disabled={disabled||group.disabled} onChange={()=>group.onValueChange(value)} data-state={checked?'checked':'unchecked'} data-slot="radio-group-item" className={`quiz-radio-input aspect-square size-4 shrink-0 rounded-full border border-input text-primary shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 ${className}`} {...props}/>
    {checked&&<svg className="quiz-radio-indicator pointer-events-none absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 fill-primary" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>}
  </span>;
}
