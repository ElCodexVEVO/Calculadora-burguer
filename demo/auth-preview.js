// Solo DEMO_ACCESO.html. No accede a Supabase ni guarda una sesión real.
(()=>{
  const create=window.supabase.createClient;
  window.supabase.createClient=(...args)=>{
    const client=create(...args),wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    client.auth.getSession=async()=>({data:{session:null},error:null});
    client.auth.signInWithPassword=async({email,password})=>{
      await wait(800);
      if(email!=='demo@ejemplo.invalid'||password!=='demo')return{data:null,error:{message:'Credenciales de demo incorrectas'}};
      const user={id:'admin-1',email},session={user};window.fixture.authCallback?.('SIGNED_IN',session);
      return{data:{user,session},error:null};
    };
    const from=client.from;
    client.from=(table)=>{
      const query=from(table),then=query.then;
      query.then=async(resolve,reject)=>{await wait(350);return then(resolve,reject)};
      return query;
    };
    const rpc=client.rpc.bind(client);
    client.rpc=async(name,args)=>name==='resolve_login_email'?{data:args.p_username==='demo'?'demo@ejemplo.invalid':null,error:null}:rpc(name,args);
    return client;
  };
  document.getElementById('loginForm').querySelector('.muted').textContent='Vista de prueba. Usuario: demo · contraseña: demo.';
  document.getElementById('loginUsername').value='demo';
  document.getElementById('loginPassword').value='demo';
})();
