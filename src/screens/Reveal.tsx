import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { decodePayload, encodePayload } from '../lib/codec';
import { assign } from '../lib/assign';
import { getPartnerConnection } from '../lib/pairing';
import deckBasic from '../data/deck-basic.json';
import { photoStore } from '../lib/photoStore';
import { processImageFile } from '../lib/imageScale';

import sample1 from '../assets/samples/sample1.png';
import sample2 from '../assets/samples/sample2.png';
import sample3 from '../assets/samples/sample3.png';
import sample4 from '../assets/samples/sample4.png';
const SAMPLES = [sample1, sample2, sample3, sample4];

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
  const [showPhotoStep, setShowPhotoStep] = useState(false);
  const [, setPhotoTrigger] = useState(0);

  if (!data || !data.g || data.g.length === 0) {
    return (
      <div className="p-4 text-white min-h-screen bg-gray-900 flex flex-col items-center justify-center text-center">
        <p className="mb-2 text-xl font-bold">링크가 손상되었습니다</p>
        <p className="mb-6 text-gray-400">결과 확인 링크가 끊겼거나 잘못된 주소입니다. 호스트가 생성한 링크 전체를 다시 복사해주세요.</p>
        <a href="#/" className="px-6 py-2 bg-blue-600 rounded-lg text-white font-bold">홈으로 돌아가기</a>
      </div>
    );
  }

  const handleResult = (success: boolean) => {
    const newResults = [...results];
    newResults[currentIndex] = success;
    setResults(newResults);
    setShowPhotoStep(true);
  };

  const handleNextGuest = () => {
    setShowPhotoStep(false);
    if (currentIndex + 1 >= assignments.length) {
      const resultPayload = {
        p: data.p,
        g: data.g,
        s: data.s,
        r: results,
        c: data.c
      };
      navigate(`/result/${encodePayload(resultPayload)}`);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBack = () => {
    if (showPhotoStep) {
      setShowPhotoStep(false);
    } else if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowPhotoStep(false);
    }
  };

  const current = assignments[currentIndex];
  
  if (!current) return null;

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await processImageFile(file);
        photoStore.set(current.name, url);
        setPhotoTrigger(t => t + 1);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSamplePhoto = () => {
    const sample = SAMPLES[currentIndex % SAMPLES.length];
    photoStore.set(current.name, sample);
    setPhotoTrigger(t => t + 1);
  };

  const handleRemovePhoto = () => {
    photoStore.delete(current.name);
    setPhotoTrigger(t => t + 1);
  };

  const photoUrl = photoStore.get(current.name);

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
    <div className="p-4 text-white min-h-screen bg-gray-900 flex flex-col max-w-md mx-auto">
      <div className="w-full text-center py-2 bg-gray-800 text-gray-300 text-sm font-medium rounded mb-6">
        호스트는 한 명씩 임무 결과를 확인해주세요
      </div>
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
          <div className="p-4 bg-gray-800 border border-blue-500 rounded-lg text-center animate-fade-in">
            <h3 className="text-blue-400 font-bold mb-4">사실, 이 둘은 하나였습니다</h3>
            <div className="flex items-center justify-center gap-3 text-xl font-bold mb-4">
              <span>{partnerConnection.partnerName}</span>
              <div className="h-[2px] bg-blue-500 flex-1 max-w-[100px]"></div>
              <span>{current.name}</span>
            </div>
            <div className="text-gray-300 break-keep">
              {partnerConnection.linkText}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {!showPhotoStep ? (
          <div className="flex gap-3">
            <button
              onClick={() => handleResult(true)}
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-lg"
            >
              성공
            </button>
            <button
              onClick={() => handleResult(false)}
              className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-lg border border-gray-600"
            >
              실패
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 animate-fade-in">
            {photoUrl ? (
              <div className="flex flex-col items-center mb-4">
                <img src={photoUrl} alt="증거 사진" className="w-32 h-32 object-cover rounded-lg border-2 border-gray-600 mb-2" />
                <button onClick={handleRemovePhoto} className="text-red-400 text-sm font-bold">사진 삭제</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <label className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-center cursor-pointer">
                  증거 사진 찍기
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />
                </label>
                <button onClick={handleSamplePhoto} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold">
                  샘플 사진 사용
                </button>
              </div>
            )}
            
            <button
              onClick={handleNextGuest}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-lg mt-2"
            >
              다음으로
            </button>
          </div>
        )}
        
        {(currentIndex > 0 || showPhotoStep) && (
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
