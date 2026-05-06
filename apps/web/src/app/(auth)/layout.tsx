import AuthDetail from "./_components/AuthDetail";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full h-screen">
      <AuthDetail />
      <div className="w-1/2 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
