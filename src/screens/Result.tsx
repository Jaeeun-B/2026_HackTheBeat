import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { decodePayload, encodePayload } from '../lib/codec';
import type { Mission } from '../lib/assign';
import { assign } from '../lib/assign';
import deckBasic from '../data/deck-basic.json';

export default function Result() {
  const { payload } = useParams<{ payload: string }>();

  const data = useMemo(() => {
    if (!payload) return null;
    return decodePayload(payload);
  }, [payload]);

  const assignments = useMemo(() => {
    if (!data || !data.g || !data.s) return [];
    return assign(data.g, deckBasic as any, data.s, data.c?.f);
  }, [data]);

  if (!data || !data.g || data.g.length === 0 || !data.r) {
    return (
      <div className="p-4 text-white min-h-screen bg-gray-900 flex flex-col items-center justify-center text-center">
        <p className="mb-2 text-xl font-bold">결과를 찾을 수 없습니다</p>
        <p className="mb-6 text-gray-400">파티 결과 데이터가 없거나 링크가 손상되었습니다.</p>
        <Link to="/" className="px-6 py-2 bg-blue-600 rounded-lg text-white font-bold">홈으로 돌아가기</Link>
      </div>
    );
  }

  // Calculate success rate
  const successCount = data.r.filter((success: boolean) => success).length;
  const totalCount = data.r.length;
  const successRate = Math.round((successCount / totalCount) * 100);

  // Calculate highest difficulty cleared
  let highestDiffGuest = null;
  let highestDiff = -1;
  data.r.forEach((success: boolean, index: number) => {
    if (success) {
      const difficulty = assignments[index]?.mission.difficulty || 0;
      if (difficulty > highestDiff) {
        highestDiff = difficulty;
        highestDiffGuest = assignments[index].name;
      }
    }
  });

  // Calculate failed missions
  const failedMissions: Mission[] = [];
  data.r.forEach((success: boolean, index: number) => {
    if (!success && assignments[index]) {
      failedMissions.push(assignments[index].mission);
    }
  });

  // Calculate completed pairs
  const completedPairsMap = new Map<string, {a: string, b: string, l: string}>();
  assignments.forEach((assignment, index) => {
    if (assignment.pairId && assignment.partnerIndex !== null) {
      const success = data.r[index];
      const partnerSuccess = data.r[assignment.partnerIndex];
      if (success && partnerSuccess) {
        const pairDef = deckBasic.pairs.find(p => p.pairId === assignment.pairId);
        if (pairDef && !completedPairsMap.has(assignment.pairId)) {
          completedPairsMap.set(assignment.pairId, {
            a: assignment.name,
            b: assignments[assignment.partnerIndex].name,
            l: pairDef.link
          });
        }
      }
    }
  });
  const completedPairsList = Array.from(completedPairsMap.values());

  // Generate carry over state
  const prevHistory = data.c?.h || [];
  const nextHistory = [...prevHistory, ...completedPairsList].slice(-3);
  
  const carryState = {
    f: failedMissions,
    h: nextHistory,
    g: data.g // to prepopulate the guest list
  };
  
  const carryPayload = encodePayload(carryState);
  const nextPartyLink = `/?c=${carryPayload}`;

  const shareLink = `${window.location.origin}${window.location.pathname}#/result/${payload}`;

  return (
    <div className="p-4 text-white min-h-screen bg-gray-900 flex flex-col max-w-md mx-auto">
      <div className="w-full text-center py-2 bg-gray-800 text-gray-300 text-sm font-medium rounded mb-6">
        결과를 확인하고 다음 파티를 준비하세요
      </div>
      <h1 className="text-2xl font-bold mb-6 text-center">{data.p || '파티'} 결과</h1>
      
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400">성공률</span>
          <span className="text-2xl font-bold text-blue-400">{successRate}% ({successCount}/{totalCount})</span>
        </div>
        {highestDiffGuest && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">최고 난이도 달성</span>
            <span className="font-bold text-blue-400">{highestDiffGuest}</span>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-3 text-gray-300">실패한 임무</h2>
        {failedMissions.length === 0 ? (
          <div className="text-gray-400 text-sm">모든 임무를 성공했습니다!</div>
        ) : (
          <ul className="list-disc pl-5 text-gray-300">
            {failedMissions.map((m, i) => (
              <li key={i} className="mb-1">{m.text}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-3 text-blue-400">완성된 연결</h2>
        {completedPairsList.length === 0 ? (
          <div className="text-gray-400 text-sm">완성된 연결이 없습니다.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {completedPairsList.map((pair, i) => (
              <div key={i} className="bg-gray-800 p-3 rounded-lg border border-blue-900">
                <div className="flex items-center justify-start gap-3 font-bold text-lg mb-2">
                  <span>{pair.a}</span>
                  <div className="h-[2px] bg-blue-500 flex-1 max-w-[40px]"></div>
                  <span>{pair.b}</span>
                </div>
                <div className="text-sm text-gray-300">{pair.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 mt-auto">
        <button 
          onClick={() => navigator.clipboard.writeText(shareLink)}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded font-bold"
        >
          결과 링크 복사하기
        </button>
        <Link 
          to={nextPartyLink}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded font-bold text-center text-lg"
        >
          다음 파티에서 이어하기
        </Link>
      </div>
    </div>
  );
}
