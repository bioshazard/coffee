import { useSearchParams, useNavigate } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import { Store } from '../hooks/useStore';

export default function ShareTarget() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const store = useContext(Store);

  useEffect(() => {
    if(!store?.boards) return;
    const data = {
      title: searchParams.get('title'),
      text: searchParams.get('text'),
      url: searchParams.get('url')
    };
    const payload = encodeURIComponent(JSON.stringify(data));
    const boardId = store.boards[0]?.id;
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
