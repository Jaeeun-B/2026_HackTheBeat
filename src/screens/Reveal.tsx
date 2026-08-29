import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { decodePayload, encodePayload } from '../lib/codec';
import { assign } from '../lib/assign';
import { getPartnerConnection } from '../lib/pairing';
import deckBasic from '../data/deck-basic.json';

export default function Reveal() {
  const { payload } = useParams<{ payload: string }>();
  const navigate = useNavigate();

  const data = useMemo(() => {
    if (!payload) return null;
    return decodePayload(payload);
  }, [payload]);

  const assignments = useMemo(() => {
    if (!data || !data.g || !data.s) return [];
    return assign(data.g, deckBasic as any, data.s, data.c?.f);
  }, [data]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);

  if (!data || !data.g || data.g.length === 0) {
    return <div className="p-4 text-white min-h-screen bg-gray-900">잘못된 링크입니다.</div>;
  }

  const handleResult = (success: boolean) => {
    const newResults = [...results];
    newResults[currentIndex] = success;
    setResults(newResults);

    if (currentIndex + 1 >= assignments.length) {
      // Go to result screen
      const resultPayload = {
        p: data.p,
        g: data.g,
        s: data.s,
        r: newResults,
        c: data.c
      };
      navigate(`/result/${encodePayload(resultPayload)}`);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const current = assignments[currentIndex];
  
  if (!current) return null;

  // Check if partner is already revealed
  const conn = getPartnerConnection(assignments, currentIndex);
  let partnerConnection = null;
  if (conn) {
    const pairDef = deckBasic.pairs.find(p => p.pairId === conn.pairId);
    if (pairDef) {
      partnerConnection = {
        partnerName: conn.partnerName,
        linkText: pairDef.link
      };
    }
  }

  return (
    <div className="p-4 text-white min-h-screen bg-gray-900 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">결과 확인</h1>
        <div className="text-gray-400">
          {currentIndex + 1} / {assignments.length}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">{current.name}</h2>
          <div className="p-6 bg-gray-800 rounded-lg text-lg min-h-[120px] flex items-center justify-center break-keep">
            {current.mission.text}
          </div>
        </div>

        {partnerConnection && (
          <div className="p-4 bg-blue-900 border border-blue-500 rounded-lg text-center animate-fade-in">
            <h3 className="text-blue-300 font-bold mb-2">사실, 이 둘은 하나였습니다</h3>
            <div className="text-xl font-bold mb-2">
              {partnerConnection.partnerName} ↔ {current.name}
            </div>
            <div className="text-blue-100 break-keep">
              {partnerConnection.linkText}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <div className="flex gap-3">
          <button
            onClick={() => handleResult(true)}
            className="flex-1 py-4 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-lg"
          >
            성공
          </button>
          <button
            onClick={() => handleResult(false)}
            className="flex-1 py-4 bg-red-600 hover:bg-red-500 rounded-lg font-bold text-lg"
          >
            실패
          </button>
        </div>
        
        {currentIndex > 0 && (
          <button
            onClick={handleBack}
            className="py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold"
          >
            뒤로 가기
          </button>
        )}
      </div>
    </div>
  );
}
