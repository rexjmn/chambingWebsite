import React from 'react';
import { Link } from 'react-router-dom';

const TerminosCondiciones = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAFB',
      fontFamily: 'Inter, system-ui, sans-serif',
      colorScheme: 'light',
    }}>
      {/* Header */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #E5E7EB',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          textDecoration: 'none',
        }}>
          <div style={{
            width: 34,
            height: 34,
            background: '#233DFF',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1rem',
            color: '#fff',
          }}>C</div>
          <span style={{
            fontWeight: 800,
            fontSize: '1.125rem',
            color: '#111827',
            letterSpacing: '-0.3px',
          }}>Chambing</span>
        </Link>
      </header>

      {/* Content */}
      <main style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '2.5rem 1.5rem 4rem',
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 800,
          color: '#111827',
          letterSpacing: '-0.5px',
          marginBottom: '0.5rem',
        }}>Términos y Condiciones de Uso</h1>

        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          Última actualización: 12 de mayo de 2026
        </p>
        <p style={{ color: '#6B7280', fontSize: '0.8125rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
          Este documento resume las reglas de uso de la plataforma. No sustituye asesoría legal,
          fiscal o laboral personalizada; ante dudas específicas consulte a un profesional.
        </p>

        <Section title="1. ¿Qué es Chambing?">
          Chambing es una plataforma digital que conecta personas que buscan servicios con
          personas que ofrecen sus habilidades y trabajo. Chambing actúa únicamente como
          intermediario tecnológico y <strong>NO es empleador, agencia de empleo, ni parte
          contratante</strong> en ninguna transacción entre clientes y trabajadores.
        </Section>

        <Section title="2. Aceptación de los Términos">
          Al crear una cuenta en Chambing, usted acepta estos Términos y Condiciones en su
          totalidad. Si no está de acuerdo con alguna parte, debe abstenerse de usar la
          plataforma.
        </Section>

        <Section title="3. Responsabilidad Limitada">
          <p>Chambing <strong>NO se hace responsable</strong> por:</p>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', lineHeight: 2 }}>
            <li>Robos, pérdidas de objetos o daños a propiedad ocurridos durante la prestación de servicios</li>
            <li>Disputas económicas entre clientes y trabajadores</li>
            <li>Incumplimientos de acuerdos entre usuarios</li>
            <li>La calidad, resultado o satisfacción del servicio prestado</li>
            <li>Pagos acordados entre las partes (Chambing no interviene en transacciones económicas entre usuarios en esta etapa)</li>
          </ul>
        </Section>

        <Section title="4. Contratos entre Usuarios">
          Chambing pone a disposición contratos simplificados que pueden ser descargados por
          ambas partes. Estos documentos sirven como evidencia formal en caso de disputas ante
          autoridades competentes. El uso de contratos es altamente recomendado pero no
          obligatorio.
        </Section>

        <Section title="5. Verificación de Identidad (PIN)">
          Para confirmar la asistencia del trabajador al domicilio del cliente, Chambing
          utiliza un sistema de PIN único. Este mecanismo ayuda a verificar que la persona
          que se presenta es la misma registrada en la plataforma. Sin embargo, Chambing no
          garantiza la identidad absoluta de los usuarios y recomienda siempre verificar
          identificación personal adicional.
        </Section>

        <Section title="6. Conducta y Tolerancia Cero">
          <p>Chambing mantiene una política de cero tolerancia hacia:</p>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', lineHeight: 2 }}>
            <li>Cualquier tipo de agresión física o verbal entre usuarios</li>
            <li>Comportamiento intimidatorio, acoso o discriminación</li>
            <li>Uso de la plataforma para actividades ilegales o no autorizadas</li>
          </ul>
          <p style={{ marginTop: '0.75rem' }}>
            Las cuentas que incurran en estas conductas podrán ser suspendidas o eliminadas
            permanentemente sin previo aviso.
          </p>
        </Section>

        <Section title="7. Sistema de Reseñas">
          Chambing cuenta con un sistema de calificaciones y reseñas para mantener la calidad
          y confianza en la plataforma. Los usuarios se comprometen a dejar reseñas honestas
          y verídicas. Las reseñas falsas o malintencionadas son causa de suspensión de
          cuenta.
        </Section>

        <Section title="8. Pagos">
          En la etapa actual, los pagos se realizan directamente entre el cliente y el
          trabajador. Chambing <strong>NO interviene, garantiza ni media</strong> en ninguna
          transacción económica. Se recomienda acordar el precio antes de iniciar el servicio
          y efectuar el pago al finalizar el mismo.
        </Section>

        <Section title="9. Uso Adecuado de la Plataforma">
          <p>Los usuarios se comprometen a:</p>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', lineHeight: 2 }}>
            <li>Proporcionar información verídica al registrarse y al publicar ofertas o datos del servicio</li>
            <li>Indicar con la mayor precisión posible el lugar de prestación del servicio cuando lo soliciten las funciones de la plataforma</li>
            <li>Utilizar la plataforma únicamente para los fines para los que fue creada</li>
            <li>Respetar la privacidad de otros usuarios</li>
            <li>No compartir datos de contacto de terceros sin consentimiento</li>
          </ul>
        </Section>

        <Section title="10. Modificaciones">
          Chambing se reserva el derecho de modificar estos términos en cualquier momento.
          Los cambios relevantes serán comunicados por medios razonables (por ejemplo, aviso en
          la plataforma o actualización de la fecha al inicio de este documento). El uso
          continuado después de la publicación de los cambios implica la aceptación de la
          versión vigente. Le recomendamos revisar esta página periódicamente.
        </Section>

        <Section title="11. Ley aplicable y jurisdicción">
          Estos Términos y Condiciones se rigen por las leyes de la República de El Salvador.
          Salvo normas imperativas de otro ordenamiento que resulten aplicables al consumidor
          en su país de residencia habitual, las controversias que enfrenten al usuario con el
          operador de la plataforma Chambing respecto del uso de la herramienta digital se
          someterán a los tribunales competentes de El Salvador. Las disputas contractuales o
          civiles entre clientes y trabajadores son en principio ajenas a Chambing, sin
          perjuicio de lo previsto en estos términos (por ejemplo, suspensión de cuenta o
          colaboración con autoridades cuando la ley lo exija).
        </Section>

        <Section title="12. Domicilio del servicio, coordenadas y geolocalización">
          La plataforma puede permitir indicar el lugar de prestación del servicio mediante
          texto y, de forma opcional, coordenadas obtenidas del dispositivo del usuario o
          servicios de geocodificación de terceros. Esas coordenadas y direcciones generadas
          de forma automática son <strong>orientativas</strong> y pueden variar según el
          equipo, la red, la señal GPS o el proveedor externo. <strong>No se exige</strong>{' '}
          que las coordenadas correspondan a un país o territorio determinado. Clientes y
          trabajadores son responsables de acordar y verificar el lugar real del servicio,
          independientemente del país desde el que accedan a Chambing.
        </Section>

        <Section title="13. Datos personales y privacidad">
          El tratamiento de datos personales tiene como finalidad operar la cuenta, las
          ofertas, los contratos simplificados y las comunicaciones necesarias en la
          plataforma. Los usuarios deben proporcionar datos veraces y actualizarlos cuando
          cambien. Chambing podrá conservar información mientras sea necesario para prestar
          el servicio, mejorar la seguridad de la comunidad o cumplir obligaciones legales,
          conforme a los avisos o políticas de privacidad publicados en el sitio. El usuario
          puede solicitar rectificación o cese de tratamiento cuando corresponda según la ley
          aplicable y los canales indicados en la plataforma.
        </Section>

        <Section title="14. Enlaces y aplicaciones de terceros">
          Chambing puede ofrecer enlaces o abrir aplicaciones externas (por ejemplo, mapas o
          navegación). Esos servicios tienen sus propios términos y políticas de privacidad.
          Chambing no los controla y no se responsabiliza por su disponibilidad, exactitud ni
          contenido.
        </Section>

        <Section title="15. Edad y capacidad">
          Al registrarse, el usuario declara ser mayor de edad y tener capacidad legal para
          obligarse según las leyes que le resulten aplicables. Si se detectara uso por
          menores sin la debida autorización, las cuentas asociadas podrán ser cerradas.
        </Section>

        <div style={{
          marginTop: '2.5rem',
          padding: '1.25rem',
          background: '#F0F9FF',
          border: '1.5px solid #BAE6FD',
          borderRadius: 14,
          fontSize: '0.875rem',
          color: '#0369A1',
          lineHeight: 1.65,
        }}>
          <strong>¿Tienes dudas?</strong> Escríbenos a través de la plataforma. Estamos
          comprometidos con hacer de Chambing un espacio seguro y confiable para todos.
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link to="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#233DFF',
            fontWeight: 600,
            fontSize: '0.9375rem',
            textDecoration: 'none',
          }}>
            ← Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  );
};

const Section = ({ title, children }) => (
  <section style={{ marginBottom: '2rem' }}>
    <h2 style={{
      fontSize: '1.125rem',
      fontWeight: 700,
      color: '#1F2937',
      marginBottom: '0.625rem',
      paddingBottom: '0.5rem',
      borderBottom: '1px solid #E5E7EB',
    }}>{title}</h2>
    <div style={{
      fontSize: '0.9375rem',
      color: '#4B5563',
      lineHeight: 1.75,
    }}>{children}</div>
  </section>
);

export default TerminosCondiciones;
