import { useSearchParams, useNavigate } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import { Store } from '../hooks/useStore';

export default function ShareTarget() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const store = useContext(Store);

  useEffect(() => {
    if(!store?.boards) return;
    const fields = [
      ['Title', searchParams.get('title')],
      ['Text', searchParams.get('text')],
      ['URL', searchParams.get('url')]
    ];
    const cardContent = fields
      .filter(([, value]) => value)
      .map(([label, value]) => `> ${label}: ${value}`)
      .join('\n');
    const payload = encodeURIComponent(cardContent);
    const boardId = localStorage.getItem("lastBoard") ?? store.boards[0]?.id;
    if(boardId) {
      navigate(`/board/${boardId}?share=${payload}`);
    } else {
      navigate('/');
    }
  }, [store, searchParams, navigate]);

  return (
    <div className="text-center pt-32">Loading...</div>
  );
}
