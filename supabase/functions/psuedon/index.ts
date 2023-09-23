// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std/http/server.ts"
// import { create, sign } from "https://deno.land/x/djwt/mod.ts"
import { create, verify, getNumericDate, Payload, Header, decode } from "https://deno.land/x/djwt@v2.4/mod.ts";

console.log("Hello from Functions!")

async function supaJWT(payload: Payload, secret: string) {

  const encoder = new TextEncoder()
  var keyBuf = encoder.encode(secret);

  var key = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    {name: "HMAC", hash: "SHA-256"},
    true,
    ["sign", "verify"],
  ) 

  const algorithm = "HS256"

  const header: Header = {
    alg: algorithm,
    typ: "JWT",
    // foo: "bar"  // custom header
  };

  const jwt = await create(header, payload, key)

  // console.log(jwt);
  return jwt

  // create a different key to test the verifcation
  /*keyBuf = encoder.encode("TheWrongSecret");
  key = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    {name: "HMAC", hash: "SHA-256"},
    true,
    ["sign", "verify"],
  )
  */

  // try {
  //   const payload = await verify(jwt, key); 
  //     console.log("JWT is valid");
  //     console.log(payload);
  // }
  // catch(_e){
  //   const e:Error= _e;
  //   console.log(e.message);
  // }
}

serve(async (req) => {

  const headersJson = { "Content-Type": "application/json" }
  const headersCORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Expose-Headers": "Custom-Header-Name",
    "Access-Control-Request-Headers": "*"
  }

  // Handle OPTIONS 
  // ty https://stackoverflow.com/a/76171399/1446496
  // if (req.method === 'OPTIONS') {
  //   return new Response('ok', { headers: { ...headersCORS }, status: 200 })
  // }

  // https://stackoverflow.com/a/75126495/1446496
  if (req.method === "OPTIONS"){
    return new Response (null, {
      headers: {
        // "Access-Control-Allow-Origin": "*",
        // "Access-Control-Allow-Headers": "*", // <-- change here
        ...headersCORS
      }
    })
  }
  console.log(req.method)

  const origin = req.headers.get('Origin')
  console.log('origin is :', origin)
  // const { psuedonym } = await req.json()
  // return

  // const reader = req.body.getReader()
  // const body = await reader.read()
  // console.log(body)
  // return 

  // console.log(req.body.read())
  const { psuedonym } = await req.json()

  console.log('apikey: ', )

  // const [header, payload, signature] = decode(req.headers.get('apikey'));
  const apikeyParts = decode(req.headers.get('apikey'));
  // console.log("PAYLOAD", )

  // {:error, "Fields `role` and `exp` are required in JWT"}
  const payload: Payload = {
    ...apikeyParts[1],
    psuedonym
  };

  const secret = Deno.env.get('JWT_SECRET')
  const jwt = await supaJWT(payload, secret)
  console.log(jwt)


  const data = {
    message: `Hello ${psuedonym}!`,
    jwt
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...headersCORS, "Content-Type": "application/json" } },
  )
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
