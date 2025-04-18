import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface UnlockPasswordFieldProps {
  password: string;
  setPassword: (password: string) => void;
  onSubmit: () => void;
}

export function UnlockPasswordField({ 
  password, 
  setPassword, 
  onSubmit 
}: UnlockPasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center mb-2">
        <Lock className="w-5 h-5 text-gray-500 mr-2" />
        <label htmlFor="unlock-password" className="text-sm font-medium text-gray-700">
          Password
        </label>
      </div>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          id="unlock-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your password"
          autoFocus
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
