import LoginPage from '../LoginPage';

export default function LoginPageExample() {
  return (
    <LoginPage 
      onLogin={(role, username) => console.log('Logged in:', role, username)} 
    />
  );
}
