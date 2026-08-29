import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import deckBasic from '../data/deck-basic.json';
import { assign } from '../lib/assign';
import { encodePayload, decodePayload } from '../lib/codec';

export default function Home() {
  const [searchParams] = useSearchParams();
  const carryState = useMemo(() => {
    const c = searchParams.get('c');
    if (!c) return null;
    return decodePayload(c);
  }, [searchParams]);

  const [partyName, setPartyName] = useState('');
  const [guestsInput, setGuestsInput] = useState(carryState?.g ? carryState.g.join('\n') : '');
  const [generated, setGenerated] = useState<{ name: string, link: string }[] | null>(null);
  const [revealLink, setRevealLink] = useState<string>('');
  
  const guests = useMemo(() => {
    return guestsInput.split(/[\n,]+/).map((g: string) => g.trim()).filter((g: string) => g.length > 0);
  }, [guestsInput]);

  const canCreate = guests.length >= 2;

  const handleCreate = () => {
    if (!canCreate) return;
    
    const seed = Date.now();
    // Generate assignments
    const assignments = assign(guests, deckBasic as any, seed, carryState?.f);
    
    // Create guest links
    const guestLinks = assignments.map(a => {
      const guestPayload = {
        n: a.name,
        m: a.mission
      };
      const hash = encodePayload(guestPayload);
      const url = `${window.location.origin}${window.location.pathname}#/m/${hash}`;
      return { name: a.name, link: url };
    });
    
    // Create reveal link
    const hostPayload = {
      p: partyName,
      g: guests,
      s: seed,
      ...(carryState ? { c: carryState } : {})
    };
    const rHash = encodePayload(hostPayload);
    // The reveal link format required by the requirements might be different, but for now we just keep the hash routing.
    const rUrl = `${window.location.origin}${window.location.pathname}#/reveal/${rHash}`;
    
    setGenerated(guestLinks);
    setRevealLink(rUrl);
  };

  const handleDemo = () => {
    const demoGuests = ["민서", "지호", "은우", "하린"];
    const seed = Date.now();
    const assignments = assign(demoGuests, deckBasic as any, seed, []);
    
    const guestLinks = assignments.map(a => {
      const guestPayload = { n: a.name, m: a.mission };
      const hash = encodePayload(guestPayload);
      const url = `${window.location.origin}${window.location.pathname}#/m/${hash}`;
      return { name: a.name, link: url };
    });
    
    const hostPayload = { p: '데모 파티', g: demoGuests, s: seed };
    const rHash = encodePayload(hostPayload);
    const rUrl = `${window.location.origin}${window.location.pathname}#/reveal/${rHash}`;
    
    setGenerated(guestLinks);
    setRevealLink(rUrl);
  };

  const copyAll = () => {
    if (!generated) return;
    const text = generated.map(g => `${g.name}: ${g.link}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-4 text-white min-h-screen bg-gray-900 max-w-md mx-auto">
      <div className="w-full text-center py-2 bg-gray-800 text-gray-300 text-sm font-medium rounded mb-4">
        파티를 설정하거나 데모를 시작하세요
      </div>
      <h1 className="text-2xl font-bold mb-4">미션나잇</h1>
      
      {!generated ? (
        <div className="flex flex-col gap-4">
          <button 
            onClick={handleDemo}
            className="w-full p-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-lg mb-2"
          >
            5분 데모로 체험하기
          </button>
          <div>
            <label className="block mb-1">파티 이름</label>
            <input 
              type="text" 
              className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white"
              value={partyName}
              onChange={e => setPartyName(e.target.value)}
              placeholder="예: 연말 파티"
            />
          </div>
          <div>
            <label className="block mb-1">참가자 이름 (쉼표나 줄바꿈으로 구분)</label>
            <textarea 
              className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white"
              rows={4}
              value={guestsInput}
              onChange={e => setGuestsInput(e.target.value)}
              placeholder="민서, 지호, 은우..."
            />
          </div>
          
          {guests.length > 0 && !canCreate && (
            <p className="text-red-400 text-sm">
              미션나잇은 혼자서는 시작할 수 없습니다. 임무는 서로 맞물려 있습니다
            </p>
          )}
          
          <button 
            onClick={handleCreate}
            disabled={!canCreate}
            className={`p-3 rounded font-bold ${canCreate ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
          >
            링크 생성하기
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold mb-2">게스트 링크</h2>
            <div className="flex flex-col gap-3">
              {generated.map((g, i) => (
                <div key={i} className="p-3 bg-gray-800 rounded flex justify-between items-center">
                  <div>
                    <div className="font-bold">{g.name}</div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigator.clipboard.writeText(g.link)}
                      className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
                    >
                      복사
                    </button>
                    <a 
                      href={g.link} 
                      target="_blank" 
                      rel="noreferrer"
                      className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-500 flex items-center"
                    >
                      열기
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={copyAll}
              className="mt-4 w-full p-2 bg-gray-700 rounded hover:bg-gray-600"
            >
              전체 복사하기
            </button>
          </div>

          <div className="p-4 bg-blue-900 rounded border border-blue-700">
            <h2 className="text-lg font-bold mb-2">호스트용 결과 확인 링크</h2>
            <p className="text-sm text-blue-200 mb-3">
              파티가 끝나면 아래 링크에서 결과를 확인하세요. 이 링크는 호스트만 보관해야 합니다.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => navigator.clipboard.writeText(revealLink)}
                className="flex-1 p-2 bg-blue-700 rounded text-sm hover:bg-blue-600 font-bold"
              >
                결과 링크 복사
              </button>
              <Link 
                to={revealLink.substring(revealLink.indexOf('#'))}
                className="flex-1 p-2 bg-blue-600 rounded text-sm hover:bg-blue-500 font-bold text-center"
              >
                결과 화면 가기
              </Link>
            </div>
          </div>
          
          <button 
            onClick={() => setGenerated(null)}
            className="text-gray-400 text-sm underline"
          >
            다시 만들기
          </button>
        </div>
      )}
    </div>
  );
}
