import { BrowserRouter, Routes, Route } from 'react-router';
import Chat from '@/components/Chat';
import Home from '@/components/Home';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chats/:id" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}
