export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accesos: {
        Row: {
          folio: string
          id: string
          puerta: string
          ts: string
          turno_id: string
        }
        Insert: {
          folio: string
          id?: string
          puerta: string
          ts?: string
          turno_id: string
        }
        Update: {
          folio?: string
          id?: string
          puerta?: string
          ts?: string
          turno_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accesos_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
      }
      actas: {
        Row: {
          asamblea_id: string
          folio: string
          id: string
          levantada_en: string
          pdf_path: string | null
        }
        Insert: {
          asamblea_id: string
          folio: string
          id?: string
          levantada_en?: string
          pdf_path?: string | null
        }
        Update: {
          asamblea_id?: string
          folio?: string
          id?: string
          levantada_en?: string
          pdf_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actas_asamblea_id_fkey"
            columns: ["asamblea_id"]
            isOneToOne: true
            referencedRelation: "asambleas"
            referencedColumns: ["id"]
          },
        ]
      }
      asambleas: {
        Row: {
          citacion: Database["public"]["Enums"]["citacion_t"]
          condominio_id: string
          convocante: Database["public"]["Enums"]["rol_t"]
          creada_en: string
          derechos_habiles: number | null
          fecha: string
          folio: string
          hora: string
          id: string
          lugar: string
          quorum_requerido: number
          tipo: Database["public"]["Enums"]["asamblea_tipo_t"]
          validada: boolean
        }
        Insert: {
          citacion: Database["public"]["Enums"]["citacion_t"]
          condominio_id: string
          convocante: Database["public"]["Enums"]["rol_t"]
          creada_en?: string
          derechos_habiles?: number | null
          fecha: string
          folio: string
          hora: string
          id?: string
          lugar: string
          quorum_requerido: number
          tipo: Database["public"]["Enums"]["asamblea_tipo_t"]
          validada?: boolean
        }
        Update: {
          citacion?: Database["public"]["Enums"]["citacion_t"]
          condominio_id?: string
          convocante?: Database["public"]["Enums"]["rol_t"]
          creada_en?: string
          derechos_habiles?: number | null
          fecha?: string
          folio?: string
          hora?: string
          id?: string
          lugar?: string
          quorum_requerido?: number
          tipo?: Database["public"]["Enums"]["asamblea_tipo_t"]
          validada?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "asambleas_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      bitacora: {
        Row: {
          accion: string
          actor: string
          condominio_id: string
          cu: string | null
          detalle: string | null
          id: number
          ts: string
        }
        Insert: {
          accion: string
          actor: string
          condominio_id: string
          cu?: string | null
          detalle?: string | null
          id?: never
          ts?: string
        }
        Update: {
          accion?: string
          actor?: string
          condominio_id?: string
          cu?: string | null
          detalle?: string | null
          id?: never
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "bitacora_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos: {
        Row: {
          anulado: boolean
          condominio_id: string
          emision_id: string | null
          id: string
          monto: number
          origen: string
          pagado: boolean
          periodo: string
          unidad_id: string
          vence: string
        }
        Insert: {
          anulado?: boolean
          condominio_id: string
          emision_id?: string | null
          id?: string
          monto: number
          origen?: string
          pagado?: boolean
          periodo: string
          unidad_id: string
          vence: string
        }
        Update: {
          anulado?: boolean
          condominio_id?: string
          emision_id?: string | null
          id?: string
          monto?: number
          origen?: string
          pagado?: boolean
          periodo?: string
          unidad_id?: string
          vence?: string
        }
        Relationships: [
          {
            foreignKeyName: "cargos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargos_emision_id_fkey"
            columns: ["emision_id"]
            isOneToOne: false
            referencedRelation: "emisiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargos_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargos_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "v_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      cobranza_hitos: {
        Row: {
          cobranza_id: string
          id: string
          texto: string
          ts: string
        }
        Insert: {
          cobranza_id: string
          id?: string
          texto: string
          ts?: string
        }
        Update: {
          cobranza_id?: string
          id?: string
          texto?: string
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "cobranza_hitos_cobranza_id_fkey"
            columns: ["cobranza_id"]
            isOneToOne: false
            referencedRelation: "cobranzas"
            referencedColumns: ["id"]
          },
        ]
      }
      cobranzas: {
        Row: {
          abierta_en: string
          condominio_id: string
          estado: Database["public"]["Enums"]["cobranza_estado_t"]
          folio: string
          id: string
          monto: number
          motivo: string | null
          unidad_id: string
        }
        Insert: {
          abierta_en?: string
          condominio_id: string
          estado?: Database["public"]["Enums"]["cobranza_estado_t"]
          folio: string
          id?: string
          monto: number
          motivo?: string | null
          unidad_id: string
        }
        Update: {
          abierta_en?: string
          condominio_id?: string
          estado?: Database["public"]["Enums"]["cobranza_estado_t"]
          folio?: string
          id?: string
          monto?: number
          motivo?: string | null
          unidad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cobranzas_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobranzas_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobranzas_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "v_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      condominios: {
        Row: {
          aporte_reserva: number
          created_at: string
          dia_vencimiento: number
          direccion: string | null
          id: string
          nombre: string
          tolerancia_cuotas: number
        }
        Insert: {
          aporte_reserva?: number
          created_at?: string
          dia_vencimiento?: number
          direccion?: string | null
          id?: string
          nombre: string
          tolerancia_cuotas?: number
        }
        Update: {
          aporte_reserva?: number
          created_at?: string
          dia_vencimiento?: number
          direccion?: string | null
          id?: string
          nombre?: string
          tolerancia_cuotas?: number
        }
        Relationships: []
      }
      convenio_cuotas: {
        Row: {
          convenio_id: string
          monto: number
          n: number
          pagada: boolean
          vence: string
        }
        Insert: {
          convenio_id: string
          monto: number
          n: number
          pagada?: boolean
          vence: string
        }
        Update: {
          convenio_id?: string
          monto?: number
          n?: number
          pagada?: boolean
          vence?: string
        }
        Relationships: [
          {
            foreignKeyName: "convenio_cuotas_convenio_id_fkey"
            columns: ["convenio_id"]
            isOneToOne: false
            referencedRelation: "convenios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convenio_cuotas_convenio_id_fkey"
            columns: ["convenio_id"]
            isOneToOne: false
            referencedRelation: "v_unidades"
            referencedColumns: ["convenio_id"]
          },
        ]
      }
      convenios: {
        Row: {
          caducado: boolean
          caducado_en: string | null
          comprobante_path: string | null
          condominio_id: string
          cuotas: number
          deuda: number
          folio: string
          id: string
          origen: string
          pie: number
          suscrito: string
          unidad_id: string
          valor_cuota: number
        }
        Insert: {
          caducado?: boolean
          caducado_en?: string | null
          comprobante_path?: string | null
          condominio_id: string
          cuotas: number
          deuda: number
          folio: string
          id?: string
          origen: string
          pie?: number
          suscrito?: string
          unidad_id: string
          valor_cuota: number
        }
        Update: {
          caducado?: boolean
          caducado_en?: string | null
          comprobante_path?: string | null
          condominio_id?: string
          cuotas?: number
          deuda?: number
          folio?: string
          id?: string
          origen?: string
          pie?: number
          suscrito?: string
          unidad_id?: string
          valor_cuota?: number
        }
        Relationships: [
          {
            foreignKeyName: "convenios_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convenios_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convenios_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "v_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          condominio_id: string
          fecha: string
          id: string
          nota: string | null
          publico: boolean
          storage_path: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          condominio_id: string
          fecha?: string
          id?: string
          nota?: string | null
          publico?: boolean
          storage_path?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          condominio_id?: string
          fecha?: string
          id?: string
          nota?: string | null
          publico?: boolean
          storage_path?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      emision_partidas: {
        Row: {
          concepto: string
          emision_id: string
          id: string
          monto: number
        }
        Insert: {
          concepto: string
          emision_id: string
          id?: string
          monto: number
        }
        Update: {
          concepto?: string
          emision_id?: string
          id?: string
          monto?: number
        }
        Relationships: [
          {
            foreignKeyName: "emision_partidas_emision_id_fkey"
            columns: ["emision_id"]
            isOneToOne: false
            referencedRelation: "emisiones"
            referencedColumns: ["id"]
          },
        ]
      }
      emisiones: {
        Row: {
          condominio_id: string
          emitida_en: string
          folio: string
          id: string
          periodo: string
          total: number
        }
        Insert: {
          condominio_id: string
          emitida_en?: string
          folio: string
          id?: string
          periodo: string
          total: number
        }
        Update: {
          condominio_id?: string
          emitida_en?: string
          folio?: string
          id?: string
          periodo?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "emisiones_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      encomiendas: {
        Row: {
          detalle: string | null
          entregada: string | null
          folio: string
          id: string
          recibida: string
          remitente: string | null
          retirada_por: string | null
          tipo: string
          turno_id: string
          unidad_id: string
        }
        Insert: {
          detalle?: string | null
          entregada?: string | null
          folio: string
          id?: string
          recibida?: string
          remitente?: string | null
          retirada_por?: string | null
          tipo: string
          turno_id: string
          unidad_id: string
        }
        Update: {
          detalle?: string | null
          entregada?: string | null
          folio?: string
          id?: string
          recibida?: string
          remitente?: string | null
          retirada_por?: string | null
          tipo?: string
          turno_id?: string
          unidad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "encomiendas_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encomiendas_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encomiendas_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "v_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      espacios: {
        Row: {
          condominio_id: string
          id: string
          nombre: string
        }
        Insert: {
          condominio_id: string
          id?: string
          nombre: string
        }
        Update: {
          condominio_id?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "espacios_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      fondo_movimientos: {
        Row: {
          autoriza: string
          concepto: string
          condominio_id: string
          emision_id: string | null
          folio: string
          id: string
          monto: number
          tipo: Database["public"]["Enums"]["fondo_tipo_t"]
          ts: string
        }
        Insert: {
          autoriza: string
          concepto: string
          condominio_id: string
          emision_id?: string | null
          folio: string
          id?: string
          monto: number
          tipo: Database["public"]["Enums"]["fondo_tipo_t"]
          ts?: string
        }
        Update: {
          autoriza?: string
          concepto?: string
          condominio_id?: string
          emision_id?: string | null
          folio?: string
          id?: string
          monto?: number
          tipo?: Database["public"]["Enums"]["fondo_tipo_t"]
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "fondo_movimientos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fondo_movimientos_emision_id_fkey"
            columns: ["emision_id"]
            isOneToOne: false
            referencedRelation: "emisiones"
            referencedColumns: ["id"]
          },
        ]
      }
      mantenciones: {
        Row: {
          condominio_id: string
          critico: boolean
          equipo: string
          id: string
          periodicidad: Database["public"]["Enums"]["periodicidad_t"]
          proveedor: string | null
          proxima: string
          ultima: string | null
        }
        Insert: {
          condominio_id: string
          critico?: boolean
          equipo: string
          id?: string
          periodicidad: Database["public"]["Enums"]["periodicidad_t"]
          proveedor?: string | null
          proxima: string
          ultima?: string | null
        }
        Update: {
          condominio_id?: string
          critico?: boolean
          equipo?: string
          id?: string
          periodicidad?: Database["public"]["Enums"]["periodicidad_t"]
          proveedor?: string | null
          proxima?: string
          ultima?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mantenciones_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      multas: {
        Row: {
          apelacion: string | null
          condominio_id: string
          cursada_por: string | null
          detalle: string | null
          estado: Database["public"]["Enums"]["multa_estado_t"]
          folio: string
          id: string
          infraccion: string
          monto: number
          resolucion: string | null
          ts: string
          unidad_id: string
        }
        Insert: {
          apelacion?: string | null
          condominio_id: string
          cursada_por?: string | null
          detalle?: string | null
          estado?: Database["public"]["Enums"]["multa_estado_t"]
          folio: string
          id?: string
          infraccion: string
          monto: number
          resolucion?: string | null
          ts?: string
          unidad_id: string
        }
        Update: {
          apelacion?: string | null
          condominio_id?: string
          cursada_por?: string | null
          detalle?: string | null
          estado?: Database["public"]["Enums"]["multa_estado_t"]
          folio?: string
          id?: string
          infraccion?: string
          monto?: number
          resolucion?: string | null
          ts?: string
          unidad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "multas_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multas_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multas_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "v_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          condominio_id: string
          cuerpo: string | null
          destino_rol: Database["public"]["Enums"]["rol_t"] | null
          destino_unidad: string | null
          id: string
          leida: boolean
          titulo: string
          ts: string
        }
        Insert: {
          condominio_id: string
          cuerpo?: string | null
          destino_rol?: Database["public"]["Enums"]["rol_t"] | null
          destino_unidad?: string | null
          id?: string
          leida?: boolean
          titulo: string
          ts?: string
        }
        Update: {
          condominio_id?: string
          cuerpo?: string | null
          destino_rol?: Database["public"]["Enums"]["rol_t"] | null
          destino_unidad?: string | null
          id?: string
          leida?: boolean
          titulo?: string
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_destino_unidad_fkey"
            columns: ["destino_unidad"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_destino_unidad_fkey"
            columns: ["destino_unidad"]
            isOneToOne: false
            referencedRelation: "v_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      novedades: {
        Row: {
          folio: string
          id: string
          texto: string
          tipo: string
          ts: string
          turno_id: string
        }
        Insert: {
          folio: string
          id?: string
          texto: string
          tipo: string
          ts?: string
          turno_id: string
        }
        Update: {
          folio?: string
          id?: string
          texto?: string
          tipo?: string
          ts?: string
          turno_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "novedades_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
      }
      pago_imputaciones: {
        Row: {
          cargo_id: string
          monto: number
          pago_id: string
        }
        Insert: {
          cargo_id: string
          monto: number
          pago_id: string
        }
        Update: {
          cargo_id?: string
          monto?: number
          pago_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pago_imputaciones_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pago_imputaciones_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "pagos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          condominio_id: string
          folio: string
          id: string
          medio: string
          monto: number
          registrado_en: string
          registrado_por: string | null
          unidad_id: string
        }
        Insert: {
          condominio_id: string
          folio: string
          id?: string
          medio: string
          monto: number
          registrado_en?: string
          registrado_por?: string | null
          unidad_id: string
        }
        Update: {
          condominio_id?: string
          folio?: string
          id?: string
          medio?: string
          monto?: number
          registrado_en?: string
          registrado_por?: string | null
          unidad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "v_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          condominio_id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_t"]
          unidad_id: string | null
          user_id: string
        }
        Insert: {
          condominio_id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_t"]
          unidad_id?: string | null
          user_id: string
        }
        Update: {
          condominio_id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_t"]
          unidad_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfiles_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfiles_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "v_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      presupuesto_partidas: {
        Row: {
          anual: number
          concepto: string
          id: string
          presupuesto_id: string
        }
        Insert: {
          anual: number
          concepto: string
          id?: string
          presupuesto_id: string
        }
        Update: {
          anual?: number
          concepto?: string
          id?: string
          presupuesto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presupuesto_partidas_presupuesto_id_fkey"
            columns: ["presupuesto_id"]
            isOneToOne: false
            referencedRelation: "presupuestos"
            referencedColumns: ["id"]
          },
        ]
      }
      presupuestos: {
        Row: {
          anio: number
          aprobado_en: string | null
          condominio_id: string
          folio: string | null
          id: string
        }
        Insert: {
          anio: number
          aprobado_en?: string | null
          condominio_id: string
          folio?: string | null
          id?: string
        }
        Update: {
          anio?: number
          aprobado_en?: string | null
          condominio_id?: string
          folio?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presupuestos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      propuestas_convenio: {
        Row: {
          condominio_id: string
          creada_en: string
          cuotas: number
          deuda: number
          folio: string
          id: string
          motivo: string | null
          origen: Database["public"]["Enums"]["propuesta_origen_t"]
          pie: number
          unidad_id: string
          valor_cuota: number
        }
        Insert: {
          condominio_id: string
          creada_en?: string
          cuotas: number
          deuda: number
          folio: string
          id?: string
          motivo?: string | null
          origen: Database["public"]["Enums"]["propuesta_origen_t"]
          pie?: number
          unidad_id: string
          valor_cuota: number
        }
        Update: {
          condominio_id?: string
          creada_en?: string
          cuotas?: number
          deuda?: number
          folio?: string
          id?: string
          motivo?: string | null
          origen?: Database["public"]["Enums"]["propuesta_origen_t"]
          pie?: number
          unidad_id?: string
          valor_cuota?: number
        }
        Relationships: [
          {
            foreignKeyName: "propuestas_convenio_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propuestas_convenio_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propuestas_convenio_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "v_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      rendiciones: {
        Row: {
          cerrada_en: string
          condominio_id: string
          egresos: number
          folio: string
          id: string
          ingresos: number
          notificada: boolean
          periodo: string
        }
        Insert: {
          cerrada_en?: string
          condominio_id: string
          egresos: number
          folio: string
          id?: string
          ingresos: number
          notificada?: boolean
          periodo: string
        }
        Update: {
          cerrada_en?: string
          condominio_id?: string
          egresos?: number
          folio?: string
          id?: string
          ingresos?: number
          notificada?: boolean
          periodo?: string
        }
        Relationships: [
          {
            foreignKeyName: "rendiciones_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas: {
        Row: {
          bloque: string
          espacio_id: string
          fecha: string
          folio: string
          id: string
          ts: string
          unidad_id: string
        }
        Insert: {
          bloque: string
          espacio_id: string
          fecha: string
          folio: string
          id?: string
          ts?: string
          unidad_id: string
        }
        Update: {
          bloque?: string
          espacio_id?: string
          fecha?: string
          folio?: string
          id?: string
          ts?: string
          unidad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservas_espacio_id_fkey"
            columns: ["espacio_id"]
            isOneToOne: false
            referencedRelation: "espacios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "v_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      trabajadores: {
        Row: {
          activo: boolean
          cargo: string
          condominio_id: string
          contrato: string | null
          desde: string
          id: string
          jornada: string | null
          nombre: string
          rut: string | null
          sueldo: number | null
          telefono: string | null
          user_id: string | null
        }
        Insert: {
          activo?: boolean
          cargo: string
          condominio_id: string
          contrato?: string | null
          desde?: string
          id?: string
          jornada?: string | null
          nombre: string
          rut?: string | null
          sueldo?: number | null
          telefono?: string | null
          user_id?: string | null
        }
        Update: {
          activo?: boolean
          cargo?: string
          condominio_id?: string
          contrato?: string | null
          desde?: string
          id?: string
          jornada?: string | null
          nombre?: string
          rut?: string | null
          sueldo?: number | null
          telefono?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trabajadores_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos: {
        Row: {
          condominio_id: string
          fin: string | null
          folio: string
          id: string
          inicio: string
          trabajador_id: string
        }
        Insert: {
          condominio_id: string
          fin?: string | null
          folio: string
          id?: string
          inicio?: string
          trabajador_id: string
        }
        Update: {
          condominio_id?: string
          fin?: string | null
          folio?: string
          id?: string
          inicio?: string
          trabajador_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turnos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_trabajador_id_fkey"
            columns: ["trabajador_id"]
            isOneToOne: false
            referencedRelation: "trabajadores"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          codigo: string
          condominio_id: string
          email: string | null
          id: string
          m2: number
          ocupante: Database["public"]["Enums"]["ocupante_t"]
          ocupante_nombre: string | null
          propietario: string
        }
        Insert: {
          codigo: string
          condominio_id: string
          email?: string | null
          id?: string
          m2: number
          ocupante?: Database["public"]["Enums"]["ocupante_t"]
          ocupante_nombre?: string | null
          propietario: string
        }
        Update: {
          codigo?: string
          condominio_id?: string
          email?: string | null
          id?: string
          m2?: number
          ocupante?: Database["public"]["Enums"]["ocupante_t"]
          ocupante_nombre?: string | null
          propietario?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidades_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      vehiculos: {
        Row: {
          detalle: string | null
          entrada: string
          folio: string
          id: string
          patente: string
          salida: string | null
          tipo: string
          turno_id: string
          unidad_id: string | null
        }
        Insert: {
          detalle?: string | null
          entrada?: string
          folio: string
          id?: string
          patente: string
          salida?: string | null
          tipo: string
          turno_id: string
          unidad_id?: string | null
        }
        Update: {
          detalle?: string | null
          entrada?: string
          folio?: string
          id?: string
          patente?: string
          salida?: string | null
          tipo?: string
          turno_id?: string
          unidad_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehiculos_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehiculos_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehiculos_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "v_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      visitas: {
        Row: {
          folio: string
          id: string
          ingreso: string
          motivo: string
          nombre: string
          patente: string | null
          rut: string | null
          salida: string | null
          turno_id: string
          unidad_id: string | null
        }
        Insert: {
          folio: string
          id?: string
          ingreso?: string
          motivo: string
          nombre: string
          patente?: string | null
          rut?: string | null
          salida?: string | null
          turno_id: string
          unidad_id?: string | null
        }
        Update: {
          folio?: string
          id?: string
          ingreso?: string
          motivo?: string
          nombre?: string
          patente?: string | null
          rut?: string | null
          salida?: string | null
          turno_id?: string
          unidad_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitas_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "v_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      votaciones: {
        Row: {
          abierta: boolean
          asamblea_id: string | null
          cierre: string
          condominio_id: string
          creada_en: string
          creada_por: Database["public"]["Enums"]["rol_t"]
          descripcion: string | null
          folio: string
          id: string
          quorum: Database["public"]["Enums"]["quorum_t"]
          resultado: string | null
          titulo: string
        }
        Insert: {
          abierta?: boolean
          asamblea_id?: string | null
          cierre: string
          condominio_id: string
          creada_en?: string
          creada_por: Database["public"]["Enums"]["rol_t"]
          descripcion?: string | null
          folio: string
          id?: string
          quorum?: Database["public"]["Enums"]["quorum_t"]
          resultado?: string | null
          titulo: string
        }
        Update: {
          abierta?: boolean
          asamblea_id?: string | null
          cierre?: string
          condominio_id?: string
          creada_en?: string
          creada_por?: Database["public"]["Enums"]["rol_t"]
          descripcion?: string | null
          folio?: string
          id?: string
          quorum?: Database["public"]["Enums"]["quorum_t"]
          resultado?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "votaciones_asamblea_id_fkey"
            columns: ["asamblea_id"]
            isOneToOne: false
            referencedRelation: "asambleas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votaciones_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      votos: {
        Row: {
          emitido_en: string
          sentido: Database["public"]["Enums"]["voto_t"]
          unidad_id: string
          votacion_id: string
        }
        Insert: {
          emitido_en?: string
          sentido: Database["public"]["Enums"]["voto_t"]
          unidad_id: string
          votacion_id: string
        }
        Update: {
          emitido_en?: string
          sentido?: Database["public"]["Enums"]["voto_t"]
          unidad_id?: string
          votacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votos_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votos_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "v_unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votos_votacion_id_fkey"
            columns: ["votacion_id"]
            isOneToOne: false
            referencedRelation: "votaciones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_fondo_saldo: {
        Row: {
          aportes: number | null
          condominio_id: string | null
          giros: number | null
          saldo: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fondo_movimientos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      v_unidades: {
        Row: {
          cargos_mora: number | null
          codigo: string | null
          condominio_id: string | null
          convenio_id: string | null
          derechos: number | null
          deuda: number | null
          email: string | null
          habil: boolean | null
          id: string | null
          m2: number | null
          mora: number | null
          ocupante: Database["public"]["Enums"]["ocupante_t"] | null
          ocupante_nombre: string | null
          propietario: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unidades_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      asamblea_validar: { Args: { a: string }; Returns: undefined }
      celebrar_convenio: {
        Args: {
          c: string
          p_cuotas: number
          p_origen: string
          p_pie: number
          u: string
        }
        Returns: string
      }
      cobranza_abrir: {
        Args: { c: string; p_motivo: string; u: string }
        Returns: string
      }
      convenios_revisar_vencidos: { Args: never; Returns: number }
      emitir_gastos: {
        Args: { c: string; p_partidas: Json; p_periodo: string }
        Returns: string
      }
      emitir_voto: {
        Args: { s: Database["public"]["Enums"]["voto_t"]; v: string }
        Returns: undefined
      }
      es_gestion: { Args: { c: string }; Returns: boolean }
      es_miembro: { Args: { c: string }; Returns: boolean }
      fondo_girar: {
        Args: {
          c: string
          p_autoriza: string
          p_concepto: string
          p_monto: number
        }
        Returns: string
      }
      mantencion_certificar: {
        Args: { m: string; p_fecha?: string }
        Returns: undefined
      }
      mi_unidad: { Args: { c: string }; Returns: string }
      multa_resolver: {
        Args: {
          m: string
          p_estado: Database["public"]["Enums"]["multa_estado_t"]
          p_resolucion: string
        }
        Returns: undefined
      }
      registrar_pago: {
        Args: { c: string; p_medio: string; p_monto: number; u: string }
        Returns: string
      }
      rol_en: {
        Args: { c: string }
        Returns: Database["public"]["Enums"]["rol_t"]
      }
      votacion_cerrar: { Args: { v: string }; Returns: string }
    }
    Enums: {
      asamblea_tipo_t: "Ordinaria" | "Extraordinaria"
      citacion_t: "Primera" | "Segunda"
      cobranza_estado_t: "Prejudicial" | "Judicial" | "Cerrada"
      fondo_tipo_t: "Aporte" | "Giro"
      multa_estado_t: "cursada" | "apelada" | "confirmada" | "anulada"
      ocupante_t:
        | "Propietario residente"
        | "Arrendatario"
        | "Propietario no residente"
      periodicidad_t: "Mensual" | "Trimestral" | "Semestral" | "Anual"
      propuesta_origen_t: "Comité" | "Copropietario"
      quorum_t: "Mayoría simple" | "Mayoría absoluta de los derechos"
      rol_t: "administrador" | "comite" | "copropietario" | "conserje"
      voto_t: "favor" | "contra" | "abst"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      asamblea_tipo_t: ["Ordinaria", "Extraordinaria"],
      citacion_t: ["Primera", "Segunda"],
      cobranza_estado_t: ["Prejudicial", "Judicial", "Cerrada"],
      fondo_tipo_t: ["Aporte", "Giro"],
      multa_estado_t: ["cursada", "apelada", "confirmada", "anulada"],
      ocupante_t: [
        "Propietario residente",
        "Arrendatario",
        "Propietario no residente",
      ],
      periodicidad_t: ["Mensual", "Trimestral", "Semestral", "Anual"],
      propuesta_origen_t: ["Comité", "Copropietario"],
      quorum_t: ["Mayoría simple", "Mayoría absoluta de los derechos"],
      rol_t: ["administrador", "comite", "copropietario", "conserje"],
      voto_t: ["favor", "contra", "abst"],
    },
  },
} as const
