import { SignJWT, jwtVerify } from 'jose';

// 환경변수에서 비밀키를 가져와 바이트 배열로 변환
const SECRET = new TextEncoder().encode(Bun.env.CLIENT_SECRET!);

export async function createToken(email: string, request: Request) {
  // 1. IP와 User-Agent(브라우저 정보) 추출
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const agent = request.headers.get('user-agent') || 'unknown';

  // 2. JWT 생성 (페이로드에 유저 정보 + 기기 정보 포함)
  const token = await new SignJWT({email, ip, agent })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h') // 수명은 2시간으로 설정
    .sign(SECRET);

  // 3. 보안 옵션을 먹인 HttpOnly 쿠키와 함께 응답 생성
  const headers = new Headers();
  headers.append(
    'Set-Cookie',
    `access_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=7200`
    // `access_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`
  );

  return headers;
}

function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  const matches = cookieHeader.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
//   console.log('getCookie matches: ', matches);
  return matches ? decodeURIComponent(matches[1]?.toString()!) : null;
}

type VerifyResult = {
    success: boolean,
    error?: string,
    email?: string,
}

export async function verifyToken(request: Request) : Promise<VerifyResult> {
    const token = getCookie(request, 'access_token');
    if (!token) {
        console.log('No token found in cookies.');
      return { success: false, error: '토큰이 없습니다.' };
    }
    try {
    // 2. JWT 서명 및 만료 시간 검증 (jose가 자동으로 위조 및 만료를 체크함)
    const { payload } = await jwtVerify(token, SECRET);

    // 3. 기기 정보 대조 (현재 요청의 브라우저 정보와 토큰 안의 정보 비교)
    const currentUa = request.headers.get('user-agent') || 'unknown';
    if (payload.agent !== currentUa) {
      return { success: false, error: '기기 정보가 일치하지 않습니다. (해킹 의심)' };
    }

    // 검증 완료 시 유저 데이터 반환
    return {
      success: true,
      email: payload.email as string,
    };
  } catch (err) {
    // 서명이 위조되었거나 만료 시간이 지난 경우 이리로 빠집니다.
    return { success: false, error: '유효하지 않거나 만료된 토큰입니다.' };
  }
  
}

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