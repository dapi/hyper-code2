const { dlopen, FFIType, ptr } = await import('bun:ffi');
const chunks=[];let size=0;for await(const chunk of Bun.stdin.stream()){size+=chunk.byteLength;if(size>8192)fail('INPUT_LIMIT');chunks.push(chunk)}
const input=JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
if(input.schema!=='r032-broker-request-v1')fail('SCHEMA');
const lib=dlopen('/usr/lib/system/libsystem_sandbox.dylib',{sandbox_check:{args:[FFIType.i32,FFIType.ptr,FFIType.i32,FFIType.ptr],returns:FFIType.i32}});
const check=lib.symbols.sandbox_check;
const denied=(op,type=0,value='')=>check(process.pid,ptr(Buffer.from(op+'\0')),type,ptr(Buffer.from(value+'\0')))===1;
const probes={
 networkOutbound:await pair(denied('network-outbound'),async()=>{const s=await Bun.connect({hostname:'127.0.0.1',port:9,socket:{data(){}}});s.end()}),
 networkBind:await pair(denied('network-bind'),async()=>{const s=Bun.serve({port:0,fetch:()=>new Response('x')});s.stop(true)}),
 outsideWrite:await pair(denied('file-write-create',1,input.outsideWrite),()=>Bun.write(input.outsideWrite,'x')),
 outsideRead:await pair(denied('file-read-data',1,input.outsideRead),()=>Bun.file(input.outsideRead).text()),
 nonBinaryExec:await pair(denied('process-exec',1,'/usr/bin/id'),()=>spawn(['/usr/bin/id'])),fork:await pair(denied('process-fork'),()=>spawn([input.selfExecutable,'--child'])),
 operatorHomeRead:{policyDenied:denied('file-read-data',1,input.operatorHomePath),behaviorAttempted:false},keychainRead:{policyDenied:denied('file-read-data',1,input.keychainPath),behaviorAttempted:false},
 securityd:{policyDenied:denied('mach-lookup',2,'com.apple.securityd'),behaviorAttempted:false},securitydXpc:{policyDenied:denied('mach-lookup',2,'com.apple.securityd.xpc'),behaviorAttempted:false},
};lib.close();if(!Object.values(probes).every(Boolean))fail('CONTAINMENT');
if(!Object.values(probes).every(p=>p.policyDenied&&(!('behaviorSucceeded'in p)||!p.behaviorSucceeded)))fail('CONTAINMENT');
if(Object.keys(process.env).sort().join(',')!=='HOME,PATH,R032_V63_CHILD,TMPDIR'||process.cwd()!=='/')fail('ENV_CWD');
const r=input.request;let reason=null;
if(!r.brokerAvailable)reason='broker-unavailable';else if(r.principalLabel==='missing')reason=`${r.phase}-context-missing`;else if(r.scope!=='privileged')reason=`${r.phase}-scope-deny`;else if(r.phase==='use'&&r.now>=r.expiresAt)reason='use-expired';else if(r.phase==='use'&&r.revoked)reason='use-revoked';else if(r.phase==='use'&&r.replayed)reason='use-replay';else if(r.phase==='use'&&r.generation!==r.expectedGeneration)reason='use-generation-stale';
const rootReceipt=!reason&&r.phase==='use'?{schema:'r032-root-v1',owner:`broker:${r.candidate}`,ordinal:1,invoked:true}:undefined;
const response={allow:!reason,reason:reason??`broker-${r.phase}-allow`,...(rootReceipt?{rootOrdinal:1}:{})};
process.stdout.write(JSON.stringify({schema:'r032-broker-response-v1',response,...(rootReceipt?{rootReceipt}:{}),containment:{schema:'r032-broker-containment-v1',passedBeforeRoot:true,childEnvKeys:Object.keys(process.env).sort(),childCwd:process.cwd(),probes,rootCalls:rootReceipt?1:0}})+'\n');
function fail(code){process.stderr.write(`R032_V63_BROKER_${code}\n`);process.exit(2)}
async function pair(policyDenied,action){let behaviorSucceeded=true;try{await action()}catch{behaviorSucceeded=false}return{policyDenied,behaviorSucceeded}}
async function spawn(argv){const p=Bun.spawn(argv,{stdin:'ignore',stdout:'ignore',stderr:'ignore'});await p.exited}
