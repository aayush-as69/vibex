"use client";
import {useEffect} from "react";
import {ShieldAlert} from "lucide-react";
export default function Error({error,reset}){
 useEffect(()=>{console.error(error)},[error]);
 return <main className="error-page"><ShieldAlert size={32}/><h1>Shield encountered an error.</h1><p>Nothing was submitted to the analysis engine. Try the check again.</p><button onClick={()=>reset()}>Try again</button></main>;
}