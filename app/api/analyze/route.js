import {NextResponse} from "next/server";
import {analyze} from "../../../lib/risk-engine.js";
export async function POST(request){
 try{const body=await request.json();return NextResponse.json({ok:true,result:analyze(body.input,body.type)});}
 catch(error){return NextResponse.json({ok:false,error:error.message||"Unable to analyze input."},{status:400});}
}