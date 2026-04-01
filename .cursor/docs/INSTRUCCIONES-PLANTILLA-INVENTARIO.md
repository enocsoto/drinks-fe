# Plantilla de inventario de bebidas

La plantilla Excel se descarga desde la página de Inventario (botón "Descargar plantilla").

## Columnas requeridas

| Columna       | Obligatorio | Descripción                          | Valores válidos / Ejemplo                    |
|---------------|-------------|--------------------------------------|---------------------------------------------|
| nombre        | Sí          | Nombre del producto                  | Aguila Negra, Club Colombia, Coca-Cola      |
| precio        | Sí          | Precio en COP (número)               | 3200, 3500                                  |
| tipo          | Sí          | Tipo de bebida                       | ALCOHOLICA, GASEOSA, AGUA, JUGO, OTRO       |
| envase        | Sí          | Tipo de envase                       | LATA_350, BOTELLA_250, BOTELLA_330, BOTELLA_500, LITRO, LITRO_1_5, LITRO_2, LITRO_2_5, BOTELLA_375, LITRO_REFILL, OTRO |
| talla_envase  | No          | Descripción (ej. 350 ml)             | 350 ml, 1 L                                 |
| stock         | No          | Cantidad en inventario (default 0)    | 0, 50, 100                                  |
| imagen        | No          | Ruta de imagen                       | /beverages/aguila-negra-lata.png            |

## Comportamiento

- **Nuevas bebidas**: Si no existe una bebida con el mismo nombre + envase + talla, se crea.
- **Actualización**: Si ya existe, se actualizan stock, precio, tipo e imagen.
- **Errores**: Las filas con errores se reportan al finalizar la carga.
