// Empty-state dark reutilizável pras telas admin sem backend (DL-022 honesto).
export default function AdminEmptyScreen({
  title,
  heading,
  desc,
}: {
  title: string;
  heading: string;
  desc: string;
}) {
  return (
    <div>
      <header className="bg-[#0F1F22]/90 backdrop-blur border-b border-white/[0.06] px-6 py-4 sticky top-0 z-10">
        <h1 className="font-bold text-lg text-white">{title}</h1>
      </header>

      <div className="p-6 max-w-[1280px] mx-auto">
        <div className="rounded-md border border-white/[0.06] bg-[#1A2A2D] p-12 text-center">
          <h2 className="font-bold text-xl text-white mb-2">{heading}</h2>
          <p className="text-[14px] text-white/50 leading-relaxed max-w-md mx-auto">
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}
