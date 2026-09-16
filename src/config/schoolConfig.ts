/**
 * Central configuration for School Approval, Messages, and Registration Codes.
 * Edit these values directly in this file to customize the texts, contact names,
 * and default values for the entire application.
 */

export interface SchoolConfigType {
  schoolName: string;
  adminContactName: string;
  defaultSchoolCode: string;
  defaultAutoApproveWithSchoolCode: boolean;
  messages: {
    pendingTitle: string;
    pendingSubtitle: string;
    pendingDescription: (adminName: string) => string;
    schoolCodeSectionTitle: string;
    schoolCodeSectionDescription: string;
    schoolCodePlaceholder: string;
    schoolCodeButton: string;
    schoolCodeSuccess: string;
    schoolCodeError: string;
    schoolCodeDisabledNotice: string;
    waitingBadge: string;
    logoutButton: string;
  };
}

export const SCHOOL_CONFIG: SchoolConfigType = {
  // Name of the school
  schoolName: 'Elbio Fernández',

  // Name of the student / admin contact shown to new users
  // (e.g., "Pídele a Juan Manuel en el recreo...")
  adminContactName: 'Juan Manuel',

  // Default School Code for automatic approval (e.g., "El recreo FriendSearcher")
  // Can be rotated by the Admin dynamically in the database modal or changed here.
  defaultSchoolCode: 'El recreo FriendSearcher',

  // Flag: If true, entering the correct school code during or after registration
  // grants immediate approval without needing to wait in the queue.
  defaultAutoApproveWithSchoolCode: true,

  messages: {
    pendingTitle: 'Solicitud Escolar en Revisión',
    pendingSubtitle: 'Comunidad privada y segura de alumnos.',
    pendingDescription: (adminName: string) =>
      `¡Hola! Tu cuenta fue registrada exitosamente. Para cuidar la seguridad del colegio, pídele a ${adminName} o a un administrador en el recreo o en clase que apruebe tu cuenta.`,
    schoolCodeSectionTitle: '¿Tienes el código escolar?',
    schoolCodeSectionDescription:
      'Si tienes el código que se compartió en el colegio, ingrésalo aquí para activar tu cuenta de inmediato sin esperar.',
    schoolCodePlaceholder: 'Ej: El recreo FriendSearcher',
    schoolCodeButton: 'Activar Cuenta de Inmediato',
    schoolCodeSuccess: '¡Código escolar correcto! Tu cuenta fue aprobada automáticamente.',
    schoolCodeError: 'El código escolar ingresado no es correcto. Por favor verifica o espera la aprobación manual.',
    schoolCodeDisabledNotice: 'La auto-aprobación con código está desactivada. Por favor espera a que un administrador apruebe tu cuenta.',
    waitingBadge: 'En espera de aprobación del administrador...',
    logoutButton: 'Cerrar sesión / Salir',
  }
};
