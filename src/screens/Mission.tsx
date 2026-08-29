import { useParams, Link } from 'react-router-dom';
import { decodePayload } from '../lib/codec';
import { useState } from 'react';

interface MissionPayload {
  n: string;
  m: {
    id: string;
    text: string;
    difficulty: number;
  };
}

export default function Mission() {
  const { payload } = useParams<{ payload: string }>();
  const [flipped, setFlipped] = useState(false);

  const data = payload ? (decodePayload(payload) as MissionPayload | null) : null;

  if (!data || !data.n || !data.m) {
    return (
      <div className="p-4 text-white min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <p className="mb-4">잘못된 링크입니다.</p>
        <Link to="/" className="text-blue-400 underline">홈으로</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-sm text-center py-2 bg-gray-800 text-gray-300 text-sm font-medium rounded mb-6">
        당신의 임무를 확인하고 파티를 즐기세요
      </div>
      <h1 className="text-2xl font-bold mb-8">{data.n}님의 임무</h1>
      
      <div className="relative w-full max-w-sm h-64 [perspective:1000px]">
        <div 
          className={`transition-transform duration-500 w-full h-full [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}
        >
          {/* Front */}
          <div 
            className="absolute inset-0 [backface-visibility:hidden] bg-gray-800 rounded-xl flex flex-col items-center justify-center p-6 border border-gray-700 shadow-lg cursor-pointer"
            onClick={() => setFlipped(true)}
          >
            <p className="text-gray-400 mb-6 text-sm">터치하여 확인하세요</p>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold">확인했어요</button>
          </div>
          
          {/* Back */}
          <div 
            className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-blue-600 rounded-xl flex flex-col items-center justify-center p-6 shadow-lg cursor-pointer text-center"
            onClick={() => setFlipped(false)}
          >
            <p className="text-xl font-bold break-keep leading-relaxed">{data.m.text}</p>
          </div>
        </div>
      </div>

      <p className="text-gray-400 text-sm mt-8 text-center">
        이 임무는 당신 혼자만의 것이 아닐 수도 있습니다
      </p>
    </div>
  );
}
