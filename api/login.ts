import { getUserByEmail, createUser } from '../src/db/users';
import { createToken } from '../src/lib/jwt';

interface GoogleTokenResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
    id_token: string;
}

type UserInfo = {
     email: string,
    verified_email: boolean,
    name: string,
    given_name: string,
    family_name: string,
    picture: string
}

let prevUrl = "/";

export async function GET(req: Request) {
    const url = new URL(req.url);
    if (url.searchParams.has("prev")) {
        prevUrl = url.searchParams.get("prev")!;
    }
    console.log('Login API called. prevUrl: ', prevUrl);
    // 로그인 성공 후 리디렉션 되었을때
    if(url.searchParams.has("code")) {
        // return Response.redirect(process.env.GOOGLE_LOGIN_URL!);
        const code = url.searchParams.get("code")!;
        const clientId = process.env.CLIENT_ID!;
        const clientSecret = process.env.CLIENT_SECRET!;
        const redirectUri = process.env.REDIRECT_URI!;

        try {
            const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    code: code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri,
                    grant_type: "authorization_code",
                }),
            });

            if(!tokenResponse.ok) {
                console.error("Failed to fetch token. Status: ", tokenResponse.status);
                return new Response("Failed to fetch token", { status: 500 });
            }

            const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
            // access_token expires_in scope token_type id_token

            // const googleAccessToken = tokenData.access_token; // 마스터키 획득!
            const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
                headers: {
                Authorization: `Bearer ${tokenData.access_token}`, // 헤더에 마스터키를 실어 보냄
                },
            });

            const userData = (await userResponse.json()) as UserInfo;

            if (!userResponse.ok) {
                console.error("Failed to fetch user info. Status: ", userResponse.status);
                return new Response("Failed to fetch user info", { status: 500 });
            }

            console.log("Google user info: ", userData);
            // 먼저 사용자가 존재하는지 확인
            const existingUser = await getUserByEmail(userData.email);
            console.log('Existing user: ', existingUser);
            if (!existingUser || existingUser.length === 0) {
                // 사용자가 없으면 새로 생성
                console.log('Creating new user with email: ', userData.email);
                await createUser(userData.name, userData.email);
            }

            // return new Response('login success! ' + JSON.stringify(userData));
            // return new Response(`Hello ${userData.name}! Your email is ${userData.email}.`);

            // 로그인 성공

            // JWT 발급 (선택사항)
            const headers = await createToken(userData.email, req);
            console.log('prevUrl before redirect: ', prevUrl);
//             const separator = prevUrl.includes('?') ? '&' : '?';
// const secureRedirectUrl = `${prevUrl}${separator}login=success`;
            // headers.set("Location", secureRedirectUrl);
            headers.set("Location", prevUrl);
            console.log('Headers before redirect: ', headers);
            return new Response(null, {
    status: 302, // 브라우저에게 이동 명령
    headers: headers // 쿠키(Set-Cookie)와 목적지(Location)가 모두 안전하게 포함됨
});
            // return Response.redirect(prevUrl, {status : 302, headers }); // 홈으로 리디렉션하면서 JWT 쿠키를 함께 보냄

        } catch (error) {
            console.error('Error fetching token:', error);
        }
    }

    // const key = new TextEncoder().encode(process.env.CLIENT_SECRET);

    // console.log('req.url: ',  req.url);
    // console.log('new URL(req.url): ', new URL(req.url));
    // console.log('google login url: ', process.env.GOOGLE_LOGIN_URL);

    // console.log('params: ', url.searchParams);

    // return new Response(`Hello from GET /api/login!`);


    // code 가 없는 상황. 리디리렉트가 아니고 로그인 요청일때
    return Response.redirect(process.env.GOOGLE_LOGIN_URL!);
}







/*
https://dev.sixtick.net:3443/login?iss=https%3A%2F%2Faccounts.google.com&code=4%2F0AeoWuM-ZDwNY-7ezvHVRY71p2BqaKis7hKlt3XC15lANji3fGDf8Zq6uAIARW2y5sfCgUQ&scope=email+profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+openid&authuser=0&prompt=consent
*/




/*
import { SignJWT } from 'jose';

// 환경변수에서 비밀키를 가져와 바이트 배열로 변환
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function handleLoginSuccess(userId: number, email: string, request: Request) {
  // 1. IP와 User-Agent(브라우저 정보) 추출
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const ua = request.headers.get('user-agent') || 'unknown';

  // 2. JWT 생성 (페이로드에 유저 정보 + 기기 정보 포함)
  const token = await new SignJWT({ userId, email, loginIp: ip, loginUa: ua })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h') // 수명은 2시간으로 설정
    .sign(SECRET);

  // 3. 보안 옵션을 먹인 HttpOnly 쿠키와 함께 응답 생성
  const headers = new Headers();
  headers.append(
    'Set-Cookie',
    `access_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`
  );

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers,
  });
}
*/

// /*
// import { jwtVerify } from 'jose';

// const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// // 쿠키 문자열에서 특정 쿠키 값을 파싱하는 함수
// function getCookie(request: Request, name: string): string | null {
//   const cookieHeader = request.headers.get('Cookie');
//   if (!cookieHeader) return null;
//   const matches = cookieHeader.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
//   return matches ? decodeURIComponent(matches[1]) : null;
// }

// export async function authenticateRequest(request: Request) {
//   // 1. 쿠키에서 토큰 추출
//   const token = getCookie(request, 'access_token');
//   if (!token) {
//     return { success: false, error: '토큰이 없습니다.' };
//   }

//   try {
//     // 2. JWT 서명 및 만료 시간 검증 (jose가 자동으로 위조 및 만료를 체크함)
//     const { payload } = await jwtVerify(token, SECRET);

//     // 3. 기기 정보 대조 (현재 요청의 브라우저 정보와 토큰 안의 정보 비교)
//     const currentUa = request.headers.get('user-agent') || 'unknown';
//     if (payload.loginUa !== currentUa) {
//       return { success: false, error: '기기 정보가 일치하지 않습니다. (해킹 의심)' };
//     }

//     // 검증 완료 시 유저 데이터 반환
//     return {
//       success: true,
//       user: {
//         userId: payload.userId,
//         email: payload.email,
//       },
//     };
//   } catch (err) {
//     // 서명이 위조되었거나 만료 시간이 지난 경우 이리로 빠집니다.
//     return { success: false, error: '유효하지 않거나 만료된 토큰입니다.' };
//   }
// }
// */



