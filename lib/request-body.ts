export class RequestBodyTooLargeError extends Error {
  constructor(){super('Request body exceeds the allowed byte limit.');this.name='RequestBodyTooLargeError';}
}

/** Bound memory before parsing JSON, including streamed bodies without Content-Length. */
export async function readLimitedText(request:Request,maxBytes:number):Promise<string>{
  const declared=request.headers.get('content-length');
  if(declared!==null&&/^\d+$/.test(declared)&&Number(declared)>maxBytes){
    void request.body?.cancel().catch(()=>{});
    throw new RequestBodyTooLargeError();
  }
  if(!request.body)return '';
  const reader=request.body.getReader(),decoder=new TextDecoder();
  let bytes=0,text='';
  try{
    for(;;){
      const {done,value}=await reader.read();
      if(done)return text+decoder.decode();
      bytes+=value.byteLength;
      if(bytes>maxBytes){
        void reader.cancel().catch(()=>{});
        throw new RequestBodyTooLargeError();
      }
      text+=decoder.decode(value,{stream:true});
    }
  }finally{reader.releaseLock();}
}
