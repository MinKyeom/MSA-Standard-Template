// TODO: 문의 이메일을 실제 운영 메일로 확인·통일하세요 (현재: minkyeom@naver.com).
// Play Console URL: https://minkowskim.com/apps/office-animal-diagnosis/privacy

export const metadata = {
  title: "개인정보 처리방침 | 오피스 동물 진단",
  description:
    "모바일 앱 「오피스 동물 진단: 부하편 & 상사편」 전용 개인정보 처리방침입니다.",
  robots: { index: false, follow: false },
};

const CONTACT_EMAIL = "minkyeom@naver.com";
const UPDATED_AT = "2026-10-16";

const sectionStyle = { marginBottom: "28px" };
const h2Style = {
  fontSize: "1.2rem",
  marginBottom: "12px",
  color: "var(--color-text-main)",
  fontWeight: 700,
};
const pStyle = {
  color: "var(--color-text-sub)",
  lineHeight: 1.75,
  margin: "0 0 10px",
};
const ulStyle = {
  color: "var(--color-text-sub)",
  lineHeight: 1.75,
  margin: "0 0 10px",
  paddingLeft: "1.25rem",
};

export default function OfficeAnimalDiagnosisPrivacyPage() {
  return (
    <div
      lang="ko"
      className="container"
      style={{
        maxWidth: "720px",
        margin: "0 auto",
        padding: "40px 20px 64px",
      }}
    >
      <h1
        style={{
          marginBottom: "12px",
          color: "var(--color-text-main)",
          fontSize: "clamp(1.5rem, 4vw, 2rem)",
          lineHeight: 1.3,
        }}
      >
        개인정보 처리방침
      </h1>
      <p style={{ ...pStyle, marginBottom: "8px" }}>
        오피스 동물 진단: 부하편 &amp; 상사편
      </p>
      <p style={{ ...pStyle, marginBottom: "32px", fontSize: "0.95rem" }}>
        최종 업데이트: {UPDATED_AT}
        <br />
        본 문서는 minkowskim.com에 호스팅된{" "}
        <strong style={{ color: "var(--color-text-main)", fontWeight: 600 }}>
          앱 전용 개인정보 처리방침
        </strong>
        이며, 블로그 사이트 전역 방침(/privacy)과 별개입니다.
      </p>

      <section style={sectionStyle}>
        <h2 style={h2Style}>1. 운영자·앱 정보</h2>
        <ul style={ulStyle}>
          <li>앱명: 오피스 동물 진단: 부하편 &amp; 상사편 (짧게: 오피스 동물 진단)</li>
          <li>Android package: com.minkyeom.workplaceanimaldiagnosis</li>
          <li>
            운영 사이트:{" "}
            <a href="https://minkowskim.com/" style={{ color: "inherit" }}>
              https://minkowskim.com/
            </a>
          </li>
          <li>
            문의:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "inherit" }}>
              {CONTACT_EMAIL}
            </a>
          </li>
        </ul>
        <p style={pStyle}>
          앱 사용·정책 관련 문의는 위 이메일로 연락해 주세요.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>2. 수집하는 개인정보</h2>
        <ul style={ulStyle}>
          <li>회원가입·로그인·SNS 계정 연동을 제공하지 않습니다.</li>
          <li>
            이름, 이메일, 전화번호, 회사명, 직책, 정확한 위치 등 식별 가능한
            개인정보를 수집·전송하지 않습니다.
          </li>
          <li>
            진단 응답·결과는 기기 메모리(앱 세션)에서만 일시적으로 사용됩니다.
          </li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>3. 기기 권한</h2>
        <ul style={ulStyle}>
          <li>
            위치, 연락처, 마이크, 카메라, 광고 ID 등 불필요한 권한을 요청하지
            않습니다.
          </li>
          <li>
            결과 카드 이미지를 사진첩에 저장할 때만, 사용자가 선택한 경우에 한해
            사진 라이브러리/미디어 저장 권한을 요청할 수 있습니다.
          </li>
          <li>기존 사진을 읽거나 서버로 업로드하지 않습니다.</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>4. 데이터 이용·공유</h2>
        <ul style={ulStyle}>
          <li>서버 측에서 사용자 데이터를 수집하지 않습니다.</li>
          <li>분석 SDK·광고 SDK를 사용하지 않습니다.</li>
          <li>
            결과 공유는 OS 시스템 공유 시트를 통해, 사용자가 선택한 앱으로만
            전달됩니다.
          </li>
          <li>
            본 앱이 SNS 계정을 연동하거나 대리로 업로드하지 않습니다.
          </li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>5. 보관·삭제</h2>
        <ul style={ulStyle}>
          <li>
            진단 응답·결과는 기기에만 잠시 보관되며 서버에 저장되지 않습니다.
          </li>
          <li>
            「다시하기」 또는 앱 종료·삭제 시 세션 데이터는 삭제됩니다.
          </li>
          <li>
            서버 계정·프로필이 없어 별도 계정 삭제 절차는 필요하지 않습니다.
          </li>
          <li>
            사진첩에 저장한 이미지는 사용자가 기기에서 직접 삭제할 수 있습니다.
          </li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>6. 대상 연령·아동</h2>
        <ul style={ulStyle}>
          <li>성인·직장인 대상 엔터테인먼트로, 만 18세 이상을 대상으로 합니다.</li>
          <li>아동·청소년용으로 설계·마케팅하지 않습니다.</li>
          <li>아동으로부터 고의로 개인정보를 수집하지 않습니다.</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>7. 의료·상담 관련 고지</h2>
        <ul style={ulStyle}>
          <li>
            결과·리포트는 재미·자기 성찰용 엔터테인먼트이며, 의료 기기·진단·치료·심리
            상담·인사 평가를 대체하지 않습니다.
          </li>
          <li>
            건강·정신건강이 걱정되는 경우 전문 기관·상담사와 상담하시기 바랍니다.
          </li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>8. 이미지·오픈소스 고지</h2>
        <p style={pStyle}>
          동물 일러스트 등 서드파티 자산의 상세 라이선스는 앱 내 「오픈소스·출처」
          고지를 참고해 주세요.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>9. 문의·정책 변경</h2>
        <p style={pStyle}>
          문의:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "inherit" }}>
            {CONTACT_EMAIL}
          </a>
        </p>
        <p style={pStyle}>
          방침이 변경되는 경우 본 페이지의 업데이트 일자를 갱신합니다.
        </p>
      </section>
    </div>
  );
}
