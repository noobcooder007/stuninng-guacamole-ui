export enum Permissions {
    // Iglesias
    VIEW_CHURCH = 'view:church',
    ADD_CHURCH = 'add:church',
    EDIT_CHURCH = 'edit:church',
    DELETE_CHURCH = 'delete:church',

    // Colectores
    VIEW_COLLECTOR = 'view:collector',
    ADD_COLLECTOR = 'add:collector',
    EDIT_COLLECTOR = 'edit:collector',
    DELETE_COLLECTOR = 'delete:collector',

    // Bienhechores
    VIEW_BENEFICIENT = 'view:beneficient',
    ADD_BENEFICIENT = 'add:beneficient',
    EDIT_BENEFICIENT = 'edit:beneficient',
    DELETE_BENEFICIENT = 'delete:beneficient',

    // Promesas de donación
    VIEW_PROMISE = 'view:promise-donation',
    ADD_PROMISE = 'add:promise-donation',
    EDIT_PROMISE = 'edit:promise-donation',
    DELETE_PROMISE = 'delete:promise-donation',

    // Recibos
    VIEW_INVOICE = 'view:invoice',
    ADD_INVOICE = 'add:invoice',
    EDIT_INVOICE = 'edit:invoice',
    PRINT_INVOICE = 'print:invoice',
    VOID_INVOICE = 'void:invoice',

    // Asignaciones
    VIEW_ASSIGNMENT = 'view:assignment',
    ADD_ASSIGNMENT = 'add:assignment',
    EDIT_ASSIGNMENT = 'edit:assignment',
    DELETE_ASSIGNMENT = 'delete:assignment',

    // Reportes
    VIEW_REPORT = 'view:report',

    // Procesos de colecta
    VIEW_PROCESS = 'view:process',
    RUN_PROCESS = 'run:process',

    // Liquidaciones
    VIEW_SETTLEMENT = 'view:settlement',
    EDIT_SETTLEMENT = 'edit:settlement',

    // Roles
    VIEW_ROLE = 'view:role',
    ADD_ROLE = 'add:role',
    EDIT_ROLE = 'edit:role',
    DELETE_ROLE = 'delete:role',
    MANAGE_ROLE = 'manage:role',

    // Permisos
    VIEW_PERMISSION = 'view:permission',
    ADD_PERMISSION = 'add:permission',
    DELETE_PERMISSION = 'delete:permission',

    // Usuarios
    VIEW_USER = 'view:user',
    EDIT_USER = 'edit:user',
}
