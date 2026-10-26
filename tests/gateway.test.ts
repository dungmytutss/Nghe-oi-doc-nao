import { afterEach, expect, test, vi } from 'vitest';
import worker, { type GatewayEnv } from '../gateway/worker';

const origin='https://school.example';
const code=`NGHE1-SB-C642891-HS01-B21-${'A'.repeat(32)}`;
function environment(): GatewayEnv {
  return { SUPABASE_URL:'https://project.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',
    STUDENT_GATEWAY_SECRET:'a'.repeat(64),ALLOWED_ORIGINS:origin,
    ENTRY_IP:{limit:vi.fn().mockResolvedValue({success:true})}, ENTRY_CODE:{limit:vi.fn().mockResolvedValue({success:true})},
    DEVICE:{limit:vi.fn().mockResolvedValue({success:true})}, TOTAL:{limit:vi.fn().mockResolvedValue({success:true})} };
}
function request(name:string, body:unknown, extra:Record<string,string>={}) {
  return new Request(`https://api.example/student/${name}`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1',...extra},body:JSON.stringify(body)});
}
afterEach(()=>vi.unstubAllGlobals());

test('gateway accepts only fixed student routes and strips client auth and gateway headers',async()=>{
  const env=environment(); const upstream=vi.fn().mockResolvedValue(new Response(JSON.stringify({student_id:'student'}),{status:200}));
  vi.stubGlobal('fetch',upstream);
  const result=await worker.fetch(request('redeem_student_code',{p_code:code},{Authorization:'Bearer attacker','x-nghe-gateway':'attacker'}),env);
  const init=upstream.mock.calls[0][1] as RequestInit;
  const headers=new Headers(init.headers);
  expect({status:result.status,path:String(upstream.mock.calls[0][0]),gateway:headers.get('x-nghe-gateway'),auth:headers.get('authorization'),
    noCache:result.headers.get('Cache-Control'),cors:result.headers.get('Access-Control-Allow-Origin')})
    .toEqual({status:200,path:'https://project.supabase.co/rest/v1/rpc/redeem_student_code',gateway:env.STUDENT_GATEWAY_SECRET,auth:null,noCache:'no-store',cors:origin});
});

test('invalid origin, unknown endpoint, oversized body and excess requests never reach Supabase',async()=>{
  const upstream=vi.fn();vi.stubGlobal('fetch',upstream);
  const env=environment();
  const badOrigin=await worker.fetch(request('read_student_device',{p_token:'b'.repeat(64)},{Origin:'https://attacker.example'}),env);
  const badRoute=await worker.fetch(request('rotate_student_code',{p_student_id:'other'}),env);
  const tooLarge=await worker.fetch(request('redeem_student_code',{p_code:'x'.repeat(524289)}),env);
  vi.mocked(env.ENTRY_IP.limit).mockResolvedValue({success:false});
  const throttled=await worker.fetch(request('redeem_student_code',{p_code:code}),env);
  expect({statuses:[badOrigin.status,badRoute.status,tooLarge.status,throttled.status],retry:throttled.headers.get('Retry-After'),upstreamCalls:upstream.mock.calls.length})
    .toEqual({statuses:[403,404,413,429],retry:'60',upstreamCalls:0});
});

test('unconfigured server secret fails closed and is never returned in error output',async()=>{
  const env=environment();env.STUDENT_GATEWAY_SECRET='';
  const result=await worker.fetch(request('redeem_student_code',{p_code:code}),env);
  expect({status:result.status,body:await result.json()}).toEqual({status:503,body:{code:'gateway_not_configured'}});
});

test('upstream redirects never forward the gateway credential or reach the client',async()=>{
  const upstream=vi.fn().mockResolvedValue(new Response(null,{status:302,headers:{Location:'https://attacker.example'}}));
  vi.stubGlobal('fetch',upstream);
  const response=await worker.fetch(request('read_student_device',{p_token:'b'.repeat(64)}),environment());
  expect({status:response.status,body:await response.json(),location:response.headers.get('Location'),
    redirect:(upstream.mock.calls[0][1] as RequestInit).redirect,calls:upstream.mock.calls.length})
    .toEqual({status:503,body:{code:'upstream_unavailable'},location:null,redirect:'manual',calls:1});
});
