import AuthDetail from "./_components/auth-detail";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full">
      <AuthDetail />
      <div className="flex w-1/2 flex-col items-center justify-center">{children}</div>
    </div>
  );
}
