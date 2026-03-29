"use client";

import { useEffect, useState } from "react";
import { fetchVisitStats, recordVisit } from "../../services/api/posts";

// 페이지 1회 방문당 카운트 1회만 기록 (동일 페이지 내 중복 컴포넌트 마운트 방지)
let hasRecordedVisitThisPageLoad = false;
let recordVisitPromise = null;

export default function VisitorStats({ className = "" }) {
  const [stats, setStats] = useState({ today: 0, total: 0 });

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      try {
        if (!hasRecordedVisitThisPageLoad) {
          hasRecordedVisitThisPageLoad = true;
          recordVisitPromise = recordVisit();
        }

        if (recordVisitPromise) {
          const recorded = await recordVisitPromise;
          if (!mounted) return;
          if (recorded?.today != null && recorded?.total != null) {
            setStats({
              today: Number(recorded.today || 0),
              total: Number(recorded.total || 0),
            });
          }
        }

        const data = await fetchVisitStats();
        if (!mounted) return;
        setStats({
          today: Number(data?.today || 0),
          total: Number(data?.total || 0),
        });
      } catch (error) {
        console.error("방문자 통계 로딩 실패:", error);
      }
    }

    loadStats();
    const timer = setInterval(loadStats, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className={className}>
      <span>Today: {stats.today.toLocaleString()}</span>
      <span>Total: {stats.total.toLocaleString()}</span>
    </div>
  );
}
