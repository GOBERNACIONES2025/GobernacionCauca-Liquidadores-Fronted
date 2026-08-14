const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                text: "Documentación de Integración: Catálogos y Selectores en Cascada",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                text: "1. Resumen de la Integración",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                text: "Se completó la integración total de los selectores dinámicos para el formulario de Contribuyentes/Propietarios, consumiendo los endpoints de catálogos expuestos por el Backend en .NET y aplicando la lógica reactiva en cascada entre Departamentos y Municipios."
            }),
            new Paragraph({
                text: "2. Endpoints Conectados en el Frontend",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                text: "• GET /api/departamentos: Carga la lista completa de departamentos.",
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: "• GET /api/departamentos/{departamentoId}/ciudades: Consulta las ciudades/municipios correspondientes al departamento seleccionado.",
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: "• GET /api/catalogo/tipos-documento: Carga los tipos de documento activos (CC, NIT, CE, PA, etc.).",
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: "• GET /api/catalogo/naturalezas-juridicas: Carga las naturalezas jurídicas (Persona Natural, Persona Jurídica).",
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: "3. Comportamiento y Reglas de Negocio en la Interfaz",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                text: "• Carga Inicial: Al inicializar el formulario, se ejecutan las consultas a Departamentos, Tipos de Documento y Naturalezas Jurídicas en paralelo mediante forkJoin en el Facade.",
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: "• Selector de Municipios en Cascada: El combo de Municipios inicia vacío y deshabilitado (disabled). Al seleccionar un Departamento, se habilita inmediatamente y se consultan sus municipios específicos.",
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: "• Reseteo Seguro: Si se deselecciona o limpia el departamento, el selector de municipios se reinicia y se vuelve a deshabilitar.",
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: "• Modo Edición: Cuando se edita un contribuyente existente, se preseleccionan sus valores guardados, se habilita el municipio y se consultan las ciudades de su departamento.",
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: "4. Estructura del Payload Enviado (POST / PUT)",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                text: "Al enviar la información a POST /api/propietarios o PUT /api/propietarios/{id}, el formulario emite el payload normalizado:"
            }),
            new Paragraph({
                text: "{\n  \"tipoDocumentoId\": 1,\n  \"numeroDocumento\": \"1061789456\",\n  \"digitoVerificacion\": null,\n  \"naturalezaJuridicaId\": 1,\n  \"primerNombre\": \"Carlos\",\n  \"primerApellido\": \"Pérez\",\n  \"correoElectronico\": \"carlos@email.com\",\n  \"telefono\": \"3123456789\",\n  \"direccion\": \"Calle 5 # 10-20\",\n  \"departamentoId\": 19,\n  \"ciudadId\": 19001,\n  \"ciudad\": \"Popayán\",\n  \"activo\": true\n}"
            }),
            new Paragraph({
                text: "5. Archivos Modificados",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                text: "• src/app/core/services/base-api.service.ts (Normalización de rutas con prefijo /api)",
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: "• src/app/features/automotores/domain/models/contribuyente.model.ts (Tipos de Documento, Naturalezas, Departamentos y Ciudades)",
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: "• src/app/features/automotores/application/facades/contribuyentes.facade.ts (Gestión centralizada de catálogos y Signals reactivos)",
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: "• src/app/features/automotores/presentation/components/contribuyente-form/contribuyente-form.component.ts (Lógica de cascada y suscripción)",
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: "• src/app/features/automotores/presentation/components/contribuyente-form/contribuyente-form.html (Selectores estilizados y responsivos)",
                bullet: { level: 0 }
            })
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("Documentacion_Migracion_Contribuyentes.docx", buffer);
    console.log("Document updated successfully");
});
