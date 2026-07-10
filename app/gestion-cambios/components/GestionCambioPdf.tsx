import { Document, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import type { GestionCambio } from "./types";
import { estadoLabels, getEffectiveEstado, roleLabels } from "./workflow";

type GestionCambioPdfDocumentProps = {
  registro: GestionCambio;
  assetBaseUrl: string;
};

type GestionCambioPdfEmpresa = Extract<GestionCambio["empresa"], "Dromos" | "Incominería">;

export function canDownloadGestionCambioPdf(registro: GestionCambio) {
  return (
    isGestionCambioPdfEmpresa(registro.empresa) &&
    (registro.estado === "APROBADO" ||
      registro.estado === "CERRADO" ||
      registro.estado === "RECHAZADO_LIDER" ||
      registro.estado === "RECHAZADO_APROBADOR")
  );
}

export async function downloadGestionCambioPdf(registro: GestionCambio, assetBaseUrl: string) {
  if (!isGestionCambioPdfEmpresa(registro.empresa)) {
    window.alert("El PDF de Gestión de Cambios solo está configurado para Dromos e Incominería.");
    return;
  }

  if (!canDownloadGestionCambioPdf(registro)) {
    window.alert("El PDF solo se puede exportar cuando el registro esté completamente aprobado, cerrado o rechazado.");
    return;
  }

  const blob = await pdf(<GestionCambioPdfDocument registro={registro} assetBaseUrl={assetBaseUrl} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${registro.codigo}-gestion-cambio.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

const companyPdfConfig: Record<
  GestionCambioPdfEmpresa,
  {
    color: string;
    softColor: string;
    code: string;
    logoSrc: string;
  }
> = {
  Dromos: {
    color: "#dc2626",
    softColor: "#fff1f2",
    code: "SGI-F023",
    logoSrc: "/dromos-logo.png",
  },
  Incominería: {
    color: "#08733b",
    softColor: "#edf8ef",
    code: "SIG-F006",
    logoSrc: "/inco-logo.png",
  },
};

function isGestionCambioPdfEmpresa(empresa: GestionCambio["empresa"]): empresa is GestionCambioPdfEmpresa {
  return empresa === "Dromos" || empresa === "Incominería";
}

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#d7e0ec",
    borderRadius: 8,
    minHeight: 42,
    overflow: "hidden",
  },
  logoBox: {
    width: "22%",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: "#d7e0ec",
  },
  logoImage: {
    width: 112,
    height: 28,
    objectFit: "contain",
  },
  titleBox: {
    width: "60%",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: "#d7e0ec",
  },
  title: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  subtitle: {
    marginTop: 4,
    color: "#475569",
    fontSize: 8,
    textTransform: "uppercase",
  },
  metaBox: {
    width: "18%",
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "row",
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  metaLabel: {
    width: 52,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  metaValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    textAlign: "center",
  },
  section: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    overflow: "hidden",
  },
  sectionTitle: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 6,
  },
  field: {
    width: "50%",
    padding: 5,
  },
  fieldFull: {
    width: "100%",
    padding: 5,
  },
  label: {
    color: "#64748b",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  value: {
    minHeight: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 3,
    padding: 5,
    lineHeight: 1.35,
  },
  table: {
    margin: 6,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headCell: {
    backgroundColor: "#f1f5f9",
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    textTransform: "uppercase",
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: "#cbd5e1",
  },
  cell: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    lineHeight: 1.35,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 28,
    right: 28,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    paddingTop: 5,
    color: "#64748b",
    fontSize: 7,
    textAlign: "right",
  },
});

function Field({ label, value, full = false }: { label: string; value?: string | number; full?: boolean }) {
  return (
    <View style={full ? styles.fieldFull : styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "Sin diligenciar"}</Text>
    </View>
  );
}

export function GestionCambioPdfDocument({ registro, assetBaseUrl }: GestionCambioPdfDocumentProps) {
  if (!isGestionCambioPdfEmpresa(registro.empresa)) {
    throw new Error("El PDF de Gestión de Cambios solo está configurado para Dromos e Incominería.");
  }

  const config = companyPdfConfig[registro.empresa];
  const estadoActual = getEffectiveEstado(registro);
  const logo = `${assetBaseUrl}${config.logoSrc}`;

  return (
    <Document title={`${registro.codigo} - Gestión de Cambio`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={logo} style={styles.logoImage} />
          </View>
          <View style={styles.titleBox}>
            <Text style={[styles.title, { color: config.color }]}>Gestión de Cambio</Text>
          </View>
          <View style={styles.metaBox}>
            <View style={[styles.metaRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.metaValue}>{config.code}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { backgroundColor: config.softColor, color: config.color }]}>Datos de la solicitud</Text>
          <View style={styles.grid}>
            <Field label="Empresa" value={registro.empresa} />
            <Field label="Código del registro" value={registro.codigo} />
            <Field label="Fecha de creación" value={registro.fecha} />
            <Field label="Proceso" value={registro.proceso} />
            <Field label="Líder del proceso" value={registro.liderProceso} />
            <Field label="Solicitante / creador" value={registro.creadorNombre ?? registro.creadorId} />
            <Field label="Estado actual" value={estadoLabels[estadoActual]} />
            <Field label="Responsable actual" value={registro.responsableActualNombre ?? roleLabels[registro.responsableActual]} />
            <Field label="Tipo de cambio" value={registro.tipoCambio} full />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { backgroundColor: config.softColor, color: config.color }]}>Análisis asociados al cambio</Text>
          <View style={styles.grid}>
            {Object.entries(registro.detalle.analisis).map(([key, value]) => (
              <Field key={key} label={key.replaceAll("-", " ")} value={value} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { backgroundColor: config.softColor, color: config.color }]}>Plan de implementación</Text>
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={[styles.headCell, { width: "50%" }]}>Actividad</Text>
              <Text style={[styles.headCell, { width: "32%" }]}>Responsable</Text>
              <Text style={[styles.headCell, { width: "18%", borderRightWidth: 0 }]}>Fecha</Text>
            </View>
            {registro.detalle.plan.map((plan) => (
              <View key={plan.id} style={styles.row}>
                <Text style={[styles.cell, { width: "50%" }]}>{plan.actividades}</Text>
                <Text style={[styles.cell, { width: "32%" }]}>{plan.responsable}</Text>
                <Text style={[styles.cell, { width: "18%", borderRightWidth: 0 }]}>{plan.fecha}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { backgroundColor: config.softColor, color: config.color }]}>Aprobaciones y cierre</Text>
          <View style={styles.grid}>
            {(registro.aprobaciones ?? []).map((item, index) => (
              <Field key={`${item.nombre}-${index}`} label={`${roleLabels[item.rolAprobador]} - ${item.aprobado === "SI" ? "Conforme" : "Rechazado"}`} value={`${item.nombre} | ${item.cargo} | ${item.fecha}. ${item.observaciones}`} full />
            ))}
            <Field label="Observaciones de Calidad" value={registro.validacionCalidad} full />
            <Field label="Resultado / cierre" value={registro.seguimiento ? `${registro.seguimiento.cambioEficaz} - ${registro.seguimiento.observaciones} ${registro.seguimiento.acciones}` : estadoLabels[estadoActual]} full />
          </View>
        </View>

        <Text style={styles.footer}>Documento generado desde ROCA. Código documental {config.code}. Registro {registro.codigo}.</Text>
      </Page>
    </Document>
  );
}
