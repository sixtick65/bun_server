export function GET(req: Request) {
    const headers = new Headers();
  
  // 핵심: access_token의 만료 시간(Max-Age)을 0초로 세팅하여 브라우저가 즉시 삭제하도록 유도
  headers.append(
    'Set-Cookie',
    'access_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
  );

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers,
  });
}