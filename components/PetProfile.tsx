const PET_NAME = "Mocha";

export default function PetProfile() {
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-rose-300 bg-rose-50 text-3xl">
        🐱
      </div>
      <div>
        <div className="text-lg font-semibold text-stone-800">{PET_NAME}</div>
        <div className="text-xs text-stone-400">今天也要健康長大喔！</div>
      </div>
    </div>
  );
}
