// app/privacy/page.jsx — 개인정보처리방침
export const metadata = {
  title: "개인정보처리방침",
  description:
    "MinKowskiM 블로그의 개인정보 수집·이용·보관 및 파기 방침입니다.",
};

export default function PrivacyPage() {
  return (
    <div className="container" style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ marginBottom: "24px", color: "var(--color-text-main)" }}>
        개인정보처리방침
      </h1>
      <p style={{ color: "var(--color-text-sub)", marginBottom: "32px" }}>
        MinKowskiM(&quot;블로그&quot;)은 이용자의 개인정보를 중요시하며, 관련 법령을 준수합니다.
      </p>

      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "12px", color: "var(--color-text-main)" }}>
          1. 수집하는 개인정보 항목
        </h2>
        <p style={{ color: "var(--color-text-sub)", lineHeight: 1.7 }}>
          회원가입·로그인·댓글 작성 시 아이디, 비밀번호, 이메일, 닉네임, IP 주소, 쿠키(세션·인증) 등을 수집할 수 있습니다.
          OAuth(Google, Kakao) 로그인 시 해당 서비스에서 제공하는 프로필 정보(이메일, 이름 등)를 수집할 수 있습니다.
        </p>
      </section>

      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "12px", color: "var(--color-text-main)" }}>
          2. 수집 목적
        </h2>
        <p style={{ color: "var(--color-text-sub)", lineHeight: 1.7 }}>
          회원 식별·인증, 서비스 제공·개선, 댓글 및 게시글 작성자 표시, 부정 이용 방지, 이메일 인증(회원가입 시) 등에 이용됩니다.
        </p>
      </section>

      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "12px", color: "var(--color-text-main)" }}>
          3. 보관 및 파기
        </h2>
        <p style={{ color: "var(--color-text-sub)", lineHeight: 1.7 }}>
          개인정보는 목적 달성 또는 이용자 탈퇴 후 지체 없이 파기하며, 관계 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관합니다.
          로그 기록·접속 IP 등은 일정 기간 보관 후 파기할 수 있습니다.
        </p>
      </section>

      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "12px", color: "var(--color-text-main)" }}>
          4. 제3자 제공 및 쿠키
        </h2>
        <p style={{ color: "var(--color-text-sub)", lineHeight: 1.7 }}>
          원칙적으로 이용자의 동의 없이 제3자에게 개인정보를 제공하지 않습니다.
          서비스 운영을 위해 쿠키(인증·세션 등)를 사용하며, 브라우저 설정에서 쿠키 거부가 가능합니다(일부 기능 제한될 수 있음).
        </p>
      </section>

      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "12px", color: "var(--color-text-main)" }}>
          5. 이용자 권리
        </h2>
        <p style={{ color: "var(--color-text-sub)", lineHeight: 1.7 }}>
          이용자는 자신의 개인정보 열람·정정·삭제·처리정지 요청 권리를 가집니다. 요청 시 지체 없이 조치하겠습니다.
        </p>
      </section>

      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "12px", color: "var(--color-text-main)" }}>
          6. 문의
        </h2>
        <p style={{ color: "var(--color-text-sub)", lineHeight: 1.7 }}>
          개인정보 처리에 관한 문의는 블로그 내 연락처 또는 관리자 채널을 통해 요청하실 수 있습니다.
        </p>
      </section>

      <p style={{ color: "var(--color-text-sub)", fontSize: "0.9em", marginTop: "32px" }}>
        시행일: 2025년 2월 (최종 수정 시 시행일을 갱신합니다.)
      </p>
    </div>
  );
}
