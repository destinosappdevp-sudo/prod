export default function MantenimientoPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-6">
      <div className="text-center max-w-lg space-y-6">
        {/* Logo Z */}
        <div className="flex justify-center">
          <div className="w-28 h-28 bg-orange-500/10 border-2 border-orange-500/40 rounded-full flex items-center justify-center">
            <span className="text-orange-500 font-black text-7xl leading-none select-none">D</span>
          </div>
        </div>

        {/* Brand */}
        <p className="text-2xl font-bold tracking-wide text-white">Destinos Venezuela</p>

        {/* Heading */}
        <h1 className="text-4xl font-extrabold">Estamos mejorando</h1>

        {/* Description */}
        <p className="text-gray-400 text-lg leading-relaxed">
          Nos encontramos realizando labores de mantenimiento para ofrecerte
          una mejor experiencia. Estaremos de vuelta muy pronto.
        </p>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-4 text-sm text-gray-500">
          ¿Eres administrador?{" "}
            <a href="/login" className="text-orange-500 hover:underline">
            Inicia sesión aquí
          </a>
        </div>
      </div>
    </div>
  );
}



