import { useEffect, useState } from 'react';

export default function FakeScreen({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<string[][]>([]);

  useEffect(() => {
    // Generate fake Excel data
    const rows = 50;
    const cols = 20;
    const newData = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        if (i === 0) {
          row.push(`Header ${j + 1}`);
        } else {
          row.push(Math.random().toString(36).substring(2, 8).toUpperCase());
        }
      }
      newData.push(row);
    }
    setData(newData);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-auto font-sans text-xs">
      <div className="sticky top-0 bg-gray-100 border-b border-gray-300 flex items-center px-4 py-2 gap-4">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-gray-600 font-medium">Q3_Financial_Report_Final_v2.xlsx</div>
        <div className="flex-1"></div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 px-2">
          退出伪装 (Esc)
        </button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-gray-300 bg-gray-100 px-2 py-1 w-10 text-center text-gray-500"></th>
            {data[0]?.map((header, i) => (
              <th key={i} className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-normal text-gray-700">
                {String.fromCharCode(65 + i)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-300 bg-gray-100 px-2 py-1 text-center text-gray-500">
                {i + 1}
              </td>
              {row.map((cell, j) => (
                <td key={j} className="border border-gray-300 px-2 py-1 text-gray-800">
                  {i === 0 ? <span className="font-bold">{cell}</span> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
