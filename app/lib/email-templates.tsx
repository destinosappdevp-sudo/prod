interface ReservationEmailData {
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  hostName: string;
  hostEmail: string;
  hostPhone?: string;
  propertyTitle: string;
  propertyAddress: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: string;
  totalAmount: number;
  reservationId: string;
  amountUsd?: number;
  amountBs?: number;
  bcvRate?: number;
}

export function generateGuestConfirmationEmail(data: ReservationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reserva Confirmada - Destinos Venezuela</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">¡Reserva Confirmada!</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Tu aventura está a punto de comenzar</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Hola <strong>${data.guestName}</strong>,
              </p>
              <p style="margin: 0 0 30px 0; color: #666666; font-size: 15px; line-height: 1.6;">
                ¡Excelentes noticias! Tu reserva ha sido confirmada. Estamos emocionados de que elijas Destinos Venezuela para tu próxima estadía.
              </p>

              <!-- Property Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 15px 0; color: #333333; font-size: 20px; font-weight: 600;">${data.propertyTitle}</h2>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                      <strong>Dirección:</strong> ${data.propertyAddress}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                      <strong>Check-in:</strong> ${data.checkIn}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                      <strong>Check-out:</strong> ${data.checkOut}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                      <strong>Noches:</strong> ${data.nights}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                      <strong>Huéspedes:</strong> ${data.guests}
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 15px;">
                      <tr>
                        <td>
                          <p style="margin: 0 0 8px 0; color: #333333; font-size: 16px; font-weight: 600;">
                            <strong>Total USD:</strong> $${(data.amountUsd ?? data.totalAmount).toFixed(2)}
                          </p>
                          ${data.amountBs ? `<p style="margin: 0; color: #666666; font-size: 14px;">
                            <strong>Total Bs:</strong> Bs ${data.amountBs.toFixed(2)}
                          </p>` : ''}
                          ${data.bcvRate ? `<p style="margin: 8px 0 0 0; color: #999999; font-size: 12px;">
                            <strong>Tasa BCV del día:</strong> 1 USD = Bs ${data.bcvRate.toFixed(8)}
                          </p>` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Host Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px; font-weight: 600;">Información del Anfitrión</h3>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                      <strong>Nombre:</strong> ${data.hostName}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                      <strong>Email:</strong> <a href="mailto:${data.hostEmail}" style="color: #667eea; text-decoration: none;">${data.hostEmail}</a>
                    </p>
                    ${data.hostPhone ? `
                    <p style="margin: 0; color: #666666; font-size: 14px;">
                      <strong>Teléfono:</strong> ${data.hostPhone}
                    </p>
                    ` : ''}
                    <p style="margin: 15px 0 0 0; color: #666666; font-size: 13px; font-style: italic;">
                      Te recomendamos contactar a tu anfitrión antes del check-in para coordinar la llegada.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Reservation ID -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3cd; border-radius: 8px; padding: 15px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #856404; font-size: 13px;">
                      <strong>ID de Reserva:</strong> ${data.reservationId}
                    </p>
                    <p style="margin: 5px 0 0 0; color: #856404; font-size: 12px;">
                      Guarda este número para futuras consultas
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Tips -->
              <div style="border-left: 4px solid #667eea; padding-left: 15px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #333333; font-size: 16px; font-weight: 600;">Consejos para tu estadía</h3>
                <ul style="margin: 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 1.8;">
                  <li>Comunícate con tu anfitrión para coordinar el horario exacto de check-in</li>
                  <li>Verifica las reglas de la casa antes de llegar</li>
                  <li>Respeta los horarios de check-in y check-out</li>
                  <li>Reporta cualquier problema lo antes posible</li>
                </ul>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                ¿Necesitas ayuda? Contáctanos en <a href="mailto:support@destinosvenezuela.com" style="color: #667eea; text-decoration: none;">support@destinosvenezuela.com</a>
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} Destinos Venezuela. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function generateHostNotificationEmail(data: ReservationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Reserva - Destinos Venezuela</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Nueva Reserva!</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Tienes un nuevo huésped</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Hola <strong>${data.hostName}</strong>,
              </p>
                <p style="margin: 0 0 30px 0; color: #666666; font-size: 15px; line-height: 1.6;">
                ¡Buenas noticias! Has recibido una nueva reserva confirmada en tu propiedad. Aquí están los detalles:
              </p>

              <!-- Property Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 15px 0; color: #333333; font-size: 20px; font-weight: 600;">?? ${data.propertyTitle}</h2>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                      <strong>Check-in:</strong> ${data.checkIn}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                      <strong>Check-out:</strong> ${data.checkOut}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                      <strong>Noches:</strong> ${data.nights}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                      <strong>Huéspedes:</strong> ${data.guests}
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 15px;">
                      <tr>
                        <td>
                          <p style="margin: 0 0 8px 0; color: #28a745; font-size: 16px; font-weight: 600;">
                            <strong>Ingreso USD:</strong> $${(data.amountUsd ?? data.totalAmount).toFixed(2)}
                          </p>
                          ${data.amountBs ? `<p style="margin: 0; color: #666666; font-size: 14px;">
                            <strong>Ingreso Bs:</strong> Bs ${data.amountBs.toFixed(2)}
                          </p>` : ''}
                          ${data.bcvRate ? `<p style="margin: 8px 0 0 0; color: #999999; font-size: 12px;">
                            <strong>Tasa BCV del día:</strong> 1 USD = Bs ${data.bcvRate.toFixed(8)}
                          </p>` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Guest Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px; font-weight: 600;">Información del Huésped</h3>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                      <strong>Nombre:</strong> ${data.guestName}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                      <strong>Email:</strong> <a href="mailto:${data.guestEmail}" style="color: #f5576c; text-decoration: none;">${data.guestEmail}</a>
                    </p>
                    ${data.guestPhone ? `
                    <p style="margin: 0; color: #666666; font-size: 14px;">
                      <strong>Teléfono:</strong> ${data.guestPhone}
                    </p>
                    ` : ''}
                    <p style="margin: 15px 0 0 0; color: #666666; font-size: 13px; font-style: italic;">
                      Te recomendamos contactar a tu huésped antes del check-in para dar la bienvenida y coordinar la llegada.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Reservation ID -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #d1ecf1; border-radius: 8px; padding: 15px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #0c5460; font-size: 13px;">
                      <strong>ID de Reserva:</strong> ${data.reservationId}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Action Items -->
              <div style="border-left: 4px solid #f5576c; padding-left: 15px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #333333; font-size: 16px; font-weight: 600;">Próximos pasos</h3>
                <ul style="margin: 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 1.8;">
                  <li>Prepara la propiedad para recibir a tu huésped</li>
                  <li>Contacta al huésped para coordinar la llegada</li>
                  <li>Verifica que todos los servicios funcionen correctamente</li>
                  <li>Asegúrate de tener las llaves/códigos de acceso listos</li>
                  <li>Deja instrucciones claras sobre el uso de electrodomésticos</li>
                </ul>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                ¿Preguntas? Contáctanos en <a href="mailto:host-support@destinosvenezuela.com" style="color: #f5576c; text-decoration: none;">host-support@destinosvenezuela.com</a>
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} Destinos Venezuela. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

interface WelcomeEmailData {
  email: string;
  displayName?: string;
}

export function generateWelcomeEmail(data: WelcomeEmailData): string {
  const safeName = (data.displayName || "nuevo usuario").replace(/[<>]/g, "");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a Destinos Venezuela</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9 0%,#2563eb 100%);padding:36px 28px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">Bienvenido a Destinos Venezuela</h1>
              <p style="margin:10px 0 0 0;color:#eaf6ff;font-size:15px;">Tu cuenta ya esta lista para empezar a reservar</p>
            </td>
          </tr>
          <tr>
            <td style="padding:34px 30px;">
                <p style="margin:0 0 16px 0;color:#1f2937;font-size:16px;line-height:1.6;">
                Hola <strong>${safeName}</strong>,
              </p>
              <p style="margin:0 0 16px 0;color:#4b5563;font-size:15px;line-height:1.7;">
                Gracias por registrarte en Destinos Venezuela. Ya puedes explorar alojamientos, guardar favoritos y gestionar tus reservas desde tu panel.
              </p>
                <p style="margin:0 0 22px 0;color:#4b5563;font-size:15px;line-height:1.7;">
                Tu cuenta fue creada con el correo: <strong>${data.email}</strong>
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 16px;">
                <tr>
                  <td>
                    <p style="margin:0;color:#1e3a8a;font-size:13px;line-height:1.6;">
                      Si no fuiste tu, responde este correo para que nuestro equipo te ayude de inmediato.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 30px;background:#f8fafc;border-top:1px solid #e5e7eb;">
                <p style="margin:0;color:#6b7280;font-size:12px;text-align:center;">
                © ${new Date().getFullYear()} Destinos Venezuela. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ─── Confirmación de cuenta ──────────────────────────────────────────────────

interface EmailConfirmationData {
  email: string;
  displayName?: string;
  confirmationUrl: string;
}

export function generateEmailConfirmationEmail(data: EmailConfirmationData): string {
  const safeName = (data.displayName || "nuevo usuario").replace(/[<>]/g, "");
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirma tu cuenta - Destinos Venezuela</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#f59e0b 0%,#b45309 100%);padding:36px 28px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Confirma tu cuenta</h1>
              <p style="margin:10px 0 0 0;color:#fef3c7;font-size:15px;">Un solo clic y ya estarás adentro</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:34px 30px;">
              <p style="margin:0 0 14px 0;color:#1f2937;font-size:16px;line-height:1.6;">
                Hola <strong>${safeName}</strong>,
              </p>
              <p style="margin:0 0 22px 0;color:#4b5563;font-size:15px;line-height:1.7;">
                Gracias por registrarte en <strong>Destinos Venezuela</strong>. Para activar tu cuenta haz clic en el botón de abajo:
              </p>
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${data.confirmationUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#b45309 100%);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:16px;letter-spacing:0.01em;">
                      Confirmar mi cuenta
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 10px 0;color:#6b7280;font-size:13px;line-height:1.6;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin:0 0 22px 0;word-break:break-all;">
                <a href="${data.confirmationUrl}" style="color:#b45309;font-size:12px;">${data.confirmationUrl}</a>
              </p>
              <!-- Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 16px;">
                <tr>
                  <td>
                    <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">
                      Este enlace expira en <strong>24 horas</strong>. Si no creaste esta cuenta, ignora este correo.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 30px;background:#f8fafc;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#6b7280;font-size:12px;text-align:center;">
                © ${new Date().getFullYear()} Destinos Venezuela. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ─── Restablecimiento de contraseña ─────────────────────────────────────────

interface PasswordResetEmailData {
  email: string;
  resetLink: string;
}

export function generatePasswordResetEmail(data: PasswordResetEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperar Contraseña - Destinos Venezuela</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Recuperar Contraseña</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Te ayudamos a restablecer tu acceso</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Hola,
              </p>
                <p style="margin: 0 0 30px 0; color: #666666; font-size: 15px; line-height: 1.6;">
                Recibimos una solicitud para cambiar la contraseña asociada a esta cuenta. Si fuiste tú, haz clic en el botón de abajo para crear una nueva contraseña segura.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${data.resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Cambiar contrase�a
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #1e3a8a; font-size: 13px; line-height: 1.6;">
                      <strong>El enlace expira en:</strong> 24 horas<br>
                      <strong>Esta solicitud fue para:</strong> ${data.email}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-left: 4px solid #667eea; padding-left: 15px; margin-bottom: 20px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 10px 0; color: #333333; font-size: 16px; font-weight: 600;">Seguridad</h3>
                    <p style="margin: 0 0 8px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                      Si no solicitaste cambiar tu contraseña, puedes ignorar este correo. Tu cuenta permanece segura.
                    </p>
                    <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                      Nunca compartas tu contraseña con nadie y sospecha de correos sospechosos.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                ¿Necesitas ayuda? Contáctanos en <a href="mailto:support@Destinos Venezuela.com" style="color: #667eea; text-decoration: none;">support@Destinos Venezuela.com</a>
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} Destinos Venezuela. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}



