export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="container-page flex justify-center py-12 sm:py-20">
      <div className="index-card plain w-full max-w-md px-6 pb-7 sm:px-8">
        <div className="flex h-[58px] items-center">
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        <div className="pt-5">
          {subtitle && <p className="mb-5 text-sm text-soft">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
