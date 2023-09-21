import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { create as jwtCreate } from "https://deno.land/x/djwt@v2.9.1/mod.ts"

// export async function handler(event: FetchEvent): Promise<Response> {
//   const payload = { sub: "123", name: "John Doe" };
//   const secret = "myprojectjwtsecretkey";
//   const algorithm = "HS256";

//   const jwt = await jwtCreate(payload, secret, algorithm);

//   return new Response(jwt, {
//     headers: { "content-type": "text/plain", "Authorization": `Bearer ${jwt}` },
//   });
// }


// console.log("ANON AUTH LOADED")
// serve(async (req) => {
//   console.log("TEST3")
//   const { name } = await req.json()
//   const data = {
//     message: `Hello ${name}!`,
//   }

//   return new Response(
//     JSON.stringify(data),
//     { headers: { "Content-Type": "application/json" } },
//   )
// })

return new Response(JSON.stringify({test:'test'}))