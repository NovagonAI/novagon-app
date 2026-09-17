export function AnnouncementBar() {
  return (
    <div className="bg-ocean-600 text-white text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between">
        <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap">
          {['AI-Powered', 'Validasi BPOM', 'Prediksi Real-time', 'Akurasi 92,4%', 'Enkripsi Data'].map((item) => (
            <span key={item} className="flex items-center gap-1.5 shrink-0">
              <span className="w-1 h-1 rounded-full bg-ocean-200" />
              {item}
            </span>
          ))}
        </div>
        <a href="/dashboard" className="shrink-0 ml-4 underline underline-offset-2 hover:text-ocean-100">
          Coba Dashboard →
        </a>
      </div>
    </div>
  )
}
