process.env.TZ = "Asia/Seoul";

import { verifyToken } from "./src/lib/jwt";
import { join } from "path";

const IS_DEV = process.env.NODE_ENV !== "production";
const CLIENT_ENTRY = join(process.cwd(), "src/page/index.tsx");
const DIST_DIR = join(process.cwd(), "dist");

// [핵심] 서버 구동 시 처음에 딱 한 번만 미리 빌드해 둠
async function buildClient() {
  await Bun.build({
    entrypoints: [CLIENT_ENTRY],
    outdir: DIST_DIR,
    minify: !IS_DEV, // 프로덕션 환경에서만 압축
  });
  console.log("📦 클라이언트 빌드 완료!");
}

await buildClient();

const apiRouter = new Bun.FileSystemRouter({
  style: "nextjs", // Next.js 스타일의 라우팅 규칙 사용 (/api/users 형태)
  dir: process.cwd() + '/src/api',
});

const pageRouter = new Bun.FileSystemRouter({
  style: "nextjs", // Next.js 스타일의 라우팅 규칙 사용 (/api/users 형태)
  dir: process.cwd() + '/src/page',
});  

const apiPrefix = "/api";
const pagePrefix = "/page";


console.log("자동으로 등록된 라우트 리스트:");
console.log(apiRouter.routes);
console.log(pageRouter.routes); 

const server = Bun.serve({
  port: 3443,
  tls: {
    cert: Bun.file("./certs/fullchain.pem"),  
    key: Bun.file("./certs/privkey.pem"),
  }, 

  // 토큰이 필요없는 요청들은 직접 라우트에 등록해서 빠르게 응답하도록 한다.
  routes: {
    "/dist/index.js": Bun.file("./dist/index.js"),
    "/favicon.ico": Bun.file("./favicon.ico"),
  },

  // routes: {
  //   // Static route for the root path
  //   "/": new Response("Hello, World! Welcome to Bun!"),

  //   // Static routes
  //   "/api/status": new Response("OK"),

  //   // Dynamic routes
  //   "/users/:id": req => {
  //     return new Response(`Hello User ${req.params.id}!`);
  //   },

  //   // Per-HTTP method handlers
  //   "/api/posts": {
  //     GET: () => new Response("List posts"),
  //     POST: async req => {
  //       const body = await req.json();
  //       return Response.json({ created: true, ...body });
  //     },
  //   },

  //   // Wildcard route for all routes that start with "/api/" and aren't otherwise matched
  //   "/api/*": Response.json({ message: "Not found" }, { status: 404 }),

  //   // Redirect from /blog/hello to /blog/hello/world
  //   "/blog/hello": Response.redirect("/blog/hello/world"),

  //   // Serve a file by lazily loading it into memory
  //   "/favicon.ico": Bun.file("./favicon.ico"),
  // },

  // 라우트에 걸리지 않으면 404 Not Found 응답을 반환하는 기본 핸들러
  async fetch(req, server) {
    console.log("\n", new Date().toLocaleString());   
    console.log(server.requestIP(req)?.address);

    const url = new URL(req.url);
    console.log("요청 URL:", url.pathname + url.search);
    // if(url.pathname === "/favicon.ico") {
    //   // return new Response(Bun.file("/favicon.ico"));
    //   return new Response(null, { status: 204 });
    // }

    // 로그인 상태가 아니면 로그인 페이지로 리디렉션
    const verifyResult = await verifyToken(req);
    // if(url.searchParams.get("login") === "success"){
    
      // 쿠키가 등록 되는 와중이라고 치고 한번 그냥 보낸다~
    // }else{
      if (!verifyResult.success && url.pathname !== "/api/login") {
        
        console.log('인증 실패:', verifyResult.error);
        const previousUrl = url.pathname + url.search; // 현재 요청 URL을 저장
        return Response.redirect("/api/login?prev=" + encodeURIComponent(previousUrl)); // 로그인 페이지로 리디렉션하면서 이전 URL을 쿼리 파라미터로 전달
      }
    // }
    console.log('인증 성공:', verifyResult.email);


    let matchPath;// = url. apiRouter.match(url.pathname);
    if (url.pathname.startsWith(apiPrefix)) {
      matchPath = apiRouter.match(url.pathname.slice(apiPrefix.length));
    }else if (url.pathname.startsWith(pagePrefix)) {
      matchPath = pageRouter.match(url.pathname.slice(pagePrefix.length));
      if(matchPath) {
        console.log("매칭된 페이지 라우트:", matchPath); 
        if (matchPath.name === "/"){
          return new Response(Bun.file(matchPath.filePath.replace(".tsx", ".html")), {
            headers: {
              "Content-Type": "text/html",
            },
          });        } 
      }
    }
     
    console.log("매칭된 라우트 핸들러:", matchPath); 

    if (matchPath) {
      const module = await import(matchPath.filePath);
      const method = req.method; // GET, POST etc.

      // 5. 요청된 HTTP 메서드와 일치하는 함수가 파일 내에 존재하면 실행
      if (typeof module[method] === "function") {
        return module[method](req);
      }
      
      return new Response(`Method ${method} Not Allowed`, { status: 405 });
    }

    return new Response("hello world~ wellcome to Bun! Copyright sixtick", { status: 200 });
  },
  error(error) {
    // 에러 발생 시 공통 처리 로직
    return new Response(`서버 에러 발생: ${error.message}`, { status: 500 });
  },
});

console.log(`Server running at ${server.url}`); 