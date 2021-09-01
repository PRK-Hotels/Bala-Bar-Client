import React from 'react';

import './Login.global.css';

const Login: React.FC<LoginProps> = ({ onSubmit }: LoginProps) => {
  return (
    <div className="Login-Container">
      <input
        type="password"
        maxLength={6}
        onChange={(e) => onSubmit(e.target.value)}
      />
    </div>
  );
};

type LoginProps = {
  onSubmit: (a: string) => void;
};

export default Login;
