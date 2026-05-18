export default function AdminManualPage() {
	return (
		<div className="prose max-w-none">
			<h1>Manual de Administrador</h1>

			<p>
				Bienvenido al panel de administración de Destinos. Aquí encontrarás una guía rápida para las
				funciones principales:
			</p>

			<h2>1. Gestión de Usuarios</h2>
			<ul>
				<li>Visualiza, edita y elimina usuarios.</li>
				<li>Asigna roles y verifica información.</li>
			</ul>
			<img src="/screenshot/logo.png" alt="Captura de gestión de usuarios" />

			<h2>2. Propiedades</h2>
			<ul>
				<li>Añade, edita o elimina propiedades.</li>
				<li>Gestiona fotos, descripciones y disponibilidad.</li>
			</ul>
			<img src="/screenshot/logo.png" alt="Captura de gestión de propiedades" />

			<h2>3. Pagos y Reservas</h2>
			<ul>
				<li>Revisa pagos pendientes y confirmados.</li>
				<li>Accede al historial de reservas.</li>
			</ul>
			<img src="/screenshot/logo.png" alt="Captura de pagos y reservas" />

			<h2>4. Publicidad (Banners)</h2>
			<ul>
				<li>Crea y administra banners publicitarios.</li>
				<li>Activa o desactiva campañas.</li>
			</ul>
			<img src="/screenshot/logo.png" alt="Captura de banners" />

			<hr />
			<p className="text-sm">*Las imágenes serán reemplazadas por capturas reales.*</p>
		</div>
	);
}
