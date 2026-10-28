import { useLayoutEffect, useRef } from 'react';
import { normalizeMobile } from '../../../shared/lead';
type Props={id:string;value:string;onChange:(value:string)=>void;invalid?:boolean;disabled?:boolean;describedBy?:string};
export function MobileInput({id,value,onChange,invalid,disabled,describedBy}:Props){
 const ref=useRef<HTMLInputElement>(null);const caret=useRef<number|null>(null);
 useLayoutEffect(()=>{if(caret.current!==null){ref.current?.setSelectionRange(caret.current,caret.current);caret.current=null;}},[value]);
 return <input ref={ref} id={id} type="tel" inputMode="numeric" autoComplete="tel-national" className="gv-input" value={value} disabled={disabled} aria-invalid={invalid} aria-describedby={describedBy}
 onChange={e=>{const raw=e.target.value;const position=e.target.selectionStart??raw.length;const clean=normalizeMobile(raw);caret.current=normalizeMobile(raw.slice(0,position)).length;onChange(clean);if(clean===value){e.target.value=clean;e.target.setSelectionRange(caret.current,caret.current);caret.current=null;}}}
 onPaste={e=>{e.preventDefault();const el=e.currentTarget;const start=el.selectionStart??value.length;const end=el.selectionEnd??start;const pasted=normalizeMobile(e.clipboardData.getData('text'),start===0&&end===value.length);const next=value.slice(0,start)+pasted+value.slice(end);caret.current=start+pasted.length;onChange(next);}}/>;
}
