import { render } from 'preact';
import { useState } from 'preact/hooks';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Bun + Preact 프로젝트</h1>
      <p>현재 카운트: {count}</p>
      <button onClick={() => setCount(count + 1)}>증가</button>
    </div>
  );
}

// 브라우저 환경에 렌더링 (HTML에 id가 'app'인 엘리먼트가 있다고 가정)
const appElement = document.getElementById('app');
if (appElement) {
  render(<App />, appElement);
}