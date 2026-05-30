import { verifyToken } from "./src/lib/jwt";
process.env.TZ = "Asia/Seoul";

const router = new Bun.FileSystemRouter({
  style: "nextjs", // Next.js 스타일의 라우팅 규칙 사용 (/api/users 형태)
  dir: process.cwd() + '/api',
});

console.log("자동으로 등록된 라우트 리스트:");
console.log(router.routes);

const server = Bun.serve({
  port: 3443,
  tls: {
    cert: Bun.file("./certs/fullchain.pem"),  
    key: Bun.file("./certs/privkey.pem"),
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
    if(url.pathname === "/favicon.ico") {
      // return new Response(Bun.file("/favicon.ico"));
      return new Response(null, { status: 204 });
    }

    // 로그인 상태가 아니면 로그인 페이지로 리디렉션
    const verifyResult = await verifyToken(req);
    // if(url.searchParams.get("login") === "success"){
    
      // 쿠키가 등록 되는 와중이라고 치고 한번 그냥 보낸다~
    // }else{
      if (!verifyResult.success && url.pathname !== "/login") {
        
        console.log('인증 실패:', verifyResult.error);
        const previousUrl = url.pathname + url.search; // 현재 요청 URL을 저장
        return Response.redirect("/login?prev=" + encodeURIComponent(previousUrl)); // 로그인 페이지로 리디렉션하면서 이전 URL을 쿼리 파라미터로 전달
      }
    // }

    const matchPath = router.match(url.pathname);
    console.log("매칭된 라우트 핸들러:", matchPath);

    if (matchPath) {
      const module = await import(matchPath.filePath);
      const method = req.method; // GET, POST 등

      // 5. 요청된 HTTP 메서드와 일치하는 함수가 파일 내에 존재하면 실행
      if (typeof module[method] === "function") {
        return module[method](req);
      }
      
      return new Response(`Method ${method} Not Allowed`, { status: 405 });
    }

    return new Response("hello world~ wellcome to Bun!", { status: 200 });
  },
  error(error) {
    // 에러 발생 시 공통 처리 로직
    return new Response(`서버 에러 발생: ${error.message}`, { status: 500 });
  },
});

console.log(`Server running at ${server.url}`); 