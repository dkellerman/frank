import { BrowserRouter, Routes, Route } from 'react-router';
import Chat from '@/components/Chat';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Chat />} />
        <Route path="/chats/:id" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}
