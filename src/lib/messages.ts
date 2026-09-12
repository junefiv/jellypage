/** UI copy — buttons stay in `copy`; everything else is Korean here. */
export const msg = {
  signInColorMatch: "로그인을 하면 비슷한 색감의 사진을 찾을 수 있습니다.",
  signInMatchDm: "매치 · DM · 로그인",
  dateHexPlaceholder: "날짜 / HEX",
  unpaid: "미결제",
  noSavedTakes: "저장된 TAKE 없음",
  saveAlbumSignIn: "앨범 저장 · 비슷한 색 찾기 · 로그인",
  local: "로컬",
  syncingAccount: "계정 동기화 중",
  authTitle: "로그인",
  emailPlaceholder: "이메일",
  sent: "전송됨",
  matchPublic: "매치 공개",
  following: (n: number) => `팔로잉  ${n}`,
  block: (n: number) => `차단  ${n}`,
  attachTake: (id: string) => `첨부 · TAKE ${id.slice(0, 8)}`,
  onboardingTag: "색 로그",
  takeFail: "촬영 실패",
  saveFail: "저장 실패",
} as const;

const ERR: Record<string, string> = {
  AUTH: "로그인 필요",
  TAKE: "촬영 실패",
  SAVE: "저장 실패",
  COPY: "복사 실패",
  PHOTO: "사진 없음",
  THREAD: "스레드 오류",
  GOOGLE: "Google 로그인 실패",
  TOKEN: "토큰 오류",
  IAP: "결제 실패",
  VERIFY: "검증 실패",
  IOS_STUB: "iOS 미지원",
  needs_unlock: "결제 필요",
  no_follow: "팔로우 필요",
  blocked: "차단됨",
  refunded: "환불됨",
  SELF: "본인에게 불가",
};

export function msgError(code: string) {
  return ERR[code] ?? code;
}
